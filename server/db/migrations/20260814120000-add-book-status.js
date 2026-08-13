"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Existing books were all seeded/vetted before this column existed —
    // default them to "approved" so the migration doesn't hide anything
    // already in the catalog. Only newly user-submitted books start pending.
    await queryInterface.addColumn("Books", "status", {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: "approved",
    });
    await queryInterface.addIndex("Books", ["status"], { name: "books_status_idx" });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn("Books", "status");
  },
};
