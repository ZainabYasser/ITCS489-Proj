// =============================================
// CART.JS - Shopping Cart Management
// =============================================

async function loadCart() {
    const container = document.getElementById('cart-container');
    if (!container) return;
    
    const user = getCurrentUser();
    if (!user) {
        container.innerHTML = '<p class="text-center">Please login to view your cart</p>';
        return;
    }
    
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    try {
        const response = await fetch('../api.php?request=get_cart');
        const data = await response.json();
        
        if (data.success && data.cart && data.cart.length > 0) {
            displayCartItems(data.cart);
        } else {
            container.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-cart"></i>
                    <h3>Your cart is empty</h3>
                    <p>Looks like you haven't added any items yet</p>
                    <a href="shop.html" class="btn-primary">Continue Shopping</a>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading cart:', error);
        container.innerHTML = '<p class="text-center">Error loading cart</p>';
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
            <div class="cart-item" id="cart-item-${item.id}">
                <div class="cart-item-image">
                    <img src="${item.image_url || 'https://placehold.co/80x80/8B5E3C/white?text=' + encodeURIComponent(item.name)}" alt="${item.name}">
                </div>
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p class="artisan-name">by ${item.artisan_name || 'Local Artisan'}</p>
                </div>
                <div class="cart-item-price">${priceFormatted}</div>
                <div class="cart-item-quantity">
                    <button onclick="updateCartItem(${item.id}, ${item.quantity - 1})">-</button>
                    <span id="qty-${item.id}">${item.quantity}</span>
                    <button onclick="updateCartItem(${item.id}, ${item.quantity + 1})">+</button>
                </div>
                <div class="cart-item-subtotal" id="subtotal-${item.id}">${subtotalFormatted}</div>
                <button class="remove-item" onclick="removeFromCart(${item.id})"><i class="fas fa-trash"></i></button>
            </div>
        `;
    }
    
    const shippingBHD = totalBHD > 0 ? 5 : 0;
    const grandTotalBHD = totalBHD + shippingBHD;
    const totalFormatted = formatPrice(totalBHD);
    const shippingFormatted = formatPrice(shippingBHD);
    const grandFormatted = formatPrice(grandTotalBHD);
    
    itemsHTML += `</div><div class="summary-card"><h3>Order Summary</h3>
        <div class="summary-row"><span>Subtotal</span><span>${totalFormatted}</span></div>
        <div class="summary-row"><span>Shipping</span><span>${shippingFormatted}</span></div>
        <div class="summary-row total"><span>Total</span><span>${grandFormatted}</span></div>
        <button class="checkout-btn" onclick="proceedToCheckout()">Proceed to Checkout</button>
        <a href="shop.html" class="continue-shopping">Continue Shopping</a></div></div>`;
    
    container.innerHTML = itemsHTML;
}

async function updateCartItem(cartId, newQuantity) {
    if (newQuantity < 1) {
        removeFromCart(cartId);
        return;
    }
    
    try {
        const response = await fetch('../api.php?request=update_cart', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cart_id: cartId, quantity: newQuantity })
        });
        const data = await response.json();
        
        if (data.success) {
            document.getElementById(`qty-${cartId}`).textContent = newQuantity;
            loadCart();
        }
    } catch (error) {
        console.error('Update cart error:', error);
    }
    updateCartCount();
}

async function removeFromCart(cartId) {
    try {
        const response = await fetch('../api.php?request=update_cart', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cart_id: cartId, quantity: 0 })
        });
        const data = await response.json();
        
        if (data.success) {
            loadCart();
            showToast('Item removed from cart', 'success');
        }
    } catch (error) {
        console.error('Remove from cart error:', error);
    }
    updateCartCount();
}

async function updateCartCount() {
    const user = getCurrentUser();
    if (!user) return;
    
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

// Make functions global
window.loadCart = loadCart;
window.updateCartItem = updateCartItem;
window.removeFromCart = removeFromCart;
window.proceedToCheckout = proceedToCheckout;
window.updateCartCount = updateCartCount;