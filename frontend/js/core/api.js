const Api = {
    baseUrl: '/api/v1',
    tokenKey: 'iot_token',
    userKey: 'iot_user',

    getToken() {
        return localStorage.getItem(this.tokenKey);
    },

    setSession(data) {
        localStorage.setItem(this.tokenKey, data.token);
        localStorage.setItem(this.userKey, JSON.stringify(data.user || {}));
    },

    clearSession() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
    },

    getStoredUser() {
        try {
            return JSON.parse(localStorage.getItem(this.userKey) || '{}');
        } catch {
            return {};
        }
    },

    async request(path, options = {}) {
        const headers = {
            ...(options.body ? { 'Content-Type': 'application/json' } : {}),
            ...(options.headers || {})
        };

        const token = this.getToken();
        if (token) headers.Authorization = `Bearer ${token}`;

        const response = await fetch(`${this.baseUrl}${path}`, {
            ...options,
            headers
        });

        let payload = null;
        try {
            payload = await response.json();
        } catch {
            payload = { success: false, error: { message: 'Server trả về dữ liệu không hợp lệ' } };
        }

        if (response.status === 401 && !path.includes('/auth/login')) {
            this.clearSession();
            window.location.href = '/login.html';
            throw new Error('Phiên đăng nhập đã hết hạn');
        }

        if (!response.ok || payload?.success === false) {
            const message = payload?.error?.message || payload?.message || `HTTP ${response.status}`;
            const error = new Error(message);
            error.status = response.status;
            error.payload = payload;
            throw error;
        }

        return payload;
    },

    get(path) {
        return this.request(path);
    },

    post(path, data) {
        return this.request(path, {
            method: 'POST',
            body: JSON.stringify(data ?? {})
        });
    },

    put(path, data) {
        return this.request(path, {
            method: 'PUT',
            body: JSON.stringify(data ?? {})
        });
    },

    patch(path, data) {
        return this.request(path, {
            method: 'PATCH',
            body: JSON.stringify(data ?? {})
        });
    }
};
