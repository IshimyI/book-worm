const express = require("express");
const { User, Book, Review, ReviewVote, ReviewComment, Follow, ReadingStatus, Notification, News } = require("../../db/models");
const { Sequelize } = require("sequelize");
const fs = require("fs");
const path = require("path");
const verifyAccessToken = require("../middlewares/verifyAccessToken");
const optionalAuth = require("../middlewares/optionalAuth");
const { uploadAvatar, AVATAR_DIR } = require("../middlewares/uploadAvatar");
const notify = require("../utils/notify");
const { containsProfanity } = require("../utils/moderation");
const { REPORT_HIDE_THRESHOLD, recomputeBookRating } = require("../utils/bookRating");
const cache = require("../utils/simpleCache");

const router = express.Router();

function mapReview(review, votedReviewIds = new Set()) {
  return {
    id: review.id,
    userName: review.User.name,
    userAvatarUrl: review.User.avatarUrl,
    user_rev: review.body,
    user_id: review.userId,
    user_raeting: review.user_rating,
    createdAt: review.createdAt,
    helpfulCount: review.helpfulCount,
    helpfulByMe: votedReviewIds.has(review.id),
    commentCount: review.commentCount,
  };
}

router.get("/news", async (req, res) => {
  try {
    const cached = cache.get("news");
    if (cached) return res.status(200).send(cached);

    const news = await News.findAll({ order: [["createdAt", "DESC"]] });
    cache.set("news", news, 60_000);
    res.status(200).send(news);
  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
});

router.get("/users/:id/profile", optionalAuth, async (req, res) => {
  const { id } = req.params;
  const { page = 1, pageSize = 10 } = req.query;
  try {
    const user = await User.findByPk(id, { attributes: ["id", "name", "createdAt", "avatarUrl", "bio"] });
    if (!user) {
      return res.status(404).send({ message: "Пользователь не найден" });
    }

    const limit = Math.min(Number(pageSize) || 10, 50);
    const offset = (Math.max(Number(page) || 1, 1) - 1) * limit;
    const where = { userId: id, reportCount: { [Sequelize.Op.lt]: REPORT_HIDE_THRESHOLD } };

    const { count: reviewCount, rows: reviews } = await Review.findAndCountAll({
      where,
      include: [{ model: Book, attributes: ["id", "title", "img"] }],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    const [followerCount, followingCount, isFollowedByMe, topGenreRows] = await Promise.all([
      Follow.count({ where: { followingId: id } }),
      Follow.count({ where: { followerId: id } }),
      req.userId ? Follow.findOne({ where: { followerId: req.userId, followingId: id } }).then(Boolean) : false,
      Review.findAll({
        where: { userId: id, reportCount: { [Sequelize.Op.lt]: REPORT_HIDE_THRESHOLD } },
        include: [{ model: Book, attributes: [] }],
        attributes: [[Sequelize.col("Book.genre"), "genre"], [Sequelize.fn("COUNT", Sequelize.col("Review.id")), "count"]],
        group: ["Book.genre"],
        order: [[Sequelize.literal("count"), "DESC"]],
        limit: 3,
        raw: true,
      }),
    ]);

    res.status(200).send({
      id: user.id,
      name: user.name,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      memberSince: user.createdAt,
      reviewCount,
      followerCount,
      followingCount,
      isFollowedByMe,
      topGenres: topGenreRows.map((r) => r.genre).filter(Boolean),
      page: Math.max(Number(page) || 1, 1),
      totalPages: Math.max(1, Math.ceil(reviewCount / limit)),
      reviews: reviews.map((r) => ({
        id: r.id,
        bookId: r.bookId,
        bookTitle: r.Book?.title,
        bookImg: r.Book?.img,
        body: r.body,
        rating: r.user_rating,
        createdAt: r.createdAt,
      })),
    });
  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
});

router.post("/users/:id/follow", verifyAccessToken, async (req, res) => {
  const targetId = Number(req.params.id);
  try {
    if (targetId === req.userId) {
      return res.status(400).json({ message: "Нельзя подписаться на самого себя" });
    }
    const target = await User.findByPk(targetId);
    if (!target) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    const existing = await Follow.findOne({ where: { followerId: req.userId, followingId: targetId } });
    let following;
    if (existing) {
      await existing.destroy();
      following = false;
    } else {
      await Follow.create({ followerId: req.userId, followingId: targetId });
      following = true;
      const follower = await User.findByPk(req.userId, { attributes: ["name"] });
      await notify({ userId: targetId, actorId: req.userId, type: "new_follower", data: { name: follower.name } });
    }
    const followerCount = await Follow.count({ where: { followingId: targetId } });
    res.status(200).json({ following, followerCount });
  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
});

const BIO_MAX_LENGTH = 500;

router.patch("/users/me/bio", verifyAccessToken, async (req, res) => {
  try {
    const bio = (req.body.bio || "").trim();
    if (bio.length > BIO_MAX_LENGTH) {
      return res.status(400).json({ message: `Слишком длинная биография (максимум ${BIO_MAX_LENGTH} символов)` });
    }
    if (containsProfanity(bio)) {
      return res.status(400).json({ message: "Биография содержит недопустимые слова" });
    }
    await User.update({ bio: bio || null }, { where: { id: req.userId } });
    res.status(200).json({ bio: bio || null });
  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
});

router.post(
  "/users/me/avatar",
  verifyAccessToken,
  (req, res, next) => {
    uploadAvatar.single("avatar")(req, res, (err) => {
      if (err) {
        const message = err.code === "LIMIT_FILE_SIZE" ? "Файл слишком большой (максимум 3 МБ)" : err.message;
        return res.status(400).json({ message });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Файл не выбран" });
      }
      const user = await User.findByPk(req.userId);
      const previousAvatarUrl = user.avatarUrl;

      user.avatarUrl = `/uploads/avatars/${req.file.filename}`;
      await user.save();

      if (previousAvatarUrl) {
        const previousPath = path.join(AVATAR_DIR, path.basename(previousAvatarUrl));
        fs.unlink(previousPath, () => {});
      }

      res.status(200).json({ avatarUrl: user.avatarUrl });
    } catch (error) {
      console.log(error);
      res.status(500).send(error.message);
    }
  }
);

function mapNotification(n) {
  let data = {};
  try {
    data = JSON.parse(n.data || "{}");
  } catch {
    data = {};
  }
  return {
    id: n.id,
    type: n.type,
    isRead: n.isRead,
    createdAt: n.createdAt,
    actorId: n.actorId,
    ...data,
  };
}

router.get("/notifications", verifyAccessToken, async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { userId: req.userId },
      order: [["createdAt", "DESC"]],
      limit: 30,
    });
    const unreadCount = await Notification.count({ where: { userId: req.userId, isRead: false } });
    res.status(200).json({ notifications: notifications.map(mapNotification), unreadCount });
  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
});

router.post("/notifications/:id/read", verifyAccessToken, async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id);
    if (!notification || notification.userId !== req.userId) {
      return res.status(404).json({ message: "Уведомление не найдено" });
    }
    notification.isRead = true;
    await notification.save();
    res.status(200).json({ message: "Отмечено как прочитанное" });
  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
});

router.post("/notifications/read-all", verifyAccessToken, async (req, res) => {
  try {
    await Notification.update({ isRead: true }, { where: { userId: req.userId, isRead: false } });
    res.status(200).json({ message: "Все уведомления отмечены как прочитанные" });
  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
});

router.get("/feed", verifyAccessToken, async (req, res) => {
  const { page = 1, pageSize = 15 } = req.query;
  try {
    const followedIds = (await Follow.findAll({ where: { followerId: req.userId }, attributes: ["followingId"] })).map(
      (f) => f.followingId
    );

    const limit = Math.min(Number(pageSize) || 15, 50);
    const offset = (Math.max(Number(page) || 1, 1) - 1) * limit;

    if (followedIds.length === 0) {
      return res.status(200).json({ reviews: [], page: 1, totalPages: 1, following: 0 });
    }

    const { count, rows: reviews } = await Review.findAndCountAll({
      where: { userId: followedIds, reportCount: { [Sequelize.Op.lt]: REPORT_HIDE_THRESHOLD } },
      include: [
        { model: Book, attributes: ["id", "title", "img"] },
        { model: User, attributes: ["id", "name", "avatarUrl"] },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    res.status(200).json({
      reviews: reviews.map((r) => ({
        id: r.id,
        userAvatarUrl: r.User.avatarUrl,
        bookId: r.bookId,
        bookTitle: r.Book?.title,
        bookImg: r.Book?.img,
        body: r.body,
        rating: r.user_rating,
        createdAt: r.createdAt,
        userId: r.User.id,
        userName: r.User.name,
      })),
      page: Math.max(Number(page) || 1, 1),
      totalPages: Math.max(1, Math.ceil(count / limit)),
      following: followedIds.length,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
});

const SORT_COLUMNS = {
  rating: "rating",
  reviews: "quantity_rate",
  year: "year",
  title: "title",
};

// Builds a prefix-matching tsquery ("гар:*" from "гар") so search-as-you-type
// still matches "Гарри" partway through typing — plainto_tsquery alone only
// matches complete lexemes. Strips tsquery operator characters so arbitrary
// user input can't produce invalid/malicious query syntax.
function buildPrefixTsQuery(search) {
  const words = search
    .trim()
    .split(/\s+/)
    .map((w) => w.replace(/[^\p{L}\p{N}]/gu, ""))
    .filter(Boolean);
  if (!words.length) return null;
  return words.map((w) => `${w}:*`).join(" & ");
}

router.get("/listAllBooks", async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      genre = "",
      author = "",
      year = "",
      minRating = "",
      search = "",
      sortBy = "rating",
      sortDir = "desc",
    } = req.query;

    const cacheKey = `listAllBooks:${JSON.stringify({ page, pageSize, genre, author, year, minRating, search, sortBy, sortDir })}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.status(200).json(cached);

    // `rating` is stored as a string (formatted with toFixed(2) wherever it's
    // written), so a plain gte/ORDER BY on it would be a lexicographic string
    // comparison, not a numeric one — cast it explicitly instead.
    const ratingAsFloat = Sequelize.cast(Sequelize.col("rating"), "FLOAT");

    const andConditions = [];
    if (genre) andConditions.push({ genre });
    if (author) andConditions.push({ author });
    if (year) andConditions.push({ year });
    if (minRating) andConditions.push(Sequelize.where(ratingAsFloat, { [Sequelize.Op.gte]: Number(minRating) }));
    const tsQuery = search ? buildPrefixTsQuery(search) : null;
    if (tsQuery) {
      andConditions.push(
        Sequelize.where(Sequelize.col("search_vector"), {
          [Sequelize.Op.match]: Sequelize.fn("to_tsquery", "russian", tsQuery),
        })
      );
    }
    const where = andConditions.length ? { [Sequelize.Op.and]: andConditions } : {};

    const orderColumn = SORT_COLUMNS[sortBy] || "rating";
    const orderDir = sortDir === "asc" ? "ASC" : "DESC";
    // orderColumn only ever comes from the SORT_COLUMNS whitelist above, so
    // interpolating it directly into the literal is safe.
    const orderSql =
      orderColumn === "rating"
        ? `CAST("rating" AS FLOAT) ${orderDir} NULLS LAST`
        : `"${orderColumn}" ${orderDir} NULLS LAST`;
    const limit = Math.min(Number(pageSize) || 10, 50);
    const offset = (Math.max(Number(page) || 1, 1) - 1) * limit;

    const [{ count: total }, books, facetRows] = await Promise.all([
      Book.count({ where }).then((count) => ({ count })),
      Book.findAll({
        where,
        order: [Sequelize.literal(orderSql)],
        limit,
        offset,
      }),
      Book.findAll({ attributes: ["genre", "author", "year"], raw: true }),
    ]);

    const payload = {
      books: books.map((book) => ({
        id: book.id,
        title: book.title,
        author: book.author,
        annotation: book.annotation,
        rating: book.rating,
        quantity_rate: book.quantity_rate,
        img: book.img,
        genre: book.genre,
        year: book.year,
      })),
      total,
      page: Math.max(Number(page) || 1, 1),
      totalPages: Math.max(1, Math.ceil(total / limit)),
      facets: {
        genres: [...new Set(facetRows.map((b) => b.genre))].sort(),
        authors: [...new Set(facetRows.map((b) => b.author))].sort(),
        years: [...new Set(facetRows.map((b) => b.year))].sort((a, b) => a - b),
      },
    };
    cache.set(cacheKey, payload, 30_000);
    res.status(200).json(payload);
  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
});

router.get("/book/:id", optionalAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const book = await Book.findByPk(id, {
      include: [
        {
          model: Review,
          where: { reportCount: { [Sequelize.Op.lt]: REPORT_HIDE_THRESHOLD } },
          required: false,
          attributes: ["id", "userId", "body", "user_rating", "createdAt", "helpfulCount", "commentCount"],
          include: [{ model: User, attributes: ["name", "avatarUrl"] }],
        },
      ],
    });

    if (!book) {
      return res.status(404).send({ message: "Книга не найдена" });
    }

    let votedReviewIds = new Set();
    let readingStatus = null;
    if (req.userId) {
      const [votes, statusRow] = await Promise.all([
        ReviewVote.findAll({
          where: { userId: req.userId, reviewId: book.Reviews.map((r) => r.id) },
          attributes: ["reviewId"],
        }),
        ReadingStatus.findOne({ where: { userId: req.userId, bookId: book.id }, attributes: ["status"] }),
      ]);
      votedReviewIds = new Set(votes.map((v) => v.reviewId));
      readingStatus = statusRow?.status || null;
    }

    res.status(200).send({
      id: book.id,
      title: book.title,
      author: book.author,
      annotation: book.annotation,
      rating: book.rating,
      quantity_rate: book.quantity_rate,
      img: book.img,
      genre: book.genre,
      year: book.year,
      readingStatus,
      reviews: book.Reviews.map((r) => mapReview(r, votedReviewIds)),
    });
  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
});

router.get("/book/:id/recommendations", async (req, res) => {
  const { id } = req.params;
  try {
    const book = await Book.findByPk(id, { attributes: ["id", "genre"] });
    if (!book) {
      return res.status(404).send({ message: "Книга не найдена" });
    }

    const recommendations = await Book.findAll({
      where: {
        genre: book.genre,
        id: { [Sequelize.Op.ne]: book.id },
      },
      order: [Sequelize.literal('CAST("rating" AS FLOAT) DESC NULLS LAST'), ["quantity_rate", "DESC"]],
      limit: 6,
    });

    res.status(200).send(recommendations);
  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
});

const READING_STATUSES = ["want_to_read", "reading", "read"];

router.post("/book/:id/reading-status", verifyAccessToken, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    if (status !== null && !READING_STATUSES.includes(status)) {
      return res.status(400).json({ message: "Недопустимый статус" });
    }
    const book = await Book.findByPk(id, { attributes: ["id"] });
    if (!book) {
      return res.status(404).json({ message: "Книга не найдена" });
    }

    if (status === null) {
      await ReadingStatus.destroy({ where: { userId: req.userId, bookId: id } });
      return res.status(200).json({ status: null });
    }

    const [row] = await ReadingStatus.findOrCreate({
      where: { userId: req.userId, bookId: id },
      defaults: { status },
    });
    if (row.status !== status) {
      row.status = status;
      await row.save();
    }
    res.status(200).json({ status: row.status });
  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
});

router.get("/reading-status", verifyAccessToken, async (req, res) => {
  try {
    const rows = await ReadingStatus.findAll({
      where: { userId: req.userId },
      include: [{ model: Book, attributes: ["id", "title", "author", "img"] }],
      order: [["updatedAt", "DESC"]],
    });

    const grouped = { want_to_read: [], reading: [], read: [] };
    for (const row of rows) {
      if (!row.Book) continue;
      grouped[row.status].push({
        id: row.Book.id,
        title: row.Book.title,
        author: row.Book.author,
        img: row.Book.img,
      });
    }
    res.status(200).json(grouped);
  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
});

router.get("/recommendations", verifyAccessToken, async (req, res) => {
  try {
    const reviewedBookIds = (await Review.findAll({ where: { userId: req.userId }, attributes: ["bookId"] })).map(
      (r) => r.bookId
    );

    const topGenreRow = reviewedBookIds.length
      ? await Book.findOne({
          where: { id: reviewedBookIds },
          attributes: ["genre", [Sequelize.fn("COUNT", Sequelize.col("genre")), "count"]],
          group: ["genre"],
          order: [[Sequelize.literal("count"), "DESC"]],
          raw: true,
        })
      : null;

    const where = {
      ...(reviewedBookIds.length ? { id: { [Sequelize.Op.notIn]: reviewedBookIds } } : {}),
      ...(topGenreRow ? { genre: topGenreRow.genre } : {}),
    };

    const recommendations = await Book.findAll({
      where,
      order: [Sequelize.literal('CAST("rating" AS FLOAT) DESC NULLS LAST'), ["quantity_rate", "DESC"]],
      limit: 8,
    });

    res.status(200).json({ books: recommendations, basedOnGenre: topGenreRow?.genre || null });
  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
});

router.get("/listUserBooks/:id", async (req, res) => {
  const { id } = req.params;
  try {
    if (!id) {
      return res
        .status(400)
        .send({ message: "Пользователя с таким id не обнаружено" });
    }

    const books = await Book.findAll({
      include: [
        {
          model: Review,
          where: { userId: id },
          required: true,
          attributes: ["id", "userId", "body", "user_rating", "createdAt"],
          include: [{ model: User, attributes: ["name"] }],
        },
      ],
    });

    const booksWithReviews = await Promise.all(
      books.map(async (book) => {
        const allReviews = await Review.findAll({
          where: { bookId: book.id, reportCount: { [Sequelize.Op.lt]: REPORT_HIDE_THRESHOLD } },
          include: [{ model: User, attributes: ["name", "avatarUrl"] }],
        });

        return {
          id: book.id,
          title: book.title,
          author: book.author,
          annotation: book.annotation,
          rating: book.rating,
          quantity_rate: book.quantity_rate,
          img: book.img,
          genre: book.genre,
          year: book.year,
          reviews: allReviews.map((r) => mapReview(r)),
        };
      })
    );

    res.status(200).send(booksWithReviews);
  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
});

router.post("/book/new", verifyAccessToken, async (req, res) => {
  const {
    user_id,
    title = "",
    author = "",
    genre = "",
    year = 1,
    annotation = "Описание отсутствует",
    img = "https://cdn1.ozone.ru/s3/multimedia-x/6597669093.jpg",
    body = "",
    user_rating = 1,
  } = req.body;

  if (!(title && author && user_id)) {
    return res.status(400).json({ message: "Поля должны быть заполнены" });
  }
  if (Number(user_id) !== req.userId) {
    return res.status(403).json({ message: "Нельзя оставлять рецензию от чужого имени" });
  }
  if (containsProfanity(body)) {
    return res.status(400).json({ message: "Текст рецензии содержит недопустимые слова" });
  }

  try {
    const [newBook] = await Book.findOrCreate({
      where: { title, author },
      defaults: { genre, year, annotation, img },
    });

    const [review, reviewCreated] = await Review.findOrCreate({
      where: { bookId: newBook.id, userId: user_id },
      defaults: { body, user_rating },
    });

    if (!reviewCreated) {
      review.body = body;
      review.user_rating = user_rating;
      await review.save();
    }

    await recomputeBookRating(newBook.id);

    res.status(200).json({ book: newBook, review });
  } catch (error) {
    console.error(error);
    res.status(500).send("Ошибка при добавлении книги или отзыва");
  }
});

router.delete("/review/:id", verifyAccessToken, async (req, res) => {
  const { id } = req.params;
  try {
    const review = await Review.findByPk(id);
    if (!review) {
      return res.status(404).json({ message: "Рецензия не найдена" });
    }
    if (review.userId !== req.userId) {
      return res.status(403).json({ message: "Можно удалять только свои рецензии" });
    }
    const { bookId } = review;
    await review.destroy();
    await recomputeBookRating(bookId);
    res.status(200).json({ message: "Рецензия удалена" });
  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
});

router.post("/review/:id/helpful", verifyAccessToken, async (req, res) => {
  const { id } = req.params;
  try {
    const review = await Review.findByPk(id);
    if (!review) {
      return res.status(404).json({ message: "Рецензия не найдена" });
    }
    if (review.userId === req.userId) {
      return res.status(400).json({ message: "Нельзя отметить полезной свою же рецензию" });
    }

    const existingVote = await ReviewVote.findOne({ where: { reviewId: id, userId: req.userId } });

    let helpful;
    if (existingVote) {
      await existingVote.destroy();
      review.helpfulCount = Math.max(0, review.helpfulCount - 1);
      helpful = false;
    } else {
      await ReviewVote.create({ reviewId: id, userId: req.userId });
      review.helpfulCount += 1;
      helpful = true;
    }
    await review.save();

    res.status(200).json({ helpful, helpfulCount: review.helpfulCount });
  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
});

function mapComment(c) {
  return {
    id: c.id,
    body: c.body,
    userId: c.userId,
    userName: c.User.name,
    createdAt: c.createdAt,
    parentCommentId: c.parentCommentId,
  };
}

router.get("/review/:id/comments", async (req, res) => {
  const { id } = req.params;
  try {
    const comments = await ReviewComment.findAll({
      where: { reviewId: id },
      order: [["createdAt", "ASC"]],
      include: [{ model: User, attributes: ["name"] }],
    });

    const topLevel = comments.filter((c) => !c.parentCommentId).map(mapComment);
    const repliesByParent = {};
    for (const c of comments) {
      if (!c.parentCommentId) continue;
      (repliesByParent[c.parentCommentId] ||= []).push(mapComment(c));
    }
    const nested = topLevel.map((c) => ({ ...c, replies: repliesByParent[c.id] || [] }));

    res.status(200).json(nested);
  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
});

router.post("/review/:id/comments", verifyAccessToken, async (req, res) => {
  const { id } = req.params;
  const body = (req.body.body || "").trim();
  const parentCommentId = req.body.parentCommentId ? Number(req.body.parentCommentId) : null;
  try {
    if (!body) {
      return res.status(400).json({ message: "Комментарий не может быть пустым" });
    }
    if (containsProfanity(body)) {
      return res.status(400).json({ message: "Комментарий содержит недопустимые слова" });
    }
    const review = await Review.findByPk(id);
    if (!review) {
      return res.status(404).json({ message: "Рецензия не найдена" });
    }

    let parentComment = null;
    if (parentCommentId) {
      parentComment = await ReviewComment.findByPk(parentCommentId);
      if (!parentComment || parentComment.reviewId !== Number(id)) {
        return res.status(404).json({ message: "Комментарий не найден" });
      }
      // Only one level of nesting — replying to a reply attaches to its
      // top-level parent instead of growing a deeper thread.
      if (parentComment.parentCommentId) {
        return res.status(400).json({ message: "Нельзя ответить на ответ" });
      }
    }

    const comment = await ReviewComment.create({ reviewId: id, userId: req.userId, body, parentCommentId });
    review.commentCount += 1;
    await review.save();

    const author = await User.findByPk(req.userId, { attributes: ["name"] });
    const book = await Book.findByPk(review.bookId, { attributes: ["title"] });

    if (parentComment) {
      await notify({
        userId: parentComment.userId,
        actorId: req.userId,
        type: "comment_reply",
        data: { name: author.name, bookId: review.bookId, bookTitle: book?.title },
      });
    } else {
      await notify({
        userId: review.userId,
        actorId: req.userId,
        type: "review_comment",
        data: { name: author.name, bookId: review.bookId, bookTitle: book?.title },
      });
    }

    res.status(200).json({
      id: comment.id,
      body: comment.body,
      userId: comment.userId,
      userName: author.name,
      createdAt: comment.createdAt,
      parentCommentId: comment.parentCommentId,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
});

router.delete("/review/:reviewId/comments/:commentId", verifyAccessToken, async (req, res) => {
  const { reviewId, commentId } = req.params;
  try {
    const comment = await ReviewComment.findByPk(commentId);
    if (!comment || comment.reviewId !== Number(reviewId)) {
      return res.status(404).json({ message: "Комментарий не найден" });
    }
    if (comment.userId !== req.userId) {
      return res.status(403).json({ message: "Можно удалять только свои комментарии" });
    }
    // Replies cascade-delete at the DB level when their parent goes — count
    // them so commentCount doesn't drift out of sync with what's left.
    const replyCount = await ReviewComment.count({ where: { parentCommentId: commentId } });
    await comment.destroy();
    const review = await Review.findByPk(reviewId);
    if (review) {
      review.commentCount = Math.max(0, review.commentCount - 1 - replyCount);
      await review.save();
    }
    res.status(200).json({ message: "Комментарий удалён" });
  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
});

router.post("/review/:id/report", verifyAccessToken, async (req, res) => {
  const { id } = req.params;
  try {
    const review = await Review.findByPk(id);
    if (!review) {
      return res.status(404).json({ message: "Рецензия не найдена" });
    }
    review.reportCount += 1;
    await review.save();
    if (review.reportCount >= REPORT_HIDE_THRESHOLD) {
      await recomputeBookRating(review.bookId);
    }
    res.status(200).json({ message: "Спасибо, жалоба принята" });
  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
});

router.get("/favourites/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findByPk(id);
    if (user) {
      const books = user.favourites ? user.favourites.split(" ") : [];

      const result = await Promise.all(
        books.map(async (bookId) => await Book.findByPk(bookId))
      );

      res.status(200).send(result);
    } else {
      res.status(404).send("Пользователь не найден.");
    }
  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
});

router.post("/updateFavourites/:id", verifyAccessToken, async (req, res) => {
  const { id } = req.params;
  const { bookId } = req.body;

  if (Number(id) !== req.userId) {
    return res.status(403).json({ message: "Нельзя менять избранное другого пользователя" });
  }

  try {
    const user = await User.findByPk(id);

    if (!user) {
      return res
        .status(400)
        .send({ message: "Пользователь с таким id не найден" });
    }

    let favouriteBooks = user.favourites ? user.favourites.split(" ") : [];

    if (favouriteBooks.includes(bookId + "")) {
      favouriteBooks = favouriteBooks.filter((book_id) => book_id !== bookId + "");
    } else {
      favouriteBooks.push(bookId + "");
    }
    user.favourites = favouriteBooks.join(" ");
    await user.save();
    res.status(200).send(user);
  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
});

module.exports = router;
