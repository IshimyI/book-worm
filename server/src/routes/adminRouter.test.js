const request = require("supertest");
const app = require("../app");
const { sequelize, User, Book, Review, PageView, SecurityEvent } = require("../../db/models");

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
  await SecurityEvent.destroy({ where: {}, truncate: true, cascade: true });
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

describe("security event log", () => {
  it("blocks non-admins", async () => {
    const { accessToken } = await signupAndLogin("regular3@example.com");
    const res = await request(app).get("/api/admin/security-events").set("Authorization", `Bearer ${accessToken}`);
    expect(res.status).toBe(403);
  });

  it("lists security events, most recent first", async () => {
    await SecurityEvent.create({ type: "failed_login", email: "a@example.com", ip: "1.1.1.1", detail: "wrong_password" });
    await SecurityEvent.create({ type: "rate_limited", ip: "2.2.2.2", detail: "/auth/login" });

    const admin = await signupAndLogin("security-admin@example.com", true);
    const res = await request(app).get("/api/admin/security-events").set("Authorization", `Bearer ${admin.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    expect(res.body.events[0].type).toBe("rate_limited");
    expect(res.body.events[1].type).toBe("failed_login");
    expect(res.body.types.sort()).toEqual(["failed_login", "rate_limited"]);
  });

  it("filters by type", async () => {
    await SecurityEvent.create({ type: "failed_login", email: "a@example.com", ip: "1.1.1.1" });
    await SecurityEvent.create({ type: "rate_limited", ip: "2.2.2.2" });

    const admin = await signupAndLogin("security-admin2@example.com", true);
    const res = await request(app)
      .get("/api/admin/security-events")
      .query({ type: "rate_limited" })
      .set("Authorization", `Bearer ${admin.accessToken}`);

    expect(res.body.events).toHaveLength(1);
    expect(res.body.events[0].type).toBe("rate_limited");
  });

  it("paginates", async () => {
    for (let i = 0; i < 5; i++) {
      // eslint-disable-next-line no-await-in-loop
      await SecurityEvent.create({ type: "failed_login", ip: `1.1.1.${i}` });
    }
    const admin = await signupAndLogin("security-admin3@example.com", true);
    const res = await request(app)
      .get("/api/admin/security-events")
      .query({ pageSize: 2, page: 2 })
      .set("Authorization", `Bearer ${admin.accessToken}`);

    expect(res.body.events).toHaveLength(2);
    expect(res.body.totalPages).toBe(3);
  });
});

describe("site stats", () => {
  it("blocks non-admins", async () => {
    const { accessToken } = await signupAndLogin("regular4@example.com");
    const res = await request(app).get("/api/admin/stats").set("Authorization", `Bearer ${accessToken}`);
    expect(res.status).toBe(403);
  });

  it("returns totals, growth series and top books", async () => {
    const author = await signupAndLogin("stats-author@example.com");
    const author2 = await signupAndLogin("stats-author2@example.com");
    const bookA = await Book.create({ title: "Popular Book", author: "Author A", genre: "Роман" });
    const bookB = await Book.create({ title: "Quiet Book", author: "Author B", genre: "Роман" });
    await Review.create({ bookId: bookA.id, userId: author.userId, body: "Отлично", user_rating: 5 });
    await Review.create({ bookId: bookA.id, userId: author2.userId, body: "Ещё раз", user_rating: 4 });
    await Review.create({ bookId: bookB.id, userId: author.userId, body: "Неплохо", user_rating: 3 });

    const admin = await signupAndLogin("stats-admin@example.com", true);
    const res = await request(app).get("/api/admin/stats").set("Authorization", `Bearer ${admin.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.totalUsers).toBeGreaterThanOrEqual(2);
    expect(res.body.totalReviews).toBe(3);
    expect(res.body.totalBooks).toBe(2);
    expect(res.body.usersByDay.length).toBeGreaterThan(0);
    expect(res.body.reviewsByDay.length).toBeGreaterThan(0);
    expect(res.body.topBooks[0]).toMatchObject({ id: bookA.id, title: "Popular Book", reviewCount: 2 });
  });
});

describe("book moderation queue", () => {
  async function submitPendingBook(email) {
    const { userId, accessToken } = await signupAndLogin(email);
    const res = await request(app)
      .post("/api/book/new")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ user_id: userId, title: `Pending Book ${email}`, author: "Someone", body: "Отзыв", user_rating: 4 });
    return { book: res.body.book, submitterEmail: email };
  }

  it("blocks non-admins", async () => {
    const { accessToken } = await signupAndLogin("regular5@example.com");
    const res = await request(app).get("/api/admin/pending-books").set("Authorization", `Bearer ${accessToken}`);
    expect(res.status).toBe(403);
  });

  it("lists pending books with the submitter's info", async () => {
    const { book, submitterEmail } = await submitPendingBook("pending-submitter@example.com");
    const admin = await signupAndLogin("pending-admin1@example.com", true);

    const res = await request(app).get("/api/admin/pending-books").set("Authorization", `Bearer ${admin.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe(book.id);
    expect(res.body[0].submittedBy.email).toBe(submitterEmail);
  });

  it("approves a pending book, making it visible in the public catalog", async () => {
    const { book } = await submitPendingBook("pending-submitter2@example.com");
    const admin = await signupAndLogin("pending-admin2@example.com", true);

    const approveRes = await request(app)
      .post(`/api/admin/books/${book.id}/approve`)
      .set("Authorization", `Bearer ${admin.accessToken}`);
    expect(approveRes.status).toBe(200);

    const updated = await Book.findByPk(book.id);
    expect(updated.status).toBe("approved");

    const listRes = await request(app).get("/api/listAllBooks");
    expect(listRes.body.books.map((b) => b.id)).toContain(book.id);
  });

  it("rejects (deletes) a pending book", async () => {
    const { book } = await submitPendingBook("pending-submitter3@example.com");
    const admin = await signupAndLogin("pending-admin3@example.com", true);

    const res = await request(app)
      .delete(`/api/admin/books/${book.id}`)
      .set("Authorization", `Bearer ${admin.accessToken}`);
    expect(res.status).toBe(200);
    expect(await Book.findByPk(book.id)).toBeNull();
  });
});
