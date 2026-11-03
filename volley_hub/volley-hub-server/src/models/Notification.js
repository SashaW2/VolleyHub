const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'Id'
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'UserId'
    },
    text: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: 'Text'
    },
    createdDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'CreatedDate'
    },
    isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'IsRead'
    },
    notificationType: {
        type: DataTypes.STRING(50),
        defaultValue: 'system',
        field: 'NotificationType'
    }
}, {
    tableName: 'Notifications',
    timestamps: false
});

module.exports = Notification;