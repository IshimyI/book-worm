"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Book extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ Review }) {
      this.hasMany(Review, { foreignKey: "bookId" });
    }
  }
  Book.init(
    {
      title: DataTypes.STRING,
      author: DataTypes.STRING,
      annotation: DataTypes.STRING,
      rating: DataTypes.STRING,
      quantity_rate: DataTypes.INTEGER,
      img: DataTypes.STRING,
      genre: DataTypes.STRING,
      additionalGenres: DataTypes.ARRAY(DataTypes.STRING),
      year: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Book",
    }
  );
  return Book;
};
