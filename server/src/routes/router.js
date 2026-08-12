const express = require("express");
const { User, Book, Review, News } = require("../../db/models");
const { Sequelize } = require("sequelize");
const verifyAccessToken = require("../middlewares/verifyAccessToken");
const { containsProfanity } = require("../utils/moderation");
const { REPORT_HIDE_THRESHOLD, recomputeBookRating } = require("../utils/bookRating");

const router = express.Router();

function mapReview(review) {
  return {
    id: review.id,
    userName: review.User.name,
    user_rev: review.body,
    user_id: review.userId,
    user_raeting: review.user_rating,
    createdAt: review.createdAt,
  };
}

router.get("/news", async (req, res) => {
  try {
    const news = await News.findAll({ order: [["createdAt", "DESC"]] });
    res.status(200).send(news);
  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
});

router.get("/users", async (req, res) => {
  try {
    res.status(200).send(await User.findAll({}));
  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
});

router.get("/users/:id/profile", async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findByPk(id, { attributes: ["id", "name", "createdAt"] });
    if (!user) {
      return res.status(404).send({ message: "Пользователь не найден" });
    }

    const reviews = await Review.findAll({
      where: { userId: id, reportCount: { [Sequelize.Op.lt]: REPORT_HIDE_THRESHOLD } },
      include: [{ model: Book, attributes: ["id", "title", "img"] }],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).send({
      id: user.id,
      name: user.name,
      memberSince: user.createdAt,
      reviewCount: reviews.length,
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

    res.status(200).json({
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
    });
  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
});

router.get("/book/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const book = await Book.findByPk(id, {
      include: [
        {
          model: Review,
          where: { reportCount: { [Sequelize.Op.lt]: REPORT_HIDE_THRESHOLD } },
          required: false,
          attributes: ["id", "userId", "body", "user_rating", "createdAt"],
          include: [{ model: User, attributes: ["name"] }],
        },
      ],
    });

    if (!book) {
      return res.status(404).send({ message: "Книга не найдена" });
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
      reviews: book.Reviews.map(mapReview),
    });
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
          include: [{ model: User, attributes: ["name"] }],
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
          reviews: allReviews.map(mapReview),
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
