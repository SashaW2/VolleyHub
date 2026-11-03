import React from 'react';
import styles from './Button.module.css';

const Button = ({
                    children,
                    variant = 'primary',
                    size = 'medium',
                    fullWidth = false,
                    loading = false,
                    disabled = false,
                    icon: Icon,
                    onClick,
                    type = 'button',
                    className = ''
                }) => {
    const buttonClasses = [
        styles.button,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        loading && styles.loading,
        className
    ].filter(Boolean).join(' ');

    return (
        <button
            type={type}
            className={buttonClasses}
            onClick={onClick}
            disabled={disabled || loading}
        >
            {loading && <span className={styles.spinner} />}
            {Icon && !loading && <Icon className={styles.icon} />}
            <span className={styles.content}>{children}</span>
        </button>
    );
};

export default Button;