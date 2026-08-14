const fs = require("fs");
const path = require("path");
const request = require("supertest");
const app = require("../app");
const { sequelize, User, Book, Review, Quote, PageView, UserReport } = require("../../db/models");
const { AVATAR_DIR } = require("../middlewares/uploadAvatar");
const { AVATAR_SIZE } = require("../utils/avatarImage");
const { loadImage } = require("@napi-rs/canvas");

// A minimal valid 1x1 PNG, just enough for multer/the fileFilter to accept it.
const ONE_PIXEL_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64"
);

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

  it("includes bio and the reviewer's most-reviewed genres", async () => {
    const { userId, accessToken } = await signupAndLogin("genre-fan@example.com");
    const romanBook1 = await Book.create({ title: "Roman 1", author: "A", genre: "Роман" });
    const romanBook2 = await Book.create({ title: "Roman 2", author: "B", genre: "Роман" });
    const horrorBook = await Book.create({ title: "Horror 1", author: "C", genre: "Хоррор" });
    await Review.create({ bookId: romanBook1.id, userId, body: "r1", user_rating: 5 });
    await Review.create({ bookId: romanBook2.id, userId, body: "r2", user_rating: 4 });
    await Review.create({ bookId: horrorBook.id, userId, body: "r3", user_rating: 3 });

    await request(app).patch("/api/users/me/bio").set("Authorization", `Bearer ${accessToken}`).send({ bio: "Люблю классику" });

    const res = await request(app).get(`/api/users/${userId}/profile`);
    expect(res.body.bio).toBe("Люблю классику");
    expect(res.body.topGenres[0]).toBe("Роман");
  });

  it("reports achievement progress and unlocks based on the user's activity", async () => {
    const { userId, accessToken } = await signupAndLogin("achiever@example.com");

    const fresh = await request(app).get(`/api/users/${userId}/profile`);
    const firstReview = fresh.body.achievements.find((a) => a.id === "first_review");
    expect(firstReview.achieved).toBe(false);
    expect(firstReview.progress).toBe(0);

    const book = await Book.create({ title: "Achiever Book", author: "A", genre: "Роман" });
    await Review.create({ bookId: book.id, userId, body: "Отзыв", user_rating: 5 });
    await Quote.create({ bookId: book.id, userId, text: "Цитата" });
    await request(app)
      .post(`/api/book/${book.id}/reading-status`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ status: "read" });

    const res = await request(app).get(`/api/users/${userId}/profile`);
    const byId = Object.fromEntries(res.body.achievements.map((a) => [a.id, a]));
    expect(byId.first_review.achieved).toBe(true);
    expect(byId.first_book_read.achieved).toBe(true);
    expect(byId.quote_collector.achieved).toBe(false);
    expect(byId.quote_collector.progress).toBe(1);
    expect(byId.prolific_reviewer.achieved).toBe(false);
  });
});

describe("GET /api/users/me/export", () => {
  it("requires authentication", async () => {
    const res = await request(app).get("/api/users/me/export");
    expect(res.status).toBe(401);
  });

  it("bundles the user's profile, reviews, quotes, and reading status into one JSON payload", async () => {
    const { userId, accessToken } = await signupAndLogin("exporter@example.com");
    const book = await Book.create({ title: "Exported Book", author: "A", genre: "Роман" });
    await Review.create({ bookId: book.id, userId, body: "Отличная книга", user_rating: 5 });
    await Quote.create({ bookId: book.id, userId, text: "Запоминающаяся цитата" });
    await request(app)
      .post(`/api/book/${book.id}/reading-status`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ status: "read" });
    await request(app).post("/api/reading-challenge").set("Authorization", `Bearer ${accessToken}`).send({ goal: 10 });

    const res = await request(app).get("/api/users/me/export").set("Authorization", `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.headers["content-disposition"]).toContain("attachment");
    expect(res.body.profile.email).toBe("exporter@example.com");
    expect(res.body.reviews).toHaveLength(1);
    expect(res.body.reviews[0].bookTitle).toBe("Exported Book");
    expect(res.body.quotes).toHaveLength(1);
    expect(res.body.readingStatuses[0].status).toBe("read");
    expect(res.body.readingChallenges[0].goal).toBe(10);
  });
});

describe("PATCH /api/users/me/bio", () => {
  it("requires authentication", async () => {
    const res = await request(app).patch("/api/users/me/bio").send({ bio: "Привет" });
    expect(res.status).toBe(401);
  });

  it("sets and clears a bio", async () => {
    const { userId, accessToken } = await signupAndLogin("bio-user@example.com");

    const setRes = await request(app)
      .patch("/api/users/me/bio")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ bio: "Читаю фантастику по вечерам" });
    expect(setRes.status).toBe(200);
    expect(setRes.body.bio).toBe("Читаю фантастику по вечерам");

    const clearRes = await request(app)
      .patch("/api/users/me/bio")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ bio: "" });
    expect(clearRes.body.bio).toBeNull();

    const profileRes = await request(app).get(`/api/users/${userId}/profile`);
    expect(profileRes.body.bio).toBeNull();
  });

  it("rejects a bio over the length limit", async () => {
    const { accessToken } = await signupAndLogin("bio-toolong@example.com");
    const res = await request(app)
      .patch("/api/users/me/bio")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ bio: "a".repeat(501) });
    expect(res.status).toBe(400);
  });
});

describe("GET /api/book/random", () => {
  it("returns 404 when the catalog has no approved books", async () => {
    await Book.create({ title: "Pending Only", author: "A", genre: "Роман", status: "pending" });
    const res = await request(app).get("/api/book/random");
    expect(res.status).toBe(404);
  });

  it("returns an approved book, never a pending one", async () => {
    const approved = await Book.create({ title: "Approved Book", author: "A", genre: "Роман", status: "approved" });
    await Book.create({ title: "Pending Book", author: "B", genre: "Роман", status: "pending" });

    const res = await request(app).get("/api/book/random");
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(approved.id);
  });
});

describe("GET /api/trending", () => {
  it("ranks books by pageviews in the last 7 days, excluding pending books and old views", async () => {
    const popular = await Book.create({ title: "Popular Book", author: "A", genre: "Роман", status: "approved" });
    const lessPopular = await Book.create({ title: "Less Popular Book", author: "B", genre: "Роман", status: "approved" });
    const pending = await Book.create({ title: "Pending Book", author: "C", genre: "Роман", status: "pending" });

    for (let i = 0; i < 3; i++) {
      // eslint-disable-next-line no-await-in-loop
      await request(app).post("/api/analytics/pageview").send({ path: `/books/${popular.id}` });
    }
    await request(app).post("/api/analytics/pageview").send({ path: `/books/${lessPopular.id}` });
    await request(app).post("/api/analytics/pageview").send({ path: `/books/${pending.id}` });
    // An old view outside the 7-day window shouldn't count.
    const oldView = await PageView.create({ path: `/books/${lessPopular.id}` });
    await oldView.update({ createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) });

    const res = await request(app).get("/api/trending");
    expect(res.status).toBe(200);
    const ids = res.body.map((b) => b.id);
    expect(ids[0]).toBe(popular.id);
    expect(ids).toContain(lessPopular.id);
    expect(ids).not.toContain(pending.id);
    expect(res.body.find((b) => b.id === popular.id).viewCount).toBe(3);
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

  it("matches the genre filter against additionalGenres too, not just the primary genre", async () => {
    await Book.create({ title: "Delta", author: "Author D", genre: "Хоррор", additionalGenres: ["Роман"], year: 2015, rating: "4.00" });
    const res = await request(app).get("/api/listAllBooks").query({ genre: "Роман" });
    expect(res.status).toBe(200);
    expect(res.body.books.map((b) => b.title).sort()).toEqual(["Alpha", "Delta", "Gamma"]);
  });

  it("includes additionalGenres in the genre facet list", async () => {
    await Book.create({ title: "Epsilon", author: "Author E", genre: "Хоррор", additionalGenres: ["Готика"], year: 2018, rating: "3.00" });
    const res = await request(app).get("/api/listAllBooks");
    expect(res.body.facets.genres).toContain("Готика");
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

  it("marks a newly submitted book as pending, hidden from the public catalog until approved", async () => {
    const { userId, accessToken } = await signupAndLogin("author-pending@example.com");

    const created = await request(app)
      .post("/api/book/new")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ user_id: userId, title: "Unmoderated Book", author: "Someone", body: "Great read", user_rating: 5 });
    expect(created.body.book.status).toBe("pending");

    const listRes = await request(app).get("/api/listAllBooks").query({ search: "Unmoderated Book" });
    expect(listRes.body.books.map((b) => b.title)).not.toContain("Unmoderated Book");

    const bookRes = await request(app).get(`/api/book/${created.body.book.id}`);
    expect(bookRes.body.status).toBe("pending");
  });

  it("treats a case/whitespace-different title+author as the same book instead of duplicating it", async () => {
    const first = await signupAndLogin("dedup-exact-1@example.com");
    const second = await signupAndLogin("dedup-exact-2@example.com");

    const originalRes = await request(app)
      .post("/api/book/new")
      .set("Authorization", `Bearer ${first.accessToken}`)
      .send({ user_id: first.userId, title: "Дюна", author: "Фрэнк Герберт", body: "Отзыв 1", user_rating: 5 });

    const duplicateRes = await request(app)
      .post("/api/book/new")
      .set("Authorization", `Bearer ${second.accessToken}`)
      .send({ user_id: second.userId, title: "  дюна ", author: " фрэнк герберт", body: "Отзыв 2", user_rating: 4 });

    expect(duplicateRes.body.book.id).toBe(originalRes.body.book.id);
    expect(await Book.count()).toBe(1);
  });

  it("routes a near-typo duplicate to the existing book instead of creating a new one", async () => {
    const first = await signupAndLogin("dedup-fuzzy-1@example.com");
    const second = await signupAndLogin("dedup-fuzzy-2@example.com");

    const originalRes = await request(app)
      .post("/api/book/new")
      .set("Authorization", `Bearer ${first.accessToken}`)
      .send({ user_id: first.userId, title: "Мастер и Маргарита", author: "Михаил Булгаков", body: "Отзыв 1", user_rating: 5 });

    const typoRes = await request(app)
      .post("/api/book/new")
      .set("Authorization", `Bearer ${second.accessToken}`)
      .send({ user_id: second.userId, title: "Мастер и Маргарита.", author: "Михаил Булгаков", body: "Отзыв 2", user_rating: 4 });

    expect(typoRes.body.book.id).toBe(originalRes.body.book.id);
    expect(typoRes.body.possibleDuplicateOf).toMatchObject({ id: originalRes.body.book.id });
    expect(await Book.count()).toBe(1);
  });

  it("does not merge clearly different books by the same author", async () => {
    const { userId, accessToken } = await signupAndLogin("dedup-different@example.com");

    await request(app)
      .post("/api/book/new")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ user_id: userId, title: "Первая книга", author: "Один Автор", body: "Отзыв 1", user_rating: 5 });
    const secondRes = await request(app)
      .post("/api/book/new")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ user_id: userId, title: "Совершенно другая история", author: "Один Автор", body: "Отзыв 2", user_rating: 4 });

    expect(secondRes.body.possibleDuplicateOf).toBeNull();
    expect(await Book.count()).toBe(2);
  });

  it("sanitizes additionalGenres: dedupes, drops a value matching the primary genre, and caps the count", async () => {
    const { userId, accessToken } = await signupAndLogin("author-genres@example.com");

    const res = await request(app)
      .post("/api/book/new")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        user_id: userId,
        title: "Tagged Dune",
        author: "Frank Herbert",
        genre: "Фантастика",
        additionalGenres: ["Роман", "Фантастика", "Роман", "A", "B", "C", "D", "E"],
        body: "Great read",
        user_rating: 5,
      });

    expect(res.status).toBe(200);
    expect(res.body.book.additionalGenres).toEqual(["Роман", "A", "B", "C", "D"]);
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

describe("review comments", () => {
  async function createReview() {
    const author = await signupAndLogin("commented-author@example.com");
    const book = await Book.create({ title: "Commented Book", author: "Some Author", genre: "Роман" });
    const review = await Review.create({ bookId: book.id, userId: author.userId, body: "Хорошая книга", user_rating: 5 });
    return { book, review };
  }

  it("requires authentication to post a comment", async () => {
    const { review } = await createReview();
    const res = await request(app).post(`/api/review/${review.id}/comments`).send({ body: "Согласен!" });
    expect(res.status).toBe(401);
  });

  it("rejects an empty comment", async () => {
    const { review } = await createReview();
    const commenter = await signupAndLogin("commenter@example.com");
    const res = await request(app)
      .post(`/api/review/${review.id}/comments`)
      .set("Authorization", `Bearer ${commenter.accessToken}`)
      .send({ body: "   " });
    expect(res.status).toBe(400);
  });

  it("posts a comment, bumps commentCount, and lists it publicly", async () => {
    const { review } = await createReview();
    const commenter = await signupAndLogin("commenter2@example.com");

    const postRes = await request(app)
      .post(`/api/review/${review.id}/comments`)
      .set("Authorization", `Bearer ${commenter.accessToken}`)
      .send({ body: "Согласен, отличная книга!" });
    expect(postRes.status).toBe(200);
    expect(postRes.body.body).toBe("Согласен, отличная книга!");

    await review.reload();
    expect(review.commentCount).toBe(1);

    const listRes = await request(app).get(`/api/review/${review.id}/comments`);
    expect(listRes.status).toBe(200);
    expect(listRes.body).toHaveLength(1);
    expect(listRes.body[0].userName).toBe("Reviewer");
  });

  it("lets the author delete their own comment and decrements the count", async () => {
    const { review } = await createReview();
    const commenter = await signupAndLogin("commenter3@example.com");
    const postRes = await request(app)
      .post(`/api/review/${review.id}/comments`)
      .set("Authorization", `Bearer ${commenter.accessToken}`)
      .send({ body: "Мнение" });

    const deleteRes = await request(app)
      .delete(`/api/review/${review.id}/comments/${postRes.body.id}`)
      .set("Authorization", `Bearer ${commenter.accessToken}`);
    expect(deleteRes.status).toBe(200);

    await review.reload();
    expect(review.commentCount).toBe(0);
  });

  it("refuses to let another user delete someone else's comment", async () => {
    const { review } = await createReview();
    const commenter = await signupAndLogin("commenter4@example.com");
    const stranger = await signupAndLogin("stranger2@example.com");
    const postRes = await request(app)
      .post(`/api/review/${review.id}/comments`)
      .set("Authorization", `Bearer ${commenter.accessToken}`)
      .send({ body: "Мнение" });

    const deleteRes = await request(app)
      .delete(`/api/review/${review.id}/comments/${postRes.body.id}`)
      .set("Authorization", `Bearer ${stranger.accessToken}`);
    expect(deleteRes.status).toBe(403);
  });

  it("nests a reply under its parent in the comment list", async () => {
    const { review } = await createReview();
    const commenter = await signupAndLogin("thread-parent@example.com");
    const replier = await signupAndLogin("thread-replier@example.com");

    const parentRes = await request(app)
      .post(`/api/review/${review.id}/comments`)
      .set("Authorization", `Bearer ${commenter.accessToken}`)
      .send({ body: "Родительский комментарий" });

    const replyRes = await request(app)
      .post(`/api/review/${review.id}/comments`)
      .set("Authorization", `Bearer ${replier.accessToken}`)
      .send({ body: "Ответ", parentCommentId: parentRes.body.id });
    expect(replyRes.status).toBe(200);
    expect(replyRes.body.parentCommentId).toBe(parentRes.body.id);

    await review.reload();
    expect(review.commentCount).toBe(2);

    const listRes = await request(app).get(`/api/review/${review.id}/comments`);
    expect(listRes.body).toHaveLength(1);
    expect(listRes.body[0].replies).toHaveLength(1);
    expect(listRes.body[0].replies[0].body).toBe("Ответ");
  });

  it("refuses to reply to a reply (only one level of nesting)", async () => {
    const { review } = await createReview();
    const commenter = await signupAndLogin("thread-parent2@example.com");
    const replier = await signupAndLogin("thread-replier2@example.com");
    const secondReplier = await signupAndLogin("thread-replier3@example.com");

    const parentRes = await request(app)
      .post(`/api/review/${review.id}/comments`)
      .set("Authorization", `Bearer ${commenter.accessToken}`)
      .send({ body: "Родитель" });
    const replyRes = await request(app)
      .post(`/api/review/${review.id}/comments`)
      .set("Authorization", `Bearer ${replier.accessToken}`)
      .send({ body: "Ответ", parentCommentId: parentRes.body.id });

    const nestedReplyRes = await request(app)
      .post(`/api/review/${review.id}/comments`)
      .set("Authorization", `Bearer ${secondReplier.accessToken}`)
      .send({ body: "Ответ на ответ", parentCommentId: replyRes.body.id });
    expect(nestedReplyRes.status).toBe(400);
  });

  it("notifies the parent comment's author on a reply, not the review author", async () => {
    const { review } = await createReview();
    const commenter = await signupAndLogin("thread-notify-parent@example.com");
    const replier = await signupAndLogin("thread-notify-replier@example.com");

    const parentRes = await request(app)
      .post(`/api/review/${review.id}/comments`)
      .set("Authorization", `Bearer ${commenter.accessToken}`)
      .send({ body: "Родитель" });
    await request(app)
      .post(`/api/review/${review.id}/comments`)
      .set("Authorization", `Bearer ${replier.accessToken}`)
      .send({ body: "Ответ", parentCommentId: parentRes.body.id });

    const parentNotifs = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${commenter.accessToken}`);
    expect(parentNotifs.body.notifications.some((n) => n.type === "comment_reply")).toBe(true);
  });

  it("deleting a parent comment also clears the review's commentCount for its replies", async () => {
    const { review } = await createReview();
    const commenter = await signupAndLogin("thread-cascade@example.com");
    const replier = await signupAndLogin("thread-cascade-replier@example.com");

    const parentRes = await request(app)
      .post(`/api/review/${review.id}/comments`)
      .set("Authorization", `Bearer ${commenter.accessToken}`)
      .send({ body: "Родитель" });
    await request(app)
      .post(`/api/review/${review.id}/comments`)
      .set("Authorization", `Bearer ${replier.accessToken}`)
      .send({ body: "Ответ", parentCommentId: parentRes.body.id });

    await request(app)
      .delete(`/api/review/${review.id}/comments/${parentRes.body.id}`)
      .set("Authorization", `Bearer ${commenter.accessToken}`);

    await review.reload();
    expect(review.commentCount).toBe(0);

    const listRes = await request(app).get(`/api/review/${review.id}/comments`);
    expect(listRes.body).toHaveLength(0);
  });
});

describe("follows and feed", () => {
  it("requires authentication to follow", async () => {
    const target = await signupAndLogin("followtarget@example.com");
    const res = await request(app).post(`/api/users/${target.userId}/follow`);
    expect(res.status).toBe(401);
  });

  it("refuses to follow yourself", async () => {
    const { userId, accessToken } = await signupAndLogin("solo@example.com");
    const res = await request(app)
      .post(`/api/users/${userId}/follow`)
      .set("Authorization", `Bearer ${accessToken}`);
    expect(res.status).toBe(400);
  });

  it("toggles a follow and updates counts on the target's profile", async () => {
    const target = await signupAndLogin("target@example.com");
    const follower = await signupAndLogin("follower@example.com");

    const followRes = await request(app)
      .post(`/api/users/${target.userId}/follow`)
      .set("Authorization", `Bearer ${follower.accessToken}`);
    expect(followRes.status).toBe(200);
    expect(followRes.body).toEqual({ following: true, followerCount: 1 });

    const profileAsFollower = await request(app)
      .get(`/api/users/${target.userId}/profile`)
      .set("Authorization", `Bearer ${follower.accessToken}`);
    expect(profileAsFollower.body.followerCount).toBe(1);
    expect(profileAsFollower.body.isFollowedByMe).toBe(true);

    const profileAnonymous = await request(app).get(`/api/users/${target.userId}/profile`);
    expect(profileAnonymous.body.followerCount).toBe(1);
    expect(profileAnonymous.body.isFollowedByMe).toBe(false);

    const unfollowRes = await request(app)
      .post(`/api/users/${target.userId}/follow`)
      .set("Authorization", `Bearer ${follower.accessToken}`);
    expect(unfollowRes.status).toBe(200);
    expect(unfollowRes.body).toEqual({ following: false, followerCount: 0 });
  });

  it("shows reviews from followed users in the feed, not from everyone", async () => {
    const followed = await signupAndLogin("followed@example.com");
    const notFollowed = await signupAndLogin("notfollowed@example.com");
    const viewer = await signupAndLogin("viewer@example.com");

    const book1 = await Book.create({ title: "Followed's Book", author: "A", genre: "Роман" });
    const book2 = await Book.create({ title: "Stranger's Book", author: "B", genre: "Роман" });
    await Review.create({ bookId: book1.id, userId: followed.userId, body: "Отзыв от того, на кого подписан", user_rating: 5 });
    await Review.create({ bookId: book2.id, userId: notFollowed.userId, body: "Отзыв от постороннего", user_rating: 4 });

    await request(app)
      .post(`/api/users/${followed.userId}/follow`)
      .set("Authorization", `Bearer ${viewer.accessToken}`);

    const feedRes = await request(app).get("/api/feed").set("Authorization", `Bearer ${viewer.accessToken}`);
    expect(feedRes.status).toBe(200);
    expect(feedRes.body.reviews).toHaveLength(1);
    expect(feedRes.body.reviews[0].userId).toBe(followed.userId);
  });

  it("requires authentication for the feed", async () => {
    const res = await request(app).get("/api/feed");
    expect(res.status).toBe(401);
  });
});

describe("blocking a user", () => {
  it("requires authentication", async () => {
    const target = await signupAndLogin("blocktarget1@example.com");
    const res = await request(app).post(`/api/users/${target.userId}/block`);
    expect(res.status).toBe(401);
  });

  it("refuses to block yourself", async () => {
    const { userId, accessToken } = await signupAndLogin("blocksolo@example.com");
    const res = await request(app).post(`/api/users/${userId}/block`).set("Authorization", `Bearer ${accessToken}`);
    expect(res.status).toBe(400);
  });

  it("toggles a block and hides the blocked user's reviews and comments from the blocker", async () => {
    const blocked = await signupAndLogin("blocked1@example.com");
    const blocker = await signupAndLogin("blocker1@example.com");
    const book = await Book.create({ title: "Blocked Author Book", author: "A", genre: "Роман" });
    const ownReview = await Review.create({ bookId: book.id, userId: blocker.userId, body: "Мой отзыв", user_rating: 4 });
    await Review.create({ bookId: book.id, userId: blocked.userId, body: "Отзыв заблокированного", user_rating: 3 });
    await request(app)
      .post(`/api/review/${ownReview.id}/comments`)
      .set("Authorization", `Bearer ${blocked.accessToken}`)
      .send({ body: "Комментарий заблокированного" });

    const blockRes = await request(app)
      .post(`/api/users/${blocked.userId}/block`)
      .set("Authorization", `Bearer ${blocker.accessToken}`);
    expect(blockRes.status).toBe(200);
    expect(blockRes.body).toEqual({ blocked: true });

    const bookRes = await request(app)
      .get(`/api/book/${book.id}`)
      .set("Authorization", `Bearer ${blocker.accessToken}`);
    expect(bookRes.body.reviews.map((r) => r.user_id)).toEqual([blocker.userId]);

    const commentsRes = await request(app)
      .get(`/api/review/${ownReview.id}/comments`)
      .set("Authorization", `Bearer ${blocker.accessToken}`);
    expect(commentsRes.body).toHaveLength(0);

    // Someone else (not the blocker) still sees everything.
    const bookAsAnonymous = await request(app).get(`/api/book/${book.id}`);
    expect(bookAsAnonymous.body.reviews).toHaveLength(2);

    const unblockRes = await request(app)
      .post(`/api/users/${blocked.userId}/block`)
      .set("Authorization", `Bearer ${blocker.accessToken}`);
    expect(unblockRes.body).toEqual({ blocked: false });

    const bookAfterUnblock = await request(app)
      .get(`/api/book/${book.id}`)
      .set("Authorization", `Bearer ${blocker.accessToken}`);
    expect(bookAfterUnblock.body.reviews).toHaveLength(2);
  });

  it("lists blocked users and removes any existing follow relationship on block", async () => {
    const blocked = await signupAndLogin("blocked2@example.com");
    const blocker = await signupAndLogin("blocker2@example.com");
    await request(app).post(`/api/users/${blocked.userId}/follow`).set("Authorization", `Bearer ${blocker.accessToken}`);

    await request(app).post(`/api/users/${blocked.userId}/block`).set("Authorization", `Bearer ${blocker.accessToken}`);

    const listRes = await request(app).get("/api/users/me/blocked").set("Authorization", `Bearer ${blocker.accessToken}`);
    expect(listRes.body.map((u) => u.id)).toEqual([blocked.userId]);

    const profileRes = await request(app)
      .get(`/api/users/${blocked.userId}/profile`)
      .set("Authorization", `Bearer ${blocker.accessToken}`);
    expect(profileRes.body.isFollowedByMe).toBe(false);
    expect(profileRes.body.isBlockedByMe).toBe(true);
  });
});

describe("reporting a user", () => {
  it("requires authentication", async () => {
    const target = await signupAndLogin("reporttarget1@example.com");
    const res = await request(app).post(`/api/users/${target.userId}/report`).send({ reason: "spam" });
    expect(res.status).toBe(401);
  });

  it("refuses to report yourself", async () => {
    const { userId, accessToken } = await signupAndLogin("reportsolo@example.com");
    const res = await request(app).post(`/api/users/${userId}/report`).set("Authorization", `Bearer ${accessToken}`).send({});
    expect(res.status).toBe(400);
  });

  it("submits a report and resubmitting updates the reason instead of duplicating", async () => {
    const target = await signupAndLogin("reporttarget2@example.com");
    const reporter = await signupAndLogin("reporter1@example.com");

    const res = await request(app)
      .post(`/api/users/${target.userId}/report`)
      .set("Authorization", `Bearer ${reporter.accessToken}`)
      .send({ reason: "Спам в комментариях" });
    expect(res.status).toBe(200);

    const again = await request(app)
      .post(`/api/users/${target.userId}/report`)
      .set("Authorization", `Bearer ${reporter.accessToken}`)
      .send({ reason: "Оскорбления" });
    expect(again.status).toBe(200);

    expect(await UserReport.count({ where: { reportedId: target.userId } })).toBe(1);
    const report = await UserReport.findOne({ where: { reportedId: target.userId } });
    expect(report.reason).toBe("Оскорбления");
  });
});

describe("GET /api/users/suggestions", () => {
  it("requires authentication", async () => {
    const res = await request(app).get("/api/users/suggestions");
    expect(res.status).toBe(401);
  });

  it("suggests reviewers who share a genre with the viewer, excluding self/followed/blocked", async () => {
    const viewer = await signupAndLogin("suggest-viewer@example.com");
    const sharedGenreUser = await signupAndLogin("suggest-shared@example.com");
    const alreadyFollowed = await signupAndLogin("suggest-followed@example.com");
    const blocked = await signupAndLogin("suggest-blocked@example.com");
    const differentGenreUser = await signupAndLogin("suggest-different@example.com");

    const romanBook = await Book.create({ title: "Suggest Roman", author: "A", genre: "Роман" });
    const horrorBook = await Book.create({ title: "Suggest Horror", author: "B", genre: "Хоррор" });

    await Review.create({ bookId: romanBook.id, userId: viewer.userId, body: "r", user_rating: 5 });
    await Review.create({ bookId: romanBook.id, userId: sharedGenreUser.userId, body: "r", user_rating: 4 });
    await Review.create({ bookId: romanBook.id, userId: alreadyFollowed.userId, body: "r", user_rating: 4 });
    await Review.create({ bookId: romanBook.id, userId: blocked.userId, body: "r", user_rating: 4 });
    await Review.create({ bookId: horrorBook.id, userId: differentGenreUser.userId, body: "r", user_rating: 4 });

    await request(app).post(`/api/users/${alreadyFollowed.userId}/follow`).set("Authorization", `Bearer ${viewer.accessToken}`);
    await request(app).post(`/api/users/${blocked.userId}/block`).set("Authorization", `Bearer ${viewer.accessToken}`);

    const res = await request(app).get("/api/users/suggestions").set("Authorization", `Bearer ${viewer.accessToken}`);
    expect(res.status).toBe(200);
    const ids = res.body.map((u) => u.id);
    expect(ids).toContain(sharedGenreUser.userId);
    expect(ids).not.toContain(viewer.userId);
    expect(ids).not.toContain(alreadyFollowed.userId);
    expect(ids).not.toContain(blocked.userId);
    expect(ids).not.toContain(differentGenreUser.userId);
  });

  it("falls back to the most active reviewers when the viewer has no reviews yet", async () => {
    const viewer = await signupAndLogin("suggest-newuser@example.com");
    const activeReviewer = await signupAndLogin("suggest-active@example.com");
    const book = await Book.create({ title: "Suggest Fallback", author: "A", genre: "Роман" });
    await Review.create({ bookId: book.id, userId: activeReviewer.userId, body: "r", user_rating: 5 });

    const res = await request(app).get("/api/users/suggestions").set("Authorization", `Bearer ${viewer.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.map((u) => u.id)).toContain(activeReviewer.userId);
  });
});

describe("GET /api/book/:id/og-image.png", () => {
  it("returns a PNG image for a valid book", async () => {
    const book = await Book.create({ title: "OG Book", author: "A", genre: "Роман", rating: "4.20", quantity_rate: 3 });
    const res = await request(app).get(`/api/book/${book.id}/og-image.png`);
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toBe("image/png");
    expect(res.body.length).toBeGreaterThan(1000);
  }, 15000);

  it("404s for a book that doesn't exist", async () => {
    const res = await request(app).get("/api/book/999999/og-image.png");
    expect(res.status).toBe(404);
  });

  it("renders without a cover image (falls back to a plain block)", async () => {
    const book = await Book.create({ title: "No Cover Book", author: "A", genre: "Роман" });
    const res = await request(app).get(`/api/book/${book.id}/og-image.png`);
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toBe("image/png");
  }, 15000);
});

describe("recommendations", () => {
  it("recommends books in the same genre, sorted by rating, excluding itself", async () => {
    const book = await Book.create({ title: "Base Book", author: "A", genre: "Фэнтези", rating: "4.00" });
    const better = await Book.create({ title: "Better Match", author: "B", genre: "Фэнтези", rating: "4.80" });
    const worse = await Book.create({ title: "Worse Match", author: "C", genre: "Фэнтези", rating: "3.20" });
    await Book.create({ title: "Wrong Genre", author: "D", genre: "Детектив", rating: "5.00" });

    const res = await request(app).get(`/api/book/${book.id}/recommendations`);
    expect(res.status).toBe(200);
    const ids = res.body.sameGenre.map((b) => b.id);
    expect(ids).not.toContain(book.id);
    expect(ids).toEqual([better.id, worse.id]);
  });

  it("matches on additionalGenres too, not just an exact primary-genre match", async () => {
    const book = await Book.create({ title: "Tagged Book", author: "A", genre: "Хоррор", additionalGenres: ["Готика"], rating: "4.00" });
    const matchByAdditional = await Book.create({ title: "Gothic Match", author: "B", genre: "Роман", additionalGenres: ["Готика"], rating: "4.50" });
    await Book.create({ title: "No Overlap", author: "C", genre: "Детектив", rating: "5.00" });

    const res = await request(app).get(`/api/book/${book.id}/recommendations`);
    expect(res.status).toBe(200);
    expect(res.body.sameGenre.map((b) => b.id)).toContain(matchByAdditional.id);
  });

  it("recommends books read by the same readers, ranked by overlap", async () => {
    const book = await Book.create({ title: "Anchor Book", author: "A", genre: "Роман" });
    const popularOverlap = await Book.create({ title: "Read By Both", author: "B", genre: "Хоррор" });
    const singleOverlap = await Book.create({ title: "Read By One", author: "C", genre: "Хоррор" });
    const unrelatedBook = await Book.create({ title: "Truly Unrelated", author: "E", genre: "Хоррор" });

    const reader1 = await signupAndLogin("reader1@example.com");
    const reader2 = await signupAndLogin("reader2@example.com");
    const reader3 = await signupAndLogin("reader3@example.com");

    await Review.create({ bookId: book.id, userId: reader1.userId, body: "r", user_rating: 5 });
    await Review.create({ bookId: book.id, userId: reader2.userId, body: "r", user_rating: 4 });
    await Review.create({ bookId: popularOverlap.id, userId: reader1.userId, body: "r", user_rating: 5 });
    await Review.create({ bookId: popularOverlap.id, userId: reader2.userId, body: "r", user_rating: 5 });
    await Review.create({ bookId: singleOverlap.id, userId: reader1.userId, body: "r", user_rating: 5 });
    await Review.create({ bookId: unrelatedBook.id, userId: reader3.userId, body: "r", user_rating: 5 });

    const res = await request(app).get(`/api/book/${book.id}/recommendations`);
    expect(res.status).toBe(200);
    const ids = res.body.sameReaders.map((b) => b.id);
    expect(ids[0]).toBe(popularOverlap.id);
    expect(ids).toContain(singleOverlap.id);
    expect(ids).not.toContain(unrelatedBook.id);
    expect(ids).not.toContain(book.id);
  });

  it("excludes pending books from same-readers recommendations", async () => {
    const book = await Book.create({ title: "Anchor Book 2", author: "A", genre: "Роман" });
    const pendingBook = await Book.create({ title: "Pending Overlap", author: "B", genre: "Роман", status: "pending" });
    const reader = await signupAndLogin("reader4@example.com");
    await Review.create({ bookId: book.id, userId: reader.userId, body: "r", user_rating: 5 });
    await Review.create({ bookId: pendingBook.id, userId: reader.userId, body: "r", user_rating: 5 });

    const res = await request(app).get(`/api/book/${book.id}/recommendations`);
    expect(res.body.sameReaders.map((b) => b.id)).not.toContain(pendingBook.id);
  });

  it("requires authentication for personalized recommendations", async () => {
    const res = await request(app).get("/api/recommendations");
    expect(res.status).toBe(401);
  });

  it("recommends top-rated books in the user's most-reviewed genre, excluding already-reviewed books", async () => {
    const { userId, accessToken } = await signupAndLogin("reco@example.com");
    const readBook = await Book.create({ title: "Already Read", author: "A", genre: "Роман", rating: "5.00" });
    await Review.create({ bookId: readBook.id, userId, body: "Прочитано", user_rating: 5 });

    const unreadInGenre = await Book.create({ title: "Should Recommend", author: "B", genre: "Роман", rating: "4.50" });
    await Book.create({ title: "Different Genre", author: "C", genre: "Хоррор", rating: "5.00" });

    const res = await request(app).get("/api/recommendations").set("Authorization", `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.basedOnGenre).toBe("Роман");
    const ids = res.body.books.map((b) => b.id);
    expect(ids).toContain(unreadInGenre.id);
    expect(ids).not.toContain(readBook.id);
  });
});

describe("POST /api/users/me/avatar", () => {
  afterEach(() => {
    for (const file of fs.readdirSync(AVATAR_DIR)) {
      fs.unlinkSync(path.join(AVATAR_DIR, file));
    }
  });

  it("requires authentication", async () => {
    const res = await request(app).post("/api/users/me/avatar").attach("avatar", ONE_PIXEL_PNG, "avatar.png");
    expect(res.status).toBe(401);
  });

  it("rejects a non-image file", async () => {
    const { accessToken } = await signupAndLogin("avatar1@example.com");
    const res = await request(app)
      .post("/api/users/me/avatar")
      .set("Authorization", `Bearer ${accessToken}`)
      .attach("avatar", Buffer.from("not an image"), { filename: "note.txt", contentType: "text/plain" });
    expect(res.status).toBe(400);
  });

  it("rejects when no file is attached", async () => {
    const { accessToken } = await signupAndLogin("avatar2@example.com");
    const res = await request(app).post("/api/users/me/avatar").set("Authorization", `Bearer ${accessToken}`);
    expect(res.status).toBe(400);
  });

  it("uploads an avatar and persists the URL on the user", async () => {
    const { userId, accessToken } = await signupAndLogin("avatar3@example.com");
    const res = await request(app)
      .post("/api/users/me/avatar")
      .set("Authorization", `Bearer ${accessToken}`)
      .attach("avatar", ONE_PIXEL_PNG, "avatar.png");

    expect(res.status).toBe(200);
    expect(res.body.avatarUrl).toMatch(/^\/uploads\/avatars\//);

    const user = await User.findByPk(userId);
    expect(user.avatarUrl).toBe(res.body.avatarUrl);
    expect(fs.existsSync(path.join(AVATAR_DIR, path.basename(user.avatarUrl)))).toBe(true);
  });

  it("replaces the previous avatar file when uploading a new one", async () => {
    const { accessToken } = await signupAndLogin("avatar4@example.com");
    const first = await request(app)
      .post("/api/users/me/avatar")
      .set("Authorization", `Bearer ${accessToken}`)
      .attach("avatar", ONE_PIXEL_PNG, "avatar.png");
    const firstPath = path.join(AVATAR_DIR, path.basename(first.body.avatarUrl));
    expect(fs.existsSync(firstPath)).toBe(true);

    const second = await request(app)
      .post("/api/users/me/avatar")
      .set("Authorization", `Bearer ${accessToken}`)
      .attach("avatar", ONE_PIXEL_PNG, "avatar.png");

    expect(second.body.avatarUrl).not.toBe(first.body.avatarUrl);
    expect(fs.existsSync(firstPath)).toBe(false);
  });

  it("re-encodes the uploaded image as a fixed-size WebP file", async () => {
    const { accessToken } = await signupAndLogin("avatar5@example.com");
    const res = await request(app)
      .post("/api/users/me/avatar")
      .set("Authorization", `Bearer ${accessToken}`)
      .attach("avatar", ONE_PIXEL_PNG, "avatar.png");

    expect(res.body.avatarUrl).toMatch(/\.webp$/);
    const buffer = fs.readFileSync(path.join(AVATAR_DIR, path.basename(res.body.avatarUrl)));
    expect(buffer.subarray(0, 4).toString("ascii")).toBe("RIFF");
    expect(buffer.subarray(8, 12).toString("ascii")).toBe("WEBP");

    const decoded = await loadImage(buffer);
    expect(decoded.width).toBe(AVATAR_SIZE);
    expect(decoded.height).toBe(AVATAR_SIZE);
  });

  it("rejects a corrupt file that passes the mimetype check", async () => {
    const { accessToken } = await signupAndLogin("avatar6@example.com");
    const res = await request(app)
      .post("/api/users/me/avatar")
      .set("Authorization", `Bearer ${accessToken}`)
      .attach("avatar", Buffer.from([0xff, 0xd8, 0xff, 0x00, 0x01, 0x02]), { filename: "broken.jpg", contentType: "image/jpeg" });
    expect(res.status).toBe(400);
  });
});

describe("reading status", () => {
  it("requires authentication to set a status", async () => {
    const book = await Book.create({ title: "Status Book", author: "A", genre: "Роман" });
    const res = await request(app).post(`/api/book/${book.id}/reading-status`).send({ status: "reading" });
    expect(res.status).toBe(401);
  });

  it("rejects an invalid status value", async () => {
    const { accessToken } = await signupAndLogin("status1@example.com");
    const book = await Book.create({ title: "Status Book 2", author: "A", genre: "Роман" });
    const res = await request(app)
      .post(`/api/book/${book.id}/reading-status`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ status: "on_fire" });
    expect(res.status).toBe(400);
  });

  it("sets, changes, and clears a reading status", async () => {
    const { accessToken } = await signupAndLogin("status2@example.com");
    const book = await Book.create({ title: "Status Book 3", author: "A", genre: "Роман" });

    const setRes = await request(app)
      .post(`/api/book/${book.id}/reading-status`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ status: "want_to_read" });
    expect(setRes.status).toBe(200);
    expect(setRes.body.status).toBe("want_to_read");

    const changeRes = await request(app)
      .post(`/api/book/${book.id}/reading-status`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ status: "reading" });
    expect(changeRes.body.status).toBe("reading");

    const bookRes = await request(app)
      .get(`/api/book/${book.id}`)
      .set("Authorization", `Bearer ${accessToken}`);
    expect(bookRes.body.readingStatus).toBe("reading");

    const clearRes = await request(app)
      .post(`/api/book/${book.id}/reading-status`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ status: null });
    expect(clearRes.body.status).toBeNull();

    const anonBookRes = await request(app).get(`/api/book/${book.id}`);
    expect(anonBookRes.body.readingStatus).toBeNull();
  });

  it("groups a user's books by status", async () => {
    const { accessToken } = await signupAndLogin("status3@example.com");
    const wantBook = await Book.create({ title: "Want Book", author: "A", genre: "Роман" });
    const readingBook = await Book.create({ title: "Reading Book", author: "B", genre: "Роман" });
    const readBook = await Book.create({ title: "Read Book", author: "C", genre: "Роман" });

    await request(app).post(`/api/book/${wantBook.id}/reading-status`).set("Authorization", `Bearer ${accessToken}`).send({ status: "want_to_read" });
    await request(app).post(`/api/book/${readingBook.id}/reading-status`).set("Authorization", `Bearer ${accessToken}`).send({ status: "reading" });
    await request(app).post(`/api/book/${readBook.id}/reading-status`).set("Authorization", `Bearer ${accessToken}`).send({ status: "read" });

    const res = await request(app).get("/api/reading-status").set("Authorization", `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.want_to_read.map((b) => b.id)).toEqual([wantBook.id]);
    expect(res.body.reading.map((b) => b.id)).toEqual([readingBook.id]);
    expect(res.body.read.map((b) => b.id)).toEqual([readBook.id]);
  });
});

describe("reading challenge", () => {
  it("requires authentication", async () => {
    const res = await request(app).get("/api/reading-challenge");
    expect(res.status).toBe(401);
  });

  it("has no goal set by default", async () => {
    const { accessToken } = await signupAndLogin("challenge1@example.com");
    const res = await request(app).get("/api/reading-challenge").set("Authorization", `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.goal).toBeNull();
    expect(res.body.completed).toBe(0);
    expect(res.body.year).toBe(new Date().getFullYear());
  });

  it("rejects a non-positive or absurdly large goal", async () => {
    const { accessToken } = await signupAndLogin("challenge2@example.com");
    const zero = await request(app).post("/api/reading-challenge").set("Authorization", `Bearer ${accessToken}`).send({ goal: 0 });
    expect(zero.status).toBe(400);
    const huge = await request(app).post("/api/reading-challenge").set("Authorization", `Bearer ${accessToken}`).send({ goal: 10000 });
    expect(huge.status).toBe(400);
  });

  it("sets a goal, updates it, and counts books finished this year", async () => {
    const { accessToken } = await signupAndLogin("challenge3@example.com");
    const setRes = await request(app).post("/api/reading-challenge").set("Authorization", `Bearer ${accessToken}`).send({ goal: 12 });
    expect(setRes.status).toBe(200);
    expect(setRes.body.goal).toBe(12);

    const updateRes = await request(app).post("/api/reading-challenge").set("Authorization", `Bearer ${accessToken}`).send({ goal: 20 });
    expect(updateRes.body.goal).toBe(20);

    const book1 = await Book.create({ title: "Challenge Book 1", author: "A", genre: "Роман" });
    const book2 = await Book.create({ title: "Challenge Book 2", author: "B", genre: "Роман" });
    await request(app).post(`/api/book/${book1.id}/reading-status`).set("Authorization", `Bearer ${accessToken}`).send({ status: "read" });
    await request(app).post(`/api/book/${book2.id}/reading-status`).set("Authorization", `Bearer ${accessToken}`).send({ status: "reading" });

    const res = await request(app).get("/api/reading-challenge").set("Authorization", `Bearer ${accessToken}`);
    expect(res.body.goal).toBe(20);
    expect(res.body.completed).toBe(1);
  });
});

describe("web push subscriptions", () => {
  it("reports push as unconfigured when no VAPID keys are set (test env)", async () => {
    const res = await request(app).get("/api/push/vapid-public-key");
    expect(res.status).toBe(200);
    expect(res.body.publicKey).toBeNull();
  });

  it("requires authentication to subscribe", async () => {
    const res = await request(app)
      .post("/api/push/subscribe")
      .send({ endpoint: "https://push.example.com/abc", keys: { p256dh: "key1", auth: "key2" } });
    expect(res.status).toBe(401);
  });

  it("rejects an incomplete subscription payload", async () => {
    const { accessToken } = await signupAndLogin("push-invalid@example.com");
    const res = await request(app)
      .post("/api/push/subscribe")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ endpoint: "https://push.example.com/abc" });
    expect(res.status).toBe(400);
  });

  it("saves a subscription and lets the owner remove it", async () => {
    const { accessToken } = await signupAndLogin("push-user@example.com");
    const endpoint = "https://push.example.com/unique-endpoint-1";

    const subscribeRes = await request(app)
      .post("/api/push/subscribe")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ endpoint, keys: { p256dh: "key1", auth: "key2" } });
    expect(subscribeRes.status).toBe(200);

    const unsubscribeRes = await request(app)
      .post("/api/push/unsubscribe")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ endpoint });
    expect(unsubscribeRes.status).toBe(200);
  });

  it("re-subscribing the same endpoint updates it instead of erroring on the unique index", async () => {
    const { accessToken } = await signupAndLogin("push-resub@example.com");
    const endpoint = "https://push.example.com/unique-endpoint-2";

    const first = await request(app)
      .post("/api/push/subscribe")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ endpoint, keys: { p256dh: "key1", auth: "key2" } });
    expect(first.status).toBe(200);

    const second = await request(app)
      .post("/api/push/subscribe")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ endpoint, keys: { p256dh: "key1-updated", auth: "key2-updated" } });
    expect(second.status).toBe(200);
  });
});

describe("notifications", () => {
  it("requires authentication", async () => {
    const res = await request(app).get("/api/notifications");
    expect(res.status).toBe(401);
  });

  it("notifies a user when someone follows them, but not on unfollow", async () => {
    const target = await signupAndLogin("notif-target@example.com");
    const follower = await signupAndLogin("notif-follower@example.com");

    await request(app).post(`/api/users/${target.userId}/follow`).set("Authorization", `Bearer ${follower.accessToken}`);

    const res = await request(app).get("/api/notifications").set("Authorization", `Bearer ${target.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.unreadCount).toBe(1);
    expect(res.body.notifications[0].type).toBe("new_follower");

    // Unfollowing shouldn't add a second notification.
    await request(app).post(`/api/users/${target.userId}/follow`).set("Authorization", `Bearer ${follower.accessToken}`);
    const afterUnfollow = await request(app).get("/api/notifications").set("Authorization", `Bearer ${target.accessToken}`);
    expect(afterUnfollow.body.notifications).toHaveLength(1);
  });

  it("notifies a review's author when someone comments on it, but not when they comment on their own", async () => {
    const author = await signupAndLogin("notif-author@example.com");
    const commenter = await signupAndLogin("notif-commenter@example.com");
    const book = await Book.create({ title: "Notified Book", author: "A", genre: "Роман" });
    const review = await Review.create({ bookId: book.id, userId: author.userId, body: "Отзыв", user_rating: 4 });

    await request(app)
      .post(`/api/review/${review.id}/comments`)
      .set("Authorization", `Bearer ${commenter.accessToken}`)
      .send({ body: "Комментарий" });

    const res = await request(app).get("/api/notifications").set("Authorization", `Bearer ${author.accessToken}`);
    expect(res.body.notifications).toHaveLength(1);
    expect(res.body.notifications[0].type).toBe("review_comment");
    expect(res.body.notifications[0].bookTitle).toBe("Notified Book");

    // Author commenting on their own review shouldn't self-notify.
    await request(app)
      .post(`/api/review/${review.id}/comments`)
      .set("Authorization", `Bearer ${author.accessToken}`)
      .send({ body: "Мой ответ" });
    const stillOne = await request(app).get("/api/notifications").set("Authorization", `Bearer ${author.accessToken}`);
    expect(stillOne.body.notifications).toHaveLength(1);
  });

  it("notifies a mentioned user, but not the comment author or a duplicate of the review-author notification", async () => {
    const author = await signupAndLogin("mention-author@example.com");
    const commenter = await signupAndLogin("mention-commenter@example.com");
    const mentionedRes = await request(app).post("/api/auth/signup").send({ name: "Alice", email: "mention-alice@example.com", password: "password123" });
    const mentioned = { userId: mentionedRes.body.user.id, accessToken: mentionedRes.body.accessToken };
    const book = await Book.create({ title: "Mention Book", author: "A", genre: "Роман" });
    const review = await Review.create({ bookId: book.id, userId: author.userId, body: "Отзыв", user_rating: 4 });

    await request(app)
      .post(`/api/review/${review.id}/comments`)
      .set("Authorization", `Bearer ${commenter.accessToken}`)
      .send({ body: "Привет, @Alice, глянь сюда!" });

    const aliceRes = await request(app).get("/api/notifications").set("Authorization", `Bearer ${mentioned.accessToken}`);
    expect(aliceRes.body.notifications).toHaveLength(1);
    expect(aliceRes.body.notifications[0].type).toBe("comment_mention");

    const commenterRes = await request(app).get("/api/notifications").set("Authorization", `Bearer ${commenter.accessToken}`);
    expect(commenterRes.body.notifications).toHaveLength(0);

    const authorRes = await request(app).get("/api/notifications").set("Authorization", `Bearer ${author.accessToken}`);
    expect(authorRes.body.notifications).toHaveLength(1);
    expect(authorRes.body.notifications[0].type).toBe("review_comment");
  });

  it("does not double-notify when the mentioned user is also the review author", async () => {
    const authorRes = await request(app).post("/api/auth/signup").send({ name: "Bob", email: "mention-bob@example.com", password: "password123" });
    const author = { userId: authorRes.body.user.id, accessToken: authorRes.body.accessToken };
    const commenter = await signupAndLogin("mention-commenter2@example.com");
    const book = await Book.create({ title: "Mention Book 2", author: "A", genre: "Роман" });
    const review = await Review.create({ bookId: book.id, userId: author.userId, body: "Отзыв", user_rating: 4 });

    await request(app)
      .post(`/api/review/${review.id}/comments`)
      .set("Authorization", `Bearer ${commenter.accessToken}`)
      .send({ body: "@Bob отличная рецензия!" });

    const res = await request(app).get("/api/notifications").set("Authorization", `Bearer ${author.accessToken}`);
    expect(res.body.notifications).toHaveLength(1);
  });

  it("marks a single notification as read", async () => {
    const target = await signupAndLogin("notif-read@example.com");
    const follower = await signupAndLogin("notif-read-follower@example.com");
    await request(app).post(`/api/users/${target.userId}/follow`).set("Authorization", `Bearer ${follower.accessToken}`);

    const listRes = await request(app).get("/api/notifications").set("Authorization", `Bearer ${target.accessToken}`);
    const notificationId = listRes.body.notifications[0].id;

    const readRes = await request(app)
      .post(`/api/notifications/${notificationId}/read`)
      .set("Authorization", `Bearer ${target.accessToken}`);
    expect(readRes.status).toBe(200);

    const afterRes = await request(app).get("/api/notifications").set("Authorization", `Bearer ${target.accessToken}`);
    expect(afterRes.body.unreadCount).toBe(0);
    expect(afterRes.body.notifications[0].isRead).toBe(true);
  });

  it("marks all notifications as read", async () => {
    const target = await signupAndLogin("notif-readall@example.com");
    const f1 = await signupAndLogin("notif-readall-f1@example.com");
    const f2 = await signupAndLogin("notif-readall-f2@example.com");
    await request(app).post(`/api/users/${target.userId}/follow`).set("Authorization", `Bearer ${f1.accessToken}`);
    await request(app).post(`/api/users/${target.userId}/follow`).set("Authorization", `Bearer ${f2.accessToken}`);

    const readAllRes = await request(app).post("/api/notifications/read-all").set("Authorization", `Bearer ${target.accessToken}`);
    expect(readAllRes.status).toBe(200);

    const afterRes = await request(app).get("/api/notifications").set("Authorization", `Bearer ${target.accessToken}`);
    expect(afterRes.body.unreadCount).toBe(0);
  });
});

describe("book quotes", () => {
  async function makeBook() {
    return Book.create({ title: "Quoted Book", author: "A", genre: "Роман" });
  }

  it("lists quotes for a book, newest first, without authentication", async () => {
    const book = await makeBook();
    const { accessToken } = await signupAndLogin("quoter1@example.com");
    await request(app)
      .post(`/api/book/${book.id}/quotes`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ text: "Первая цитата" });
    await request(app)
      .post(`/api/book/${book.id}/quotes`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ text: "Вторая цитата", page: 42 });

    const res = await request(app).get(`/api/book/${book.id}/quotes`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].text).toBe("Вторая цитата");
    expect(res.body[0].page).toBe(42);
    expect(res.body[0].author.name).toBe("Reviewer");
  });

  it("requires authentication to add a quote", async () => {
    const book = await makeBook();
    const res = await request(app).post(`/api/book/${book.id}/quotes`).send({ text: "Цитата" });
    expect(res.status).toBe(401);
  });

  it("rejects an empty quote", async () => {
    const book = await makeBook();
    const { accessToken } = await signupAndLogin("quoter2@example.com");
    const res = await request(app)
      .post(`/api/book/${book.id}/quotes`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ text: "   " });
    expect(res.status).toBe(400);
  });

  it("404s when adding a quote to a book that doesn't exist", async () => {
    const { accessToken } = await signupAndLogin("quoter3@example.com");
    const res = await request(app)
      .post(`/api/book/999999/quotes`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ text: "Цитата" });
    expect(res.status).toBe(404);
  });

  it("lets the author delete their own quote, but not someone else's", async () => {
    const book = await makeBook();
    const owner = await signupAndLogin("quoter4@example.com");
    const other = await signupAndLogin("quoter5@example.com");
    const created = await request(app)
      .post(`/api/book/${book.id}/quotes`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({ text: "Моя цитата" });

    const forbidden = await request(app)
      .delete(`/api/quotes/${created.body.id}`)
      .set("Authorization", `Bearer ${other.accessToken}`);
    expect(forbidden.status).toBe(403);

    const ok = await request(app)
      .delete(`/api/quotes/${created.body.id}`)
      .set("Authorization", `Bearer ${owner.accessToken}`);
    expect(ok.status).toBe(200);

    const list = await request(app).get(`/api/book/${book.id}/quotes`);
    expect(list.body).toHaveLength(0);
  });
});
