"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Goodreads exports the ISBN of the specific edition a user shelved,
    // and Open Library's search results are aggregated at the "work"
    // level — one popular book easily has 20+ ISBNs across editions and
    // translations. A single isbn column would only ever match a fraction
    // of real rows, so this stores every ISBN Open Library knows for the
    // book and an import matches if the row's ISBN appears anywhere in it.
    //
    // Also language-independent, unlike title+author string matching:
    // Goodreads stores the author's name however it's catalogued there
    // (almost always Latin script, even for a book this catalog stores
    // with a Cyrillic transliteration — "Frank Herbert" vs "Фрэнк
    // Герберт") — findPossibleDuplicate falls back to title+author, but
    // checks this first when the row has an ISBN.
    await queryInterface.addColumn("Books", "isbn", {
      type: Sequelize.ARRAY(Sequelize.STRING),
      allowNull: false,
      defaultValue: [],
    });
    await queryInterface.addIndex("Books", ["isbn"], { name: "books_isbn_idx", using: "GIN" });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn("Books", "isbn");
  },
};
