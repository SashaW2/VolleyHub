const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AdvertParticipant = sequelize.define('AdvertParticipant', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'Id'
    },
    advertId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'AdvertId'
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'UserId'
    },
    joinedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'JoinedAt'
    }
}, {
    tableName: 'AdvertParticipants',
    timestamps: false
});

module.exports = AdvertParticipant;