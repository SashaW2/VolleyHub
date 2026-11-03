import React from 'react';
import styles from './Card.module.css';

const Card = ({ children, className = '', onClick, hoverable = true }) => {
    return (
        <div
            className={`${styles.card} ${hoverable ? styles.hoverable : ''} ${className}`}
            onClick={onClick}
        >
            {children}
        </div>
    );
};

export default Card;