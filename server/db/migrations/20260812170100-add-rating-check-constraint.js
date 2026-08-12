"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE "Reviews"
      ADD CONSTRAINT reviews_rating_range CHECK (user_rating BETWEEN 1 AND 5);
    `);
  },
  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE "Reviews" DROP CONSTRAINT reviews_rating_range;
    `);
  },
};
