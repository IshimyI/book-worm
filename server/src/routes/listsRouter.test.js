const request = require("supertest");
const app = require("../app");
const { sequelize, User, Book, ReadingList, ReadingListBook } = require("../../db/models");

async function signupAndLogin(email) {
  const res = await request(app).post("/api/auth/signup").send({
    name: "Test User",
    email,
    password: "password123",
  });
  return { userId: res.body.user.id, accessToken: res.body.accessToken };
}

beforeEach(async () => {
  await ReadingListBook.destroy({ where: {}, truncate: true, cascade: true });
  await ReadingList.destroy({ where: {}, truncate: true, cascade: true });
  await Book.destroy({ where: {}, truncate: true, cascade: true });
  await User.destroy({ where: {}, truncate: true, cascade: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe("lists routes", () => {
  it("blocks unauthenticated requests", async () => {
    const res = await request(app).get("/api/lists");
    expect(res.status).toBe(401);
  });

  it("creates and lists a reading list", async () => {
    const { accessToken } = await signupAndLogin("reader@example.com");

    const createRes = await request(app)
      .post("/api/lists")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: "Хочу прочитать" });
    expect(createRes.status).toBe(200);
    expect(createRes.body.name).toBe("Хочу прочитать");

    const listRes = await request(app)
      .get("/api/lists")
      .set("Authorization", `Bearer ${accessToken}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body).toHaveLength(1);
    expect(listRes.body[0].bookCount).toBe(0);
  });

  it("rejects a blank name", async () => {
    const { accessToken } = await signupAndLogin("reader2@example.com");
    const res = await request(app)
      .post("/api/lists")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: "   " });
    expect(res.status).toBe(400);
  });

  it("adds and removes a book from a list", async () => {
    const { accessToken } = await signupAndLogin("reader3@example.com");
    const book = await Book.create({ title: "Дюна", author: "Фрэнк Герберт", genre: "Фантастика" });

    const list = await request(app)
      .post("/api/lists")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: "Фантастика" });

    const addRes = await request(app)
      .post(`/api/lists/${list.body.id}/books`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ bookId: book.id });
    expect(addRes.status).toBe(200);

    const detailRes = await request(app)
      .get(`/api/lists/${list.body.id}`)
      .set("Authorization", `Bearer ${accessToken}`);
    expect(detailRes.body.books).toHaveLength(1);
    expect(detailRes.body.books[0].id).toBe(book.id);

    // Adding the same book twice is a no-op, not a duplicate/error.
    const addAgainRes = await request(app)
      .post(`/api/lists/${list.body.id}/books`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ bookId: book.id });
    expect(addAgainRes.status).toBe(200);
    const afterDupe = await request(app)
      .get(`/api/lists/${list.body.id}`)
      .set("Authorization", `Bearer ${accessToken}`);
    expect(afterDupe.body.books).toHaveLength(1);

    const removeRes = await request(app)
      .delete(`/api/lists/${list.body.id}/books/${book.id}`)
      .set("Authorization", `Bearer ${accessToken}`);
    expect(removeRes.status).toBe(200);
    const afterRemove = await request(app)
      .get(`/api/lists/${list.body.id}`)
      .set("Authorization", `Bearer ${accessToken}`);
    expect(afterRemove.body.books).toHaveLength(0);
  });

  it("renames and deletes a list", async () => {
    const { accessToken } = await signupAndLogin("reader4@example.com");
    const list = await request(app)
      .post("/api/lists")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: "Черновик" });

    const renameRes = await request(app)
      .patch(`/api/lists/${list.body.id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: "Любимые книги" });
    expect(renameRes.status).toBe(200);
    expect(renameRes.body.name).toBe("Любимые книги");

    const deleteRes = await request(app)
      .delete(`/api/lists/${list.body.id}`)
      .set("Authorization", `Bearer ${accessToken}`);
    expect(deleteRes.status).toBe(200);

    const getRes = await request(app)
      .get(`/api/lists/${list.body.id}`)
      .set("Authorization", `Bearer ${accessToken}`);
    expect(getRes.status).toBe(404);
  });

  it("does not let another user see, modify, or delete a private list", async () => {
    const owner = await signupAndLogin("owner@example.com");
    const stranger = await signupAndLogin("stranger@example.com");
    const list = await request(app)
      .post("/api/lists")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({ name: "Личное" });

    const getRes = await request(app)
      .get(`/api/lists/${list.body.id}`)
      .set("Authorization", `Bearer ${stranger.accessToken}`);
    expect(getRes.status).toBe(404);

    const patchRes = await request(app)
      .patch(`/api/lists/${list.body.id}`)
      .set("Authorization", `Bearer ${stranger.accessToken}`)
      .send({ name: "Захват" });
    expect(patchRes.status).toBe(404);

    const deleteRes = await request(app)
      .delete(`/api/lists/${list.body.id}`)
      .set("Authorization", `Bearer ${stranger.accessToken}`);
    expect(deleteRes.status).toBe(404);
  });
});

describe("curated lists", () => {
  async function signupAdmin(email) {
    const { userId, accessToken } = await signupAndLogin(email);
    await User.update({ isAdmin: true }, { where: { id: userId } });
    return { userId, accessToken };
  }

  it("refuses to let a regular user create a curated list", async () => {
    const { accessToken } = await signupAndLogin("regular@example.com");
    const res = await request(app)
      .post("/api/lists")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: "Топ книг", isCurated: true });
    expect(res.status).toBe(403);
  });

  it("lets an admin create a curated list with a description", async () => {
    const admin = await signupAdmin("admin@example.com");
    const res = await request(app)
      .post("/api/lists")
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .send({ name: "Классика 19 века", isCurated: true, description: "То, с чего стоит начать" });
    expect(res.status).toBe(200);
    expect(res.body.isCurated).toBe(true);
    expect(res.body.description).toBe("То, с чего стоит начать");
  });

  it("shows a curated list to anonymous visitors, but not a private one", async () => {
    const admin = await signupAdmin("admin2@example.com");
    const curated = await request(app)
      .post("/api/lists")
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .send({ name: "Публичная подборка", isCurated: true });

    const owner = await signupAndLogin("owner2@example.com");
    const personal = await request(app)
      .post("/api/lists")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({ name: "Личный список" });

    const curatedRes = await request(app).get(`/api/lists/${curated.body.id}`);
    expect(curatedRes.status).toBe(200);
    expect(curatedRes.body.canManage).toBe(false);

    const personalRes = await request(app).get(`/api/lists/${personal.body.id}`);
    expect(personalRes.status).toBe(404);
  });

  it("lets any admin (not just the creator) manage a curated list", async () => {
    const creator = await signupAdmin("creator@example.com");
    const otherAdmin = await signupAdmin("otheradmin@example.com");
    const book = await Book.create({ title: "Curated Book", author: "A", genre: "Роман" });

    const curated = await request(app)
      .post("/api/lists")
      .set("Authorization", `Bearer ${creator.accessToken}`)
      .send({ name: "Общая подборка", isCurated: true });

    const addRes = await request(app)
      .post(`/api/lists/${curated.body.id}/books`)
      .set("Authorization", `Bearer ${otherAdmin.accessToken}`)
      .send({ bookId: book.id });
    expect(addRes.status).toBe(200);

    const renameRes = await request(app)
      .patch(`/api/lists/${curated.body.id}`)
      .set("Authorization", `Bearer ${otherAdmin.accessToken}`)
      .send({ name: "Переименовано другим админом" });
    expect(renameRes.status).toBe(200);
  });

  it("lists curated lists publicly via GET /lists/curated", async () => {
    const admin = await signupAdmin("admin3@example.com");
    await request(app)
      .post("/api/lists")
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .send({ name: "Подборка 1", isCurated: true });
    await request(app)
      .post("/api/lists")
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .send({ name: "Личный список админа" });

    const res = await request(app).get("/api/lists/curated");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe("Подборка 1");
  });
});
