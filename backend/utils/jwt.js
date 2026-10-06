const crypto = require('crypto');

function base64UrlEncode(value) {
    return Buffer.from(value)
        .toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}

function base64UrlDecode(value) {
    value = value.replace(/-/g, '+').replace(/_/g, '/');
    while (value.length % 4) value += '=';
    return Buffer.from(value, 'base64').toString('utf8');
}

function sign(payload, options = {}) {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET chưa được cấu hình');

    const expiresIn = Number(options.expiresIn || process.env.JWT_EXPIRES_IN_SECONDS || 86400);
    const now = Math.floor(Date.now() / 1000);

    const header = { alg: 'HS256', typ: 'JWT' };
    const body = {
        ...payload,
        iat: now,
        exp: now + expiresIn
    };

    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedBody = base64UrlEncode(JSON.stringify(body));
    const unsignedToken = `${encodedHeader}.${encodedBody}`;

    const signature = crypto
        .createHmac('sha256', secret)
        .update(unsignedToken)
        .digest('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');

    return `${unsignedToken}.${signature}`;
}

function verify(token) {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET chưa được cấu hình');

    const parts = String(token || '').split('.');
    if (parts.length !== 3) throw new Error('Token không hợp lệ');

    const [encodedHeader, encodedBody, signature] = parts;
    const unsignedToken = `${encodedHeader}.${encodedBody}`;

    const expected = crypto
        .createHmac('sha256', secret)
        .update(unsignedToken)
        .digest('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');

    const givenBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);

    if (
        givenBuffer.length !== expectedBuffer.length ||
        !crypto.timingSafeEqual(givenBuffer, expectedBuffer)
    ) {
        throw new Error('Chữ ký token không hợp lệ');
    }

    const payload = JSON.parse(base64UrlDecode(encodedBody));
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < now) {
        throw new Error('Token đã hết hạn');
    }

    return payload;
}

module.exports = { sign, verify };
