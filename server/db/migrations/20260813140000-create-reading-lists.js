"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("ReadingLists", {
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
      name: {
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
    await queryInterface.addIndex("ReadingLists", ["userId"], {
      name: "reading_lists_user_idx",
    });

    await queryInterface.createTable("ReadingListBooks", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      readingListId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: { model: "ReadingLists", key: "id" },
        onDelete: "CASCADE",
      },
      bookId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: { model: "Books", key: "id" },
        onDelete: "CASCADE",
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
    // A book can only appear once per list — re-adding is a no-op, not a duplicate row.
    await queryInterface.addIndex("ReadingListBooks", ["readingListId", "bookId"], {
      unique: true,
      name: "reading_list_books_unique_book_per_list",
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable("ReadingListBooks");
    await queryInterface.dropTable("ReadingLists");
  },
};
