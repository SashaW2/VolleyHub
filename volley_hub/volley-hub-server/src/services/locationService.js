const axios = require('axios');
require('dotenv').config();

class LocationService {
    constructor() {
        this.apiKey = process.env.YANDEX_MAPS_API_KEY;
        this.baseUrl = 'https://geocode-maps.yandex.ru/1.x/';
        this.geocodeCache = new Map();
        this.cacheTtlMs = 24 * 60 * 60 * 1000;
    }

    getCachedCoords(address) {
        const key = String(address || '').trim().toLowerCase();
        if (!key) return null;
        const entry = this.geocodeCache.get(key);
        if (!entry) return null;
        if (Date.now() - entry.ts > this.cacheTtlMs) {
            this.geocodeCache.delete(key);
            return null;
        }
        return entry.coords;
    }

    setCachedCoords(address, coords) {
        const key = String(address || '').trim().toLowerCase();
        if (!key || !coords) return;
        this.geocodeCache.set(key, { coords, ts: Date.now() });
    }

    async getAddressCoordinates(address) {
        try {
            const cached = this.getCachedCoords(address);
            if (cached) return cached;

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

            const coords = { lat: parseFloat(lat), lon: parseFloat(lon) };
            this.setCachedCoords(address, coords);
            return coords;
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
            const validation = await this.validateAddress(userAddress);
            if (!validation.isValid) {
                return { adverts: [], userCoords: null, userAddress: null };
            }

            const userCoords = await this.getAddressCoordinates(validation.normalizedAddress);
            if (!userCoords) return { adverts: [], userCoords: null, userAddress: null };

            const advertsWithDistance = [];

            for (const advert of adverts) {
                const advertCoords = await this.getAddressCoordinates(advert.address);
                if (advertCoords) {
                    const distance = this.calculateDistance(
                        userCoords.lat, userCoords.lon,
                        advertCoords.lat, advertCoords.lon
                    );
                    advertsWithDistance.push({ advert, coords: advertCoords, distance });
                }
            }

            advertsWithDistance.sort((a, b) => {
                if (a.distance !== b.distance) return a.distance - b.distance;
                return this.getAdvertStartTime(a.advert) - this.getAdvertStartTime(b.advert);
            });

            return {
                adverts: advertsWithDistance.slice(0, count),
                userCoords,
                userAddress: validation.normalizedAddress
            };
        } catch (error) {
            console.error('Error getting nearest adverts:', error.message);
            return { adverts: [], userCoords: null, userAddress: null };
        }
    }

    getAdvertStartTime(advert) {
        if (!advert || !advert.date) return Number.MAX_SAFE_INTEGER;

        let dateStr;
        if (advert.date instanceof Date) {
            dateStr = advert.date.toISOString().split('T')[0];
        } else {
            dateStr = String(advert.date).split('T')[0];
        }

        let timeStr = '00:00';
        const rawTime = advert.startTime;
        if (rawTime instanceof Date) {
            const hours = String(rawTime.getUTCHours()).padStart(2, '0');
            const minutes = String(rawTime.getUTCMinutes()).padStart(2, '0');
            timeStr = `${hours}:${minutes}`;
        } else if (rawTime) {
            const match = String(rawTime).match(/(\d{2}):(\d{2})/);
            if (match) timeStr = `${match[1]}:${match[2]}`;
        }

        const timestamp = new Date(`${dateStr}T${timeStr}:00`).getTime();
        return Number.isNaN(timestamp) ? Number.MAX_SAFE_INTEGER : timestamp;
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