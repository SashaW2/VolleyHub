const { Op } = require('sequelize');
const User = require('../models/User');
const Notification = require('../models/Notification');

class UserRepository {
    async create(userData) {
        if (!userData.roleId) {
            userData.roleId = 1;
        }
        return await User.create(userData);
    }

    async findById(id) {
        return await User.findByPk(id);
    }

    async findByEmail(email) {
        return await User.findOne({ where: { email } });
    }

    async findAll(filters = {}) {
        const where = {};
        if (filters.gameLevel) {
            const levelMap = { 'D1': 1, 'D2': 2, 'D3': 3, 'D4': 4, 'D4Plus': 5 };
            where.gameLevel = levelMap[filters.gameLevel] || filters.gameLevel;
        }
        if (filters.isBlocked !== undefined) where.isBlocked = filters.isBlocked;
        if (filters.search) {
            where[Op.or] = [
                { name: { [Op.like]: `%${filters.search}%` } },
                { email: { [Op.like]: `%${filters.search}%` } },
                { phone: { [Op.like]: `%${filters.search}%` } }
            ];
        }
        return await User.findAll({ where });
    }

    async update(id, userData) {
        const user = await User.findByPk(id);
        if (!user) return null;
        return await user.update(userData);
    }

    async delete(id) {
        const user = await User.findByPk(id);
        if (!user) return false;
        await user.destroy();
        return true;
    }

    async getUserNotifications(userId) {
        return await Notification.findAll({
            where: { userId },
            order: [['createdDate', 'DESC']]
        });
    }
}

module.exports = new UserRepository();