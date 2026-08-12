const request = require("supertest");
const app = require("../app");
const { sequelize, User } = require("../../db/models");

beforeEach(async () => {
  await User.destroy({ where: {}, truncate: true, cascade: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe("POST /api/auth/signup", () => {
  it("creates a user and returns an access token", async () => {
    const res = await request(app).post("/api/auth/signup").send({
      name: "Test User",
      email: "signup-test@example.com",
      password: "password123",
    });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.user.email).toBe("signup-test@example.com");
    expect(res.body.user.password).toBeUndefined();
  });

  it("rejects missing fields", async () => {
    const res = await request(app).post("/api/auth/signup").send({
      email: "incomplete@example.com",
    });

    expect(res.status).toBe(400);
  });

  it("rejects a submission with the honeypot field filled in", async () => {
    const res = await request(app).post("/api/auth/signup").send({
      name: "Bot",
      email: "bot@example.com",
      password: "password123",
      website: "http://spam.example",
    });

    expect(res.status).toBe(400);
    expect(await User.findOne({ where: { email: "bot@example.com" } })).toBeNull();
  });

  it("rejects a submission that arrives implausibly fast", async () => {
    const res = await request(app).post("/api/auth/signup").send({
      name: "Bot",
      email: "fast-bot@example.com",
      password: "password123",
      formRenderedAt: Date.now(),
    });

    expect(res.status).toBe(400);
    expect(await User.findOne({ where: { email: "fast-bot@example.com" } })).toBeNull();
  });

  it("rejects a duplicate email", async () => {
    await request(app).post("/api/auth/signup").send({
      name: "First",
      email: "dupe@example.com",
      password: "password123",
    });

    const res = await request(app).post("/api/auth/signup").send({
      name: "Second",
      email: "dupe@example.com",
      password: "password456",
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/уже зарегистрирован/);
  });
});

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    await request(app).post("/api/auth/signup").send({
      name: "Login User",
      email: "login-test@example.com",
      password: "correct-password",
    });
  });

  it("logs in with correct credentials", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "login-test@example.com",
      password: "correct-password",
    });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toEqual(expect.any(String));
  });

  it("rejects the wrong password", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "login-test@example.com",
      password: "wrong-password",
    });

    expect(res.status).toBe(400);
  });

  it("rejects an unknown email", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "nobody@example.com",
      password: "whatever",
    });

    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/forgot-password", () => {
  it("rejects an email with no account", async () => {
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "nobody@example.com" });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/не найден/);
  });
});
