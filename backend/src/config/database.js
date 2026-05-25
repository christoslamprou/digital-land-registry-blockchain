const { Sequelize } = require('sequelize');

// Use environment variable for the database host, 
// defaulting to 'host.docker.internal' for Docker container compatibility.
const dbHost = process.env.DB_HOST || 'host.docker.internal';

// Connection parameters: database, username, password
const sequelize = new Sequelize('land_registry', 'postgres', 'admin', {
    host: dbHost,
    dialect: 'postgres',
    logging: false // Disable SQL logging in terminal to keep it clean
});

module.exports = sequelize;