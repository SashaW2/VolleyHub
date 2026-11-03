import React, { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import styles from './PasswordInput.module.css';

const PasswordInput = ({ label, placeholder, value, onChange, ...props }) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className={styles.passwordGroup}>
            {label && <label className={styles.label}>{label}</label>}
            <div className={styles.passwordWrapper}>
                <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    className={styles.passwordInput}
                    {...props}
                />
                <button
                    type="button"
                    className={styles.toggleButton}
                    onClick={() => setShowPassword(!showPassword)}
                >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
            </div>
        </div>
    );
};

export default PasswordInput;