"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Users", "previousRefreshTokenId", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("Users", "refreshTokenRotatedAt", {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn("Users", "previousRefreshTokenId");
    await queryInterface.removeColumn("Users", "refreshTokenRotatedAt");
  },
};
