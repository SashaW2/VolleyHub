export const GAME_LEVELS = {
    D1: 'D1',
    D2: 'D2',
    D3: 'D3',
    D4: 'D4',
    D4Plus: 'D4Plus'
};

export const GAME_LEVELS_LIST = [
    { value: 'D1', label: 'D1' },
    { value: 'D2', label: 'D2' },
    { value: 'D3', label: 'D3' },
    { value: 'D4', label: 'D4' },
    { value: 'D4Plus', label: 'D4+' }
];

export const LANGUAGES = {
    RU: 'ru',
    EN: 'en'
};

export const THEMES = {
    LIGHT: 'light',
    DARK: 'dark'
};

export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const STORAGE_KEYS = {
    TOKEN: 'token',
    USER: 'user',
    THEME: 'theme',
    LANGUAGE: 'language'
};

export const DATE_FORMAT = 'yyyy-MM-dd';
export const TIME_FORMAT = 'HH:mm';
export const DATETIME_FORMAT = 'yyyy-MM-dd HH:mm';

export const NOTIFICATION_TYPES = {
    SYSTEM: 'system',
    ADMIN: 'admin',
    REMINDER: 'reminder'
};