const Sequelize = require('sequelize');
module.exports = {
  name: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
  },
  gid: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  description: {
    type: Sequelize.STRING,
    allowNull: true,
  }
};
