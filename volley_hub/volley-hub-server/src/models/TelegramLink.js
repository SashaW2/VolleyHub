const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TelegramLink = sequelize.define('TelegramLink', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'Id'
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        field: 'UserId'
    },
    chatId: {
        type: DataTypes.STRING(32),
        allowNull: false,
        unique: true,
        field: 'ChatId'
    },
    username: {
        type: DataTypes.STRING(64),
        allowNull: true,
        field: 'Username'
    },
    linkedDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'LinkedDate'
    },
    notificationsEnabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'NotificationsEnabled'
    }
}, {
    tableName: 'TelegramLinks',
    timestamps: false
});

module.exports = TelegramLink;
