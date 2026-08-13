"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class ReadingList extends Model {
    static associate({ User, Book, ReadingListBook }) {
      this.belongsTo(User, { foreignKey: "userId" });
      this.belongsToMany(Book, { through: ReadingListBook, foreignKey: "readingListId", otherKey: "bookId" });
    }
  }
  ReadingList.init(
    {
      userId: DataTypes.INTEGER,
      name: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "ReadingList",
    }
  );
  return ReadingList;
};
