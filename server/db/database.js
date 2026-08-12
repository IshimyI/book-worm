module.exports = {
  development: {
    username: "postgres",
    password: "123",
    database: "book-worm",
    host: "127.0.0.1",
    port: "5433",
    dialect: "postgres",
  },
  test: {
    username: "postgres",
    password: "123",
    database: "book-worm",
    host: "127.0.0.1",
    port: "5433",
    dialect: "postgres",
  },
  production: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    host: process.env.DB_HOST || "127.0.0.1",
    port: process.env.DB_PORT || "5432",
    dialect: "postgres",
  },
  // Same shape as production — a pre-prod copy of the app pointed at its
  // own DB, so migrations/seeds can be tried there before touching prod.
  staging: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    host: process.env.DB_HOST || "127.0.0.1",
    port: process.env.DB_PORT || "5432",
    dialect: "postgres",
  },
};
