import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import Button from '../common/Button/Button';
import Input from '../common/Input/Input';
import styles from './NearestAddressModal.module.css';

const NearestAddressModal = ({ isOpen, onClose, initialAddress, onConfirm }) => {
    const { t } = useLanguage();
    const [address, setAddress] = useState(initialAddress || '');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setAddress(initialAddress || '');
            setError('');
        }
    }, [isOpen, initialAddress]);

    const handleChange = (value) => {
        setAddress(value);
        setError('');
    };

    const handleSubmit = async () => {
        const trimmed = address.trim();
        if (!trimmed) {
            setError(t('addressRequired'));
            return;
        }
        setLoading(true);
        setError('');
        try {
            await onConfirm(trimmed);
        } catch (e) {
            setError(e?.message || t('addressInvalid'));
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2 className={styles.title}>{t('mapNearestTitle')}</h2>
                    <button className={styles.closeButton} onClick={onClose}>×</button>
                </div>
                <div className={styles.content}>
                    <p className={styles.hint}>{t('mapAddressPrompt')}</p>
                    <Input
                        placeholder={t('yourAddress')}
                        value={address}
                        onChange={(e) => handleChange(e.target.value)}
                    />
                    {error && <span className={styles.error}>{error}</span>}
                </div>
                <div className={styles.footer}>
                    <Button variant="outline" onClick={onClose}>{t('cancel')}</Button>
                    <Button onClick={handleSubmit} loading={loading}>{t('mapBuild')}</Button>
                </div>
            </div>
        </div>
    );
};

export default NearestAddressModal;