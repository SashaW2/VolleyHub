const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AdvertSubscriber = sequelize.define('AdvertSubscriber', {
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
    subscribedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'SubscribedAt'
    }
}, {
    tableName: 'AdvertSubscribers',
    timestamps: false
});

module.exports = AdvertSubscriber;