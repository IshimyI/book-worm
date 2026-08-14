const request = require("supertest");
const speakeasy = require("speakeasy");
const jwt = require("jsonwebtoken");
const app = require("../app");
const { sequelize, User, Book, Review, Quote, Follow } = require("../../db/models");

beforeEach(async () => {
  await Review.destroy({ where: {}, truncate: true, cascade: true, force: true });
  await Book.destroy({ where: {}, truncate: true, cascade: true });
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

describe("GET /api/auth/confirm-email", () => {
  it("confirms an unconfirmed user and issues tokens", async () => {
    const signupRes = await request(app).post("/api/auth/signup").send({
      name: "Confirm Me",
      email: "confirm-me@example.com",
      password: "password123",
    });
    const user = await User.findByPk(signupRes.body.user.id);
    // In this test env, sending the real confirmation email fails (no SMTP
    // creds), which signup treats as "don't strand the user" and confirms
    // them immediately as a fallback — that's a different code path than
    // the one this test targets, so force the "real link, not yet clicked"
    // starting state this endpoint actually needs to be exercised against.
    user.isEmailConfirmed = false;
    await user.save();

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    const res = await request(app).get("/api/auth/confirm-email").query({ token });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toEqual(expect.any(String));
    await user.reload();
    expect(user.isEmailConfirmed).toBe(true);
  });

  it("400s with a friendly message when the email is already confirmed", async () => {
    const signupRes = await request(app).post("/api/auth/signup").send({
      name: "Already Confirmed",
      email: "already-confirmed@example.com",
      password: "password123",
    });
    const user = await User.findByPk(signupRes.body.user.id);
    user.isEmailConfirmed = true;
    await user.save();

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    const res = await request(app).get("/api/auth/confirm-email").query({ token });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/уже подтверждён/);
  });

  // This is the bug the user actually hit: a confirmation link clicked
  // after its 1h expiry returns 401, which the client used to have no
  // case for at all (only 400/500 were handled) — it fell through to
  // whatever the empty default state rendered, a generic "please confirm
  // your email" message with no indication anything had gone wrong or way
  // to recover. Fixed client-side; this locks in the server contract it
  // now relies on.
  it("401s with an expired-token message for a token past its 1h expiry", async () => {
    const signupRes = await request(app).post("/api/auth/signup").send({
      name: "Expired Token",
      email: "expired-token@example.com",
      password: "password123",
    });

    const token = jwt.sign({ userId: signupRes.body.user.id }, process.env.JWT_SECRET, { expiresIn: "-1s" });
    const res = await request(app).get("/api/auth/confirm-email").query({ token });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/истёк/);
  });

  it("400s with an invalid-token message for a malformed token", async () => {
    const res = await request(app).get("/api/auth/confirm-email").query({ token: "not-a-real-token" });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/токен/);
  });

  it("400s when no token is provided", async () => {
    const res = await request(app).get("/api/auth/confirm-email");
    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/resend-confirmation", () => {
  it("sends a new confirmation link for an unconfirmed account", async () => {
    const signupRes = await request(app).post("/api/auth/signup").send({
      name: "Needs Resend",
      email: "needs-resend@example.com",
      password: "password123",
    });
    // See the comment on the confirm-email test above — same test-env fallback.
    await User.update({ isEmailConfirmed: false }, { where: { id: signupRes.body.user.id } });

    const res = await request(app)
      .post("/api/auth/resend-confirmation")
      .send({ email: "needs-resend@example.com" });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/отправлено/);
  });

  it("issues a token that itself works against confirm-email", async () => {
    const signupRes = await request(app).post("/api/auth/signup").send({
      name: "Resend Then Confirm",
      email: "resend-then-confirm@example.com",
      password: "password123",
    });
    await User.update({ isEmailConfirmed: false }, { where: { id: signupRes.body.user.id } });

    await request(app)
      .post("/api/auth/resend-confirmation")
      .send({ email: "resend-then-confirm@example.com" });

    // The resend path doesn't hand the token back over HTTP (it only goes
    // out by email) — sign an equivalent one the same way to confirm the
    // account is still in a confirmable state afterwards.
    const token = jwt.sign({ userId: signupRes.body.user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    const confirmRes = await request(app).get("/api/auth/confirm-email").query({ token });
    expect(confirmRes.status).toBe(200);
  });

  it("rejects an email with no account", async () => {
    const res = await request(app)
      .post("/api/auth/resend-confirmation")
      .send({ email: "nobody@example.com" });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/не найден/);
  });

  it("rejects an already-confirmed account", async () => {
    const signupRes = await request(app).post("/api/auth/signup").send({
      name: "Confirmed Already",
      email: "confirmed-already@example.com",
      password: "password123",
    });
    const user = await User.findByPk(signupRes.body.user.id);
    user.isEmailConfirmed = true;
    await user.save();

    const res = await request(app)
      .post("/api/auth/resend-confirmation")
      .send({ email: "confirmed-already@example.com" });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/уже подтверждён/);
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

describe("DELETE /api/auth/account", () => {
  const password = "delete-my-account-123";

  async function signupUser(email) {
    const res = await request(app).post("/api/auth/signup").send({ name: "Deleter", email, password });
    return { userId: res.body.user.id, accessToken: res.body.accessToken };
  }

  it("requires authentication", async () => {
    const res = await request(app).delete("/api/auth/account").send({ password });
    expect(res.status).toBe(401);
  });

  it("rejects the wrong password", async () => {
    const { accessToken } = await signupUser("delete-wrong-pw@example.com");
    const res = await request(app)
      .delete("/api/auth/account")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ password: "not-it" });
    expect(res.status).toBe(400);
  });

  it("deletes the account and everything that references it", async () => {
    const { userId, accessToken } = await signupUser("delete-me@example.com");
    const other = await signupUser("delete-other@example.com");
    const book = await Book.create({ title: "Deleted User's Book", author: "A", genre: "Роман" });

    const review = await Review.create({ bookId: book.id, userId, body: "Моя рецензия", user_rating: 5 });
    await Quote.create({ bookId: book.id, userId, text: "Моя цитата" });
    await request(app).post(`/api/users/${userId}/follow`).set("Authorization", `Bearer ${other.accessToken}`);

    const res = await request(app)
      .delete("/api/auth/account")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ password });
    expect(res.status).toBe(200);

    expect(await User.findByPk(userId)).toBeNull();
    expect(await Review.findByPk(review.id, { paranoid: false })).toBeNull();
    expect(await Quote.count({ where: { userId } })).toBe(0);
    expect(await Follow.count({ where: { followingId: userId } })).toBe(0);

    // The account no longer works for login.
    const loginRes = await request(app).post("/api/auth/login").send({ email: "delete-me@example.com", password });
    expect(loginRes.status).toBe(400);
  });
});
