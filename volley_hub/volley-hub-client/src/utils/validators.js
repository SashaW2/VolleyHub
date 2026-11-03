export const validateAdvert = (data) => {
    const errors = {};

    if (!data.address?.trim()) {
        errors.address = 'Введите адрес';
    }

    if (!data.date) {
        errors.date = 'Выберите дату';
    } else {
        const selectedDate = new Date(data.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selectedDate < today) {
            errors.date = 'Дата не может быть в прошлом';
        }
    }

    if (!data.startTime) {
        errors.startTime = 'Введите время начала';
    }

    if (!data.endTime) {
        errors.endTime = 'Введите время окончания';
    }

    if (data.startTime && data.endTime) {
        const start = data.startTime.split(':');
        const end = data.endTime.split(':');
        const startMinutes = parseInt(start[0]) * 60 + parseInt(start[1]);
        const endMinutes = parseInt(end[0]) * 60 + parseInt(end[1]);
        let duration = endMinutes - startMinutes;
        if (duration < 0) duration += 24 * 60;

        if (duration < 60) {
            errors.duration = 'Минимальная продолжительность - 1 час';
        } else if (duration > 180) {
            errors.duration = 'Максимальная продолжительность - 3 часа';
        }
    }

    if (!data.cost) {
        errors.cost = 'Введите стоимость';
    } else {
        const cost = parseFloat(data.cost);
        if (isNaN(cost) || cost <= 0) {
            errors.cost = 'Стоимость должна быть больше 0';
        } else if (cost >= 100) {
            errors.cost = 'Стоимость должна быть меньше 100 BYN';
        }
    }

    if (!data.peopleCount) {
        errors.peopleCount = 'Введите количество участников';
    } else {
        const count = parseInt(data.peopleCount);
        if (isNaN(count) || count < 2) {
            errors.peopleCount = 'Минимум 2 участника';
        } else if (count > 50) {
            errors.peopleCount = 'Максимум 50 участников';
        }
    }

    if (!data.gameLevel) {
        errors.gameLevel = 'Выберите уровень игры';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

export const validateUser = (data) => {
    const errors = {};

    if (!data.name?.trim()) {
        errors.name = 'Введите имя';
    } else if (data.name.length > 100) {
        errors.name = 'Имя не должно превышать 100 символов';
    }

    if (!data.email?.trim()) {
        errors.email = 'Введите email';
    } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            errors.email = 'Некорректный формат email';
        }
    }

    if (data.phone && !/^\+375 \d{2} \d{3}-\d{2}-\d{2}$/.test(data.phone)) {
        errors.phone = 'Формат: +375 29 123-45-67';
    }

    if (data.password) {
        if (data.password.length < 8) {
            errors.password = 'Пароль должен содержать минимум 8 символов';
        }
        if (data.password !== data.confirmPassword) {
            errors.confirmPassword = 'Пароли не совпадают';
        }
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};