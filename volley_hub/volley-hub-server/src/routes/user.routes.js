const express = require('express');
const userController = require('../controllers/userController');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');
const { validateUser } = require('../middlewares/validation');

const router = express.Router();

router.get('/', authMiddleware, adminMiddleware, userController.getAll);
router.get('/:id', authMiddleware, adminMiddleware, userController.getById);
router.put('/profile', authMiddleware, validateUser, userController.updateProfile);
router.put('/change-password', authMiddleware, userController.changePassword);
router.delete('/account', authMiddleware, userController.deleteAccount);
router.post('/:id/block', authMiddleware, adminMiddleware, userController.blockUser);
router.post('/:id/unblock', authMiddleware, adminMiddleware, userController.unblockUser);

module.exports = router;