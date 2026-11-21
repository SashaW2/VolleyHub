import api from './api';

class TelegramService {
    async getStatus() {
        try {
            const response = await api.get('/telegram/status');
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Ошибка загрузки статуса Telegram' };
        }
    }

    async createLink() {
        try {
            const response = await api.post('/telegram/link');
            return response.data.url;
        } catch (error) {
            throw error.response?.data || { message: 'Ошибка привязки Telegram' };
        }
    }

    async setNotifications(enabled) {
        try {
            const response = await api.patch('/telegram/notifications', { enabled });
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Ошибка настройки уведомлений Telegram' };
        }
    }

    async unlink() {
        try {
            const response = await api.delete('/telegram/link');
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Ошибка отвязки Telegram' };
        }
    }
}

export default new TelegramService();
