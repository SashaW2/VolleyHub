const axios = require('axios');
require('dotenv').config();

class LocationService {
    constructor() {
        this.apiKey = process.env.YANDEX_MAPS_API_KEY;
        this.baseUrl = 'https://geocode-maps.yandex.ru/1.x/';
    }

    async getAddressCoordinates(address) {
        try {
            const response = await axios.get(this.baseUrl, {
                params: {
                    format: 'json',
                    apikey: this.apiKey,
                    geocode: address,
                    region: 'by'
                }
            });

            const feature = response.data.response.GeoObjectCollection.featureMember[0];
            if (!feature) return null;

            const posString = feature.GeoObject.Point.pos;
            const [lon, lat] = posString.split(' ');

            return { lat: parseFloat(lat), lon: parseFloat(lon) };
        } catch (error) {
            console.error('Geocoding error:', error.message);
            return null;
        }
    }

    async validateAddress(address) {
        try {
            if (!address || address.trim() === '') {
                return {
                    isValid: false,
                    errorMessage: 'Введите адрес. Пример: ул. Ленина 10, Минск'
                };
            }

            let inputAddress = address;
            if (!inputAddress.includes('Минск')) {
                inputAddress = inputAddress + ', Минск';
            }

            const response = await axios.get(this.baseUrl, {
                params: {
                    format: 'json',
                    apikey: this.apiKey,
                    geocode: inputAddress,
                    region: 'by'
                }
            });

            const features = response.data.response.GeoObjectCollection.featureMember;

            for (const feature of features) {
                const components = feature.GeoObject.metaDataProperty.GeocoderMetaData.Address.Components;
                const street = components.find(c => c.kind === 'street');
                const house = components.find(c => c.kind === 'house');
                const city = components.find(c => c.kind === 'locality');

                if (street && house && city?.name === 'Минск') {
                    const normalizedAddress = `${street.name} ${house.name}, Минск`;
                    return { isValid: true, normalizedAddress };
                }
            }

            return {
                isValid: false,
                errorMessage: 'Некорректный формат адреса. Пример: ул. Ленина 10, Минск'
            };
        } catch (error) {
            console.error('Address validation error:', error);
            return {
                isValid: false,
                errorMessage: 'Адрес не найден. Проверьте правильность ввода. Пример: ул. Ленина 10, Минск'
            };
        }
    }

    async getNearestAdverts(adverts, userAddress, count = 5) {
        try {
            // Сначала валидируем адрес пользователя
            const validation = await this.validateAddress(userAddress);
            if (!validation.isValid) {
                console.log('Invalid user address:', validation.errorMessage);
                return [];
            }

            // Получаем координаты адреса пользователя
            const userCoords = await this.getAddressCoordinates(validation.normalizedAddress);
            if (!userCoords) return [];

            const advertsWithDistance = [];

            for (const advert of adverts) {
                // Получаем координаты каждого объявления
                const advertCoords = await this.getAddressCoordinates(advert.address);
                if (advertCoords) {
                    const distance = this.calculateDistance(
                        userCoords.lat, userCoords.lon,
                        advertCoords.lat, advertCoords.lon
                    );
                    advertsWithDistance.push({ advert, distance });
                }
            }

            // Сортируем по расстоянию (от ближайшего к дальнему)
            advertsWithDistance.sort((a, b) => a.distance - b.distance);

            // Возвращаем первые count объявлений
            return advertsWithDistance.slice(0, count).map(item => item.advert);
        } catch (error) {
            console.error('Error getting nearest adverts:', error.message);
            return [];
        }
    }

    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = this.toRadians(lat2 - lat1);
        const dLon = this.toRadians(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }
}

module.exports = new LocationService();