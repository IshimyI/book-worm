const request = require("supertest");
const app = require("../app");
const { sequelize, User, Book, Review } = require("../../db/models");

async function signupAndLogin(email) {
  const res = await request(app).post("/api/auth/signup").send({
    name: "Reviewer",
    email,
    password: "password123",
  });
  return { userId: res.body.user.id, accessToken: res.body.accessToken };
}

beforeEach(async () => {
  await Review.destroy({ where: {}, truncate: true, cascade: true });
  await Book.destroy({ where: {}, truncate: true, cascade: true });
  await User.destroy({ where: {}, truncate: true, cascade: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe("POST /api/book/new", () => {
  it("requires authentication", async () => {
    const res = await request(app).post("/api/book/new").send({
      user_id: 1,
      title: "Some Book",
      author: "Some Author",
      body: "Great read",
      user_rating: 5,
    });

    expect(res.status).toBe(401);
  });

  it("rejects submitting a review under someone else's user_id", async () => {
    const { accessToken } = await signupAndLogin("author1@example.com");

    const res = await request(app)
      .post("/api/book/new")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        user_id: 999999,
        title: "Some Book",
        author: "Some Author",
        body: "Great read",
        user_rating: 5,
      });

    expect(res.status).toBe(403);
  });

  it("creates a book and review for the authenticated user", async () => {
    const { userId, accessToken } = await signupAndLogin("author2@example.com");

    const res = await request(app)
      .post("/api/book/new")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        user_id: userId,
        title: "Dune",
        author: "Frank Herbert",
        body: "Great read",
        user_rating: 5,
      });

    expect(res.status).toBe(200);
    expect(res.body.book.title).toBe("Dune");
    expect(res.body.review.user_rating).toBe(5);
  });

  it("rejects a review body containing profanity", async () => {
    const { userId, accessToken } = await signupAndLogin("author3@example.com");

    const res = await request(app)
      .post("/api/book/new")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        user_id: userId,
        title: "Some Book",
        author: "Some Author",
        body: "это просто хуйня",
        user_rating: 1,
      });

    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/review/:id", () => {
  async function createReview(email) {
    const { userId, accessToken } = await signupAndLogin(email);
    const createRes = await request(app)
      .post("/api/book/new")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        user_id: userId,
        title: "Shared Book",
        author: "Shared Author",
        body: "Initial review",
        user_rating: 4,
      });
    return { userId, accessToken, reviewId: createRes.body.review.id };
  }

  it("refuses to delete someone else's review", async () => {
    const { reviewId } = await createReview("owner@example.com");
    const { accessToken: otherToken } = await signupAndLogin("intruder@example.com");

    const res = await request(app)
      .delete(`/api/review/${reviewId}`)
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.status).toBe(403);
    expect(await Review.findByPk(reviewId)).not.toBeNull();
  });

  it("lets the owner delete their own review", async () => {
    const { accessToken, reviewId } = await createReview("owner2@example.com");

    const res = await request(app)
      .delete(`/api/review/${reviewId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(await Review.findByPk(reviewId)).toBeNull();
  });
});

describe("POST /api/updateFavourites/:id", () => {
  it("refuses to change another user's favourites", async () => {
    const { accessToken } = await signupAndLogin("fav1@example.com");
    const other = await signupAndLogin("fav2@example.com");

    const res = await request(app)
      .post(`/api/updateFavourites/${other.userId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ bookId: 1 });

    expect(res.status).toBe(403);
  });

  it("toggles a book into and out of the user's favourites", async () => {
    const { userId, accessToken } = await signupAndLogin("fav3@example.com");
    const book = await Book.create({ title: "Fav Book", author: "Fav Author", genre: "Роман" });

    const addRes = await request(app)
      .post(`/api/updateFavourites/${userId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ bookId: book.id });
    expect(addRes.status).toBe(200);
    expect(addRes.body.favourites.split(" ")).toContain(String(book.id));

    const removeRes = await request(app)
      .post(`/api/updateFavourites/${userId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ bookId: book.id });
    expect(removeRes.status).toBe(200);
    expect(removeRes.body.favourites.split(" ")).not.toContain(String(book.id));
  });
});
