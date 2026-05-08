// =============================================
// WISHLIST.JS - Wishlist Management
// =============================================

async function addToWishlist(productId) {
    const user = getCurrentUser();
    if (!user) {
        showToast('Please login to add to wishlist', 'error');
        window.location.href = 'login.html';
        return;
    }
    
    try {
        const response = await fetch(API_URL + 'add_to_wishlist', {
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
    }
}

// Make functions global
window.addToWishlist = addToWishlist;
