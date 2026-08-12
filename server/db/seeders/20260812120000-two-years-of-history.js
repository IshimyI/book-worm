"use strict";
const bcrypt = require("bcrypt");
const BOOK_REVIEWS = require("./bookReviews");

const NOW = new Date("2026-08-12");

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randDateBetween(start, end) {
  const t = start.getTime() + Math.random() * (end.getTime() - start.getTime());
  return new Date(t);
}
// Review pool sentences use "(а)" for a verb ending that depends on the
// author's gender (e.g. "читал(а)") — resolve it to the actual reviewer's
// gender instead of leaving the placeholder in displayed text.
function resolveGender(text, gender) {
  return text.replace(/\(а\)/g, gender === "f" ? "а" : "");
}
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const REVIEW_POOLS = {
  5: [
    "Одна из лучших книг, что я читал(а) за последние годы.",
    "Перечитываю уже не первый раз — каждый раз нахожу что-то новое.",
    "Абсолютный шедевр, всем советую.",
    "Не могла оторваться, проглотила за пару вечеров.",
    "Автор гениально выстроил сюжет, финал зацепил до мурашек.",
    "Персонажи настолько живые, что веришь в каждого.",
    "Читала медленно, чтобы растянуть удовольствие.",
    "Вот это глубина — думаю о книге спустя недели после прочтения.",
    "Идеальный баланс между сюжетом и стилем повествования.",
    "После этой книги пересмотрел(а) отношение ко многим вещам.",
    "Не понимаю, почему не прочитал(а) это раньше.",
    "Однозначно войдёт в список любимых книг.",
    "Язык автора — отдельное удовольствие.",
    "Атмосфера передана потрясающе, будто сам(а) там побывал(а).",
    "Каждая страница держит в напряжении.",
    "Рекомендую всем, кто любит хорошую литературу.",
    "Давно не получал(а) такого удовольствия от чтения.",
    "Сильнейшая концовка, до сих пор под впечатлением.",
  ],
  4: [
    "Очень хорошая книга, но есть небольшие затянутости.",
    "Понравилось, хотя ожидал(а) чуть большего от финала.",
    "Крепкая история, читается легко.",
    "Есть провисания в середине, но в целом стоящая вещь.",
    "Хороший слог, интересные герои.",
    "Немного предсказуемо, но всё равно приятно провёл(а) время за чтением.",
    "Стоит прочитать хотя бы раз.",
    "Понравилось больше, чем ожидал(а).",
    "Есть к чему придраться, но общее впечатление положительное.",
    "Захватывающе, хоть и не без шероховатостей.",
    "Достойное произведение, буду знакомиться с автором дальше.",
    "Хорошо, но не дотягивает до шедевра.",
    "Прочитал(а) с удовольствием, рекомендую.",
    "Приятное чтение на вечер, но не более того.",
  ],
  3: [
    "Средне — ни разочарования, ни восторга.",
    "Ожидал(а) большего, судя по отзывам.",
    "Хорошая идея, но реализация подкачала.",
    "Читается тяжело, местами затянуто.",
    "Есть интересные моменты, но в целом на любителя.",
    "Не моё, но написано неплохо.",
    "Начало сильное, а вот развязка разочаровала.",
    "Прочитать можно, но перечитывать не буду.",
    "Слишком много воды для такого сюжета.",
    "Нормально, но не запомнилось ничем особенным.",
  ],
  2: [
    "Не зашло совсем, дочитывал(а) через силу.",
    "Ожидания не оправдались.",
    "Слишком затянуто для такого простого сюжета.",
    "Герои показались картонными.",
    "Не понимаю восторгов вокруг этой книги.",
    "Слабее, чем другие работы автора.",
  ],
};

function pickRating() {
  const r = Math.random();
  if (r < 0.42) return 5;
  if (r < 0.72) return 4;
  if (r < 0.9) return 3;
  return 2;
}

const USERS = [
  { id: 1, name: "Маша", regDate: "2024-08-10", gender: "f" },
  { id: 2, name: "Дима", regDate: "2024-08-10", gender: "m" },
  { id: 3, name: "Света", regDate: "2024-08-12", gender: "f" },
  { id: 4, name: "Ваня", regDate: "2024-08-14", gender: "m" },
  { id: 5, name: "Аня", regDate: "2024-09-01", gender: "f" },
  { id: 6, name: "Пётр", regDate: "2024-10-20", gender: "m" },
  { id: 7, name: "Ольга", regDate: "2024-12-15", gender: "f" },
  { id: 8, name: "Кирилл", regDate: "2025-02-01", gender: "m" },
  { id: 9, name: "Настя", regDate: "2025-04-10", gender: "f" },
  { id: 10, name: "Максим", regDate: "2025-07-05", gender: "m" },
  { id: 11, name: "Юля", regDate: "2025-09-20", gender: "f" },
  { id: 12, name: "Артём", regDate: "2026-01-10", gender: "m" },
  { id: 13, name: "Богдан", regDate: "2024-09-15", gender: "m" },
  { id: 14, name: "Вера", regDate: "2024-10-01", gender: "f" },
  { id: 15, name: "Григорий", regDate: "2024-11-05", gender: "m" },
  { id: 16, name: "Дарья", regDate: "2024-12-01", gender: "f" },
  { id: 17, name: "Егор", regDate: "2025-01-10", gender: "m" },
  { id: 18, name: "Жанна", regDate: "2025-02-20", gender: "f" },
  { id: 19, name: "Захар", regDate: "2025-03-15", gender: "m" },
  { id: 20, name: "Инна", regDate: "2025-04-25", gender: "f" },
  { id: 21, name: "Лев", regDate: "2025-06-01", gender: "m" },
  { id: 22, name: "Марина", regDate: "2025-07-15", gender: "f" },
  { id: 23, name: "Никита", regDate: "2025-09-01", gender: "m" },
  { id: 24, name: "Полина", regDate: "2025-11-10", gender: "f" },
];

const BOOKS = [
  { id: 1, title: "Война и мир", author: "Лев Толстой", genre: "Исторический роман", year: 1869, coverId: 12621906, addedDate: "2024-08-15", annotation: "Роман-эпопея, описывающий русское общество в эпоху войн против Наполеона в 1805—1812 годах." },
  { id: 2, title: "Гарри Поттер и философский камень", author: "Дж.К. Роулинг", genre: "Фэнтези", year: 1997, coverId: 15155833, addedDate: "2024-08-15", annotation: "Хроника приключений юного волшебника Гарри Поттера и его друзей, обучающихся в школе чародейства Хогвартс." },
  { id: 3, title: "Мастер и Маргарита", author: "Михаил Булгаков", genre: "Магический реализм", year: 1967, coverId: 12947486, addedDate: "2024-08-20", annotation: "Роман о визите дьявола в атеистическую Москву, переплетённый с историей Понтия Пилата и Иешуа." },
  { id: 4, title: "1984", author: "Джордж Оруэлл", genre: "Антиутопия", year: 1949, coverId: 9267242, addedDate: "2024-09-10", annotation: "Антиутопия о тоталитарном государстве тотальной слежки и человеке, пытающемся сохранить внутреннюю свободу." },
  { id: 5, title: "Три товарища", author: "Эрих Мария Ремарк", genre: "Роман", year: 1936, coverId: 6569785, addedDate: "2024-10-05", annotation: "История дружбы троих ветеранов Первой мировой войны в предвоенной Германии." },
  { id: 6, title: "Преступление и наказание", author: "Фёдор Достоевский", genre: "Классика", year: 1866, coverId: 12817039, addedDate: "2024-11-12", annotation: "История бывшего студента, решившегося на убийство ради проверки собственной теории." },
  { id: 7, title: "Маленький принц", author: "Антуан де Сент-Экзюпери", genre: "Философская сказка", year: 1943, coverId: 10708272, addedDate: "2025-01-18", annotation: "Философская сказка о мальчике с далёкой планеты и его встречах во время путешествия по Земле." },
  { id: 8, title: "Убить пересмешника", author: "Харпер Ли", genre: "Драма", year: 1960, coverId: 14351077, addedDate: "2025-02-22", annotation: "История взросления девочки на американском Юге на фоне расового процесса, который ведёт её отец." },
  { id: 9, title: "Дюна", author: "Фрэнк Герберт", genre: "Научная фантастика", year: 1965, coverId: 11481354, addedDate: "2025-03-30", annotation: "Сага о борьбе за контроль над пустынной планетой Арракис — единственным источником специи." },
  { id: 10, title: "Портрет Дориана Грея", author: "Оскар Уайльд", genre: "Готический роман", year: 1890, coverId: 14314858, addedDate: "2025-05-14", annotation: "История юноши, чей портрет стареет и меняется вместо него самого." },
  { id: 11, title: "Гордость и предубеждение", author: "Джейн Остин", genre: "Роман", year: 1813, coverId: 14348537, addedDate: "2025-06-20", annotation: "История непростых отношений Элизабет Беннет и мистера Дарси в английском провинциальном обществе." },
  { id: 12, title: "Автостопом по галактике", author: "Дуглас Адамс", genre: "Юмористическая фантастика", year: 1979, coverId: 12986869, addedDate: "2025-08-02", annotation: "Комические приключения последнего землянина после уничтожения Земли ради гиперпространственной магистрали." },
  { id: 13, title: "Норвежский лес", author: "Харуки Мураками", genre: "Роман", year: 1987, coverId: 2237620, addedDate: "2025-10-11", annotation: "Роман о взрослении, любви и потере, действие которого разворачивается в Токио конца 1960-х." },
  { id: 14, title: "Игра престолов", author: "Джордж Р. Р. Мартин", genre: "Фэнтези", year: 1996, coverId: 9269962, addedDate: "2025-12-05", annotation: "Первая книга саги «Песнь льда и пламени» о борьбе великих домов Вестероса за Железный трон." },
  { id: 15, title: "Шантарам", author: "Грегори Дэвид Робертс", genre: "Роман", year: 2003, coverId: 6788945, addedDate: "2026-03-02", annotation: "История беглого заключённого, нашедшего новую жизнь и себя в трущобах Бомбея." },
  { id: 16, title: "Тонкая работа", author: "Сара Уотерс", genre: "Роман", year: 2002, coverId: 824074, addedDate: "2026-06-15", annotation: "Викторианский триллер о мошенничестве, любви и предательстве в Лондоне и загородном поместье." },
  { id: 17, title: "Анна Каренина", author: "Лев Толстой", genre: "Роман", year: 1877, coverId: 2560652, addedDate: "2024-09-05", annotation: "История трагической любви замужней дворянки Анны Карениной на фоне широкой панорамы русского общества XIX века." },
  { id: 18, title: "Отцы и дети", author: "Иван Тургенев", genre: "Роман", year: 1862, coverId: 8236420, addedDate: "2024-09-25", annotation: "Конфликт поколений и мировоззрений между молодым нигилистом Базаровым и представителями старой дворянской культуры." },
  { id: 19, title: "Герой нашего времени", author: "Михаил Лермонтов", genre: "Роман", year: 1840, coverId: 104294, addedDate: "2024-10-15", annotation: "Психологический портрет Печорина — молодого офицера, разочарованного в жизни и обречённого приносить страдания окружающим." },
  { id: 20, title: "Приключения Шерлока Холмса", author: "Артур Конан Дойл", genre: "Детектив", year: 1892, coverId: 6717853, addedDate: "2024-11-01", annotation: "Сборник рассказов о гениальном сыщике с Бейкер-стрит и его верном друге докторе Ватсоне." },
  { id: 21, title: "Убийство в Восточном экспрессе", author: "Агата Кристи", genre: "Детектив", year: 1934, coverId: 11100465, addedDate: "2024-11-25", annotation: "Эркюль Пуаро расследует убийство пассажира в застрявшем в снегу поезде, где подозреваемым может быть каждый." },
  { id: 22, title: "Гарри Поттер и Тайная комната", author: "Дж.К. Роулинг", genre: "Фэнтези", year: 1998, coverId: 15158664, addedDate: "2024-12-10", annotation: "Второй год обучения Гарри Поттера в Хогвартсе омрачён нападениями таинственного монстра из легендарной Тайной комнаты." },
  { id: 23, title: "Братство кольца", author: "Дж.Р.Р. Толкин", genre: "Фэнтези", year: 1954, coverId: 14625765, addedDate: "2025-01-05", annotation: "Первая часть эпоса о хоббите Фродо, отправившемся уничтожить Кольцо Всевластия." },
  { id: 24, title: "Хоббит", author: "Дж.Р.Р. Толкин", genre: "Фэнтези", year: 1937, coverId: 14627509, addedDate: "2025-01-25", annotation: "Приключение домоседа Бильбо Бэггинса, отправившегося с гномами добывать сокровища, охраняемые драконом Смаугом." },
  { id: 25, title: "Три мушкетёра", author: "Александр Дюма", genre: "Приключения", year: 1844, coverId: 11929973, addedDate: "2025-02-10", annotation: "История юного гасконца д'Артаньяна, ставшего мушкетёром и другом легендарной троицы Атоса, Портоса и Арамиса." },
  { id: 26, title: "Граф Монте-Кристо", author: "Александр Дюма", genre: "Приключения", year: 1845, coverId: 14566393, addedDate: "2025-02-28", annotation: "История несправедливо осуждённого моряка, который после побега из тюрьмы посвящает жизнь изощрённой мести." },
  { id: 27, title: "Собачье сердце", author: "Михаил Булгаков", genre: "Сатира", year: 1925, coverId: 10481182, addedDate: "2025-03-15", annotation: "Сатирическая повесть о профессоре, превратившем пса в человека — с катастрофическими для всех последствиями." },
  { id: 28, title: "Заводной апельсин", author: "Энтони Бёрджесс", genre: "Антиутопия", year: 1962, coverId: 13151224, addedDate: "2025-04-05", annotation: "История малолетнего преступника Алекса в жестоком обществе будущего и эксперимента по его «исправлению»." },
  { id: 29, title: "О дивный новый мир", author: "Олдос Хаксли", genre: "Антиутопия", year: 1932, coverId: 8231823, addedDate: "2025-04-22", annotation: "Мир будущего, где люди выращиваются на конвейере и с рождения запрограммированы на счастье и повиновение." },
  { id: 30, title: "Сто лет одиночества", author: "Габриэль Гарсиа Маркес", genre: "Магический реализм", year: 1967, coverId: 12627383, addedDate: "2025-05-10", annotation: "Многопоколенная история семьи Буэндиа в вымышленном городе Макондо, переплетающая быт и волшебство." },
  { id: 31, title: "Цветы для Элджернона", author: "Дэниел Киз", genre: "Научная фантастика", year: 1966, coverId: 12947700, addedDate: "2025-05-28", annotation: "Дневник умственно отсталого мужчины, после экспериментальной операции временно ставшего гением." },
  { id: 32, title: "Приключения Тома Сойера", author: "Марк Твен", genre: "Приключения", year: 1876, coverId: 12043351, addedDate: "2025-06-15", annotation: "Похождения озорного мальчишки на берегах Миссисипи — от побелки забора до поисков пиратского клада." },
  { id: 33, title: "Метро 2033", author: "Дмитрий Глуховский", genre: "Постапокалиптика", year: 2005, coverId: 8443266, addedDate: "2025-07-05", annotation: "После ядерной войны выжившие обитают в тоннелях московского метро, а юный герой отправляется спасать свою станцию." },
  { id: 34, title: "Голодные игры", author: "Сьюзен Коллинз", genre: "Антиутопия", year: 2008, coverId: 12646537, addedDate: "2025-07-25", annotation: "Девушка из бедного округа вынуждена участвовать в жестоком телешоу на выживание ради спасения младшей сестры." },
  { id: 35, title: "Дивергент", author: "Вероника Рот", genre: "Антиутопия", year: 2011, coverId: 13274634, addedDate: "2025-08-15", annotation: "В обществе, поделённом на фракции по чертам характера, девушка обнаруживает, что не вписывается ни в одну из них." },
  { id: 36, title: "Сумерки", author: "Стефани Майер", genre: "Романтическое фэнтези", year: 2005, coverId: 12641977, addedDate: "2025-09-05", annotation: "История любви обычной школьницы и загадочного юноши, скрывающего, что он вампир." },
  { id: 37, title: "Приключения Незнайки и его друзей", author: "Николай Носов", genre: "Детская литература", year: 1954, coverId: 15229926, addedDate: "2025-09-25", annotation: "Забавные похождения коротышки Незнайки и его друзей из Цветочного города." },
  { id: 38, title: "Алиса в Стране чудес", author: "Льюис Кэрролл", genre: "Сказка", year: 1865, coverId: 10527843, addedDate: "2025-10-20", annotation: "Девочка Алиса проваливается в кроличью нору и попадает в абсурдный мир говорящих существ и безумных чаепитий." },
  { id: 39, title: "Дракула", author: "Брэм Стокер", genre: "Готический роман", year: 1897, coverId: 12216503, addedDate: "2025-11-15", annotation: "Классическая история графа-вампира из Трансильвании, рассказанная через письма и дневники его жертв и преследователей." },
  { id: 40, title: "Оно", author: "Стивен Кинг", genre: "Ужасы", year: 1986, coverId: 8569284, addedDate: "2025-12-20", annotation: "Группа друзей детства сталкивается с древним злом, принимающим облик клоуна, терроризирующим их город." },
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkDelete("Reviews", null, {});
    await queryInterface.bulkDelete("Books", null, {});
    await queryInterface.bulkDelete("Users", null, {});

    await queryInterface.bulkInsert(
      "Users",
      await Promise.all(
        USERS.map(async (u) => ({
          id: u.id,
          name: u.name,
          email: `${u.id}@${u.id}`,
          password: await bcrypt.hash(String(u.id), 10),
          isEmailConfirmed: true,
          createdAt: new Date(u.regDate),
          updatedAt: new Date(u.regDate),
        }))
      ),
      {}
    );

    // Каждая книга получает: (1) весь набор развёрнутых, специфичных для неё
    // рецензий из bookReviews.js — это обязательное ядро; (2) короткие реплики
    // из общего пула, в объёме от 1x до 2x ядра, что держит долю развёрнутых
    // отзывов не ниже трети от общего числа на книгу. Порядок вставки внутри
    // книги перемешивается, чтобы длинные и короткие отзывы не шли блоками.
    const reviews = [];
    for (const book of BOOKS) {
      const bookStart = new Date(book.addedDate);
      const usedTextByRating = { 5: new Set(), 4: new Set(), 3: new Set(), 2: new Set() };
      const substantial = BOOK_REVIEWS[book.id] || [];
      const bookReviews = [];
      // The app only allows one review per user per book — never let the
      // same reviewer be picked twice for the same book here either.
      const usedUserIds = new Set();

      for (const { rating, text } of substantial) {
        const reviewDate = randDateBetween(bookStart, NOW);
        const eligibleUsers = USERS.filter(
          (u) => new Date(u.regDate) <= reviewDate && !usedUserIds.has(u.id)
        );
        if (!eligibleUsers.length) continue;
        const reviewer = pick(eligibleUsers);
        usedUserIds.add(reviewer.id);

        bookReviews.push({
          bookId: book.id,
          userId: reviewer.id,
          user_rating: rating,
          body: text,
          createdAt: reviewDate,
          updatedAt: reviewDate,
        });
      }

      const extraCount = randInt(substantial.length, substantial.length * 2);
      for (let i = 0; i < extraCount; i++) {
        const reviewDate = randDateBetween(bookStart, NOW);
        const eligibleUsers = USERS.filter(
          (u) => new Date(u.regDate) <= reviewDate && !usedUserIds.has(u.id)
        );
        if (!eligibleUsers.length) continue;
        const reviewer = pick(eligibleUsers);
        usedUserIds.add(reviewer.id);

        const rating = pickRating();
        const pool = REVIEW_POOLS[rating];
        let text = pick(pool);
        let attempts = 0;
        while (usedTextByRating[rating].has(text) && attempts < 10 && usedTextByRating[rating].size < pool.length) {
          text = pick(pool);
          attempts++;
        }
        usedTextByRating[rating].add(text);
        text = resolveGender(text, reviewer.gender);

        bookReviews.push({
          bookId: book.id,
          userId: reviewer.id,
          user_rating: rating,
          body: text,
          createdAt: reviewDate,
          updatedAt: reviewDate,
        });
      }

      reviews.push(...shuffle(bookReviews));
    }

    const ratingsByBook = {};
    for (const r of reviews) {
      (ratingsByBook[r.bookId] ||= []).push(r.user_rating);
    }

    await queryInterface.bulkInsert(
      "Books",
      BOOKS.map((b) => {
        const ratings = ratingsByBook[b.id] || [];
        const avg = ratings.length
          ? (ratings.reduce((a, c) => a + c, 0) / ratings.length).toFixed(2)
          : null;
        return {
          id: b.id,
          title: b.title,
          author: b.author,
          annotation: b.annotation,
          genre: b.genre,
          year: b.year,
          img: `https://covers.openlibrary.org/b/id/${b.coverId}-L.jpg`,
          quantity_rate: ratings.length,
          rating: avg,
          createdAt: new Date(b.addedDate),
          updatedAt: new Date(b.addedDate),
        };
      }),
      {}
    );

    await queryInterface.bulkInsert("Reviews", reviews, {});

    await queryInterface.sequelize.query(
      `SELECT setval('"Users_id_seq"', (SELECT MAX(id) FROM "Users"));`
    );
    await queryInterface.sequelize.query(
      `SELECT setval('"Books_id_seq"', (SELECT MAX(id) FROM "Books"));`
    );
    await queryInterface.sequelize.query(
      `SELECT setval('"Reviews_id_seq"', (SELECT MAX(id) FROM "Reviews"));`
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("Reviews", null, {});
    await queryInterface.bulkDelete("Books", null, {});
    await queryInterface.bulkDelete("Users", null, {});
  },
};
