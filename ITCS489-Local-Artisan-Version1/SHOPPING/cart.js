// =============================================
// CART.JS - Shopping Cart Management
// =============================================

async function loadCart() {
    const container = document.getElementById('cart-container');
    if (!container) return;
    
    const user = getCurrentUser();
    if (!user) {
        container.innerHTML = `
            <div class="empty-cart" style="text-align: center; padding: 60px;">
                <i class="fas fa-sign-in-alt" style="font-size: 64px; color: #ccc;"></i>
                <h3>Please Login</h3>
                <p>Login to view your cart items</p>
                <a href="../AUTH/login.html" class="btn-primary">Login Now</a>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    try {
        const response = await fetch('../api.php?request=get_cart');
        const data = await response.json();
        console.log('Cart data:', data);
        
        if (data.success && data.cart && data.cart.length > 0) {
            displayCartItems(data.cart);
        } else {
            container.innerHTML = `
                <div class="empty-cart" style="text-align: center; padding: 60px;">
                    <i class="fas fa-shopping-cart" style="font-size: 64px; color: #ccc;"></i>
                    <h3>Your cart is empty</h3>
                    <p>Looks like you haven't added any items yet</p>
                    <a href="shop.html" class="btn-primary">Continue Shopping</a>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading cart:', error);
        container.innerHTML = '<p class="text-center" style="color: red;">Error loading cart. Please try again.</p>';
    }
    updateCartCount();
}

function displayCartItems(cart) {
    const container = document.getElementById('cart-container');
    let totalBHD = 0;
    
    let itemsHTML = '<div class="cart-layout"><div class="cart-items-list">';
    
    for (const item of cart) {
        const subtotalBHD = item.price * item.quantity;
        totalBHD += subtotalBHD;
        const priceFormatted = formatPrice(item.price);
        const subtotalFormatted = formatPrice(subtotalBHD);
        
        itemsHTML += `
            <div class="cart-item" id="cart-item-${item.id}" style="display: flex; flex-wrap: wrap; gap: 15px; align-items: center; padding: 20px; border-bottom: 1px solid #eee;">
                <div style="width: 80px;">
                    <img src="${item.image_url || 'https://placehold.co/80x80/8B5E3C/white?text=' + encodeURIComponent(item.name)}" alt="${item.name}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px;">
                </div>
                <div style="flex: 2;">
                    <h4 style="margin-bottom: 5px;">${escapeHtml(item.name)}</h4>
                    <p style="color: #666; font-size: 14px;">by ${escapeHtml(item.artisan_name || 'Local Artisan')}</p>
                </div>
                <div style="min-width: 80px; font-weight: 600; color: var(--primary);">${priceFormatted}</div>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <button onclick="updateCartItem(${item.id}, ${item.quantity - 1})" style="width: 30px; height: 30px; border: 1px solid #ddd; background: white; cursor: pointer; border-radius: 5px;">-</button>
                    <span id="qty-${item.id}" style="min-width: 30px; text-align: center;">${item.quantity}</span>
                    <button onclick="updateCartItem(${item.id}, ${item.quantity + 1})" style="width: 30px; height: 30px; border: 1px solid #ddd; background: white; cursor: pointer; border-radius: 5px;">+</button>
                </div>
                <div style="min-width: 80px; font-weight: 700;" id="subtotal-${item.id}">${subtotalFormatted}</div>
                <button class="remove-item" onclick="removeFromCart(${item.id})" style="color: #dc3545; cursor: pointer; background: none; border: none; font-size: 18px;"><i class="fas fa-trash"></i></button>
            </div>
        `;
    }
    
    const shippingBHD = totalBHD > 0 ? 5 : 0;
    const grandTotalBHD = totalBHD + shippingBHD;
    const totalFormatted = formatPrice(totalBHD);
    const shippingFormatted = formatPrice(shippingBHD);
    const grandFormatted = formatPrice(grandTotalBHD);
    
    itemsHTML += `</div>
        <div class="summary-card" style="background: var(--bg-warm); padding: 25px; border-radius: 10px; position: sticky; top: 100px;">
            <h3 style="margin-bottom: 20px;">Order Summary</h3>
            <div class="summary-row" style="display: flex; justify-content: space-between; padding: 10px 0;"><span>Subtotal</span><span>${totalFormatted}</span></div>
            <div class="summary-row" style="display: flex; justify-content: space-between; padding: 10px 0;"><span>Shipping</span><span>${shippingFormatted}</span></div>
            <div class="summary-row total" style="display: flex; justify-content: space-between; padding: 15px 0; margin-top: 10px; border-top: 2px solid var(--border); font-weight: 700; font-size: 18px;"><span>Total</span><span style="color: var(--primary);">${grandFormatted}</span></div>
            <button class="checkout-btn" onclick="proceedToCheckout()" style="width: 100%; background: var(--primary); color: white; border: none; padding: 14px; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; margin-top: 20px;">Proceed to Checkout</button>
            <a href="shop.html" class="continue-shopping" style="display: block; text-align: center; margin-top: 15px; color: var(--primary);">Continue Shopping</a>
        </div>
    </div>`;
    
    container.innerHTML = itemsHTML;
}

async function updateCartItem(cartId, newQuantity) {
    if (newQuantity < 1) {
        removeFromCart(cartId);
        return;
    }
    
    try {
        const response = await fetch('../api.php?request=update_cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cart_id: cartId, quantity: newQuantity })
        });
        const data = await response.json();
        
        if (data.success) {
            loadCart();
        } else {
            showToast(data.message || 'Update failed', 'error');
        }
    } catch (error) {
        console.error('Update cart error:', error);
        showToast('Network error. Please try again.', 'error');
    }
    updateCartCount();
}

async function removeFromCart(cartId) {
    if (!confirm('Remove this item from cart?')) return;
    
    try {
        const response = await fetch('../api.php?request=update_cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cart_id: cartId, quantity: 0 })
        });
        const data = await response.json();
        
        if (data.success) {
            showToast('Item removed from cart', 'success');
            loadCart();
        }
    } catch (error) {
        console.error('Remove from cart error:', error);
        showToast('Error removing item', 'error');
    }
    updateCartCount();
}

async function updateCartCount() {
    const user = getCurrentUser();
    if (!user) {
        const cartCountElements = document.querySelectorAll('.cart-count');
        cartCountElements.forEach(el => {
            el.textContent = '0';
            el.style.display = 'none';
        });
        return;
    }
    
    try {
        const response = await fetch('../api.php?request=get_cart');
        const data = await response.json();
        const count = data.success && data.cart ? data.cart.reduce((sum, item) => sum + item.quantity, 0) : 0;
        
        const cartCountElements = document.querySelectorAll('.cart-count');
        cartCountElements.forEach(el => {
            el.textContent = count;
            el.style.display = count > 0 ? 'inline-block' : 'none';
        });
    } catch (error) {
        console.error('Update cart count error:', error);
    }
}

function proceedToCheckout() {
    window.location.href = 'checkout.html';
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make functions global
window.loadCart = loadCart;
window.updateCartItem = updateCartItem;
window.removeFromCart = removeFromCart;
window.proceedToCheckout = proceedToCheckout;
window.updateCartCount = updateCartCount;

// Load cart when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadCart();
});