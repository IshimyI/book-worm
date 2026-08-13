const express = require("express");
const { Review, Book, User, PageView, SecurityEvent } = require("../../db/models");
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

module.exports = adminRouter;
