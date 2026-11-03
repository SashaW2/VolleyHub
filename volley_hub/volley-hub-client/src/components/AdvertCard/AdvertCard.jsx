import React from 'react';
import { FaMapMarkerAlt, FaCalendar, FaClock, FaUsers, FaVolleyballBall, FaEdit, FaTrash, FaUser } from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import Button from '../common/Button/Button';
import styles from './AdvertCard.module.css';
import Tooltip from "../common/Tooltip/Tooltip";

const AdvertCard = ({ advert, isCreator, isParticipating, isSubscribed, isAdmin, onSubscribe, onUnsubscribe, onSubscribeToWaiting, onUnsubscribeFromWaiting, onEdit, onDelete, onViewCreator, onClick }) => {
    const { t } = useLanguage();
    const { theme } = useTheme();

    const levelColors = {
        'D1': '#10B981',
        'D2': '#FF6B35',
        'D3': '#F59E0B',
        'D4': '#EF4444',
        'D4+': '#A855F7'
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const day = date.getDate();
        const month = date.toLocaleString('ru-RU', { month: 'long' });
        const year = date.getFullYear();
        return `${day} ${month} ${year} г.`;
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return '';

        if (typeof timeStr === 'string') {
            if (timeStr.includes('T')) {
                const timePart = timeStr.split('T')[1];
                if (timePart) {
                    const hoursMinutes = timePart.split(':');
                    if (hoursMinutes.length >= 2) {
                        return `${hoursMinutes[0]}:${hoursMinutes[1]}`;
                    }
                }
            }

            const parts = timeStr.split(':');
            if (parts.length >= 2) {
                return `${parts[0]}:${parts[1]}`;
            }
            return timeStr;
        }

        if (timeStr instanceof Date) {
            const hours = timeStr.getHours().toString().padStart(2, '0');
            const minutes = timeStr.getMinutes().toString().padStart(2, '0');
            return `${hours}:${minutes}`;
        }

        try {
            const date = new Date(timeStr);
            if (!isNaN(date.getTime())) {
                const hours = date.getHours().toString().padStart(2, '0');
                const minutes = date.getMinutes().toString().padStart(2, '0');
                return `${hours}:${minutes}`;
            }
        } catch (e) {
            console.error('Error formatting time:', e);
        }

        return '';
    };

    const getGameLevelName = (level) => {
        const levelMap = {
            1: 'D1',
            2: 'D2',
            3: 'D3',
            4: 'D4',
            5: 'D4+',
            'D1': 'D1',
            'D2': 'D2',
            'D3': 'D3',
            'D4': 'D4',
            'D4Plus': 'D4+'
        };
        return levelMap[level] || 'D2';
    };

    const participantsCount = advert.participantsCount || 0;
    const progressPercent = (participantsCount / advert.peopleCount) * 100;
    const levelName = getGameLevelName(advert.gameLevel);
    const isFull = participantsCount >= advert.peopleCount;

    const getEventTime = () => {
        const eventDate = new Date(advert.date);
        const timeStr = formatTime(advert.startTime);
        if (!timeStr) return null;

        const [hours, minutes] = timeStr.split(':');
        eventDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
        return eventDate.getTime();
    };

    const canEdit = () => {
        if (isAdmin) return true;
        if (!isCreator) return false;

        const eventTime = getEventTime();
        if (!eventTime) return false;

        const now = Date.now();
        const twoHoursBeforeEvent = eventTime - 2 * 60 * 60 * 1000;
        return now < twoHoursBeforeEvent;
    };

    const canDelete = () => {
        if (isAdmin) return true;
        if (!isCreator) return false;

        const eventTime = getEventTime();
        if (!eventTime) return false;

        const now = Date.now();
        const twoHoursBeforeEvent = eventTime - 2 * 60 * 60 * 1000;
        const isBeforeTwoHours = now < twoHoursBeforeEvent;
        const isAfterStart = now >= eventTime;
        return isBeforeTwoHours || isAfterStart;
    };

    const canUnsubscribe = () => {
        const eventTime = getEventTime();
        if (!eventTime) return true;

        const now = Date.now();
        const oneHourBeforeEvent = eventTime - 60 * 60 * 1000;
        return now < oneHourBeforeEvent;
    };

    const handleCardClick = (e) => {
        e.stopPropagation();
        onClick();
    };

    const handleEditClick = (e) => {
        e.stopPropagation();
        if (canEdit()) {
            onEdit();
        } else {
            alert(t('editNotAllowed'));
        }
    };

    const handleDeleteClick = (e) => {
        e.stopPropagation();
        if (canDelete()) {
            onDelete();
        } else {
            alert(t('deleteNotAllowed'));
        }
    };

    const handleViewCreatorClick = (e) => {
        e.stopPropagation();
        onViewCreator();
    };

    const handleSubscribeClick = (e) => {
        e.stopPropagation();
        if (isParticipating) {
            if (canUnsubscribe()) {
                onUnsubscribe();
            } else {
                alert(t('unsubscribeNotAllowed'));
            }
        } else if (isSubscribed) {
            onUnsubscribeFromWaiting();
        } else if (isFull && !isParticipating && !isSubscribed) {
            onSubscribeToWaiting();
        } else {
            onSubscribe();
        }
    };

    const getButtonText = () => {
        if (isParticipating) {
            return t('unsubscribe');
        }
        if (isSubscribed) {
            return t('unsubscribeFromWaiting');
        }
        if (isFull && !isParticipating && !isSubscribed) {
            return t('subscribeToWaiting');
        }
        return t('subscribe');
    };

    const getButtonClass = () => {
        if (isParticipating) return styles.unsubscribe;
        if (isSubscribed) return styles.unsubscribeWaiting;
        if (isFull && !isParticipating && !isSubscribed) return styles.waiting;
        return styles.subscribe;
    };

    const showCreatorButton = isAdmin;
    const showSubscribeButtons = !isAdmin;

    return (
        <div className={styles.card} onClick={handleCardClick} data-theme={theme}>
            <div className={styles.cardHeader}>
                <Tooltip
                    content={
                        levelName === 'D1' ? t('levelTooltipD1') :
                            levelName === 'D2' ? t('levelTooltipD2') :
                                levelName === 'D3' ? t('levelTooltipD3') :
                                    levelName === 'D4' ? t('levelTooltipD4') :
                                        levelName === 'D4+' ? t('levelTooltipD4Plus') :
                                            ''
                    }
                    position="bottom"
                >
                    <div className={styles.levelBadge} style={{ background: levelColors[levelName] || '#667eea' }}>
                        <FaVolleyballBall className={styles.levelIcon} />
                        <span>{t('gameLevel')} {levelName}</span>
                    </div>
                </Tooltip>
                {isCreator && <div className={styles.creatorBadge}>{t('yourAdvert')}</div>}
                {!isAdmin && isParticipating && <div className={styles.participatingBadge}>{t('youParticipate')}</div>}
                {!isAdmin && isSubscribed && !isParticipating && <div className={styles.subscribedBadge}>{t('youSubscribed')}</div>}
            </div>

            <div className={styles.cardContent}>
                <div className={styles.row}>
                    <FaMapMarkerAlt className={styles.icon} />
                    <span className={styles.text}>{advert.address}</span>
                </div>

                <div className={styles.row}>
                    <FaCalendar className={styles.icon} />
                    <span className={styles.text}>{formatDate(advert.date)}</span>
                </div>

                <div className={styles.row}>
                    <FaClock className={styles.icon} />
                    <span className={styles.text}>{formatTime(advert.startTime)} - {formatTime(advert.endTime)}</span>
                </div>

                <div className={styles.participantsSection}>
                    <div className={styles.participantsHeader}>
                        <FaUsers className={styles.icon} />
                        <span className={styles.label}>{t('participants')}</span>
                    </div>
                    <div className={styles.participantsCount}>
                        <span className={styles.currentCount}>{participantsCount}</span>
                        <span className={styles.separator}>/</span>
                        <span className={styles.totalCount}>{advert.peopleCount}</span>
                    </div>
                    <div className={styles.progressBar}>
                        <div className={styles.progressFill} style={{ width: `${progressPercent}%` }}></div>
                    </div>
                </div>

                <div className={styles.row}>
                    <span className={styles.label}>{t('cost')}</span>
                    <span className={styles.priceValue}>{advert.cost} BYN</span>
                </div>
            </div>

            <div className={styles.cardFooter}>
                <div className={styles.buttonGroup}>
                    {showCreatorButton && (
                        <Button size="small" variant="outline" onClick={handleViewCreatorClick}>
                            <FaUser /> {t('viewCreator')}
                        </Button>
                    )}

                    {(isCreator || isAdmin) && (
                        <>
                            <Button size="small" variant="outline" onClick={handleEditClick}>
                                <FaEdit /> {t('edit')}
                            </Button>
                            <Button size="small" variant="danger" onClick={handleDeleteClick}>
                                <FaTrash /> {t('delete')}
                            </Button>
                        </>
                    )}
                </div>

                {showSubscribeButtons && (
                    <button
                        className={`${styles.subscribeBtn} ${getButtonClass()}`}
                        onClick={handleSubscribeClick}
                    >
                        {getButtonText()}
                    </button>
                )}
            </div>
        </div>
    );
};

export default AdvertCard;