// =============================================
// ADDTOCART.JS - Add to Cart Function
// =============================================

async function addToCart(productId, quantity = 1) {
    const user = getCurrentUser();
    if (!user) {
        showToast('Please login to add items to cart', 'error');
        window.location.href = 'login.html';
        return;
    }
    
    try {
        const response = await fetch(API_URL + 'add_to_cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product_id: productId, quantity: quantity })
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
        showToast('Network error', 'error');
    }
}

// Make functions global
window.addToCart = addToCart;