import api from './api';

class AdminService {
    async getStatistics() {
        try {
            const response = await api.get('/admin/statistics');
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Ошибка загрузки статистики' };
        }
    }
}

export default new AdminService();