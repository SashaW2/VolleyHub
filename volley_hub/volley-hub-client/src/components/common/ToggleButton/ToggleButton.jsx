import React from 'react';
import Tooltip from '../Tooltip/Tooltip';
import styles from './ToggleButton.module.css';

const ToggleButton = ({ label, isActive, onClick, disabled = false, title = '' }) => {
    const button = (
        <button
            className={`${styles.toggleButton} ${isActive ? styles.active : ''}`}
            onClick={onClick}
            disabled={disabled}
            type="button"
        >
            {label}
        </button>
    );

    if (!title) return button;

    return (
        <Tooltip content={title} position="top">
            {button}
        </Tooltip>
    );
};

export default ToggleButton;