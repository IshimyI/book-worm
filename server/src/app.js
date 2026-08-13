require("dotenv").config();

// Must run before other requires so Sentry can auto-instrument them.
const Sentry = require("@sentry/node");
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: 0.1,
  });
}

const path = require("path");
const express = require("express");
const logger = require("morgan");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");

const router = require("./routes/router");
const authRouter = require("./routes/authRouter");
const tokensRouter = require("./routes/tokensRouter");
const adminRouter = require("./routes/adminRouter");
const listsRouter = require("./routes/listsRouter");
const { Book } = require("../db/models");

const SITE_ORIGIN = process.env.SITE_ORIGIN || "https://mrbookworm.ru";

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[ch]));
}

const app = express();
const { PORT } = process.env || 3000;

// Behind nginx: without this, express-rate-limit reads the spoofable
// connection IP instead of X-Forwarded-For, so rate limits are keyed wrong.
app.set("trust proxy", 1);

const corsConfig = {
  origin: [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://mrbookworm.ru",
    "https://www.mrbookworm.ru",
  ],
  credentials: true,
};

app.use(helmet());
app.use(cors(corsConfig));
app.use(logger("dev"));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());

// In production nginx serves this directory directly (see the /uploads
// location block) and this line is never reached — it exists so local dev
// (no nginx in front) can still resolve avatar URLs. helmet()'s default
// Cross-Origin-Resource-Policy: same-origin blocks the client (a different
// port in dev) from loading these images, so relax it just for this route.
app.use(
  "/uploads",
  (req, res, next) => {
    res.set("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express.static(path.join(__dirname, "../uploads"))
);

// Regular users never reach this — nginx only proxies /books/:id here for
// requests whose User-Agent matches a known social-media link-unfurling bot
// (see /etc/nginx/conf.d/social-bots.conf on the VPS), everyone else gets
// the normal static SPA straight from nginx. Those bots don't execute JS,
// so the client-side useSeoMeta og:image/title never reaches them — this is
// the one server-rendered response standing in for that, just for this path.
app.get("/books/:id", async (req, res, next) => {
  try {
    const book = await Book.findByPk(req.params.id, { attributes: ["id", "title", "author", "annotation"] });
    if (!book) return next();

    const title = `${book.title} — Mr Book Worm`;
    const description = (book.annotation || `${book.title}, ${book.author}`).slice(0, 200);
    const pageUrl = `${SITE_ORIGIN}/books/${book.id}`;
    const ogImageUrl = `${SITE_ORIGIN}/api/v1/book/${book.id}/og-image.png`;

    res.set("Content-Type", "text/html; charset=utf-8");
    res.send(`<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<meta property="og:type" content="book">
<meta property="og:title" content="${escapeHtml(book.title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:image" content="${ogImageUrl}">
<meta property="og:url" content="${pageUrl}">
<meta name="twitter:card" content="summary_large_image">
</head>
<body>
<h1>${escapeHtml(book.title)}</h1>
<p>${escapeHtml(description)}</p>
<a href="${pageUrl}">${escapeHtml(pageUrl)}</a>
</body>
</html>`);
  } catch (error) {
    next(error);
  }
});

// /api/v1 is the canonical path; bare /api is kept as an alias to the same
// routers so the currently-deployed client (still calling /api directly)
// keeps working without a synchronized deploy. New clients/integrations
// should target /api/v1 — it's the one that'll stick around if a v2 with
// breaking changes is ever needed.
for (const prefix of ["/api", "/api/v1"]) {
  app.use(prefix, router);
  app.use(`${prefix}/auth`, authRouter);
  app.use(`${prefix}/tokens`, tokensRouter);
  app.use(`${prefix}/admin`, adminRouter);
  app.use(`${prefix}/lists`, listsRouter);
}

if (process.env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}

// Fallback so a route error becomes a JSON 500 instead of Express's
// default HTML error page, and (via the handler above) still reaches Sentry.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: "Внутренняя ошибка сервера" });
});

// Don't bind a port when imported by tests (supertest drives the app
// in-process) — only when run directly as the server entrypoint.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server listening on port: ${PORT}!`);
  });
}

module.exports = app;
