const express = require("express");
const { Review, Book, User } = require("../../db/models");
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

module.exports = adminRouter;
