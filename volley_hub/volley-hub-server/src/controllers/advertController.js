const advertService = require('../services/advertService');
const locationService = require('../services/locationService');

class AdvertController {
    async create(req, res) {
        try {
            const { address, date, startTime, endTime, gameLevel, cost, peopleCount, description } = req.body;

            const addressValidation = await locationService.validateAddress(address);
            if (!addressValidation.isValid) {
                return res.status(400).json({
                    success: false,
                    message: addressValidation.errorMessage
                });
            }

            const levelMap = {
                'D1': 1, 'D2': 2, 'D3': 3, 'D4': 4, 'D4Plus': 5
            };

            const advertData = {
                address: addressValidation.normalizedAddress,
                date,
                startTime: startTime + ':00',
                endTime: endTime + ':00',
                gameLevel: typeof gameLevel === 'string' ? levelMap[gameLevel] || 2 : gameLevel,
                cost: parseFloat(cost),
                peopleCount: parseInt(peopleCount),
                description: description || null,
                userId: req.user.id
            };

            const advert = await advertService.createAdvert(advertData);
            res.status(201).json({ success: true, advert });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async update(req, res) {
        try {
            const { address, date, startTime, endTime, gameLevel, cost, peopleCount, description } = req.body;

            const addressValidation = await locationService.validateAddress(address);
            if (!addressValidation.isValid) {
                return res.status(400).json({
                    success: false,
                    message: addressValidation.errorMessage
                });
            }

            const levelMap = {
                'D1': 1, 'D2': 2, 'D3': 3, 'D4': 4, 'D4Plus': 5
            };

            const advertData = {
                address: addressValidation.normalizedAddress,
                date,
                startTime: startTime + ':00',
                endTime: endTime + ':00',
                gameLevel: typeof gameLevel === 'string' ? levelMap[gameLevel] || 2 : gameLevel,
                cost: parseFloat(cost),
                peopleCount: parseInt(peopleCount),
                description: description || null
            };

            const advert = await advertService.updateAdvert(req.params.id, advertData, req.user);
            res.json({ success: true, advert });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async getAll(req, res) {
        try {
            const filters = { ...req.query };

            if (filters.gameLevel) {
                if (!Array.isArray(filters.gameLevel)) {
                    filters.gameLevel = [filters.gameLevel];
                }
                filters.gameLevel = filters.gameLevel.map(l => parseInt(l));
            }

            if (filters.gameLevel && filters.gameLevel.length === 0) {
                delete filters.gameLevel;
            }

            const adverts = await advertService.getAllAdverts(filters, req.user, req.query.userAddress);
            res.json({ success: true, adverts });
        } catch (error) {
            console.error('Error in getAll:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getMy(req, res) {
        try {
            const adverts = await advertService.getMyAdverts(req.user.id);
            res.json({ success: true, adverts });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getParticipating(req, res) {
        try {
            const adverts = await advertService.getParticipatingAdverts(req.user.id);
            res.json({ success: true, adverts });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getById(req, res) {
        try {
            const advert = await advertService.getAdvertById(req.params.id);
            if (!advert) {
                return res.status(404).json({ success: false, message: 'Объявление не найдено' });
            }

            const participantsCount = await advertService.getParticipantsCount(req.params.id);
            advert.dataValues.participantsCount = participantsCount;
            advert.participantsCount = participantsCount;

            if (req.user) {
                const isParticipating = await advertService.isParticipating(req.params.id, req.user.id);
                advert.dataValues.isParticipating = isParticipating;
                advert.isParticipating = isParticipating;

                const isSubscribed = await advertService.isSubscribedToWaiting(req.params.id, req.user.id);
                advert.dataValues.isSubscribed = isSubscribed;
                advert.isSubscribed = isSubscribed;
            }

            res.json({ success: true, advert });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async delete(req, res) {
        try {
            await advertService.deleteAdvert(req.params.id, req.user, req.user.isAdmin);
            res.json({ success: true, message: 'Объявление удалено' });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async subscribe(req, res) {
        try {
            await advertService.subscribeToAdvert(req.params.id, req.user.id);
            res.json({ success: true, message: 'Вы успешно записаны' });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async unsubscribe(req, res) {
        try {
            await advertService.unsubscribeFromAdvert(req.params.id, req.user.id);
            res.json({ success: true, message: 'Вы отписались' });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async subscribeToWaiting(req, res) {
        try {
            await advertService.subscribeToWaitingList(req.params.id, req.user.id);
            res.json({ success: true, message: 'Вы подписаны на уведомления о свободных местах' });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async unsubscribeFromWaiting(req, res) {
        try {
            await advertService.unsubscribeFromWaitingList(req.params.id, req.user.id);
            res.json({ success: true, message: 'Вы отписаны от уведомлений' });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
}

module.exports = new AdvertController();