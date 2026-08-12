const request = require("supertest");
const app = require("../app");
const { sequelize, User, Book, Review } = require("../../db/models");

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
