import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import { useTheme } from '../../../context/ThemeContext';
import styles from './Header.module.css';

const Header = () => {
    const navigate = useNavigate();
    const { user, logout, isAuthenticated } = useAuth();
    const { t } = useLanguage();
    const { theme } = useTheme();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const isAdmin = user?.role === 'admin' || user?.isAdmin === true || user?.roleId === 2;

    const logoSrc = theme === 'dark' ? '/assets/images/logo.png' : '/assets/images/logo_t.png';

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <header className={styles.header}>
            <div className={styles.container}>
                <Link to="/" className={styles.logo}>
                    <img src={logoSrc} alt="Volley Hub" className={styles.logoImage} />
                    <span className={styles.logoText}>Volley Hub</span>
                </Link>

                <button
                    className={styles.mobileMenuButton}
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    ☰
                </button>

                <nav className={`${styles.nav} ${mobileMenuOpen ? styles.navOpen : ''}`}>
                    <Link to="/" className={styles.navLink} onClick={() => setMobileMenuOpen(false)}>{t('home')}</Link>
                    <Link to="/about" className={styles.navLink} onClick={() => setMobileMenuOpen(false)}>{t('about')}</Link>

                    {isAuthenticated && (
                        <>
                            {!isAdmin && (
                                <>
                                    <Link to="/notifications" className={styles.navLink} onClick={() => setMobileMenuOpen(false)}>{t('notifications')}</Link>
                                    <Link to="/profile" className={styles.navLink} onClick={() => setMobileMenuOpen(false)}>{t('profile')}</Link>
                                </>
                            )}
                            {isAdmin && (
                                <>
                                    <Link to="/admin/users" className={styles.navLink} onClick={() => setMobileMenuOpen(false)}>{t('users')}</Link>
                                    <Link to="/admin/statistics" className={styles.navLink} onClick={() => setMobileMenuOpen(false)}>{t('statistics')}</Link>
                                </>
                            )}
                        </>
                    )}

                    {isAuthenticated ? (
                        <div className={styles.userBlock}>
                            <span className={styles.userEmail} title={user?.email}>
                                {user?.email}
                            </span>
                            <button onClick={handleLogout} className={styles.logoutButton}>{t('logout')}</button>
                        </div>
                    ) : (
                        <div className={styles.authButtons}>
                            <Link to="/login" className={styles.loginButton} onClick={() => setMobileMenuOpen(false)}>{t('login')}</Link>
                            <Link to="/register" className={styles.registerButton} onClick={() => setMobileMenuOpen(false)}>{t('register')}</Link>
                        </div>
                    )}
                </nav>
            </div>
        </header>
    );
};

export default Header;