const notificationService = require('../services/notificationService');

class NotificationController {
    async getMyNotifications(req, res) {
        try {
            const notifications = await notificationService.getUserNotifications(req.user.id);
            res.json({ success: true, notifications });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async markAsRead(req, res) {
        try {
            await notificationService.markAsRead(req.params.id, req.user.id);
            res.json({ success: true, message: 'Уведомление отмечено как прочитанное' });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async markAllAsRead(req, res) {
        try {
            await notificationService.markAllAsRead(req.user.id);
            res.json({ success: true, message: 'Все уведомления отмечены как прочитанные' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async deleteNotification(req, res) {
        try {
            await notificationService.deleteNotification(req.params.id, req.user.id);
            res.json({ success: true, message: 'Уведомление удалено' });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
}

module.exports = new NotificationController();