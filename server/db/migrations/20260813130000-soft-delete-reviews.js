"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Reviews", "deletedAt", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    // The existing unique(bookId, userId) constraint would otherwise block
    // writing a new review after soft-deleting the old one — the deleted
    // row still physically exists. Replace it with a partial index that
    // only enforces uniqueness among *active* (non-deleted) reviews.
    await queryInterface.removeConstraint("Reviews", "reviews_book_user_unique");
    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX reviews_book_user_unique_active
      ON "Reviews" ("bookId", "userId")
      WHERE "deletedAt" IS NULL;
    `);
  },
  async down(queryInterface) {
    await queryInterface.sequelize.query(`DROP INDEX IF EXISTS reviews_book_user_unique_active;`);
    await queryInterface.addConstraint("Reviews", {
      fields: ["bookId", "userId"],
      type: "unique",
      name: "reviews_book_user_unique",
    });
    await queryInterface.removeColumn("Reviews", "deletedAt");
  },
};
