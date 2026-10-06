const ActionHistoryView = {
    page: 1,
    totalPages: 1,
    pageSize: 20,

    render() {
        return `
            <section class="panel">
                <div class="page-heading">
                    <div>
                        <h2>Action History</h2>
                        <p>Tìm kiếm thời gian chính xác đến giây và lọc theo thiết bị, hành động, trạng thái.</p>
                    </div>
                </div>

                <div class="search-filter-row action-filters">
                    <div class="form-field">
                        <label for="action-time-search">Tìm kiếm thời gian chính xác</label>
                        <input id="action-time-search" class="input" type="text" placeholder="DD/MM/YYYY HH:mm:ss">
                    </div>

                    <div class="form-field">
                        <label for="action-device">Thiết bị</label>
                        <select id="action-device" class="select">
                            <option value="">Tất cả thiết bị</option>
                        </select>
                    </div>

                    <div class="form-field">
                        <label for="action-action">Hành động</label>
                        <select id="action-action" class="select">
                            <option value="">Tất cả</option>
                            <option value="ON">ON</option>
                            <option value="OFF">OFF</option>
                        </select>
                    </div>

                    <div class="form-field">
                        <label for="action-status">Trạng thái</label>
                        <select id="action-status" class="select">
                            <option value="">Tất cả</option>
                            <option value="success">Thành công</option>
                            <option value="fail">Thất bại</option>
                            <option value="timeout">Timeout</option>
                            <option value="loading">Đang chờ</option>
                        </select>
                    </div>

                    <button id="action-search-button" class="button primary" type="button">Tìm kiếm</button>
                    <button id="action-reset-button" class="button secondary" type="button">Làm mới</button>
                </div>

                <div class="table-wrap">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Thiết bị</th>
                                <th>Hành động</th>
                                <th>Trạng thái</th>
                                <th>Người dùng</th>
                                <th>Thời gian</th>
                            </tr>
                        </thead>
                        <tbody id="action-table-body">
                            <tr><td class="empty-cell" colspan="6">Đang tải dữ liệu...</td></tr>
                        </tbody>
                    </table>
                </div>

                <div class="pagination">
                    <div id="action-page-info" class="pagination-info"></div>
                    <div class="pagination-buttons">
                        <button id="action-prev" class="button secondary" type="button">Previous</button>
                        <select id="action-page-select" class="select page-select" aria-label="Chọn trang"></select>
                        <button id="action-next" class="button primary" type="button">Next</button>
                    </div>
                </div>
            </section>
        `;
    },

    async init() {
        document.getElementById('action-search-button').addEventListener('click', () => {
            this.page = 1;
            this.loadData();
        });

        document.getElementById('action-reset-button').addEventListener('click', () => {
            document.getElementById('action-time-search').value = '';
            document.getElementById('action-device').value = '';
            document.getElementById('action-action').value = '';
            document.getElementById('action-status').value = '';
            this.page = 1;
            this.loadData();
        });

        document.getElementById('action-prev').addEventListener('click', () => {
            if (this.page > 1) {
                this.page -= 1;
                this.loadData();
            }
        });

        document.getElementById('action-next').addEventListener('click', () => {
            if (this.page < this.totalPages) {
                this.page += 1;
                this.loadData();
            }
        });

        document.getElementById('action-page-select').addEventListener('change', event => {
            this.page = Number(event.target.value) || 1;
            this.loadData();
        });

        await this.loadDeviceOptions();
        await this.loadData();
    },

    destroy() {},

    async loadDeviceOptions() {
        try {
            const response = await Api.get('/devices');
            const select = document.getElementById('action-device');

            response.data.forEach(device => {
                const option = document.createElement('option');
                option.value = device.id;
                option.textContent = device.name;
                select.appendChild(option);
            });
        } catch (error) {
            Utils.toast(error.message, 'error');
        }
    },

    buildQuery() {
        const exactTime = document.getElementById('action-time-search').value.trim();
        const range = Utils.exactSecondRange(exactTime);

        return {
            device_id: document.getElementById('action-device').value,
            action: document.getElementById('action-action').value,
            status: document.getElementById('action-status').value,
            exact_time: exactTime,
            from: range?.from || '',
            to: range?.to || '',
            page: this.page,
            limit: this.pageSize,
            sort: 'desc'
        };
    },

    async loadData() {
        const tbody = document.getElementById('action-table-body');
        tbody.innerHTML = '<tr><td class="empty-cell" colspan="6">Đang tải dữ liệu...</td></tr>';

        try {
            const response = await Api.get(`/actions${Utils.queryString(this.buildQuery())}`);
            const { items, pagination } = response.data;

            this.totalPages = pagination.total_pages;
            this.page = pagination.page;

            const pageSelect = document.getElementById('action-page-select');
            pageSelect.innerHTML = Array.from({ length: pagination.total_pages }, (_, index) => {
                const page = index + 1;
                return `<option value="${page}"${page === pagination.page ? ' selected' : ''}>Trang ${page}</option>`;
            }).join('');

            if (!items.length) {
                tbody.innerHTML = '<tr><td class="empty-cell" colspan="6">Không tìm thấy lịch sử phù hợp.</td></tr>';
            } else {
                tbody.innerHTML = items.map(item => `
                    <tr>
                        <td>${Utils.escapeHtml(Utils.shortId(item.id))}</td>
                        <td>${Utils.escapeHtml(item.device_name)}</td>
                        <td><span class="badge ${String(item.action).toLowerCase()}">${Utils.escapeHtml(item.action)}</span></td>
                        <td>${Components.statusBadge(item.status)}</td>
                        <td>${Utils.escapeHtml(item.username || '--')}</td>
                        <td>${Utils.escapeHtml(Utils.formatDateTime(item.created_at))}</td>
                    </tr>
                `).join('');
            }

            document.getElementById('action-page-info').textContent =
                `Trang ${pagination.page}/${pagination.total_pages} • ${pagination.total} bản ghi`;

            document.getElementById('action-prev').disabled = pagination.page <= 1;
            document.getElementById('action-next').disabled = pagination.page >= pagination.total_pages;
        } catch (error) {
            tbody.innerHTML = `<tr><td class="empty-cell" colspan="6">${Utils.escapeHtml(error.message)}</td></tr>`;
        }
    }
};
