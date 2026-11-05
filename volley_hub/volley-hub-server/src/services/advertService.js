const advertRepository = require('../repositories/advertRepository');
const notificationService = require('./notificationService');
const locationService = require('./locationService');

class AdvertService {
    async createAdvert(advertData) {
        const { address, date, startTime, endTime } = advertData;

        const isOverlapping = await advertRepository.checkOverlappingAdvert(address, date, startTime, endTime);
        if (isOverlapping) {
            const error = new Error('OVERLAPPING_ADVERT');
            error.code = 'OVERLAPPING_ADVERT';
            throw error;
        }

        const data = { ...advertData };
        return await advertRepository.create(data);
    }

    async getAdvertById(id) {
        const advert = await advertRepository.findById(id);
        if (advert) {
            const participantsCount = await advertRepository.getParticipantsCount(id);
            advert.dataValues.participantsCount = participantsCount;
            advert.participantsCount = participantsCount;

            const isSubscribed = await advertRepository.isSubscriber(id, advert.userId);
            advert.dataValues.isSubscribed = isSubscribed;
            advert.isSubscribed = isSubscribed;
        }
        return advert;
    }

    async getAllAdverts(filters = {}, currentUser = null, userAddress = null) {
        try {
            const cleanFilters = {};
            if (filters.address) cleanFilters.address = filters.address;
            if (filters.date) cleanFilters.date = filters.date;
            if (filters.startTime) cleanFilters.startTime = filters.startTime;
            if (filters.endTime) cleanFilters.endTime = filters.endTime;
            if (filters.gameLevel && Array.isArray(filters.gameLevel)) cleanFilters.gameLevel = filters.gameLevel;
            if (filters.minPrice) cleanFilters.minPrice = filters.minPrice;
            if (filters.maxPrice) cleanFilters.maxPrice = filters.maxPrice;

            let adverts = await advertRepository.findAll(cleanFilters);

            if (!adverts) return [];

            const now = new Date();
            const todayStr = now.toISOString().split('T')[0];

            adverts = adverts.filter(advert => {
                if (!advert || !advert.date || !advert.startTime) return false;

                let advertDateStr = advert.date;
                if (advertDateStr instanceof Date) {
                    advertDateStr = advertDateStr.toISOString().split('T')[0];
                } else {
                    advertDateStr = String(advertDateStr).split('T')[0];
                }

                if (advertDateStr < todayStr) return false;
                if (advertDateStr > todayStr) return true;

                let startTimeStr = advert.startTime;

                if (startTimeStr instanceof Date || (typeof startTimeStr === 'object' && startTimeStr.toISOString)) {
                    const isoString = startTimeStr.toISOString();
                    const timePart = isoString.split('T')[1];
                    if (timePart) {
                        startTimeStr = timePart.substring(0, 5);
                    }
                } else if (typeof startTimeStr === 'string') {
                    if (startTimeStr.includes('T')) {
                        const timePart = startTimeStr.split('T')[1];
                        if (timePart) {
                            startTimeStr = timePart.substring(0, 5);
                        }
                    } else if (startTimeStr.includes(':')) {
                        startTimeStr = startTimeStr.substring(0, 5);
                    }
                } else {
                    startTimeStr = String(startTimeStr);
                }

                let hours = 0, minutes = 0;
                if (startTimeStr && startTimeStr.includes(':')) {
                    const parts = startTimeStr.split(':');
                    hours = parseInt(parts[0], 10);
                    minutes = parseInt(parts[1], 10);
                }

                const eventMinutes = hours * 60 + minutes;
                const nowMinutes = now.getHours() * 60 + now.getMinutes();

                return eventMinutes > nowMinutes;
            });

            for (let i = 0; i < adverts.length; i++) {
                const participantsCount = await advertRepository.getParticipantsCount(adverts[i].id);
                adverts[i].dataValues.participantsCount = participantsCount;
                adverts[i].participantsCount = participantsCount;

                if (currentUser && currentUser.id) {
                    const isParticipating = await advertRepository.isParticipant(adverts[i].id, currentUser.id);
                    adverts[i].dataValues.isParticipating = isParticipating;
                    adverts[i].isParticipating = isParticipating;

                    const isSubscribed = await advertRepository.isSubscriber(adverts[i].id, currentUser.id);
                    adverts[i].dataValues.isSubscribed = isSubscribed;
                    adverts[i].isSubscribed = isSubscribed;
                } else {
                    adverts[i].dataValues.isParticipating = false;
                    adverts[i].isParticipating = false;
                    adverts[i].dataValues.isSubscribed = false;
                    adverts[i].isSubscribed = false;
                }
            }

            if (filters.useNearestLocations && userAddress) {
                adverts = await locationService.getNearestAdverts(adverts, userAddress);
            }

            return adverts || [];
        } catch (error) {
            console.error('Service getAllAdverts error:', error);
            throw error;
        }
    }

    async getMyAdverts(userId) {
        const adverts = await advertRepository.findByUserId(userId);
        for (let i = 0; i < adverts.length; i++) {
            const participantsCount = await advertRepository.getParticipantsCount(adverts[i].id);
            adverts[i].dataValues.participantsCount = participantsCount;
            adverts[i].participantsCount = participantsCount;

            const isParticipating = await advertRepository.isParticipant(adverts[i].id, userId);
            adverts[i].dataValues.isParticipating = isParticipating;
            adverts[i].isParticipating = isParticipating;

            const isSubscribed = await advertRepository.isSubscriber(adverts[i].id, userId);
            adverts[i].dataValues.isSubscribed = isSubscribed;
            adverts[i].isSubscribed = isSubscribed;
        }
        return adverts;
    }

    async getParticipatingAdverts(userId) {
        const allAdverts = await advertRepository.findAll();
        const result = [];
        for (let i = 0; i < allAdverts.length; i++) {
            const isPart = await advertRepository.isParticipant(allAdverts[i].id, userId);
            if (isPart) {
                const participantsCount = await advertRepository.getParticipantsCount(allAdverts[i].id);
                allAdverts[i].dataValues.participantsCount = participantsCount;
                allAdverts[i].participantsCount = participantsCount;
                allAdverts[i].dataValues.isParticipating = true;
                allAdverts[i].isParticipating = true;
                result.push(allAdverts[i]);
            }
        }
        return result;
    }

    async updateAdvert(id, advertData, currentUser) {
        const advert = await advertRepository.findById(id);
        if (!advert) {
            throw new Error('Объявление не найдено');
        }

        const isChangingDateTime = advertData.date !== undefined || advertData.startTime !== undefined;

        if (isChangingDateTime) {
            const newDate = advertData.date || advert.date;
            const newStartTime = advertData.startTime || advert.startTime;

            let startTimeStr = newStartTime;
            if (typeof startTimeStr !== 'string') {
                startTimeStr = String(startTimeStr);
            }

            const eventDateTime = new Date(newDate);
            const [hours, minutes] = startTimeStr.split(':');
            eventDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10));

            const now = new Date();
            const timeLeftMs = eventDateTime - now;
            const threeHoursMs = 3 * 60 * 60 * 1000;

            if (timeLeftMs < threeHoursMs && timeLeftMs > 0) {
                const hoursLeft = Math.floor(timeLeftMs / (60 * 60 * 1000));
                const minutesLeft = Math.floor((timeLeftMs % (60 * 60 * 1000)) / (60 * 1000));
                throw new Error(`Нельзя изменять дату и время объявления менее чем за 3 часа до начала. До начала осталось ${hoursLeft} ч ${minutesLeft} мин`);
            }
        }

        const isAdmin = currentUser.role === 'admin' || currentUser.isAdmin === true || currentUser.roleId === 2;

        if (!isAdmin && advert.userId !== currentUser.id) {
            throw new Error('Нет прав для редактирования');
        }

        const address = advertData.address !== undefined ? advertData.address : advert.address;
        const date = advertData.date !== undefined ? advertData.date : advert.date;
        const startTime = advertData.startTime !== undefined ? advertData.startTime : advert.startTime;
        const endTime = advertData.endTime !== undefined ? advertData.endTime : advert.endTime;

        const isOverlapping = await advertRepository.checkOverlappingAdvert(address, date, startTime, endTime, id);
        if (isOverlapping) {
            const error = new Error('OVERLAPPING_ADVERT');
            error.code = 'OVERLAPPING_ADVERT';
            throw error;
        }

        const currentParticipantsCount = await advertRepository.getParticipantsCount(id);

        if (advertData.peopleCount !== undefined && advertData.peopleCount < currentParticipantsCount) {
            throw new Error(`Новое максимальное количество участников (${advertData.peopleCount}) не может быть меньше текущего количества записанных (${currentParticipantsCount})`);
        }

        const changes = [];

        const getTimeFromDB = (timeValue) => {
            if (!timeValue) return null;
            const timeStr = String(timeValue);
            if (timeValue instanceof Date) {
                const hours = timeValue.getUTCHours().toString().padStart(2, '0');
                const minutes = timeValue.getUTCMinutes().toString().padStart(2, '0');
                return `${hours}:${minutes}`;
            }
            const match = timeStr.match(/(\d{2}):(\d{2})/);
            if (match) return `${match[1]}:${match[2]}`;
            return null;
        };

        const getTimeFromRequest = (timeValue) => {
            if (!timeValue) return null;
            const timeStr = String(timeValue);
            const match = timeStr.match(/(\d{2}):(\d{2})/);
            if (match) return `${match[1]}:${match[2]}`;
            return null;
        };

        const currentAddress = advert.address;
        const currentDate = advert.date;
        const currentStartTime = getTimeFromDB(advert.startTime);
        const currentEndTime = getTimeFromDB(advert.endTime);
        const currentCost = parseFloat(advert.cost);
        const currentPeopleCount = parseInt(advert.peopleCount);
        const currentGameLevel = advert.gameLevel;
        const currentDescription = advert.description;

        const newAddress = advertData.address;
        const newDate = advertData.date;
        const newStartTime = advertData.startTime ? getTimeFromRequest(advertData.startTime) : null;
        const newEndTime = advertData.endTime ? getTimeFromRequest(advertData.endTime) : null;
        const newCost = advertData.cost !== undefined ? parseFloat(advertData.cost) : undefined;
        const newPeopleCount = advertData.peopleCount !== undefined ? parseInt(advertData.peopleCount) : undefined;
        const newGameLevel = advertData.gameLevel;
        const newDescription = advertData.description;

        if (newAddress !== undefined && currentAddress !== newAddress) {
            changes.push(`Адрес: "${currentAddress}" -> "${newAddress}"`);
        }
        if (newDate !== undefined && currentDate !== newDate) {
            const oldDateFormatted = new Date(currentDate).toLocaleDateString('ru-RU');
            const newDateFormatted = new Date(newDate).toLocaleDateString('ru-RU');
            if (oldDateFormatted !== newDateFormatted) {
                changes.push(`Дата: ${oldDateFormatted} -> ${newDateFormatted}`);
            }
        }
        if (newStartTime !== null && currentStartTime !== null && currentStartTime !== newStartTime) {
            changes.push(`Время начала: ${currentStartTime} -> ${newStartTime}`);
        }
        if (newEndTime !== null && currentEndTime !== null && currentEndTime !== newEndTime) {
            changes.push(`Время окончания: ${currentEndTime} -> ${newEndTime}`);
        }
        if (newCost !== undefined && currentCost !== newCost) {
            changes.push(`Стоимость: ${currentCost} BYN -> ${newCost} BYN`);
        }
        if (newPeopleCount !== undefined && currentPeopleCount !== newPeopleCount) {
            changes.push(`Количество участников: ${currentPeopleCount} -> ${newPeopleCount}`);
        }
        if (newGameLevel !== undefined && currentGameLevel !== newGameLevel) {
            const levelMap = { 1: 'D1', 2: 'D2', 3: 'D3', 4: 'D4', 5: 'D4+' };
            const oldL = levelMap[currentGameLevel] || currentGameLevel;
            const newL = levelMap[newGameLevel] || newGameLevel;
            changes.push(`Уровень игры: ${oldL} -> ${newL}`);
        }
        if (newDescription !== undefined && currentDescription !== newDescription) {
            changes.push(`Описание: изменено`);
        }

        const updatedAdvert = await advertRepository.update(id, advertData);

        if (newPeopleCount !== undefined && newPeopleCount > currentPeopleCount) {
            const subscribers = await advertRepository.getSubscribers(id);

            if (subscribers && subscribers.length > 0) {
                const availableSpots = newPeopleCount - currentParticipantsCount;
                const message = `В объявлении "${advert.address}" освободилось ${availableSpots} мест! Успейте записаться!`;

                for (const subscriber of subscribers) {
                    const userId = subscriber.UserId || subscriber.userId;
                    if (userId) {
                        await notificationService.sendNotification(userId, message, 'system');
                    }
                }

                await advertRepository.clearSubscribers(id);
            }
        }

        if (changes.length > 0) {
            const participants = await advertRepository.getParticipants(id);
            const participantsList = participants.map(p => p.UserId || p.userId).filter(uid => uid);

            const subscribers = await advertRepository.getSubscribers(id);
            const subscribersList = subscribers.map(s => s.UserId || s.userId).filter(uid => uid);

            let allUsers = [...new Set([...participantsList, ...subscribersList, advert.userId])];
            allUsers = allUsers.filter(uid => uid !== currentUser.id);

            const changesList = changes.map((change, i) => `${i + 1}. ${change}`).join('\n');

            for (const userId of allUsers) {
                let message = '';

                if (isAdmin && userId === advert.userId) {
                    message = `[Администратор] Ваше объявление было отредактировано\n\n`;
                } else {
                    message = `Объявление было отредактировано\n\n`;
                }
                message += `Адрес: ${advert.address}\n\n`;
                message += `Изменения:\n${changesList}\n\n`;
                message += `Пожалуйста, проверьте актуальные данные в приложении.`;

                await notificationService.sendNotification(userId, message, 'system');
            }
        }

        return updatedAdvert;
    }

    async deleteAdvert(id, currentUser, isAdmin = false) {
        const advert = await advertRepository.findById(id);
        if (!advert) {
            throw new Error('Объявление не найдено');
        }

        const isAdminUser = currentUser.role === 'admin' || currentUser.isAdmin === true || currentUser.roleId === 2;

        if (!isAdminUser && advert.userId !== currentUser.id) {
            throw new Error('Нет прав для удаления');
        }

        const participants = await advertRepository.getParticipants(id);
        const participantsList = participants.map(p => p.UserId).filter(id => id);

        const subscribers = await advertRepository.getSubscribers(id);
        const subscribersList = subscribers.map(s => s.UserId || s.userId).filter(id => id);

        let allUsers = [...new Set([...participantsList, ...subscribersList, advert.userId])];

        if (!isAdminUser && currentUser.id === advert.userId) {
            allUsers = allUsers.filter(uid => uid !== currentUser.id);
        }

        for (const userId of allUsers) {
            let message = '';

            if (isAdminUser && advert.userId !== currentUser.id) {
                if (userId === advert.userId) {
                    message = `[Администратор] Ваше объявление по адресу "${advert.address}" было удалено`;
                } else {
                    message = `Объявление по адресу "${advert.address}" было удалено`;
                }
            } else {
                if (userId === advert.userId) {
                    continue;
                } else {
                    message = `Объявление по адресу "${advert.address}" было удалено его создателем`;
                }
            }

            await notificationService.sendNotification(userId, message, 'system');
        }

        return await advertRepository.delete(id);
    }

    async subscribeToAdvert(advertId, userId) {
        const advert = await advertRepository.findById(advertId);
        if (!advert) {
            throw new Error('Объявление не найдено');
        }

        const participantsCount = await advertRepository.getParticipantsCount(advertId);
        if (participantsCount >= advert.peopleCount) {
            throw new Error('Нет свободных мест');
        }

        const alreadyParticipant = await advertRepository.isParticipant(advertId, userId);
        if (alreadyParticipant) {
            throw new Error('Вы уже записаны на это событие');
        }

        let startTimeStr = advert.startTime;
        if (typeof startTimeStr !== 'string') {
            startTimeStr = String(startTimeStr);
        }

        const eventDateTime = new Date(advert.date);
        const [hours, minutes] = startTimeStr.split(':');
        eventDateTime.setHours(parseInt(hours), parseInt(minutes));

        if (eventDateTime < new Date()) {
            throw new Error('Нельзя записаться на прошедшее событие');
        }

        await advertRepository.addParticipant(advertId, userId);
        await advertRepository.removeSubscriber(advertId, userId);

        return { success: true };
    }

    async unsubscribeFromAdvert(advertId, userId) {
        const advert = await advertRepository.findById(advertId);
        if (!advert) {
            throw new Error('Объявление не найдено');
        }

        const isParticipant = await advertRepository.isParticipant(advertId, userId);
        if (!isParticipant) {
            throw new Error('Вы не записаны на это событие');
        }

        let startTimeStr = advert.startTime;
        if (typeof startTimeStr !== 'string') {
            startTimeStr = String(startTimeStr);
        }

        const eventDateTime = new Date(advert.date);
        const [hours, minutes] = startTimeStr.split(':');
        eventDateTime.setHours(parseInt(hours), parseInt(minutes));

        const timeLeft = eventDateTime - new Date();
        if (timeLeft < 60 * 60 * 1000) {
            throw new Error('Отписка невозможна менее чем за час до начала');
        }

        await advertRepository.removeParticipant(advertId, userId);

        const participantsCount = await advertRepository.getParticipantsCount(advertId);
        if (participantsCount < advert.peopleCount) {
            await this.checkAndNotifySubscribers(advertId);
        }

        return { success: true };
    }

    async subscribeToWaitingList(advertId, userId) {
        const advert = await advertRepository.findById(advertId);
        if (!advert) {
            throw new Error('Объявление не найдено');
        }

        const participantsCount = await advertRepository.getParticipantsCount(advertId);
        if (participantsCount < advert.peopleCount) {
            throw new Error('Есть свободные места, вы можете записаться напрямую');
        }

        const alreadySubscribed = await advertRepository.isSubscriber(advertId, userId);
        if (alreadySubscribed) {
            throw new Error('Вы уже подписаны на уведомления об этом объявлении');
        }

        const alreadyParticipant = await advertRepository.isParticipant(advertId, userId);
        if (alreadyParticipant) {
            throw new Error('Вы уже участвуете в этом объявлении');
        }

        await advertRepository.addSubscriber(advertId, userId);
        return { success: true };
    }

    async unsubscribeFromWaitingList(advertId, userId) {
        const isSubscribed = await advertRepository.isSubscriber(advertId, userId);
        if (!isSubscribed) {
            throw new Error('Вы не подписаны на уведомления об этом объявлении');
        }

        await advertRepository.removeSubscriber(advertId, userId);
        return { success: true };
    }

    async isSubscribedToWaiting(advertId, userId) {
        return await advertRepository.isSubscriber(advertId, userId);
    }

    async checkAndNotifySubscribers(advertId) {
        const advert = await advertRepository.findById(advertId);
        if (!advert) return;

        const participantsCount = await advertRepository.getParticipantsCount(advertId);
        if (participantsCount < advert.peopleCount) {
            const subscribers = await advertRepository.getSubscribers(advertId);
            const message = `Освободилось место в объявлении "${advert.address}"! Успейте записаться!`;

            for (const subscriber of subscribers) {
                const userId = subscriber.UserId || subscriber.userId;
                if (userId) {
                    await notificationService.sendNotification(userId, message, 'system');
                }
            }

            await advertRepository.clearSubscribers(advertId);
        }
    }

    async getParticipantsCount(advertId) {
        return await advertRepository.getParticipantsCount(advertId);
    }

    async isParticipating(advertId, userId) {
        return await advertRepository.isParticipant(advertId, userId);
    }
}

module.exports = new AdvertService();