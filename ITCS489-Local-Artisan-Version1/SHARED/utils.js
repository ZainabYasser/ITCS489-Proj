// =============================================
// UTILS.JS - Shared Helper Functions
// =============================================

// ===== API CONFIGURATION =====
const API_URL = 'api.php?request=';

// ===== CURRENCY CONFIGURATION =====
const currencyRates = {
    BHD: { symbol: 'BD', rate: 1, code: 'BHD', name: 'Bahraini Dinar' },
    SAR: { symbol: '﷼', rate: 9.96, code: 'SAR', name: 'Saudi Riyal' },
    USD: { symbol: '$', rate: 2.65, code: 'USD', name: 'US Dollar' },
    AED: { symbol: 'د.إ', rate: 9.74, code: 'AED', name: 'UAE Dirham' }
};
let currentCurrency = 'BHD';

// ===== HELPER FUNCTIONS =====

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> ${message}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function formatPrice(price) {
    const rate = currencyRates[currentCurrency].rate;
    const symbol = currencyRates[currentCurrency].symbol;
    const converted = (price * rate).toFixed(2);
    return `${symbol} ${converted}`;
}

function changeCurrency(currencyCode) {
    if (currencyRates[currencyCode]) {
        currentCurrency = currencyCode;
        localStorage.setItem('preferredCurrency', currencyCode);
        document.getElementById('current-currency').textContent = currencyCode;
        showToast(`Currency changed to ${currencyRates[currencyCode].symbol} ${currencyCode}`, 'success');
        
        if (typeof displayProducts === 'function') {
            displayProducts();
        }
        if (typeof loadCart === 'function') {
            loadCart();
        }
    }
}

function loadCurrencyPreference() {
    const saved = localStorage.getItem('preferredCurrency');
    if (saved && currencyRates[saved]) {
        currentCurrency = saved;
        document.getElementById('current-currency').textContent = currentCurrency;
    }
}

// Make functions global
window.showToast = showToast;
window.formatPrice = formatPrice;
window.changeCurrency = changeCurrency;
window.loadCurrencyPreference = loadCurrencyPreference;
window.currencyRates = currencyRates;
window.currentCurrency = currentCurrency;