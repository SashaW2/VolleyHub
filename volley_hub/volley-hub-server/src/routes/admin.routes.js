const express = require('express');
const adminController = require('../controllers/adminController');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

router.get('/users', adminController.getAllUsers);
router.get('/statistics', adminController.getStatistics);
router.post('/users/:id/block', adminController.blockUser);
router.post('/users/:id/unblock', adminController.unblockUser);
router.post('/notifications/send', adminController.sendNotification);

module.exports = router;