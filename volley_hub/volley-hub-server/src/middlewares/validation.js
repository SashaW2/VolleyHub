const locationService = require('../services/locationService');

const validateAdvert = async (req, res, next) => {
    const { address, date, startTime, endTime, cost, peopleCount, gameLevel } = req.body;

    const errors = [];

    if (!address) errors.push('Адрес обязателен');
    if (!date) errors.push('Дата обязательна');
    if (!startTime) errors.push('Время начала обязательно');
    if (!endTime) errors.push('Время окончания обязательно');

    if (gameLevel === undefined || gameLevel === null) {
        errors.push('Уровень игры обязателен');
    }

    if (date) {
        const [year, month, day] = date.split('-').map(Number);
        const eventDate = new Date(year, month - 1, day);
        eventDate.setHours(0, 0, 0, 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (eventDate < today) {
            errors.push('Дата не может быть в прошлом');
        }
    }

    if (startTime && endTime) {
        const start = startTime.split(':');
        const end = endTime.split(':');
        const startMinutes = parseInt(start[0]) * 60 + parseInt(start[1]);
        const endMinutes = parseInt(end[0]) * 60 + parseInt(end[1]);
        let duration = endMinutes - startMinutes;
        if (duration < 0) duration += 24 * 60;

        if (duration < 60 || duration > 180) {
            errors.push('Продолжительность должна быть 1-3 часа');
        }
    }

    if (cost) {
        const costNum = parseFloat(cost);
        if (isNaN(costNum) || costNum <= 0 || costNum >= 100) {
            errors.push('Стоимость должна быть больше 0 и меньше 100');
        }
    }

    if (peopleCount) {
        const count = parseInt(peopleCount);
        if (isNaN(count) || count < 2 || count > 50) {
            errors.push('Количество участников должно быть от 2 до 50');
        }
    }

    if (address) {
        const validation = await locationService.validateAddress(address);
        if (!validation.isValid) {
            errors.push(validation.errorMessage);
        } else {
            req.body.address = validation.normalizedAddress;
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({ success: false, errors });
    }

    next();
};

const validateUser = (req, res, next) => {
    const { name, email, phone, password, gameLevel } = req.body;
    const errors = [];

    if (name && (name.length < 1 || name.length > 100)) {
        errors.push('Имя должно содержать от 1 до 100 символов');
    }

    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        errors.push('Некорректный формат email');
    }

    if (phone && !/^\+375 \d{2} \d{3}-\d{2}-\d{2}$/.test(phone)) {
        errors.push('Телефон должен быть в формате: +375 29 123-45-67');
    }

    if (password && password.length < 8) {
        errors.push('Пароль должен содержать минимум 8 символов');
    }

    if (gameLevel !== undefined && gameLevel !== null) {
        const validLevels = [1, 2, 3, 4, 5, 'D1', 'D2', 'D3', 'D4', 'D4Plus'];
        if (!validLevels.includes(gameLevel)) {
            errors.push('Некорректный уровень игры');
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({ success: false, errors });
    }

    next();
};

module.exports = { validateAdvert, validateUser };