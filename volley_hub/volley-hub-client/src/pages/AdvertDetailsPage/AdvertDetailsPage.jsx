import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaUser } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useCreatorModal } from '../../context/CreatorModalContext';
import { useAdvertStream } from '../../context/AdvertStreamContext';
import Button from '../../components/common/Button/Button';
import Modal from '../../components/common/Modal/Modal';
import advertService from '../../services/advertService';
import locationService from '../../services/locationService';
import styles from './AdvertDetailsPage.module.css';

const getLevelPower = (level) => {
    if (level === null || level === undefined) return null;
    const map = { 1: 5, 2: 4, 3: 3, 4: 2, 5: 1, 'D1': 5, 'D2': 4, 'D3': 3, 'D4': 2, 'D4Plus': 1 };
    return map[level] ?? null;
};

const getLevelLabel = (level) => {
    if (level === null || level === undefined) return '';
    const map = { 1: 'D1', 2: 'D2', 3: 'D3', 4: 'D4', 5: 'D4+', 'D1': 'D1', 'D2': 'D2', 'D3': 'D3', 'D4': 'D4', 'D4Plus': 'D4+' };
    return map[level] || String(level);
};

const AdvertDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const { t } = useLanguage();
    const { theme } = useTheme();
    const { openCreatorModal } = useCreatorModal();
    const { lastEvent: advertsEvent } = useAdvertStream();
    const [advert, setAdvert] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showMap, setShowMap] = useState(false);
    const [mapLoading, setMapLoading] = useState(false);
    const [showParticipants, setShowParticipants] = useState(false);
    const [participants, setParticipants] = useState([]);
    const [participantsLoading, setParticipantsLoading] = useState(false);
    const [participantsError, setParticipantsError] = useState('');

    const [levelMismatchModal, setLevelMismatchModal] = useState({
        isOpen: false,
        message: '',
        onConfirm: null
    });

    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const placemarkRef = useRef(null);
    const mapAddressRef = useRef(null);
    const mapUpdateTokenRef = useRef(0);

    const isAdmin = user?.role === 'admin' || user?.isAdmin === true || user?.roleId === 2;

    useEffect(() => {
        loadAdvert();
        setShowParticipants(false);
        setParticipants([]);
        setParticipantsError('');
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.destroy();
            }
            mapInstanceRef.current = null;
            placemarkRef.current = null;
            mapAddressRef.current = null;
        };
    }, [id]);

    const loadAdvert = async ({ silent = false } = {}) => {
        try {
            const response = await advertService.getAdvertById(id);
            setAdvert(response.advert);
            if (silent) {
                setError('');
            }
        } catch (err) {
            if (!silent) {
                setError(t('loadError'));
            }
        } finally {
            if (!silent) {
                setLoading(false);
            }
        }
    };

    const reloadParticipants = async () => {
        try {
            const response = await advertService.getParticipants(id);
            setParticipants(response.participants || []);
            setParticipantsError('');
        } catch (err) {
            setParticipantsError(err.message || t('participantsListError'));
        }
    };

    useEffect(() => {
        if (!advertsEvent || loading) return;

        const isCurrentAdvert = advertsEvent.advertId == null || String(advertsEvent.advertId) === String(id);
        if (!isCurrentAdvert) return;

        if (advertsEvent.action === 'deleted') {
            navigate('/');
            return;
        }

        loadAdvert({ silent: true });
        if (showParticipants) {
            reloadParticipants();
        }
    }, [advertsEvent]);

    const loadYandexMaps = () => {
        return new Promise((resolve) => {
            if (window.ymaps) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            const apiKey = process.env.REACT_APP_YANDEX_MAPS_API_KEY;
            script.src = `https://api-maps.yandex.ru/2.1/?lang=ru_RU${apiKey ? `&apikey=${apiKey}` : ''}`;
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
            placemarkRef.current = placemark;
            mapAddressRef.current = address;
        }
    };

    const applyPlacemarkLocation = (lat, lon, address) => {
        const placemark = placemarkRef.current;
        const map = mapInstanceRef.current;
        if (!placemark || !map) return false;

        const coords = [lat, lon];
        let moved = false;

        if (placemark.geometry) {
            if (typeof placemark.geometry.setCoordinates === 'function') {
                placemark.geometry.setCoordinates(coords);
                moved = true;
            } else if (typeof placemark.geometry.set === 'function') {
                placemark.geometry.set(coords);
                moved = true;
            }
        }

        if (moved) {
            if (placemark.properties && typeof placemark.properties.set === 'function') {
                placemark.properties.set({
                    hintContent: address,
                    balloonContent: address
                });
            }
            return true;
        }

        // Если API не умеет перемещать геометрию — пересоздаём метку
        map.geoObjects.remove(placemark);
        const newPlacemark = new window.ymaps.Placemark(coords, {
            hintContent: address,
            balloonContent: address
        }, {
            preset: 'islands#redIcon',
            draggable: false
        });
        map.geoObjects.add(newPlacemark);
        placemarkRef.current = newPlacemark;
        return true;
    };

    const loadMap = async () => {
        const address = advert?.address;
        if (!address) return;
        if (showMap && mapInstanceRef.current) return;

        setMapLoading(true);
        setShowMap(true);

        try {
            const coords = await locationService.getAddressCoordinates(address);
            if (coords) {
                await loadYandexMaps();
                setTimeout(() => {
                    initMap(coords.lat, coords.lon, address);
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

    useEffect(() => {
        if (!showMap) return;

        const address = advert?.address;
        const map = mapInstanceRef.current;
        if (!address || !map || mapAddressRef.current === address) return;

        const token = ++mapUpdateTokenRef.current;
        let cancelled = false;

        const syncMapLocation = async () => {
            try {
                const coords = await locationService.getAddressCoordinates(address);
                if (cancelled || token !== mapUpdateTokenRef.current || !coords) return;

                const currentMap = mapInstanceRef.current;
                if (!currentMap) return;

                applyPlacemarkLocation(coords.lat, coords.lon, address);

                currentMap.setCenter([coords.lat, coords.lon], 16, { duration: 300 });
                mapAddressRef.current = address;
            } catch (err) {
                console.error('Error updating map location:', err);
            }
        };

        syncMapLocation();

        return () => {
            cancelled = true;
        };
    }, [showMap, advert?.address]);

    const toggleParticipants = async () => {
        if (showParticipants) {
            setShowParticipants(false);
            return;
        }

        setShowParticipants(true);
        setParticipantsLoading(true);
        setParticipantsError('');

        try {
            const response = await advertService.getParticipants(id);
            setParticipants(response.participants || []);
        } catch (err) {
            setParticipantsError(err.message || t('participantsListError'));
        } finally {
            setParticipantsLoading(false);
        }
    };

    const closeMap = () => {
        if (mapInstanceRef.current) {
            mapInstanceRef.current.destroy();
            mapInstanceRef.current = null;
        }
        placemarkRef.current = null;
        mapAddressRef.current = null;
        mapUpdateTokenRef.current += 1;
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

    const closeLevelMismatchModal = () => {
        setLevelMismatchModal({ isOpen: false, message: '', onConfirm: null });
    };

    const checkLevelMismatchAndConfirm = (targetAdvert, onConfirm) => {
        const userPower = getLevelPower(user?.gameLevel);
        const advertPower = getLevelPower(targetAdvert?.gameLevel);

        if (userPower === null || advertPower === null || userPower === advertPower) {
            onConfirm();
            return;
        }

        const fromLabel = getLevelLabel(user?.gameLevel);
        const toLabel = getLevelLabel(targetAdvert?.gameLevel);
        const key = advertPower > userPower ? 'levelMismatchHigher' : 'levelMismatchLower';
        const message = t(key).replace('{from}', fromLabel).replace('{to}', toLabel);

        setLevelMismatchModal({
            isOpen: true,
            message,
            onConfirm: () => {
                closeLevelMismatchModal();
                onConfirm();
            }
        });
    };

    const doSubscribeAction = async () => {
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

    const handleSubscribe = () => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        const isCurrentlyParticipating = advert?.isParticipating === true;
        const isCurrentlySubscribed = advert?.isSubscribed === true;
        const isFull = advert && advert.participantsCount >= advert.peopleCount;

        const willSubscribe = !isCurrentlyParticipating && (
            isCurrentlySubscribed || isFull || (!isFull && !isCurrentlySubscribed)
        );

        const isNewSubscription = !isCurrentlyParticipating && !isCurrentlySubscribed;

        if (isNewSubscription && advert) {
            checkLevelMismatchAndConfirm(advert, doSubscribeAction);
            return;
        }

        doSubscribeAction();
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
                            <div className={styles.locationActions}>
                                <button className={styles.mapButton} onClick={loadMap}>
                                    {t('map')}
                                </button>
                                {(isCreator || isAdmin) && (
                                    <button className={styles.participantsButton} onClick={toggleParticipants}>
                                        {t('participantsListButton')}
                                    </button>
                                )}
                            </div>
                        </div>

                        {showMap && (
                            <div className={styles.mapContainer}>
                                {mapLoading && <div className={styles.mapLoading}>{t('loadingMap')}</div>}
                                <div ref={mapRef} className={styles.map} style={{ display: mapLoading ? 'none' : 'block' }}></div>
                                <button className={styles.closeMapButton} onClick={closeMap}>✕ {t('closeMap')}</button>
                            </div>
                        )}

                        {showParticipants && (isCreator || isAdmin) && (
                            <div className={styles.participantsPanel}>
                                <div className={styles.participantsHeader}>
                                    <span>{t('participants')} ({participants.length})</span>
                                    <button className={styles.participantsClose} onClick={() => setShowParticipants(false)}>✕</button>
                                </div>
                                {participantsLoading && (
                                    <div className={styles.participantsEmpty}>{t('loading')}</div>
                                )}
                                {!participantsLoading && participantsError && (
                                    <div className={styles.participantsError}>{participantsError}</div>
                                )}
                                {!participantsLoading && !participantsError && participants.length === 0 && (
                                    <div className={styles.participantsEmpty}>{t('participantsListEmpty')}</div>
                                )}
                                {!participantsLoading && !participantsError && participants.length > 0 && (
                                    <ul className={styles.participantsList}>
                                        {participants.map((participant) => (
                                            <li key={participant.id} className={styles.participantItem}>
                                                <div className={styles.participantAvatar}>
                                                    {(participant.name || '?').trim().charAt(0).toUpperCase()}
                                                </div>
                                                <div className={styles.participantInfo}>
                                                    <div className={styles.participantName}>{participant.name}</div>
                                                    <div className={styles.participantEmail}>{participant.email}</div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
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

            <Modal
                isOpen={levelMismatchModal.isOpen}
                onClose={closeLevelMismatchModal}
                title={t('levelMismatchTitle')}
                size="small"
            >
                <p style={{ marginBottom: '1.5rem', lineHeight: 1.5 }}>{levelMismatchModal.message}</p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                    <Button variant="outline" onClick={closeLevelMismatchModal}>
                        {t('levelMismatchCancel')}
                    </Button>
                    <Button onClick={() => levelMismatchModal.onConfirm && levelMismatchModal.onConfirm()}>
                        {t('levelMismatchConfirm')}
                    </Button>
                </div>
            </Modal>
        </div>
    );
};

export default AdvertDetailsPage;