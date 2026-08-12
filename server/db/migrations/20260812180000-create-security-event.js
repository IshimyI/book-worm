"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("SecurityEvents", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      type: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      email: {
        type: Sequelize.STRING,
      },
      ip: {
        type: Sequelize.STRING,
      },
      detail: {
        type: Sequelize.STRING,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("NOW"),
      },
    });
    await queryInterface.addIndex("SecurityEvents", ["type"], {
      name: "security_events_type_idx",
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable("SecurityEvents");
  },
};
