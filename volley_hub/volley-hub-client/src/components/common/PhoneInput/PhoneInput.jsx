import React, { useRef, useState } from 'react';
import styles from './PhoneInput.module.css';

const PhoneInput = ({ label, value, onChange, error, ...props }) => {
    const inputRef = useRef(null);
    const [isFocused, setIsFocused] = useState(false);

    const getDigitsOnly = (str) => str.replace(/\D/g, '');

    const normalizeDigits = (digits) => {
        if (!digits) return '';
        let d = digits;

        if (!d.startsWith('375')) {
            d = '375' + d;
        }

        d = d.slice(0, 12);

        return d;
    };

    const formatPhoneNumber = (digits) => {
        if (!digits) return '';

        const normalized = normalizeDigits(digits);
        const local = normalized.slice(3);

        if (local.length === 0) return '+375';

        let result = '+375';

        if (local.length > 0) result += ' ' + local.slice(0, 2);
        if (local.length > 2) result += ' ' + local.slice(2, 5);
        if (local.length > 5) result += '-' + local.slice(5, 7);
        if (local.length > 7) result += '-' + local.slice(7, 9);

        return result;
    };

    const getCaretByDigitIndex = (formatted, digitIndex) => {
        if (digitIndex <= 0) {
            const idx = formatted.indexOf(' ');
            return idx >= 0 ? idx + 1 : formatted.length;
        }

        let count = 0;
        for (let i = 0; i < formatted.length; i++) {
            if (/\d/.test(formatted[i])) {
                if (count === digitIndex) {
                    return i + 1;
                }
                count++;
            }
        }
        return formatted.length;
    };

    const handleChange = (e) => {
        const rawValue = e.target.value;
        const oldValue = value || '';
        const oldCaretPos = inputRef.current?.selectionStart || 0;

        const newDigits = getDigitsOnly(rawValue);

        const oldDigitPos = getDigitsOnly(oldValue.slice(0, oldCaretPos)).length;

        const formatted = formatPhoneNumber(newDigits);

        const newCaretPos = getCaretByDigitIndex(formatted, oldDigitPos);

        onChange({ target: { value: formatted } });

        setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.setSelectionRange(newCaretPos, newCaretPos);
            }
        }, 0);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Backspace') {
            const currentValue = value || '';
            const cursorPos = inputRef.current?.selectionStart || 0;

            if (cursorPos <= 5) {
                e.preventDefault();
                return;
            }

            const totalDigits = getDigitsOnly(currentValue).length;
            const digitsBeforeCursor = getDigitsOnly(currentValue.slice(0, cursorPos)).length;

            if (digitsBeforeCursor === 0 && totalDigits === 0) {
                e.preventDefault();
                return;
            }

            if (totalDigits === 0) {
                e.preventDefault();
                return;
            }
        }

        if (e.key.length === 1 && !/[0-9]/.test(e.key)) {
            e.preventDefault();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedText = e.clipboardData.getData('text');
        const digits = getDigitsOnly(pastedText);

        if (digits) {
            const formatted = formatPhoneNumber(digits);
            onChange({ target: { value: formatted } });

            setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.setSelectionRange(formatted.length, formatted.length);
                }
            }, 0);
        }
    };

    const handleFocus = () => {
        setIsFocused(true);
        if (!value) {
            const initial = '+375 ';
            onChange({ target: { value: initial } });
            setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.setSelectionRange(initial.length, initial.length);
                }
            }, 0);
        }
    };

    const handleBlur = () => {
        setIsFocused(false);
        const digits = getDigitsOnly(value || '');
        if (digits.length < 12) {
            onChange({ target: { value: '' } });
        }
    };

    const displayValue = value || (isFocused ? '+375 ' : '');

    return (
        <div className={styles.phoneGroup}>
            {label && <label className={styles.label}>{label}</label>}
            <div className={styles.phoneWrapper}>
                <input
                    ref={inputRef}
                    type="tel"
                    className={`${styles.phoneInput} ${error ? styles.error : ''}`}
                    value={displayValue}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    onPaste={handlePaste}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    placeholder="+375 00 000-00-00"
                    {...props}
                />
            </div>
            {error && <span className={styles.errorMessage}>{error}</span>}
        </div>
    );
};

export default PhoneInput;