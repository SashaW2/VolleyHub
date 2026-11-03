import api from './api';

class NotificationService {
    async getMyNotifications() {
        try {
            const response = await api.get('/notifications');
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Ошибка загрузки уведомлений' };
        }
    }

    async markAsRead(id) {
        try {
            const response = await api.put(`/notifications/${id}/read`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Ошибка' };
        }
    }

    async markAllAsRead() {
        try {
            const response = await api.put('/notifications/read-all');
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Ошибка' };
        }
    }

    async deleteNotification(id) {
        try {
            const response = await api.delete(`/notifications/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Ошибка удаления' };
        }
    }

    async sendToUser(userId, text) {
        try {
            const response = await api.post('/admin/notifications/send', { userId, text });
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Ошибка отправки' };
        }
    }
}

export default new NotificationService();