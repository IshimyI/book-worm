"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class ReviewVote extends Model {
    static associate({ Review, User }) {
      this.belongsTo(Review, { foreignKey: "reviewId" });
      this.belongsTo(User, { foreignKey: "userId" });
    }
  }
  ReviewVote.init(
    {
      reviewId: DataTypes.INTEGER,
      userId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "ReviewVote",
      updatedAt: false,
    }
  );
  return ReviewVote;
};
