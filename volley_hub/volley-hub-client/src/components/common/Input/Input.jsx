import React from 'react';
import styles from './Input.module.css';

const Input = ({
                   label,
                   error,
                   icon: Icon,
                   className = '',
                   ...props
               }) => {
    return (
        <div className={`${styles.inputGroup} ${className}`}>
            {label && <label className={styles.label}>{label}</label>}
            <div className={styles.inputWrapper}>
                {Icon && <Icon className={styles.inputIcon} />}
                <input
                    className={`${styles.input} ${error ? styles.error : ''} ${Icon ? styles.withIcon : ''}`}
                    {...props}
                />
            </div>
            {error && <span className={styles.errorMessage}>{error}</span>}
        </div>
    );
};

export default Input;