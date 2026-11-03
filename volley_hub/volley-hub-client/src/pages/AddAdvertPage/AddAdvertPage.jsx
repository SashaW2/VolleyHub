import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import Button from '../../components/common/Button/Button';
import Input from '../../components/common/Input/Input';
import ToggleButton from '../../components/common/ToggleButton/ToggleButton';
import advertService from '../../services/advertService';
import styles from './AddAdvertPage.module.css';

const AddAdvertPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { t } = useLanguage();
    const { theme } = useTheme();
    const [searchParams] = useSearchParams();
    const editId = searchParams.get('edit');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [currentParticipantsCount, setCurrentParticipantsCount] = useState(0);
    const [formData, setFormData] = useState({
        address: '', date: '', startTime: '18:00', endTime: '20:00',
        gameLevel: 'D2', cost: '', peopleCount: '', description: ''
    });
    const levels = ['D1', 'D2', 'D3', 'D4', 'D4Plus'];

    const getGameLevelNumber = (level) => {
        const levelMap = {
            'D1': 1,
            'D2': 2,
            'D3': 3,
            'D4': 4,
            'D4Plus': 5
        };
        return levelMap[level] || 2;
    };

    useEffect(() => { if (editId) loadAdvert(editId); }, [editId]);

    const loadAdvert = async (id) => {
        try {
            const response = await advertService.getAdvertById(id);
            const advert = response.advert;

            setCurrentParticipantsCount(advert.participantsCount || 0);

            let formattedDate = advert.date;
            if (formattedDate && formattedDate.includes('T')) {
                formattedDate = formattedDate.split('T')[0];
            }

            let formattedStartTime = advert.startTime;
            let formattedEndTime = advert.endTime;

            if (formattedStartTime) {
                if (typeof formattedStartTime === 'string') {
                    if (formattedStartTime.includes('T')) {
                        const timePart = formattedStartTime.split('T')[1];
                        if (timePart) {
                            formattedStartTime = timePart.slice(0, 5);
                        }
                    } else {
                        formattedStartTime = formattedStartTime.slice(0, 5);
                    }
                } else if (formattedStartTime instanceof Date) {
                    const hours = formattedStartTime.getHours().toString().padStart(2, '0');
                    const minutes = formattedStartTime.getMinutes().toString().padStart(2, '0');
                    formattedStartTime = `${hours}:${minutes}`;
                }
            }

            if (formattedEndTime) {
                if (typeof formattedEndTime === 'string') {
                    if (formattedEndTime.includes('T')) {
                        const timePart = formattedEndTime.split('T')[1];
                        if (timePart) {
                            formattedEndTime = timePart.slice(0, 5);
                        }
                    } else {
                        formattedEndTime = formattedEndTime.slice(0, 5);
                    }
                } else if (formattedEndTime instanceof Date) {
                    const hours = formattedEndTime.getHours().toString().padStart(2, '0');
                    const minutes = formattedEndTime.getMinutes().toString().padStart(2, '0');
                    formattedEndTime = `${hours}:${minutes}`;
                }
            }

            let gameLevelStr = advert.gameLevel;
            const levelMap = {
                1: 'D1',
                2: 'D2',
                3: 'D3',
                4: 'D4',
                5: 'D4Plus'
            };
            if (typeof gameLevelStr === 'number') {
                gameLevelStr = levelMap[gameLevelStr] || 'D2';
            }

            setFormData({
                address: advert.address || '',
                date: formattedDate || '',
                startTime: formattedStartTime || '18:00',
                endTime: formattedEndTime || '20:00',
                gameLevel: gameLevelStr,
                cost: advert.cost || '',
                peopleCount: advert.peopleCount || '',
                description: advert.description || ''
            });
        } catch (err) {
            console.error('Load advert error:', err);
            setErrors({ general: t('loadError') });
        }
    };

    const validateAddressEmpty = (address) => {
        if (!address) return t('addressRequired');
        return '';
    };

    const validateDate = (date) => {
        if (!date) return t('dateRequired');

        const now = new Date();
        const todayStr = now.getFullYear() + '-' +
            String(now.getMonth() + 1).padStart(2, '0') + '-' +
            String(now.getDate()).padStart(2, '0');

        if (date < todayStr) {
            return t('datePast');
        }

        const [y, m, d] = date.split('-').map(Number);
        const selectedDate = new Date(y, m - 1, d);

        const maxDate = new Date();
        maxDate.setFullYear(maxDate.getFullYear() + 1);
        maxDate.setHours(0,0,0,0);

        if (selectedDate > maxDate) {
            return t('dateTooFar');
        }

        return '';
    };

    const validateTime = () => {
        const { startTime, endTime, date } = formData;
        if (!startTime || !endTime) return '';
        if (!date) return '';

        const start = startTime.split(':');
        const end = endTime.split(':');
        const startMinutes = parseInt(start[0]) * 60 + parseInt(start[1]);
        const endMinutes = parseInt(end[0]) * 60 + parseInt(end[1]);

        let duration;
        let isOvernight = false;

        if (endMinutes < startMinutes) {
            const overnightDuration = (endMinutes + 24 * 60) - startMinutes;

            if (overnightDuration > 180) {
                return t('endTimeBeforeStart');
            }

            isOvernight = true;
            duration = overnightDuration;
        } else if (endMinutes === startMinutes) {
            return t('startTimeEqualsEndTime');
        } else {
            duration = endMinutes - startMinutes;
        }

        if (duration < 60) {
            return t('durationMin');
        }
        if (duration > 180) {
            return t('durationMax');
        }

        if (!editId) {
            const now = new Date();
            const selectedDateTime = new Date(date);
            const [hours, minutes] = startTime.split(':');
            selectedDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

            if (isOvernight && selectedDateTime <= now) {
                selectedDateTime.setDate(selectedDateTime.getDate() + 1);
            }

            const threeHoursLater = new Date(now);
            threeHoursLater.setHours(now.getHours() + 3);

            const todayStr = now.toISOString().split('T')[0];
            const selectedDateStr = selectedDateTime.toISOString().split('T')[0];

            if (selectedDateStr === todayStr && selectedDateTime < threeHoursLater) {
                return t('timeTooSoon');
            }
        }

        return '';
    };

    const validateCost = (cost) => {
        if (cost === '' || cost === null || cost === undefined) return t('costRequired');
        const numValue = parseFloat(cost);
        if (isNaN(numValue)) return t('costInvalid');
        if (numValue < 0) return t('costNegative');
        if (numValue >= 100) return t('costMax');
        return '';
    };

    const validatePeopleCount = (count) => {
        if (count === '' || count === null || count === undefined) return t('peopleRequired');
        const numValue = parseInt(count, 10);
        if (isNaN(numValue)) return t('peopleInvalid');
        if (numValue < 2) return t('peopleMin');
        if (numValue > 50) return t('peopleMax');

        if (editId && numValue < currentParticipantsCount) {
            return t('peopleCountLessThanCurrent', { newValue: numValue, currentValue: currentParticipantsCount });
        }

        return '';
    };

    const validateGameLevel = (level) => {
        if (!level) return t('gameLevelRequired');
        return '';
    };

    const handleFieldChange = (name, value) => {
        setFormData({ ...formData, [name]: value });

        if (name === 'startTime' || name === 'endTime') {
            if (errors.startTime || errors.endTime) {
                setErrors(prev => ({ ...prev, startTime: '', endTime: '' }));
            }
        } else if (name === 'address') {
            const addressError = validateAddressEmpty(value);
            setErrors(prev => ({ ...prev, address: addressError }));
        } else if (name === 'date') {
            const dateError = validateDate(value);
            setErrors(prev => ({ ...prev, date: dateError }));
        } else if (name === 'cost') {
            const costError = validateCost(value);
            setErrors(prev => ({ ...prev, cost: costError }));
        } else if (name === 'peopleCount') {
            const peopleError = validatePeopleCount(value);
            setErrors(prev => ({ ...prev, peopleCount: peopleError }));
        } else if (name === 'gameLevel') {
            const levelError = validateGameLevel(value);
            setErrors(prev => ({ ...prev, gameLevel: levelError }));
        }
    };

    const handleCostChange = (e) => {
        let value = e.target.value;
        if (value === '' || value === '-') {
            handleFieldChange('cost', '');
            return;
        }
        let numValue = parseFloat(value);
        if (isNaN(numValue)) numValue = 0;
        if (numValue < 0) numValue = 0;
        if (numValue >= 100) numValue = 99.99;
        handleFieldChange('cost', numValue);
    };

    const handlePeopleCountChange = (e) => {
        let value = e.target.value;
        if (value === '') {
            handleFieldChange('peopleCount', '');
            return;
        }
        if (/^\d+$/.test(value)) {
            handleFieldChange('peopleCount', value);
        }
    };

    const validateForm = () => {
        let isValid = true;
        const newErrors = {};

        const addressError = validateAddressEmpty(formData.address);
        if (addressError) {
            newErrors.address = addressError;
            isValid = false;
        }

        const dateError = validateDate(formData.date);
        if (dateError) {
            newErrors.date = dateError;
            isValid = false;
        }

        const timeError = validateTime();
        if (timeError) {
            newErrors.startTime = timeError;
            newErrors.endTime = timeError;
            isValid = false;
        }

        const costError = validateCost(formData.cost);
        if (costError) {
            newErrors.cost = costError;
            isValid = false;
        }

        const peopleError = validatePeopleCount(formData.peopleCount);
        if (peopleError) {
            newErrors.peopleCount = peopleError;
            isValid = false;
        }

        const levelError = validateGameLevel(formData.gameLevel);
        if (levelError) {
            newErrors.gameLevel = levelError;
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const isValid = validateForm();
        if (!isValid) return;

        setLoading(true);
        setErrors({});

        try {
            const gameLevelNumber = getGameLevelNumber(formData.gameLevel);

            const formDataToSend = {
                address: formData.address,
                date: formData.date,
                startTime: formData.startTime + ':00',
                endTime: formData.endTime + ':00',
                gameLevel: gameLevelNumber,
                cost: parseFloat(formData.cost),
                peopleCount: parseInt(formData.peopleCount, 10),
                description: formData.description || null
            };

            let response;
            if (editId) {
                response = await advertService.updateAdvert(editId, formDataToSend);
            } else {
                response = await advertService.createAdvert(formDataToSend);
            }

            if (response && response.success === false) {
                if (response.errors && Array.isArray(response.errors)) {
                    const addressError = response.errors.find(err =>
                        err.toLowerCase().includes('адрес') ||
                        err.toLowerCase().includes('формат') ||
                        err.toLowerCase().includes('пример')
                    );

                    if (addressError) {
                        setErrors({ address: addressError });
                    } else {
                        setErrors({ general: response.errors.join(', ') });
                    }
                } else if (response.message) {
                    const errorMessage = response.message;
                    if (errorMessage === 'OVERLAPPING_ADVERT') {
                        setErrors({ general: t('overlappingAdvert') });
                    } else if (errorMessage.toLowerCase().includes('адрес') ||
                        errorMessage.toLowerCase().includes('формат')) {
                        setErrors({ address: errorMessage });
                    } else {
                        setErrors({ general: errorMessage });
                    }
                } else {
                    setErrors({ general: t('saveError') });
                }
            } else {
                navigate('/');
            }
        } catch (err) {
            console.error('Submit error:', err);

            if (err.message === 'OVERLAPPING_ADVERT') {
                setErrors({ general: t('overlappingAdvert') });
            } else if (err.errors && Array.isArray(err.errors)) {
                const addressError = err.errors.find(e =>
                    e.toLowerCase().includes('адрес') ||
                    e.toLowerCase().includes('формат')
                );
                if (addressError) {
                    setErrors({ address: addressError });
                } else {
                    setErrors({ general: err.errors.join(', ') });
                }
            } else if (err.message) {
                if (err.message.toLowerCase().includes('адрес') ||
                    err.message.toLowerCase().includes('формат')) {
                    setErrors({ address: err.message });
                } else {
                    setErrors({ general: err.message });
                }
            } else {
                setErrors({ general: t('saveError') });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.addAdvertPage} data-theme={theme}>
            <div className={styles.container}>
                <div className={styles.card}>
                    <h1 className={styles.title}>{editId ? t('editAdvert') : t('createAdvertTitle')}</h1>
                    {errors.general && <div className={styles.error}>{errors.general}</div>}

                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.fieldGroup}>
                            <Input
                                label={t('address')}
                                placeholder={t('addressPlaceholder')}
                                value={formData.address}
                                onChange={(e) => handleFieldChange('address', e.target.value)}
                                required
                            />
                            {errors.address && <span className={styles.fieldError}>{errors.address}</span>}
                        </div>

                        <div className={styles.fieldGroup}>
                            <Input
                                label={t('date')}
                                type="date"
                                value={formData.date}
                                onChange={(e) => handleFieldChange('date', e.target.value)}
                                required
                            />
                            {errors.date && <span className={styles.fieldError}>{errors.date}</span>}
                        </div>

                        <div className={styles.timeRow}>
                            <div className={styles.fieldGroup}>
                                <Input
                                    label={t('startTime')}
                                    type="time"
                                    value={formData.startTime}
                                    onChange={(e) => handleFieldChange('startTime', e.target.value)}
                                    required
                                />
                                {errors.startTime && <span className={styles.fieldError}>{errors.startTime}</span>}
                            </div>
                            <div className={styles.fieldGroup}>
                                <Input
                                    label={t('endTime')}
                                    type="time"
                                    value={formData.endTime}
                                    onChange={(e) => handleFieldChange('endTime', e.target.value)}
                                    required
                                />
                                {errors.endTime && <span className={styles.fieldError}>{errors.endTime}</span>}
                            </div>
                        </div>

                        <div className={styles.levelSection}>
                            <label className={styles.label}>{t('gameLevel')}</label>
                            <div className={styles.levelButtons}>
                                {levels.map(level => {
                                    const levelTooltips = {
                                        'D1': t('levelTooltipD1'),
                                        'D2': t('levelTooltipD2'),
                                        'D3': t('levelTooltipD3'),
                                        'D4': t('levelTooltipD4'),
                                        'D4Plus': t('levelTooltipD4Plus')
                                    };
                                    return (
                                        <ToggleButton
                                            key={level}
                                            label={level === 'D4Plus' ? 'D4+' : level}
                                            isActive={formData.gameLevel === level}
                                            onClick={() => handleFieldChange('gameLevel', level)}
                                            title={levelTooltips[level] || ''}
                                        />
                                    );
                                })}
                            </div>
                            {errors.gameLevel && <span className={styles.fieldError}>{errors.gameLevel}</span>}
                        </div>

                        <div className={styles.row}>
                            <div className={styles.fieldGroup}>
                                <Input
                                    label={t('cost')}
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="99.99"
                                    placeholder="25"
                                    value={formData.cost}
                                    onChange={handleCostChange}
                                    required
                                />
                                {errors.cost && <span className={styles.fieldError}>{errors.cost}</span>}
                            </div>
                            <div className={styles.fieldGroup}>
                                <Input
                                    label={t('peopleCount')}
                                    type="number"
                                    min="2"
                                    max="50"
                                    placeholder="12"
                                    value={formData.peopleCount}
                                    onChange={handlePeopleCountChange}
                                    required
                                />
                                {errors.peopleCount && <span className={styles.fieldError}>{errors.peopleCount}</span>}
                                {editId && currentParticipantsCount > 0 && (
                                    <div className={styles.infoMessage}>
                                        <span className={styles.infoIcon}>ℹ️</span>
                                        <span>{t('currentParticipants')}: {currentParticipantsCount}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <textarea
                            className={styles.textarea}
                            placeholder={t('descriptionPlaceholder')}
                            rows="4"
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                        />

                        <div className={styles.actions}>
                            <Button type="button" variant="outline" onClick={() => navigate(-1)}>{t('cancel')}</Button>
                            <Button type="submit" loading={loading}>{editId ? t('save') : t('create')}</Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddAdvertPage;