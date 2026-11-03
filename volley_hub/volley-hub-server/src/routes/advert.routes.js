const express = require('express');
const advertController = require('../controllers/advertController');
const { authMiddleware } = require('../middlewares/auth');
const { optionalAuth } = require('../middlewares/optionalAuth');
const { validateAdvert } = require('../middlewares/validation');

const router = express.Router();

router.get('/', optionalAuth, advertController.getAll);
router.get('/my', authMiddleware, advertController.getMy);
router.get('/participating', authMiddleware, advertController.getParticipating);
router.get('/:id', optionalAuth, advertController.getById);
router.post('/', authMiddleware, validateAdvert, advertController.create);
router.put('/:id', authMiddleware, validateAdvert, advertController.update);
router.delete('/:id', authMiddleware, advertController.delete);
router.post('/:id/subscribe', authMiddleware, advertController.subscribe);
router.post('/:id/unsubscribe', authMiddleware, advertController.unsubscribe);
router.post('/:id/subscribe-waiting', authMiddleware, advertController.subscribeToWaiting);
router.post('/:id/unsubscribe-waiting', authMiddleware, advertController.unsubscribeFromWaiting);

module.exports = router;