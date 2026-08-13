"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Block extends Model {
    static associate({ User }) {
      this.belongsTo(User, { as: "Blocker", foreignKey: "blockerId" });
      this.belongsTo(User, { as: "Blocked", foreignKey: "blockedId" });
    }
  }
  Block.init(
    {
      blockerId: DataTypes.INTEGER,
      blockedId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Block",
      updatedAt: false,
    }
  );
  return Block;
};
