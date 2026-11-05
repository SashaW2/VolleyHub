import React from 'react';
import { FaTrash, FaShieldAlt, FaEnvelope, FaBell, FaClock } from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import styles from './NotificationItem.module.css';

const NotificationItem = ({ notification, onDelete, onMarkAsRead }) => {
    const { theme } = useTheme();
    const { t, language } = useLanguage();

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const localDate = new Date(date.getTime() - 3 * 60 * 60 * 1000);

        const options = {
            day: 'numeric',
            month: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };

        if (language === 'ru') {
            return localDate.toLocaleString('ru-RU', options);
        } else {
            return localDate.toLocaleString('en-US', options);
        }
    };

    const getNotificationIcon = () => {
        switch (notification.NotificationType) {
            case 'admin':
                return <FaShieldAlt className={styles.adminIcon} />;
            case 'system':
                return <FaBell className={styles.systemIcon} />;
            case 'reminder':
                return <FaClock className={styles.reminderIcon} />;
            default:
                return <FaEnvelope className={styles.defaultIcon} />;
        }
    };

    const getNotificationBadge = () => {
        switch (notification.NotificationType) {
            case 'admin':
                return <span className={styles.adminBadge}>{t('fromAdmin')}</span>;
            case 'system':
                return <span className={styles.systemBadge}>{t('system')}</span>;
            case 'reminder':
                return <span className={styles.reminderBadge}>{t('gameReminder')}</span>;
            default:
                return null;
        }
    };

    const getDisplayText = () => {
        if (notification.NotificationType === 'admin' && notification.Text?.startsWith('[АДМИН]')) {
            return notification.Text.replace('[АДМИН] ', '');
        }
        return notification.Text;
    };

    const handleCardClick = () => {
        if (!notification.IsRead && onMarkAsRead) {
            onMarkAsRead(notification.Id);
        }
    };

    const handleDeleteClick = (e) => {
        e.stopPropagation();
        onDelete(notification.Id);
    };

    return (
        <div
            className={`${styles.notificationItem} ${!notification.IsRead ? styles.unread : ''}`}
            data-theme={theme}
            onClick={handleCardClick}
        >
            <div className={styles.notificationIcon}>
                {getNotificationIcon()}
            </div>
            <div className={styles.notificationContent}>
                {getNotificationBadge()}
                <p className={styles.notificationText}>{getDisplayText()}</p>
                <span className={styles.notificationDate}>{formatDate(notification.CreatedDate)}</span>
            </div>
            <button
                className={styles.deleteButton}
                onClick={handleDeleteClick}
                aria-label={t('deleteNotification')}
            >
                <FaTrash />
            </button>
        </div>
    );
};

export default NotificationItem;