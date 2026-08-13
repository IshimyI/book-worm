"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // `genre` stays the book's primary genre (unchanged everywhere it's
    // already used — filters, facets, indexes); this is purely additive so
    // a book can carry extra genre tags beyond its one primary genre
    // without touching every existing genre-related query.
    await queryInterface.addColumn("Books", "additionalGenres", {
      type: Sequelize.ARRAY(Sequelize.STRING),
      allowNull: false,
      defaultValue: [],
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn("Books", "additionalGenres");
  },
};
