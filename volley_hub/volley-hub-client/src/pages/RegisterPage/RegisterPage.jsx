import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import Button from '../../components/common/Button/Button';
import Input from '../../components/common/Input/Input';
import PhoneInput from '../../components/common/PhoneInput/PhoneInput';
import PasswordInput from '../../components/common/PasswordInput/PasswordInput';
import ToggleButton from '../../components/common/ToggleButton/ToggleButton';
import styles from './RegisterPage.module.css';

const RegisterPage = () => {
    const navigate = useNavigate();
    const { register } = useAuth();
    const { t } = useLanguage();
    const { theme } = useTheme();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        gameLevel: 'D2',
        password: '',
        confirmPassword: ''
    });

    const [errors, setErrors] = useState({});
    const [passwordErrors, setPasswordErrors] = useState([]);
    const [loading, setLoading] = useState(false);

    const levels = ['D1', 'D2', 'D3', 'D4', 'D4Plus'];

    const levelTooltips = {
        'D1': 'D1 — Профессиональный: действующие МС, КМС',
        'D2': 'D2 — Продвинутый: полупрофи, воспитанники СДЮШОР',
        'D3': 'D3 — Уверенный: комбинационная игра с пайпами и темпами',
        'D4': 'D4 — Любитель: простая игра с нападением',
        'D4Plus': 'D4+ — Начинающий: перебрасывание мяча через сетку'
    };

    const logoSrc = theme === 'dark' ? '/assets/images/logo.png' : '/assets/images/logo_t.png';

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

    const handleGeneratePassword = () => {
        const newPassword = generateRandomPassword();
        setFormData({
            ...formData,
            password: newPassword,
            confirmPassword: newPassword
        });
        setErrors({ ...errors, password: '', confirmPassword: '' });
        setPasswordErrors([]);
    };

    const validatePasswordRealtime = (password) => {
        const errorsList = [];
        if (password.length < 8) errorsList.push('минимум 8 символов');
        const hasUpperLatin = /[A-Z]/.test(password);
        const hasUpperCyrillic = /[А-ЯЁ]/.test(password);
        if (!hasUpperLatin && !hasUpperCyrillic) errorsList.push('заглавную букву (A-Z или А-Я)');
        const hasLowerLatin = /[a-z]/.test(password);
        const hasLowerCyrillic = /[а-яё]/.test(password);
        if (!hasLowerLatin && !hasLowerCyrillic) errorsList.push('строчную букву (a-z или а-я)');
        if (!/[0-9]/.test(password)) errorsList.push('цифру (0-9)');
        if (!/[!@#$%^&*]/.test(password)) errorsList.push('спецсимвол (!@#$%^&*)');
        return errorsList;
    };

    useEffect(() => {
        const errorsList = validatePasswordRealtime(formData.password);
        setPasswordErrors(errorsList);
        if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
            setErrors(prev => ({ ...prev, confirmPassword: 'Пароли не совпадают' }));
        } else {
            setErrors(prev => ({ ...prev, confirmPassword: '' }));
        }
    }, [formData.password, formData.confirmPassword]);

    const validateName = (name) => {
        if (!name) return 'Имя обязательно';
        if (name.length < 2) return 'Имя должно содержать минимум 2 символа';
        if (name.length > 100) return 'Имя не должно превышать 100 символов';
        const nameRegex = /^[A-Za-zА-Яа-я\s]+$/;
        if (!nameRegex.test(name)) return 'Имя может содержать только буквы и пробелы';
        return '';
    };

    const validateEmail = (email) => {
        if (!email) return 'Email обязателен';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return 'Введите корректный email (example@domain.com)';
        return '';
    };

    const validatePhone = (phone) => {
        if (!phone) return 'Телефон обязателен';
        const phoneRegex = /^\+375 \d{2} \d{3}-\d{2}-\d{2}$/;
        if (!phoneRegex.test(phone)) return 'Телефон должен быть в формате +375 XX XXX-XX-XX';
        const digits = phone.replace(/\D/g, '');
        if (digits.length !== 12) return 'Введите полный номер телефона (9 цифр после кода)';
        return '';
    };

    const validatePassword = (password) => {
        if (!password) return 'Пароль обязателен';
        if (password.length < 8) return 'Пароль должен содержать минимум 8 символов';
        const hasUpperLatin = /[A-Z]/.test(password);
        const hasUpperCyrillic = /[А-ЯЁ]/.test(password);
        if (!hasUpperLatin && !hasUpperCyrillic) return 'Пароль должен содержать заглавную букву (A-Z или А-Я)';
        const hasLowerLatin = /[a-z]/.test(password);
        const hasLowerCyrillic = /[а-яё]/.test(password);
        if (!hasLowerLatin && !hasLowerCyrillic) return 'Пароль должен содержать строчную букву (a-z или а-я)';
        if (!/[0-9]/.test(password)) return 'Пароль должен содержать цифру (0-9)';
        if (!/[!@#$%^&*]/.test(password)) return 'Пароль должен содержать спецсимвол (!@#$%^&*)';
        return '';
    };

    const validateConfirmPassword = (confirmPassword, password) => {
        if (!confirmPassword) return 'Подтверждение пароля обязательно';
        if (confirmPassword !== password) return 'Пароли не совпадают';
        return '';
    };

    const validateGameLevel = (level) => {
        if (!level) return 'Выберите уровень игры';
        return '';
    };

    const validateField = (name, value) => {
        switch (name) {
            case 'name': return validateName(value);
            case 'email': return validateEmail(value);
            case 'phone': return validatePhone(value);
            case 'gameLevel': return validateGameLevel(value);
            case 'password': return validatePassword(value);
            case 'confirmPassword': return validateConfirmPassword(value, formData.password);
            default: return '';
        }
    };

    const handleFieldChange = (name, value) => {
        setFormData({ ...formData, [name]: value });
        const error = validateField(name, value);
        setErrors({ ...errors, [name]: error });
    };

    const handlePhoneChange = (e) => {
        const value = e.target.value;
        setFormData({ ...formData, phone: value });
        if (errors.phone) setErrors({ ...errors, phone: '' });
    };

    const validateForm = () => {
        const newErrors = {
            name: validateName(formData.name),
            email: validateEmail(formData.email),
            phone: validatePhone(formData.phone),
            gameLevel: validateGameLevel(formData.gameLevel),
            password: validatePassword(formData.password),
            confirmPassword: validateConfirmPassword(formData.confirmPassword, formData.password)
        };
        setErrors(newErrors);
        return Object.values(newErrors).every(error => error === '') && passwordErrors.length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setLoading(true);
        try {
            const registerData = {
                name: formData.name.trim(),
                email: formData.email.trim().toLowerCase(),
                phone: formData.phone,
                gameLevel: formData.gameLevel,
                password: formData.password
            };
            await register(registerData);
            navigate('/');
        } catch (err) {
            if (err.message?.includes('email') || err.message?.includes('Email')) {
                setErrors({ ...errors, email: 'Пользователь с таким email уже существует' });
            } else {
                setErrors({ ...errors, general: err.message || 'Ошибка регистрации' });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.registerPage}>
            <div className={styles.container}>
                <div className={styles.registerCard}>
                    <div className={styles.header}>
                        <img src={logoSrc} alt="Volley Hub" className={styles.logoImage} />
                        <h1 className={styles.title}>{t('registerTitle')}</h1>
                        <p className={styles.subtitle}>{t('createAccount')}</p>
                    </div>

                    <form onSubmit={handleSubmit} className={styles.form}>
                        {errors.general && <div className={styles.errorMessage}>{errors.general}</div>}

                        <div className={styles.fieldGroup}>
                            <Input
                                label={t('name')}
                                placeholder="Введите ваше имя"
                                value={formData.name}
                                onChange={(e) => handleFieldChange('name', e.target.value)}
                            />
                            {errors.name && <span className={styles.fieldError}>{errors.name}</span>}
                        </div>

                        <div className={styles.fieldGroup}>
                            <Input
                                label={t('email')}
                                type="email"
                                placeholder="example@mail.com"
                                value={formData.email}
                                onChange={(e) => handleFieldChange('email', e.target.value)}
                            />
                            {errors.email && <span className={styles.fieldError}>{errors.email}</span>}
                        </div>

                        <div className={styles.fieldGroup}>
                            <PhoneInput
                                label={t('phone')}
                                value={formData.phone}
                                onChange={handlePhoneChange}
                                error={errors.phone}
                            />
                        </div>

                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>{t('gameLevel')}</label>
                            <div className={styles.levelButtons}>
                                {levels.map(level => {
                                    const levelTooltips = {
                                        'D1': 'D1 – Профессиональный: действующие МС, КМС',
                                        'D2': 'D2 – Продвинутый: полупрофи, воспитанники СДЮШОР',
                                        'D3': 'D3 – Уверенный: комбинационная игра с пайпами и темпами',
                                        'D4': 'D4 – Любитель: простая игра с нападением',
                                        'D4Plus': 'D4+ – Начинающий: перебрасывание мяча через сетку'
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

                        <div className={styles.fieldGroup}>
                            <div className={styles.passwordHeader}>
                                <label className={styles.label}>{t('password')}</label>
                                <button type="button" className={styles.generateButton} onClick={handleGeneratePassword}>
                                    {t('generatePassword')}
                                </button>
                            </div>
                            <PasswordInput
                                placeholder="Введите пароль"
                                value={formData.password}
                                onChange={(e) => handleFieldChange('password', e.target.value)}
                            />
                            {formData.password && passwordErrors.length > 0 && (
                                <div className={styles.passwordHintError}>
                                    {t('passwordRequirements')} {passwordErrors.join(', ')}
                                </div>
                            )}
                            {formData.password && passwordErrors.length === 0 && (
                                <div className={styles.passwordHintSuccess}>{t('strongPassword')}</div>
                            )}
                        </div>

                        <div className={styles.fieldGroup}>
                            <PasswordInput
                                label={t('confirmPassword')}
                                placeholder="Подтвердите пароль"
                                value={formData.confirmPassword}
                                onChange={(e) => handleFieldChange('confirmPassword', e.target.value)}
                            />
                            {errors.confirmPassword && <span className={styles.fieldError}>{errors.confirmPassword}</span>}
                        </div>

                        <Button type="submit" fullWidth size="large" loading={loading}>
                            {t('register')}
                        </Button>
                    </form>

                    <div className={styles.footer}>
                        <p className={styles.loginLink}>
                            {t('alreadyHaveAccount')} <a href="/login">{t('loginLink')}</a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;