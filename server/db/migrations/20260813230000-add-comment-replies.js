"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("ReviewComments", "parentCommentId", {
      allowNull: true,
      type: Sequelize.INTEGER,
      references: { model: "ReviewComments", key: "id" },
      onDelete: "CASCADE",
    });
    await queryInterface.addIndex("ReviewComments", ["parentCommentId"], {
      name: "review_comments_parent_idx",
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn("ReviewComments", "parentCommentId");
  },
};
