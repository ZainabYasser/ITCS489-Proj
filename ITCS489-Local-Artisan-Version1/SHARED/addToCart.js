// =============================================
// ADD TO CART - Shared Function
// =============================================

async function addToCart(productId) {    
    const user = getCurrentUser();
    if (!user) {
        showToast('Please login to add items to cart', 'error');
        window.location.href = '../AUTH/login.html';
        return;
    }
    
    try {
        // Use relative path - goes up one level from SHARED to root
        const response = await fetch('../api.php?request=add_to_cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product_id: productId, quantity: 1 })
        });
        const data = await response.json();
        
        if (data.success) {
            showToast('Added to cart!', 'success');
            // Refresh cart count after adding
            if (typeof updateCartCount === 'function') {
                await updateCartCount();
            }
        } else {
            showToast(data.message || 'Failed to add to cart', 'error');
        }
    } catch (error) {
        console.error('Add to cart error:', error);
        showToast('Network error. Please try again.', 'error');
    }
}

window.addToCart = addToCart;