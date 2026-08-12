"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE "Books"
      ADD COLUMN search_vector tsvector
      GENERATED ALWAYS AS (
        setweight(to_tsvector('russian', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('russian', coalesce(author, '')), 'B') ||
        setweight(to_tsvector('russian', coalesce(annotation, '')), 'C')
      ) STORED;
    `);
    await queryInterface.sequelize.query(`
      CREATE INDEX books_search_vector_idx ON "Books" USING GIN (search_vector);
    `);
  },
  async down(queryInterface) {
    await queryInterface.sequelize.query(`DROP INDEX IF EXISTS books_search_vector_idx;`);
    await queryInterface.sequelize.query(`ALTER TABLE "Books" DROP COLUMN IF EXISTS search_vector;`);
  },
};
