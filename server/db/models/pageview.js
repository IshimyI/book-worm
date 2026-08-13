"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class PageView extends Model {}
  PageView.init(
    {
      path: DataTypes.STRING,
      referrer: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "PageView",
      updatedAt: false,
    }
  );
  return PageView;
};
