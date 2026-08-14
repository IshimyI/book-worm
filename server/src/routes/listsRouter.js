const express = require("express");
const { ReadingList, ReadingListBook, Book, User } = require("../../db/models");
const verifyAccessToken = require("../middlewares/verifyAccessToken");
const optionalAuth = require("../middlewares/optionalAuth");
const { generateListOgImage } = require("../utils/ogImage");
const cache = require("../utils/simpleCache");

const listsRouter = express.Router();

async function isRequesterAdmin(userId) {
  if (!userId) return false;
  const user = await User.findByPk(userId, { attributes: ["isAdmin"] });
  return Boolean(user?.isAdmin);
}

// Curated lists are editorial content anyone can see; personal lists are
// only visible to their owner. Editing either requires being the owner, or
// (for curated lists specifically) being an admin — any admin can maintain
// the site's curated collections, not just whoever happened to create one.
async function loadManageableList(req, res) {
  const list = await ReadingList.findByPk(req.params.id);
  if (!list) {
    res.status(404).json({ message: "Список не найден" });
    return null;
  }
  const allowed = list.isCurated ? await isRequesterAdmin(req.userId) : list.userId === req.userId;
  if (!allowed) {
    res.status(404).json({ message: "Список не найден" });
    return null;
  }
  return list;
}

function serializeListSummary(list) {
  return {
    id: list.id,
    name: list.name,
    description: list.description,
    isCurated: list.isCurated,
    createdAt: list.createdAt,
    bookCount: list.Books.length,
    covers: list.Books.slice(0, 4).map((b) => b.img),
  };
}

listsRouter.get("/curated", async (req, res) => {
  try {
    const lists = await ReadingList.findAll({
      where: { isCurated: true },
      order: [["createdAt", "DESC"]],
      include: [{ model: Book, attributes: ["id", "img"], through: { attributes: [] } }],
    });
    // An empty curated collection reads as a broken/unfinished page to a
    // visitor — hide it from the public list until an admin adds books;
    // it's still visible (and editable) on the admin's own /lists page.
    res.status(200).json(lists.filter((list) => list.Books.length > 0).map(serializeListSummary));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

listsRouter.get("/", verifyAccessToken, async (req, res) => {
  try {
    const lists = await ReadingList.findAll({
      where: { userId: req.userId },
      order: [["createdAt", "DESC"]],
      include: [{ model: Book, attributes: ["id", "img"], through: { attributes: [] } }],
    });
    res.status(200).json(lists.map(serializeListSummary));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

listsRouter.post("/", verifyAccessToken, async (req, res) => {
  try {
    const name = (req.body.name || "").trim();
    if (!name) {
      return res.status(400).json({ message: "Укажите название списка" });
    }
    let isCurated = false;
    if (req.body.isCurated) {
      if (!(await isRequesterAdmin(req.userId))) {
        return res.status(403).json({ message: "Только администраторы могут создавать подборки" });
      }
      isCurated = true;
    }
    const description = isCurated ? (req.body.description || "").trim() || null : null;
    const list = await ReadingList.create({ userId: req.userId, name, isCurated, description });
    res.status(200).json({
      id: list.id,
      name: list.name,
      description: list.description,
      isCurated: list.isCurated,
      createdAt: list.createdAt,
      bookCount: 0,
      covers: [],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

listsRouter.get("/:id/og-image.png", optionalAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const cacheKey = `og-image-list:${id}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      res.set("Content-Type", "image/png");
      return res.status(200).send(cached);
    }

    const list = await ReadingList.findByPk(id, { include: [{ model: Book, attributes: ["id", "img"], through: { attributes: [] } }] });
    if (!list) {
      return res.status(404).send({ message: "Список не найден" });
    }
    // Same visibility rule as viewing the list itself: curated lists are
    // public, personal lists only to their owner.
    if (!list.isCurated && list.userId !== req.userId) {
      return res.status(404).send({ message: "Список не найден" });
    }

    const png = await generateListOgImage(serializeListSummary(list));
    cache.set(cacheKey, png, 6 * 60 * 60 * 1000);
    res.set("Content-Type", "image/png");
    res.set("Cache-Control", "public, max-age=21600");
    res.status(200).send(png);
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});

listsRouter.get("/:id", optionalAuth, async (req, res) => {
  try {
    const list = await ReadingList.findByPk(req.params.id, {
      include: [{ model: Book, through: { attributes: [] } }],
    });
    if (!list) {
      return res.status(404).json({ message: "Список не найден" });
    }
    const isOwner = list.userId === req.userId;
    if (!list.isCurated && !isOwner) {
      return res.status(404).json({ message: "Список не найден" });
    }
    res.status(200).json({
      id: list.id,
      name: list.name,
      description: list.description,
      isCurated: list.isCurated,
      createdAt: list.createdAt,
      books: list.Books,
      canManage: list.isCurated ? await isRequesterAdmin(req.userId) : isOwner,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

listsRouter.patch("/:id", verifyAccessToken, async (req, res) => {
  try {
    const list = await loadManageableList(req, res);
    if (!list) return;
    if (req.body.name !== undefined) {
      const name = req.body.name.trim();
      if (!name) {
        return res.status(400).json({ message: "Укажите название списка" });
      }
      list.name = name;
    }
    if (list.isCurated && req.body.description !== undefined) {
      list.description = req.body.description.trim() || null;
    }
    await list.save();
    res.status(200).json({ id: list.id, name: list.name, description: list.description });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

listsRouter.delete("/:id", verifyAccessToken, async (req, res) => {
  try {
    const list = await loadManageableList(req, res);
    if (!list) return;
    await list.destroy();
    res.status(200).json({ message: "Список удалён" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

listsRouter.post("/:id/books", verifyAccessToken, async (req, res) => {
  try {
    const list = await loadManageableList(req, res);
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

listsRouter.delete("/:id/books/:bookId", verifyAccessToken, async (req, res) => {
  try {
    const list = await loadManageableList(req, res);
    if (!list) return;
    await ReadingListBook.destroy({ where: { readingListId: list.id, bookId: req.params.bookId } });
    res.status(200).json({ message: "Убрано из списка" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

module.exports = listsRouter;
