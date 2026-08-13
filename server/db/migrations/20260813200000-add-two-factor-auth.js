"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Users", "twoFactorSecret", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("Users", "twoFactorEnabled", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.addColumn("Users", "twoFactorRecoveryCodes", {
      // JSON-stringified array of bcrypt-hashed one-time recovery codes —
      // hashed the same as the password, since a recovery code is just as
      // much a credential as one.
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn("Users", "twoFactorRecoveryCodes");
    await queryInterface.removeColumn("Users", "twoFactorEnabled");
    await queryInterface.removeColumn("Users", "twoFactorSecret");
  },
};
