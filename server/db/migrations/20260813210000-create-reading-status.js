"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("ReadingStatuses", {
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
      bookId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: { model: "Books", key: "id" },
        onDelete: "CASCADE",
      },
      status: {
        allowNull: false,
        type: Sequelize.STRING,
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
    // One status per user per book — setting a new one overwrites, not stacks.
    await queryInterface.addIndex("ReadingStatuses", ["userId", "bookId"], {
      unique: true,
      name: "reading_statuses_unique_user_book",
    });
    await queryInterface.addConstraint("ReadingStatuses", {
      fields: ["status"],
      type: "check",
      name: "reading_statuses_status_check",
      where: { status: { [Sequelize.Op.in]: ["want_to_read", "reading", "read"] } },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable("ReadingStatuses");
  },
};
