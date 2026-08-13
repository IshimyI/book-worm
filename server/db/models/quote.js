"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Quote extends Model {
    static associate({ Book, User }) {
      this.belongsTo(Book, { foreignKey: "bookId" });
      this.belongsTo(User, { foreignKey: "userId" });
    }
  }
  Quote.init(
    {
      bookId: DataTypes.INTEGER,
      userId: DataTypes.INTEGER,
      text: DataTypes.TEXT,
      page: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Quote",
      updatedAt: false,
    }
  );
  return Quote;
};
