const User = require('../models/User');
const { verifyPassword } = require('../utils/password');
const { sign } = require('../utils/jwt');

async function login(req, res) {
    const username = typeof req.body?.username === 'string' ? req.body.username.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!username || !password) {
        return res.status(400).json({
            success: false,
            error: { code: 'MISSING_CREDENTIALS', message: 'Thiếu username hoặc password' }
        });
    }

    const user = await User.findOne({ username });

    if (!user || !verifyPassword(password, user.password_hash)) {
        return res.status(401).json({
            success: false,
            error: { code: 'INVALID_CREDENTIALS', message: 'Username hoặc mật khẩu không đúng' }
        });
    }

    const expiresIn = Number(process.env.JWT_EXPIRES_IN_SECONDS || 86400);
    const token = sign({ sub: String(user._id), username: user.username }, { expiresIn });

    res.json({
        success: true,
        data: {
            token,
            token_type: 'Bearer',
            expires_in: expiresIn,
            user: {
                id: String(user._id),
                username: user.username,
                full_name: user.full_name
            }
        }
    });
}

async function logout(req, res) {
    res.json({ success: true, message: 'Đăng xuất thành công' });
}

module.exports = { login, logout };
