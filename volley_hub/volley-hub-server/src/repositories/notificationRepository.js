const sequelize = require('../config/database');

class NotificationRepository {
    async create(notificationData) {
        try {
            const query = `
                INSERT INTO Notifications (UserId, Text, CreatedDate, IsRead, NotificationType)
                VALUES (${notificationData.userId}, N'${notificationData.text.replace(/'/g, "''")}', GETDATE(), 0, '${notificationData.notificationType || 'system'}');
                SELECT SCOPE_IDENTITY() as Id;
            `;
            const [results] = await sequelize.query(query);
            const newId = results[0]?.Id;

            if (newId) {
                const [notification] = await sequelize.query(`SELECT * FROM Notifications WHERE Id = ${newId}`);
                return notification[0];
            }
            return null;
        } catch (error) {
            console.error('Error in notificationRepository.create:', error);
            throw error;
        }
    }

    async createMany(notifications) {
        try {
            const results = [];
            for (const notification of notifications) {
                const result = await this.create(notification);
                results.push(result);
            }
            return results;
        } catch (error) {
            console.error('Error in notificationRepository.createMany:', error);
            throw error;
        }
    }

    async executeRawQuery(query) {
        try {
            const [results] = await sequelize.query(query);
            return results;
        } catch (error) {
            console.error('Error in executeRawQuery:', error);
            throw error;
        }
    }

    async findByUserId(userId) {
        try {
            const query = `
                SELECT * FROM Notifications
                WHERE UserId = ${userId}
                ORDER BY CreatedDate DESC
            `;
            const [results] = await sequelize.query(query);
            return results;
        } catch (error) {
            console.error('Error in findByUserId:', error);
            throw error;
        }
    }

    async findById(id) {
        try {
            const query = `SELECT * FROM Notifications WHERE Id = ${id}`;
            const [results] = await sequelize.query(query);
            return results[0];
        } catch (error) {
            console.error('Error in findById:', error);
            throw error;
        }
    }

    async markAsRead(id) {
        try {
            const query = `UPDATE Notifications SET IsRead = 1 WHERE Id = ${id}`;
            await sequelize.query(query);
            return true;
        } catch (error) {
            console.error('Error in markAsRead:', error);
            throw error;
        }
    }

    async markAllAsRead(userId) {
        try {
            const query = `UPDATE Notifications SET IsRead = 1 WHERE UserId = ${userId} AND IsRead = 0`;
            await sequelize.query(query);
            return true;
        } catch (error) {
            console.error('Error in markAllAsRead:', error);
            throw error;
        }
    }

    async delete(id) {
        try {
            const query = `DELETE FROM Notifications WHERE Id = ${id}`;
            await sequelize.query(query);
            return true;
        } catch (error) {
            console.error('Error in delete:', error);
            throw error;
        }
    }
}

module.exports = new NotificationRepository();