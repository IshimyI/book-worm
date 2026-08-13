"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Notification extends Model {
    static associate({ User }) {
      this.belongsTo(User, { foreignKey: "userId" });
      this.belongsTo(User, { foreignKey: "actorId", as: "Actor" });
    }
  }
  Notification.init(
    {
      userId: DataTypes.INTEGER,
      actorId: DataTypes.INTEGER,
      type: DataTypes.STRING,
      data: DataTypes.TEXT,
      isRead: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "Notification",
      updatedAt: false,
    }
  );
  return Notification;
};
