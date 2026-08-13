"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class ReviewComment extends Model {
    static associate({ Review, User, ReviewComment: Self }) {
      this.belongsTo(Review, { foreignKey: "reviewId" });
      this.belongsTo(User, { foreignKey: "userId" });
      this.hasMany(Self, { as: "Replies", foreignKey: "parentCommentId" });
      this.belongsTo(Self, { as: "Parent", foreignKey: "parentCommentId" });
    }
  }
  ReviewComment.init(
    {
      reviewId: DataTypes.INTEGER,
      userId: DataTypes.INTEGER,
      body: DataTypes.TEXT,
      parentCommentId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "ReviewComment",
    }
  );
  return ReviewComment;
};
