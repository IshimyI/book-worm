"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class SecurityEvent extends Model {}
  SecurityEvent.init(
    {
      type: DataTypes.STRING,
      email: DataTypes.STRING,
      ip: DataTypes.STRING,
      detail: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "SecurityEvent",
      updatedAt: false,
    }
  );
  return SecurityEvent;
};
