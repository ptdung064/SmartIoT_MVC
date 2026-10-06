function getString(value) {
    return typeof value === 'string' ? value.trim() : '';
}

function parsePositiveInt(value, defaultValue, maxValue = 100) {
    const parsed = Number.parseInt(getString(value), 10);
    if (!Number.isInteger(parsed) || parsed <= 0) return defaultValue;
    return Math.min(parsed, maxValue);
}

function parseNumber(value) {
    const text = getString(value);
    if (!text) return null;
    const parsed = Number(text);
    return Number.isFinite(parsed) ? parsed : null;
}

function roundToTwo(value) {
    return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function parseDate(value) {
    const text = getString(value);
    if (!text) return null;

    const vietnameseDateTime = text.match(
        /^(\d{2})\/(\d{2})\/(\d{4})\s*,?\s*(\d{2}):(\d{2}):(\d{2})$/
    );
    if (vietnameseDateTime) {
        const [, day, month, year, hour, minute, second] = vietnameseDateTime;
        const date = new Date(
            Number(year),
            Number(month) - 1,
            Number(day),
            Number(hour),
            Number(minute),
            Number(second)
        );
        if (
            date.getFullYear() === Number(year) &&
            date.getMonth() === Number(month) - 1 &&
            date.getDate() === Number(day) &&
            date.getHours() === Number(hour) &&
            date.getMinutes() === Number(minute) &&
            date.getSeconds() === Number(second)
        ) {
            return date;
        }
        return null;
    }

    const date = new Date(text);
    return Number.isNaN(date.getTime()) ? null : date;
}

function escapeRegex(text) {
    return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = {
    getString,
    parsePositiveInt,
    parseNumber,
    roundToTwo,
    parseDate,
    escapeRegex
};
