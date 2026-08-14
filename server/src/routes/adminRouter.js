const express = require("express");
const { Review, Book, User, PageView, SecurityEvent, UserReport } = require("../../db/models");
const cache = require("../utils/simpleCache");
const { Sequelize } = require("sequelize");
const verifyAccessToken = require("../middlewares/verifyAccessToken");
const requireAdmin = require("../middlewares/requireAdmin");
const { recomputeBookRating } = require("../utils/bookRating");

const adminRouter = express.Router();

adminRouter.use(verifyAccessToken, requireAdmin);

adminRouter.get("/reported-reviews", async (req, res) => {
  try {
    const reviews = await Review.findAll({
      where: { reportCount: { [Sequelize.Op.gt]: 0 } },
      order: [["reportCount", "DESC"]],
      include: [
        { model: User, attributes: ["id", "name", "email"] },
        { model: Book, attributes: ["id", "title"] },
      ],
    });

    res.status(200).json(
      reviews.map((r) => ({
        id: r.id,
        body: r.body,
        rating: r.user_rating,
        reportCount: r.reportCount,
        createdAt: r.createdAt,
        author: { id: r.User.id, name: r.User.name, email: r.User.email },
        book: { id: r.Book.id, title: r.Book.title },
      }))
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

adminRouter.post("/reviews/:id/dismiss", async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id);
    if (!review) {
      return res.status(404).json({ message: "Рецензия не найдена" });
    }
    review.reportCount = 0;
    await review.save();
    await recomputeBookRating(review.bookId);
    res.status(200).json({ message: "Жалобы сброшены, рецензия восстановлена" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

adminRouter.delete("/reviews/:id", async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id);
    if (!review) {
      return res.status(404).json({ message: "Рецензия не найдена" });
    }
    const { bookId } = review;
    await review.destroy();
    await recomputeBookRating(bookId);
    res.status(200).json({ message: "Рецензия удалена" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

function parseIds(raw) {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.map(Number).filter((id) => Number.isInteger(id) && id > 0))];
}

adminRouter.post("/reviews/bulk-dismiss", async (req, res) => {
  try {
    const ids = parseIds(req.body.ids);
    if (ids.length === 0) {
      return res.status(400).json({ message: "Не выбраны рецензии" });
    }
    const reviews = await Review.findAll({ where: { id: ids } });
    await Review.update({ reportCount: 0 }, { where: { id: ids } });
    const bookIds = [...new Set(reviews.map((r) => r.bookId))];
    await Promise.all(bookIds.map((bookId) => recomputeBookRating(bookId)));
    res.status(200).json({ message: `Жалобы сброшены у ${reviews.length} рецензий`, count: reviews.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

adminRouter.post("/reviews/bulk-delete", async (req, res) => {
  try {
    const ids = parseIds(req.body.ids);
    if (ids.length === 0) {
      return res.status(400).json({ message: "Не выбраны рецензии" });
    }
    const reviews = await Review.findAll({ where: { id: ids } });
    const bookIds = [...new Set(reviews.map((r) => r.bookId))];
    await Review.destroy({ where: { id: ids } });
    await Promise.all(bookIds.map((bookId) => recomputeBookRating(bookId)));
    res.status(200).json({ message: `Удалено рецензий: ${reviews.length}`, count: reviews.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

adminRouter.get("/analytics", async (req, res) => {
  try {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [totalViews, viewsByDayRows, topPathRows, topReferrerRows] = await Promise.all([
      PageView.count({ where: { createdAt: { [Sequelize.Op.gte]: since } } }),
      PageView.findAll({
        where: { createdAt: { [Sequelize.Op.gte]: since } },
        attributes: [[Sequelize.fn("date_trunc", "day", Sequelize.col("createdAt")), "day"], [Sequelize.fn("COUNT", "*"), "count"]],
        group: [Sequelize.literal("1")],
        order: [Sequelize.literal("1 ASC")],
        raw: true,
      }),
      PageView.findAll({
        where: { createdAt: { [Sequelize.Op.gte]: since } },
        attributes: ["path", [Sequelize.fn("COUNT", "*"), "count"]],
        group: ["path"],
        order: [[Sequelize.literal("count"), "DESC"]],
        limit: 15,
        raw: true,
      }),
      PageView.findAll({
        where: { createdAt: { [Sequelize.Op.gte]: since }, referrer: { [Sequelize.Op.ne]: null } },
        attributes: ["referrer", [Sequelize.fn("COUNT", "*"), "count"]],
        group: ["referrer"],
        order: [[Sequelize.literal("count"), "DESC"]],
        limit: 10,
        raw: true,
      }),
    ]);

    res.status(200).json({
      totalViews,
      viewsByDay: viewsByDayRows.map((r) => ({ date: r.day, count: Number(r.count) })),
      topPaths: topPathRows.map((r) => ({ path: r.path, count: Number(r.count) })),
      topReferrers: topReferrerRows.map((r) => ({ referrer: r.referrer, count: Number(r.count) })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

adminRouter.get("/security-events", async (req, res) => {
  try {
    const { page = 1, pageSize = 25, type = "" } = req.query;
    const limit = Math.min(Number(pageSize) || 25, 100);
    const offset = (Math.max(Number(page) || 1, 1) - 1) * limit;
    const where = type ? { type } : {};

    const [{ count }, events, typeRows] = await Promise.all([
      SecurityEvent.count({ where }).then((c) => ({ count: c })),
      SecurityEvent.findAll({ where, order: [["createdAt", "DESC"]], limit, offset }),
      SecurityEvent.findAll({ attributes: ["type"], group: ["type"], raw: true }),
    ]);

    res.status(200).json({
      events: events.map((e) => ({
        id: e.id,
        type: e.type,
        email: e.email,
        ip: e.ip,
        detail: e.detail,
        createdAt: e.createdAt,
      })),
      total: count,
      page: Math.max(Number(page) || 1, 1),
      totalPages: Math.max(1, Math.ceil(count / limit)),
      types: typeRows.map((r) => r.type).sort(),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

adminRouter.get("/stats", async (req, res) => {
  try {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [totalUsers, totalReviews, totalBooks, usersByDayRows, reviewsByDayRows, topBookRows] = await Promise.all([
      User.count(),
      Review.count(),
      Book.count(),
      User.findAll({
        where: { createdAt: { [Sequelize.Op.gte]: since } },
        attributes: [[Sequelize.fn("date_trunc", "day", Sequelize.col("createdAt")), "day"], [Sequelize.fn("COUNT", "*"), "count"]],
        group: [Sequelize.literal("1")],
        order: [Sequelize.literal("1 ASC")],
        raw: true,
      }),
      Review.findAll({
        where: { createdAt: { [Sequelize.Op.gte]: since } },
        attributes: [[Sequelize.fn("date_trunc", "day", Sequelize.col("createdAt")), "day"], [Sequelize.fn("COUNT", "*"), "count"]],
        group: [Sequelize.literal("1")],
        order: [Sequelize.literal("1 ASC")],
        raw: true,
      }),
      Review.findAll({
        attributes: ["bookId", [Sequelize.fn("COUNT", "*"), "count"]],
        group: ["bookId"],
        order: [[Sequelize.literal("count"), "DESC"]],
        limit: 10,
        raw: true,
      }),
    ]);

    const topBooks = await Book.findAll({
      where: { id: topBookRows.map((r) => r.bookId) },
      attributes: ["id", "title", "author", "rating"],
    });
    const topBooksById = new Map(topBooks.map((b) => [b.id, b]));

    res.status(200).json({
      totalUsers,
      totalReviews,
      totalBooks,
      usersByDay: usersByDayRows.map((r) => ({ date: r.day, count: Number(r.count) })),
      reviewsByDay: reviewsByDayRows.map((r) => ({ date: r.day, count: Number(r.count) })),
      topBooks: topBookRows
        .map((r) => {
          const book = topBooksById.get(r.bookId);
          if (!book) return null;
          return { id: book.id, title: book.title, author: book.author, rating: book.rating, reviewCount: Number(r.count) };
        })
        .filter(Boolean),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

adminRouter.get("/pending-books", async (req, res) => {
  try {
    const books = await Book.findAll({
      where: { status: "pending" },
      order: [["createdAt", "ASC"]],
      include: [{ model: Review, attributes: ["id", "body", "user_rating"], include: [{ model: User, attributes: ["id", "name", "email"] }] }],
    });

    res.status(200).json(
      books.map((b) => {
        const submitter = b.Reviews?.[0]?.User;
        return {
          id: b.id,
          title: b.title,
          author: b.author,
          genre: b.genre,
          annotation: b.annotation,
          img: b.img,
          year: b.year,
          createdAt: b.createdAt,
          submittedBy: submitter ? { id: submitter.id, name: submitter.name, email: submitter.email } : null,
        };
      })
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

adminRouter.post("/books/:id/approve", async (req, res) => {
  try {
    const book = await Book.findByPk(req.params.id);
    if (!book) {
      return res.status(404).json({ message: "Книга не найдена" });
    }
    book.status = "approved";
    await book.save();
    cache.clearPrefix("listAllBooks:");
    res.status(200).json({ message: "Книга одобрена" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

adminRouter.delete("/books/:id", async (req, res) => {
  try {
    const book = await Book.findByPk(req.params.id);
    if (!book) {
      return res.status(404).json({ message: "Книга не найдена" });
    }
    // Reviews are soft-deleted (paranoid) elsewhere, but a plain destroy()
    // would leave the row (and its bookId FK) in place — force a real
    // delete so the book itself can be removed. Votes/comments on those
    // reviews cascade automatically.
    await Review.destroy({ where: { bookId: book.id }, force: true });
    await book.destroy();
    res.status(200).json({ message: "Книга отклонена и удалена" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

adminRouter.get("/reported-users", async (req, res) => {
  try {
    const reports = await UserReport.findAll({
      include: [
        { model: User, as: "Reporter", attributes: ["id", "name", "email"] },
        { model: User, as: "Reported", attributes: ["id", "name", "email"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    const byReportedId = new Map();
    for (const r of reports) {
      if (!r.Reported) continue;
      if (!byReportedId.has(r.reportedId)) {
        byReportedId.set(r.reportedId, {
          id: r.Reported.id,
          name: r.Reported.name,
          email: r.Reported.email,
          reportCount: 0,
          reports: [],
        });
      }
      const entry = byReportedId.get(r.reportedId);
      entry.reportCount += 1;
      entry.reports.push({
        id: r.id,
        reason: r.reason,
        createdAt: r.createdAt,
        reporter: r.Reporter ? { id: r.Reporter.id, name: r.Reporter.name, email: r.Reporter.email } : null,
      });
    }

    const result = [...byReportedId.values()].sort((a, b) => b.reportCount - a.reportCount);
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

adminRouter.post("/reported-users/:id/dismiss", async (req, res) => {
  try {
    await UserReport.destroy({ where: { reportedId: req.params.id } });
    res.status(200).json({ message: "Жалобы на пользователя сброшены" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

module.exports = adminRouter;
