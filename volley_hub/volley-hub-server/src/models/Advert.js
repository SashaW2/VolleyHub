const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Advert = sequelize.define('Advert', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'Id'
    },
    address: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'Address'
    },
    date: {
        type: DataTypes.STRING(10),
        allowNull: false,
        field: 'Date'
    },
    startTime: {
        type: DataTypes.TIME,
        allowNull: false,
        field: 'StartTime'
    },
    endTime: {
        type: DataTypes.TIME,
        allowNull: false,
        field: 'EndTime'
    },
    gameLevel: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'GameLevel'
    },
    cost: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        field: 'Cost'
    },
    peopleCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'PeopleCount'
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'Description'
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'UserId'
    },
    createdDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'CreatedDate'
    },
    twoHourNotificationSent: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'TwoHourNotificationSent'
    }
}, {
    tableName: 'Adverts',
    timestamps: false
});

module.exports = Advert;