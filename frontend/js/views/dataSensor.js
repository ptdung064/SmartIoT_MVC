const DataSensorView = {
    page: 1,
    totalPages: 1,
    pageSize: 20,

    render() {
        return `
            <section class="panel">
                <div class="page-heading">
                    <div>
                        <h2>Data Sensor</h2>
                        <p>Chọn loại dữ liệu cần tìm và nhập giá trị chính xác.</p>
                    </div>
                </div>

                <div class="search-filter-row">
                    <div class="form-field">
                        <label for="sensor-filter">Bộ lọc cảm biến</label>
                        <select id="sensor-filter" class="select">
                            <option value="">Tất cả cảm biến</option>
                            <option value="time">Thời gian</option>
                        </select>
                    </div>

                    <div class="form-field">
                        <label for="sensor-search-value">Giá trị tìm kiếm chính xác</label>
                        <input id="sensor-search-value" class="input" type="number" step="0.01" placeholder="Ví dụ: 25.50">
                    </div>

                    <button id="sensor-search-button" class="button primary" type="button">Tìm kiếm</button>
                    <button id="sensor-reset-button" class="button secondary" type="button">Làm mới</button>
                </div>

                <div class="table-wrap">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Cảm biến</th>
                                <th>Giá trị</th>
                                <th>Thời gian</th>
                            </tr>
                        </thead>
                        <tbody id="sensor-table-body">
                            <tr><td class="empty-cell" colspan="4">Đang tải dữ liệu...</td></tr>
                        </tbody>
                    </table>
                </div>

                <div class="pagination">
                    <div id="sensor-page-info" class="pagination-info"></div>
                    <div class="pagination-buttons">
                        <button id="sensor-prev" class="button secondary" type="button">Previous</button>
                        <select id="sensor-page-select" class="select page-select" aria-label="Chọn trang"></select>
                        <button id="sensor-next" class="button primary" type="button">Next</button>
                    </div>
                </div>
            </section>
        `;
    },

    async init() {
        document.getElementById('sensor-filter').addEventListener('change', event => {
            const input = document.getElementById('sensor-search-value');
            const isTime = event.target.value === 'time';
            input.type = isTime ? 'text' : 'number';
            input.step = isTime ? '' : '0.01';
            input.placeholder = isTime ? 'DD/MM/YYYY HH:mm:ss' : 'Ví dụ: 25.50';
        });

        document.getElementById('sensor-search-button').addEventListener('click', () => {
            this.page = 1;
            this.loadData();
        });

        document.getElementById('sensor-reset-button').addEventListener('click', () => {
            document.getElementById('sensor-filter').value = '';
            const input = document.getElementById('sensor-search-value');
            input.value = '';
            input.type = 'number';
            input.step = '0.01';
            input.placeholder = 'Ví dụ: 25.50';
            this.page = 1;
            this.loadData();
        });

        document.getElementById('sensor-prev').addEventListener('click', () => {
            if (this.page > 1) {
                this.page -= 1;
                this.loadData();
            }
        });

        document.getElementById('sensor-next').addEventListener('click', () => {
            if (this.page < this.totalPages) {
                this.page += 1;
                this.loadData();
            }
        });

        document.getElementById('sensor-page-select').addEventListener('change', event => {
            this.page = Number(event.target.value) || 1;
            this.loadData();
        });

        await this.loadSensorOptions();
        await this.loadData();
    },

    destroy() {},

    async loadSensorOptions() {
        try {
            const response = await Api.get('/sensors');
            const select = document.getElementById('sensor-filter');

            response.data.forEach(sensor => {
                const option = document.createElement('option');
                option.value = sensor.id;
                option.textContent = `${sensor.name} (${sensor.unit})`;
                select.appendChild(option);
            });
        } catch (error) {
            Utils.toast(error.message, 'error');
        }
    },

    buildQuery() {
        const filter = document.getElementById('sensor-filter').value;
        const value = document.getElementById('sensor-search-value').value.trim();
        const range = filter === 'time' ? Utils.exactSecondRange(value) : null;

        return {
            sensor_id: filter === 'time' ? '' : filter,
            exact_value: filter === 'time' ? '' : value,
            exact_time: filter === 'time' ? value : '',
            from: filter === 'time' ? (range?.from || '') : '',
            to: filter === 'time' ? (range?.to || '') : '',
            page: this.page,
            limit: this.pageSize,
            sort: 'desc'
        };
    },

    async loadData() {
        const tbody = document.getElementById('sensor-table-body');
        tbody.innerHTML = '<tr><td class="empty-cell" colspan="4">Đang tải dữ liệu...</td></tr>';

        try {
            const response = await Api.get(`/datasensor${Utils.queryString(this.buildQuery())}`);
            const { items, pagination } = response.data;

            this.totalPages = pagination.total_pages;
            this.page = pagination.page;

            const pageSelect = document.getElementById('sensor-page-select');
            pageSelect.innerHTML = Array.from({ length: pagination.total_pages }, (_, index) => {
                const page = index + 1;
                return `<option value="${page}"${page === pagination.page ? ' selected' : ''}>Trang ${page}</option>`;
            }).join('');

            if (!items.length) {
                tbody.innerHTML = '<tr><td class="empty-cell" colspan="4">Không tìm thấy dữ liệu phù hợp.</td></tr>';
            } else {
                tbody.innerHTML = items.map(item => `
                    <tr>
                        <td>${Utils.escapeHtml(Utils.shortId(item.id))}</td>
                        <td>${Utils.escapeHtml(item.sensor_name)}</td>
                        <td><strong>${Number(item.value).toFixed(2)}</strong> ${Utils.escapeHtml(item.unit)}</td>
                        <td>${Utils.escapeHtml(Utils.formatDateTime(item.recorded_at))}</td>
                    </tr>
                `).join('');
            }

            document.getElementById('sensor-page-info').textContent =
                `Trang ${pagination.page}/${pagination.total_pages} • ${pagination.total} bản ghi`;

            document.getElementById('sensor-prev').disabled = pagination.page <= 1;
            document.getElementById('sensor-next').disabled = pagination.page >= pagination.total_pages;
        } catch (error) {
            tbody.innerHTML = `<tr><td class="empty-cell" colspan="4">${Utils.escapeHtml(error.message)}</td></tr>`;
        }
    }
};
