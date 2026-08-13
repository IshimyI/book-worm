"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class ReadingListBook extends Model {
    static associate({ ReadingList, Book }) {
      this.belongsTo(ReadingList, { foreignKey: "readingListId" });
      this.belongsTo(Book, { foreignKey: "bookId" });
    }
  }
  ReadingListBook.init(
    {
      readingListId: DataTypes.INTEGER,
      bookId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "ReadingListBook",
    }
  );
  return ReadingListBook;
};
