const request = require("supertest");
const app = require("./app");
const { sequelize, Book, User, ReadingList } = require("../db/models");

beforeEach(async () => {
  await Book.destroy({ where: {}, truncate: true, cascade: true });
  await ReadingList.destroy({ where: {}, truncate: true, cascade: true });
  await User.destroy({ where: {}, truncate: true, cascade: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe("GET /books/:id (server-rendered bot response)", () => {
  it("returns HTML with OG meta tags pointing at the book's og-image", async () => {
    const book = await Book.create({ title: "Bot Test Book", author: "A", genre: "Роман", annotation: "Описание книги" });
    const res = await request(app).get(`/books/${book.id}`);
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/html/);
    expect(res.text).toContain(`<meta property="og:title" content="Bot Test Book">`);
    expect(res.text).toContain(`/api/v1/book/${book.id}/og-image.png`);
  });

  it("escapes HTML in the title/annotation to avoid markup injection", async () => {
    const book = await Book.create({
      title: '<script>alert(1)</script>',
      author: "A",
      genre: "Роман",
      annotation: "Обычное описание",
    });
    const res = await request(app).get(`/books/${book.id}`);
    expect(res.status).toBe(200);
    expect(res.text).not.toContain("<script>alert(1)</script>");
    expect(res.text).toContain("&lt;script&gt;");
  });

  it("falls through (404, not a crash) for a book that doesn't exist", async () => {
    const res = await request(app).get("/books/999999");
    expect(res.status).toBe(404);
  });
});

describe("GET /users/:id (server-rendered bot response)", () => {
  it("returns HTML with OG meta tags pointing at the profile's og-image", async () => {
    const user = await User.create({ name: "Bot Test User", email: "bottest@example.com", password: "hash" });
    const res = await request(app).get(`/users/${user.id}`);
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/html/);
    expect(res.text).toContain(`<meta property="og:title" content="Bot Test User">`);
    expect(res.text).toContain(`/api/v1/users/${user.id}/og-image.png`);
  });

  it("falls through for a user that doesn't exist", async () => {
    const res = await request(app).get("/users/999999");
    expect(res.status).toBe(404);
  });
});

describe("GET /lists/:id (server-rendered bot response)", () => {
  it("returns HTML with OG meta tags for a curated list", async () => {
    const admin = await User.create({ name: "Admin", email: "botlistadmin@example.com", password: "hash", isAdmin: true });
    const list = await ReadingList.create({ userId: admin.id, name: "Bot Test List", isCurated: true });
    const res = await request(app).get(`/lists/${list.id}`);
    expect(res.status).toBe(200);
    expect(res.text).toContain(`<meta property="og:title" content="Bot Test List">`);
    expect(res.text).toContain(`/api/v1/lists/${list.id}/og-image.png`);
  });

  it("falls through for a personal (non-curated) list, same as a missing one", async () => {
    const owner = await User.create({ name: "Owner", email: "botlistowner@example.com", password: "hash" });
    const list = await ReadingList.create({ userId: owner.id, name: "Private List", isCurated: false });
    const res = await request(app).get(`/lists/${list.id}`);
    expect(res.status).toBe(404);
  });
});
