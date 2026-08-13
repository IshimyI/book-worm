"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Follow extends Model {
    static associate({ User }) {
      this.belongsTo(User, { foreignKey: "followerId", as: "Follower" });
      this.belongsTo(User, { foreignKey: "followingId", as: "Following" });
    }
  }
  Follow.init(
    {
      followerId: DataTypes.INTEGER,
      followingId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Follow",
      updatedAt: false,
    }
  );
  return Follow;
};
