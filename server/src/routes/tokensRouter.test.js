const request = require("supertest");
const app = require("../app");
const { sequelize, User } = require("../../db/models");

beforeEach(async () => {
  await User.destroy({ where: {}, truncate: true, cascade: true });
});

afterAll(async () => {
  await sequelize.close();
});

function refreshCookieFrom(res) {
  const setCookie = res.headers["set-cookie"] || [];
  const line = setCookie.find((c) => c.startsWith("refreshToken="));
  return line ? line.split(";")[0] : null;
}

async function signup(email) {
  const res = await request(app).post("/api/auth/signup").send({
    name: "Reuse Test",
    email,
    password: "password123",
  });
  return refreshCookieFrom(res);
}

describe("GET /api/tokens/refresh", () => {
  it("rotates a valid refresh token", async () => {
    const cookie = await signup("rotate@example.com");
    const res = await request(app).get("/api/tokens/refresh").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(refreshCookieFrom(res)).not.toBe(cookie);
  });

  it("tolerates two concurrent refreshes on the same cookie (benign race)", async () => {
    const cookie = await signup("race@example.com");

    const [a, b] = await Promise.all([
      request(app).get("/api/tokens/refresh").set("Cookie", cookie),
      request(app).get("/api/tokens/refresh").set("Cookie", cookie),
    ]);

    // Neither concurrent caller should be treated as a thief — both get a
    // usable session, and it isn't torn down for either of them.
    expect(a.status).toBe(200);
    expect(b.status).toBe(200);

    const winnerCookie = refreshCookieFrom(a);
    const followUp = await request(app).get("/api/tokens/refresh").set("Cookie", winnerCookie);
    expect(followUp.status).toBe(200);
  });

  it("revokes the whole session when a genuinely stale token is replayed", async () => {
    const original = await signup("stale@example.com");
    const rotatedOnce = refreshCookieFrom(
      await request(app).get("/api/tokens/refresh").set("Cookie", original)
    );
    const rotatedTwice = refreshCookieFrom(
      await request(app).get("/api/tokens/refresh").set("Cookie", rotatedOnce)
    );

    // `original` is now two generations behind — outside the grace period's
    // single-generation tolerance, so this must be treated as reuse.
    const replay = await request(app).get("/api/tokens/refresh").set("Cookie", original);
    expect(replay.status).toBe(401);

    // The whole session should be dead now, including the otherwise-valid
    // latest cookie.
    const afterRevoke = await request(app).get("/api/tokens/refresh").set("Cookie", rotatedTwice);
    expect(afterRevoke.status).toBe(401);
  });

  it("rejects a refresh with no cookie", async () => {
    const res = await request(app).get("/api/tokens/refresh");
    expect(res.status).toBe(401);
  });
});
