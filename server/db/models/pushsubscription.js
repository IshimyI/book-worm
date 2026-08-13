"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class PushSubscription extends Model {
    static associate({ User }) {
      this.belongsTo(User, { foreignKey: "userId" });
    }
  }
  PushSubscription.init(
    {
      userId: DataTypes.INTEGER,
      endpoint: DataTypes.TEXT,
      p256dh: DataTypes.STRING,
      auth: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "PushSubscription",
      updatedAt: false,
    }
  );
  return PushSubscription;
};
