const Sequelize = require('sequelize');
module.exports.users = {
  name: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
  },
  permissions: {
    type: Sequelize.JSON,
  }
};
