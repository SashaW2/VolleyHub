const sseHub = require('./sseHub');

const ADVERTS_CHANNEL = 'adverts';

const notifyUsersChanged = (action, userId = null) => {
    sseHub.broadcast(ADVERTS_CHANNEL, 'adverts', {
        action,
        advertId: null,
        actorId: userId
    });
};

module.exports = { notifyUsersChanged };
