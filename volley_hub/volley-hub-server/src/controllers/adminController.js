const userRepository = require('../repositories/userRepository');
const advertRepository = require('../repositories/advertRepository');
const notificationRepository = require('../repositories/notificationRepository');

class AdminController {
    async getAllUsers(req, res) {
        try {
            const users = await userRepository.findAll();

            const usersWithoutPassword = users
                .filter(user => {
                    const isAdmin = user.roleId === 2 || user.role === 'admin' || user.isAdmin === true;
                    return !isAdmin;
                })
                .map(user => {
                    const { password, ...userWithoutPassword } = user.dataValues;
                    return userWithoutPassword;
                });

            res.json({ success: true, users: usersWithoutPassword });
        } catch (error) {
            console.error('Error in getAllUsers:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getStatistics(req, res) {
        try {
            const adverts = await advertRepository.findAll();
            const allUsers = await userRepository.findAll();

            const regularUsers = allUsers.filter(user => {
                const isAdmin = user.roleId === 2 || user.role === 'admin' || user.isAdmin === true;
                return !isAdmin;
            });

            const now = new Date();
            const lastMonth = new Date(now);
            lastMonth.setMonth(lastMonth.getMonth() - 1);

            const addressCount = {};
            adverts.forEach(a => { addressCount[a.address] = (addressCount[a.address] || 0) + 1; });
            const maxAddress = Math.max(...Object.values(addressCount), 0);
            const mostPopularAddress = Object.keys(addressCount).find(key => addressCount[key] === maxAddress) || 'Нет данных';

            const levelMap = { 1: 'D1', 2: 'D2', 3: 'D3', 4: 'D4', 5: 'D4+' };
            const levelCount = {};
            adverts.forEach(a => {
                const levelName = levelMap[a.gameLevel] || a.gameLevel;
                levelCount[levelName] = (levelCount[levelName] || 0) + 1;
            });
            const maxLevel = Math.max(...Object.values(levelCount), 0);
            const mostPopularLevel = Object.keys(levelCount).find(key => levelCount[key] === maxLevel) || 'Нет данных';

            const avgCost = adverts.length > 0 ? (adverts.reduce((sum, a) => sum + parseFloat(a.cost), 0) / adverts.length).toFixed(2) : '0';
            const adsLastMonth = adverts.filter(a => new Date(a.createdDate) > lastMonth).length;
            const blockedUsers = regularUsers.filter(u => u.isBlocked === true).length;

            res.json({
                success: true,
                statistics: {
                    mostPopularAddress,
                    mostPopularLevel,
                    averageCost: `${avgCost} руб.`,
                    adsLastMonth,
                    totalUsers: regularUsers.length,
                    blockedUsers
                }
            });
        } catch (error) {
            console.error('Error in getStatistics:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async blockUser(req, res) {
        try {
            const { id } = req.params;
            const user = await userRepository.findById(id);

            if (!user) {
                return res.status(404).json({ success: false, message: 'Пользователь не найден' });
            }

            const isAdmin = user.roleId === 2 || user.role === 'admin' || user.isAdmin === true;
            if (isAdmin) {
                return res.status(403).json({ success: false, message: 'Нельзя блокировать администратора' });
            }

            await userRepository.update(id, { isBlocked: true });
            res.json({ success: true, message: 'Пользователь заблокирован' });
        } catch (error) {
            console.error('Error in blockUser:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async unblockUser(req, res) {
        try {
            const { id } = req.params;
            const user = await userRepository.findById(id);

            if (!user) {
                return res.status(404).json({ success: false, message: 'Пользователь не найден' });
            }

            const isAdmin = user.roleId === 2 || user.role === 'admin' || user.isAdmin === true;
            if (isAdmin) {
                return res.status(403).json({ success: false, message: 'Нельзя разблокировать администратора' });
            }

            await userRepository.update(id, { isBlocked: false });
            res.json({ success: true, message: 'Пользователь разблокирован' });
        } catch (error) {
            console.error('Error in unblockUser:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async sendNotification(req, res) {
        try {
            const { userId, text } = req.body;

            if (!userId || !text) {
                return res.status(400).json({ success: false, message: 'Не указан пользователь или текст уведомления' });
            }

            const escapedText = text.replace(/'/g, "''");

            const query = `
                INSERT INTO Notifications (UserId, Text, CreatedDate, IsRead, NotificationType)
                VALUES (${userId}, N'[АДМИН] ${escapedText}', GETDATE(), 0, 'admin')
            `;

            const result = await notificationRepository.executeRawQuery(query);

            res.json({ success: true, message: 'Уведомление отправлено' });
        } catch (error) {
            console.error('Error in sendNotification:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new AdminController();