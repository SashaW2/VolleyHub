const authService = require('../services/authService');
const userRepository = require('../repositories/userRepository');

class AuthController {
    async register(req, res) {
        try {
            const userData = req.body;

            const levelMap = {
                'D1': 1, 'D2': 2, 'D3': 3, 'D4': 4, 'D4Plus': 5
            };

            if (userData.gameLevel && typeof userData.gameLevel === 'string') {
                userData.gameLevel = levelMap[userData.gameLevel] || 2;
            }

            const { user, token } = await authService.register(userData);

            const responseUser = {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                gameLevel: user.gameLevel,
                language: user.language,
                theme: user.theme,
                isAdmin: user.roleId === 2
            };

            res.status(201).json({ success: true, user: responseUser, token });
        } catch (error) {
            console.error('Register error:', error);
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async login(req, res) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ success: false, message: 'Email и пароль обязательны' });
            }

            const { user, token } = await authService.login(email, password);

            const responseUser = {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                gameLevel: user.gameLevel,
                language: user.language,
                theme: user.theme,
                isAdmin: user.roleId === 2
            }

            res.json({ success: true, user: responseUser, token });
        } catch (error) {
            console.error('Login error:', error.message);
            res.status(401).json({
                success: false,
                message: error.message || 'Неверный email или пароль'
            });
        }
    }

    async me(req, res) {
        try {
            const user = await userRepository.findById(req.user.id);
            const { password: _, ...userWithoutPassword } = user.toJSON();
            res.json({ success: true, user: { ...userWithoutPassword, isAdmin: user.roleId === 2 } });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new AuthController();