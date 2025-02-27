const express = require("express");
const { User, Book } = require("../../db/models");
const { where } = require("sequelize");

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
    body = '',
    user_rating,
  } = req.body;

  if (!(title && author && img && user_id)) {
    return res.status(400).json({ message: "Поля должны быть заполнены" });
  }

  const transaction = await Sequelize.transaction();

  try {
    const [newBook] = await Book.findOrCreate({
      where: { title, author },
      defaults: { genre, year, annotation, img },
      transaction,
    });

    if (user_rating) {
      await Review.findOrCreate({
        where: { book_id: newBook.id, user_id },
        defaults: { body, user_rating },
        transaction,
      });
    }

    await transaction.commit();
    res.status(201).json(newBook);
  } catch (error) {
    await transaction.rollback();
    console.error(error);
    res.status(500).send("Ошибка при добавлении книги или отзыва");
  }
});

module.exports = router;
