// =============================================
// MAIN.JS - Page Initialization Only
// =============================================

document.addEventListener('DOMContentLoaded', async () => {
    // Load preferences
    loadCurrencyPreference();
    
    // Update cart count
    await updateCartCount();
    
    // Update UI based on login status
    await updateAuthUI();
    
    // Set up logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
});

async function updateAuthUI() {
    const user = getCurrentUser();
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const userGreeting = document.getElementById('user-greeting');
    
    if (user) {
        if (loginBtn) loginBtn.style.display = 'none';
        if (registerBtn) registerBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'inline-block';
        if (userGreeting) userGreeting.textContent = `Hello, ${user.fullname || user.name || 'User'}`;
    } else {
        if (loginBtn) loginBtn.style.display = 'inline-block';
        if (registerBtn) registerBtn.style.display = 'inline-block';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (userGreeting) userGreeting.textContent = '';
    }
}

async function logout() {
    try {
        const response = await fetch('../api.php?request=logout', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();
        
        localStorage.removeItem('user');
        sessionStorage.clear();
        
        showToast('Logged out successfully', 'success');
        
        // Redirect to home page
        setTimeout(() => {
            window.location.href = '../index.html';
        }, 1000);
    } catch (error) {
        console.error('Logout error:', error);
        // Force logout even if API fails
        localStorage.removeItem('user');
        window.location.href = '../index.html';
    }
}

function checkAuth() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = '../AUTH/login.html';
        return false;
    }
    return true;
}

// Make functions global
window.updateAuthUI = updateAuthUI;
window.logout = logout;
window.checkAuth = checkAuth;