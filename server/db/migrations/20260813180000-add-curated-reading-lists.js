"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("ReadingLists", "isCurated", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.addColumn("ReadingLists", "description", {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.addIndex("ReadingLists", ["isCurated"], {
      name: "reading_lists_curated_idx",
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn("ReadingLists", "description");
    await queryInterface.removeColumn("ReadingLists", "isCurated");
  },
};
