import React, { useState, useEffect, useRef } from 'react';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import Button from '../common/Button/Button';
import Input from '../common/Input/Input';
import ToggleButton from '../common/ToggleButton/ToggleButton';
import advertService from '../../services/advertService';
import styles from './FilterSection.module.css';

const FilterSection = ({ onApplyFilters, initialFilters = {}, onClear }) => {
    const { t } = useLanguage();

    const [expandedSections, setExpandedSections] = useState({
        street: true, date: true, time: true, level: true, price: true, location: true
    });

    const [filters, setFilters] = useState({
        street: initialFilters.street || '',
        date: initialFilters.date || '',
        startTime: initialFilters.startTime || '00:00',
        endTime: initialFilters.endTime || '23:59',
        levels: Array.isArray(initialFilters.levels) ? initialFilters.levels : [],
        minPrice: initialFilters.minPrice || '',
        maxPrice: initialFilters.maxPrice || '',
        useNearestLocations: initialFilters.useNearestLocations || false,
        userAddress: initialFilters.userAddress || ''
    });

    const [addressError, setAddressError] = useState('');
    const [streetSuggestions, setStreetSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [allStreets, setAllStreets] = useState([]);
    const wrapperRef = useRef(null);

    const levels = [
        { label: 'D1', value: 1 },
        { label: 'D2', value: 2 },
        { label: 'D3', value: 3 },
        { label: 'D4', value: 4 },
        { label: 'D4+', value: 5 }
    ];

    const levelTooltips = {
        1: t('levelTooltipD1'),
        2: t('levelTooltipD2'),
        3: t('levelTooltipD3'),
        4: t('levelTooltipD4'),
        5: t('levelTooltipD4Plus')
    };

    const extractStreetName = (fullAddress) => {
        let street = fullAddress.replace(/,\s*\d+.*$/, '');
        street = street.replace(/\s+\d+.*$/, '');
        street = street.replace(/^\d+\s+/, '');
        street = street.trim();

        street = street.replace(/^(улица|ул\.|проспект|пр\.|переулок|пер\.)\s+/i, '');
        street = street.replace(/\s+(улица|ул\.|проспект|пр\.|переулок|пер\.)$/i, '');

        return street;
    };

    useEffect(() => {
        loadUniqueStreets();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const loadUniqueStreets = async () => {
        try {
            const response = await advertService.getAllAdverts();
            const adverts = response.adverts || [];
            const now = new Date();
            const todayStr = now.toISOString().split('T')[0];

            const futureAdverts = adverts.filter(advert => {
                if (!advert || !advert.date) return false;
                let advertDateStr = advert.date;
                if (advertDateStr instanceof Date) {
                    advertDateStr = advertDateStr.toISOString().split('T')[0];
                } else {
                    advertDateStr = String(advertDateStr).split('T')[0];
                }
                return advertDateStr >= todayStr;
            });

            const uniqueStreets = [...new Set(futureAdverts.map(advert => extractStreetName(advert.address)))];
            uniqueStreets.sort();
            setAllStreets(uniqueStreets);
        } catch (error) {
            console.error('Error loading streets:', error);
        }
    };

    const filterStreets = (query) => {
        if (!query.trim()) {
            setStreetSuggestions(allStreets.slice(0, 15));
            return;
        }
        const filtered = allStreets.filter(street =>
            street.toLowerCase().includes(query.toLowerCase())
        );
        setStreetSuggestions(filtered.slice(0, 15));
    };

    const handleStreetChange = (value) => {
        setFilters({ ...filters, street: value });
        filterStreets(value);
    };

    const handleStreetFocus = () => {
        filterStreets(filters.street);
        setShowSuggestions(true);
    };

    const handleSelectStreet = (street) => {
        setFilters({ ...filters, street: street });
        setShowSuggestions(false);
    };

    useEffect(() => {
        setFilters({
            street: initialFilters.street || '',
            date: initialFilters.date || '',
            startTime: initialFilters.startTime || '00:00',
            endTime: initialFilters.endTime || '23:59',
            levels: Array.isArray(initialFilters.levels) ? initialFilters.levels : [],
            minPrice: initialFilters.minPrice || '',
            maxPrice: initialFilters.maxPrice || '',
            useNearestLocations: initialFilters.useNearestLocations || false,
            userAddress: initialFilters.userAddress || ''
        });
    }, [initialFilters]);

    const toggleSection = (section) => {
        setExpandedSections({ ...expandedSections, [section]: !expandedSections[section] });
    };

    const toggleLevel = (levelValue) => {
        const currentLevels = Array.isArray(filters.levels) ? filters.levels : [];
        if (currentLevels.includes(levelValue)) {
            setFilters({ ...filters, levels: currentLevels.filter(l => l !== levelValue) });
        } else {
            setFilters({ ...filters, levels: [...currentLevels, levelValue] });
        }
    };

    const handleApply = () => {
        if (filters.useNearestLocations && !filters.userAddress.trim()) {
            setAddressError(t('addressRequired'));
            return;
        }
        setAddressError('');

        const filtersToSend = {
            ...filters,
            levels: Array.isArray(filters.levels) ? filters.levels : []
        };
        onApplyFilters(filtersToSend);
    };

    const handleClear = () => {
        const resetFilters = {
            street: '', date: '', startTime: '00:00', endTime: '23:59',
            levels: [], minPrice: '', maxPrice: '', useNearestLocations: false, userAddress: ''
        };
        setFilters(resetFilters);
        setAddressError('');
        if (onClear) {
            onClear();
        } else {
            onApplyFilters(resetFilters);
        }
    };

    const handleNearestToggle = () => {
        setFilters({ ...filters, useNearestLocations: !filters.useNearestLocations });
        setAddressError('');
    };

    return (
        <div className={styles.filterSection}>
            <div className={styles.filterGroup}>
                <div className={styles.filterHeader} onClick={() => toggleSection('street')}>
                    <h3 className={styles.filterTitle}>{t('street')}</h3>
                    {expandedSections.street ? <FaChevronUp /> : <FaChevronDown />}
                </div>
                {expandedSections.street && (
                    <div className={styles.filterContent}>
                        <div className={styles.autocompleteWrapper} ref={wrapperRef}>
                            <Input
                                placeholder={t('streetPlaceholder')}
                                value={filters.street}
                                onChange={(e) => handleStreetChange(e.target.value)}
                                onFocus={handleStreetFocus}
                            />
                            {showSuggestions && streetSuggestions.length > 0 && (
                                <ul className={styles.suggestionsList}>
                                    {streetSuggestions.map((street, index) => (
                                        <li
                                            key={index}
                                            className={styles.suggestionItem}
                                            onClick={() => handleSelectStreet(street)}
                                        >
                                            {street}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className={styles.filterGroup}>
                <div className={styles.filterHeader} onClick={() => toggleSection('date')}>
                    <h3 className={styles.filterTitle}>{t('date')}</h3>
                    {expandedSections.date ? <FaChevronUp /> : <FaChevronDown />}
                </div>
                {expandedSections.date && (
                    <div className={styles.filterContent}>
                        <input type="date" className={styles.dateInput} value={filters.date} onChange={(e) => setFilters({...filters, date: e.target.value})} />
                    </div>
                )}
            </div>

            <div className={styles.filterGroup}>
                <div className={styles.filterHeader} onClick={() => toggleSection('time')}>
                    <h3 className={styles.filterTitle}>{t('timeRange')}</h3>
                    {expandedSections.time ? <FaChevronUp /> : <FaChevronDown />}
                </div>
                {expandedSections.time && (
                    <div className={styles.filterContent}>
                        <div className={styles.timeRange}>
                            <input type="time" className={styles.timeInput} value={filters.startTime} onChange={(e) => setFilters({...filters, startTime: e.target.value})} />
                            <span className={styles.timeSeparator}>-</span>
                            <input type="time" className={styles.timeInput} value={filters.endTime} onChange={(e) => setFilters({...filters, endTime: e.target.value})} />
                        </div>
                    </div>
                )}
            </div>

            <div className={styles.filterGroup}>
                <div className={styles.filterHeader} onClick={() => toggleSection('level')}>
                    <h3 className={styles.filterTitle}>{t('gameLevel')}</h3>
                    {expandedSections.level ? <FaChevronUp /> : <FaChevronDown />}
                </div>
                {expandedSections.level && (
                    <div className={styles.filterContent}>
                        <div className={styles.levelButtons}>
                            {levels.map(level => (
                                <ToggleButton
                                    key={level.value}
                                    label={level.label}
                                    isActive={Array.isArray(filters.levels) && filters.levels.includes(level.value)}
                                    onClick={() => toggleLevel(level.value)}
                                    title={levelTooltips[level.value] || ''}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className={styles.filterGroup}>
                <div className={styles.filterHeader} onClick={() => toggleSection('price')}>
                    <h3 className={styles.filterTitle}>{t('cost')}</h3>
                    {expandedSections.price ? <FaChevronUp /> : <FaChevronDown />}
                </div>
                {expandedSections.price && (
                    <div className={styles.filterContent}>
                        <div className={styles.priceRange}>
                            <input type="number" className={styles.priceInput} placeholder={t('minPrice')} value={filters.minPrice} onChange={(e) => setFilters({...filters, minPrice: e.target.value})} />
                            <span className={styles.priceSeparator}>-</span>
                            <input type="number" className={styles.priceInput} placeholder={t('maxPrice')} value={filters.maxPrice} onChange={(e) => setFilters({...filters, maxPrice: e.target.value})} />
                        </div>
                    </div>
                )}
            </div>

            <div className={styles.filterGroup}>
                <div className={styles.filterHeader} onClick={() => toggleSection('location')}>
                    <h3 className={styles.filterTitle}>{t('siteLocation')}</h3>
                    {expandedSections.location ? <FaChevronUp /> : <FaChevronDown />}
                </div>
                {expandedSections.location && (
                    <div className={styles.filterContent}>
                        <ToggleButton
                            label={t('nearestSites')}
                            isActive={filters.useNearestLocations}
                            onClick={handleNearestToggle}
                        />
                        {filters.useNearestLocations && (
                            <div className={styles.addressInput}>
                                <Input
                                    placeholder={t('yourAddress')}
                                    value={filters.userAddress}
                                    onChange={(e) => {
                                        setFilters({...filters, userAddress: e.target.value});
                                        setAddressError('');
                                    }}
                                    style={{ marginTop: '1rem' }}
                                />
                                {addressError && <span className={styles.addressError}>{addressError}</span>}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className={styles.filterActions}>
                <Button variant="outline" size="small" onClick={handleClear}>{t('clear')}</Button>
                <Button size="small" onClick={handleApply}>{t('apply')}</Button>
            </div>
        </div>
    );
};

export default FilterSection;