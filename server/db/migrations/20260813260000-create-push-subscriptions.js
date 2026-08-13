"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("PushSubscriptions", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      userId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: { model: "Users", key: "id" },
        onDelete: "CASCADE",
      },
      endpoint: {
        allowNull: false,
        type: Sequelize.TEXT,
      },
      p256dh: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      auth: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("NOW"),
      },
    });
    // A browser/device can only have one active subscription per endpoint —
    // re-subscribing (e.g. after clearing site data) replaces it, not stacks.
    await queryInterface.addIndex("PushSubscriptions", [Sequelize.literal('(md5("endpoint"))')], {
      unique: true,
      name: "push_subscriptions_unique_endpoint",
    });
    await queryInterface.addIndex("PushSubscriptions", ["userId"], {
      name: "push_subscriptions_user_idx",
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable("PushSubscriptions");
  },
};
