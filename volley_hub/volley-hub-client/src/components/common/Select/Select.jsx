import React from 'react';
import styles from './Select.module.css';

const Select = ({ label, value, onChange, options, required = false, placeholder = '' }) => {
    return (
        <div className={styles.selectGroup}>
            {label && (
                <label className={styles.label}>
                    {label}
                    {required && <span className={styles.required}>*</span>}
                </label>
            )}
            <select className={styles.select} value={value} onChange={onChange}>
                {placeholder && <option value="">{placeholder}</option>}
                {options.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                ))}
            </select>
        </div>
    );
};

export default Select;