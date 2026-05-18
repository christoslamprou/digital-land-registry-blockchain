const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PropertyRecord = sequelize.define('PropertyRecord', {
    propertyId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    kaek: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    ownerHash: {
        type: DataTypes.STRING,
        allowNull: false
    },
    fullAddress: {
        type: DataTypes.STRING,
        allowNull: false
    },
    surfaceArea: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    objectiveValue: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    landUsage: {
        type: DataTypes.STRING,
        allowNull: true
    },
    constructionYear: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    tableName: 'properties',
    timestamps: true // Automatically adds createdAt and updatedAt columns
});

module.exports = PropertyRecord;