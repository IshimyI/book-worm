"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class UserReport extends Model {
    static associate({ User }) {
      this.belongsTo(User, { as: "Reporter", foreignKey: "reporterId" });
      this.belongsTo(User, { as: "Reported", foreignKey: "reportedId" });
    }
  }
  UserReport.init(
    {
      reporterId: DataTypes.INTEGER,
      reportedId: DataTypes.INTEGER,
      reason: DataTypes.TEXT,
    },
    {
      sequelize,
      modelName: "UserReport",
      updatedAt: false,
    }
  );
  return UserReport;
};
