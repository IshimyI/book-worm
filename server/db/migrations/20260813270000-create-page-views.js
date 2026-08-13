"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Deliberately minimal: no IP, no user agent, no visitor/session id —
    // aggregate pageview counts only, nothing that could identify a person
    // or a returning visitor. That's the whole point of "privacy-friendly."
    await queryInterface.createTable("PageViews", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      path: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      referrer: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("NOW"),
      },
    });
    await queryInterface.addIndex("PageViews", ["createdAt"], { name: "page_views_created_at_idx" });
    await queryInterface.addIndex("PageViews", ["path"], { name: "page_views_path_idx" });
  },
  async down(queryInterface) {
    await queryInterface.dropTable("PageViews");
  },
};
