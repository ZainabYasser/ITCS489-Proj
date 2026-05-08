// =============================================
// ARTISAN.JS - Artisan Dashboard Functions
// =============================================

async function registerArtisan(event) {
    if (event) event.preventDefault();
    
    const fullname = document.getElementById('fullname')?.value;
    const email = document.getElementById('email')?.value;
    const shop_name = document.getElementById('shop_name')?.value;
    const bio = document.getElementById('bio')?.value;
    const location = document.getElementById('location')?.value;
    const password = document.getElementById('password')?.value;
    const confirmPassword = document.getElementById('confirm_password')?.value;
    
    if (!fullname || !email || !shop_name || !bio || !password) {
        showToast('Please fill in all required fields', 'error');
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
        const response = await fetch(API_URL + 'register_artisan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fullname, email, password, shop_name, bio, location })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Artisan registration successful! Please login.', 'success');
            setTimeout(() => window.location.href = 'login.html', 1500);
        } else {
            showToast(data.message || 'Registration failed', 'error');
        }
        return data.success;
    } catch (error) {
        console.error('Artisan register error:', error);
        showToast('Network error. Please try again.', 'error');
        return false;
    }
}

// Make functions global
window.registerArtisan = registerArtisan;