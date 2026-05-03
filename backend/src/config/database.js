const { Sequelize } = require('sequelize');

// Connection parameters: database, username, password
const sequelize = new Sequelize('land_registry', 'postgres', 'admin', {
    host: 'localhost',
    dialect: 'postgres',
    logging: false // Disable SQL logging in terminal to keep it clean
});

module.exports = sequelize;