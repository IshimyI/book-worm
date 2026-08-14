const express = require("express");
const multer = require("multer");
const rateLimit = require("express-rate-limit");
const { Book, Review, ReadingStatus } = require("../../db/models");
const verifyAccessToken = require("../middlewares/verifyAccessToken");
const { parseGoodreadsCsv } = require("../utils/goodreadsImport");
const { findPossibleDuplicate } = require("../utils/bookDedup");
const { searchOpenLibraryCover } = require("../utils/openLibrarySearch");
const { containsProfanity } = require("../utils/moderation");
const { recomputeBookRating } = require("../utils/bookRating");
const logSecurityEvent = require("../utils/securityLog");

const importRouter = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "text/csv" && !file.originalname.toLowerCase().endsWith(".csv")) {
      return cb(new Error("Ожидается CSV-файл"));
    }
    cb(null, true);
  },
});

// A whole import counts as one request against the general contentLimiter
// no matter how many rows it processes, and each unmatched row triggers
// its own outbound Open Library lookup — needs a much stricter limit of
// its own so this can't be used to hammer that lookup or flood the DB.
const importLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "test",
  handler: (req, res, next, options) => {
    logSecurityEvent({ type: "rate_limited", ip: req.ip, detail: req.path });
    res.status(options.statusCode).json({ message: "Слишком много импортов. Попробуйте позже." });
  },
});

const COVER_LOOKUP_CONCURRENCY = 4;

// Runs `worker` over `items` with at most `limit` in flight at once —
// plain Promise.all would fire every Open Library lookup simultaneously,
// which is both unfriendly to that API and easy to mistake for abuse.
async function withConcurrency(items, worker, limit) {
  const results = new Array(items.length);
  let nextIndex = 0;
  async function run() {
    while (nextIndex < items.length) {
      const current = nextIndex++;
      results[current] = await worker(items[current]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}

importRouter.post(
  "/goodreads",
  verifyAccessToken,
  importLimiter,
  (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err) {
        const message = err.code === "LIMIT_FILE_SIZE" ? "Файл слишком большой (максимум 2 МБ)" : err.message;
        return res.status(400).json({ message });
      }
      next();
    });
  },
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "Файл не выбран" });
    }

    let rows;
    try {
      rows = parseGoodreadsCsv(req.file.buffer.toString("utf-8"));
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
    if (rows.length === 0) {
      return res.status(400).json({ message: "В файле не найдено ни одной книги" });
    }

    try {
      const existingBooks = await Book.findAll({ attributes: ["id", "title", "author"] });
      const summary = { matched: 0, created: 0, skipped: 0, skippedTitles: [] };

      // Resolve every row to a book (existing match, or an Open Library
      // lookup for a new one) concurrently, then write reviews/reading
      // statuses one at a time so two rows for the same new title can't
      // both decide independently that it needs to be created.
      const resolved = await withConcurrency(
        rows,
        async (row) => {
          const match = findPossibleDuplicate(row.title, row.author, existingBooks);
          if (match) return { row, bookId: match.id, isNew: false };

          if (row.reviewBody && containsProfanity(row.reviewBody)) {
            return { row, error: "рецензия содержит недопустимые слова" };
          }

          const lookup = await searchOpenLibraryCover(row.title, row.author);
          return { row, isNew: true, lookup };
        },
        COVER_LOOKUP_CONCURRENCY
      );

      for (const item of resolved) {
        if (item.error) {
          summary.skipped += 1;
          summary.skippedTitles.push(`${item.row.title} — ${item.error}`);
          continue;
        }

        let bookId = item.bookId;
        if (item.isNew) {
          // Same as manually adding a book that isn't in the catalog yet:
          // starts pending, kept out of the public catalog/recommendations
          // until an admin approves it.
          const created = await Book.create({
            title: item.row.title,
            author: item.row.author,
            genre: item.lookup?.genre || "Жанр неизвестен",
            year: item.row.year || item.lookup?.year || 1,
            annotation: "Описание отсутствует",
            img: item.lookup?.img || "https://cdn1.ozone.ru/s3/multimedia-x/6597669093.jpg",
            status: "pending",
          });
          bookId = created.id;
          existingBooks.push({ id: bookId, title: item.row.title, author: item.row.author });
          summary.created += 1;
        } else {
          summary.matched += 1;
        }

        if (item.row.status) {
          const [statusRow, statusCreated] = await ReadingStatus.findOrCreate({
            where: { userId: req.userId, bookId },
            defaults: { status: item.row.status },
          });
          if (!statusCreated && statusRow.status !== item.row.status) {
            statusRow.status = item.row.status;
            await statusRow.save();
          }
        }

        if (item.row.rating > 0 || item.row.reviewBody) {
          const [review, reviewCreated] = await Review.findOrCreate({
            where: { bookId, userId: req.userId },
            defaults: { body: item.row.reviewBody, user_rating: item.row.rating || 1 },
          });
          if (!reviewCreated) {
            review.body = item.row.reviewBody || review.body;
            review.user_rating = item.row.rating || review.user_rating;
            await review.save();
          }
          await recomputeBookRating(bookId);
        }
      }

      res.status(200).json(summary);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Ошибка сервера при импорте" });
    }
  }
);

module.exports = importRouter;
