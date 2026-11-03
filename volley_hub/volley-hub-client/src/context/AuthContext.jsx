import React, { createContext, useState, useEffect, useContext } from 'react';
import authService from '../services/authService';

export const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const applyUserSettings = (userData) => {
        if (userData) {
            if (userData.language) {
                localStorage.setItem('language', userData.language);
                document.documentElement.setAttribute('lang', userData.language);
                window.dispatchEvent(new CustomEvent('languageChange', { detail: userData.language }));
            }
            if (userData.theme) {
                localStorage.setItem('theme', userData.theme);
                document.documentElement.setAttribute('data-theme', userData.theme);
            }
        }
    };

    useEffect(() => {
        const initAuth = async () => {
            const currentUser = authService.getCurrentUser();
            const token = authService.getToken();

            if (token && currentUser) {
                setUser(currentUser);
                applyUserSettings(currentUser);
            } else {
                setUser(null);
            }
            setLoading(false);
        };

        initAuth();
    }, []);

    const login = async (email, password) => {
        try {
            const response = await authService.login(email, password);
            setUser(response.user);
            applyUserSettings(response.user);
            return response;
        } catch (error) {
            throw error;
        }
    };

    const register = async (userData) => {
        try {
            const response = await authService.register(userData);
            setUser(response.user);
            applyUserSettings(response.user);
            return response;
        } catch (error) {
            throw error;
        }
    };

    const logout = () => {
        authService.logout();
        setUser(null);
        localStorage.setItem('language', 'ru');
        localStorage.setItem('theme', 'light');
        document.documentElement.setAttribute('lang', 'ru');
        document.documentElement.setAttribute('data-theme', 'light');
        window.dispatchEvent(new CustomEvent('languageChange', { detail: 'ru' }));
    };

    const updateProfile = async (profileData) => {
        try {
            const response = await authService.updateProfile(profileData);
            if (response.user) {
                setUser(response.user);
                applyUserSettings(response.user);
            }
            return response;
        } catch (error) {
            throw error;
        }
    };

    const changePassword = async (passwordData) => {
        try {
            return await authService.changePassword(passwordData);
        } catch (error) {
            throw error;
        }
    };

    const deleteAccount = async () => {
        try {
            await authService.deleteAccount();
            setUser(null);
            localStorage.setItem('language', 'ru');
            localStorage.setItem('theme', 'light');
            document.documentElement.setAttribute('lang', 'ru');
            document.documentElement.setAttribute('data-theme', 'light');
            window.dispatchEvent(new CustomEvent('languageChange', { detail: 'ru' }));
        } catch (error) {
            throw error;
        }
    };

    const isAuthenticated = !!user;

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            login,
            register,
            logout,
            updateProfile,
            changePassword,
            deleteAccount,
            isAuthenticated
        }}>
            {children}
        </AuthContext.Provider>
    );
};