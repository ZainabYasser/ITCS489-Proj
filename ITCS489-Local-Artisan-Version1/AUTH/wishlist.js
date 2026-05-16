// =============================================
// WISHLIST.JS - Wishlist Management (Enhanced Card Layout)
// =============================================

async function loadWishlist() {
    const container = document.getElementById('wishlist-container');
    if (!container) return;
    
    const user = getCurrentUser();
    if (!user) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-heart-broken"></i><h4>Please Login</h4><p>Login to view your wishlist</p><a href="login.html" class="btn-primary">Login Now</a></div>';
        return;
    }
    
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    try {
        const response = await fetch('../api.php?request=get_wishlist');
        const data = await response.json();
        
        if (data.success && data.wishlist && data.wishlist.length > 0) {
            // Enhanced card layout matching account.html styles
            container.innerHTML = `
                <div class="wishlist-grid">
                    ${data.wishlist.map(item => `
                        <div class="wishlist-item" id="wishlist-item-${item.product_id}">
                            <div class="wishlist-image">
                                <img src="${item.image_url || 'https://placehold.co/300x200/1a4b72/white?text=' + encodeURIComponent(item.name)}" alt="${escapeHtml(item.name)}" loading="lazy">
                                <button class="remove-wishlist-btn" onclick="removeFromWishlist(${item.product_id})">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                            <div class="wishlist-info">
                                <h4>${escapeHtml(item.name)}</h4>
                                <p class="artisan-name">by ${escapeHtml(item.artisan_name || 'Local Artisan')}</p>
                                <div class="wishlist-price">${formatPrice(item.price)}</div>
                                <div class="wishlist-actions">
                                    <button class="add-to-cart-wishlist" onclick="addToCartFromWishlist(${item.product_id})">
                                        <i class="fas fa-shopping-cart"></i> Add to Cart
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            // Enhanced empty state
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-heart-broken"></i>
                    <h4>Your Wishlist is Empty</h4>
                    <p>Save your favorite items here for later!</p>
                    <a href="../SHOPPING/shop.html" class="btn-primary">Browse Products</a>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading wishlist:', error);
        container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-circle"></i><h4>Error Loading Wishlist</h4><p>Please try again later.</p></div>';
    }
}

async function addToWishlist(productId) {
    const user = getCurrentUser();
    if (!user) {
        showToast('Please login to add to wishlist', 'error');
        window.location.href = 'login.html';
        return;
    }
    
    try {
        const response = await fetch('../api.php?request=add_to_wishlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product_id: productId })
        });
        const data = await response.json();
        
        if (data.success) {
            showToast('Added to wishlist!', 'success');
            // Optional: Update wishlist count or button state
        } else {
            showToast(data.message || 'Failed to add to wishlist', 'error');
        }
    } catch (error) {
        console.error('Wishlist error:', error);
        showToast('Network error. Please try again.', 'error');
    }
}

async function removeFromWishlist(productId) {
    try {
        const response = await fetch('../api.php?request=remove_from_wishlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product_id: productId })
        });
        const data = await response.json();
        
        if (data.success) {
            showToast('Removed from wishlist', 'success');
            
            // Animated removal
            const wishlistItem = document.getElementById(`wishlist-item-${productId}`);
            if (wishlistItem) {
                wishlistItem.style.transform = 'scale(0)';
                wishlistItem.style.opacity = '0';
                wishlistItem.style.transition = 'all 0.3s ease';
                setTimeout(() => {
                    wishlistItem.remove();
                    // Reload wishlist if empty
                    const container = document.getElementById('wishlist-container');
                    if (container && container.querySelectorAll('.wishlist-item').length === 0) {
                        loadWishlist();
                    }
                }, 300);
            } else {
                loadWishlist(); // Refresh if direct removal
            }
        } else {
            showToast(data.message || 'Failed to remove from wishlist', 'error');
        }
    } catch (error) {
        console.error('Remove from wishlist error:', error);
        showToast('Network error. Please try again.', 'error');
    }
}

// Add to cart from wishlist
async function addToCartFromWishlist(productId) {
    const user = getCurrentUser();
    if (!user) {
        showToast('Please login to add items to cart', 'error');
        window.location.href = 'login.html';
        return;
    }
    
    try {
        const response = await fetch('../api.php?request=add_to_cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product_id: productId, quantity: 1 })
        });
        const data = await response.json();
        
        if (data.success) {
            showToast('Added to cart!', 'success');
            updateCartCount();
        } else {
            showToast(data.message || 'Failed to add to cart', 'error');
        }
    } catch (error) {
        console.error('Add to cart error:', error);
        showToast('Network error. Please try again.', 'error');
    }
}

// Escape HTML helper to prevent XSS
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make functions global
window.loadWishlist = loadWishlist;
window.addToWishlist = addToWishlist;
window.removeFromWishlist = removeFromWishlist;
window.addToCartFromWishlist = addToCartFromWishlist;