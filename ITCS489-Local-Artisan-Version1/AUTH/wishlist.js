// =============================================
// WISHLIST.JS - Wishlist Management
// =============================================

async function loadWishlist() {
    const container = document.getElementById('wishlist-container');
    if (!container) return;
    
    const user = getCurrentUser();
    if (!user) {
        container.innerHTML = '<p class="text-center">Please login to view your wishlist</p>';
        return;
    }
    
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    try {
        const response = await fetch('../api.php?request=get_wishlist');
        const data = await response.json();
        
        if (data.success && data.wishlist && data.wishlist.length > 0) {
            container.innerHTML = data.wishlist.map(item => `
                <div class="product-card">
                    <div class="product-image">
                        <img src="${item.image_url || 'https://placehold.co/300x250/8B5E3C/white?text=' + encodeURIComponent(item.name)}" alt="${item.name}" loading="lazy">
                        <span class="product-category">Wishlist</span>
                    </div>
                    <div class="product-info">
                        <h3>${item.name}</h3>
                        <p class="artisan-name">by ${item.artisan_name || 'Local Artisan'}</p>
                        <p class="product-price">BD ${parseFloat(item.price).toFixed(2)}</p>
                        <div class="product-actions">
                            <button class="add-to-cart" onclick="addToCart(${item.product_id})">
                                <i class="fas fa-shopping-cart"></i> Add to Cart
                            </button>
                            <button class="wishlist-btn" onclick="removeFromWishlist(${item.product_id})">
                                <i class="fas fa-heart" style="color: #e91e63;"></i> Remove
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p class="text-center">Your wishlist is empty. <a href="../SHOPPING/shop.html">Browse products</a></p>';
        }
    } catch (error) {
        console.error('Error loading wishlist:', error);
        container.innerHTML = '<p class="text-center">Error loading wishlist. Please try again later.</p>';
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
        } else {
            showToast(data.message || 'Failed to add to wishlist', 'error');
        }
    } catch (error) {
        console.error('Wishlist error:', error);
        showToast('Network error. Please try again.', 'error');
    }
}

async function removeFromWishlist(productId) {
    const user = getCurrentUser();
    if (!user) {
        showToast('Please login to manage wishlist', 'error');
        window.location.href = 'login.html';
        return;
    }
    
    try {
        const response = await fetch('../api.php?request=remove_from_wishlist', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product_id: productId })
        });
        const data = await response.json();
        
        if (data.success) {
            showToast('Removed from wishlist', 'success');
            loadWishlist(); // Refresh the wishlist display
        } else {
            showToast(data.message || 'Failed to remove from wishlist', 'error');
        }
    } catch (error) {
        console.error('Remove from wishlist error:', error);
        showToast('Network error. Please try again.', 'error');
    }
}

// Make functions global
window.loadWishlist = loadWishlist;
window.addToWishlist = addToWishlist;
window.removeFromWishlist = removeFromWishlist;