const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

// Функция преобразования уровня игры из строки в число
const getGameLevelValue = (level) => {
    const levels = {
        'D1': 1,
        'D2': 2,
        'D3': 3,
        'D4': 4,
        'D4Plus': 5
    };
    return levels[level] || 1;
};

// Функция преобразования числа в строку
const getGameLevelName = (value) => {
    const levels = {
        1: 'D1',
        2: 'D2',
        3: 'D3',
        4: 'D4',
        5: 'D4Plus'
    };
    return levels[value] || 'D2';
};

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'Id'
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'Name'
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        field: 'Email'
    },
    phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
        field: 'Phone'
    },
    gameLevel: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 2,
        field: 'GameLevel',
        set(value) {
            const numericValue = typeof value === 'string' ? getGameLevelValue(value) : value;
            this.setDataValue('gameLevel', numericValue);
        }
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'Password'
    },
    language: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: 'ru',
        field: 'Language'
    },
    theme: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'light',
        field: 'Theme'
    },
    isBlocked: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'IsBlocked'
    },
    roleId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        field: 'RoleId'
    }
}, {
    tableName: 'Users',
    timestamps: false,
    hooks: {
        beforeCreate: async (user) => {
            if (user.password) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }
        },
        beforeUpdate: async (user) => {
            if (user.changed('password')) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }
        }
    }
});

User.prototype.comparePassword = async function(password) {
    return await bcrypt.compare(password, this.password);
};

User.prototype.isAdmin = function() {
    return this.roleId === 2;
};

module.exports = User;