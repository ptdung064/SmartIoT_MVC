const Components = {
    sensorCard(id, className, icon, name, unit) {
        return `
            <article class="card sensor-card ${className}">
                <div class="sensor-icon">${icon}</div>
                <div>
                    <div class="sensor-name">${name}</div>
                    <div>
                        <span id="sensor-value-${id}" class="sensor-value">--</span>
                        <span class="sensor-unit">${unit}</span>
                    </div>
                </div>
            </article>
        `;
    },

    chartCard(id, title, unit) {
        return `
            <article class="card chart-card">
                <div class="chart-title">
                    <h3>${title}</h3>
                    <span>${unit}</span>
                </div>
                <div class="chart-wrap">
                    <canvas id="chart-${id}"></canvas>
                </div>
            </article>
        `;
    },

    deviceCard(device) {
        const isOn = device.current_status === 'ON';
        const statusClass = String(device.current_status || 'UNKNOWN').toLowerCase();

        return `
            <article class="card device-card" data-device-card="${Utils.escapeHtml(device.id)}">
                <div class="device-info">
                    <img class="device-image" src="/css/led.avif" alt="Đèn LED">
                    <div>
                        <div class="device-name">
                            <span class="device-icon" aria-hidden="true"><i class="fa-regular fa-lightbulb"></i></span>
                            <span>${Utils.escapeHtml(device.name)}</span>
                        </div>
                        <div id="device-status-${Utils.escapeHtml(device.id)}" class="device-status ${statusClass}">
                            ${Utils.escapeHtml(device.current_status || 'UNKNOWN')}
                        </div>
                    </div>
                </div>

                <label class="switch" aria-label="Bật tắt ${Utils.escapeHtml(device.name)}">
                    <input
                        id="device-toggle-${Utils.escapeHtml(device.id)}"
                        type="checkbox"
                        ${isOn ? 'checked' : ''}
                        onchange="DashboardView.handleToggle('${Utils.escapeHtml(device.id)}', this)"
                    >
                    <span class="switch-slider"></span>
                </label>
            </article>
        `;
    },

    statusBadge(status) {
        const normalized = String(status || '').toLowerCase();
        const textMap = {
            success: 'Thành công',
            fail: 'Thất bại',
            timeout: 'Timeout',
            loading: 'Đang chờ'
        };

        return `<span class="badge ${normalized}">${textMap[normalized] || Utils.escapeHtml(status)}</span>`;
    }
};
