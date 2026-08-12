const { Sequelize } = require("sequelize");
const { Book, Review } = require("../../db/models");

const REPORT_HIDE_THRESHOLD = 3;

async function recomputeBookRating(bookId) {
  const avgRating = await Review.findAll({
    where: { bookId, reportCount: { [Sequelize.Op.lt]: REPORT_HIDE_THRESHOLD } },
    attributes: [
      [Sequelize.fn("AVG", Sequelize.col("user_rating")), "avgRating"],
      [Sequelize.fn("COUNT", Sequelize.col("user_rating")), "quantityRate"],
    ],
    raw: true,
  });
  const book = await Book.findByPk(bookId);
  book.rating = avgRating[0].avgRating ? parseFloat(avgRating[0].avgRating).toFixed(2) : null;
  book.quantity_rate = Number(parseFloat(avgRating[0].quantityRate)) || 0;
  await book.save();
  return book;
}

module.exports = { REPORT_HIDE_THRESHOLD, recomputeBookRating };
