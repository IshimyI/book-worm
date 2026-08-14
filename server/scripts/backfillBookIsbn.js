require("dotenv").config();
const { Op } = require("sequelize");
const { sequelize, Book } = require("../db/models");
const { searchOpenLibraryCover } = require("../src/utils/openLibrarySearch");

// One-off backfill for books added before the isbn column existed (see
// the add-book-isbn migration) — without an ISBN, a Goodreads import can
// only ever match these by title+author string comparison, which misses
// most real matches since Goodreads stores author names in Latin script
// even for a book this catalog stores with a Cyrillic transliteration.
// Re-runs safely: only touches books with an empty isbn array.
async function backfillBookIsbn() {
  const books = await Book.findAll({ where: { isbn: { [Op.eq]: [] } } });

  let filled = 0;
  let noResult = 0;

  for (const book of books) {
    // eslint-disable-next-line no-await-in-loop
    const lookup = await searchOpenLibraryCover(book.title, book.author);
    if (lookup?.isbn?.length) {
      book.isbn = lookup.isbn;
      // eslint-disable-next-line no-await-in-loop
      await book.save();
      filled += 1;
      console.log(`✓ ${book.title} — ${lookup.isbn.length} ISBNs`);
    } else {
      noResult += 1;
      console.log(`✗ ${book.title} — no Open Library match with an ISBN`);
    }
  }

  console.log(`\nDone: ${filled} books backfilled, ${noResult} had no match.`);
}

if (require.main === module) {
  backfillBookIsbn()
    .then(() => sequelize.close())
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
      return sequelize.close();
    });
}

module.exports = backfillBookIsbn;
