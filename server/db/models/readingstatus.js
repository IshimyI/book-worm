"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class ReadingStatus extends Model {
    static associate({ User, Book }) {
      this.belongsTo(User, { foreignKey: "userId" });
      this.belongsTo(Book, { foreignKey: "bookId" });
    }
  }
  ReadingStatus.init(
    {
      userId: DataTypes.INTEGER,
      bookId: DataTypes.INTEGER,
      status: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "ReadingStatus",
    }
  );
  return ReadingStatus;
};
