const notificationRepository = require('../repositories/notificationRepository');

class NotificationService {
    async sendNotification(userId, text, type = 'system') {
        const notification = await notificationRepository.create({
            userId,
            text,
            createdDate: new Date(),
            notificationType: type
        });
        return notification;
    }

    async sendBulkNotification(userIds, text, type = 'system') {
        const notifications = userIds.map(userId => ({
            userId,
            text,
            createdDate: new Date(),
            notificationType: type
        }));
        return await notificationRepository.createMany(notifications);
    }

    async getUserNotifications(userId) {
        return await notificationRepository.findByUserId(userId);
    }

    async markAsRead(notificationId, userId) {
        const notification = await notificationRepository.findById(notificationId);
        if (!notification) {
            throw new Error('Уведомление не найдено');
        }
        if (notification.UserId !== userId) {
            throw new Error('Нет прав');
        }
        return await notificationRepository.markAsRead(notificationId);
    }

    async markAllAsRead(userId) {
        return await notificationRepository.markAllAsRead(userId);
    }

    async getUnreadCount(userId) {
        return await notificationRepository.countUnread(userId);
    }

    async deleteNotification(notificationId, userId) {
        const notification = await notificationRepository.findById(notificationId);
        if (!notification) {
            throw new Error('Уведомление не найдено');
        }
        if (notification.UserId !== userId) {
            throw new Error('Нет прав');
        }
        return await notificationRepository.delete(notificationId);
    }
}

module.exports = new NotificationService();