"use strict";
const bcrypt = require("bcrypt");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "Users",
      [
        {
          name: "1",
          email: "1@1",
          password: await bcrypt.hash("1", 10),
          isEmailConfirmed: true,
        },
        {
          name: "2",
          email: "2@2",
          password: await bcrypt.hash("2", 10),
          isEmailConfirmed: true,
        },
        {
          name: "3",
          email: "3@3",
          password: await bcrypt.hash("3", 10),
          isEmailConfirmed: true,
        },
        {
          name: "4",
          email: "4@4",
          password: await bcrypt.hash("4", 10),
          isEmailConfirmed: true,
        },
        {
          name: "5",
          email: "5@5",
          password: await bcrypt.hash("5", 10),
          isEmailConfirmed: true,
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  },
};
