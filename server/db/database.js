module.exports = {
  development: {
    username: "admin2",
    password: "123",
    database: "book-worm",
    host: "127.0.0.1",
    dialect: "postgres",
  },
  test: {
    username: "admin2",
    password: "123",
    database: "book-worm",
    host: "127.0.0.1",
    dialect: "postgres",
  },
  production: {
    username: "root",
    password: null,
    database: "database_production",
    host: "127.0.0.1",
    dialect: "mysql",
  },
};
