const notificationService = require('../services/notificationService');
const sseHub = require('../utils/sseHub');

class NotificationController {
    async getMyNotifications(req, res) {
        try {
            const notifications = await notificationService.getUserNotifications(req.user.id);
            res.json({ success: true, notifications });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getUnreadCount(req, res) {
        try {
            const count = await notificationService.getUnreadCount(req.user.id);
            res.json({ success: true, count });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    stream(req, res) {
        res.set({
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',
            'X-Accel-Buffering': 'no'
        });
        res.flushHeaders();
        res.write('retry: 5000\n\n');

        sseHub.add(req.user.id, res);

        const heartbeat = setInterval(() => {
            try {
                res.write(': ping\n\n');
            } catch (e) {
            }
        }, 25000);

        req.on('close', () => {
            clearInterval(heartbeat);
            sseHub.remove(req.user.id, res);
        });
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