"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Notifications", {
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
      actorId: {
        allowNull: true,
        type: Sequelize.INTEGER,
        references: { model: "Users", key: "id" },
        onDelete: "SET NULL",
      },
      type: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      data: {
        // JSON blob of whatever context the notification needs to render/link
        // to (bookId, reviewId, bookTitle, ...) — kept generic so new
        // notification types don't need a new migration each time.
        allowNull: true,
        type: Sequelize.TEXT,
      },
      isRead: {
        allowNull: false,
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("NOW"),
      },
    });
    await queryInterface.addIndex("Notifications", ["userId", "isRead"], {
      name: "notifications_user_unread_idx",
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable("Notifications");
  },
};
