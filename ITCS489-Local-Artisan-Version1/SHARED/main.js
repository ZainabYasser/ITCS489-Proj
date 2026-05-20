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

// Auto-process ended auctions on every page load
function processEndedAuctions() {
    fetch('../api.php?request=process_ended_auctions')
        .then(r => r.json())
        .then(data => {
            if (data.updated > 0) {
        console.log('Updated ' + data.updated + ' ended auctions');
            }
        })
        .catch(err => console.error('Error:', err));
}

// Run when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', processEndedAuctions);
} else {
    processEndedAuctions();
}

// Check for ended auctions every 5 minutes
setInterval(() => {
    fetch('../api.php?request=process_ended_auctions')
        .catch(err => console.error('Error processing auctions:', err));
}, 5 * 60 * 1000); // 5 minutes

// Make functions global
window.updateAuthUI = updateAuthUI;
window.logout = logout;
window.checkAuth = checkAuth;