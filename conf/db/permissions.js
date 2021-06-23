const Sequelize = require('sequelize');
module.exports.users = {
  name: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
  },
  description: {
    type: Sequelize.STRING,
    allowNull: true,
  }
};
