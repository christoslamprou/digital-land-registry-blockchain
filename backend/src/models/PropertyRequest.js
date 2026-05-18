const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PropertyRequest = sequelize.define('PropertyRequest', {
    id: { 
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        autoIncrement: true 
    },
    requestType: { 
        type: DataTypes.STRING, // Expected values: 'MINT' or 'UPDATE'
        allowNull: false 
    },
    assetId: { 
        type: DataTypes.STRING, 
        allowNull: false 
    },
    ownerHash: { 
        type: DataTypes.STRING, 
        allowNull: false 
    },
    fullAddress: { type: DataTypes.STRING },
    surfaceArea: { type: DataTypes.FLOAT },
    objectiveValue: { type: DataTypes.FLOAT },
    landUsage: { type: DataTypes.STRING },
    constructionYear: { type: DataTypes.INTEGER },
    
    documentHash: { 
        type: DataTypes.STRING, // IPFS Hash of the uploaded document
        allowNull: false 
    },
    engineerStatus: { 
        type: DataTypes.STRING, 
        defaultValue: 'PENDING' // Expected values: 'PENDING', 'APPROVED', 'REJECTED'
    },
    staffStatus: { 
        type: DataTypes.STRING, 
        defaultValue: 'PENDING' // Expected values: 'PENDING', 'APPROVED', 'REJECTED'
    },
    comments: { 
        type: DataTypes.TEXT // Optional rejection/approval comments
    }
});

module.exports = PropertyRequest;