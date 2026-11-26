import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';

const NotificationStreamContext = createContext(null);

export const useNotificationStream = () => {
    const ctx = useContext(NotificationStreamContext);
    if (!ctx) {
        throw new Error('useNotificationStream must be used within NotificationStreamProvider');
    }
    return ctx;
};

export const NotificationStreamProvider = ({ children }) => {
    const { isAuthenticated, user, logout } = useAuth();
    const { t } = useLanguage();
    const [unreadCount, setUnreadCount] = useState(0);
    const [lastEvent, setLastEvent] = useState(null);
    const esRef = useRef(null);
    const blockedHandlersRef = useRef({});
    blockedHandlersRef.current = { t, logout };

    const isAdmin = user?.role === 'admin' || user?.isAdmin === true || user?.roleId === 2;

    const refetchCount = useCallback(async () => {
        if (!isAuthenticated || isAdmin) {
            setUnreadCount(0);
            return;
        }
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/notifications/unread-count', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setUnreadCount(data.count || 0);
        } catch (e) {
        }
    }, [isAuthenticated, isAdmin]);

    useEffect(() => {
        if (!isAuthenticated || isAdmin) {
            if (esRef.current) {
                esRef.current.close();
                esRef.current = null;
            }
            setUnreadCount(0);
            return;
        }

        refetchCount();

        const token = localStorage.getItem('token');
        if (!token) return;

        const es = new EventSource(`/api/notifications/stream?token=${encodeURIComponent(token)}`);
        esRef.current = es;

        es.addEventListener('blocked', (event) => {
            let serverMessage = '';
            try {
                serverMessage = JSON.parse(event.data)?.message || '';
            } catch (e) {
                serverMessage = '';
            }

            const { t: translate, logout: doLogout } = blockedHandlersRef.current;
            es.close();
            esRef.current = null;
            const message = translate('accountBlockedMessage') || serverMessage;
            const title = translate('dialogAlertTitle');
            try {
                sessionStorage.setItem('pendingAlertDialog', JSON.stringify({ message, title }));
            } catch (e) {
            }
            doLogout();
        });

        es.addEventListener('notification', (event) => {
            try {
                const payload = JSON.parse(event.data);
                setLastEvent({ ...payload, _receivedAt: Date.now() });
            } catch (e) {
            }
            setUnreadCount(prev => prev + 1);
            window.dispatchEvent(new CustomEvent('notificationsChanged'));
        });

        es.onerror = () => {
        };

        return () => {
            es.close();
            esRef.current = null;
        };
    }, [isAuthenticated, isAdmin, refetchCount]);

    return (
        <NotificationStreamContext.Provider value={{ unreadCount, setUnreadCount, lastEvent, refetchCount }}>
            {children}
        </NotificationStreamContext.Provider>
    );
};