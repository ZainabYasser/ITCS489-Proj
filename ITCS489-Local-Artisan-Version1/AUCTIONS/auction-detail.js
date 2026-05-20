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
    await fetch(AUCTION_API_URL + 'process_ended_auctions');
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
    
    const currentBid = parseFloat(currentAuction.current_bid) || 0;
    const startBid = parseFloat(currentAuction.start_bid) || 0;
    let minIncrement = parseFloat(currentAuction.min_increment) || 5;
    minIncrement = parseFloat(minIncrement); 
    const minBid = currentBid + minIncrement;
    
    const currentBidConverted = (currentBid * rate).toFixed(2);
    const startingBidConverted = (startBid * rate).toFixed(2);
    const minBidConverted = (minBid * rate).toFixed(2);
    const imageUrl = currentAuction.image_url || `https://placehold.co/600x500/1a4b72/white?text=${encodeURIComponent(currentAuction.title)}`;
    
    // Check if auction has ended
    const isEnded = currentAuction.is_ended || new Date(currentAuction.end_time) < new Date();
    const user = getCurrentUser();
    const isWinner = currentAuction.is_winner === true;
    const canPurchase = currentAuction.can_purchase === true;
    
    // Winner/Loser message HTML
    let winnerMessageHtml = '';
    if (isEnded && user) {
        if (isWinner && canPurchase) {
            const expiryDate = new Date(currentAuction.winner_expires);
            winnerMessageHtml = `
                <div style="background: linear-gradient(135deg, #28a74520, #1a4b7220); border-left: 4px solid #28a745; padding: 20px; border-radius: 10px; margin-bottom: 20px; text-align: center;">
                    <i class="fas fa-trophy" style="font-size: 48px; color: #ffc107;"></i>
                    <h2 style="color: #28a745; margin: 10px 0;">🎉 Congratulations! You won this auction! 🎉</h2>
                    <p>You won at ${symbol} ${currentBidConverted}</p>
                    <p style="color: #666;">You have until <strong>${expiryDate.toLocaleString()}</strong> to purchase this item.</p>
                    <button class="add-to-cart-winner" onclick="addWinnerToCart()" style="background: #1a4b72; color: white; border: none; padding: 12px 30px; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; margin-top: 10px;">
                        <i class="fas fa-shopping-cart"></i> Add to Cart & Checkout
                    </button>
                </div>
            `;
            // Trigger confetti
            triggerConfetti();
        } else if (isWinner && !canPurchase) {
            winnerMessageHtml = `
                <div style="background: #dc354520; border-left: 4px solid #dc3545; padding: 20px; border-radius: 10px; margin-bottom: 20px; text-align: center;">
                    <i class="fas fa-clock" style="font-size: 48px; color: #dc3545;"></i>
                    <h3 style="color: #dc3545;">Purchase Window Expired</h3>
                    <p>You won this auction but your 48-hour purchase window has expired.</p>
                    <p>This item is no longer available for purchase.</p>
                </div>
            `;
        } else if (!isWinner && currentAuction.current_bidder_id) {
            winnerMessageHtml = `
                <div style="background: #ffc10720; border-left: 4px solid #ffc107; padding: 20px; border-radius: 10px; margin-bottom: 20px; text-align: center;">
                    <i class="fas fa-heart-broken" style="font-size: 48px; color: #ff9800;"></i>
                    <h3 style="color: #ff9800;">Better Luck Next Time!</h3>
                    <p>You didn't win this auction, but don't give up!</p>
                    <a href="auction.html" class="btn-primary" style="display: inline-block; margin-top: 10px;">Browse Other Auctions →</a>
                </div>
            `;
        }
    }
    
    // Bid placement section (only show if auction not ended and user is not winner waiting to purchase)
    let bidPlacementHtml = '';
    if (!isEnded) {
        bidPlacementHtml = `
            <div class="bid-placement">
                <h4>Place Your Bid</h4>
                <input type="number" id="bid-amount" step="${minIncrement}" placeholder="Enter bid amount">
                <div id="bid-error" class="bid-error"></div>
                <div id="bid-success" class="bid-success"></div>
                <button class="place-bid-btn" onclick="placeBid()">Place Bid</button>
                <p style="font-size: 12px; margin-top: 10px; color: #666;">
                    <i class="fas fa-info-circle"></i> Minimum bid: ${symbol} ${minBidConverted}
                </p>
            </div>
        `;
    } else if (isEnded && isWinner && canPurchase) {
        bidPlacementHtml = ''; // No bid placement for winner, they see Add to Cart button
    } else if (isEnded && !isWinner) {
        bidPlacementHtml = ''; // No bid placement for losers
    }
    
    container.innerHTML = `
        <div class="auction-detail-layout">
            <div class="auction-gallery">
                <img src="${imageUrl}" alt="${escapeHtml(currentAuction.title)}">
            </div>
            <div class="auction-info-detail">
                ${winnerMessageHtml}
                <h1>${escapeHtml(currentAuction.title)} 
                    <span class="bid-count-badge">
                        <i class="fas fa-gavel"></i> ${currentAuction.bid_count || 0} ${currentAuction.bid_count == 1 ? 'bid' : 'bids'}
                    </span>
                </h1>
                <p class="artisan-name">by ${escapeHtml(currentAuction.artisan_name || 'Local Artisan')}</p>
                <p>${escapeHtml(currentAuction.description || 'Beautiful handmade piece up for auction.')}</p>
                
                <div class="auction-timer-card">
                    <h4>${isEnded ? 'Auction Ended' : 'Time Remaining'}</h4>
                    <div class="countdown-large" id="countdown-timer">${isEnded ? 'Ended' : '--:--:--'}</div>
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
                
                ${bidPlacementHtml}
                
                <div class="bid-history">
                    <h4>Bid History (${currentAuction.bid_count || 0} ${currentAuction.bid_count == 1 ? 'bid' : 'bids'})</h4>
                    <div id="bid-history-list" class="bid-history-list">
                        <p style="padding: 20px; text-align: center;">Loading bids...</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const bidInput = document.getElementById('bid-amount');
    if (bidInput && !isEnded) {
        const convertedMinBid = minBid * rate; 
        bidInput.min = convertedMinBid;
        bidInput.value = convertedMinBid;
        bidInput.value = convertedMinBid.toFixed(2);
    }
}

// Confetti effect for winner
function triggerConfetti() {
    if (typeof confetti === 'function') {
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#1a4b72', '#28a745', '#ffc107', '#ffffff']
        });
    } else {
        // Simple confetti using canvas
        const canvas = document.createElement('canvas');
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '9999';
        document.body.appendChild(canvas);
        
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        const particles = [];
        for (let i = 0; i < 150; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height - canvas.height,
                size: Math.random() * 8 + 4,
                color: `hsl(${Math.random() * 60 + 200}, 70%, 50%)`,
                speed: Math.random() * 5 + 3,
                rotation: Math.random() * 360
            });
        }
        
        let animationId;
        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            let active = 0;
            for (let p of particles) {
                p.y += p.speed;
                if (p.y < canvas.height) {
                    active++;
                    ctx.fillStyle = p.color;
                    ctx.fillRect(p.x, p.y, p.size, p.size);
                }
            }
            if (active > 0) {
                animationId = requestAnimationFrame(animate);
            } else {
                cancelAnimationFrame(animationId);
                canvas.remove();
            }
        }
        animate();
        
        setTimeout(() => {
            if (animationId) cancelAnimationFrame(animationId);
            if (canvas) canvas.remove();
        }, 3000);
    }
}

// Add winner's auction item to cart
async function addWinnerToCart() {
    const user = getCurrentUser();
    if (!user) {
        showToast('Please login to add to cart', 'error');
        window.location.href = '../AUTH/login.html';
        return;
    }
    
    try {
        const response = await fetch(AUCTION_API_URL + 'add_auction_to_cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ auction_id: currentAuction.id })
        });
        const data = await response.json();
        
        if (data.success) {
            showToast(data.message, 'success');
            updateCartCount();
            // Optionally redirect to cart
            setTimeout(() => {
                window.location.href = '../SHOPPING/cart.html';
            }, 1500);
        } else {
            showToast(data.message || 'Failed to add to cart', 'error');
        }
    } catch (error) {
        console.error('Add to cart error:', error);
        showToast('Network error. Please try again.', 'error');
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
    const displayedAmount = parseFloat(bidInput.value);
    const rate = auctionCurrencyRates[auctionCurrentCurrency].rate;
    const bidAmount = displayedAmount / rate; // Convert back to BHD
    
    const errorDiv = document.getElementById('bid-error');
    const successDiv = document.getElementById('bid-success');
    const symbol = auctionCurrencyRates[auctionCurrentCurrency].symbol;
    
    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';
    bidInput.classList.remove('bid-input-error');
    
    // Validate using the actual BHD amount
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
            const increment = parseFloat(currentAuction.min_increment) || 5;
            const newMinBid = bidAmount + increment;
            const newMinBidConverted = (newMinBid * rate).toFixed(2);
            
            // Update displayed current bid
            const currentBidElement = document.getElementById('current-bid-amount');
            currentBidElement.textContent = `${symbol} ${newCurrentBidConverted}`;
            currentBidElement.classList.add('current-bid-highlight');
            setTimeout(() => currentBidElement.classList.remove('current-bid-highlight'), 500);
            
            // Update displayed minimum next bid
            document.getElementById('min-bid-amount').textContent = `${symbol} ${newMinBidConverted}`;
            
            // Update input field: set to the CONVERTED minimum bid amount
            const convertedMinBid = newMinBid * rate;
            bidInput.min = convertedMinBid;
            bidInput.value = convertedMinBid.toFixed(2);
            bidInput.classList.remove('bid-input-error');
            
            // Update the minimum bid text below
            const minBidText = document.querySelector('.bid-placement p');
            if (minBidText) {
                minBidText.innerHTML = `<i class="fas fa-info-circle"></i> Minimum bid: ${symbol} ${newMinBidConverted}`;
            }
            
            // Update bid count badge
            const bidCountBadge = document.querySelector('.bid-count-badge');
            if (bidCountBadge) {
                bidCountBadge.innerHTML = `<i class="fas fa-gavel"></i> ${currentAuction.bid_count} ${currentAuction.bid_count == 1 ? 'bid' : 'bids'}`;
            }
            
            const bidHistoryTitle = document.querySelector('.bid-history h4');
            if (bidHistoryTitle) {
                bidHistoryTitle.innerHTML = `Bid History (${currentAuction.bid_count} ${currentAuction.bid_count == 1 ? 'bid' : 'bids'})`;;
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
window.addWinnerToCart = addWinnerToCart;