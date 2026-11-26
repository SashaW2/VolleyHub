import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import Modal from '../components/common/Modal/Modal';
import Button from '../components/common/Button/Button';
import { useLanguage } from './LanguageContext';
import styles from './DialogContext.module.css';

const DialogContext = createContext(null);

export const useDialog = () => useContext(DialogContext);

export const DialogProvider = ({ children }) => {
    const { t } = useLanguage();
    const [dialog, setDialog] = useState(null);
    const resolverRef = useRef(null);

    const close = useCallback((result) => {
        const resolve = resolverRef.current;
        resolverRef.current = null;
        setDialog(null);
        if (resolve) resolve(result);
    }, []);

    const openDialog = useCallback((config) => {
        if (resolverRef.current) {
            resolverRef.current(false);
            resolverRef.current = null;
        }
        return new Promise((resolve) => {
            resolverRef.current = resolve;
            setDialog(config);
        });
    }, []);

    const alertDialog = useCallback((message, options = {}) => {
        return openDialog({ type: 'alert', message, ...options });
    }, [openDialog]);

    const confirmDialog = useCallback((message, options = {}) => {
        return openDialog({ type: 'confirm', message, ...options });
    }, [openDialog]);

    useEffect(() => {
        let pending = null;
        try {
            pending = sessionStorage.getItem('pendingAlertDialog');
            if (pending) sessionStorage.removeItem('pendingAlertDialog');
        } catch (e) {
            pending = null;
        }
        if (!pending) return;
        try {
            const config = JSON.parse(pending);
            if (config?.message) {
                openDialog({ type: 'alert', message: config.message, title: config.title });
            }
        } catch (e) {
        }
    }, [openDialog]);

    const value = useMemo(() => ({ alertDialog, confirmDialog }), [alertDialog, confirmDialog]);
    const isConfirm = dialog?.type === 'confirm';
    const title = dialog?.title || (isConfirm ? t('dialogConfirmTitle') : t('dialogAlertTitle'));

    return (
        <DialogContext.Provider value={value}>
            {children}
            <Modal isOpen={Boolean(dialog)} onClose={() => close(false)} title={title} size="small">
                <p className={styles.message}>{dialog?.message}</p>
                <div className={styles.actions}>
                    {isConfirm && (
                        <Button variant="outline" onClick={() => close(false)}>
                            {dialog?.cancelText || t('cancel')}
                        </Button>
                    )}
                    <Button
                        variant={isConfirm && dialog?.danger ? 'danger' : 'primary'}
                        onClick={() => close(true)}
                    >
                        {dialog?.confirmText || t('dialogOk')}
                    </Button>
                </div>
            </Modal>
        </DialogContext.Provider>
    );
};
