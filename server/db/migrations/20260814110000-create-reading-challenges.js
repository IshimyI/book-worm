"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("ReadingChallenges", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      userId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: { model: "Users", key: "id" },
        onDelete: "CASCADE",
      },
      year: {
        allowNull: false,
        type: Sequelize.INTEGER,
      },
      goal: {
        allowNull: false,
        type: Sequelize.INTEGER,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("NOW"),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("NOW"),
      },
    });
    // One goal per user per year — setting a new one overwrites.
    await queryInterface.addIndex("ReadingChallenges", ["userId", "year"], {
      unique: true,
      name: "reading_challenges_unique_user_year",
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable("ReadingChallenges");
  },
};
