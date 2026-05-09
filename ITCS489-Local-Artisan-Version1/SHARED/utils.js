// =============================================
// UTILS.JS - Shared Helper Functions
// =============================================

// ===== API CONFIGURATION =====
const API_URL = '../api.php?request=';

// ===== CURRENCY CONFIGURATION =====
const currencyRates = {
    BHD: { symbol: 'BD', rate: 1, code: 'BHD', name: 'Bahraini Dinar' },
    SAR: { symbol: '﷼', rate: 9.96, code: 'SAR', name: 'Saudi Riyal' },
    USD: { symbol: '$', rate: 2.65, code: 'USD', name: 'US Dollar' },
    AED: { symbol: 'د.إ', rate: 9.74, code: 'AED', name: 'UAE Dirham' }
};
let currentCurrency = 'BHD';

// ===== TOAST NOTIFICATIONS =====
function showToast(message, type = 'success') {
    // Remove any existing toasts
    const existingToasts = document.querySelectorAll('.toast');
    existingToasts.forEach(toast => toast.remove());
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> ${message}`;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${type === 'success' ? '#28a745' : '#dc3545'};
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        z-index: 9999;
        animation: slideIn 0.3s ease;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        font-family: 'Inter', sans-serif;
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        if (toast && toast.remove) toast.remove();
    }, 3000);
}

// ===== CURRENCY FUNCTIONS =====
function formatPrice(price) {
    if (!price && price !== 0) return 'BD 0.00';
    const rate = currencyRates[currentCurrency]?.rate || 1;
    const symbol = currencyRates[currentCurrency]?.symbol || 'BD';
    const converted = (parseFloat(price) * rate).toFixed(2);
    return `${symbol} ${converted}`;
}

function changeCurrency(currencyCode) {
    if (currencyRates[currencyCode]) {
        currentCurrency = currencyCode;
        localStorage.setItem('preferredCurrency', currencyCode);
        
        const currencyDisplay = document.getElementById('current-currency');
        if (currencyDisplay) currencyDisplay.textContent = currencyCode;
        
        showToast(`Currency changed to ${currencyRates[currencyCode].symbol} ${currencyCode}`, 'success');
        
        // Refresh all price displays on the page
        refreshAllPrices();
        
        // Reload page content that shows prices
        if (typeof loadProducts === 'function') {
            loadProducts();
        }
        if (typeof loadCart === 'function') {
            loadCart();
        }
        if (typeof displayProducts === 'function') {
            displayProducts();
        }
    }
}

function refreshAllPrices() {
    // Find all elements with price classes and refresh them
    const priceElements = document.querySelectorAll('.product-price, .cart-item-price, .cart-item-subtotal, .order-total, .wishlist-price, .product-price-detail');
    priceElements.forEach(el => {
        const originalPrice = el.getAttribute('data-original-price');
        if (originalPrice) {
            el.textContent = formatPrice(parseFloat(originalPrice));
        }
    });
}

function loadCurrencyPreference() {
    const saved = localStorage.getItem('preferredCurrency');
    if (saved && currencyRates[saved]) {
        currentCurrency = saved;
        const currencyDisplay = document.getElementById('current-currency');
        if (currencyDisplay) currencyDisplay.textContent = currentCurrency;
    }
}

// ===== USER FUNCTIONS =====
function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
        try {
            return JSON.parse(userStr);
        } catch(e) {
            console.error('Error parsing user data:', e);
            return null;
        }
    }
    return null;
}

function setCurrentUser(user) {
    if (user) {
        localStorage.setItem('user', JSON.stringify(user));
    } else {
        localStorage.removeItem('user');
    }
}

async function fetchCurrentUser() {
    try {
        const response = await fetch('../api.php?request=check_auth');
        const data = await response.json();
        
        if (data.success && data.user) {
            setCurrentUser(data.user);
            return data.user;
        } else {
            setCurrentUser(null);
            return null;
        }
    } catch (error) {
        console.error('Error fetching user:', error);
        return null;
    }
}

// ===== CART FUNCTIONS =====
async function updateCartCount() {
    const user = getCurrentUser();
    if (!user) {
        const cartCountElements = document.querySelectorAll('.cart-count');
        cartCountElements.forEach(el => {
            el.textContent = '0';
            el.style.display = 'none';
        });
        return;
    }
    
    try {
        const response = await fetch('../api.php?request=get_cart');
        const data = await response.json();
        
        const count = data.success && data.cart ? data.cart.reduce((sum, item) => sum + (item.quantity || 1), 0) : 0;
        
        const cartCountElements = document.querySelectorAll('.cart-count');
        cartCountElements.forEach(el => {
            el.textContent = count;
            el.style.display = count > 0 ? 'inline-block' : 'none';
        });
    } catch (error) {
        console.error('Update cart count error:', error);
    }
}

// ===== HELPER FUNCTIONS =====
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function truncateText(text, maxLength = 100) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make functions global
window.showToast = showToast;
window.formatPrice = formatPrice;
window.changeCurrency = changeCurrency;
window.loadCurrencyPreference = loadCurrencyPreference;
window.currencyRates = currencyRates;
window.currentCurrency = currentCurrency;
window.getCurrentUser = getCurrentUser;
window.setCurrentUser = setCurrentUser;
window.fetchCurrentUser = fetchCurrentUser;
window.updateCartCount = updateCartCount;
window.formatDate = formatDate;
window.truncateText = truncateText;
window.escapeHtml = escapeHtml;