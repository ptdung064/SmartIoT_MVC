const { verify } = require('../utils/jwt');
const User = require('../models/User');

async function requireAuth(req, res, next) {
    try {
        const header = req.headers.authorization || '';
        const [scheme, token] = header.split(' ');

        if (scheme !== 'Bearer' || !token) {
            return res.status(401).json({
                success: false,
                error: { code: 'UNAUTHORIZED', message: 'Vui lòng đăng nhập' }
            });
        }

        const payload = verify(token);
        const user = await User.findById(payload.sub);

        if (!user) {
            return res.status(401).json({
                success: false,
                error: { code: 'USER_NOT_FOUND', message: 'Tài khoản không tồn tại' }
            });
        }

        req.user = user;
        req.tokenPayload = payload;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            error: { code: 'INVALID_TOKEN', message: error.message || 'Token không hợp lệ' }
        });
    }
}

module.exports = { requireAuth };
