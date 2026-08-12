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

const express = require("express");
const logger = require("morgan");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");

const router = require("./routes/router");
const authRouter = require("./routes/authRouter");
const tokensRouter = require("./routes/tokensRouter");

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

app.use("/api", router);
app.use("/api/auth", authRouter);
app.use("/api/tokens", tokensRouter);

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

app.listen(PORT, () => {
  console.log(`Server listening on port: ${PORT}!`);
});

module.exports = app;
