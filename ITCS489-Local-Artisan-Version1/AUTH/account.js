// =============================================
// ACCOUNT.JS - User Account Management
// =============================================

// ===== ORDER FUNCTIONS =====

async function loadOrders() {
    const container = document.getElementById('orders-container');
    if (!container) return;
    
    const user = getCurrentUser();
    
    if (!user) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-sign-in-alt"></i><h4>Please Login</h4><p>Login to view your orders</p><a href="login.html" class="btn-primary">Login Now</a></div>';
        return;
    }
    
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    try {
        const response = await fetch('../api.php?request=get_orders');
        const data = await response.json();
        
        if (data.success && data.orders && data.orders.length > 0) {
            container.innerHTML = `
                <div class="orders-grid">
                    ${data.orders.map(order => `
                        <div class="order-card">
                            <div class="order-header">
                                <span class="order-number"><i class="fas fa-receipt"></i> ${order.order_number}</span>
                                <span class="status-badge status-${order.status}">${order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Pending'}</span>
                            </div>
                            <div class="order-details">
                                <div class="order-info">
                                    <span><i class="fas fa-calendar"></i> ${new Date(order.created_at).toLocaleDateString()}</span>
                                    <span><i class="fas fa-box"></i> ${order.item_count || 0} item(s)</span>
                                </div>
                                <span class="order-total">BD ${parseFloat(order.total_amount).toFixed(2)}</span>
                                <button class="view-order-btn" onclick="viewOrderDetails('${order.order_number}')">View Details →</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-shopping-bag"></i><h4>No Orders Yet</h4><p>You haven\'t placed any orders yet.</p><a href="../SHOPPING/shop.html" class="btn-primary">Start Shopping</a></div>';
        }
    } catch (error) {
        console.error('Error loading orders:', error);
        container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-circle"></i><h4>Error Loading Orders</h4><p>Please try again later.</p></div>';
    }
}

function viewOrderDetails(orderNumber) {
    window.location.href = `order_tracking.html?order=${orderNumber}`;
}

// ===== PROFILE FUNCTIONS =====

async function loadProfile() {
    const user = getCurrentUser();
    const profileContainer = document.querySelector('.profile-form');
    
    if (!user) {
        // Show login message instead of profile form
        if (profileContainer) {
            profileContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-sign-in-alt"></i>
                    <h4>Please Login</h4>
                    <p>Login to view and update your profile</p>
                    <a href="login.html" class="btn-primary">Login Now</a>
                </div>
            `;
        }
        return;
    }
    
    // User is logged in, show the form (make sure form exists)
    if (profileContainer && profileContainer.querySelector('form')) {
        const nameInput = document.getElementById('profile-name');
        const emailInput = document.getElementById('profile-email');
        const phoneInput = document.getElementById('profile-phone');
        
        if (nameInput) nameInput.value = user.fullname || '';
        if (emailInput) emailInput.value = user.email || '';
        if (phoneInput) phoneInput.value = user.phone || '';
    }
}

async function updateProfile(event) {
    if (event) event.preventDefault();
    
    const user = getCurrentUser();
    
    if (!user) {
        showToast('Please login to update profile', 'error');
        window.location.href = 'login.html';
        return;
    }
    
    const fullname = document.getElementById('profile-name')?.value;
    const email = document.getElementById('profile-email')?.value;
    const phone = document.getElementById('profile-phone')?.value;
    const password = document.getElementById('profile-password')?.value;
    
    if (!fullname || !email) {
        showToast('Name and email are required', 'error');
        return;
    }
    
    if (password && password.length < 6) {
        showToast('Password must be at least 6 characters', 'error');
        return;
    }
    
    // Show loading state
    const submitBtn = document.querySelector('#profile-form button[type="submit"]');
    const originalText = submitBtn?.innerHTML;
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
        submitBtn.disabled = true;
    }
    
    try {
        const updateData = { fullname, email, phone };
        if (password && password.length >= 6) {
            updateData.password = password;
        }
        
        const response = await fetch('../api.php?request=update_profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Update local user data
            const updatedUser = { ...user, fullname, email, phone };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            showToast('Profile updated successfully!', 'success');
            
            // Clear password field
            const passwordField = document.getElementById('profile-password');
            if (passwordField) passwordField.value = '';
            
            // Update welcome message if function exists
            if (typeof updateWelcomeMessage === 'function') {
                updateWelcomeMessage();
            }
        } else {
            showToast(data.message || 'Error updating profile', 'error');
        }
    } catch (error) {
        console.error('Update profile error:', error);
        showToast('Network error. Please try again.', 'error');
    } finally {
        if (submitBtn) {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }
}

// ===== TRACKING FUNCTIONS =====

async function trackOrder() {
    const orderNumber = document.getElementById('tracking-number')?.value;
    const resultDiv = document.getElementById('tracking-result');
    
    if (!orderNumber) {
        showToast('Please enter an order number', 'error');
        return;
    }
    
    if (resultDiv) {
        resultDiv.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    }
    
    try {
        const response = await fetch(`../api.php?request=get_order&order_number=${orderNumber}`);
        const data = await response.json();
        
        if (resultDiv) {
            if (data.success && data.order) {
                const order = data.order;
                const statusOrder = ['pending', 'processing', 'shipped', 'delivered'];
                const currentStep = statusOrder.indexOf(order.status) + 1;
                const progressPercent = (currentStep / 4) * 100;
                
                resultDiv.innerHTML = `
                    <div class="tracking-info" style="background: #f7f9fc; padding: 20px; border-radius: 10px; margin-top: 20px;">
                        <h4>Order: ${order.order_number}</h4>
                        <div class="tracking-steps" style="margin-top: 20px;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap;">
                                <div style="${currentStep >= 1 ? 'color: #28a745;' : ''}">
                                    <i class="fas ${currentStep >= 1 ? 'fa-check-circle' : 'fa-circle'}"></i> Order Placed
                                </div>
                                <div style="${currentStep >= 2 ? 'color: #28a745;' : ''}">
                                    <i class="fas ${currentStep >= 2 ? 'fa-check-circle' : 'fa-circle'}"></i> Processing
                                </div>
                                <div style="${currentStep >= 3 ? 'color: #28a745;' : ''}">
                                    <i class="fas ${currentStep >= 3 ? 'fa-check-circle' : 'fa-circle'}"></i> Shipped
                                </div>
                                <div style="${currentStep >= 4 ? 'color: #28a745;' : ''}">
                                    <i class="fas ${currentStep >= 4 ? 'fa-check-circle' : 'fa-circle'}"></i> Delivered
                                </div>
                            </div>
                            <div class="progress-bar" style="height: 4px; background: #ddd; border-radius: 2px;">
                                <div style="width: ${progressPercent}%; height: 100%; background: #1a4b72; border-radius: 2px;"></div>
                            </div>
                            <p style="margin-top: 20px;">
                                <strong>Status:</strong> ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}<br>
                                <strong>Total Amount:</strong> BD ${parseFloat(order.total_amount).toFixed(2)}<br>
                                <strong>Order Date:</strong> ${new Date(order.created_at).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                `;
            } else {
                resultDiv.innerHTML = `<p style="color: red;">Order #${orderNumber} not found.</p>`;
            }
        }
    } catch (error) {
        console.error('Track order error:', error);
        if (resultDiv) {
            resultDiv.innerHTML = '<p style="color: red;">Error tracking order. Please try again.</p>';
        }
    }
}

// ===== ADDED: Function to update welcome message =====
function updateWelcomeMessage() {
    let user = getCurrentUser();
    
    if (!user || !user.fullname) {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                user = JSON.parse(storedUser);
            } catch(e) {
                console.error('Error parsing user data:', e);
            }
        }
    }
    
    const nameElement = document.getElementById('user-name-display');
    if (nameElement) {
        if (user && user.fullname) {
            const firstName = user.fullname.split(' ')[0];
            nameElement.textContent = firstName;
        } else {
            nameElement.textContent = 'Guest';
        }
    }
}


// Track if confetti has been shown for this session
let confettiShownForSession = false;

// Load Combined Auction History (Won + Lost)
async function loadAuctionHistory() {
    const container = document.getElementById('auction-history-container');
    if (!container) return;
    
    const user = getCurrentUser();
    if (!user) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-sign-in-alt"></i><h4>Please Login</h4><p>Login to view your auction history</p></div>';
        return;
    }
    
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    try {
        const response = await fetch('../api.php?request=get_user_auction_history');
        const data = await response.json();
        
        if (data.success && data.auctions && data.auctions.length > 0) {
            // Check if the most recent auction is a WIN (for confetti)
            const mostRecent = data.auctions[0];
            const isNewWin = (mostRecent.status === 'won');
            
            // Trigger confetti ONLY if most recent is a win AND not shown this session
            if (isNewWin && !confettiShownForSession) {
                triggerWinnerConfetti();
                confettiShownForSession = true;
                showToast('🎉 Congratulations on your recent win! 🎉', 'success');
            }
            
            container.innerHTML = `
                <div style="display: grid; gap: 20px;">
                    ${data.auctions.map(auction => `
                        <div class="auction-history-card" style="padding: 20px; border-radius: 16px; ${auction.status === 'won' ? 'background: linear-gradient(135deg, #28a74510, #1a4b7210); border-left: 4px solid #28a745;' : 'background: #f5f5f5; border-left: 4px solid #999; opacity: 0.85;'}">
                            <div style="display: flex; gap: 20px; flex-wrap: wrap; align-items: center;">
                                <img src="${auction.image_url || 'https://placehold.co/100x100/1a4b72/white?text=' + encodeURIComponent(auction.title)}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px; ${auction.status !== 'won' ? 'filter: grayscale(0.3);' : ''}">
                                <div style="flex: 1;">
                                    <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                                        <h3 style="margin: 0; ${auction.status === 'won' ? 'color: #1a4b72;' : 'color: #666;'}">${escapeHtml(auction.title)}</h3>
                                        ${auction.status === 'won' ? 
                                            `<span style="background: #28a745; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px;">
                                                <i class="fas fa-trophy"></i> YOU WON!
                                            </span>` :
                                            `<span style="background: #999; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px;">
                                                <i class="fas fa-heart-broken"></i> Didn't Win
                                            </span>`
                                        }
                                    </div>
                                    
                                    <p style="margin: 10px 0 5px 0;">
                                        <strong>Winning Bid:</strong> BD ${parseFloat(auction.winning_bid).toFixed(2)}
                                    </p>
                                    
                                    ${auction.status === 'lost' ? `
                                        <p style="margin: 5px 0;">
                                            <strong>Your Highest Bid:</strong> BD ${parseFloat(auction.my_highest_bid || 0).toFixed(2)}
                                        </p>
                                    ` : ''}
                                    
                                    <p style="margin: 5px 0; color: #666; font-size: 13px;">
                                        <strong>Auction Ended:</strong> ${new Date(auction.end_time).toLocaleString()}
                                    </p>
                                    
                                    <div style="margin-top: 15px;">
    ${auction.status === 'won' ? 
        (auction.already_purchased ? 
            `<span style="background: #28a745; color: white; padding: 10px 20px; border-radius: 8px; display: inline-block;">
                <i class="fas fa-check-circle"></i> Purchased / Added to Cart
            </span>` :
            (new Date(auction.winner_expires) > new Date() ? 
                `<button onclick="addWonAuctionToCart(${auction.id})" class="btn-primary" style="background: #1a4b72; padding: 10px 20px;">
                    <i class="fas fa-shopping-cart"></i> Add to Cart & Checkout
                </button>` :
                `<span style="background: #dc3545; color: white; padding: 10px 20px; border-radius: 8px; display: inline-block;">
                    <i class="fas fa-clock"></i> Purchase Window Expired
                </span>`
            )
        ) :
        `<a href="../AUCTIONS/auction.html" class="btn-secondary" style="background: #1a4b72; padding: 10px 20px; text-decoration: none; display: inline-block; border-radius: 8px; color: white;">
            <i class="fas fa-gavel"></i> Browse Active Auctions
        </a>`
    }
</div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-gavel"></i><h4>No Auction History Yet</h4><p>When you participate in auctions, your history will appear here.</p><a href="../AUCTIONS/auction.html" class="btn-primary">Browse Auctions →</a></div>';
        }
    } catch (error) {
        console.error('Error loading auction history:', error);
        container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-circle"></i><h4>Error Loading</h4><p>Please try again later.</p></div>';
    }
}






// Confetti effect for winner
function triggerWinnerConfetti() {
    // Use canvas-confetti library
    if (typeof confetti === 'function') {
        confetti({
            particleCount: 200,
            spread: 100,
            origin: { y: 0.6 },
            startVelocity: 20,
            colors: ['#1a4b72', '#28a745', '#ffc107', '#ffffff']
        });
        
        // Second burst
        setTimeout(() => {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.5, x: 0.3 },
                colors: ['#1a4b72', '#28a745']
            });
        }, 200);
        
        setTimeout(() => {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.5, x: 0.7 },
                colors: ['#ffc107', '#ffffff']
            });
        }, 400);
    } else {
        // Simple fallback confetti
        console.log('🎉 Congratulations! You won an auction! 🎉');
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
        for (let i = 0; i < 200; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height - canvas.height,
                size: Math.random() * 8 + 4,
                color: `hsl(${Math.random() * 60 + 200}, 70%, 55%)`,
                speed: Math.random() * 5 + 3
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
        }, 4000);
    }
}

async function addWonAuctionToCart(auctionId) {
    try {
        const response = await fetch('../api.php?request=add_auction_to_cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ auction_id: auctionId })
        });
        const data = await response.json();
        
        if (data.success) {
            showToast(data.message, 'success');
            
            // RELOAD the auction history to update the button
            await loadAuctionHistory();
            
            setTimeout(() => {
                window.location.href = '../SHOPPING/cart.html';
            }, 1500);
        } else {
            showToast(data.message || 'Failed to add to cart', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Network error', 'error');
    }
}

// Make functions global
window.loadOrders = loadOrders;
window.loadProfile = loadProfile;
window.updateProfile = updateProfile;
window.trackOrder = trackOrder;
window.viewOrderDetails = viewOrderDetails;
window.updateWelcomeMessage = updateWelcomeMessage;
window.loadAuctionHistory = loadAuctionHistory;
window.addWonAuctionToCart = addWonAuctionToCart;