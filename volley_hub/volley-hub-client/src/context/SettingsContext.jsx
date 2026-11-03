import React, { createContext, useState, useEffect, useContext } from 'react';

const SettingsContext = createContext();

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within SettingsProvider');
    }
    return context;
};

export const SettingsProvider = ({ children }) => {
    const [language, setLanguage] = useState(() => {
        return localStorage.getItem('language') || 'ru';
    });

    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('theme') || 'light';
    });

    // Применяем тему к документу
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
    }, [theme]);

    // Применяем язык
    useEffect(() => {
        document.documentElement.setAttribute('lang', language);
    }, [language]);

    const changeLanguage = (lang) => {
        setLanguage(lang);
        localStorage.setItem('language', lang);
    };

    const changeTheme = (newTheme) => {
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    };

    // Синхронизация настроек из БД
    const syncFromUser = (user) => {
        if (user) {
            if (user.language && user.language !== language) {
                changeLanguage(user.language);
            }
            if (user.theme && user.theme !== theme) {
                changeTheme(user.theme);
            }
        }
    };

    return (
        <SettingsContext.Provider value={{
            language,
            theme,
            changeLanguage,
            changeTheme,
            syncFromUser
        }}>
            {children}
        </SettingsContext.Provider>
    );
};