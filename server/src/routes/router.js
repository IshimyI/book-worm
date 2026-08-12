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
    const books = await Book.findAll({
      include: [
        {
          model: Review,
          attributes: ["userId", "body", "user_rating"],
          include: [
            {
              model: User,
              attributes: ["name"],
            },
          ],
        },
      ],
    });

    const booksWithReviews = books.map((book) => {
      const reviews = book.Reviews.map((review) => ({
        userName: review.User.name,
        user_rev: review.body,
        user_id: review.userId,
        user_raeting: review.user_rating,
      }));

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
        reviews,
      };
    });

    res.status(200).send(booksWithReviews);
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
          attributes: ["userId", "body", "user_rating"],
          include: [
            {
              model: User,
              attributes: ["name"],
            },
          ],
        },
      ],
    });

    if (!book) {
      return res.status(404).send({ message: "Книга не найдена" });
    }

    const reviews = book.Reviews.map((review) => ({
      userName: review.User.name,
      user_rev: review.body,
      user_id: review.userId,
      user_raeting: review.user_rating,
    }));

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
      reviews,
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
          attributes: ["userId", "body", "user_rating"],
          include: [
            {
              model: User,
              attributes: ["name"],
            },
          ],
        },
      ],
    });

    const booksWithReviews = await Promise.all(
      books.map(async (book) => {
        const allReviews = await Review.findAll({
          where: { bookId: book.id },
          include: [
            {
              model: User,
              attributes: ["name"],
            },
          ],
        });

        const reviews = allReviews.map((review) => ({
          userName: review.User.name,
          user_rev: review.body,
          user_id: review.userId,
          user_raeting: review.user_rating,
        }));

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
          reviews,
        };
      })
    );

    res.status(200).send(booksWithReviews);
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

    newBook.rating = parseFloat(avgRating[0].avgRating).toFixed(1);
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

    if (favouriteBooks.includes(bookId + "")) {
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
