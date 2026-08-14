const { parse } = require("csv-parse/sync");

const SHELF_TO_STATUS = {
  read: "read",
  "currently-reading": "reading",
  "to-read": "want_to_read",
};

// Bounds worst-case import time — each unmatched row can trigger an
// outbound Open Library lookup, and this all happens synchronously within
// one HTTP request (see importRouter.js).
const MAX_ROWS = 200;

// Goodreads wraps ISBN/ISBN13 as ="0441013593" — an Excel formula that
// forces the leading zero (and the value in general) to survive as text
// instead of being reinterpreted as a number. Strip the ="…" wrapper to
// get the bare value.
function extractIsbn(raw) {
  const value = (raw || "").trim();
  const match = value.match(/^="?(.*?)"?$/);
  return (match ? match[1] : value).trim();
}

// Goodreads' CSV export (Profile -> My Books -> Import/Export -> Export
// Library) has kept the same column set for years — this only reads the
// handful of columns this site actually has a place for; everything else
// (binding, page count, private notes...) is dropped.
function parseGoodreadsCsv(csvText) {
  let records;
  try {
    records = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
      bom: true,
    });
  } catch {
    throw new Error("Не удалось прочитать файл — убедитесь, что это CSV-экспорт из Goodreads (Profile → My Books → Import/Export → Export Library)");
  }

  if (records.length > MAX_ROWS) {
    throw new Error(`Слишком много строк (${records.length}) — за один раз можно импортировать не более ${MAX_ROWS} книг`);
  }

  return records
    .map((row) => {
      const title = (row.Title || "").trim();
      const author = (row.Author || "").trim();
      if (!title || !author) return null;

      const rating = Number(row["My Rating"]) || 0;
      const reviewBody = (row["My Review"] || "").trim();
      const shelf = (row["Exclusive Shelf"] || "").trim().toLowerCase();
      const status = SHELF_TO_STATUS[shelf] || null;
      const year = Number(row["Original Publication Year"]) || Number(row["Year Published"]) || null;
      const isbn = extractIsbn(row.ISBN13) || extractIsbn(row.ISBN) || null;

      return { title, author, rating, reviewBody, status, year, isbn };
    })
    .filter(Boolean);
}

module.exports = { parseGoodreadsCsv, MAX_ROWS };
