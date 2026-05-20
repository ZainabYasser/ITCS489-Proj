// Auction Module - API Version

const API_BASE = '../api.php';
const API_URL = API_BASE + '?request=';

let currentCurrency = 'BHD';
let allAuctions = [];
let currentFilter = 'all';
let currentSearchTerm = '';

// Currency rates
const currencyRates = {
    BHD: { symbol: 'BD', rate: 1, code: 'BHD' },
    SAR: { symbol: '﷼', rate: 9.96, code: 'SAR' },
    USD: { symbol: '$', rate: 2.65, code: 'USD' },
    AED: { symbol: 'د.إ', rate: 9.74, code: 'AED' }
};

function changeCurrency(currencyCode, symbol, rate) {
    currentCurrency = currencyCode;
    localStorage.setItem('preferredCurrency', currencyCode);
    document.getElementById('current-currency').textContent = currencyCode;
    showToast(`Currency changed to ${symbol} ${currencyCode}`, 'success');
    loadAuctionsFromAPI();
}

function loadCurrencyPreference() {
    const saved = localStorage.getItem('preferredCurrency');
    if (saved && currencyRates[saved]) {
        currentCurrency = saved;
        document.getElementById('current-currency').textContent = currentCurrency;
    }
}

// Load auctions from API
async function loadAuctionsFromAPI() {
    const container = document.getElementById('auctions-container');
    if (!container) return;
    
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    try {
        const response = await fetch(API_URL + 'get_auctions');
        const data = await response.json();
        
        if (data.success && data.auctions && data.auctions.length > 0) {
            allAuctions = data.auctions;
            displayAuctions();
        } else {
            container.innerHTML = '<div class="no-auctions"><i class="fas fa-gavel"></i><h3>No auctions found</h3><p>Check back later for new auctions!</p></div>';
        }
    } catch (error) {
        console.error('Error loading auctions:', error);
        container.innerHTML = '<div class="no-auctions"><i class="fas fa-exclamation-circle"></i><h3>Error loading auctions</h3><p>Please try again later.</p></div>';
    }
}

// Sample auctions for fallback
// function getSampleAuctions() {
//     return [
//         { id: 1, title: "Handmade Ceramics Vase", artisan_name: "Fatima Al Khalifa", current_bid: 45, start_bid: 30, bid_count: 8, end_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), image_url: "https://placehold.co/600x400/1a4b72/white?text=Ceramics+Vase" },
//         { id: 2, title: "Silver Pearl Earrings", artisan_name: "Ahmed Al Zayani", current_bid: 35, start_bid: 29.99, bid_count: 12, end_time: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(), image_url: "https://placehold.co/600x400/1a4b72/white?text=Pearl+Earrings" },
//         { id: 3, title: "Handwoven Wool Scarf", artisan_name: "Noor Al Awadhi", current_bid: 35, start_bid: 35, bid_count: 3, end_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), image_url: "https://placehold.co/600x400/1a4b72/white?text=Wool+Scarf" }
//     ];
// }

function getTimeRemaining(endTime) {
    const now = new Date().getTime();
    const end = new Date(endTime).getTime();
    const distance = end - now;
    
    if (distance <= 0) return { ended: true, text: "Ended" };
    
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return { ended: false, text: `${days}d ${hours}h`, urgent: false };
    if (hours > 0) return { ended: false, text: `${hours}h ${minutes}m`, urgent: hours < 6 };
    return { ended: false, text: `${minutes}m`, urgent: true };
}

function filterAuctions() {
    currentSearchTerm = document.getElementById('search-input')?.value.toLowerCase() || '';
    applyFilters();
}

function filterByStatus(status) {
    currentFilter = status;
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    if (event && event.target) event.target.classList.add('active');
    applyFilters();
}

function applyFilters() {
    let filtered = [...allAuctions];
    
    if (currentSearchTerm) {
        filtered = filtered.filter(auction => 
            auction.title.toLowerCase().includes(currentSearchTerm) ||
            (auction.artisan_name && auction.artisan_name.toLowerCase().includes(currentSearchTerm))
        );
    }
    
    if (currentFilter === 'active') {
        filtered = filtered.filter(auction => getTimeRemaining(auction.end_time).ended === false);
    } else if (currentFilter === 'ending') {
        filtered = filtered.filter(auction => {
            const timeLeft = getTimeRemaining(auction.end_time);
            return !timeLeft.ended && timeLeft.urgent;
        });
    } else if (currentFilter === 'popular') {
        filtered = [...filtered].sort((a, b) => (b.bid_count || 0) - (a.bid_count || 0));
    }
    
    displayFilteredAuctions(filtered);
}

function displayFilteredAuctions(auctions) {
    const container = document.getElementById('auctions-container');
    const rate = currencyRates[currentCurrency].rate;
    const symbol = currencyRates[currentCurrency].symbol;
    
    if (auctions.length === 0) {
        container.innerHTML = `<div class="no-auctions"><i class="fas fa-gavel"></i><h3>No auctions found</h3><p>Try adjusting your search or filter criteria</p></div>`;
        return;
    }
    
    container.innerHTML = `<div class="auction-grid">${auctions.map(auction => {
        const timeRemaining = getTimeRemaining(auction.end_time);
        const currentBidConverted = (auction.current_bid * rate).toFixed(2);
        const startBidConverted = (auction.start_bid * rate).toFixed(2);
        const timerClass = timeRemaining.urgent && !timeRemaining.ended ? 'timer-urgent' : '';
        const imageUrl = auction.image_url || `https://placehold.co/600x400/1a4b72/white?text=${encodeURIComponent(auction.title)}`;
        
        return `
            <div class="auction-card" onclick="viewAuction(${auction.id})">
                <div class="auction-image">
                    <img src="${imageUrl}" alt="${auction.title}" loading="lazy">
                    <div class="timer-badge ${timerClass}"><i class="fas fa-clock"></i> ${timeRemaining.text}</div>
                    <div class="bid-count"><i class="fas fa-gavel"></i> ${auction.bid_count || 0} ${auction.bid_count == 1 ? 'bid' : 'bids'}</div>
                </div>
                <div class="auction-info">
                    <h3>${auction.title}</h3>
                    <p class="artisan-name"><i class="fas fa-user"></i> by ${auction.artisan_name || 'Local Artisan'}</p>
                    <div class="current-bid-section">
                        <div class="current-bid-label">Current Bid</div>
                        <div class="current-bid-amount">${symbol} ${currentBidConverted}</div>
                    </div>
                    <div class="starting-bid" style="margin-bottom: 15px;">Started at: ${symbol} ${startBidConverted}</div>
                    <button class="bid-link" onclick="event.stopPropagation(); viewAuction(${auction.id})">Place Bid <i class="fas fa-arrow-right"></i></button>
                </div>
            </div>
        `;
    }).join('')}</div>`;
}

function displayAuctions() {
    displayFilteredAuctions(allAuctions);
}

function viewAuction(auctionId) {
    window.location.href = `auction-detail.html?id=${auctionId}`;
}

function showToast(message, type) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i> ${message}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

async function updateCartCount() {
    try {
        const response = await fetch(API_URL + 'get_cart');
        const data = await response.json();
        const count = data.success && data.cart ? data.cart.reduce((sum, item) => sum + item.quantity, 0) : 0;
        document.querySelectorAll('.cart-count').forEach(el => {
            el.textContent = count;
            el.style.display = count > 0 ? 'inline-block' : 'none';
        });
    } catch (error) {
        console.error('Error updating cart count:', error);
    }
}

function getCurrentUser() {
    return JSON.parse(localStorage.getItem('user') || 'null');
}

function checkAuth() {
    const user = getCurrentUser();
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const logoutBtn = document.getElementById('logout-btn');
    
    if (user) {
        if (loginBtn) loginBtn.style.display = 'none';
        if (registerBtn) registerBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'inline-block';
    } else {
        if (loginBtn) loginBtn.style.display = 'inline-block';
        if (registerBtn) registerBtn.style.display = 'inline-block';
        if (logoutBtn) logoutBtn.style.display = 'none';
    }
}

// Auto-refresh timers every minute
setInterval(() => {
    if (allAuctions.length > 0) {
        applyFilters();
    }
}, 60000);

document.addEventListener('DOMContentLoaded', () => {
    loadCurrencyPreference();
    loadAuctionsFromAPI();
    updateCartCount();
    checkAuth();
});

window.changeCurrency = changeCurrency;
window.filterByStatus = filterByStatus;
window.filterAuctions = filterAuctions;
window.viewAuction = viewAuction;