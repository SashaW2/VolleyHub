const authService = require('../services/authService');

const authMiddleware = async (req, res, next) => {
    let token = req.headers.authorization?.replace('Bearer ', '');
    if (!token && req.query?.token) {
        token = String(req.query.token);
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'Требуется авторизация' });
    }

    const decoded = authService.verifyToken(token);
    if (!decoded) {
        return res.status(401).json({ success: false, message: 'Недействительный токен' });
    }

    req.user = decoded;
    next();
};

const adminMiddleware = (req, res, next) => {
    if (req.user.roleId !== 2 && req.user.role !== 'admin' && !req.user.isAdmin) {
        return res.status(403).json({ success: false, message: 'Доступ запрещен. Требуются права администратора' });
    }
    next();
};

const optionalAuth = async (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (token) {
        const decoded = authService.verifyToken(token);
        if (decoded) {
            req.user = decoded;
        }
    }

    next();
};

module.exports = { authMiddleware, adminMiddleware, optionalAuth };