"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ Review, ReadingList }) {
      this.hasMany(Review, { foreignKey: "userId" });
      this.hasMany(ReadingList, { foreignKey: "userId" });
    }
  }
  User.init(
    {
      name: DataTypes.STRING,
      email: DataTypes.STRING,
      password: DataTypes.STRING,
      favourites: DataTypes.STRING,
      isEmailConfirmed: DataTypes.BOOLEAN,
      resetPasswordToken: DataTypes.STRING,
      resetPasswordExpires: DataTypes.DATE,
      currentRefreshTokenId: DataTypes.STRING,
      previousRefreshTokenId: DataTypes.STRING,
      refreshTokenRotatedAt: DataTypes.DATE,
      isAdmin: DataTypes.BOOLEAN,
      avatarUrl: DataTypes.STRING,
      twoFactorSecret: DataTypes.STRING,
      twoFactorEnabled: DataTypes.BOOLEAN,
      twoFactorRecoveryCodes: DataTypes.TEXT,
    },
    {
      sequelize,
      modelName: "User",
    }
  );
  return User;
};
