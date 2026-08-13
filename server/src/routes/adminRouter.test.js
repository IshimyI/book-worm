const request = require("supertest");
const app = require("../app");
const { sequelize, User, Book, Review, PageView } = require("../../db/models");

async function signupAndLogin(email, isAdmin = false) {
  const res = await request(app).post("/api/auth/signup").send({
    name: "Test User",
    email,
    password: "password123",
  });
  if (isAdmin) {
    await User.update({ isAdmin: true }, { where: { id: res.body.user.id } });
  }
  return { userId: res.body.user.id, accessToken: res.body.accessToken };
}

async function createReportedReview() {
  const author = await signupAndLogin("author@example.com");
  const book = await Book.create({ title: "Reported Book", author: "Some Author", genre: "Роман" });
  const review = await Review.create({
    bookId: book.id,
    userId: author.userId,
    body: "Спорная рецензия",
    user_rating: 3,
    reportCount: 3,
  });
  return { book, review };
}

beforeEach(async () => {
  await Review.destroy({ where: {}, truncate: true, cascade: true });
  await Book.destroy({ where: {}, truncate: true, cascade: true });
  await User.destroy({ where: {}, truncate: true, cascade: true });
  await PageView.destroy({ where: {}, truncate: true, cascade: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe("admin routes", () => {
  it("blocks non-admin users", async () => {
    const { accessToken } = await signupAndLogin("regular@example.com");
    const res = await request(app)
      .get("/api/admin/reported-reviews")
      .set("Authorization", `Bearer ${accessToken}`);
    expect(res.status).toBe(403);
  });

  it("blocks unauthenticated requests", async () => {
    const res = await request(app).get("/api/admin/reported-reviews");
    expect(res.status).toBe(401);
  });

  it("lists reported reviews for an admin", async () => {
    const { review } = await createReportedReview();
    const admin = await signupAndLogin("admin@example.com", true);

    const res = await request(app)
      .get("/api/admin/reported-reviews")
      .set("Authorization", `Bearer ${admin.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe(review.id);
    expect(res.body[0].reportCount).toBe(3);
  });

  it("dismisses reports and un-hides the review", async () => {
    const { review, book } = await createReportedReview();
    const admin = await signupAndLogin("admin2@example.com", true);

    const res = await request(app)
      .post(`/api/admin/reviews/${review.id}/dismiss`)
      .set("Authorization", `Bearer ${admin.accessToken}`);

    expect(res.status).toBe(200);
    await review.reload();
    expect(review.reportCount).toBe(0);
    const updatedBook = await Book.findByPk(book.id);
    expect(Number(updatedBook.quantity_rate)).toBe(1);
  });

  it("lets an admin delete any review", async () => {
    const { review } = await createReportedReview();
    const admin = await signupAndLogin("admin3@example.com", true);

    const res = await request(app)
      .delete(`/api/admin/reviews/${review.id}`)
      .set("Authorization", `Bearer ${admin.accessToken}`);

    expect(res.status).toBe(200);
    expect(await Review.findByPk(review.id)).toBeNull();
  });
});

describe("analytics", () => {
  it("blocks non-admins from the analytics summary", async () => {
    const { accessToken } = await signupAndLogin("regular2@example.com");
    const res = await request(app).get("/api/admin/analytics").set("Authorization", `Bearer ${accessToken}`);
    expect(res.status).toBe(403);
  });

  it("records a pageview without authentication", async () => {
    const res = await request(app).post("/api/analytics/pageview").send({ path: "/books/1" });
    expect(res.status).toBe(204);
  });

  it("ignores a pageview with no path instead of erroring", async () => {
    const res = await request(app).post("/api/analytics/pageview").send({});
    expect(res.status).toBe(204);
  });

  it("summarizes pageviews for an admin: total, top paths, top referrers", async () => {
    await request(app).post("/api/analytics/pageview").send({ path: "/books/1", referrer: "https://google.com" });
    await request(app).post("/api/analytics/pageview").send({ path: "/books/1" });
    await request(app).post("/api/analytics/pageview").send({ path: "/" });

    const admin = await signupAndLogin("analytics-admin@example.com", true);
    const res = await request(app).get("/api/admin/analytics").set("Authorization", `Bearer ${admin.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.totalViews).toBe(3);
    expect(res.body.topPaths[0]).toEqual({ path: "/books/1", count: 2 });
    expect(res.body.topReferrers[0]).toEqual({ referrer: "https://google.com", count: 1 });
    expect(res.body.viewsByDay.length).toBeGreaterThan(0);
  });
});
