import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaUser } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useCreatorModal } from '../../context/CreatorModalContext';
import Button from '../../components/common/Button/Button';
import advertService from '../../services/advertService';
import locationService from '../../services/locationService';
import styles from './AdvertDetailsPage.module.css';

const AdvertDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const { t } = useLanguage();
    const { theme } = useTheme();
    const { openCreatorModal } = useCreatorModal();
    const [advert, setAdvert] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showMap, setShowMap] = useState(false);
    const [mapLoading, setMapLoading] = useState(false);

    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);

    const isAdmin = user?.role === 'admin' || user?.isAdmin === true || user?.roleId === 2;

    useEffect(() => {
        loadAdvert();
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.destroy();
            }
        };
    }, [id]);

    const loadAdvert = async () => {
        try {
            const response = await advertService.getAdvertById(id);
            setAdvert(response.advert);
        } catch (err) {
            setError(t('loadError'));
        } finally {
            setLoading(false);
        }
    };

    const loadYandexMaps = () => {
        return new Promise((resolve) => {
            if (window.ymaps) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = `https://api-maps.yandex.ru/2.1/?lang=ru_RU`;
            script.async = true;
            script.onload = () => {
                window.ymaps.ready(resolve);
            };
            document.head.appendChild(script);
        });
    };

    const initMap = (lat, lon, address) => {
        if (mapRef.current && window.ymaps) {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.destroy();
                mapInstanceRef.current = null;
            }

            const map = new window.ymaps.Map(mapRef.current, {
                center: [lat, lon],
                zoom: 16,
                controls: ['zoomControl', 'fullscreenControl']
            });

            const placemark = new window.ymaps.Placemark([lat, lon], {
                hintContent: address,
                balloonContent: address
            }, {
                preset: 'islands#redIcon',
                draggable: false
            });

            map.geoObjects.add(placemark);
            mapInstanceRef.current = map;
        }
    };

    const loadMap = async () => {
        if (!advert?.address) return;
        if (showMap && mapInstanceRef.current) return;

        setMapLoading(true);
        setShowMap(true);

        try {
            const coords = await locationService.getAddressCoordinates(advert.address);
            if (coords) {
                await loadYandexMaps();
                setTimeout(() => {
                    initMap(coords.lat, coords.lon, advert.address);
                    setMapLoading(false);
                }, 100);
            } else {
                setError(t('mapLoadError'));
                setShowMap(false);
                setMapLoading(false);
            }
        } catch (err) {
            console.error('Error loading map:', err);
            setError(t('mapLoadError'));
            setShowMap(false);
            setMapLoading(false);
        }
    };

    const closeMap = () => {
        if (mapInstanceRef.current) {
            mapInstanceRef.current.destroy();
            mapInstanceRef.current = null;
        }
        setShowMap(false);
    };

    const handleViewCreator = () => {
        if (advert && advert.userId) {
            openCreatorModal(advert.userId);
        }
    };

    const getEventTime = () => {
        if (!advert) return null;
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

    const handleEditClick = () => {
        if (canEdit()) {
            navigate(`/add-advert?edit=${advert.id}`);
        } else {
            alert(t('editNotAllowed'));
        }
    };

    const handleDeleteClick = () => {
        if (canDelete()) {
            if (window.confirm(t('confirmDelete'))) {
                handleDelete();
            }
        } else {
            alert(t('deleteNotAllowed'));
        }
    };

    const handleSubscribe = async () => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        try {
            const isCurrentlyParticipating = advert.isParticipating;
            const isCurrentlySubscribed = advert.isSubscribed;
            const isFull = advert.participantsCount >= advert.peopleCount;

            if (isCurrentlyParticipating) {
                if (canUnsubscribe()) {
                    await advertService.unsubscribeFromAdvert(id);
                    setAdvert(prev => ({
                        ...prev,
                        isParticipating: false,
                        participantsCount: prev.participantsCount - 1
                    }));
                } else {
                    alert(t('unsubscribeNotAllowed'));
                    return;
                }
            } else if (isCurrentlySubscribed) {
                await advertService.unsubscribeFromWaitingList(id);
                setAdvert(prev => ({
                    ...prev,
                    isSubscribed: false
                }));
            } else if (isFull && !isCurrentlyParticipating && !isCurrentlySubscribed) {
                await advertService.subscribeToWaitingList(id);
                setAdvert(prev => ({
                    ...prev,
                    isSubscribed: true
                }));
            } else {
                await advertService.subscribeToAdvert(id);
                setAdvert(prev => ({
                    ...prev,
                    isParticipating: true,
                    participantsCount: prev.participantsCount + 1,
                    isSubscribed: false
                }));
            }
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDelete = async () => {
        try {
            await advertService.deleteAdvert(id);
            navigate('/');
        } catch (err) {
            alert(err.message);
        }
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

        return '';
    };

    const getGameLevelName = (level) => {
        const levelMap = {
            1: 'D1', 2: 'D2', 3: 'D3', 4: 'D4', 5: 'D4+',
            'D1': 'D1', 'D2': 'D2', 'D3': 'D3', 'D4': 'D4', 'D4Plus': 'D4+'
        };
        return levelMap[level] || 'D2';
    };

    if (loading) return <div className={styles.loading}>{t('loading')}</div>;
    if (error) return <div className={styles.error}>{error}</div>;
    if (!advert) return null;

    const isCreator = user && advert.userId === user.id;
    const isFull = advert.participantsCount >= advert.peopleCount;
    const levelName = getGameLevelName(advert.gameLevel);
    const isParticipating = advert.isParticipating === true;
    const isSubscribed = advert.isSubscribed === true;
    const showCreatorButton = isAdmin;
    const showSubscribeSection = !isAdmin && !isCreator;

    const getButtonText = () => {
        if (isParticipating) return t('unsubscribe');
        if (isSubscribed) return t('unsubscribeFromWaiting');
        if (isFull && !isParticipating && !isSubscribed) return t('subscribeToWaiting');
        return t('subscribe');
    };

    const getButtonClass = () => {
        if (isParticipating) return styles.unsubscribe;
        if (isSubscribed) return styles.unsubscribeWaiting;
        if (isFull && !isParticipating && !isSubscribed) return styles.waiting;
        return styles.subscribe;
    };

    return (
        <div className={styles.detailsPage} data-theme={theme}>
            <div className={styles.container}>
                <button className={styles.backButton} onClick={() => navigate(-1)}>← {t('back')}</button>

                <div className={styles.card}>
                    <div className={styles.header}>
                        <div className={styles.levelBadge}>
                            {t('gameLevel')} {levelName}
                        </div>
                        {isCreator && <div className={styles.creatorBadge}>{t('yourAdvert')}</div>}
                    </div>

                    <div className={styles.content}>
                        <div className={styles.section}>
                            <div className={styles.sectionLabel}>{t('location')}</div>
                            <div className={styles.sectionValue}>{advert.address}</div>
                            <button className={styles.mapButton} onClick={loadMap}>
                                {t('map')}
                            </button>
                        </div>

                        {showMap && (
                            <div className={styles.mapContainer}>
                                {mapLoading && <div className={styles.mapLoading}>{t('loadingMap')}</div>}
                                <div ref={mapRef} className={styles.map} style={{ display: mapLoading ? 'none' : 'block' }}></div>
                                <button className={styles.closeMapButton} onClick={closeMap}>✕ {t('closeMap')}</button>
                            </div>
                        )}

                        <div className={styles.infoGrid}>
                            <div className={styles.section}>
                                <div className={styles.sectionLabel}>{t('date')}</div>
                                <div className={styles.sectionValue}>{formatDate(advert.date)}</div>
                            </div>
                            <div className={styles.section}>
                                <div className={styles.sectionLabel}>{t('time')}</div>
                                <div className={styles.sectionValue}>{formatTime(advert.startTime)} - {formatTime(advert.endTime)}</div>
                            </div>
                            <div className={styles.section}>
                                <div className={styles.sectionLabel}>{t('participants')}</div>
                                <div className={styles.sectionValue}>{advert.participantsCount} / {advert.peopleCount}</div>
                            </div>
                            <div className={styles.section}>
                                <div className={styles.sectionLabel}>{t('cost')}</div>
                                <div className={styles.sectionValue}>{advert.cost} BYN</div>
                            </div>
                        </div>

                        {advert.description && (
                            <div className={styles.section}>
                                <div className={styles.sectionLabel}>{t('description')}</div>
                                <div className={styles.sectionValue}>{advert.description}</div>
                            </div>
                        )}
                    </div>

                    <div className={styles.footer}>
                        <div className={styles.buttonGroup}>
                            {showCreatorButton && (
                                <Button variant="outline" onClick={handleViewCreator}>
                                    <FaUser /> {t('viewCreator')}
                                </Button>
                            )}

                            {(isCreator || isAdmin) && (
                                <>
                                    <Button variant="outline" onClick={handleEditClick}>
                                        {t('edit')}
                                    </Button>
                                    <Button variant="danger" onClick={handleDeleteClick}>
                                        {t('delete')}
                                    </Button>
                                </>
                            )}
                        </div>

                        {showSubscribeSection && (
                            <button
                                className={`${styles.subscribeButton} ${getButtonClass()}`}
                                onClick={handleSubscribe}
                            >
                                {getButtonText()}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdvertDetailsPage;