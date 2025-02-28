const express = require("express");
const { User, Book, Review } = require("../../db/models");
const { Sequelize, where } = require("sequelize");

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

router.get("/listUserBooks/:id", async (req, res) => {
  const { id } = req.params;
  try {
    if (!id) {
      return res
        .status(400)
        .send({ message: "Пользователя с таким id не обнаружено" });
    }

    const reviews = await Review.findAll({
      where: { userId: id },
      include: { model: Book },
    });
    const books = reviews.map((review) => review.Book);
    res.status(200).send(books);
  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
});

router.post("/book/new", async (req, res) => {
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

    const avgRating = await Review.findAll({
      where: { bookId: newBook.id },
      attributes: [
        [Sequelize.fn("AVG", Sequelize.col("user_rating")), "avgRating"],
        [Sequelize.fn("COUNT", Sequelize.col("user_rating")), "quantityRate"],
      ],
      raw: true,
    });

    newBook.rating = Number(parseFloat(avgRating[0].avgRating).toFixed(1));
    newBook.quantity_rate = Number(parseFloat(avgRating[0].quantityRate));
    await newBook.save();

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

router.post("/updateFavourites/:id", async (req, res) => {
  const { id } = req.params;
  const { bookId } = req.body;

  try {
    const user = await User.findByPk(id);

    if (!user) {
      return res
        .status(400)
        .send({ message: "Пользователь с таким id не найден" });
    }

    let favouriteBooks = user.favourites ? user.favourites.split(" ") : [];

    if (favouriteBooks.includes(bookId)) {
      favouriteBooks = favouriteBooks.filter((book_id) => book_id !== bookId);
    } else {
      favouriteBooks.push(bookId);
    }
    user.favourites = favouriteBooks.join(" ");
    user.save();
    res.status(200).send(user);
  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
});

module.exports = router;

// TODO Ваня 7. Если нет оценок и отзывов по умолчанию чтоб 0 возвращал.
// TODO ваня 8.  Ручка- тебе приходит idBook ты вернёшь список рецензий к этой книге где каждый элемент это  1. имя юзера  2. его рецензия к этой книге 3. id юзера 4/ его оценка
