import React, { createContext, useState, useEffect, useContext } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within LanguageProvider');
    }
    return context;
};

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState(() => {
        return localStorage.getItem('language') || 'ru';
    });

    const translations = {
        ru: {
            // Header
            home: 'Главная',
            about: 'О нас',
            notifications: 'Уведомления',
            profile: 'Профиль',
            users: 'Пользователи',
            statistics: 'Статистика',
            login: 'Войти',
            register: 'Регистрация',
            logout: 'Выйти',

            // HomePage
            findTeam: 'Найди свою команду для волейбола',
            joinGames: 'Присоединяйся к играм, создавай объявления и находи единомышленников',
            createAdvert: 'Создать объявление',
            allAdverts: 'Все объявления',
            myAdverts: 'Мои объявления',
            participating: 'Участвую',
            filters: 'Фильтры',
            noAdverts: 'Нет доступных объявлений',
            createFirst: 'Создать первое объявление',
            loading: 'Загрузка...',
            tryAgain: 'Попробовать снова',
            loadingError: 'Ошибка загрузки объявлений',
            confirmDelete: 'Вы уверены, что хотите удалить это объявление?',

            // AdvertCard
            gameLevel: 'Уровень',
            yourAdvert: 'Ваше объявление',
            youParticipate: 'Вы участвуете',
            youSubscribed: 'Вы подписаны',
            location: 'Место проведения',
            time: 'Время',
            participants: 'Участники',
            edit: 'Редактировать',
            delete: 'Удалить',
            subscribe: 'Записаться',
            unsubscribe: 'Отменить запись',
            subscribeToWaiting: 'Подписаться',
            unsubscribeFromWaiting: 'Отписаться',
            noSeats: 'Мест нет',
            viewCreator: 'Создатель',
            editNotAllowed: 'Редактирование возможно только за 2 и более часов до начала игры',
            deleteNotAllowed: 'Удаление невозможно в период за 2 часа до начала игры. Удалить можно либо за 2+ часа до начала, либо после окончания игры',
            unsubscribeNotAllowed: 'Отписка невозможна менее чем за час до начала игры',

            // LoginPage
            loginTitle: 'Вход в аккаунт',
            welcomeBack: 'Добро пожаловать обратно!',
            email: 'Email',
            password: 'Пароль',
            noAccount: 'Нет аккаунта?',
            registerLink: 'Зарегистрироваться',
            invalidCredentials: 'Неверный email или пароль',

            // RegisterPage
            registerTitle: 'Регистрация',
            createAccount: 'Создайте новый аккаунт',
            name: 'Имя',
            phone: 'Телефон',
            confirmPassword: 'Подтверждение пароля',
            alreadyHaveAccount: 'Уже есть аккаунт?',
            loginLink: 'Войти',
            generatePassword: 'Сгенерировать пароль',
            passwordRequirements: 'Пароль должен содержать:',
            strongPassword: '✓ Надёжный пароль',

            // ProfilePage
            personalAccount: 'Личный кабинет',
            saveChanges: 'Сохранить изменения',
            changePassword: 'Смена пароля',
            currentPassword: 'Текущий пароль',
            newPassword: 'Новый пароль',
            changePasswordBtn: 'Изменить пароль',
            settings: 'Настройки',
            language: 'Язык',
            theme: 'Тема',
            light: 'Светлая',
            dark: 'Темная',
            russian: 'Русский',
            english: 'English',
            changeUser: 'Сменить пользователя',
            deleteAccount: 'Удалить аккаунт',
            profileUpdated: 'Профиль успешно обновлен',
            passwordChanged: 'Пароль успешно изменен',
            updateError: 'Ошибка обновления',
            nameRequired: 'Имя обязательно',
            nameMinLength: 'Имя должно содержать минимум 2 символа',
            nameMaxLength: 'Имя не должно превышать 100 символов',
            nameInvalid: 'Имя может содержать только буквы и пробелы',
            emailRequired: 'Email обязателен',
            emailInvalid: 'Введите корректный email (example@domain.com)',
            emailExists: 'Пользователь с таким email уже существует',
            phoneInvalid: 'Телефон должен быть в формате +375 XX XXX-XX-XX',
            currentPasswordRequired: 'Введите текущий пароль',
            passwordsDoNotMatch: 'Пароли не совпадают',
            confirmDeleteAccount: 'Вы уверены? Это действие необратимо!',
            passwordMinLength: 'минимум 8 символов',
            passwordUpperRequired: 'заглавную букву (A-Z или А-Я)',
            passwordLowerRequired: 'строчную букву (a-z или а-я)',
            passwordDigitRequired: 'цифру (0-9)',
            passwordSpecialRequired: 'спецсимвол (!@#$%^&*)',

            // Footer
            contacts: 'Контакты',
            copyright: 'Все права защищены',

            // Notifications
            notificationsTitle: 'Уведомления',
            noNotifications: 'Нет уведомлений',
            markAllRead: 'Прочитать все',
            fromAdmin: 'От администратора',
            system: 'Системное',
            gameReminder: 'Напоминание',
            deleteNotification: 'Удалить уведомление',

            // About
            aboutTitle: 'О приложении',
            aboutDescription: 'Приложение разработано в рамках курсового проекта по ПСКП',
            developer: 'Разработчик:',
            developerName: 'Билый А.С.',
            version: 'Версия приложения 1.0',

            // Admin
            userManagement: 'Управление пользователями',
            sendNotification: 'Уведомление',
            block: 'Заблокировать',
            unblock: 'Разблокировать',
            statisticsTitle: 'Статистика',
            mostPopularAddress: 'Самая популярная площадка',
            popularLevel: 'Популярный уровень',
            averageCost: 'Средняя стоимость',
            adsLastMonth: 'Объявлений за месяц',
            totalUsers: 'Всего пользователей',
            blockedUsers: 'Заблокировано',
            noData: 'Нет данных',

            // AddAdvertPage
            loadError: 'Ошибка загрузки объявления',
            saveError: 'Ошибка сохранения',
            editAdvert: 'Редактирование объявления',
            createAdvertTitle: 'Создание объявления',
            address: 'Адрес',
            addressPlaceholder: 'ул. Ленина 10, Минск',
            date: 'Дата',
            startTime: 'Время начала',
            endTime: 'Время окончания',
            cost: 'Стоимость (BYN)',
            peopleCount: 'Количество участников',
            descriptionPlaceholder: 'Описание (необязательно)',
            cancel: 'Отмена',
            save: 'Сохранить',
            create: 'Создать',
            currentParticipants: 'Текущее количество записанных участников',
            peopleCountLessThanCurrent: 'Новое максимальное количество участников не может быть меньше текущего количества записанных',
            overlappingAdvert: 'На эту дату и время по данному адресу уже есть активное объявление',

            // AdvertDetailsPage
            back: 'Назад',
            description: 'Описание',
            map: 'Карта',
            sign: 'Записаться',
            unsign: 'Отписаться',
            mapLoadError: 'Не удалось загрузить карту для этого адреса',
            closeMap: 'Закрыть карту',
            loadingMap: 'Загрузка карты...',

            // FilterSection
            street: 'Улица',
            streetPlaceholder: 'Введите улицу',
            timeRange: 'Временной диапазон',
            minPrice: 'От',
            maxPrice: 'До',
            siteLocation: 'Расположение площадки',
            nearestSites: 'Ближайшие площадки',
            yourAddress: 'Ваш адрес',
            clear: 'Очистить всё',
            apply: 'Применить',

            // Validation errors
            addressRequired: 'Адрес обязателен',
            dateRequired: 'Дата обязательна',
            datePast: 'Дата не может быть в прошлом',
            dateTooFar: 'Дата не может быть позже чем через год',
            startTimeRequired: 'Время начала обязательно',
            endTimeRequired: 'Время окончания обязательно',
            startTimeAfterEnd: 'Время начала не может быть позже времени окончания',
            durationMin: 'Минимальная продолжительность - 1 час',
            durationMax: 'Максимальная продолжительность - 3 часа',
            timeTooSoon: 'Время начала должно быть не раньше чем через 3 часа от текущего момента',
            costRequired: 'Стоимость обязательна',
            costInvalid: 'Введите число',
            costNegative: 'Стоимость не может быть отрицательной',
            costMax: 'Стоимость не может быть больше 99 BYN',
            peopleRequired: 'Количество участников обязательно',
            peopleInvalid: 'Введите число',
            peopleMin: 'Минимум 2 участника',
            peopleMax: 'Максимум 50 участников',
            gameLevelRequired: 'Выберите уровень игры',
            endTimeBeforeStart: 'Время окончания не может быть раньше времени начала',
            startTimeEqualsEndTime: 'Время начала и окончания не могут совпадать',
            validating: 'Проверка адреса...',
            addressInvalid: 'Введите корректный адрес. Пример: ул. Ленина 10, Минск',

            // Tooltip
            levelTooltipD1: 'D1 – Профессиональный: действующие МС, КМС',
            levelTooltipD2: 'D2 – Продвинутый: полупрофи, воспитанники СДЮШОР',
            levelTooltipD3: 'D3 – Уверенный: комбинационная игра с пайпами и темпами',
            levelTooltipD4: 'D4 – Любитель: простая игра с нападением',
            levelTooltipD4Plus: 'D4+ – Начинающий: перебрасывание мяча через сетку',

            // Level mismatch confirmation
            levelMismatchTitle: 'Подтверждение записи',
            levelMismatchHigher: 'Вы хотите записаться на уровень выше вашего личного ({from} → {to}). Продолжить?',
            levelMismatchLower: 'Вы хотите записаться на уровень ниже вашего личного ({from} → {to}). Продолжить?',
            levelMismatchConfirm: 'Продолжить',
            levelMismatchCancel: 'Отмена',
        },
        en: {
            // Header
            home: 'Home',
            about: 'About',
            notifications: 'Notifications',
            profile: 'Profile',
            users: 'Users',
            statistics: 'Statistics',
            login: 'Login',
            register: 'Register',
            logout: 'Logout',

            // HomePage
            findTeam: 'Find your volleyball team',
            joinGames: 'Join games, create adverts and find like-minded people',
            createAdvert: 'Create Advert',
            allAdverts: 'All Adverts',
            myAdverts: 'My Adverts',
            participating: 'Participating',
            filters: 'Filters',
            noAdverts: 'No adverts available',
            createFirst: 'Create first advert',
            loading: 'Loading...',
            tryAgain: 'Try again',
            loadingError: 'Error loading adverts',
            confirmDelete: 'Are you sure you want to delete this advert?',

            // AdvertCard
            gameLevel: 'Level',
            yourAdvert: 'Your advert',
            youParticipate: 'You participate',
            youSubscribed: 'You subscribed',
            location: 'Location',
            time: 'Time',
            participants: 'Participants',
            edit: 'Edit',
            delete: 'Delete',
            subscribe: 'Subscribe',
            unsubscribe: 'Unsubscribe',
            subscribeToWaiting: 'Notify me',
            unsubscribeFromWaiting: 'Unsubscribe',
            noSeats: 'No seats',
            viewCreator: 'Creator',
            editNotAllowed: 'Editing is only allowed 2 or more hours before the game starts',
            deleteNotAllowed: 'Deletion is not allowed within 2 hours before the game starts. You can delete either 2+ hours before the start or after the game ends',
            unsubscribeNotAllowed: 'Unsubscribe is not allowed less than one hour before the game starts',

            // LoginPage
            loginTitle: 'Login',
            welcomeBack: 'Welcome back!',
            email: 'Email',
            password: 'Password',
            noAccount: "Don't have an account?",
            registerLink: 'Register',
            invalidCredentials: 'Invalid email or password',

            // RegisterPage
            registerTitle: 'Registration',
            createAccount: 'Create a new account',
            name: 'Name',
            phone: 'Phone',
            confirmPassword: 'Confirm password',
            alreadyHaveAccount: 'Already have an account?',
            loginLink: 'Login',
            generatePassword: 'Generate password',
            passwordRequirements: 'Password must contain:',
            strongPassword: '✓ Strong password',

            // ProfilePage
            personalAccount: 'Personal Account',
            saveChanges: 'Save Changes',
            changePassword: 'Change Password',
            currentPassword: 'Current Password',
            newPassword: 'New Password',
            changePasswordBtn: 'Change Password',
            settings: 'Settings',
            language: 'Language',
            theme: 'Theme',
            light: 'Light',
            dark: 'Dark',
            russian: 'Russian',
            english: 'English',
            changeUser: 'Change User',
            deleteAccount: 'Delete Account',
            profileUpdated: 'Profile updated successfully',
            passwordChanged: 'Password changed successfully',
            updateError: 'Update error',
            nameRequired: 'Name is required',
            nameMinLength: 'Name must contain at least 2 characters',
            nameMaxLength: 'Name must not exceed 100 characters',
            nameInvalid: 'Name can only contain letters and spaces',
            emailRequired: 'Email is required',
            emailInvalid: 'Enter a valid email (example@domain.com)',
            emailExists: 'User with this email already exists',
            phoneInvalid: 'Phone must be in format +375 XX XXX-XX-XX',
            currentPasswordRequired: 'Enter current password',
            passwordsDoNotMatch: 'Passwords do not match',
            confirmDeleteAccount: 'Are you sure? This action is irreversible!',
            passwordMinLength: 'at least 8 characters',
            passwordUpperRequired: 'uppercase letter (A-Z or А-Я)',
            passwordLowerRequired: 'lowercase letter (a-z or а-я)',
            passwordDigitRequired: 'digit (0-9)',
            passwordSpecialRequired: 'special character (!@#$%^&*)',

            // Footer
            contacts: 'Contacts',
            copyright: 'All rights reserved',

            // Notifications
            notificationsTitle: 'Notifications',
            noNotifications: 'No notifications',
            markAllRead: 'Mark all as read',
            fromAdmin: 'From admin',
            system: 'System',
            gameReminder: 'Reminder',
            deleteNotification: 'Delete notification',

            // About
            aboutTitle: 'About the app',
            aboutDescription: 'The application was developed as part of a course project on PSCP',
            developer: 'Developer:',
            developerName: 'Bilyi A.S.',
            version: 'Application version 1.0',

            // Admin
            userManagement: 'User Management',
            sendNotification: 'Notification',
            block: 'Block',
            unblock: 'Unblock',
            statisticsTitle: 'Statistics',
            mostPopularAddress: 'Most popular address',
            popularLevel: 'Popular level',
            averageCost: 'Average cost',
            adsLastMonth: 'Adverts last month',
            totalUsers: 'Total users',
            blockedUsers: 'Blocked users',
            noData: 'No data',

            // AddAdvertPage
            loadError: 'Error loading advert',
            saveError: 'Error saving',
            editAdvert: 'Edit Advert',
            createAdvertTitle: 'Create Advert',
            address: 'Address',
            addressPlaceholder: 'Lenina str. 10, Minsk',
            date: 'Date',
            startTime: 'Start time',
            endTime: 'End time',
            cost: 'Cost (BYN)',
            peopleCount: 'Number of participants',
            descriptionPlaceholder: 'Description (optional)',
            cancel: 'Cancel',
            save: 'Save',
            create: 'Create',
            currentParticipants: 'Current number of registered participants',
            peopleCountLessThanCurrent: 'New maximum number of participants cannot be less than the current number of registered participants',
            overlappingAdvert: 'There is already an active advert at this address on this date and time',

            // AdvertDetailsPage
            back: 'Back',
            description: 'Description',
            map: 'Map',
            sign: 'Subscribe',
            unsign: 'Unsubscribe',
            mapLoadError: 'Failed to load map for this address',
            closeMap: 'Close map',
            loadingMap: 'Loading map...',

            // FilterSection
            street: 'Street',
            streetPlaceholder: 'Enter street',
            timeRange: 'Time range',
            minPrice: 'From',
            maxPrice: 'To',
            siteLocation: 'Site location',
            nearestSites: 'Nearest sites',
            yourAddress: 'Your address',
            clear: 'Clear all',
            apply: 'Apply',

            // Validation errors
            addressRequired: 'Address is required',
            dateRequired: 'Date is required',
            datePast: 'Date cannot be in the past',
            dateTooFar: 'Date cannot be more than one year from now',
            startTimeRequired: 'Start time is required',
            endTimeRequired: 'End time is required',
            startTimeAfterEnd: 'Start time cannot be after end time',
            durationMin: 'Minimum duration - 1 hour',
            durationMax: 'Maximum duration - 3 hours',
            timeTooSoon: 'Start time must be at least 3 hours from now',
            costRequired: 'Cost is required',
            costInvalid: 'Enter a number',
            costNegative: 'Cost cannot be negative',
            costMax: 'Cost cannot exceed 99 BYN',
            peopleRequired: 'Number of participants is required',
            peopleInvalid: 'Enter a number',
            peopleMin: 'Minimum 2 participants',
            peopleMax: 'Maximum 50 participants',
            gameLevelRequired: 'Select game level',
            endTimeBeforeStart: 'End time cannot be earlier than start time',
            startTimeEqualsEndTime: 'Start time and end time cannot be the same',
            validating: 'Validating address...',
            addressInvalid: 'Enter a valid address. Example: Lenina str. 10, Minsk',

            // Tooltip
            levelTooltipD1: 'D1 – Professional: active Masters and Candidate Masters of Sport',
            levelTooltipD2: 'D2 – Advanced: semi-pro, sports school graduates',
            levelTooltipD3: 'D3 – Confident: combination play with pipes and tempo',
            levelTooltipD4: 'D4 – Amateur: simple play with attacking',
            levelTooltipD4Plus: 'D4+ – Beginner: just throwing the ball over the net',

            // Level mismatch confirmation
            levelMismatchTitle: 'Confirm subscription',
            levelMismatchHigher: 'You are about to join a game with a level higher than yours ({from} → {to}). Continue?',
            levelMismatchLower: 'You are about to join a game with a level lower than yours ({from} → {to}). Continue?',
            levelMismatchConfirm: 'Continue',
            levelMismatchCancel: 'Cancel',
        }
    };

    const t = (key) => {
        return translations[language][key] || key;
    };

    useEffect(() => {
        localStorage.setItem('language', language);
        document.documentElement.setAttribute('lang', language);
    }, [language]);

    useEffect(() => {
        const handleLanguageChange = (event) => {
            if (event.detail) {
                setLanguage(event.detail);
                localStorage.setItem('language', event.detail);
                document.documentElement.setAttribute('lang', event.detail);
            }
        };

        window.addEventListener('languageChange', handleLanguageChange);

        return () => {
            window.removeEventListener('languageChange', handleLanguageChange);
        };
    }, []);

    const changeLanguage = (lang) => {
        setLanguage(lang);
        localStorage.setItem('language', lang);
        document.documentElement.setAttribute('lang', lang);
    };

    return (
        <LanguageContext.Provider value={{ language, t, changeLanguage, locale: language === 'ru' ? 'ru-RU' : 'en-US' }}>
            {children}
        </LanguageContext.Provider>
    );
};