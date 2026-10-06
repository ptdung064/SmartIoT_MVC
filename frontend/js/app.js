const App = {
    currentView: null,
    content: null,

    views: {
        dashboard: { title: 'Dashboard', handler: DashboardView },
        dataSensor: { title: 'Data Sensor', handler: DataSensorView },
        actionHistory: { title: 'Action History', handler: ActionHistoryView },
        profile: { title: 'Profile', handler: ProfileView }
    },

    init() {
        if (!Api.getToken()) {
            window.location.href = '/login.html';
            return;
        }

        this.content = document.getElementById('app-content');
        this.bindNavigation();
        this.bindLogout();
        this.updateUserSummary();
        this.loadView('dashboard');
    },

    // chuyển hướng các trang bên taskbar
    bindNavigation() { 
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
                this.loadView(item.dataset.view);
            });
        });
    },

    // đăng xuất khỏi hệ thống
    bindLogout() {
        document.getElementById('logout-button').addEventListener('click', async () => {
            try {
                await Api.post('/auth/logout', {});
            } catch {
                // Dù server không phản hồi vẫn xóa token ở frontend.
            }

            Api.clearSession();
            window.location.href = '/login.html';
        });
    },

    updateUserSummary() {
        const user = Api.getStoredUser();
        const name = user.full_name || user.username || 'Người dùng';

        const nameEl = document.getElementById('topbar-user-name');
        const avatarEl = document.getElementById('topbar-avatar');

        if (nameEl) nameEl.textContent = name;
        if (avatarEl) avatarEl.textContent = name.trim().charAt(0).toUpperCase() || 'U';
    },

    async loadView(name) {
        const target = this.views[name];
        if (!target) return;

        if (this.currentView?.handler?.destroy) {
            this.currentView.handler.destroy();
        }

        document.getElementById('topbar-title').textContent = target.title;
        this.content.innerHTML = target.handler.render();
        this.currentView = target;

        if (target.handler.init) {
            await target.handler.init();
        }
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());
