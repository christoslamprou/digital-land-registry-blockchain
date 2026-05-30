const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TransferRequest = sequelize.define('TransferRequest', {
    id: { 
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        autoIncrement: true 
    },
    assetId: { 
        type: DataTypes.STRING, 
        allowNull: false 
    },
    currentOwnerHash: { 
        type: DataTypes.STRING, 
        allowNull: false 
    },
    newOwnerHash: { 
        type: DataTypes.STRING, 
        allowNull: false 
    },
    documentHash: { 
        type: DataTypes.STRING, // IPFS Hash of the proposed new contract
        allowNull: false 
    },
    // Tracking Consents
    currentOwnerApproved: { 
        type: DataTypes.BOOLEAN, 
        defaultValue: false 
    },
    newOwnerApproved: { 
        type: DataTypes.BOOLEAN, 
        defaultValue: false 
    },
    // Status can be: 'PENDING', 'READY', 'COMPLETED'
    status: { 
        type: DataTypes.STRING, 
        defaultValue: 'PENDING' 
    }
});

module.exports = TransferRequest;