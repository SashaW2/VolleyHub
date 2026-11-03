// src/controllers/statisticsController.js
const advertRepository = require('../repositories/advertRepository');
const userRepository = require('../repositories/userRepository');

class StatisticsController {
    async getStatistics(req, res) {
        try {
            const adverts = await advertRepository.findAll();
            const users = await userRepository.findAll();

            const now = new Date();
            const lastMonth = new Date(now.setMonth(now.getMonth() - 1));

            const statistics = {
                mostPopularAddress: this.getMostPopularAddress(adverts),
                mostPopularLevel: this.getMostPopularLevel(adverts),
                averageCost: this.getAverageCost(adverts),
                adsLastMonth: adverts.filter(a => new Date(a.createdDate) > lastMonth).length,
                totalUsers: users.length,
                blockedUsers: users.filter(u => u.isBlocked).length
            };

            res.json({ success: true, statistics });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    getMostPopularAddress(adverts) {
        const addressCount = {};
        adverts.forEach(a => {
            addressCount[a.address] = (addressCount[a.address] || 0) + 1;
        });
        const max = Math.max(...Object.values(addressCount));
        return Object.keys(addressCount).find(key => addressCount[key] === max) || 'Нет данных';
    }

    getMostPopularLevel(adverts) {
        const levelCount = {};
        adverts.forEach(a => {
            levelCount[a.gameLevel] = (levelCount[a.gameLevel] || 0) + 1;
        });
        const max = Math.max(...Object.values(levelCount));
        return Object.keys(levelCount).find(key => levelCount[key] === max) || 'Нет данных';
    }

    getAverageCost(adverts) {
        if (adverts.length === 0) return '0 руб.';
        const avg = adverts.reduce((sum, a) => sum + parseFloat(a.cost), 0) / adverts.length;
        return `${avg.toFixed(2)} руб.`;
    }
}

module.exports = new StatisticsController();