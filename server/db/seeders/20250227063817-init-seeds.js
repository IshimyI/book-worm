"use strict";
const bcrypt = require("bcrypt");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "Users",
      [
        {
          name: "Маша",
          email: "1@1",
          password: await bcrypt.hash("1", 10),
          isEmailConfirmed: true,
        },
        {
          name: "Дима",
          email: "2@2",
          password: await bcrypt.hash("2", 10),
          isEmailConfirmed: true,
        },
        {
          name: "Света",
          email: "3@3",
          password: await bcrypt.hash("3", 10),
          isEmailConfirmed: true,
        },
        {
          name: "Ваня",
          email: "4@4",
          password: await bcrypt.hash("4", 10),
          isEmailConfirmed: true,
        },
      ],
      {}
    );
    await queryInterface.bulkInsert(
      "Books",
      [
        {
          title: "Война и мир",
          author: "Лев Толстой",
          annotation:
            "роман-эпопея Льва Николаевича Толстого, описывающий русское общество в эпоху войн против Наполеона в 1805—1812 годах. Эпилог романа доводит повествование до 1820 года.",
          quantity_rate: 3,
          rating: "4.33",
          img: "https://book-cover.ru/sites/default/files/styles/medium-list/public/field/image/tolstoj-vojna-i-mir-amerika-2.jpg?itok=4T_LuEzE",
          genre: "Исторический роман",
          year: 1869,
        },
        {
          title: "Гарри Поттер и философский камень",
          author: "Дж.К. Роулинг",
          annotation:
            "серия романов, написанная британской писательницей Дж. К. Роулинг. Книги представляют собой хронику приключений юного волшебника Гарри Поттера, а также его друзей Рона Уизли и Гермионы Грейнджер, обучающихся в школе чародейства и волшебства Хогвартс.",
          quantity_rate: 2,
          rating: 4,
          img: "https://hpclub.ru/wp-content/uploads/2013/02/newhpcover.jpg",
          genre: "Фэнтези",
          year: 1997,
        },
      ],
      {}
    );
    await queryInterface.bulkInsert(
      "Reviews",
      [
        {
          body: "Очень интересно",
          bookId: 1,
          userId: 1,
          user_rating: 5,
        },
        {
          body: "Книга о многом",
          bookId: 1,
          userId: 2,
          user_rating: 3,
        },
        {
          body: "Просто великолепно",
          bookId: 1,
          userId: 3,
          user_rating: 5,
        },
        {
          body: "Захватывающе",
          bookId: 2,
          userId: 1,
          user_rating: 4,
        },
        {
          body: "Отличная книга",
          bookId: 2,
          userId: 2,
          user_rating: 4,
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  },
};
