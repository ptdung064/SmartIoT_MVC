document.addEventListener('DOMContentLoaded', () => {
    if (Api.getToken()) {
        window.location.href = '/';
        return;
    }

    const form = document.getElementById('login-form');
    const errorEl = document.getElementById('login-error');
    const submitButton = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', async event => {
        event.preventDefault();
        errorEl.textContent = '';

        // khóa nút submit để tránh gửi nhiều lần, disable là thuộc tính mặc định của button
        submitButton.textContent = 'Đang đăng nhập...'; 
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;

        submitButton.disabled = true; 

        try {
            const response = await Api.post('/auth/login', { username, password });
            Api.setSession(response.data);
            window.location.href = '/';
        } catch (error) {
            errorEl.textContent = error.message;
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Đăng nhập';
        }
    });
});
