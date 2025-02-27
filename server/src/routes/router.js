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
  const { title, author, genre, year, annotation, img } = req.body;
  if (!(title && author && img)) {
    return res.status(400).json({ message: "Поля должны быть заполнены" });
  }

  try {
    const [newBook, created] = await Book.findOrCreate({
      where: { title, author },
      defaults: { genre, year, annotation, img },
    });
    if (created) {
      res.status(201).json(newBook);
    } else {
      res.status(201).json({ message: "Книга уже существует" }, newBook);
    }
    res.status(201).json(newBook);
  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
});

router.post("/review/new", async (req, res) => {
  const { body, user_rating, book_id, user_id } = req.body;
  try {
    if (!(body && user_rating && book_id && user_id)) {
      return res.status(400).json({
        message: "Поля должны быть заполнены",
      });
    }

    const [newReview, created] = await Review.findOrCreate({
      where: { book_id, user_id },
      defaults: { body, user_rating },
    });

    if (created) {
      res.status(201).json(newReview);
    } else {
      newReview.body = body;
      newReview.user_rating = user_rating;
      await newReview.save();

      res.status(201).json({ message: "Отзыв отредактирован" }, newReview);
    }
  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
});

module.exports = router;
