import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import Button from '../../components/common/Button/Button';
import Input from '../../components/common/Input/Input';
import PasswordInput from '../../components/common/PasswordInput/PasswordInput';
import styles from './LoginPage.module.css';

const LoginPage = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const { t } = useLanguage();
    const { theme } = useTheme();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const logoSrc = theme === 'dark' ? '/assets/images/logo.png' : '/assets/images/logo_t.png';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            let errorMessage = t('invalidCredentials');
            if (err.message) {
                errorMessage = err.message;
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.loginPage}>
            <div className={styles.container}>
                <div className={styles.loginCard}>
                    <div className={styles.header}>
                        <img src={logoSrc} alt="Volley Hub" className={styles.logo} />
                        <h1 className={styles.title}>{t('loginTitle')}</h1>
                        <p className={styles.subtitle}>{t('welcomeBack')}</p>
                    </div>

                    <form onSubmit={handleSubmit} className={styles.form}>
                        {error && <div className={styles.errorMessage}>{error}</div>}

                        <Input
                            label={t('email')}
                            type="email"
                            placeholder="example@mail.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />

                        <PasswordInput
                            label={t('password')}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />

                        <Button type="submit" fullWidth size="large" loading={loading}>
                            {t('login')}
                        </Button>
                    </form>

                    <div className={styles.footer}>
                        <p className={styles.registerLink}>
                            {t('noAccount')} <a href="/register">{t('registerLink')}</a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;