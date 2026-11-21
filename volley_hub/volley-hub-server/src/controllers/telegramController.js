const telegramService = require('../services/telegramService');

class TelegramController {
    async getStatus(req, res) {
        try {
            const link = await telegramService.getLink(req.user.id);
            res.json({
                success: true,
                linked: Boolean(link),
                username: link?.username || '',
                paused: Boolean(link) && link.notificationsEnabled === false
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async createLink(req, res) {
        try {
            const url = await telegramService.createLinkUrl(req.user.id);
            res.json({ success: true, url });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async updateNotifications(req, res) {
        const { enabled } = req.body || {};
        if (typeof enabled !== 'boolean') {
            return res.status(400).json({ success: false, message: 'Поле enabled должно быть true или false' });
        }

        try {
            const link = await telegramService.setNotificationsEnabled(req.user.id, enabled);
            if (!link) {
                return res.status(404).json({ success: false, message: 'Telegram не привязан к аккаунту' });
            }
            res.json({ success: true, linked: true, enabled: Boolean(link.notificationsEnabled) });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async unlink(req, res) {
        try {
            await telegramService.unlinkUser(req.user.id);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new TelegramController();
