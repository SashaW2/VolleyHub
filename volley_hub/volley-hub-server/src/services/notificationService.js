const notificationRepository = require('../repositories/notificationRepository');
const sseHub = require('../utils/sseHub');

class NotificationService {
    async sendNotification(userId, text, type = 'system') {
        const notification = await notificationRepository.create({
            userId,
            text,
            createdDate: new Date(),
            notificationType: type
        });

        sseHub.send(userId, 'notification', {
            id: notification?.Id || notification?.id || null,
            text,
            notificationType: type,
            createdDate: notification?.CreatedDate || new Date().toISOString()
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
        const created = await notificationRepository.createMany(notifications);

        for (const userId of userIds) {
            sseHub.send(userId, 'notification', {
                text,
                notificationType: type,
                createdDate: new Date().toISOString()
            });
        }

        return created;
    }

    async getUnreadCount(userId) {
        return await notificationRepository.countUnread(userId);
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