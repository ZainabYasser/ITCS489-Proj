// =============================================
// ORDER_CONFIRMATION.JS - Order Confirmation
// =============================================

async function displayOrderConfirmation() {
    const urlParams = new URLSearchParams(window.location.search);
    const orderNumber = urlParams.get('order');
    const container = document.getElementById('confirmation-content');
    
    if (!orderNumber) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <i class="fas fa-exclamation-circle" style="font-size: 48px; color: #dc3545;"></i>
                <h3>No Order Found</h3>
                <p>We couldn't find your order information.</p>
                <a href="shop.html" class="btn-primary">Continue Shopping</a>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    try {
        const response = await fetch(`../api.php?request=get_order&order_number=${orderNumber}`);
        const data = await response.json();
        
        if (data.success && data.order) {
            displayOrderDetails(data.order);
        } else {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <i class="fas fa-exclamation-circle" style="font-size: 48px; color: #dc3545;"></i>
                    <h3>Order Not Found</h3>
                    <p>We couldn't find order #${orderNumber}</p>
                    <a href="account.html" class="btn-primary">View My Orders</a>
                    <a href="shop.html" class="btn-secondary">Continue Shopping</a>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading order:', error);
        container.innerHTML = '<p class="text-center">Error loading order details</p>';
    }
}

function displayOrderDetails(order) {
    const container = document.getElementById('confirmation-content');
    
    let itemsHTML = '';
    if (order.items && order.items.length > 0) {
        itemsHTML = '<div style="margin-top: 15px;"><strong>Items Ordered:</strong><ul style="margin-top: 10px; list-style: none;">';
        for (const item of order.items) {
            itemsHTML += `<li style="padding: 5px 0;">${item.product_name} x ${item.quantity} - ${formatPrice(item.price)}</li>`;
        }
        itemsHTML += '</ul></div>';
    }
    
    container.innerHTML = `
        <div class="check-icon">
            <i class="fas fa-check"></i>
        </div>
        <h1>Order Confirmed!</h1>
        <p>Thank you for your purchase. Your order has been received.</p>
        
        <div class="order-number">#${order.order_number}</div>
        
        <div class="order-details">
            <div class="detail-row">
                <span><strong>Order Number:</strong></span>
                <span>#${order.order_number}</span>
            </div>
            <div class="detail-row">
                <span><strong>Date:</strong></span>
                <span>${new Date(order.created_at).toLocaleDateString()}</span>
            </div>
            <div class="detail-row">
                <span><strong>Total Amount:</strong></span>
                <span style="color: #8B5E3C; font-weight: 700;">${formatPrice(order.total_amount)}</span>
            </div>
            <div class="detail-row">
                <span><strong>Payment Status:</strong></span>
                <span style="color: #28a745;">${order.payment_status === 'completed' ? 'Completed ✓' : 'Pending'}</span>
            </div>
            <div class="detail-row">
                <span><strong>Order Status:</strong></span>
                <span>${order.status === 'pending' ? 'Processing' : order.status}</span>
            </div>
            <div class="detail-row">
                <span><strong>Shipping Address:</strong></span>
                <span>${order.shipping_address || 'N/A'}, ${order.shipping_city || ''}</span>
            </div>
            ${itemsHTML}
        </div>
        
        <p>A confirmation email has been sent to your email address.</p>
        
        <div class="btn-group">
            <a href="../AUTH/account.html" class="btn-primary">View My Orders</a>
            <a href="shop.html" class="btn-secondary">Continue Shopping</a>
        </div>
    `;
}

// Make functions global
window.displayOrderConfirmation = displayOrderConfirmation;