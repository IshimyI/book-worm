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

describe("GET /api/users/:id/profile", () => {
  it("paginates a user's reviews", async () => {
    const { userId, accessToken } = await signupAndLogin("prolific@example.com");
    for (let i = 0; i < 12; i++) {
      await request(app)
        .post("/api/book/new")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          user_id: userId,
          title: `Book ${i}`,
          author: "Some Author",
          body: "Review body",
          user_rating: 4,
        });
    }

    const page1 = await request(app).get(`/api/users/${userId}/profile`).query({ pageSize: 10 });
    expect(page1.status).toBe(200);
    expect(page1.body.reviews).toHaveLength(10);
    expect(page1.body.reviewCount).toBe(12);
    expect(page1.body.totalPages).toBe(2);

    const page2 = await request(app).get(`/api/users/${userId}/profile`).query({ pageSize: 10, page: 2 });
    expect(page2.body.reviews).toHaveLength(2);
  });
});

describe("GET /api/listAllBooks", () => {
  beforeEach(async () => {
    await Book.bulkCreate([
      { title: "Alpha", author: "Author A", genre: "Роман", year: 2000, rating: "3.50", quantity_rate: 2 },
      { title: "Beta", author: "Author B", genre: "Фэнтези", year: 2010, rating: "4.80", quantity_rate: 5 },
      { title: "Gamma", author: "Author A", genre: "Роман", year: 2020, rating: null, quantity_rate: 0 },
    ]);
  });

  it("paginates results", async () => {
    const res = await request(app).get("/api/listAllBooks").query({ pageSize: 2, page: 1 });
    expect(res.status).toBe(200);
    expect(res.body.books).toHaveLength(2);
    expect(res.body.total).toBe(3);
    expect(res.body.totalPages).toBe(2);
  });

  it("filters by minRating using a numeric comparison, not string", async () => {
    const res = await request(app).get("/api/listAllBooks").query({ minRating: "4" });
    expect(res.status).toBe(200);
    expect(res.body.books.map((b) => b.title)).toEqual(["Beta"]);
  });

  it("filters by genre and author", async () => {
    const res = await request(app).get("/api/listAllBooks").query({ genre: "Роман", author: "Author A" });
    expect(res.status).toBe(200);
    expect(res.body.books.map((b) => b.title).sort()).toEqual(["Alpha", "Gamma"]);
  });

  it("searches title/author/annotation", async () => {
    const res = await request(app).get("/api/listAllBooks").query({ search: "Beta" });
    expect(res.status).toBe(200);
    expect(res.body.books.map((b) => b.title)).toEqual(["Beta"]);
  });

  it("returns facets for filter dropdowns", async () => {
    const res = await request(app).get("/api/listAllBooks");
    expect(res.body.facets.genres.sort()).toEqual(["Роман", "Фэнтези"]);
    expect(res.body.facets.authors.sort()).toEqual(["Author A", "Author B"]);
  });

  it("sorts unrated books last regardless of direction", async () => {
    const asc = await request(app).get("/api/listAllBooks").query({ sortBy: "rating", sortDir: "asc" });
    expect(asc.body.books.map((b) => b.title)).toEqual(["Alpha", "Beta", "Gamma"]);
  });
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

  it("soft-deletes: the row survives (audit trail) but is hidden from normal queries", async () => {
    const { reviewId } = await createReview("owner3@example.com").then(async (ctx) => {
      await request(app).delete(`/api/review/${ctx.reviewId}`).set("Authorization", `Bearer ${ctx.accessToken}`);
      return ctx;
    });

    expect(await Review.findByPk(reviewId)).toBeNull();
    const withDeleted = await Review.findByPk(reviewId, { paranoid: false });
    expect(withDeleted).not.toBeNull();
    expect(withDeleted.deletedAt).not.toBeNull();
  });

  it("lets a user write a new review for the same book after deleting the old one", async () => {
    const { userId, accessToken, reviewId } = await createReview("owner4@example.com");
    await request(app).delete(`/api/review/${reviewId}`).set("Authorization", `Bearer ${accessToken}`);

    const res = await request(app)
      .post("/api/book/new")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        user_id: userId,
        title: "Shared Book",
        author: "Shared Author",
        body: "Second try",
        user_rating: 5,
      });

    // The unique(bookId, userId) constraint must not see the soft-deleted
    // row as a conflict — otherwise this would 500.
    expect(res.status).toBe(200);
    expect(res.body.review.id).not.toBe(reviewId);
    expect(res.body.review.body).toBe("Second try");
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

describe("POST /api/review/:id/helpful", () => {
  async function createReview() {
    const author = await signupAndLogin("author@example.com");
    const book = await Book.create({ title: "Voted Book", author: "Some Author", genre: "Роман" });
    const review = await Review.create({ bookId: book.id, userId: author.userId, body: "Отличная книга", user_rating: 5 });
    return { book, review };
  }

  it("requires authentication", async () => {
    const { review } = await createReview();
    const res = await request(app).post(`/api/review/${review.id}/helpful`);
    expect(res.status).toBe(401);
  });

  it("refuses to let the author vote their own review helpful", async () => {
    const { review } = await createReview();
    const author = await request(app).post("/api/auth/login").send({ email: "author@example.com", password: "password123" });
    const res = await request(app)
      .post(`/api/review/${review.id}/helpful`)
      .set("Authorization", `Bearer ${author.body.accessToken}`);
    expect(res.status).toBe(400);
  });

  it("toggles a helpful vote and updates the count", async () => {
    const { review } = await createReview();
    const voter = await signupAndLogin("voter@example.com");

    const voteRes = await request(app)
      .post(`/api/review/${review.id}/helpful`)
      .set("Authorization", `Bearer ${voter.accessToken}`);
    expect(voteRes.status).toBe(200);
    expect(voteRes.body).toEqual({ helpful: true, helpfulCount: 1 });

    const unvoteRes = await request(app)
      .post(`/api/review/${review.id}/helpful`)
      .set("Authorization", `Bearer ${voter.accessToken}`);
    expect(unvoteRes.status).toBe(200);
    expect(unvoteRes.body).toEqual({ helpful: false, helpfulCount: 0 });
  });

  it("reflects the count and the viewer's own vote on the book detail route", async () => {
    const { book, review } = await createReview();
    const voter = await signupAndLogin("voter2@example.com");

    await request(app)
      .post(`/api/review/${review.id}/helpful`)
      .set("Authorization", `Bearer ${voter.accessToken}`);

    const asVoter = await request(app)
      .get(`/api/book/${book.id}`)
      .set("Authorization", `Bearer ${voter.accessToken}`);
    expect(asVoter.body.reviews[0].helpfulCount).toBe(1);
    expect(asVoter.body.reviews[0].helpfulByMe).toBe(true);

    const anonymous = await request(app).get(`/api/book/${book.id}`);
    expect(anonymous.body.reviews[0].helpfulCount).toBe(1);
    expect(anonymous.body.reviews[0].helpfulByMe).toBe(false);
  });
});
