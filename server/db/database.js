module.exports = {
  development: {
<<<<<<< HEAD
    username: "admin",
=======
    username: "postgres",
>>>>>>> e331e67b706a99b10bc006f7138c54850dce84ef
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
    username: "root",
    password: null,
    database: "database_production",
    host: "127.0.0.1",
    dialect: "mysql",
  },
};
