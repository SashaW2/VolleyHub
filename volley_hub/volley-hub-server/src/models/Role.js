const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Role = sequelize.define('Role', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'Id'
    },
    name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        field: 'Name'
    }
}, {
    tableName: 'Roles',
    timestamps: false
});

module.exports = Role;