const userRepository = require('../repositories/userRepository');
const authService = require('../services/authService');
const bcrypt = require('bcryptjs');

class UserController {
    async getAll(req, res) {
        try {
            const users = await userRepository.findAll(req.query);
            const usersWithoutPassword = users.map(user => {
                const { password, ...rest } = user.toJSON();
                return rest;
            });
            res.json({ success: true, users: usersWithoutPassword });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getById(req, res) {
        try {
            const user = await userRepository.findById(req.params.id);
            if (!user) {
                return res.status(404).json({ success: false, message: 'Пользователь не найден' });
            }
            const { password, ...userWithoutPassword } = user.toJSON();
            res.json({ success: true, user: userWithoutPassword });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async updateProfile(req, res) {
        try {
            const { name, email, phone, gameLevel, language, theme } = req.body;

            if (email) {
                const existingUser = await userRepository.findByEmail(email);
                if (existingUser && existingUser.id !== req.user.id) {
                    return res.status(400).json({
                        success: false,
                        message: 'Пользователь с таким email уже существует'
                    });
                }
            }

            let levelValue = gameLevel;
            const levelMap = {
                'D1': 1, 'D2': 2, 'D3': 3, 'D4': 4, 'D4Plus': 5
            };

            if (typeof gameLevel === 'string' && levelMap[gameLevel]) {
                levelValue = levelMap[gameLevel];
            }

            const updateData = {
                name,
                email,
                phone: phone || null,
                gameLevel: levelValue,
                language: language || 'ru',
                theme: theme || 'light'
            };

            const updatedUser = await userRepository.update(req.user.id, updateData);

            if (!updatedUser) {
                return res.status(404).json({ success: false, message: 'Пользователь не найден' });
            }

            const { password, ...userWithoutPassword } = updatedUser.toJSON();

            const reverseLevelMap = { 1: 'D1', 2: 'D2', 3: 'D3', 4: 'D4', 5: 'D4Plus' };
            userWithoutPassword.gameLevel = reverseLevelMap[userWithoutPassword.gameLevel] || 'D2';

            res.json({ success: true, user: userWithoutPassword });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async changePassword(req, res) {
        try {
            const { currentPassword, newPassword } = req.body;
            const user = await userRepository.findById(req.user.id);

            const isValid = await user.comparePassword(currentPassword);
            if (!isValid) {
                return res.status(400).json({ success: false, message: 'Неверный текущий пароль' });
            }

            if (newPassword.length < 8) {
                return res.status(400).json({ success: false, message: 'Пароль должен содержать минимум 8 символов' });
            }

            await userRepository.update(req.user.id, { password: newPassword });
            res.json({ success: true, message: 'Пароль успешно изменен' });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async deleteAccount(req, res) {
        try {
            await userRepository.delete(req.user.id);
            res.json({ success: true, message: 'Аккаунт удален' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async blockUser(req, res) {
        try {
            const user = await userRepository.update(req.params.id, { isBlocked: true });
            if (!user) {
                return res.status(404).json({ success: false, message: 'Пользователь не найден' });
            }
            res.json({ success: true, message: 'Пользователь заблокирован' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async unblockUser(req, res) {
        try {
            const user = await userRepository.update(req.params.id, { isBlocked: false });
            if (!user) {
                return res.status(404).json({ success: false, message: 'Пользователь не найден' });
            }
            res.json({ success: true, message: 'Пользователь разблокирован' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new UserController();