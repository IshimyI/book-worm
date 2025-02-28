module.exports = {
  development: {
<<<<<<< HEAD
<<<<<<< HEAD
    username: "admin2",
=======
    username: "postgres",
>>>>>>> ce4e982b399da6afe86389d4d4cdd6ca116bba64
=======
    username: "admin",
>>>>>>> 6cc5887964bcc55a1bcbe647fed42eabbe8f54b8
    password: "123",
    database: "book-worm",
    host: "127.0.0.1",
    port: "5432",
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
    username: "root",
    password: null,
    database: "database_production",
    host: "127.0.0.1",
    dialect: "mysql",
  },
};
