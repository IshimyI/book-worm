const request = require("supertest");
const app = require("../app");
const { sequelize, User, Book, Review, ReadingStatus } = require("../../db/models");

async function signupAndLogin(email) {
  const res = await request(app).post("/api/auth/signup").send({
    name: "Test User",
    email,
    password: "password123",
  });
  return { userId: res.body.user.id, accessToken: res.body.accessToken };
}

function goodreadsCsv(rows) {
  const header = "Title,Author,ISBN13,My Rating,My Review,Exclusive Shelf,Original Publication Year";
  const lines = rows.map(
    (r) =>
      `"${r.title}","${r.author}","=""${r.isbn ?? ""}""",${r.rating ?? 0},"${r.review ?? ""}",${r.shelf ?? "read"},${r.year ?? ""}`
  );
  return [header, ...lines].join("\n");
}

beforeEach(async () => {
  await ReadingStatus.destroy({ where: {}, truncate: true, cascade: true });
  await Review.destroy({ where: {}, truncate: true, cascade: true });
  await Book.destroy({ where: {}, truncate: true, cascade: true });
  await User.destroy({ where: {}, truncate: true, cascade: true });
  jest.restoreAllMocks();
});

afterAll(async () => {
  await sequelize.close();
});

describe("POST /api/import/goodreads", () => {
  it("blocks unauthenticated requests", async () => {
    const res = await request(app)
      .post("/api/import/goodreads")
      .attach("file", Buffer.from(goodreadsCsv([{ title: "A", author: "B" }])), "export.csv");
    expect(res.status).toBe(401);
  });

  it("400s when no file is attached", async () => {
    const { accessToken } = await signupAndLogin("importer1@example.com");
    const res = await request(app).post("/api/import/goodreads").set("Authorization", `Bearer ${accessToken}`);
    expect(res.status).toBe(400);
  });

  it("400s on a file that isn't parseable CSV", async () => {
    const { accessToken } = await signupAndLogin("importer2@example.com");
    const res = await request(app)
      .post("/api/import/goodreads")
      .set("Authorization", `Bearer ${accessToken}`)
      .attach("file", Buffer.from("just\x00some\x00garbage\x00\x01\x02"), "export.csv");
    expect(res.status).toBe(400);
  });

  it("matches an existing catalog book instead of creating a duplicate", async () => {
    const { userId, accessToken } = await signupAndLogin("importer3@example.com");
    const book = await Book.create({ title: "Дюна", author: "Фрэнк Герберт", genre: "Фантастика", status: "approved" });

    const csv = goodreadsCsv([{ title: "Дюна", author: "Фрэнк Герберт", rating: 5, review: "Отлично", shelf: "read" }]);
    const res = await request(app)
      .post("/api/import/goodreads")
      .set("Authorization", `Bearer ${accessToken}`)
      .attach("file", Buffer.from(csv), "export.csv");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ matched: 1, created: 0, skipped: 0 });

    const review = await Review.findOne({ where: { bookId: book.id, userId } });
    expect(review.user_rating).toBe(5);
    expect(review.body).toBe("Отлично");

    const status = await ReadingStatus.findOne({ where: { bookId: book.id, userId } });
    expect(status.status).toBe("read");

    const reloaded = await Book.findByPk(book.id);
    expect(Number(reloaded.rating)).toBe(5);
  });

  it("matches by ISBN even when the author name doesn't line up at all", async () => {
    // Realistic case: Goodreads always stores the Latin author name, this
    // catalog stores a Cyrillic transliteration — title+author matching
    // alone would never catch this as the same book.
    const { userId, accessToken } = await signupAndLogin("importer3b@example.com");
    const book = await Book.create({
      title: "Дюна",
      author: "Фрэнк Герберт",
      genre: "Фантастика",
      status: "approved",
      isbn: ["9780441013593"],
    });

    const csv = goodreadsCsv([{ title: "Dune", author: "Frank Herbert", isbn: "9780441013593", rating: 4, shelf: "read" }]);
    const res = await request(app)
      .post("/api/import/goodreads")
      .set("Authorization", `Bearer ${accessToken}`)
      .attach("file", Buffer.from(csv), "export.csv");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ matched: 1, created: 0 });

    const review = await Review.findOne({ where: { bookId: book.id, userId } });
    expect(review.user_rating).toBe(4);
  });

  it("creates a new pending book for a title not in the catalog", async () => {
    const { userId, accessToken } = await signupAndLogin("importer4@example.com");
    jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ docs: [{ cover_i: 12345, subject: ["Roman"], first_publish_year: 1999 }] }),
    });

    const csv = goodreadsCsv([{ title: "Совершенно новая книга XYZ", author: "Неизвестный автор", rating: 4, shelf: "to-read" }]);
    const res = await request(app)
      .post("/api/import/goodreads")
      .set("Authorization", `Bearer ${accessToken}`)
      .attach("file", Buffer.from(csv), "export.csv");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ matched: 0, created: 1, skipped: 0 });

    const created = await Book.findOne({ where: { title: "Совершенно новая книга XYZ" } });
    expect(created).not.toBeNull();
    expect(created.status).toBe("pending");
    expect(created.img).toContain("12345");

    const status = await ReadingStatus.findOne({ where: { bookId: created.id, userId } });
    expect(status.status).toBe("want_to_read");
  });

  it("falls back to the default cover when Open Library has nothing", async () => {
    const { accessToken } = await signupAndLogin("importer5@example.com");
    jest.spyOn(global, "fetch").mockResolvedValue({ ok: true, json: async () => ({ docs: [] }) });

    const csv = goodreadsCsv([{ title: "Ещё одна редкая книга", author: "Кто-то", shelf: "to-read" }]);
    const res = await request(app)
      .post("/api/import/goodreads")
      .set("Authorization", `Bearer ${accessToken}`)
      .attach("file", Buffer.from(csv), "export.csv");

    expect(res.status).toBe(200);
    expect(res.body.created).toBe(1);
    const created = await Book.findOne({ where: { title: "Ещё одна редкая книга" } });
    expect(created.img).toBe("https://cdn1.ozone.ru/s3/multimedia-x/6597669093.jpg");
  });

  it("skips a row whose review text contains profanity, without failing the whole import", async () => {
    const { accessToken } = await signupAndLogin("importer6@example.com");
    const goodBook = await Book.create({ title: "Хорошая книга", author: "Автор", genre: "Роман", status: "approved" });

    const csv = goodreadsCsv([
      { title: "Хорошая книга", author: "Автор", rating: 5, shelf: "read" },
      { title: "Плохая книга", author: "Кто-то", rating: 1, review: "хуйня полная", shelf: "read" },
    ]);
    const res = await request(app)
      .post("/api/import/goodreads")
      .set("Authorization", `Bearer ${accessToken}`)
      .attach("file", Buffer.from(csv), "export.csv");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ matched: 1, created: 0, skipped: 1 });

    const stillMissing = await Book.findOne({ where: { title: "Плохая книга" } });
    expect(stillMissing).toBeNull();

    const goodReview = await Review.findOne({ where: { bookId: goodBook.id } });
    expect(goodReview).not.toBeNull();
  });

  it("400s when the CSV has more rows than the import cap", async () => {
    const { accessToken } = await signupAndLogin("importer7@example.com");
    const rows = Array.from({ length: 201 }, (_, i) => ({ title: `Книга ${i}`, author: "Автор", shelf: "to-read" }));
    const res = await request(app)
      .post("/api/import/goodreads")
      .set("Authorization", `Bearer ${accessToken}`)
      .attach("file", Buffer.from(goodreadsCsv(rows)), "export.csv");

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/200/);
  });
});
