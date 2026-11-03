import React from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import styles from './Footer.module.css';

const Footer = () => {
    const { t } = useLanguage();

    const openLink = (url) => {
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                <div className={styles.content}>
                    <div className={styles.contacts}>
                        <button
                            className={styles.contactItem}
                            onClick={() => openLink('https://mail.google.com/mail/?view=cm&fs=1&to=volleyhub@gmail.com')}
                        >
                            <img
                                src="/assets/icons/free-icon-gmail-2913990.png"
                                alt="Email"
                                className={styles.contactIcon}
                            />
                            <span>volleyhub@gmail.com</span>
                        </button>
                        <button
                            className={styles.contactItem}
                            onClick={() => openLink('https://t.me/volleyhub')}
                        >
                            <img
                                src="/assets/icons/free-icon-telegram-5968804.png"
                                alt="Telegram"
                                className={styles.contactIcon}
                            />
                            <span>@volleyhub</span>
                        </button>
                        <button
                            className={styles.contactItem}
                            onClick={() => openLink('https://wa.me/375296571321')}
                        >
                            <img
                                src="/assets/icons/whatsapp.png"
                                alt="WhatsApp"
                                className={styles.contactIcon}
                            />
                            <span>+375 29 657-13-21</span>
                        </button>
                        <button
                            className={styles.contactItem}
                            onClick={() => openLink('https://www.instagram.com/volleyhub')}
                        >
                            <img
                                src="/assets/icons/free-icon-instagram-3955024.png"
                                alt="Instagram"
                                className={styles.contactIcon}
                            />
                            <span>@volleyhub</span>
                        </button>
                    </div>
                    <div className={styles.copyright}>
                        © 2026 Volley Hub. {t('copyright')}
                    </div>
                </div>            </div>
        </footer>
    );
};

export default Footer;