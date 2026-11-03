import api from './api';

class AdvertService {
    async getAllAdverts(filters = {}) {
        try {
            const params = new URLSearchParams();
            if (filters.street) params.append('address', filters.street);
            if (filters.date) params.append('date', filters.date);
            if (filters.startTime) params.append('startTime', filters.startTime);
            if (filters.endTime) params.append('endTime', filters.endTime);

            if (filters.levels && filters.levels.length) {
                filters.levels.forEach(level => params.append('gameLevel', level));
            }

            if (filters.minPrice) params.append('minPrice', filters.minPrice);
            if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
            if (filters.useNearestLocations && filters.userAddress) {
                params.append('useNearestLocations', true);
                params.append('userAddress', filters.userAddress);
            }

            const response = await api.get(`/adverts?${params.toString()}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Ошибка загрузки объявлений' };
        }
    }

    async getMyAdverts() {
        try {
            const response = await api.get('/adverts/my');
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Ошибка загрузки объявлений' };
        }
    }

    async getParticipatingAdverts() {
        try {
            const response = await api.get('/adverts/participating');
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Ошибка загрузки объявлений' };
        }
    }

    async getAdvertById(id) {
        try {
            const response = await api.get(`/adverts/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Ошибка загрузки объявления' };
        }
    }

    async createAdvert(advertData) {
        try {
            const response = await api.post('/adverts', advertData);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Ошибка создания объявления' };
        }
    }

    async updateAdvert(id, advertData) {
        try {
            const response = await api.put(`/adverts/${id}`, advertData);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Ошибка обновления объявления' };
        }
    }

    async deleteAdvert(id) {
        try {
            const response = await api.delete(`/adverts/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Ошибка удаления объявления' };
        }
    }

    async subscribeToAdvert(id) {
        try {
            const response = await api.post(`/adverts/${id}/subscribe`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Ошибка записи' };
        }
    }

    async unsubscribeFromAdvert(id) {
        try {
            const response = await api.post(`/adverts/${id}/unsubscribe`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Ошибка отписки' };
        }
    }

    async subscribeToWaitingList(id) {
        try {
            const response = await api.post(`/adverts/${id}/subscribe-waiting`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Ошибка подписки на уведомления' };
        }
    }

    async unsubscribeFromWaitingList(id) {
        try {
            const response = await api.post(`/adverts/${id}/unsubscribe-waiting`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Ошибка отписки от уведомлений' };
        }
    }
}

export default new AdvertService();