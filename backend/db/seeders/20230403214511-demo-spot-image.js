'use strict';

/** @type {import('sequelize-cli').Migration} */

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;  // define your schema in options object
}

module.exports = {
  async up(queryInterface, Sequelize) {
    options.tableName = 'SpotImages';
    return queryInterface.bulkInsert(options, [
      {
        spotId: 1,
        url: 'www.abnb/spot-images/espana',
        preview: true
      },
      {
        spotId: 2,
        url: 'www.abnb/spot-images/mexico',
        preview: true
      },
      {
        spotId: 3,
        url: 'www.abnb/spot-images/amsterdam',
        preview: true
      }
    ], {})  //OPTION OBJECT
  },

  async down(queryInterface, Sequelize) {
    options.tableName = 'SpotImages';
    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(options, {
      spotId: { [Op.in]: [1, 2, 3] }
    }, {})  //OPTION OBJECT
  }
};
