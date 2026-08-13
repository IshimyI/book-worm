"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("ReviewVotes", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      reviewId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: { model: "Reviews", key: "id" },
        onDelete: "CASCADE",
      },
      userId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: { model: "Users", key: "id" },
        onDelete: "CASCADE",
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("NOW"),
      },
    });
    // One vote per user per review — re-clicking "helpful" un-votes rather
    // than stacking, so this is what actually enforces that, not app logic.
    await queryInterface.addIndex("ReviewVotes", ["reviewId", "userId"], {
      unique: true,
      name: "review_votes_unique_user_per_review",
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable("ReviewVotes");
  },
};
