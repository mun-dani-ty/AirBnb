'use strict';

/** @type {import('sequelize-cli').Migration} */

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;  // define your schema in options object
}

module.exports = {
  async up(queryInterface, Sequelize) {
    options.tableName = 'Reviews';
    return queryInterface.bulkInsert(options, [
      {
        userId: 1,
        spotId: 1,
        review: 'I would move here in a heartbeat!!',
        stars: 5
      },
      {
        userId: 2,
        spotId: 2,
        review: 'Me siento bien aqui. Como si fuera mi casa.',
        stars: 5
      },
      {
        userId: 3,
        spotId: 3,
        review: 'So many things to do. Wish I had booked for longer.',
        stars: 5
      }
    ], {}) //OPTIONS OBJECT
  },

  async down(queryInterface, Sequelize) {
    options.tableName = 'Reviews';
    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(options, {
      spotId: { [Op.in]: [1, 2, 3] }
    }, {}) //OPTIONS OBJECT
  }
};
