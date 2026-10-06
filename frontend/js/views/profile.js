const ProfileView = {
    profile: null,

    render() {
        return `
            <section>
                <div class="page-heading">
                    <div>
                        <h2>Profile</h2>
                        <p>Thông tin cá nhân và tài nguyên của dự án.</p>
                    </div>
                </div>

                <div class="profile-grid">
                    <article class="card profile-card">
                        <div class="profile-cover"></div>
                        <div id="profile-avatar" class="avatar-wrap">U</div>
                        <div class="profile-summary">
                            <h3 id="profile-name">Đang tải...</h3>
                            <div id="profile-username" class="muted"></div>

                            <div class="profile-meta">
                                <div>🎓 <span id="profile-student-id">--</span></div>
                                <div>🏫 <span id="profile-class">--</span></div>
                                <div>✉ <span id="profile-email">--</span></div>
                            </div>
                        </div>
                    </article>

                    <div class="profile-main">
                        <article class="panel">
                            <div class="section-title" style="margin-top:0;">
                                <h3>Chỉnh sửa thông tin</h3>
                            </div>

                            <div class="form-grid">
                                <div class="form-field">
                                    <label for="profile-full-name-input">Họ tên</label>
                                    <input id="profile-full-name-input" class="input">
                                </div>

                                <div class="form-field">
                                    <label for="profile-student-id-input">Mã sinh viên</label>
                                    <input id="profile-student-id-input" class="input">
                                </div>

                                <div class="form-field">
                                    <label for="profile-class-input">Lớp</label>
                                    <input id="profile-class-input" class="input">
                                </div>

                                <div class="form-field">
                                    <label for="profile-email-input">Email</label>
                                    <input id="profile-email-input" class="input" type="email">
                                </div>

                                <div class="form-field">
                                    <label for="profile-avatar-input">Avatar URL</label>
                                    <input id="profile-avatar-input" class="input" placeholder="https://...">
                                </div>

                                <div></div>

                                <div class="form-field">
                                    <label for="profile-github-input">GitHub URL</label>
                                    <input id="profile-github-input" class="input" placeholder="https://github.com/...">
                                </div>

                                <div class="form-field">
                                    <label for="profile-figma-input">Figma URL</label>
                                    <input id="profile-figma-input" class="input" placeholder="https://figma.com/...">
                                </div>

                                <div class="form-field">
                                    <label for="profile-postman-input">Postman URL</label>
                                    <input id="profile-postman-input" class="input" placeholder="https://postman.com/...">
                                </div>

                                <div class="form-field">
                                    <label for="profile-report-input">Báo cáo URL</label>
                                    <input id="profile-report-input" class="input" placeholder="https://drive.google.com/...">
                                </div>
                            </div>

                            <div style="margin-top:16px;">
                                <button id="profile-save-button" class="button primary" type="button">Lưu thay đổi</button>
                            </div>
                        </article>

                        <article class="panel">
                            <div class="section-title" style="margin-top:0;">
                                <h3>Tài nguyên dự án</h3>
                            </div>
                            <div id="resource-grid" class="resource-grid"></div>
                        </article>
                    </div>
                </div>
            </section>
        `;
    },

    async init() {
        document.getElementById('profile-save-button').addEventListener('click', () => this.save());
        await this.load();
    },

    destroy() {},

    async load() {
        try {
            const response = await Api.get('/profile');
            this.profile = response.data;
            this.renderData();
        } catch (error) {
            Utils.toast(error.message, 'error');
        }
    },

    renderData() {
        const p = this.profile;

        document.getElementById('profile-name').textContent = p.full_name || p.username;
        document.getElementById('profile-username').textContent = `@${p.username}`;
        document.getElementById('profile-student-id').textContent = p.student_id || '--';
        document.getElementById('profile-class').textContent = p.class_name || '--';
        document.getElementById('profile-email').textContent = p.email || '--';

        const avatar = document.getElementById('profile-avatar');
        if (p.avatar_url) {
            avatar.innerHTML = `<img src="${Utils.escapeHtml(p.avatar_url)}" alt="Avatar">`;
        } else {
            avatar.textContent = (p.full_name || p.username || 'U').trim().charAt(0).toUpperCase();
        }

        document.getElementById('profile-full-name-input').value = p.full_name || '';
        document.getElementById('profile-student-id-input').value = p.student_id || '';
        document.getElementById('profile-class-input').value = p.class_name || '';
        document.getElementById('profile-email-input').value = p.email || '';
        document.getElementById('profile-avatar-input').value = p.avatar_url || '';
        document.getElementById('profile-github-input').value = p.github_url || '';
        document.getElementById('profile-figma-input').value = p.figma_url || '';
        document.getElementById('profile-postman-input').value = p.postman_url || '';
        document.getElementById('profile-report-input').value = p.report_url || '';

        this.renderResources();

        const storedUser = Api.getStoredUser();
        storedUser.full_name = p.full_name;
        localStorage.setItem(Api.userKey, JSON.stringify(storedUser));
        App.updateUserSummary();
    },

    renderResources() {
        const resources = [
            ['GitHub', this.profile.github_url, 'Mã nguồn dự án'],
            ['Figma', this.profile.figma_url, 'Bản thiết kế giao diện'],
            ['Postman', this.profile.postman_url, 'Bộ API kiểm thử'],
            ['Báo cáo', this.profile.report_url, 'Tài liệu báo cáo môn học']
        ];

        const grid = document.getElementById('resource-grid');

        grid.innerHTML = resources.map(([name, url, description]) => `
            <div class="resource-card">
                <h4>${Utils.escapeHtml(name)}</h4>
                <p>${Utils.escapeHtml(description)}</p>
                ${
                    url
                        ? `<a href="${Utils.escapeHtml(url)}" target="_blank" rel="noopener noreferrer">Mở tài nguyên ↗</a>`
                        : '<span class="muted">Chưa cấu hình</span>'
                }
            </div>
        `).join('');
    },

    async save() {
        const button = document.getElementById('profile-save-button');
        Utils.setLoading(button, true, 'Đang lưu...');

        const data = {
            full_name: document.getElementById('profile-full-name-input').value,
            student_id: document.getElementById('profile-student-id-input').value,
            class_name: document.getElementById('profile-class-input').value,
            email: document.getElementById('profile-email-input').value,
            avatar_url: document.getElementById('profile-avatar-input').value,
            github_url: document.getElementById('profile-github-input').value,
            figma_url: document.getElementById('profile-figma-input').value,
            postman_url: document.getElementById('profile-postman-input').value,
            report_url: document.getElementById('profile-report-input').value
        };

        try {
            const response = await Api.put('/profile', data);
            this.profile = response.data;
            this.renderData();
            Utils.toast('Đã cập nhật profile', 'success');
        } catch (error) {
            Utils.toast(error.message, 'error');
        } finally {
            Utils.setLoading(button, false);
        }
    }
};
