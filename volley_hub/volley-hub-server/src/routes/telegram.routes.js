const express = require('express');
const telegramController = require('../controllers/telegramController');
const { authMiddleware } = require('../middlewares/auth');

const router = express.Router();

router.get('/status', authMiddleware, telegramController.getStatus);
router.post('/link', authMiddleware, telegramController.createLink);
router.patch('/notifications', authMiddleware, telegramController.updateNotifications);
router.delete('/link', authMiddleware, telegramController.unlink);

module.exports = router;
