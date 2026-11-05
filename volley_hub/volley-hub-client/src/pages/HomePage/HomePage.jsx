import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaFilter, FaPlus, FaTimes } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useFilters } from '../../hooks/useFilters';
import { useCreatorModal } from '../../context/CreatorModalContext';
import Button from '../../components/common/Button/Button';
import Modal from '../../components/common/Modal/Modal';
import AdvertCard from '../../components/AdvertCard/AdvertCard';
import FilterSection from '../../components/FilterSection/FilterSection';
import advertService from '../../services/advertService';
import locationService from '../../services/locationService';
import styles from './HomePage.module.css';

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

const HomePage = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const { t } = useLanguage();
    const { theme } = useTheme();
    const { filters, showFilters, setShowFilters, applyFilters } = useFilters();
    const { openCreatorModal } = useCreatorModal();

    const [activeTab, setActiveTab] = useState('all');
    const [adverts, setAdverts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentFilters, setCurrentFilters] = useState(null);
    const [isInitialized, setIsInitialized] = useState(false);

    const [prevAuthState, setPrevAuthState] = useState(isAuthenticated);

    const [levelMismatchModal, setLevelMismatchModal] = useState({
        isOpen: false,
        message: '',
        onConfirm: null
    });

    const isAdminUser = user?.role === 'admin' || user?.isAdmin === true || user?.roleId === 2;

    const getEmptyFilters = () => ({
        street: '', date: '', startTime: '00:00', endTime: '23:59',
        levels: [], minPrice: '', maxPrice: '', useNearestLocations: false, userAddress: ''
    });

    const resetFilters = useCallback(() => {
        const emptyFilters = getEmptyFilters();
        setCurrentFilters(emptyFilters);
        applyFilters(emptyFilters);
        localStorage.setItem('homePageFilters', JSON.stringify(emptyFilters));
    }, [applyFilters]);

    useEffect(() => {
        if (prevAuthState === true && isAuthenticated === false) {
            resetFilters();
            setActiveTab('all');
        }
        setPrevAuthState(isAuthenticated);
    }, [isAuthenticated, prevAuthState, resetFilters]);

    useEffect(() => {
        const savedFilters = localStorage.getItem('homePageFilters');
        const savedTab = localStorage.getItem('homePageActiveTab');

        let initialFilters;

        if (savedFilters && isAuthenticated) {
            initialFilters = JSON.parse(savedFilters);
        } else {
            initialFilters = getEmptyFilters();
        }

        setCurrentFilters(initialFilters);
        applyFilters(initialFilters);

        if (savedTab && isAuthenticated) {
            setActiveTab(savedTab);
        } else {
            setActiveTab('all');
        }

        setIsInitialized(true);
    }, []);

    useEffect(() => {
        if (isInitialized && currentFilters !== null && isAuthenticated) {
            localStorage.setItem('homePageFilters', JSON.stringify(currentFilters));
        }
    }, [currentFilters, isInitialized, isAuthenticated]);

    useEffect(() => {
        if (isInitialized && isAuthenticated) {
            localStorage.setItem('homePageActiveTab', activeTab);
        }
    }, [activeTab, isInitialized, isAuthenticated]);

    const sortByDistance = async (advertsList, userAddress) => {
        if (!userAddress || advertsList.length === 0) return advertsList;

        try {
            const advertsWithDistance = await Promise.all(
                advertsList.map(async (advert) => {
                    const distance = await locationService.getDistanceBetweenAddresses(userAddress, advert.address);
                    return { ...advert, distance: distance || Infinity };
                })
            );
            return advertsWithDistance.sort((a, b) => a.distance - b.distance);
        } catch (error) {
            console.error('Error sorting by distance:', error);
            return advertsList;
        }
    };

    const applyFiltersToAdverts = (advertsList, filtersToApply) => {
        if (!filtersToApply) return advertsList;

        let filtered = [...advertsList];

        if (filtersToApply.street && filtersToApply.street.trim()) {
            filtered = filtered.filter(advert =>
                advert.address && advert.address.toLowerCase().includes(filtersToApply.street.toLowerCase())
            );
        }

        if (filtersToApply.date) {
            filtered = filtered.filter(advert => advert.date === filtersToApply.date);
        }

        if (filtersToApply.startTime && filtersToApply.startTime !== '00:00') {
            filtered = filtered.filter(advert => {
                if (!advert.startTime) return false;
                let timeStr = String(advert.startTime);
                if (timeStr.includes('T')) {
                    timeStr = timeStr.split('T')[1].substring(0, 5);
                } else if (timeStr.includes(':')) {
                    timeStr = timeStr.substring(0, 5);
                }
                return timeStr >= filtersToApply.startTime;
            });
        }

        if (filtersToApply.endTime && filtersToApply.endTime !== '23:59') {
            filtered = filtered.filter(advert => {
                if (!advert.endTime) return false;
                let timeStr = String(advert.endTime);
                if (timeStr.includes('T')) {
                    timeStr = timeStr.split('T')[1].substring(0, 5);
                } else if (timeStr.includes(':')) {
                    timeStr = timeStr.substring(0, 5);
                }
                return timeStr <= filtersToApply.endTime;
            });
        }

        if (filtersToApply.levels && filtersToApply.levels.length > 0) {
            filtered = filtered.filter(advert =>
                filtersToApply.levels.includes(advert.gameLevel)
            );
        }

        if (filtersToApply.minPrice && filtersToApply.minPrice !== '') {
            const minPrice = parseFloat(filtersToApply.minPrice);
            filtered = filtered.filter(advert => advert.cost >= minPrice);
        }
        if (filtersToApply.maxPrice && filtersToApply.maxPrice !== '') {
            const maxPrice = parseFloat(filtersToApply.maxPrice);
            filtered = filtered.filter(advert => advert.cost <= maxPrice);
        }

        return filtered;
    };

    const loadAdverts = useCallback(async (filtersToUse = null) => {
        setLoading(true);
        setError(null);
        try {
            if (!isInitialized || currentFilters === null) {
                setLoading(false);
                return;
            }

            const activeFilters = filtersToUse || currentFilters;
            const useNearestLocations = activeFilters.useNearestLocations && activeFilters.userAddress;

            let response;

            switch (activeTab) {
                case 'my':
                    if (!isAuthenticated) { setAdverts([]); setLoading(false); return; }
                    response = await advertService.getMyAdverts();
                    break;
                case 'participating':
                    if (!isAuthenticated) { setAdverts([]); setLoading(false); return; }
                    response = await advertService.getParticipatingAdverts();
                    break;
                default:
                    const apiFilters = useNearestLocations ? {
                        ...activeFilters,
                        useNearestLocations: true,
                        userAddress: activeFilters.userAddress
                    } : activeFilters;
                    response = await advertService.getAllAdverts(apiFilters);
                    if (response && response.adverts) {
                        setAdverts(response.adverts);
                        setLoading(false);
                        return;
                    }
            }

            let advertsData = response.adverts || [];

            if (activeTab === 'participating' && user) {
                const myAdvertsResponse = await advertService.getMyAdverts();
                const myAdverts = myAdvertsResponse.adverts || [];
                const myParticipatingAdverts = myAdverts.filter(advert => advert.isParticipating === true);
                const allParticipating = [...advertsData, ...myParticipatingAdverts];
                advertsData = allParticipating.filter((advert, index, self) =>
                    index === self.findIndex(a => a.id === advert.id)
                );
            }

            if (activeTab === 'my' || activeTab === 'participating') {
                advertsData = applyFiltersToAdverts(advertsData, activeFilters);
                if (activeTab === 'participating' && useNearestLocations && activeFilters.userAddress) {
                    advertsData = await sortByDistance(advertsData, activeFilters.userAddress);
                }
            }

            setAdverts(advertsData);
        } catch (err) {
            setError(err.message || t('loadingError'));
        } finally {
            setLoading(false);
        }
    }, [activeTab, isAuthenticated, t, user, currentFilters, isInitialized]);

    useEffect(() => {
        if (isInitialized && currentFilters !== null) {
            loadAdverts();
        }
    }, [loadAdverts, isInitialized, currentFilters, activeTab]);

    const handleApplyFilters = (newFilters) => {
        setCurrentFilters(newFilters);
        applyFilters(newFilters);
        if (isAuthenticated) {
            localStorage.setItem('homePageFilters', JSON.stringify(newFilters));
        }
        loadAdverts(newFilters);
    };

    const handleClearFilters = () => {
        const resetFiltersData = getEmptyFilters();
        setCurrentFilters(resetFiltersData);
        applyFilters(resetFiltersData);
        if (isAuthenticated) {
            localStorage.setItem('homePageFilters', JSON.stringify(resetFiltersData));
        } else {
            localStorage.removeItem('homePageFilters');
        }
        loadAdverts(resetFiltersData);
    };

    const handleRemoveSingleFilter = (key, value) => {
        if (!currentFilters) return;
        let updated = { ...currentFilters };

        if (key === 'levels') {
            updated.levels = updated.levels.filter(l => l !== value);
        } else if (key === 'timeRange') {
            updated.startTime = '00:00';
            updated.endTime = '23:59';
        } else if (key === 'priceRange') {
            updated.minPrice = '';
            updated.maxPrice = '';
        } else if (key === 'nearest') {
            updated.useNearestLocations = false;
            updated.userAddress = '';
        } else {
            updated[key] = '';
        }

        setCurrentFilters(updated);
        applyFilters(updated);
        if (isAuthenticated) {
            localStorage.setItem('homePageFilters', JSON.stringify(updated));
        }
        loadAdverts(updated);
    };

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
    };

    const closeLevelMismatchModal = () => {
        setLevelMismatchModal({ isOpen: false, message: '', onConfirm: null });
    };

    const checkLevelMismatchAndConfirm = (advert, onConfirm) => {
        const userPower = getLevelPower(user?.gameLevel);
        const advertPower = getLevelPower(advert?.gameLevel);

        if (userPower === null || advertPower === null || userPower === advertPower) {
            onConfirm();
            return;
        }

        const fromLabel = getLevelLabel(user?.gameLevel);
        const toLabel = getLevelLabel(advert?.gameLevel);
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

    const doSubscribe = async (advertId) => {
        try {
            await advertService.subscribeToAdvert(advertId);
            setAdverts(prevAdverts =>
                prevAdverts.map(advert => {
                    if (advert.id === advertId) {
                        return {
                            ...advert,
                            isParticipating: true,
                            participantsCount: (advert.participantsCount || 0) + 1,
                            isSubscribed: false
                        };
                    }
                    return advert;
                })
            );
        } catch (err) {
            alert(err.message);
        }
    };

    const doSubscribeToWaiting = async (advertId) => {
        try {
            await advertService.subscribeToWaitingList(advertId);
            setAdverts(prevAdverts =>
                prevAdverts.map(advert => {
                    if (advert.id === advertId) {
                        return {
                            ...advert,
                            isSubscribed: true
                        };
                    }
                    return advert;
                })
            );
        } catch (err) {
            alert(err.message);
        }
    };

    const handleSubscribe = (advertId) => {
        if (!isAuthenticated) { navigate('/login'); return; }
        const advert = adverts.find(a => a.id === advertId);
        if (!advert) return;
        checkLevelMismatchAndConfirm(advert, () => doSubscribe(advertId));
    };

    const handleUnsubscribe = async (advertId) => {
        if (!isAuthenticated) { navigate('/login'); return; }
        try {
            await advertService.unsubscribeFromAdvert(advertId);
            setAdverts(prevAdverts =>
                prevAdverts.map(advert => {
                    if (advert.id === advertId) {
                        return {
                            ...advert,
                            isParticipating: false,
                            participantsCount: Math.max((advert.participantsCount || 0) - 1, 0)
                        };
                    }
                    return advert;
                })
            );
        } catch (err) {
            alert(err.message);
        }
    };

    const handleSubscribeToWaiting = (advertId) => {
        if (!isAuthenticated) { navigate('/login'); return; }
        const advert = adverts.find(a => a.id === advertId);
        if (!advert) return;
        checkLevelMismatchAndConfirm(advert, () => doSubscribeToWaiting(advertId));
    };

    const handleUnsubscribeFromWaiting = async (advertId) => {
        if (!isAuthenticated) { navigate('/login'); return; }
        try {
            await advertService.unsubscribeFromWaitingList(advertId);
            setAdverts(prevAdverts =>
                prevAdverts.map(advert => {
                    if (advert.id === advertId) {
                        return {
                            ...advert,
                            isSubscribed: false
                        };
                    }
                    return advert;
                })
            );
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDelete = async (advertId) => {
        if (window.confirm(t('confirmDelete'))) {
            try {
                await advertService.deleteAdvert(advertId);
                await loadAdverts(currentFilters);
            } catch (err) {
                alert(err.message);
            }
        }
    };

    const handleEdit = (advertId) => navigate(`/add-advert?edit=${advertId}`);

    const getActiveFilterChips = () => {
        if (!currentFilters) return [];
        const chips = [];

        if (currentFilters.street && currentFilters.street.trim()) {
            chips.push({
                key: 'street',
                value: currentFilters.street,
                label: `${t('street')}: ${currentFilters.street}`
            });
        }

        if (currentFilters.date) {
            const dateObj = new Date(currentFilters.date);
            const formatted = dateObj.toLocaleDateString('ru-RU');
            chips.push({
                key: 'date',
                value: currentFilters.date,
                label: `${t('date')}: ${formatted}`
            });
        }

        const hasTimeFilter =
            (currentFilters.startTime && currentFilters.startTime !== '00:00') ||
            (currentFilters.endTime && currentFilters.endTime !== '23:59');
        if (hasTimeFilter) {
            chips.push({
                key: 'timeRange',
                value: 'timeRange',
                label: `${t('time')}: ${currentFilters.startTime} - ${currentFilters.endTime}`
            });
        }

        if (currentFilters.levels && currentFilters.levels.length > 0) {
            currentFilters.levels.forEach(level => {
                const levelLabel = level === 5 || level === 'D4Plus' ? 'D4+' : `D${level}`;
                chips.push({
                    key: 'levels',
                    value: level,
                    label: `${t('gameLevel')}: ${levelLabel}`
                });
            });
        }

        const hasPriceFilter =
            (currentFilters.minPrice !== '' && currentFilters.minPrice != null) ||
            (currentFilters.maxPrice !== '' && currentFilters.maxPrice != null);
        if (hasPriceFilter) {
            const min = currentFilters.minPrice !== '' ? currentFilters.minPrice : '0';
            const max = currentFilters.maxPrice !== '' ? currentFilters.maxPrice : '∞';
            chips.push({
                key: 'priceRange',
                value: 'priceRange',
                label: `${t('cost')}: ${min} - ${max} BYN`
            });
        }

        if (currentFilters.useNearestLocations && currentFilters.userAddress) {
            chips.push({
                key: 'nearest',
                value: 'nearest',
                label: `${t('nearestSites')}: ${currentFilters.userAddress}`
            });
        }

        return chips;
    };

    const activeChips = getActiveFilterChips();

    const tabs = [
        { id: 'all', label: t('allAdverts') },
        { id: 'my', label: t('myAdverts') },
        { id: 'participating', label: t('participating') }
    ];

    if (!isInitialized || currentFilters === null) {
        return (
            <div className={styles.homePage}>
                <div className={styles.loadingState}>
                    <div className={styles.spinner} />
                    <p>{t('loading')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.homePage}>
            <div className={styles.hero}>
                <div className={styles.heroContent}>
                    <h1 className={styles.heroTitle}>{t('findTeam')}</h1>
                    <p className={styles.heroSubtitle}>{t('joinGames')}</p>
                    {isAuthenticated && !isAdminUser && (
                        <Button size="large" icon={FaPlus} onClick={() => navigate('/add-advert')}>{t('createAdvert')}</Button>
                    )}
                    {!isAuthenticated && (
                        <Button size="large" onClick={() => navigate('/login')}>{t('login')}</Button>
                    )}
                </div>
            </div>

            <div className={styles.tabsSection}>
                <div className={styles.container}>
                    <div className={styles.tabsHeader}>
                        <div className={styles.tabs}>
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ''}`}
                                    onClick={() => handleTabChange(tab.id)}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                        <Button variant="outline" size="small" icon={FaFilter} onClick={() => setShowFilters(!showFilters)}>
                            {t('filters')}
                        </Button>
                    </div>

                    {activeChips.length > 0 && (
                        <div className={styles.activeFilters}>
                            <span className={styles.activeFiltersLabel}>{t('filters')}:</span>
                            <div className={styles.chipsList}>
                                {activeChips.map((chip, idx) => (
                                    <button
                                        key={`${chip.key}-${chip.value}-${idx}`}
                                        className={styles.filterChip}
                                        onClick={() => handleRemoveSingleFilter(chip.key, chip.value)}
                                        title="Удалить фильтр"
                                    >
                                        <span className={styles.chipLabel}>{chip.label}</span>
                                        <FaTimes className={styles.chipRemoveIcon} />
                                    </button>
                                ))}
                                <button
                                    className={styles.clearAllChips}
                                    onClick={handleClearFilters}
                                >
                                    {t('clear')}
                                </button>
                            </div>
                        </div>
                    )}

                    {showFilters && (
                        <FilterSection
                            onApplyFilters={handleApplyFilters}
                            initialFilters={currentFilters}
                            onClear={handleClearFilters}
                        />
                    )}

                    {loading ? (
                        <div className={styles.loadingState}>
                            <div className={styles.spinner} />
                            <p>{t('loading')}</p>
                        </div>
                    ) : error ? (
                        <div className={styles.errorState}>
                            <p>{error}</p>
                            <Button onClick={() => loadAdverts(currentFilters)}>{t('tryAgain')}</Button>
                        </div>
                    ) : adverts.length === 0 ? (
                        <div className={styles.emptyState}>
                            <p className={styles.emptyMessage}>{t('noAdverts')}</p>
                            {isAuthenticated && !isAdminUser && activeTab === 'all' && (
                                <Button onClick={() => navigate('/add-advert')}>{t('createFirst')}</Button>
                            )}
                        </div>
                    ) : (
                        <div className={styles.advertsGrid}>
                            {adverts.map((advert) => {
                                const isCreator = user && advert.userId === user.id;
                                const isParticipating = advert.isParticipating === true;
                                const isSubscribed = advert.isSubscribed === true;

                                return (
                                    <AdvertCard
                                        key={advert.id}
                                        advert={advert}
                                        isCreator={isCreator}
                                        isParticipating={isParticipating}
                                        isSubscribed={isSubscribed}
                                        isAdmin={isAdminUser}
                                        onSubscribe={() => handleSubscribe(advert.id)}
                                        onUnsubscribe={() => handleUnsubscribe(advert.id)}
                                        onSubscribeToWaiting={() => handleSubscribeToWaiting(advert.id)}
                                        onUnsubscribeFromWaiting={() => handleUnsubscribeFromWaiting(advert.id)}
                                        onEdit={() => handleEdit(advert.id)}
                                        onDelete={() => handleDelete(advert.id)}
                                        onViewCreator={() => openCreatorModal(advert.userId)}
                                        onClick={() => navigate(`/advert/${advert.id}`)}
                                    />
                                );
                            })}
                        </div>
                    )}
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

export default HomePage;