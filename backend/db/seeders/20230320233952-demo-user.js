'use strict';
const bcrypt = require("bcryptjs");

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;  // define your schema in options object
}

module.exports = {
  up: async (queryInterface, Sequelize) => {
    options.tableName = 'Users';
    return queryInterface.bulkInsert(options, [
      {
        email: 'demo@mundanity.io',
        username: 'Demo-lition',
        hashedPassword: bcrypt.hashSync('password')
      },
      {
        email: 'mus@mundanity.io',
        username: 'musiemu',
        hashedPassword: bcrypt.hashSync('password2')
      },
      {
        email: 'misty@mundanity.io',
        username: 'mistybean',
        hashedPassword: bcrypt.hashSync('password3')
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    options.tableName = 'Users';
    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(options, {
      username: { [Op.in]: ['Demo-lition', 'FakeUser1', 'FakeUser2'] }
    }, {});
  }
};
