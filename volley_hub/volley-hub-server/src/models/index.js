const sequelize = require('../config/database');
const User = require('./User');
const Advert = require('./Advert');
const AdvertParticipant = require('./AdvertParticipant');
const AdvertSubscriber = require('./AdvertSubscriber');
const Notification = require('./Notification');
const Role = require('./Role');

// Associations
User.belongsTo(Role, { foreignKey: 'roleId' });
Role.hasMany(User, { foreignKey: 'roleId' });

User.hasMany(Advert, { foreignKey: 'userId', onDelete: 'CASCADE' });
Advert.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Notification, { foreignKey: 'userId' });
Notification.belongsTo(User, { foreignKey: 'userId' });

Advert.hasMany(AdvertParticipant, { foreignKey: 'advertId', onDelete: 'CASCADE' });
AdvertParticipant.belongsTo(Advert, { foreignKey: 'advertId' });

User.hasMany(AdvertParticipant, { foreignKey: 'userId' });
AdvertParticipant.belongsTo(User, { foreignKey: 'userId' });

Advert.hasMany(AdvertSubscriber, { foreignKey: 'advertId', onDelete: 'CASCADE' });
AdvertSubscriber.belongsTo(Advert, { foreignKey: 'advertId' });

User.hasMany(AdvertSubscriber, { foreignKey: 'userId' });
AdvertSubscriber.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
    sequelize,
    User,
    Advert,
    AdvertParticipant,
    AdvertSubscriber,
    Notification,
    Role
};