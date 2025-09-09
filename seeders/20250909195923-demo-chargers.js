"use strict";
const { v4: uuidv4 } = require("uuid");

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("chargers", [
      {
        id: uuidv4(),
        name: "Charger Station 1",
        latitude: 28.6139,
        longitude: 77.2090,
        address: "Connaught Place, New Delhi",
        status: "active",
        charger_type: "fast",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        name: "Charger Station 2",
        latitude: 19.0760,
        longitude: 72.8777,
        address: "Mumbai Central",
        status: "active",
        charger_type: "normal",
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("chargers", null, {});
  },
};
