import api from './api';

class LocationService {
    async getAddressCoordinates(address) {
        try {
            const response = await api.post('/location/geocode', { address });
            return response.data.coords;
        } catch (error) {
            console.error('Geocoding error:', error);
            return null;
        }
    }

    async validateAddress(address) {
        try {
            const response = await api.post('/location/validate', { address });
            return response.data.normalizedAddress;
        } catch (error) {
            throw error.response?.data || { message: 'Не удалось проверить адрес' };
        }
    }

    async getAddressByCoords(lat, lon) {
        try {
            const response = await api.post('/location/reverse', { lat, lon });
            return response.data.address;
        } catch (error) {
            console.error('Reverse geocoding error:', error);
            return null;
        }
    }
}

export default new LocationService();