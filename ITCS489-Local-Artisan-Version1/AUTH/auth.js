// =============================================
// AUTH.JS - Authentication Functions
// =============================================

let currentUser = null;

async function register(event) {
    if (event) event.preventDefault();
    
    const fullname = document.getElementById('fullname')?.value;
    const email = document.getElementById('email')?.value;
    const password = document.getElementById('password')?.value;
    const confirmPassword = document.getElementById('confirm_password')?.value;
    
    if (!fullname || !email || !password) {
        showToast('Please fill in all fields', 'error');
        return false;
    }
    
    if (password !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        return false;
    }
    
    if (password.length < 6) {
        showToast('Password must be at least 6 characters', 'error');
        return false;
    }
    
    try {
        const response = await fetch('../api.php?request=register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fullname, email, password, role: 'customer' })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Registration successful! Please login.', 'success');
            setTimeout(() => window.location.href = 'login.html', 1500);
        } else {
            showToast(data.message || 'Registration failed', 'error');
        }
        return data.success;
    } catch (error) {
        console.error('Register error:', error);
        showToast('Network error. Please try again.', 'error');
        return false;
    }
}

async function login(event) {
    if (event) event.preventDefault();
    
    const email = document.getElementById('email')?.value;
    const password = document.getElementById('password')?.value;
    
    if (!email || !password) {
        showToast('Please enter email and password', 'error');
        return false;
    }
    
    try {
        const response = await fetch('../api.php?request=login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentUser = data.user;
            localStorage.setItem('user', JSON.stringify(data.user));
            showToast(`Welcome back, ${data.user.fullname}!`, 'success');
            
            setTimeout(() => {
                if (data.user.role === 'admin') {
                    window.location.href = '../ADMIN/admin-dashboard.html';
                } else if (data.user.role === 'artisan') {
                    window.location.href = '../ARTISAN/artisan-dashboard.html';
                } else {
                    window.location.href = '../index.html';
                }
            }, 1000);
        } else {
            showToast(data.message || 'Invalid email or password', 'error');
        }
        return data.success;
    } catch (error) {
        console.error('Login error:', error);
        showToast('Network error. Please try again.', 'error');
        return false;
    }
}

async function logout() {
    try {
        await fetch('../api.php?request=logout', { method: 'POST' });
        localStorage.removeItem('user');
        currentUser = null;
        showToast('Logged out successfully', 'success');
        setTimeout(() => window.location.href = '../index.html', 1000);
    } catch (error) {
        console.error('Logout error:', error);
        window.location.href = '../index.html';
    }
}

async function checkAuth() {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
    }
    
    try {
        const response = await fetch('../api.php?request=check_auth');
        const data = await response.json();
        if (data.success && data.user) {
            currentUser = data.user;
            localStorage.setItem('user', JSON.stringify(data.user));
        }
    } catch (error) {
        console.log('Auth check failed:', error);
    }
    
    updateUIForUser();
    return currentUser !== null;
}

function updateUIForUser() {
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const accountLink = document.getElementById('account-link');
    
    if (currentUser) {
        if (loginBtn) loginBtn.style.display = 'none';
        if (registerBtn) registerBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'inline-block';
        if (accountLink) accountLink.style.display = 'flex';
    } else {
        if (loginBtn) loginBtn.style.display = 'inline-block';
        if (registerBtn) registerBtn.style.display = 'inline-block';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (accountLink) accountLink.style.display = 'none';
    }
}

function getCurrentUser() {
    return currentUser || JSON.parse(localStorage.getItem('user') || 'null');
}

// Make functions global
window.register = register;
window.login = login;
window.logout = logout;
window.checkAuth = checkAuth;
window.getCurrentUser = getCurrentUser;