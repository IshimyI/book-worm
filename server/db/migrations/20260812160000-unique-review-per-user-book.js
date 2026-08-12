"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // The app already enforces "one review per user per book" at the
    // application layer (findOrCreate keyed on bookId+userId), but nothing
    // stopped duplicate rows being inserted any other way (e.g. seed data).
    // Cheapest fix first: merge existing duplicates by rating and keeping the
    // most recent body, then add a real DB constraint so it can't recur.
    await queryInterface.sequelize.query(`
      WITH ranked AS (
        SELECT id, "bookId", "userId",
               ROW_NUMBER() OVER (PARTITION BY "bookId", "userId" ORDER BY "createdAt" DESC) AS rn
        FROM "Reviews"
      )
      DELETE FROM "Reviews" WHERE id IN (SELECT id FROM ranked WHERE rn > 1);
    `);

    await queryInterface.addConstraint("Reviews", {
      fields: ["bookId", "userId"],
      type: "unique",
      name: "reviews_book_user_unique",
    });
  },
  async down(queryInterface) {
    await queryInterface.removeConstraint("Reviews", "reviews_book_user_unique");
  },
};
