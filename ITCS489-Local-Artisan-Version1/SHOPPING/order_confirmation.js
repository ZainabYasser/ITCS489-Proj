// =============================================
// ORDER_CONFIRMATION.JS - Order Confirmation
// =============================================

async function displayOrderConfirmation() {
    const urlParams = new URLSearchParams(window.location.search);
    const orderNumber = urlParams.get('order');
    const container = document.getElementById('confirmation-content');
    
    console.log('Order number from URL:', orderNumber);
    
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
        console.log('Order response:', data);
        
        if (data.success && data.order) {
            displayOrderDetails(data.order);
        } else {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <i class="fas fa-exclamation-circle" style="font-size: 48px; color: #dc3545;"></i>
                    <h3>Order Not Found</h3>
                    <p>We couldn't find order #${orderNumber}</p>
                    <a href="shop.html" class="btn-primary">Continue Shopping</a>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading order:', error);
        container.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <i class="fas fa-exclamation-circle" style="font-size: 48px; color: #dc3545;"></i>
                <h3>Error Loading Order</h3>
                <p>Please check your connection and try again.</p>
                <a href="shop.html" class="btn-primary">Continue Shopping</a>
            </div>
        `;
    }
}

function displayOrderDetails(order) {
    const container = document.getElementById('confirmation-content');
    
    console.log('Order items:', order.items);
    
    let itemsHTML = '';
    if (order.items && order.items.length > 0) {
        itemsHTML = '<div style="margin-top: 15px;"><strong>Items Ordered:</strong><ul style="margin-top: 10px; list-style: none; padding-left: 0;">';
        for (const item of order.items) {
            const priceFormatted = formatPrice(item.price);
            itemsHTML += `<li style="padding: 8px 0; border-bottom: 1px solid #eee;">${escapeHtml(item.product_name)} x ${item.quantity} - ${priceFormatted}</li>`;
        }
        itemsHTML += '</ul></div>';
    } else {
        itemsHTML = '<div style="margin-top: 15px;"><p>No items found</p></div>';
    }
    
    // Format status display
    const statusMap = {
        'pending': 'Processing',
        'processing': 'Processing',
        'shipped': 'Shipped',
        'delivered': 'Delivered',
        'cancelled': 'Cancelled'
    };
    const displayStatus = statusMap[order.status] || order.status || ' Pending';
    
    // Format payment status
    const paymentStatusMap = {
        'pending': 'Pending',
        'completed': 'Completed ✓',
        'failed': 'Failed'
    };
    const displayPaymentStatus = paymentStatusMap[order.payment_status] || order.payment_status || 'Pending';
    const paymentStatusColor = order.payment_status === 'completed' ? '#28a745' : '#d19d00';
    
    container.innerHTML = `
        <div class="check-icon" style="width: 80px; height: 80px; background: #28a745; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
            <i class="fas fa-check" style="font-size: 40px; color: white;"></i>
        </div>
        <h1>Order Confirmed!</h1>
        <p>Thank you for your purchase. Your order has been received.</p>
        
        <div class="order-number" style="font-size: 24px; font-weight: 700; color: #1a4b72; background: #f7f9fc; display: inline-block; padding: 8px 20px; border-radius: 30px; margin: 20px 0;">#${escapeHtml(order.order_number)}</div>
        
        <div class="order-details" style="background: #f7f9fc; border-radius: 12px; padding: 20px; margin: 30px 0; text-align: left;">
            <div class="detail-row" style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e7edf2;">
                <span><strong>Order Number:</strong></span>
                <span>#${escapeHtml(order.order_number)}</span>
            </div>
            <div class="detail-row" style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e7edf2;">
                <span><strong>Date:</strong></span>
                <span>${new Date(order.created_at).toLocaleDateString()}</span>
            </div>
            <div class="detail-row" style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e7edf2;">
                <span><strong>Total Amount:</strong></span>
                <span style="color: #1a4b72; font-weight: 700;">${formatPrice(order.total_amount)}</span>
            </div>
            <div class="detail-row" style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e7edf2;">
                <span><strong>Payment Status:</strong></span>
                <span style="color: ${paymentStatusColor};">${displayPaymentStatus}</span>
            </div>
            <div class="detail-row" style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e7edf2;">
                <span><strong>Order Status:</strong></span>
                <span>${displayStatus}</span>
            </div>
            <div class="detail-row" style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e7edf2;">
                <span><strong>Shipping Address:</strong></span>
                <span>${escapeHtml(order.shipping_address || 'N/A')}${order.shipping_city ? ', ' + escapeHtml(order.shipping_city) : ''}</span>
            </div>
            ${itemsHTML}
        </div>
        
        <p>A confirmation email has been sent to your email address.</p>
        
        <div class="btn-group" style="display: flex; gap: 15px; justify-content: center; margin-top: 30px; flex-wrap: wrap;">
            <a href="../AUTH/account.html" class="btn-primary" style="background: #1a4b72; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">View My Orders</a>
            <a href="shop.html" class="btn-secondary" style="background: #f7f9fc; color: #1a4b72; padding: 12px 24px; border-radius: 8px; text-decoration: none;">Continue Shopping</a>
        </div>
    `;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make functions global
window.displayOrderConfirmation = displayOrderConfirmation;

// Load order confirmation when page loads
document.addEventListener('DOMContentLoaded', function() {
    displayOrderConfirmation();
});