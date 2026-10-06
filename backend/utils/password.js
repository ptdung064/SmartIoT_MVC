const crypto = require('crypto');

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
    return `${salt}:${hash}`;
}

function verifyPassword(password, storedValue) {
    try {
        const [salt, storedHash] = String(storedValue || '').split(':');
        if (!salt || !storedHash) return false;

        const calculatedHash = crypto.scryptSync(String(password), salt, 64);
        const storedBuffer = Buffer.from(storedHash, 'hex');

        return (
            calculatedHash.length === storedBuffer.length &&
            crypto.timingSafeEqual(calculatedHash, storedBuffer)
        );
    } catch {
        return false;
    }
}

module.exports = { hashPassword, verifyPassword };
