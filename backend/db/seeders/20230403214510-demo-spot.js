'use strict';

/** @type {import('sequelize-cli').Migration} */

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;  // define your schema in options object
}

module.exports = {
  async up(queryInterface, Sequelize) {
    //create demo spots with the columns
    options.tableName = 'Spots';
    return queryInterface.bulkInsert(options, [
      {
        ownerId: 1,
        address: 'Av. de Sarrià, 50, 08029 Barcelona, Spain',
        city: 'barcelona',
        state: 'catalan',
        country: 'españa',
        lat: 1.0,
        lng: 1.0,
        name: 'sunny city',
        description: 'the most beautiful city on earth',
        price: 10000.00
      },
      {
        ownerId: 2,
        address: 'Av. Rafael E. Melgar km 2.5',
        city: 'San Miguel de Cozumel',
        state: 'Quintana Roo',
        country: 'Mexico',
        lat: 2.0,
        lng: 2.0,
        name: 'mexican paradise',
        description: 'home away from home',
        price: 20000.00
      },
      {
        ownerId: 3,
        address: 'Waldorf Astoria Amsterdam',
        city: 'Amsterdam',
        state: 'n/a',
        country: 'Netherlands',
        lat: 3.0,
        lng: 3.0,
        name: 'Venice of the North',
        description: 'city of sin',
        price: 30000.00
      }
    ], {}) //OPTION OBJECT
  },

  async down(queryInterface, Sequelize) {
    options.tableName = 'Spots';
    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(options, {
      state: { [Op.in]: ['florida', 'new york', 'california'] }
    }, {}) //OPTION OBJECT
  }
};
