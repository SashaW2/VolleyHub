import { useState, useCallback } from 'react';

export const useFilters = (initialFilters = {}) => {
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
    const [showFilters, setShowFilters] = useState(false);

    const updateFilter = useCallback((key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    }, []);

    const resetFilters = useCallback(() => {
        setFilters({
            street: '',
            date: '',
            startTime: '00:00',
            endTime: '23:59',
            levels: [],
            minPrice: '',
            maxPrice: '',
            useNearestLocations: false,
            userAddress: ''
        });
    }, []);

    const applyFilters = useCallback((newFilters) => {
        setFilters(newFilters);
        setShowFilters(false);
    }, []);

    return {
        filters,
        showFilters,
        setShowFilters,
        updateFilter,
        resetFilters,
        applyFilters
    };
};