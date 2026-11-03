import { useState, useEffect } from 'react';

export const useLanguage = () => {
    const [language, setLanguage] = useState(() => {
        const savedLanguage = localStorage.getItem('language');
        return savedLanguage || 'ru';
    });

    useEffect(() => {
        localStorage.setItem('language', language);
    }, [language]);

    const translations = {
        ru: {
            addAdvert: 'Создать объявление',
            login: 'Войти',
            register: 'Регистрация',
            profile: 'Профиль',
            notifications: 'Уведомления',
            about: 'О нас',
            logout: 'Выйти',
            save: 'Сохранить',
            cancel: 'Отмена',
            delete: 'Удалить',
            edit: 'Редактировать',
            subscribe: 'Записаться',
            unsubscribe: 'Отписаться'
        },
        en: {
            addAdvert: 'Add Advert',
            login: 'Login',
            register: 'Register',
            profile: 'Profile',
            notifications: 'Notifications',
            about: 'About',
            logout: 'Logout',
            save: 'Save',
            cancel: 'Cancel',
            delete: 'Delete',
            edit: 'Edit',
            subscribe: 'Subscribe',
            unsubscribe: 'Unsubscribe'
        }
    };

    const t = (key) => translations[language][key] || key;

    return { language, setLanguage, t };
};