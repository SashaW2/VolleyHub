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
}

export default new LocationService();