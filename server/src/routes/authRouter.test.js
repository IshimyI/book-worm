const request = require("supertest");
const speakeasy = require("speakeasy");
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

describe("two-factor authentication", () => {
  async function signupAndLogin(email) {
    const res = await request(app).post("/api/auth/signup").send({
      name: "2FA User",
      email,
      password: "password123",
    });
    return { accessToken: res.body.accessToken, password: "password123" };
  }

  async function enableTwoFactor(accessToken) {
    const setupRes = await request(app)
      .post("/api/auth/2fa/setup")
      .set("Authorization", `Bearer ${accessToken}`);
    const validCode = speakeasy.totp({ secret: setupRes.body.secret, encoding: "base32" });
    const enableRes = await request(app)
      .post("/api/auth/2fa/enable")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ token: validCode });
    return { secret: setupRes.body.secret, recoveryCodes: enableRes.body.recoveryCodes, enableRes };
  }

  it("requires authentication to set up 2FA", async () => {
    const res = await request(app).post("/api/auth/2fa/setup");
    expect(res.status).toBe(401);
  });

  it("returns a QR code and secret from setup", async () => {
    const { accessToken } = await signupAndLogin("2fa-setup@example.com");
    const res = await request(app)
      .post("/api/auth/2fa/setup")
      .set("Authorization", `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.secret).toEqual(expect.any(String));
    expect(res.body.qrCodeDataUrl).toMatch(/^data:image\/png;base64,/);
  });

  it("rejects enabling with a wrong code", async () => {
    const { accessToken } = await signupAndLogin("2fa-wrong@example.com");
    await request(app).post("/api/auth/2fa/setup").set("Authorization", `Bearer ${accessToken}`);
    const res = await request(app)
      .post("/api/auth/2fa/enable")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ token: "000000" });
    expect(res.status).toBe(400);
  });

  it("enables 2FA with a valid code and returns one-time recovery codes", async () => {
    const { accessToken } = await signupAndLogin("2fa-enable@example.com");
    const { recoveryCodes, enableRes } = await enableTwoFactor(accessToken);
    expect(enableRes.status).toBe(200);
    expect(recoveryCodes).toHaveLength(8);
  });

  it("login returns a challenge instead of tokens once 2FA is enabled", async () => {
    const { accessToken, password } = await signupAndLogin("2fa-login@example.com");
    await enableTwoFactor(accessToken);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "2fa-login@example.com", password });
    expect(res.status).toBe(200);
    expect(res.body.requiresTwoFactor).toBe(true);
    expect(res.body.challengeToken).toEqual(expect.any(String));
    expect(res.body.accessToken).toBeUndefined();
  });

  it("completes login with a valid TOTP code after the challenge", async () => {
    const { accessToken, password } = await signupAndLogin("2fa-verify@example.com");
    const { secret } = await enableTwoFactor(accessToken);

    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "2fa-verify@example.com", password });

    const verifyRes = await request(app)
      .post("/api/auth/2fa/verify-login")
      .send({ challengeToken: loginRes.body.challengeToken, token: speakeasy.totp({ secret, encoding: "base32" }) });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.accessToken).toEqual(expect.any(String));
  });

  it("rejects a wrong code at the verify-login step", async () => {
    const { accessToken, password } = await signupAndLogin("2fa-verify-wrong@example.com");
    await enableTwoFactor(accessToken);
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "2fa-verify-wrong@example.com", password });

    const verifyRes = await request(app)
      .post("/api/auth/2fa/verify-login")
      .send({ challengeToken: loginRes.body.challengeToken, token: "000000" });
    expect(verifyRes.status).toBe(400);
  });

  it("accepts a recovery code as a one-time substitute and then rejects reuse", async () => {
    const { accessToken, password } = await signupAndLogin("2fa-recovery@example.com");
    const { recoveryCodes } = await enableTwoFactor(accessToken);
    const recoveryCode = recoveryCodes[0];

    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "2fa-recovery@example.com", password });
    const firstUse = await request(app)
      .post("/api/auth/2fa/verify-login")
      .send({ challengeToken: loginRes.body.challengeToken, token: recoveryCode });
    expect(firstUse.status).toBe(200);

    const secondLoginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "2fa-recovery@example.com", password });
    const secondUse = await request(app)
      .post("/api/auth/2fa/verify-login")
      .send({ challengeToken: secondLoginRes.body.challengeToken, token: recoveryCode });
    expect(secondUse.status).toBe(400);
  });

  it("disables 2FA with the correct password and restores normal login", async () => {
    const { accessToken, password } = await signupAndLogin("2fa-disable@example.com");
    await enableTwoFactor(accessToken);

    const wrongPasswordRes = await request(app)
      .post("/api/auth/2fa/disable")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ password: "not-the-password" });
    expect(wrongPasswordRes.status).toBe(400);

    const disableRes = await request(app)
      .post("/api/auth/2fa/disable")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ password });
    expect(disableRes.status).toBe(200);

    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "2fa-disable@example.com", password });
    expect(loginRes.body.requiresTwoFactor).toBeUndefined();
    expect(loginRes.body.accessToken).toEqual(expect.any(String));
  });
});
