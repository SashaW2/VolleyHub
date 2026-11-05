const app = require('./src/app');
const sequelize = require('./src/config/database');
const cron = require('node-cron');
const advertService = require('./src/services/advertService');
const advertRepository = require('./src/repositories/advertRepository');
const notificationService = require('./src/services/notificationService');
require('dotenv').config();

const PORT = 5000;

const startServer = async () => {
    try {
        await sequelize.authenticate();
        await sequelize.sync({ alter: false });

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });

        cron.schedule('* * * * *', async () => {
            try {
                const now = new Date();
                const allAdverts = await advertService.getAllAdverts({});

                if (!allAdverts) return;

                for (const advert of allAdverts) {
                    if (advert.twoHourNotificationSent) continue;

                    let hours, minutes, displayTime;
                    const rawTime = advert.startTime;

                    if (rawTime instanceof Date) {
                        hours = rawTime.getUTCHours();
                        minutes = rawTime.getUTCMinutes();
                    } else if (typeof rawTime === 'string') {
                        const parts = rawTime.split(':');
                        hours = parseInt(parts[0], 10);
                        minutes = parseInt(parts[1], 10);
                    } else {
                        continue;
                    }

                    displayTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

                    const eventDateTime = new Date(advert.date);
                    eventDateTime.setHours(hours, minutes, 0, 0);

                    const twoHoursBefore = new Date(eventDateTime.getTime() - 2 * 60 * 60 * 1000);

                    if (now >= twoHoursBefore && now < eventDateTime) {
                        const participantsRaw = await advertRepository.getParticipants(advert.id);
                        const participantIds = participantsRaw
                            .map(p => p.UserId || p.userId)
                            .filter(id => id);

                        if (participantIds.length > 0) {
                            const timeLeft = eventDateTime - now;
                            const totalMinutes = Math.floor(timeLeft / (60 * 1000));
                            const h = Math.floor(totalMinutes / 60);
                            const m = totalMinutes % 60;
                            const timeInfo = h > 0 ? `${h} час. ${m} мин.` : `${m} мин.`;

                            let notificationText = `Игра начнётся через ${timeInfo}!\nАдрес: ${advert.address}\nНачало в ${displayTime}`;

                            if (participantIds.length < advert.peopleCount) {
                                notificationText += `\nУчастников: ${participantIds.length}/${advert.peopleCount}\nВы можете отписаться в течение следующего часа`;
                            }

                            await notificationService.sendBulkNotification(
                                participantIds,
                                notificationText,
                                'reminder'
                            );

                            await advertRepository.update(advert.id, { twoHourNotificationSent: true });
                        }
                    }
                }
            } catch (error) {
                console.error('Cron job error:', error);
            }
        });

    } catch (error) {
        console.error('Unable to start server:', error.message);
        process.exit(1);
    }
};

startServer();