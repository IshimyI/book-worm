"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class ReadingChallenge extends Model {
    static associate({ User }) {
      this.belongsTo(User, { foreignKey: "userId" });
    }
  }
  ReadingChallenge.init(
    {
      userId: DataTypes.INTEGER,
      year: DataTypes.INTEGER,
      goal: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "ReadingChallenge",
    }
  );
  return ReadingChallenge;
};
