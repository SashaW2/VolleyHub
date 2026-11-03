import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import styles from './AboutPage.module.css';

const AboutPage = () => {
    const { t } = useLanguage();
    const { theme } = useTheme();
    const logoSrc = theme === 'dark' ? '/assets/images/logo.png' : '/assets/images/logo_t.png';

    return (
        <div className={styles.aboutPage}>
            <div className={styles.container}>
                <div className={styles.aboutCard}>
                    <img src={logoSrc} alt="Volley Hub" className={styles.logo} />
                    <h1 className={styles.title}>{t('aboutTitle')}</h1>
                    <p className={styles.description}>{t('aboutDescription')}</p>
                    <div className={styles.developer}>
                        <h3>{t('developer')}</h3>
                        <p>{t('developerName')}</p>
                    </div>
                    <div className={styles.version}>{t('version')}</div>
                </div>
            </div>
        </div>
    );
};

export default AboutPage;