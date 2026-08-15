require("dotenv").config();
const { sequelize, Book, Review, User } = require("../db/models");
const { normalize } = require("../src/utils/bookDedup");
const { searchOpenLibraryCover } = require("../src/utils/openLibrarySearch");
const { recomputeBookRating } = require("../src/utils/bookRating");

// One-off catalog growth pass — the original 40-book seed averages ~17
// reviews/book; these are meant to read as newer, less-established
// additions, so each gets a small, realistic handful instead of matching
// that. Re-runs safely: skips any title+author already in the catalog.
const NEW_BOOKS = [
  {
    title: "Скотный двор",
    author: "Джордж Оруэлл",
    olQuery: "Animal Farm George Orwell",
    genre: "Антиутопия",
    year: 1945,
    annotation:
      "Аллегорическая повесть-притча о животных, восставших против человека и построивших собственное общество, — едкая сатира на тоталитаризм и предательство революционных идеалов.",
    reviews: [
      { userId: 5, rating: 5, body: "Короткая, но бьёт сильнее иного романа в 500 страниц." },
      { userId: 12, rating: 4, body: "Аллегория местами слишком прямолинейна, но от этого не менее точна." },
    ],
  },
  {
    title: "Двенадцать стульев",
    author: "Илья Ильф, Евгений Петров",
    olQuery: "The Twelve Chairs Ilf Petrov",
    genre: "Классика",
    year: 1928,
    annotation:
      "Сатирический роман о похождениях авантюриста Остапа Бендера, который вместе с бывшим дворянином разыскивает бриллианты, спрятанные в одном из двенадцати стульев гарнитура.",
    reviews: [
      { userId: 7, rating: 5, body: "Растащила на цитаты не зря — смешно до сих пор, спустя сто лет." },
      { userId: 19, rating: 5, body: "Остап Бендер — один из лучших авантюристов в литературе." },
    ],
  },
  {
    title: "Идиот",
    author: "Фёдор Достоевский",
    olQuery: "The Idiot Fyodor Dostoevsky",
    genre: "Роман",
    year: 1869,
    annotation:
      "История князя Мышкина, человека исключительной душевной чистоты, брошенного в мир петербургского общества, где его доброта и искренность оборачиваются трагедией.",
    reviews: [
      { userId: 6, rating: 5, body: "Мышкин — единственный по-настоящему хороший человек во всей русской классике." },
      { userId: 16, rating: 4, body: "Тяжело читать, но финал не отпускает потом неделями." },
    ],
  },
  {
    title: "Братья Карамазовы",
    author: "Фёдор Достоевский",
    olQuery: "The Brothers Karamazov Fyodor Dostoevsky",
    genre: "Роман",
    year: 1880,
    annotation:
      "Последний и самый масштабный роман Достоевского о трёх братьях Карамазовых и убийстве их отца — исследование веры, свободы воли и природы зла.",
    reviews: [
      { userId: 15, rating: 5, body: "Глава про Великого инквизитора стоит того, чтобы прочитать всю книгу целиком." },
      { userId: 22, rating: 4, body: "Длинно, местами тяжеловесно, но по итогу — одна из главных книг в моей жизни." },
    ],
  },
  {
    title: "Доктор Живаго",
    author: "Борис Пастернак",
    olQuery: "Doctor Zhivago Boris Pasternak",
    genre: "Роман",
    year: 1957,
    annotation:
      "Роман о докторе и поэте Юрии Живаго, чья судьба и личная жизнь ломаются на фоне революции и Гражданской войны в России.",
    reviews: [
      { userId: 9, rating: 4, body: "Язык невероятный, но следить за сюжетом местами сложно." },
      { userId: 23, rating: 5, body: "Про эпоху, которая перемалывает человеческие судьбы, лучше не написать." },
    ],
  },
  {
    title: "Старик и море",
    author: "Эрнест Хемингуэй",
    olQuery: "The Old Man and the Sea Ernest Hemingway",
    genre: "Классика",
    year: 1952,
    annotation:
      "Повесть о старом кубинском рыбаке, который в одиночку сражается с гигантской рыбой посреди океана, — притча о человеческом упорстве и достоинстве перед лицом поражения.",
    reviews: [
      { userId: 8, rating: 5, body: "Меньше ста страниц, а перечитываю раз в пару лет." },
      { userId: 20, rating: 4, body: "Простой сюжет, но за ним столько всего — про упрямство, гордость, старость." },
    ],
  },
  {
    title: "Великий Гэтсби",
    author: "Фрэнсис Скотт Фицджеральд",
    olQuery: "The Great Gatsby F. Scott Fitzgerald",
    genre: "Роман",
    year: 1925,
    annotation:
      "История таинственного богача Джея Гэтсби и его одержимой любви к Дэйзи Бьюкенен на фоне блеска и пустоты Америки эпохи джаза.",
    reviews: [
      { userId: 11, rating: 4, body: "Красиво, но все герои, кроме Гэтсби, откровенно неприятны." },
      { userId: 24, rating: 5, body: "Про то, как прошлое невозможно вернуть, сколько бы денег на это ни было." },
    ],
  },
  {
    title: "Посторонний",
    author: "Альбер Камю",
    olQuery: "The Stranger Albert Camus",
    genre: "Роман",
    year: 1942,
    annotation:
      "Роман о Мерсо, чья эмоциональная отстранённость и отказ играть по правилам общества приводят его на скамью подсудимых, — одно из ключевых произведений философии абсурда.",
    reviews: [
      { userId: 13, rating: 4, body: "Мерсо раздражает и завораживает одновременно — не смогла оторваться." },
      { userId: 18, rating: 5, body: "Прочитал за один вечер и потом ещё долго не мог собраться с мыслями." },
    ],
  },
  {
    title: "Имя розы",
    author: "Умберто Эко",
    olQuery: "The Name of the Rose Umberto Eco",
    genre: "Детектив",
    year: 1980,
    annotation:
      "Детективный роман, действие которого происходит в средневековом монастыре, где монах-францисканец расследует череду загадочных смертей, распутывая клубок ереси, книг и власти.",
    reviews: [
      { userId: 10, rating: 5, body: "Детектив, богословский трактат и исторический роман одновременно — и всё работает." },
      { userId: 21, rating: 3, body: "Первая треть про монастырский быт далась тяжело, дальше стало интереснее." },
    ],
  },
  {
    title: "Парфюмер",
    author: "Патрик Зюскинд",
    olQuery: "Perfume Patrick Suskind",
    genre: "Триллер",
    year: 1985,
    annotation:
      "История одержимого создателя ароматов Жана-Батиста Гренуя, готового на убийство ради идеального запаха, — мрачная притча о гениальности без души.",
    reviews: [
      { userId: 14, rating: 5, body: "Единственная книга, после которой я буквально ощущала запахи со страниц." },
      { userId: 17, rating: 4, body: "Гренуй — один из самых жутких персонажей, что я встречал, и это комплимент автору." },
    ],
  },
  {
    title: "Марсианин",
    author: "Энди Вейер",
    olQuery: "The Martian Andy Weir",
    genre: "Научная фантастика",
    year: 2011,
    annotation:
      "Астронавт, случайно оставленный на Марсе, борется за выживание в одиночку, полагаясь только на инженерную смекалку и чувство юмора.",
    reviews: [
      { userId: 5, rating: 5, body: "Ни одной скучной страницы — читается как хороший сериал про выживание." },
      { userId: 12, rating: 5, body: "Юмор главного героя вытаскивает даже самые напряжённые моменты." },
    ],
  },
  {
    title: "451 градус по Фаренгейту",
    author: "Рэй Брэдбери",
    olQuery: "Fahrenheit 451 Ray Bradbury",
    genre: "Антиутопия",
    year: 1953,
    annotation:
      "В мире, где книги запрещены и подлежат сожжению, пожарный по имени Гай Монтэг начинает сомневаться в системе, которой служит.",
    reviews: [
      { userId: 6, rating: 4, body: "Написана в 50-х, а звучит будто про экранную зависимость прямо сейчас." },
      { userId: 16, rating: 5, body: "Короткая антиутопия, которая бьёт не хуже «1984»." },
    ],
  },
  {
    title: "Мечтают ли андроиды об электроовцах?",
    author: "Филип К. Дик",
    olQuery: "Do Androids Dream of Electric Sheep Philip K. Dick",
    genre: "Научная фантастика",
    year: 1968,
    annotation:
      "В постапокалиптическом будущем охотник за головами выслеживает беглых андроидов, всё труднее отличимых от людей, — книга, легшая в основу «Бегущего по лезвию».",
    reviews: [
      { userId: 15, rating: 4, body: "Фильм красивее, но вопросы, которые задаёт книга, острее." },
      { userId: 22, rating: 4, body: "Мутный, тревожный мир, который засасывает не сразу, но крепко." },
    ],
  },
  {
    title: "Последнее желание",
    author: "Анджей Сапковский",
    olQuery: "The Last Wish Andrzej Sapkowski",
    genre: "Фэнтези",
    year: 1993,
    annotation:
      "Сборник рассказов о ведьмаке Геральте из Ривии, охотнике на чудовищ, чей мир оказывается куда сложнее деления на добро и зло.",
    reviews: [
      { userId: 9, rating: 5, body: "Играла в игры и только потом добралась до книг — жалею, что не наоборот." },
      { userId: 23, rating: 5, body: "Сапковский переворачивает знакомые сказочные сюжеты с ног на голову — и получается лучше оригиналов." },
    ],
  },
  {
    title: "Гарри Поттер и узник Азкабана",
    author: "Дж.К. Роулинг",
    olQuery: "Harry Potter and the Prisoner of Azkaban J.K. Rowling",
    genre: "Фэнтези",
    year: 1999,
    annotation:
      "Третий год Гарри в Хогвартсе омрачён побегом опасного преступника Сириуса Блэка — и тайной, связывающей его с семьёй Поттеров.",
    reviews: [
      { userId: 8, rating: 5, body: "Лучшая часть серии — и по сюжету, и по атмосфере." },
      { userId: 20, rating: 5, body: "Маховик времени — до сих пор одна из любимых идей во всей серии." },
    ],
  },
  {
    title: "Собор Парижской Богоматери",
    author: "Виктор Гюго",
    olQuery: "The Hunchback of Notre-Dame Victor Hugo",
    genre: "Роман",
    year: 1831,
    annotation:
      "На фоне средневекового Парижа разворачивается трагическая история цыганки Эсмеральды, горбуна-звонаря Квазимодо и одержимого архидьякона Фролло.",
    reviews: [
      { userId: 11, rating: 4, body: "Гюго то и дело уходит в подробные описания собора, но сама история того стоит." },
      { userId: 24, rating: 5, body: "Квазимодо — один из самых трогательных персонажей, что я встречала в классике." },
    ],
  },
  {
    title: "Пикник на обочине",
    author: "Аркадий Стругацкий, Борис Стругацкий",
    olQuery: "Roadside Picnic Arkady Boris Strugatsky",
    genre: "Научная фантастика",
    year: 1972,
    annotation:
      "После визита инопланетян на Земле остаются загадочные Зоны, полные опасных артефактов, — и сталкеры, готовые рисковать жизнью ради добычи из них.",
    reviews: [
      { userId: 13, rating: 5, body: "Игра и фильм — только начало, книга мрачнее и умнее обоих." },
      { userId: 18, rating: 4, body: "Атмосфера безнадёги передана так, что реально не по себе." },
    ],
  },
  {
    title: "Generation «П»",
    author: "Виктор Пелевин",
    olQuery: "Homo Zapiens Victor Pelevin",
    genre: "Роман",
    year: 1999,
    annotation:
      "Копирайтер Вавилен Татарский с головой уходит в мир рекламы и постсоветского капитализма, где реальность и медийные симулякры постепенно меняются местами.",
    reviews: [
      { userId: 10, rating: 4, body: "Половину отсылок на девяностые я не понял, но всё равно смешно и жутко одновременно." },
      { userId: 21, rating: 5, body: "Про рекламу и медиа написано так, будто это не 1999 год, а вчера." },
    ],
  },
  {
    title: "Щегол",
    author: "Донна Тартт",
    olQuery: "The Goldfinch Donna Tartt",
    genre: "Роман",
    year: 2013,
    annotation:
      "После гибели матери на выставке в музее подросток Тео случайно уносит с собой картину старого мастера — предмет, который определит всю его дальнейшую жизнь.",
    reviews: [
      { userId: 14, rating: 5, body: "800 страниц пролетели быстрее иной книги на 200." },
      { userId: 17, rating: 3, body: "Начало гениальное, но к середине провисает — растянуто." },
    ],
  },
  {
    title: "Волшебник Изумрудного города",
    author: "Александр Волков",
    genre: "Молодежная литература",
    year: 1939,
    annotation:
      "Девочка Элли вместе с песиком Тотошкой попадает ураганом в волшебную страну и отправляется в Изумрудный город, чтобы найти дорогу домой.",
    reviews: [
      { userId: 7, rating: 5, body: "Перечитала во взрослом возрасте — заходит ничуть не хуже, чем в детстве." },
      { userId: 19, rating: 4, body: "Классика на все времена, хотя пересказ Баума местами чувствуется." },
    ],
  },
  {
    title: "Список Шиндлера",
    author: "Томас Кенилли",
    olQuery: "Schindler's List Thomas Keneally",
    genre: "История",
    year: 1982,
    annotation:
      "Документальный роман о немецком промышленнике Оскаре Шиндлере, который спас более тысячи евреев от лагерей смерти, устроив их работать на своих фабриках.",
    reviews: [
      { userId: 8, rating: 5, body: "Читал и плакал — редкая книга, где документальность не убивает эмоцию." },
      { userId: 20, rating: 5, body: "Тяжёлая, но абсолютно необходимая книга." },
    ],
  },
  {
    title: "Крёстный отец",
    author: "Марио Пьюзо",
    olQuery: "The Godfather Mario Puzo",
    genre: "Триллер",
    year: 1969,
    annotation:
      "История сицилийской мафиозной семьи Корлеоне во главе с доном Вито Корлеоне — о власти, чести и цене, которую платит семья за жизнь вне закона.",
    reviews: [
      { userId: 6, rating: 5, body: "Проза плотнее фильма, хотя и он гениален." },
      { userId: 17, rating: 4, body: "Затянуто в середине, но атмосфера непревзойдённая." },
    ],
  },
  {
    title: "Зелёная миля",
    author: "Стивен Кинг",
    olQuery: "The Green Mile Stephen King",
    genre: "Хоррор",
    year: 1996,
    annotation:
      "Надзиратель блока смертников тюрьмы «Холодная гора» становится свидетелем необъяснимого дара одного из заключённых — гиганта, обвинённого в убийстве, которого он не совершал.",
    reviews: [
      { userId: 9, rating: 5, body: "Кинг умеет выжимать слёзы, не скатываясь в дешёвую сентиментальность." },
      { userId: 23, rating: 4, body: "Растянуто по частям было в оригинале, но целиком читается на одном дыхании." },
    ],
  },
  {
    title: "Слепота",
    author: "Жозе Сарамаго",
    olQuery: "Blindness Jose Saramago",
    genre: "Роман",
    year: 1995,
    annotation:
      "Загадочная эпидемия «белой слепоты» поражает целый город, и общество стремительно скатывается к варварству — притча о цивилизации и её хрупкости.",
    reviews: [
      { userId: 14, rating: 5, body: "Физически неприятно читать — и именно поэтому это работает." },
      { userId: 5, rating: 4, body: "Стиль Сарамаго (без привычной пунктуации) первые страницы бесит, потом привыкаешь." },
    ],
  },
  {
    title: "Тихий Дон",
    author: "Михаил Шолохов",
    olQuery: "And Quiet Flows the Don Mikhail Sholokhov",
    genre: "Роман",
    year: 1928,
    annotation:
      "Роман-эпопея о донском казачестве в годы Первой мировой войны, революции и Гражданской войны, показанных через судьбу Григория Мелехова.",
    reviews: [
      { userId: 15, rating: 5, body: "Масштаб как у «Войны и мира», но роднее и страшнее." },
      { userId: 22, rating: 4, body: "Диалекты казачьей речи местами тяжело читать, но того стоит." },
    ],
  },
  {
    title: "Доктор Джекил и мистер Хайд",
    author: "Роберт Льюис Стивенсон",
    olQuery: "Strange Case of Dr Jekyll and Mr Hyde Robert Louis Stevenson",
    genre: "Хоррор",
    year: 1886,
    annotation:
      "Уважаемый лондонский доктор создаёт зелье, высвобождающее его тёмную сторону, — классическая повесть о раздвоении личности и природе зла.",
    reviews: [
      { userId: 12, rating: 4, body: "Коротко, но идея разошлась по культуре не просто так." },
      { userId: 19, rating: 4, body: "Зная твист заранее, всё равно интересно следить за структурой повествования." },
    ],
  },
  {
    title: "Затерянный мир",
    author: "Артур Конан Дойл",
    olQuery: "The Lost World Arthur Conan Doyle",
    genre: "Приключения",
    year: 1912,
    annotation:
      "Экспедиция профессора Челленджера отправляется в затерянный уголок Южной Америки, где, вопреки всем законам природы, до сих пор живут динозавры.",
    reviews: [
      { userId: 7, rating: 4, body: "Наивно по нынешним меркам, но драйв никуда не делся." },
      { userId: 11, rating: 5, body: "Челленджер — один из любимых литературных персонажей, характер огонь." },
    ],
  },
  {
    title: "Мы",
    author: "Евгений Замятин",
    olQuery: "We Yevgeny Zamyatin",
    genre: "Антиутопия",
    year: 1920,
    annotation:
      "Антиутопия о Едином Государстве, где люди — лишь «нумера», лишённые имён и личной жизни, — книга, предвосхитившая «1984» и «О дивный новый мир».",
    reviews: [
      { userId: 13, rating: 5, body: "Прочитал после «1984» и понял, откуда Оруэлл черпал вдохновение." },
      { userId: 24, rating: 4, body: "Язык непростой, но именно в этом «остранении» весь смысл." },
    ],
  },
  {
    title: "Степной волк",
    author: "Герман Гессе",
    olQuery: "Steppenwolf Hermann Hesse",
    genre: "Роман",
    year: 1927,
    annotation:
      "Одинокий интеллектуал Гарри Галлер разрывается между звериной и человеческой сторонами своей натуры в поисках смысла среди мещанского благополучия.",
    reviews: [
      { userId: 16, rating: 4, body: "Магический театр — одна из самых странных и завораживающих глав в литературе." },
      { userId: 10, rating: 3, body: "Слишком много рефлексии на мой вкус, но написано мастерски." },
    ],
  },
  {
    title: "Игра в бисер",
    author: "Герман Гессе",
    olQuery: "The Glass Bead Game Hermann Hesse",
    genre: "Роман",
    year: 1943,
    annotation:
      "Утопия о будущем, где элита посвящает жизнь абстрактной интеллектуальной Игре, соединяющей музыку, математику и все области знания.",
    reviews: [
      { userId: 21, rating: 4, body: "Медленная, философская, не для всех — но идея Игры западает в голову надолго." },
      { userId: 18, rating: 4, body: "Дочитал не сразу, возвращался несколько раз, и это тот случай, когда оно того стоило." },
    ],
  },
  {
    title: "Вино из одуванчиков",
    author: "Рэй Брэдбери",
    olQuery: "Dandelion Wine Ray Bradbury",
    genre: "Классика",
    year: 1957,
    annotation:
      "Лирическая повесть об одном лете двенадцатилетнего мальчика в провинциальном американском городке — о взрослении, памяти и мимолётности счастья.",
    reviews: [
      { userId: 8, rating: 5, body: "Самая тёплая книга Брэдбери, перечитываю каждое лето." },
      { userId: 6, rating: 5, body: "Про детство и лето лучше, кажется, никто не писал." },
    ],
  },
  {
    title: "Марсианские хроники",
    author: "Рэй Брэдбери",
    olQuery: "The Martian Chronicles Ray Bradbury",
    genre: "Научная фантастика",
    year: 1950,
    annotation:
      "Цикл рассказов о колонизации Марса людьми и постепенном исчезновении марсианской цивилизации, столкнувшейся с земным вторжением.",
    reviews: [
      { userId: 9, rating: 4, body: "Скорее сборник настроений, чем связный роман, но атмосфера потрясающая." },
      { userId: 14, rating: 5, body: "Грустнее, чем ожидал от книги про освоение Марса." },
    ],
  },
  {
    title: "Задача трёх тел",
    author: "Лю Цысинь",
    olQuery: "The Three-Body Problem Liu Cixin",
    genre: "Научная фантастика",
    year: 2008,
    annotation:
      "Контакт с инопланетной цивилизацией, балансирующей на грани гибели из-за хаотичной орбиты в системе трёх звёзд, меняет судьбу человечества.",
    reviews: [
      { userId: 5, rating: 5, body: "Научная фантастика в лучшем виде — идеи такого масштаба редко встретишь." },
      { userId: 15, rating: 4, body: "Первая часть трилогии медленно раскачивается, но потом не оторваться." },
    ],
  },
  {
    title: "Джейн Эйр",
    author: "Шарлотта Бронте",
    olQuery: "Jane Eyre Charlotte Bronte",
    genre: "Роман",
    year: 1847,
    annotation:
      "История сироты Джейн Эйр, гувернантки с сильным характером, которая борется за право на собственное достоинство и любовь вопреки условностям викторианского общества.",
    reviews: [
      { userId: 22, rating: 5, body: "Джейн — один из первых по-настоящему независимых женских персонажей в литературе." },
      { userId: 12, rating: 4, body: "Готическая атмосфера Торнфилда сделана мастерски." },
    ],
  },
  {
    title: "Грозовой перевал",
    author: "Эмили Бронте",
    olQuery: "Wuthering Heights Emily Bronte",
    genre: "Роман",
    year: 1847,
    annotation:
      "Мрачная история одержимой, разрушительной любви Хитклифа и Кэтрин, разворачивающаяся на фоне суровых йоркширских пустошей.",
    reviews: [
      { userId: 19, rating: 4, body: "Хитклиф не герой и не злодей — просто человек, которого искалечила нелюбовь." },
      { userId: 7, rating: 5, body: "Самая мрачная и самая красивая история любви, что я читала." },
    ],
  },
];

async function addMoreBooks() {
  const existingBooks = await Book.findAll({ attributes: ["id", "title", "author"] });
  const existingKey = (title, author) => `${normalize(title)}|${normalize(author)}`;
  const existingKeys = new Set(existingBooks.map((b) => existingKey(b.title, b.author)));

  let created = 0;
  let skipped = 0;
  let reviewsAdded = 0;

  for (const entry of NEW_BOOKS) {
    if (existingKeys.has(existingKey(entry.title, entry.author))) {
      console.log(`- ${entry.title}: already in the catalog, skipping`);
      skipped += 1;
      continue;
    }

    // eslint-disable-next-line no-await-in-loop
    // Open Library is fundamentally an English-first catalog — searching
    // with the Cyrillic title/author this site displays often finds
    // nothing at all (title-only fallback inside searchOpenLibraryCover
    // doesn't help when the *title itself* is a translation, not just the
    // author). Where known, olQuery gives it the original English title
    // instead, which is what Open Library actually indexes well.
    const lookup = entry.olQuery
      ? await searchOpenLibraryCover(entry.olQuery, "")
      : await searchOpenLibraryCover(entry.title, entry.author);

    // eslint-disable-next-line no-await-in-loop
    const book = await Book.create({
      title: entry.title,
      author: entry.author,
      genre: entry.genre,
      year: entry.year,
      annotation: entry.annotation,
      img: lookup?.img || "https://cdn1.ozone.ru/s3/multimedia-x/6597669093.jpg",
      isbn: lookup?.isbn || [],
      status: "approved",
    });
    created += 1;

    for (const review of entry.reviews) {
      // eslint-disable-next-line no-await-in-loop
      const user = await User.findByPk(review.userId, { attributes: ["id"] });
      if (!user) {
        console.warn(`  ! user ${review.userId} not found, skipping their review for "${entry.title}"`);
        continue;
      }
      // eslint-disable-next-line no-await-in-loop
      await Review.create({ bookId: book.id, userId: review.userId, user_rating: review.rating, body: review.body });
      reviewsAdded += 1;
    }

    // eslint-disable-next-line no-await-in-loop
    await recomputeBookRating(book.id);
    console.log(`✓ ${entry.title} — cover ${lookup?.img ? "found" : "default"}, ${entry.reviews.length} reviews`);
  }

  console.log(`\nDone: ${created} books created, ${skipped} already present, ${reviewsAdded} reviews added.`);
}

if (require.main === module) {
  addMoreBooks()
    .then(() => sequelize.close())
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
      return sequelize.close();
    });
}

module.exports = addMoreBooks;
