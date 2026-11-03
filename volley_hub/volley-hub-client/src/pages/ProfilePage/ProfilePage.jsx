import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import Button from '../../components/common/Button/Button';
import Input from '../../components/common/Input/Input';
import PhoneInput from '../../components/common/PhoneInput/PhoneInput';
import PasswordInput from '../../components/common/PasswordInput/PasswordInput';
import ToggleButton from '../../components/common/ToggleButton/ToggleButton';
import styles from './ProfilePage.module.css';

const ProfilePage = () => {
    const { user, updateProfile, changePassword, deleteAccount, logout } = useAuth();
    const { t, changeLanguage, language } = useLanguage();
    const { theme, changeTheme } = useTheme();

    const getLevelFromNumber = (levelNum) => {
        if (levelNum === null || levelNum === undefined) return 'D2';

        const levelMap = {
            1: 'D1',
            2: 'D2',
            3: 'D3',
            4: 'D4',
            5: 'D4Plus'
        };

        if (typeof levelNum === 'string') {
            if (levelNum in levelMap || ['D1', 'D2', 'D3', 'D4', 'D4Plus'].includes(levelNum)) {
                return levelNum;
            }
            const num = parseInt(levelNum, 10);
            if (!isNaN(num) && levelMap[num]) return levelMap[num];
            return 'D2';
        }

        return levelMap[levelNum] || 'D2';
    };

    const getLevelNumber = (levelStr) => {
        if (levelStr === null || levelStr === undefined) return 2;

        const levelMap = {
            'D1': 1,
            'D2': 2,
            'D3': 3,
            'D4': 4,
            'D4Plus': 5
        };

        if (typeof levelStr === 'number') {
            return levelStr;
        }

        return levelMap[levelStr] || 2;
    };

    const generateRandomPassword = () => {
        const uppercaseLatin = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const lowercaseLatin = 'abcdefghijklmnopqrstuvwxyz';
        const uppercaseCyrillic = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';
        const lowercaseCyrillic = 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя';
        const numbers = '0123456789';
        const special = '!@#$%^&*';

        let password = '';
        password += uppercaseLatin[Math.floor(Math.random() * uppercaseLatin.length)];
        password += lowercaseLatin[Math.floor(Math.random() * lowercaseLatin.length)];
        password += uppercaseCyrillic[Math.floor(Math.random() * uppercaseCyrillic.length)];
        password += lowercaseCyrillic[Math.floor(Math.random() * lowercaseCyrillic.length)];
        password += numbers[Math.floor(Math.random() * numbers.length)];
        password += special[Math.floor(Math.random() * special.length)];

        const all = uppercaseLatin + lowercaseLatin + uppercaseCyrillic + lowercaseCyrillic + numbers + special;
        for (let i = password.length; i < 14; i++) {
            password += all[Math.floor(Math.random() * all.length)];
        }

        password = password.split('').sort(() => Math.random() - 0.5).join('');
        return password;
    };

    const [profile, setProfile] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        gameLevel: getLevelFromNumber(user?.gameLevel) || 'D2',
        language: user?.language || 'ru',
        theme: user?.theme || 'light'
    });
    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
    const [profileErrors, setProfileErrors] = useState({});
    const [passwordErrors, setPasswordErrors] = useState([]);
    const [passwordStrength, setPasswordStrength] = useState({ valid: false, errors: [] });
    const [loading, setLoading] = useState(false);
    const [loadingPassword, setLoadingPassword] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const levels = ['D1', 'D2', 'D3', 'D4', 'D4Plus'];

    // Функции валидации с использованием t
    const validateName = useCallback((name) => {
        if (!name) return t('nameRequired');
        if (name.length < 2) return t('nameMinLength');
        if (name.length > 100) return t('nameMaxLength');
        const nameRegex = /^[A-Za-zА-Яа-я\s]+$/;
        if (!nameRegex.test(name)) return t('nameInvalid');
        return '';
    }, [t]);

    const validateEmail = useCallback((email) => {
        if (!email) return t('emailRequired');
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return t('emailInvalid');
        return '';
    }, [t]);

    const validatePhone = useCallback((phone) => {
        if (!phone) return '';
        const phoneRegex = /^\+375 \d{2} \d{3}-\d{2}-\d{2}$/;
        if (!phoneRegex.test(phone)) return t('phoneInvalid');
        const digits = phone.replace(/\D/g, '');
        if (digits.length !== 12) return t('phoneInvalid');
        return '';
    }, [t]);

    const validateGameLevel = useCallback((level) => {
        if (!level) return t('gameLevelRequired');
        return '';
    }, [t]);

    const validatePasswordStrength = useCallback((password) => {
        const errorsList = [];
        if (password.length < 8) errorsList.push(t('passwordMinLength'));
        const hasUpperLatin = /[A-Z]/.test(password);
        const hasUpperCyrillic = /[А-ЯЁ]/.test(password);
        if (!hasUpperLatin && !hasUpperCyrillic) errorsList.push(t('passwordUpperRequired'));
        const hasLowerLatin = /[a-z]/.test(password);
        const hasLowerCyrillic = /[а-яё]/.test(password);
        if (!hasLowerLatin && !hasLowerCyrillic) errorsList.push(t('passwordLowerRequired'));
        if (!/[0-9]/.test(password)) errorsList.push(t('passwordDigitRequired'));
        if (!/[!@#$%^&*]/.test(password)) errorsList.push(t('passwordSpecialRequired'));
        return errorsList;
    }, [t]);

    const validateCurrentPassword = useCallback((password) => {
        if (!password) return t('currentPasswordRequired');
        return '';
    }, [t]);

    // Пересчет ошибок при смене языка
    useEffect(() => {
        // Обновляем ошибки профиля
        const newProfileErrors = {
            name: validateName(profile.name),
            email: validateEmail(profile.email),
            phone: validatePhone(profile.phone),
            gameLevel: validateGameLevel(profile.gameLevel)
        };
        setProfileErrors(newProfileErrors);

        // Обновляем ошибки пароля
        const errors = validatePasswordStrength(passwords.new);
        setPasswordStrength({ valid: errors.length === 0, errors });
        if (passwords.confirm && passwords.new !== passwords.confirm) {
            setPasswordErrors([t('passwordsDoNotMatch')]);
        }
    }, [language, t, profile.name, profile.email, profile.phone, profile.gameLevel, passwords.new, passwords.confirm, validateName, validateEmail, validatePhone, validateGameLevel, validatePasswordStrength]);

    const handleGeneratePassword = () => {
        const newPassword = generateRandomPassword();
        setPasswords({ ...passwords, new: newPassword, confirm: newPassword });
        const errors = validatePasswordStrength(newPassword);
        setPasswordStrength({ valid: errors.length === 0, errors });
        setPasswordErrors([]);
    };

    const validateProfileForm = () => {
        const newErrors = {
            name: validateName(profile.name),
            email: validateEmail(profile.email),
            phone: validatePhone(profile.phone),
            gameLevel: validateGameLevel(profile.gameLevel)
        };
        setProfileErrors(newErrors);
        return Object.values(newErrors).every(error => error === '');
    };

    const validatePasswordForm = () => {
        const currentError = validateCurrentPassword(passwords.current);
        if (currentError) {
            setPasswordErrors([currentError]);
            return false;
        }
        if (!passwordStrength.valid) {
            setPasswordErrors(passwordStrength.errors);
            return false;
        }
        if (passwords.new !== passwords.confirm) {
            setPasswordErrors([t('passwordsDoNotMatch')]);
            return false;
        }
        return true;
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        if (!validateProfileForm()) return;
        setLoading(true);
        try {
            const profileToSend = {
                ...profile,
                gameLevel: getLevelNumber(profile.gameLevel)
            };
            await updateProfile(profileToSend);

            changeLanguage(profile.language);
            changeTheme(profile.theme);

            setMessage({ text: t('profileUpdated'), type: 'success' });
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        } catch (err) {
            if (err.message?.toLowerCase().includes('email')) {
                setProfileErrors({ ...profileErrors, email: t('emailExists') });
                setMessage({ text: '', type: '' });
            } else {
                setMessage({ text: err.message || t('updateError'), type: 'error' });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (!validatePasswordForm()) return;
        setLoadingPassword(true);
        try {
            await changePassword({ currentPassword: passwords.current, newPassword: passwords.new });
            setMessage({ text: t('passwordChanged'), type: 'success' });
            setPasswords({ current: '', new: '', confirm: '' });
            setPasswordStrength({ valid: false, errors: [] });
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        } catch (err) {
            setMessage({ text: err.message || t('updateError'), type: 'error' });
        } finally {
            setLoadingPassword(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (window.confirm(t('confirmDeleteAccount'))) {
            await deleteAccount();
        }
    };

    const handleFieldChange = (field, value) => {
        setProfile({ ...profile, [field]: value });
        let error = '';
        if (field === 'name') error = validateName(value);
        if (field === 'email') error = validateEmail(value);
        if (field === 'phone') error = validatePhone(value);
        if (field === 'gameLevel') error = validateGameLevel(value);
        setProfileErrors({ ...profileErrors, [field]: error });
        if (message.text) setMessage({ text: '', type: '' });

        if (field === 'language') {
            changeLanguage(value);
        }
        if (field === 'theme') {
            changeTheme(value);
        }
    };

    const handlePhoneChange = (e) => {
        const value = e.target.value;
        setProfile({ ...profile, phone: value });
        const error = validatePhone(value);
        setProfileErrors({ ...profileErrors, phone: error });
    };

    const handleLanguageChange = (lang) => {
        setProfile({ ...profile, language: lang });
        changeLanguage(lang);
        if (message.text) setMessage({ text: '', type: '' });
    };

    const handleThemeChange = (newTheme) => {
        setProfile({ ...profile, theme: newTheme });
        changeTheme(newTheme);
        if (message.text) setMessage({ text: '', type: '' });
    };

    const getGameLevelDisplay = (level) => {
        return level === 'D4Plus' ? 'D4+' : level;
    };

    return (
        <div className={styles.profilePage}>
            <div className={styles.container}>
                <div className={styles.profileCard}>
                    <div className={styles.header}>
                        <h1 className={styles.title}>{t('personalAccount')}</h1>
                    </div>
                    <div className={styles.content}>
                        {message.text && <div className={`${styles.message} ${styles[message.type]}`}>{message.text}</div>}

                        <form onSubmit={handleSaveProfile} className={styles.form}>
                            <div className={styles.fieldGroup}>
                                <Input
                                    label={t('name')}
                                    value={profile.name}
                                    onChange={(e) => handleFieldChange('name', e.target.value)}
                                    required
                                />
                                {profileErrors.name && <span className={styles.fieldError}>{profileErrors.name}</span>}
                            </div>

                            <div className={styles.fieldGroup}>
                                <Input
                                    label={t('email')}
                                    type="email"
                                    value={profile.email}
                                    onChange={(e) => handleFieldChange('email', e.target.value)}
                                    required
                                />
                                {profileErrors.email && <span className={styles.fieldError}>{profileErrors.email}</span>}
                            </div>

                            <div className={styles.fieldGroup}>
                                <PhoneInput
                                    label={t('phone')}
                                    value={profile.phone}
                                    onChange={handlePhoneChange}
                                    error={profileErrors.phone}
                                />
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
                                                label={getGameLevelDisplay(level)}
                                                isActive={profile.gameLevel === level}
                                                onClick={() => handleFieldChange('gameLevel', level)}
                                                title={levelTooltips[level] || ''}
                                            />
                                        );
                                    })}
                                </div>
                                {profileErrors.gameLevel && <span className={styles.fieldError}>{profileErrors.gameLevel}</span>}
                            </div>

                            <Button type="submit" fullWidth loading={loading}>{t('saveChanges')}</Button>
                        </form>

                        <form onSubmit={handleChangePassword} className={styles.passwordForm}>
                            <div className={styles.passwordHeader}>
                                <h3 className={styles.sectionTitle}>{t('changePassword')}</h3>
                                <button type="button" className={styles.generateButton} onClick={handleGeneratePassword}>
                                    {t('generatePassword')}
                                </button>
                            </div>

                            <div className={styles.fieldGroup}>
                                <PasswordInput
                                    label={t('currentPassword')}
                                    value={passwords.current}
                                    onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                                    required
                                />
                            </div>

                            <div className={styles.fieldGroup}>
                                <PasswordInput
                                    label={t('newPassword')}
                                    value={passwords.new}
                                    onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                                    required
                                />
                                {passwords.new && passwordStrength.errors.length > 0 && (
                                    <div className={styles.passwordHintError}>
                                        {t('passwordRequirements')} {passwordStrength.errors.join(', ')}
                                    </div>
                                )}
                                {passwords.new && passwordStrength.valid && (
                                    <div className={styles.passwordHintSuccess}>{t('strongPassword')}</div>
                                )}
                            </div>

                            <div className={styles.fieldGroup}>
                                <PasswordInput
                                    label={t('confirmPassword')}
                                    value={passwords.confirm}
                                    onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                                    required
                                />
                            </div>

                            {passwordErrors.length > 0 && (
                                <div className={styles.passwordHintError}>
                                    {passwordErrors.join(', ')}
                                </div>
                            )}

                            <Button type="submit" variant="secondary" fullWidth loading={loadingPassword}>{t('changePasswordBtn')}</Button>
                        </form>

                        <div className={styles.settingsSection}>
                            <h3 className={styles.sectionTitle}>{t('settings')}</h3>

                            <div className={styles.settingItem}>
                                <span className={styles.settingLabel}>{t('language')}</span>
                                <div className={styles.settingControls}>
                                    <ToggleButton
                                        label={t('russian')}
                                        isActive={profile.language === 'ru'}
                                        onClick={() => handleLanguageChange('ru')}
                                    />
                                    <ToggleButton
                                        label={t('english')}
                                        isActive={profile.language === 'en'}
                                        onClick={() => handleLanguageChange('en')}
                                    />
                                </div>
                            </div>

                            <div className={styles.settingItem}>
                                <span className={styles.settingLabel}>{t('theme')}</span>
                                <div className={styles.settingControls}>
                                    <ToggleButton
                                        label={t('light')}
                                        isActive={profile.theme === 'light'}
                                        onClick={() => handleThemeChange('light')}
                                    />
                                    <ToggleButton
                                        label={t('dark')}
                                        isActive={profile.theme === 'dark'}
                                        onClick={() => handleThemeChange('dark')}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className={styles.actions}>
                            <Button variant="primary" onClick={logout}>{t('changeUser')}</Button>
                            <Button variant="danger" onClick={handleDeleteAccount}>{t('deleteAccount')}</Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;