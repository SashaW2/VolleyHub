import React, { createContext, useContext, useState, useCallback } from 'react';
import userService from '../services/userService';

const CreatorModalContext = createContext();

export const useCreatorModal = () => {
    const context = useContext(CreatorModalContext);
    if (!context) {
        throw new Error('useCreatorModal must be used within CreatorModalProvider');
    }
    return context;
};

export const CreatorModalProvider = ({ children }) => {
    const [selectedCreator, setSelectedCreator] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);

    const openCreatorModal = useCallback(async (userId) => {
        setLoading(true);
        try {
            const response = await userService.getUserById(userId);
            setSelectedCreator(response.user);
            setShowModal(true);
        } catch (error) {
            console.error('Error loading creator:', error);
            alert('Не удалось загрузить информацию о создателе');
        } finally {
            setLoading(false);
        }
    }, []);

    const closeCreatorModal = useCallback(() => {
        setShowModal(false);
        setSelectedCreator(null);
    }, []);

    const updateCreator = useCallback((updatedUser) => {
        setSelectedCreator(updatedUser);
    }, []);

    const value = {
        selectedCreator,
        showModal,
        loading,
        openCreatorModal,
        closeCreatorModal,
        updateCreator
    };

    return (
        <CreatorModalContext.Provider value={value}>
            {children}
        </CreatorModalContext.Provider>
    );
};