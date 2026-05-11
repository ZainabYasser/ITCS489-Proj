// Auction Detail Module - API Version

// Use unique variable names to avoid conflicts with utils.js
const AUCTION_API_BASE = '../api.php';
const AUCTION_API_URL = AUCTION_API_BASE + '?request=';

let auctionCurrentCurrency = 'BHD';
let currentAuction = null;
let countdownInterval = null;
 
// Currency rate (using same rates but local copy)
const auctionCurrencyRates = {
    BHD: { symbol: 'BD', rate: 1, code: 'BHD' },
    SAR: { symbol: '﷼', rate: 9.96, code: 'SAR' },
    USD: { symbol: '$', rate: 2.65, code: 'USD' },
    AED: { symbol: 'د.إ', rate: 9.74, code: 'AED' }
};

function changeCurrency(currencyCode, symbol, rate) {
    auctionCurrentCurrency = currencyCode;
    localStorage.setItem('preferredCurrency', currencyCode);
    const currencyDisplay = document.getElementById('current-currency');
    if (currencyDisplay) currencyDisplay.textContent = currencyCode;
    showToast(`Currency changed to ${symbol} ${currencyCode}`, 'success');
    if (currentAuction) {
        displayAuctionDetail();
        loadBidHistory();
    }
}

function loadCurrencyPreference() {
    const saved = localStorage.getItem('preferredCurrency');
    if (saved && auctionCurrencyRates[saved]) {
        auctionCurrentCurrency = saved;
        const currencyDisplay = document.getElementById('current-currency');
        if (currencyDisplay) currencyDisplay.textContent = auctionCurrentCurrency;
    }
}

// Load auction from API
async function loadAuctionDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const auctionId = urlParams.get('id');
    
    if (!auctionId) {
        window.location.href = 'auction.html';
        return;
    }
    
    try {
        const response = await fetch(AUCTION_API_URL + 'get_auction&id=' + auctionId);
        const data = await response.json();
        
        if (data.success && data.auction) {
            currentAuction = data.auction;
            displayAuctionDetail();
            await loadBidHistory();
            startCountdown();
        } else {
            showError('Auction not found');
        }
    } catch (error) {
        console.error('Error loading auction:', error);
        showError('Error loading auction. Please try again.');
    }
}

function showError(message) {
    const container = document.getElementById('auction-detail-container');
    container.innerHTML = `
        <div class="no-auctions" style="text-align: center; padding: 60px;">
            <i class="fas fa-exclamation-circle" style="font-size: 48px; color: #dc3545;"></i>
            <h3>${escapeHtml(message)}</h3>
            <a href="auction.html" class="btn-primary">Back to Auctions</a>
        </div>
    `;
}

async function loadBidHistory() {
    if (!currentAuction) return;
    
    try {
        const response = await fetch(AUCTION_API_URL + 'get_bid_history&id=' + currentAuction.id);
        const data = await response.json();
        
        const container = document.getElementById('bid-history-list');
        if (container && data.success && data.bids && data.bids.length > 0) {
            const rate = auctionCurrencyRates[auctionCurrentCurrency].rate;
            const symbol = auctionCurrencyRates[auctionCurrentCurrency].symbol;
            
            container.innerHTML = data.bids.map(bid => `
                <div class="bid-history-item">
                    <strong>${escapeHtml(bid.bidder_name)}</strong> bid ${symbol} ${(bid.bid_amount * rate).toFixed(2)}
                    <small>${new Date(bid.bid_time).toLocaleString()}</small>
                </div>
            `).join('');
        } else if (container) {
            container.innerHTML = '<p style="padding: 20px; text-align: center;">No bids yet. Be the first to bid!</p>';
        }
    } catch (error) {
        console.error('Error loading bid history:', error);
    }
}

function displayAuctionDetail() {
    const container = document.getElementById('auction-detail-container');
    const rate = auctionCurrencyRates[auctionCurrentCurrency].rate;
    const symbol = auctionCurrencyRates[auctionCurrentCurrency].symbol;
    
    // Safety checks - ensure values are numbers
    const currentBid = parseFloat(currentAuction.current_bid) || 0;
    const startBid = parseFloat(currentAuction.start_bid) || 0;
    const minIncrement = parseFloat(currentAuction.min_increment) || 5;
    const minBid = currentBid + minIncrement;
    
    const currentBidConverted = (currentBid * rate).toFixed(2);
    const startingBidConverted = (startBid * rate).toFixed(2);
    const minBidConverted = (minBid * rate).toFixed(2);
    const imageUrl = currentAuction.image_url || `https://placehold.co/600x500/8B5E3C/white?text=${encodeURIComponent(currentAuction.title)}`;
    
    container.innerHTML = `
        <div class="auction-detail-layout">
            <div class="auction-gallery">
                <img src="${imageUrl}" alt="${escapeHtml(currentAuction.title)}">
            </div>
            <div class="auction-info-detail">
                <h1>${escapeHtml(currentAuction.title)} 
                    <span class="bid-count-badge">
                        <i class="fas fa-gavel"></i> ${currentAuction.bid_count || 0} bids
                    </span>
                </h1>
                <p class="artisan-name">by ${escapeHtml(currentAuction.artisan_name || 'Local Artisan')}</p>
                <p>${escapeHtml(currentAuction.description || 'Beautiful handmade piece up for auction.')}</p>
                
                <div class="auction-timer-card">
                    <h4>Time Remaining</h4>
                    <div class="countdown-large" id="countdown-timer">--:--:--</div>
                </div>
                
                <div class="bid-info">
                    <div class="current-bid-card">
                        <span>Current Bid</span>
                        <strong id="current-bid-amount">${symbol} ${currentBidConverted}</strong>
                    </div>
                    <div class="starting-bid-card">
                        <span>Starting Bid</span>
                        <strong>${symbol} ${startingBidConverted}</strong>
                    </div>
                    <div class="min-bid-card">
                        <span>Minimum Next Bid</span>
                        <strong id="min-bid-amount">${symbol} ${minBidConverted}</strong>
                    </div>
                </div>
                
                <div class="bid-placement">
                    <h4>Place Your Bid</h4>
                    <input type="number" id="bid-amount" step="${minIncrement}" placeholder="Enter bid amount" value="${minBid}">
                    <div id="bid-error" class="bid-error"></div>
                    <div id="bid-success" class="bid-success"></div>
                    <button class="place-bid-btn" onclick="placeBid()">Place Bid</button>
                    <p style="font-size: 12px; margin-top: 10px; color: #666;">
                        <i class="fas fa-info-circle"></i> Minimum bid: ${symbol} ${minBidConverted}
                    </p>
                </div>
                
                <div class="bid-history">
                    <h4>Bid History (${currentAuction.bid_count || 0} bids)</h4>
                    <div id="bid-history-list" class="bid-history-list">
                        <p style="padding: 20px; text-align: center;">Loading bids...</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const bidInput = document.getElementById('bid-amount');
    if (bidInput) {
        bidInput.min = minBid;
        bidInput.value = minBid;
    }
}

function startCountdown() {
    if (countdownInterval) clearInterval(countdownInterval);
    
    countdownInterval = setInterval(() => {
        if (!currentAuction) return;
        
        const now = new Date().getTime();
        const end = new Date(currentAuction.end_time).getTime();
        const distance = end - now;
        
        if (distance < 0) {
            clearInterval(countdownInterval);
            document.getElementById('countdown-timer').innerHTML = 'Auction Ended';
            const bidInput = document.getElementById('bid-amount');
            const bidBtn = document.querySelector('.place-bid-btn');
            if (bidInput) bidInput.disabled = true;
            if (bidBtn) bidBtn.disabled = true;
            return;
        }
        
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        let timeString = '';
        if (days > 0) timeString += `${days}d `;
        timeString += `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        document.getElementById('countdown-timer').innerHTML = timeString;
    }, 1000);
}

function validateBid(bidAmount) {
    const errors = [];
    const minIncrement = currentAuction.min_increment || 5;
    
    if (isNaN(bidAmount) || bidAmount === null || bidAmount === '') {
        errors.push("Please enter a valid bid amount");
    } else if (bidAmount <= 0) {
        errors.push("Bid amount must be greater than zero");
    } else if (bidAmount <= currentAuction.current_bid) {
        errors.push(`Bid must be higher than the current bid of ${auctionCurrencyRates[auctionCurrentCurrency].symbol} ${(currentAuction.current_bid * auctionCurrencyRates[auctionCurrentCurrency].rate).toFixed(2)}`);
    } else if (bidAmount < currentAuction.current_bid + minIncrement) {
        errors.push(`Minimum bid must be at least ${auctionCurrencyRates[auctionCurrentCurrency].symbol} ${((currentAuction.current_bid + minIncrement) * auctionCurrencyRates[auctionCurrentCurrency].rate).toFixed(2)}`);
    }
    
    return errors;
}

async function placeBid() {
    const user = getCurrentUser();
    if (!user) {
        showToast('Please login to place a bid', 'error');
        window.location.href = '../AUTH/login.html';
        return;
    }
    
    const bidInput = document.getElementById('bid-amount');
    const bidAmount = parseFloat(bidInput.value);
    const errorDiv = document.getElementById('bid-error');
    const successDiv = document.getElementById('bid-success');
    const rate = auctionCurrencyRates[auctionCurrentCurrency].rate;
    const symbol = auctionCurrencyRates[auctionCurrentCurrency].symbol;
    
    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';
    bidInput.classList.remove('bid-input-error');
    
    const errors = validateBid(bidAmount);
    
    if (errors.length > 0) {
        errorDiv.innerHTML = errors.join('<br>');
        errorDiv.style.display = 'block';
        bidInput.classList.add('bid-input-error');
        return;
    }
    
    try {
        const response = await fetch(AUCTION_API_URL + 'place_bid', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                auction_id: currentAuction.id,
                bid_amount: bidAmount
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentAuction.current_bid = bidAmount;
            currentAuction.bid_count = (currentAuction.bid_count || 0) + 1;
            
            const newCurrentBidConverted = (bidAmount * rate).toFixed(2);
            const newMinBid = bidAmount + (currentAuction.min_increment || 5);
            const newMinBidConverted = (newMinBid * rate).toFixed(2);
            
            const currentBidElement = document.getElementById('current-bid-amount');
            currentBidElement.textContent = `${symbol} ${newCurrentBidConverted}`;
            currentBidElement.classList.add('current-bid-highlight');
            setTimeout(() => currentBidElement.classList.remove('current-bid-highlight'), 500);
            
            document.getElementById('min-bid-amount').textContent = `${symbol} ${newMinBidConverted}`;
            
            bidInput.min = newMinBid;
            bidInput.value = newMinBid;
            bidInput.classList.remove('bid-input-error');
            
            const bidCountBadge = document.querySelector('.bid-count-badge');
            if (bidCountBadge) {
                bidCountBadge.innerHTML = `<i class="fas fa-gavel"></i> ${currentAuction.bid_count} bids`;
            }
            
            const bidHistoryTitle = document.querySelector('.bid-history h4');
            if (bidHistoryTitle) {
                bidHistoryTitle.innerHTML = `Bid History (${currentAuction.bid_count} bids)`;
            }
            
            await loadBidHistory();
            
            successDiv.innerHTML = `✓ Bid placed successfully! You are now the highest bidder at ${symbol} ${newCurrentBidConverted}`;
            successDiv.style.display = 'block';
            showToast(`Bid placed successfully!`, 'success');
            
            setTimeout(() => {
                successDiv.style.display = 'none';
            }, 5000);
        } else {
            showToast(data.message || 'Failed to place bid', 'error');
        }
    } catch (error) {
        console.error('Place bid error:', error);
        showToast('Network error. Please try again.', 'error');
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', () => {
    loadCurrencyPreference();
    loadAuctionDetail();
    updateCartCount();
    checkAuth();
});

window.changeCurrency = changeCurrency;
window.placeBid = placeBid;