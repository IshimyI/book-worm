"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class ReviewComment extends Model {
    static associate({ Review, User }) {
      this.belongsTo(Review, { foreignKey: "reviewId" });
      this.belongsTo(User, { foreignKey: "userId" });
    }
  }
  ReviewComment.init(
    {
      reviewId: DataTypes.INTEGER,
      userId: DataTypes.INTEGER,
      body: DataTypes.TEXT,
    },
    {
      sequelize,
      modelName: "ReviewComment",
    }
  );
  return ReviewComment;
};
