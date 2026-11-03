import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './Tooltip.module.css';

const Tooltip = ({ content, children, position = 'top' }) => {
    const [visible, setVisible] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const wrapperRef = useRef(null);
    const tooltipRef = useRef(null);
    const showTimer = useRef(null);
    const hideTimer = useRef(null);

    const clearTimers = () => {
        if (showTimer.current) { clearTimeout(showTimer.current); showTimer.current = null; }
        if (hideTimer.current) { clearTimeout(hideTimer.current); hideTimer.current = null; }
    };

    const updatePosition = () => {
        if (!wrapperRef.current) return;
        const rect = wrapperRef.current.getBoundingClientRect();
        let top = rect.top;
        let left = rect.left + rect.width / 2;

        if (position === 'top') top = rect.top - 8;
        if (position === 'bottom') top = rect.bottom + 8;
        if (position === 'left') left = rect.left - 8;
        if (position === 'right') left = rect.right + 8;

        setCoords({ top, left });
    };

    const handleMouseEnter = () => {
        clearTimers();
        showTimer.current = setTimeout(() => {
            updatePosition();
            setVisible(true);
        }, 150);
    };

    const handleMouseLeave = () => {
        clearTimers();
        hideTimer.current = setTimeout(() => {
            setVisible(false);
        }, 80);
    };

    useEffect(() => {
        if (!visible) return;
        const handleScroll = () => updatePosition();
        window.addEventListener('scroll', handleScroll, true);
        window.addEventListener('resize', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', handleScroll);
        };
    }, [visible]);

    useEffect(() => () => clearTimers(), []);

    if (!content) return children;

    return (
        <>
            <span
                ref={wrapperRef}
                className={styles.wrapper}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onFocus={handleMouseEnter}
                onBlur={handleMouseLeave}
            >
                {children}
            </span>
            {visible && createPortal(
                <div
                    ref={tooltipRef}
                    className={`${styles.tooltip} ${styles[position]}`}
                    style={{ top: coords.top, left: coords.left }}
                    role="tooltip"
                >
                    {content}
                </div>,
                document.body
            )}
        </>
    );
};

export default Tooltip;