async function addToCart(productId, quantity = 1) {
    const user = getCurrentUser();
    if (!user) {
        showToast('Please login to add items to cart', 'error');
        window.location.href = 'AUTH/login.html';
        return;
    }
    
    try {
        // Use direct path without API_URL
        const response = await fetch('api.php?request=add_to_cart', {
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

window.addToCart = addToCart;