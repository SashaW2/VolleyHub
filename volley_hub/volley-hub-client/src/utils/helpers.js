export const formatDate = (dateStr, format = 'ru') => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';

    if (format === 'ru') {
        return date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }
    return date.toISOString().split('T')[0];
};

export const formatTime = (timeStr) => {
    if (!timeStr) return '';
    return timeStr.slice(0, 5);
};

export const formatDateTime = (dateStr, timeStr) => {
    return `${formatDate(dateStr)} ${formatTime(timeStr)}`;
};

export const formatPhone = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 12) {
        return `+${cleaned.slice(0,3)} ${cleaned.slice(3,5)} ${cleaned.slice(5,8)}-${cleaned.slice(8,10)}-${cleaned.slice(10,12)}`;
    }
    return phone;
};

export const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

export const validatePhone = (phone) => {
    const re = /^\+375 \d{2} \d{3}-\d{2}-\d{2}$/;
    return re.test(phone);
};

export const validatePassword = (password) => {
    return password.length >= 8;
};

export const getLevelColor = (level) => {
    const colors = {
        D1: '#10B981',
        D2: '#3B82F6',
        D3: '#F59E0B',
        D4: '#EF4444',
        D4Plus: '#8B5CF6'
    };
    return colors[level] || '#667eea';
};

export const getLevelLabel = (level) => {
    return level === 'D4Plus' ? 'D4+' : level;
};

export const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
};