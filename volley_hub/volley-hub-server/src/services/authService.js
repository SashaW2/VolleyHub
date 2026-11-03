const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');
require('dotenv').config();

class AuthService {
    generateToken(user) {
        return jwt.sign(
            { id: user.id, email: user.email, roleId: user.roleId, isBlocked: user.isBlocked },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );
    }

    async login(email, password) {
        const user = await userRepository.findByEmail(email);
        if (!user) {
            throw new Error('Пользователь не найден');
        }

        if (user.isBlocked) {
            throw new Error('Вы были заблокированы');
        }

        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            throw new Error('Неверный пароль');
        }

        const token = this.generateToken(user);
        const { password: _, ...userWithoutPassword } = user.toJSON();

        return { user: userWithoutPassword, token };
    }

    async register(userData) {
        const existingUser = await userRepository.findByEmail(userData.email);
        if (existingUser) {
            throw new Error('Пользователь с таким email уже существует');
        }

        const user = await userRepository.create({ ...userData, roleId: 1 });
        const token = this.generateToken(user);
        const { password: _, ...userWithoutPassword } = user.toJSON();

        return { user: userWithoutPassword, token };
    }

    verifyToken(token) {
        try {
            return jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            return null;
        }
    }
}

module.exports = new AuthService();