'use strict';

/** @type {import('sequelize-cli').Migration} */

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;  // define your schema in options object
}

module.exports = {
  async up(queryInterface, Sequelize) {
    options.tableName = 'ReviewImages';
    return queryInterface.bulkInsert(options, [
      {
        url: 'www.abnb/spot-images/espana',
        reviewId: 1
      },
      {
        url: 'www.abnb/spot-images/mexico',
        reviewId: 2
      },
      {
        url: 'www.abnb/spot-images/amsterdam',
        reviewId: 3
      }
    ], {}) //OPTIONS OBJECT
  },

  async down(queryInterface, Sequelize) {
    options.tableName = 'ReviewImages';
    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(options, {
      reviewId: { [Op.in]: [1, 2, 3] }
    }, {}) //OPTIONS OBJECT
  }
};
