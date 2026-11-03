const jwt = require('jsonwebtoken');

const optionalAuth = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
        } catch (error) {
            // Токен невалидный, но это не ошибка - просто пользователь не авторизован
        }
    }

    next();
};

module.exports = { optionalAuth };