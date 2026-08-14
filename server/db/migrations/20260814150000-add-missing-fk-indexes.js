"use strict";
/** @type {import('sequelize-cli').Migration} */
// Postgres does not auto-index a foreign key column the way it does a
// primary key — a composite unique index like (blockerId, blockedId) only
// covers lookups that start with blockerId, leaving plain queries on
// blockedId (or cascade deletes through it) doing a full table scan.
// Found via information_schema cross-referenced against pg_index; these
// eight FK columns had no leading index at all.
const TARGETS = [
  { table: "Blocks", column: "blockedId" },
  { table: "Notifications", column: "actorId" },
  { table: "Quotes", column: "userId" },
  { table: "ReadingListBooks", column: "bookId" },
  { table: "ReadingStatuses", column: "bookId" },
  { table: "ReviewComments", column: "userId" },
  { table: "ReviewVotes", column: "userId" },
  { table: "UserReports", column: "reportedId" },
];

module.exports = {
  async up(queryInterface) {
    for (const { table, column } of TARGETS) {
      // eslint-disable-next-line no-await-in-loop
      await queryInterface.addIndex(table, [column], {
        name: `${table.toLowerCase()}_${column.toLowerCase()}_idx`,
      });
    }
  },
  async down(queryInterface) {
    for (const { table, column } of TARGETS) {
      // eslint-disable-next-line no-await-in-loop
      await queryInterface.removeIndex(table, `${table.toLowerCase()}_${column.toLowerCase()}_idx`);
    }
  },
};
