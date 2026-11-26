import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import userService from '../services/userService';
import { useAdvertStream } from './AdvertStreamContext';
import { useDialog } from './DialogContext';

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
    const { lastEvent: advertsEvent } = useAdvertStream();
    const { alertDialog } = useDialog();
    const handledEventRef = useRef(null);
    const refreshTimerRef = useRef(null);

    const openCreatorModal = useCallback(async (userId) => {
        setLoading(true);
        try {
            const response = await userService.getUserById(userId);
            setSelectedCreator(response.user);
            setShowModal(true);
        } catch (error) {
            console.error('Error loading creator:', error);
            alertDialog('Не удалось загрузить информацию о создателе');
        } finally {
            setLoading(false);
        }
    }, [alertDialog]);

    useEffect(() => {
        if (!advertsEvent) return;

        const eventId = advertsEvent._receivedAt ?? null;
        if (eventId !== null && eventId === handledEventRef.current) return;
        handledEventRef.current = eventId;

        const creatorId = selectedCreator?.id;
        if (!creatorId) return;
        if (advertsEvent.actorId !== creatorId) return;

        if (advertsEvent.action === 'user-deleted') {
            setShowModal(false);
            setSelectedCreator(null);
            return;
        }

        if (advertsEvent.action !== 'user-updated') return;

        if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = setTimeout(async () => {
            refreshTimerRef.current = null;
            try {
                const response = await userService.getUserById(creatorId);
                setSelectedCreator(response.user);
            } catch (error) {
                console.error('Error refreshing creator:', error);
            }
        }, 300);

        return () => {
            if (refreshTimerRef.current) {
                clearTimeout(refreshTimerRef.current);
                refreshTimerRef.current = null;
            }
        };
    }, [advertsEvent, selectedCreator]);

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