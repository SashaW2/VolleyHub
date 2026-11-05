import React, { useState, useEffect, useCallback } from 'react';
import { FaBell } from 'react-icons/fa';
import NotificationItem from '../../components/NotificationItem/NotificationItem';
import notificationService from '../../services/notificationService';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import styles from './NotificationsPage.module.css';

const NotificationsPage = () => {
    const { t } = useLanguage();
    const { theme } = useTheme();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadNotifications = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const response = await notificationService.getMyNotifications();
            setNotifications(response.notifications || []);
        } catch (error) {
            console.error('Error loading notifications:', error);
        } finally {
            if (!silent) setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadNotifications();

        const handler = () => loadNotifications(true);
        window.addEventListener('notificationsChanged', handler);
        return () => window.removeEventListener('notificationsChanged', handler);
    }, [loadNotifications]);

    const handleDelete = async (id) => {
        try {
            const wasUnread = notifications.find(n => n.Id === id && !n.IsRead);
            await notificationService.deleteNotification(id);
            setNotifications(prev => prev.filter(n => n.Id !== id));
            if (wasUnread) {
                window.dispatchEvent(new CustomEvent('notificationsChanged'));
            }
        } catch (error) {
            alert(error.message);
        }
    };

    const handleMarkAsRead = async (id) => {
        try {
            const target = notifications.find(n => n.Id === id);
            if (!target || target.IsRead) return;
            await notificationService.markAsRead(id);
            setNotifications(prev => prev.map(n =>
                n.Id === id ? { ...n, IsRead: true } : n
            ));
            window.dispatchEvent(new CustomEvent('notificationsChanged'));
        } catch (error) {
            alert(error.message);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            const hasUnread = notifications.some(n => !n.IsRead);
            await notificationService.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, IsRead: true })));
            if (hasUnread) {
                window.dispatchEvent(new CustomEvent('notificationsChanged'));
            }
        } catch (error) {
            alert(error.message);
        }
    };

    if (loading) return <div className={styles.loading}>{t('loading')}</div>;

    return (
        <div className={styles.notificationsPage} data-theme={theme}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1 className={styles.title}>{t('notificationsTitle')}</h1>
                    <div className={styles.headerActions}>
                        {notifications.length > 0 && (
                            <button className={styles.markAllButton} onClick={handleMarkAllAsRead}>
                                {t('markAllRead')}
                            </button>
                        )}
                        <FaBell className={styles.icon} />
                    </div>
                </div>
                <div className={styles.notificationsList}>
                    {notifications.length === 0 ? (
                        <div className={styles.emptyState}>
                            <p>{t('noNotifications')}</p>
                        </div>
                    ) : (
                        notifications.map((notif) => (
                            <NotificationItem
                                key={notif.Id}
                                notification={notif}
                                onDelete={handleDelete}
                                onMarkAsRead={handleMarkAsRead}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationsPage;