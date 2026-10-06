const DashboardView = {
    charts: {},
    socket: null,
    staleInterval: null,
    lastDataAt: null,

    render() {
        return `
            <section>
                <div class="page-heading">
                    <div>
                        <h2>Dashboard</h2>
                        <p>Giám sát nhiệt độ, độ ẩm, ánh sáng và điều khiển thiết bị theo thời gian thực.</p>
                    </div>
                    <div class="status-line">
                        <span id="realtime-dot" class="status-dot"></span>
                        <span id="realtime-text">Đang kết nối dữ liệu...</span>
                    </div>
                </div>

                <div class="sensor-grid">
                    ${Components.sensorCard('temperature', 'temp', '🌡️', 'Nhiệt độ', '°C')}
                    ${Components.sensorCard('humidity', 'hum', '💧', 'Độ ẩm', '%')}
                    ${Components.sensorCard('light', 'light', '☀️', 'Ánh sáng', 'Lux')}
                </div>

                <div class="chart-grid">
                    ${Components.chartCard('temperature', 'Biểu đồ Nhiệt độ', '°C')}
                    ${Components.chartCard('humidity', 'Biểu đồ Độ ẩm', '%')}
                    ${Components.chartCard('light', 'Biểu đồ Ánh sáng', 'Lux')}
                </div>

                <div class="section-title">
                    <h3>Điều khiển thiết bị</h3>
                    <span class="muted">Phản hồi phần cứng tối đa 10 giây</span>
                </div>

                <div id="device-grid" class="device-grid">
                    <div class="panel muted">Đang tải danh sách thiết bị...</div>
                </div>
            </section>
        `;
    },

    async init() {
        this.createCharts();

        try {
            await Promise.all([
                this.loadLatest(),
                this.loadChartData(),
                this.loadDevices()
            ]);
        } catch (error) {
            Utils.toast(error.message, 'error');
        }

        this.setupSocket();
        this.startStaleChecker();
    },

    destroy() {
        Object.values(this.charts).forEach(chart => chart.destroy());
        this.charts = {};

        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }

        if (this.staleInterval) {
            clearInterval(this.staleInterval);
            this.staleInterval = null;
        }
    },

    createCharts() {
        this.charts.temperature = new SimpleLineChart(
            document.getElementById('chart-temperature'),
            { unit: '°C', color: '#f80820', maxPoints: 50 }
        );

        this.charts.humidity = new SimpleLineChart(
            document.getElementById('chart-humidity'),
            { unit: '%', color: '#2563eb', maxPoints: 50 }
        );

        this.charts.light = new SimpleLineChart(
            document.getElementById('chart-light'),
            { unit: 'Lux', color: '#d97706', maxPoints: 50 }
        );
    },

    async loadLatest() {
        const response = await Api.get('/dashboard/sensors/latest');

        response.data.forEach(item => {
            if (item.value !== null && item.value !== undefined) {
                this.updateSensorValue(item.sensor_type, item.value);
            }

            if (item.recorded_at) {
                const recorded = new Date(item.recorded_at);
                if (!this.lastDataAt || recorded > this.lastDataAt) {
                    this.lastDataAt = recorded;
                }
            }
        });

        this.updateRealtimeState();
    },

    async loadChartData() {
        const response = await Api.get('/dashboard/sensors/chart?limit=50');
        const data = response.data;

        this.charts.temperature.setPoints(data.temperature?.points || []);
        this.charts.humidity.setPoints(data.humidity?.points || []);
        this.charts.light.setPoints(data.light?.points || []);
    },

    async loadDevices() {
        const response = await Api.get('/devices');
        const grid = document.getElementById('device-grid');

        if (!response.data.length) {
            grid.innerHTML = '<div class="panel muted">Chưa có thiết bị.</div>';
            return;
        }

        grid.innerHTML = response.data.map(device => Components.deviceCard(device)).join('');
    },

    setupSocket() {
        this.socket = io();

        this.socket.on('connect', () => {
            this.updateRealtimeState();
        });

        this.socket.on('disconnect', () => {
            const dot = document.getElementById('realtime-dot');
            const text = document.getElementById('realtime-text');
            dot?.classList.add('offline');
            if (text) text.textContent = 'Mất kết nối realtime với server';
        });

        this.socket.on('sensor:update', data => {
            if (!document.getElementById('sensor-value-temperature')) return;

            this.lastDataAt = new Date(data.recorded_at || Date.now());

            this.updateSensorValue('temperature', data.temperature);
            this.updateSensorValue('humidity', data.humidity);
            this.updateSensorValue('light', data.light);

            this.charts.temperature?.push(data.temperature, this.lastDataAt);
            this.charts.humidity?.push(data.humidity, this.lastDataAt);
            this.charts.light?.push(data.light, this.lastDataAt);

            this.updateRealtimeState();
        });

        this.socket.on('device:status', data => {
            this.applyDeviceStatus(data);
        });
    },

    startStaleChecker() {
        this.staleInterval = setInterval(() => this.updateRealtimeState(), 5000);
    },

    updateRealtimeState() {
        const dot = document.getElementById('realtime-dot');
        const text = document.getElementById('realtime-text');
        if (!dot || !text) return;

        const isStale = !this.lastDataAt || Date.now() - this.lastDataAt.getTime() > 30000;

        dot.classList.toggle('offline', isStale);

        if (!this.lastDataAt) {
            text.textContent = 'Chưa nhận được dữ liệu cảm biến';
        } else if (isStale) {
            text.textContent = 'Đang mất kết nối với thiết bị';
        } else {
            text.textContent = `Realtime • ${Utils.formatDateTime(this.lastDataAt)}`;
        }
    },

    updateSensorValue(type, value) {
        const el = document.getElementById(`sensor-value-${type}`);
        if (!el || !Number.isFinite(Number(value))) return;

        el.textContent = Number(value).toFixed(2);
    },

    async handleToggle(deviceId, input) {
        const oldChecked = !input.checked;
        const action = input.checked ? 'ON' : 'OFF';
        const statusEl = document.getElementById(`device-status-${deviceId}`);

        input.disabled = true;
        if (statusEl) {
            statusEl.textContent = 'LOADING';
            statusEl.className = 'device-status loading';
        }

        try {
            await Api.post(`/devices/${encodeURIComponent(deviceId)}/control`, { action });
            Utils.toast(`Đã gửi lệnh ${action} tới ${deviceId}`, 'success');
        } catch (error) {
            input.checked = oldChecked;
            input.disabled = false;

            if (statusEl) {
                statusEl.textContent = oldChecked ? 'ON' : 'OFF';
                statusEl.className = `device-status ${oldChecked ? 'on' : 'off'}`;
            }

            Utils.toast(error.message, 'error');
        }
    },

    applyDeviceStatus(data) {
        const input = document.getElementById(`device-toggle-${data.device_id}`);
        const statusEl = document.getElementById(`device-status-${data.device_id}`);
        if (!input || !statusEl) return;

        input.disabled = false;

        if (data.status === 'success' && ['ON', 'OFF'].includes(data.current_status)) {
            input.checked = data.current_status === 'ON';
            statusEl.textContent = data.current_status;
            statusEl.className = `device-status ${data.current_status.toLowerCase()}`;
            Utils.toast(`${data.device_id}: ${data.action} thành công`, 'success');
            return;
        }

        if (data.status === 'timeout') {
            statusEl.textContent = 'TIMEOUT';
            statusEl.className = 'device-status unknown';
            Utils.toast(`${data.device_id}: thiết bị không phản hồi`, 'warning');
            return;
        }

        if (data.status === 'fail') {
            input.checked = !input.checked;
            statusEl.textContent = 'ERROR';
            statusEl.className = 'device-status unknown';
            Utils.toast(`${data.device_id}: thao tác thất bại`, 'error');
        }
    }
};
