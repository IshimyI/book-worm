"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.addIndex("Books", ["genre"], { name: "books_genre_idx" });
    await queryInterface.addIndex("Books", ["year"], { name: "books_year_idx" });
    // Reviews(bookId) lookups are already served by the leftmost prefix of
    // the reviews_book_user_unique(bookId, userId) index — only userId needs
    // its own index for profile-page queries.
    await queryInterface.addIndex("Reviews", ["userId"], { name: "reviews_user_id_idx" });
  },
  async down(queryInterface) {
    await queryInterface.removeIndex("Books", "books_genre_idx");
    await queryInterface.removeIndex("Books", "books_year_idx");
    await queryInterface.removeIndex("Reviews", "reviews_user_id_idx");
  },
};
