import React, { useState, useEffect } from 'react';
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

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        try {
            const response = await notificationService.getMyNotifications();
            setNotifications(response.notifications || []);
        } catch (error) {
            console.error('Error loading notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await notificationService.deleteNotification(id);
            setNotifications(prev => prev.filter(n => n.Id !== id));
        } catch (error) {
            alert(error.message);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, IsRead: true })));
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
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationsPage;