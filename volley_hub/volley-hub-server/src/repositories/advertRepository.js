const { Op } = require('sequelize');
const Advert = require('../models/Advert');
const AdvertParticipant = require('../models/AdvertParticipant');
const AdvertSubscriber = require('../models/AdvertSubscriber');
const sequelize = require('../config/database');

class AdvertRepository {
    async create(advertData) {
        try {
            const address = advertData.address.replace(/'/g, "''");
            const date = advertData.date;
            const startTime = advertData.startTime;
            const endTime = advertData.endTime;
            const gameLevel = advertData.gameLevel;
            const cost = advertData.cost;
            const peopleCount = advertData.peopleCount;
            const description = advertData.description ? advertData.description.replace(/'/g, "''") : null;
            const userId = advertData.userId;

            const query = `
                INSERT INTO Adverts (Address, Date, StartTime, EndTime, GameLevel, Cost, PeopleCount, Description, UserId, CreatedDate, TwoHourNotificationSent)
                VALUES (N'${address}', '${date}', '${startTime}', '${endTime}', ${gameLevel}, ${cost}, ${peopleCount}, ${description ? `N'${description}'` : 'NULL'}, ${userId}, GETDATE(), 0);
                SELECT SCOPE_IDENTITY() as Id;
            `;

            const [results, metadata] = await sequelize.query(query);
            const newId = results[0]?.Id;

            if (newId) {
                return await Advert.findByPk(newId);
            }
            return null;
        } catch (error) {
            console.error('Error in advertRepository.create:', error);
            throw error;
        }
    }

    async findById(id) {
        return await Advert.findByPk(id);
    }

    async findAll(filters = {}) {
        try {
            const where = {};

            if (filters.address) {
                where.address = { [Op.like]: `%${filters.address}%` };
            }
            if (filters.date) {
                where.date = filters.date;
            }
            if (filters.startTime) {
                where.startTime = { [Op.gte]: filters.startTime };
            }
            if (filters.endTime) {
                where.endTime = { [Op.lte]: filters.endTime };
            }

            if (filters.gameLevel && Array.isArray(filters.gameLevel) && filters.gameLevel.length > 0) {
                where.gameLevel = { [Op.in]: filters.gameLevel };
            }

            if (filters.minPrice !== undefined && filters.minPrice !== '') {
                where.cost = { [Op.gte]: parseFloat(filters.minPrice) };
            }
            if (filters.maxPrice !== undefined && filters.maxPrice !== '') {
                where.cost = { ...where.cost, [Op.lte]: parseFloat(filters.maxPrice) };
            }

            const result = await Advert.findAll({
                where,
                order: [['date', 'ASC']],
                limit: 100
            });

            return result;
        } catch (error) {
            console.error('Repository findAll error:', error);
            throw error;
        }
    }

    async findByUserId(userId) {
        return await Advert.findAll({
            where: { userId },
            order: [['date', 'ASC']]
        });
    }

    async update(id, advertData) {
        const advert = await Advert.findByPk(id);
        if (!advert) return null;
        return await advert.update(advertData);
    }

    async delete(id) {
        const advert = await Advert.findByPk(id);
        if (!advert) return false;
        await advert.destroy();
        return true;
    }

    async checkOverlappingAdvert(address, date, startTime, endTime, excludeId = null) {
        const query = `
            SELECT COUNT(*) as count
            FROM Adverts 
            WHERE Address = N'${address.replace(/'/g, "''")}'
            AND Date = '${date}'
            AND Id ${excludeId ? `<> ${excludeId}` : 'IS NOT NULL'}
            AND (
                (StartTime < '${endTime}' AND EndTime > '${startTime}')
            )
        `;
        try {
            const [results] = await sequelize.query(query);
            return results[0].count > 0;
        } catch (error) {
            console.error('Error in checkOverlappingAdvert:', error);
            return false;
        }
    }

    async addParticipant(advertId, userId) {
        const query = `
            IF NOT EXISTS (SELECT 1 FROM AdvertParticipants WHERE AdvertId = ${advertId} AND UserId = ${userId})
            BEGIN
                INSERT INTO AdvertParticipants (AdvertId, UserId, JoinedAt) 
                VALUES (${advertId}, ${userId}, GETDATE());
            END
        `;
        try {
            await sequelize.query(query);
            return { advertId, userId };
        } catch (error) {
            console.error('Error in addParticipant:', error);
            throw error;
        }
    }

    async removeParticipant(advertId, userId) {
        const query = `
            DELETE FROM AdvertParticipants
            WHERE AdvertId = ${advertId} AND UserId = ${userId}
        `;
        try {
            await sequelize.query(query);
            return 1;
        } catch (error) {
            console.error('Error in removeParticipant:', error);
            throw error;
        }
    }

    async getParticipantsCount(advertId) {
        const query = `
            SELECT COUNT(*) as count
            FROM AdvertParticipants
            WHERE AdvertId = ${advertId}
        `;
        try {
            const [results] = await sequelize.query(query);
            return results[0].count;
        } catch (error) {
            console.error('Error in getParticipantsCount:', error);
            return 0;
        }
    }

    async isParticipant(advertId, userId) {
        const query = `
            SELECT COUNT(*) as count
            FROM AdvertParticipants
            WHERE AdvertId = ${advertId} AND UserId = ${userId}
        `;
        try {
            const [results] = await sequelize.query(query);
            return results[0].count > 0;
        } catch (error) {
            console.error('Error in isParticipant:', error);
            return false;
        }
    }

    async getParticipants(advertId) {
        const query = `
            SELECT UserId FROM AdvertParticipants WHERE AdvertId = ${advertId}
        `;
        try {
            const [results] = await sequelize.query(query);
            return results || [];
        } catch (error) {
            console.error('Error in getParticipants:', error);
            return [];
        }
    }

    async addSubscriber(advertId, userId) {
        const query = `
            IF NOT EXISTS (SELECT 1 FROM AdvertSubscribers WHERE AdvertId = ${advertId} AND UserId = ${userId})
            BEGIN
                INSERT INTO AdvertSubscribers (AdvertId, UserId, SubscribedAt) 
                VALUES (${advertId}, ${userId}, GETDATE());
            END
        `;
        try {
            await sequelize.query(query);
            return { advertId, userId };
        } catch (error) {
            console.error('Error in addSubscriber:', error);
            throw error;
        }
    }

    async removeSubscriber(advertId, userId) {
        const query = `
            DELETE FROM AdvertSubscribers
            WHERE AdvertId = ${advertId} AND UserId = ${userId}
        `;
        try {
            await sequelize.query(query);
            return 1;
        } catch (error) {
            console.error('Error in removeSubscriber:', error);
            throw error;
        }
    }

    async isSubscriber(advertId, userId) {
        const query = `
            SELECT COUNT(*) as count
            FROM AdvertSubscribers
            WHERE AdvertId = ${advertId} AND UserId = ${userId}
        `;
        try {
            const [results] = await sequelize.query(query);
            return results[0].count > 0;
        } catch (error) {
            console.error('Error in isSubscriber:', error);
            return false;
        }
    }

    async getSubscribers(advertId) {
        const query = `
            SELECT UserId FROM AdvertSubscribers WHERE AdvertId = ${advertId}
        `;
        try {
            const [results] = await sequelize.query(query);
            return results || [];
        } catch (error) {
            console.error('Error in getSubscribers:', error);
            return [];
        }
    }

    async clearSubscribers(advertId) {
        const query = `
            DELETE FROM AdvertSubscribers
            WHERE AdvertId = ${advertId}
        `;
        try {
            await sequelize.query(query);
            return true;
        } catch (error) {
            console.error('Error in clearSubscribers:', error);
            return false;
        }
    }
}

module.exports = new AdvertRepository();