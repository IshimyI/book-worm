const express = require("express");
const { ReadingList, ReadingListBook, Book } = require("../../db/models");
const verifyAccessToken = require("../middlewares/verifyAccessToken");

const listsRouter = express.Router();

listsRouter.use(verifyAccessToken);

async function loadOwnList(req, res) {
  const list = await ReadingList.findByPk(req.params.id);
  if (!list || list.userId !== req.userId) {
    res.status(404).json({ message: "Список не найден" });
    return null;
  }
  return list;
}

listsRouter.get("/", async (req, res) => {
  try {
    const lists = await ReadingList.findAll({
      where: { userId: req.userId },
      order: [["createdAt", "DESC"]],
      include: [{ model: Book, attributes: ["id", "img"], through: { attributes: [] } }],
    });

    res.status(200).json(
      lists.map((list) => ({
        id: list.id,
        name: list.name,
        createdAt: list.createdAt,
        bookCount: list.Books.length,
        covers: list.Books.slice(0, 4).map((b) => b.img),
      }))
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

listsRouter.post("/", async (req, res) => {
  try {
    const name = (req.body.name || "").trim();
    if (!name) {
      return res.status(400).json({ message: "Укажите название списка" });
    }
    const list = await ReadingList.create({ userId: req.userId, name });
    res.status(200).json({ id: list.id, name: list.name, createdAt: list.createdAt, bookCount: 0, covers: [] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

listsRouter.get("/:id", async (req, res) => {
  try {
    const list = await ReadingList.findByPk(req.params.id, {
      include: [{ model: Book, through: { attributes: [] } }],
    });
    if (!list || list.userId !== req.userId) {
      return res.status(404).json({ message: "Список не найден" });
    }
    res.status(200).json({
      id: list.id,
      name: list.name,
      createdAt: list.createdAt,
      books: list.Books,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

listsRouter.patch("/:id", async (req, res) => {
  try {
    const list = await loadOwnList(req, res);
    if (!list) return;
    const name = (req.body.name || "").trim();
    if (!name) {
      return res.status(400).json({ message: "Укажите название списка" });
    }
    list.name = name;
    await list.save();
    res.status(200).json({ id: list.id, name: list.name });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

listsRouter.delete("/:id", async (req, res) => {
  try {
    const list = await loadOwnList(req, res);
    if (!list) return;
    await list.destroy();
    res.status(200).json({ message: "Список удалён" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

listsRouter.post("/:id/books", async (req, res) => {
  try {
    const list = await loadOwnList(req, res);
    if (!list) return;
    const bookId = Number(req.body.bookId);
    if (!bookId) {
      return res.status(400).json({ message: "Не указана книга" });
    }
    const book = await Book.findByPk(bookId);
    if (!book) {
      return res.status(404).json({ message: "Книга не найдена" });
    }
    // Adding a book already on the list is a no-op, not an error — the
    // unique(readingListId, bookId) index is what actually enforces this.
    await ReadingListBook.findOrCreate({ where: { readingListId: list.id, bookId } });
    res.status(200).json({ message: "Добавлено в список" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

listsRouter.delete("/:id/books/:bookId", async (req, res) => {
  try {
    const list = await loadOwnList(req, res);
    if (!list) return;
    await ReadingListBook.destroy({ where: { readingListId: list.id, bookId: req.params.bookId } });
    res.status(200).json({ message: "Убрано из списка" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

module.exports = listsRouter;
