import api from './api';

class UserService {
    async getAllUsers() {
        try {
            const response = await api.get('/admin/users');
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Ошибка загрузки пользователей' };
        }
    }

    async getUserById(id) {
        try {
            const response = await api.get(`/users/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Ошибка загрузки пользователя' };
        }
    }

    async blockUser(id) {
        try {
            const response = await api.post(`/admin/users/${id}/block`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Ошибка блокировки' };
        }
    }

    async unblockUser(id) {
        try {
            const response = await api.post(`/admin/users/${id}/unblock`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Ошибка разблокировки' };
        }
    }

    async updateProfile(userData) {
        try {
            const response = await api.put('/users/profile', userData);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Ошибка обновления профиля' };
        }
    }

    async changePassword(passwordData) {
        try {
            const response = await api.put('/users/change-password', passwordData);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Ошибка смены пароля' };
        }
    }

    async deleteAccount() {
        try {
            const response = await api.delete('/users/account');
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Ошибка удаления аккаунта' };
        }
    }
}

export default new UserService();