import api from './api';

class AuthService {
    async login(email, password) {
        try {
            const response = await api.post('/auth/login', { email, password });

            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
            }
            return response.data;
        } catch (error) {
            console.error('Login API error:', error);
            console.error('Error response:', error.response);

            if (error.response && error.response.data) {
                throw error.response.data;
            }
            throw { message: 'Ошибка подключения к серверу' };
        }
    }

    async register(userData) {
        try {
            const data = { ...userData };
            const response = await api.post('/auth/register', data);
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
            }
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Ошибка регистрации' };
        }
    }

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
    }

    getCurrentUser() {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                return JSON.parse(userStr);
            } catch (e) {
                return null;
            }
        }
        return null;
    }

    getToken() {
        return localStorage.getItem('token');
    }

    isAuthenticated() {
        return !!this.getToken();
    }

    async updateProfile(userData) {
        try {
            const response = await api.put('/users/profile', userData);
            if (response.data.user) {
                localStorage.setItem('user', JSON.stringify(response.data.user));
            }
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
            this.logout();
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Ошибка удаления аккаунта' };
        }
    }
}

export default new AuthService();