// =============================================
// MAIN.JS - Page Initialization Only
// =============================================

document.addEventListener('DOMContentLoaded', async () => {
    // Load preferences
    loadCurrencyPreference();
    
    // Update cart count
    await updateCartCount();
    
    // Update UI based on login status
    updateAuthUI();
    
    // Set up logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
});

function updateAuthUI() {
    const user = getCurrentUser();
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const userGreeting = document.getElementById('user-greeting');
    
    if (user) {
        if (loginBtn) loginBtn.style.display = 'none';
        if (registerBtn) registerBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'inline-block';
        if (userGreeting) userGreeting.textContent = `Hello, ${user.fullname}`;
    } else {
        if (loginBtn) loginBtn.style.display = 'inline-block';
        if (registerBtn) registerBtn.style.display = 'inline-block';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (userGreeting) userGreeting.textContent = '';
    }
}

async function logout() {
    try {
        await fetch(getApiUrl() + 'logout', { method: 'POST' });
        localStorage.removeItem('user');
        showToast('Logged out successfully', 'success');
        window.location.href = '../STATIC/index.html';
    } catch (error) {
        window.location.href = '../STATIC/index.html';
    }
}

function checkAuth() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = '../AUTH & USER/login.html';
        return false;
    }
    return true;
}

// Make functions global
window.updateAuthUI = updateAuthUI;
window.logout = logout;
window.checkAuth = checkAuth;