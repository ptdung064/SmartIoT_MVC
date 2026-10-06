const { hashPassword, verifyPassword } = require('../utils/password');

function toProfile(user) {
    return {
        id: String(user._id),
        username: user.username,
        full_name: user.full_name,
        student_id: user.student_id,
        class_name: user.class_name,
        email: user.email,
        avatar_url: user.avatar_url,
        github_url: user.github_url,
        figma_url: user.figma_url,
        postman_url: user.postman_url,
        report_url: user.report_url,
        created_at: user.created_at
    };
}

async function getProfile(req, res) {
    res.json({ success: true, data: toProfile(req.user) });
}

async function updateProfile(req, res) {
    const allowedFields = [
        'full_name',
        'student_id',
        'class_name',
        'email',
        'avatar_url',
        'github_url',
        'figma_url',
        'postman_url',
        'report_url'
    ];

    for (const field of allowedFields) {
        if (typeof req.body?.[field] === 'string') {
            req.user[field] = req.body[field].trim();
        }
    }

    if (req.user.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.user.email)) {
        return res.status(400).json({
            success: false,
            error: { code: 'INVALID_EMAIL', message: 'Email không đúng định dạng' }
        });
    }

    await req.user.save();

    res.json({
        success: true,
        message: 'Cập nhật profile thành công',
        data: toProfile(req.user)
    });
}

async function changePassword(req, res) {
    const currentPassword = typeof req.body?.current_password === 'string' ? req.body.current_password : '';
    const newPassword = typeof req.body?.new_password === 'string' ? req.body.new_password : '';

    if (!verifyPassword(currentPassword, req.user.password_hash)) {
        return res.status(400).json({
            success: false,
            error: { code: 'WRONG_PASSWORD', message: 'Mật khẩu hiện tại không đúng' }
        });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({
            success: false,
            error: { code: 'WEAK_PASSWORD', message: 'Mật khẩu mới phải có ít nhất 6 ký tự' }
        });
    }

    req.user.password_hash = hashPassword(newPassword);
    await req.user.save();

    res.json({ success: true, message: 'Đổi mật khẩu thành công' });
}

async function updateAvatar(req, res) {
    const avatarUrl = typeof req.body?.avatar_url === 'string' ? req.body.avatar_url.trim() : '';
    if (!avatarUrl) {
        return res.status(400).json({
            success: false,
            error: { code: 'MISSING_AVATAR_URL', message: 'Vui lòng nhập avatar_url' }
        });
    }

    req.user.avatar_url = avatarUrl;
    await req.user.save();

    res.json({
        success: true,
        message: 'Cập nhật ảnh đại diện thành công',
        data: { avatar_url: req.user.avatar_url }
    });
}

module.exports = { getProfile, updateProfile, changePassword, updateAvatar };
