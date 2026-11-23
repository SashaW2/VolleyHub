const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();

const TelegramLink = require('../models/TelegramLink');
const userRepository = require('../repositories/userRepository');
const sseHub = require('../utils/sseHub');

const POLL_TIMEOUT_SECONDS = 30;
const POLL_REQUEST_TIMEOUT_MS = (POLL_TIMEOUT_SECONDS + 30) * 1000;
const REQUEST_TIMEOUT_MS = (POLL_TIMEOUT_SECONDS + 10) * 1000;
const LINK_TOKEN_TTL_MS = 15 * 60 * 1000;
const ADMIN_PREFIX = /^\[АДМИН\]\s*/;
const ADMIN_HEADER = /^\[Администратор\]\s*/;

const escapeHtml = (value) => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

class TelegramService {
    constructor() {
        this.token = process.env.TELEGRAM_BOT_TOKEN || '';
        this.apiBase = this.token ? `https://api.telegram.org/bot${this.token}` : '';
        this.botUsername = process.env.TELEGRAM_BOT_USERNAME || '';
        this.offset = 0;
        this.polling = false;
        this.consecutiveTimeouts = 0;
        this.pendingLinks = new Map();
    }

    isEnabled() {
        return Boolean(this.token);
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async api(method, payload = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
        const response = await axios.post(`${this.apiBase}/${method}`, payload, {
            timeout: timeoutMs
        });
        return response.data?.result;
    }

    async init() {
        if (!this.isEnabled()) {
            console.log('Telegram bot disabled: TELEGRAM_BOT_TOKEN is not set');
            return;
        }

        try {
            const me = await this.getBotUsername();
            console.log(`Telegram bot @${me} started (long polling)`);
            this.startPolling().catch(error => {
                console.error('Telegram polling stopped:', error.message);
            });
        } catch (error) {
            console.error(
                'Telegram bot failed to start:',
                error.response?.data?.description || error.message
            );
        }
    }

    stopPolling() {
        this.polling = false;
    }

    async getBotUsername() {
        if (this.botUsername) return this.botUsername;
        const me = await this.api('getMe');
        this.botUsername = me.username || '';
        return this.botUsername;
    }

    async startPolling() {
        if (this.polling) return;
        this.polling = true;

        while (this.polling) {
            try {
                const updates = await this.api('getUpdates', {
                    offset: this.offset,
                    timeout: POLL_TIMEOUT_SECONDS,
                    allowed_updates: ['message']
                }, POLL_REQUEST_TIMEOUT_MS);

                this.consecutiveTimeouts = 0;

                for (const update of updates || []) {
                    this.offset = Math.max(this.offset, update.update_id + 1);
                    this.handleUpdate(update).catch(error => {
                        console.error('Telegram update error:', error.message);
                    });
                }
            } catch (error) {
                const description = error.response?.data?.description || error.message;

                if (error.response?.status === 409) {
                    console.error('Telegram polling stopped: a webhook is set for this bot. Remove it with deleteWebhook to use long polling.');
                    this.polling = false;
                    return;
                }

                if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
                    this.consecutiveTimeouts += 1;
                    if (this.consecutiveTimeouts === 1 || this.consecutiveTimeouts % 20 === 0) {
                        console.warn(
                            `Telegram getUpdates timeout (${this.consecutiveTimeouts} подряд), продолжаю опрос`
                        );
                    }
                    continue;
                }

                console.error('Telegram polling error:', description);
                await this.sleep(5000);
            }
        }
    }

    async handleUpdate(update) {
        const message = update.message;
        if (!message || !message.chat || !message.text) return;

        const chatId = String(message.chat.id);
        const username = message.from?.username || '';
        const text = message.text.trim();
        const [command, argument] = text.split(/\s+/);

        if (command === '/start' || command.startsWith('/start@')) {
            if (!argument) {
                return this.resumeChat(chatId, username);
            }
            return this.linkChat(chatId, username, argument);
        }

        if (command === '/stop' || command.startsWith('/stop@')) {
            return this.pauseChat(chatId);
        }

        if (command === '/help' || command.startsWith('/help@')) {
            return this.sendToChat(chatId, [
                'Volley Hub присылает сюда уведомления о ваших играх: напоминания о начале, сообщения администратора и системные события.',
                '',
                '/stop – приостановить уведомления (привязка сохраняется)',
                '/start – снова включить уведомления',
                '',
                'Привязать аккаунт можно в разделе «Профиль» на сайте.'
            ].join('\n'));
        }

        return;
    }

    async linkChat(chatId, username, token) {
        const userId = this.consumePendingToken(token);
        if (!userId) {
            return this.sendToChat(chatId, 'Ссылка для привязки недействительна или устарела. Сгенерируйте новую в профиле на сайте.');
        }

        const user = await userRepository.findById(userId);
        if (!user) {
            return this.sendToChat(chatId, 'Аккаунт Volley Hub не найден. Возможно, он был удалён.');
        }

        const existingLink = await TelegramLink.findOne({ where: { userId } });
        if (existingLink && String(existingLink.chatId) !== chatId) {
            return this.sendToChat(chatId, 'Этот аккаунт уже привязан к другому Telegram. Сначала отвяжите его в профиле на сайте.');
        }

        const chatLink = await TelegramLink.findOne({ where: { chatId } });
        let previousUserId = null;
        let previousUser = null;
        if (chatLink && chatLink.userId !== userId) {
            previousUserId = chatLink.userId;
            previousUser = await userRepository.findById(previousUserId);
            await chatLink.destroy();
        }

        let link;
        if (existingLink) {
            link = await existingLink.update({ username, linkedDate: new Date(), notificationsEnabled: true });
        } else {
            link = await TelegramLink.create({
                userId,
                chatId,
                username,
                linkedDate: new Date(),
                notificationsEnabled: true
            });
        }

        this.notifyStatusChanged(link);

        if (previousUserId) {
            sseHub.send(previousUserId, 'telegram', {
                linked: false,
                username: '',
                paused: false
            });

            await this.sendToChat(
                chatId,
                previousUser?.email
                    ? `Этот Telegram был отвязан от аккаунта ${previousUser.email}, так как вы привязали его к другому аккаунту Volley Hub.`
                    : 'Этот Telegram был отвязан от предыдущего аккаунта Volley Hub, так как вы привязали его к другому аккаунту.'
            );
        }

        return this.sendToChat(
            chatId,
            `Готово! Уведомления Volley Hub для аккаунта ${user.email} теперь приходят сюда.\nПриостановить их можно командой /stop, включить снова – /start.`
        );
    }

    async pauseChat(chatId) {
        const link = await TelegramLink.findOne({ where: { chatId } });
        if (!link) {
            return this.sendToChat(chatId, 'Этот Telegram не привязан к аккаунту Volley Hub. Привяжите его в разделе «Профиль» на сайте.');
        }
        if (!link.notificationsEnabled) {
            return this.sendToChat(chatId, 'Уведомления уже приостановлены. Отправьте /start, чтобы включить их снова.');
        }

        await link.update({ notificationsEnabled: false });
        this.notifyStatusChanged(link);
        return this.sendToChat(
            chatId,
            'Уведомления приостановлены. Привязка аккаунта сохранена – отправьте /start, когда захотите получать их снова.'
        );
    }

    async resumeChat(chatId, username) {
        const link = await TelegramLink.findOne({ where: { chatId } });
        if (!link) {
            return this.sendToChat(chatId, 'Этот Telegram не привязан к аккаунту Volley Hub. Привяжите его в разделе «Профиль» на сайте.');
        }

        if (link.notificationsEnabled) {
            return this.sendToChat(chatId, 'Уведомления Volley Hub уже включены. Приостановить их можно командой /stop.');
        }

        await link.update({
            notificationsEnabled: true,
            username: username || link.username
        });
        this.notifyStatusChanged(link);
        return this.sendToChat(chatId, 'Уведомления Volley Hub снова включены. Приостановить их можно командой /stop.');
    }

    notifyStatusChanged(link) {
        if (!link) return;
        sseHub.send(link.userId, 'telegram', {
            linked: true,
            username: link.username || '',
            paused: Boolean(link.notificationsEnabled) === false
        });
    }

    async getLink(userId) {
        return await TelegramLink.findOne({ where: { userId } });
    }

    async setNotificationsEnabled(userId, enabled) {
        const link = await TelegramLink.findOne({ where: { userId } });
        if (!link) return null;

        if (Boolean(link.notificationsEnabled) !== enabled) {
            await link.update({ notificationsEnabled: enabled });
            this.notifyStatusChanged(link);

            this.sendToChat(
                link.chatId,
                enabled
                    ? 'Уведомления Volley Hub снова включены. Приостановить их можно в разделе «Профиль» на сайте или командой /stop.'
                    : 'Уведомления Volley Hub приостановлены в разделе «Профиль» на сайте. Включить их снова можно там же или командой /start.'
            ).catch(error => {
                console.error('Telegram status message error:', error.message);
            });
        }
        return link;
    }

    async unlinkUser(userId, message) {
        const link = await TelegramLink.findOne({ where: { userId } });
        if (!link) return 0;

        const removed = await TelegramLink.destroy({ where: { userId } });
        if (removed) {
            await this.sendToChat(
                link.chatId,
                message || 'Аккаунт Volley Hub отвязан от этого Telegram, уведомления больше не приходят.\nЧтобы привязать снова, нажмите «Привязать Telegram» в разделе «Профиль» на сайте.'
            );
        }
        return removed;
    }

    createPendingToken(userId) {
        for (const [token, entry] of this.pendingLinks) {
            if (entry.expiresAt <= Date.now() || entry.userId === userId) {
                this.pendingLinks.delete(token);
            }
        }

        const token = crypto.randomBytes(24).toString('base64url');
        this.pendingLinks.set(token, { userId, expiresAt: Date.now() + LINK_TOKEN_TTL_MS });
        return token;
    }

    consumePendingToken(token) {
        const entry = this.pendingLinks.get(token);
        if (!entry) return null;

        this.pendingLinks.delete(token);
        if (entry.expiresAt <= Date.now()) return null;

        return entry.userId;
    }

    async createLinkUrl(userId) {
        if (!this.isEnabled()) {
            throw new Error('Telegram-бот не настроен');
        }

        const botUsername = await this.getBotUsername();
        if (!botUsername) {
            throw new Error('Не удалось определить имя Telegram-бота');
        }

        const token = this.createPendingToken(userId);

        return `https://t.me/${botUsername}?start=${token}`;
    }

    formatNotification(text, notificationType) {
        const raw = String(text);
        const isAdminNotification = notificationType === 'admin';
        const adminBody = isAdminNotification ? raw.replace(ADMIN_PREFIX, '') : raw.replace(ADMIN_HEADER, '');

        if (isAdminNotification || ADMIN_HEADER.test(raw)) {
            return {
                text: `<b>[Администратор]</b>\n\n${escapeHtml(adminBody.trim())}`,
                parseMode: 'HTML'
            };
        }

        return { text, parseMode: undefined };
    }

    async sendToUser(userId, text, options = {}) {
        if (!this.isEnabled() || !text) return false;

        try {
            const link = await this.getLink(userId);
            if (!link || !link.notificationsEnabled) return false;

            const { text: message, parseMode } = this.formatNotification(text, options.notificationType);
            return await this.sendToChat(link.chatId, message, 1, parseMode);
        } catch (error) {
            console.error('Telegram sendToUser error:', error.message);
            return false;
        }
    }

    async sendBulkToUsers(userIds, text, options = {}) {
        for (const userId of userIds) {
            await this.sendToUser(userId, text, options);
        }
    }

    async sendToChat(chatId, text, attempt = 1, parseMode) {
        if (!this.isEnabled() || !chatId || !text) return false;

        try {
            const payload = {
                chat_id: String(chatId),
                text,
                disable_web_page_preview: true
            };
            if (parseMode) payload.parse_mode = parseMode;

            await this.api('sendMessage', payload);
            return true;
        } catch (error) {
            const status = error.response?.status;
            const data = error.response?.data;

            if (status === 429 && attempt <= 2) {
                const retryAfter = data?.parameters?.retry_after || 1;
                await this.sleep(retryAfter * 1000);
                return this.sendToChat(chatId, text, attempt + 1, parseMode);
            }

            if (status === 403) {
                try {
                    const blockedLink = await TelegramLink.findOne({ where: { chatId: String(chatId) } });
                    await TelegramLink.destroy({ where: { chatId: String(chatId) } });
                    if (blockedLink) {
                        sseHub.send(blockedLink.userId, 'telegram', {
                            linked: false,
                            username: '',
                            paused: false
                        });
                    }
                } catch (destroyError) {
                    console.error('Telegram unlink error:', destroyError.message);
                }
            }

            console.error('Telegram sendMessage error:', data?.description || error.message);
            return false;
        }
    }
}

module.exports = new TelegramService();
