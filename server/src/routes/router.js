const express = require("express");
const { User, Book, Review } = require("../../db/models");
const { Sequelize } = require("sequelize");

const router = express.Router();

router.get("/users", async (req, res) => {
  try {
    res.status(200).send(await User.findAll({}));
  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
});

router.get("/listAllBooks", async (req, res) => {
  try {
    res.status(200).send(await Book.findAll({}));
  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
});

router.post("/book/new", async (req, res) => {
  const {
    user_id,
    title,
    author,
    genre,
    year,
    annotation,
    img,
    body = "",
    user_rating,
  } = req.body;

  if (!(title && author && user_id)) {
    return res.status(400).json({ message: "Поля должны быть заполнены" });
  }

  try {
    const [newBook, created] = await Book.findOrCreate({
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

    res.status(200).json({ book: newBook, review });
  } catch (error) {
    console.error(error);
    res.status(500).send("Ошибка при добавлении книги или отзыва");
  }
});

router.get("/favourites/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findByPk(id);
    if (user) {
      const books = user.favourites.split(" ");

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

module.exports = router;
