const Utils = {
    escapeHtml(value) {
        return String(value ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    },

    formatDateTime(value) {
        if (!value) return '--';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '--';

        const pad = number => String(number).padStart(2, '0');
        return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ` +
            `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    },

    shortId(id) {
        const text = String(id || '');
        return text.length > 8 ? text.slice(-8).toUpperCase() : text.toUpperCase();
    },

    exactSecondRange(datetimeValue) {
        if (!datetimeValue) return null;

        const match = String(datetimeValue).trim().match(
            /^(\d{2})\/(\d{2})\/(\d{4})\s*,?\s*(\d{2}):(\d{2}):(\d{2})$/
        );
        if (!match) return null;

        const [, day, month, year, hour, minute, second] = match;
        const start = new Date(
            Number(year),
            Number(month) - 1,
            Number(day),
            Number(hour),
            Number(minute),
            Number(second)
        );
        if (
            start.getFullYear() !== Number(year) ||
            start.getMonth() !== Number(month) - 1 ||
            start.getDate() !== Number(day) ||
            start.getHours() !== Number(hour) ||
            start.getMinutes() !== Number(minute) ||
            start.getSeconds() !== Number(second)
        ) {
            return null;
        }

        const end = new Date(start.getTime() + 999);
        return {
            from: start.toISOString(),
            to: end.toISOString()
        };
    },

    minuteRange(datetimeLocalValue) {
        return this.exactSecondRange(datetimeLocalValue);
    },

    queryString(params) {
        const search = new URLSearchParams();

        Object.entries(params).forEach(([key, value]) => {
            if (value !== '' && value !== null && value !== undefined) {
                search.set(key, String(value));
            }
        });

        const text = search.toString();
        return text ? `?${text}` : '';
    },

    toast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const item = document.createElement('div');
        item.className = `toast ${type}`;
        item.textContent = message;
        container.appendChild(item);

        setTimeout(() => item.remove(), 3200);
    },

    setLoading(button, loading, text = 'Đang xử lý...') {
        if (!button) return;

        if (loading) {
            button.dataset.originalText = button.textContent;
            button.textContent = text;
            button.disabled = true;
        } else {
            button.textContent = button.dataset.originalText || button.textContent;
            button.disabled = false;
        }
    }
};
