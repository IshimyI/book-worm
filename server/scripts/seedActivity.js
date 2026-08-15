require("dotenv").config();
const { sequelize, Book, User, Quote, Follow, ReadingList, ReadingListBook, ReadingStatus } = require("../db/models");

// One-off, re-runnable — fills in the site's other activity surfaces
// (quotes, follows, reading lists, reading shelves), which were sitting at
// zero despite 700+ reviews: nothing to show on any book's "Цитаты"
// section, an empty "Лента" for every user, no curated "Подборки", and
// every "Мои книги по статусу" shelf empty. Real quotes only for books
// this was confident are accurately remembered — no invented "quotes".
// Everything else (follows, statuses) is generated, not fabricated prose,
// so no accuracy risk there.

const QUOTES = [
  { title: "Мастер и Маргарита", quotes: [
    { userId: 2, text: "Рукописи не горят.", page: 398 },
    { userId: 16, text: "Никогда и ничего не просите! Никогда и ничего, и в особенности у тех, кто сильнее вас.", page: 55 },
  ] },
  { title: "1984", quotes: [
    { userId: 3, text: "Война — это мир. Свобода — это рабство. Незнание — сила.", page: 4 },
    { userId: 21, text: "Большой Брат смотрит на тебя.", page: 3 },
  ] },
  { title: "Преступление и наказание", quotes: [
    { userId: 4, text: "Тварь ли я дрожащая или право имею?", page: 211 },
  ] },
  { title: "Маленький принц", quotes: [
    { userId: 5, text: "Зорко одно лишь сердце. Самого главного глазами не увидишь.", page: 68 },
    { userId: 9, text: "Мы в ответе за тех, кого приручили.", page: 71 },
  ] },
  { title: "Портрет Дориана Грея", quotes: [
    { userId: 6, text: "Единственный способ избавиться от искушения — поддаться ему.", page: 22 },
  ] },
  { title: "Автостопом по галактике", quotes: [
    { userId: 7, text: "Не паникуй.", page: 3 },
    { userId: 12, text: "42.", page: 182 },
  ] },
  { title: "Собачье сердце", quotes: [
    { userId: 8, text: "Разруха не в клозетах, а в головах.", page: 47 },
  ] },
  { title: "Сто лет одиночества", quotes: [
    { userId: 9, text: "Много лет спустя, перед расстрельным взводом, полковник Аурелиано Буэндиа будет вспоминать тот далёкий вечер, когда отец взял его с собой посмотреть на лёд.", page: 1 },
  ] },
  { title: "Убить пересмешника", quotes: [
    { userId: 10, text: "Ты никогда по-настоящему не поймёшь человека, пока не станешь на его точку зрения... пока не влезешь в его шкуру и не походишь в ней.", page: 33 },
  ] },
  { title: "Дюна", quotes: [
    { userId: 11, text: "Страх убивает разум. Страх — это малая смерть, ведущая к полному уничтожению.", page: 8 },
  ] },
  { title: "Игра престолов", quotes: [
    { userId: 12, text: "Зима близко.", page: 15 },
    { userId: 17, text: "Когда играешь в игру престолов, ты или побеждаешь, или умираешь.", page: 488 },
  ] },
  { title: "Хоббит", quotes: [
    { userId: 13, text: "В земле была нора, а в норе жил хоббит.", page: 1 },
  ] },
  { title: "Три мушкетёра", quotes: [
    { userId: 14, text: "Один за всех, и все за одного!", page: 143 },
  ] },
  { title: "Алиса в Стране чудес", quotes: [
    { userId: 15, text: "Всё страньше и страньше!", page: 12 },
  ] },
  { title: "Оно", quotes: [
    { userId: 16, text: "Мы все здесь плывём.", page: 132 },
  ] },
  { title: "Идиот", quotes: [
    { userId: 17, text: "Красота спасёт мир.", page: 402 },
  ] },
  { title: "Братья Карамазовы", quotes: [
    { userId: 18, text: "Если Бога нет, то всё позволено.", page: 589 },
  ] },
  { title: "Старик и море", quotes: [
    { userId: 19, text: "Человека можно уничтожить, но его нельзя победить.", page: 89 },
  ] },
  { title: "Великий Гэтсби", quotes: [
    { userId: 20, text: "Так мы и бьёмся, как пловцы против течения, а оно всё сносит и сносит наши лодки назад, в прошлое.", page: 189 },
  ] },
  { title: "Пикник на обочине", quotes: [
    { userId: 21, text: "Счастья всем, даром, и пусть никто не уйдёт обиженным!", page: 197 },
  ] },
];

const CURATED_LISTS = [
  { name: "Антиутопии", description: "Общества будущего, в которых лучше не оказаться.", titles: ["1984", "О дивный новый мир", "Мы", "451 градус по Фаренгейту", "Скотный двор"] },
  { name: "Зарубежная классика", description: "Признанные во всём мире романы XIX–XX веков.", titles: ["Гордость и предубеждение", "Джейн Эйр", "Грозовой перевал", "Великий Гэтсби", "Портрет Дориана Грея"] },
  { name: "Фантастика для начала знакомства", description: "С этих книг удобно входить в жанр.", titles: ["Дюна", "Марсианин", "Автостопом по галактике", "451 градус по Фаренгейту", "Задача трёх тел"] },
  { name: "Короткие, но сильные", description: "Меньше 200 страниц — и ни одной лишней.", titles: ["Старик и море", "Скотный двор", "Мы", "Слепота"] },
  { name: "Русская классика", description: "От Пушкина до Булгакова.", titles: ["Война и мир", "Преступление и наказание", "Мастер и Маргарита", "Анна Каренина", "Отцы и дети", "Идиот"] },
];

const PERSONAL_LISTS = [
  { userId: 2, name: "Хочу прочитать этим летом", titles: ["Марсианин", "Задача трёх тел", "Вино из одуванчиков"] },
  { userId: 6, name: "Любимая фантастика", titles: ["Дюна", "Пикник на обочине", "Мечтают ли андроиды об электроовцах?"] },
  { userId: 9, name: "Для книжного клуба", titles: ["Слепота", "Идиот", "Степной волк"] },
  { userId: 13, name: "Перечитать в отпуске", titles: ["Три мушкетёра", "Граф Монте-Кристо", "Затерянный мир"] },
  { userId: 17, name: "Детективы и триллеры", titles: ["Имя розы", "Убийство в Восточном экспрессе", "Крёстный отец"] },
  { userId: 20, name: "Тяжёлое, но важное", titles: ["Список Шиндлера", "Тихий Дон", "Братья Карамазовы"] },
];

async function seedQuotes() {
  let created = 0;
  for (const entry of QUOTES) {
    const book = await Book.findOne({ where: { title: entry.title } });
    if (!book) {
      console.warn(`  ! book not found for quotes: ${entry.title}`);
      continue;
    }
    for (const q of entry.quotes) {
      const [, wasCreated] = await Quote.findOrCreate({
        where: { bookId: book.id, userId: q.userId, text: q.text },
        defaults: { page: q.page },
      });
      if (wasCreated) created += 1;
    }
  }
  console.log(`Quotes: ${created} created.`);
}

async function seedFollows() {
  const users = await User.findAll({ attributes: ["id"] });
  const ids = users.map((u) => u.id);
  const existing = await Follow.findAll({ attributes: ["followerId", "followingId"] });
  const existingKeys = new Set(existing.map((f) => `${f.followerId}:${f.followingId}`));

  let created = 0;
  for (const followerId of ids) {
    const others = ids.filter((id) => id !== followerId);
    // Deterministic-ish spread (based on id) rather than true randomness,
    // so re-running doesn't pile up different follows on top of previous
    // runs beyond what findOrCreate already guards against.
    const followCount = 3 + (followerId % 5); // 3-7
    const shuffled = [...others].sort((a, b) => ((a * 31 + followerId) % 97) - ((b * 31 + followerId) % 97));
    const toFollow = shuffled.slice(0, followCount);
    for (const followingId of toFollow) {
      const key = `${followerId}:${followingId}`;
      if (existingKeys.has(key)) continue;
      // eslint-disable-next-line no-await-in-loop
      await Follow.create({ followerId, followingId });
      existingKeys.add(key);
      created += 1;
    }
  }
  console.log(`Follows: ${created} created.`);
}

async function seedCuratedLists() {
  const admin = await User.findOne({ where: { isAdmin: true } });
  if (!admin) {
    console.warn("  ! no admin user found, skipping curated lists");
    return;
  }
  let created = 0;
  for (const entry of CURATED_LISTS) {
    let list = await ReadingList.findOne({ where: { name: entry.name, isCurated: true } });
    if (!list) {
      list = await ReadingList.create({ userId: admin.id, name: entry.name, description: entry.description, isCurated: true });
      created += 1;
    }
    const books = await Book.findAll({ where: { title: entry.titles } });
    for (const book of books) {
      // eslint-disable-next-line no-await-in-loop
      await ReadingListBook.findOrCreate({ where: { readingListId: list.id, bookId: book.id } });
    }
  }
  console.log(`Curated lists: ${created} created.`);
}

async function seedPersonalLists() {
  let created = 0;
  for (const entry of PERSONAL_LISTS) {
    let list = await ReadingList.findOne({ where: { userId: entry.userId, name: entry.name } });
    if (!list) {
      list = await ReadingList.create({ userId: entry.userId, name: entry.name, isCurated: false });
      created += 1;
    }
    const books = await Book.findAll({ where: { title: entry.titles } });
    for (const book of books) {
      // eslint-disable-next-line no-await-in-loop
      await ReadingListBook.findOrCreate({ where: { readingListId: list.id, bookId: book.id } });
    }
  }
  console.log(`Personal lists: ${created} created.`);
}

async function seedReadingStatuses() {
  const users = await User.findAll({ attributes: ["id"] });
  const books = await Book.findAll({ where: { status: "approved" }, attributes: ["id"] });
  const bookIds = books.map((b) => b.id);
  const statuses = ["want_to_read", "reading", "read"];

  let created = 0;
  for (const user of users) {
    const count = 5 + (user.id % 8); // 5-12 books on this user's shelves
    const shuffled = [...bookIds].sort((a, b) => ((a * 17 + user.id) % 101) - ((b * 17 + user.id) % 101));
    const picked = shuffled.slice(0, count);
    for (let i = 0; i < picked.length; i += 1) {
      const bookId = picked[i];
      const status = statuses[(bookId + user.id + i) % statuses.length];
      // eslint-disable-next-line no-await-in-loop
      const [, wasCreated] = await ReadingStatus.findOrCreate({
        where: { userId: user.id, bookId },
        defaults: { status },
      });
      if (wasCreated) created += 1;
    }
  }
  console.log(`Reading statuses: ${created} created.`);
}

async function seedActivity() {
  await seedQuotes();
  await seedFollows();
  await seedCuratedLists();
  await seedPersonalLists();
  await seedReadingStatuses();
}

if (require.main === module) {
  seedActivity()
    .then(() => sequelize.close())
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
      return sequelize.close();
    });
}

module.exports = seedActivity;
