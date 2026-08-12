"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Review extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ User, Book }) {
      this.belongsTo(User, { foreignKey: "userId" });
      this.belongsTo(Book, { foreignKey: "bookId" });
    }
  }
  Review.init(
    {
      body: DataTypes.TEXT,
      bookId: DataTypes.INTEGER,
      userId: DataTypes.INTEGER,
      user_rating: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Review",
    }
  );
  return Review;
};
