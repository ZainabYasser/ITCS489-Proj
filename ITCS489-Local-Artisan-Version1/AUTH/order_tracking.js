// =============================================
// ORDER_TRACKING.JS - Order Tracking
// =============================================

async function trackOrder() {
    const orderNumber = document.getElementById('order-number')?.value;
    const resultDiv = document.getElementById('tracking-result');
    
    if (!orderNumber) {
        showToast('Please enter an order number', 'error');
        return;
    }
    
    if (resultDiv) {
        resultDiv.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    }
    
    try {
        const response = await fetch('../api.php?request=get_order&order_number=' + orderNumber);
        const data = await response.json();
        
        if (resultDiv) {
            if (data.success && data.order) {
                displayTrackingResult(data.order, resultDiv);
            } else {
                resultDiv.innerHTML = `
                    <div style="background: #f9f6f3; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto; text-align: center;">
                        <i class="fas fa-exclamation-circle" style="font-size: 48px; color: #dc3545;"></i>
                        <h3>Order Not Found</h3>
                        <p>Order #${orderNumber} could not be found.</p>
                        <p>Please check your order number and try again.</p>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('Track order error:', error);
        if (resultDiv) {
            resultDiv.innerHTML = `
                <div style="background: #f9f6f3; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto; text-align: center;">
                    <i class="fas fa-exclamation-circle" style="font-size: 48px; color: #dc3545;"></i>
                    <h3>Error</h3>
                    <p>Could not track order. Please try again later.</p>
                </div>
            `;
        }
        showToast('Network error. Please try again.', 'error');
    }
}

function displayTrackingResult(order, resultDiv) {
    const statusOrder = ['pending', 'processing', 'shipped', 'delivered'];
    const currentStep = statusOrder.indexOf(order.status) + 1;
    const progressPercent = (currentStep / 4) * 100;
    
    // Get status icon and color
    const getStatusIcon = (step) => {
        if (currentStep >= step) {
            return '<i class="fas fa-check-circle" style="color: #28a745;"></i>';
        }
        return '<i class="fas fa-circle" style="color: #ddd;"></i>';
    };
    
    resultDiv.innerHTML = `
        <div style="background: #f9f6f3; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto;">
            <h3 style="color: #8B5E3C; margin-bottom: 20px;">Order #${order.order_number}</h3>
            
            <div style="display: flex; justify-content: space-between; margin: 30px 0; flex-wrap: wrap; gap: 15px;">
                <div style="text-align: center; flex: 1;">
                    ${getStatusIcon(1)}
                    <div style="margin-top: 8px; font-size: 12px;">Order Placed</div>
                </div>
                <div style="text-align: center; flex: 1;">
                    ${getStatusIcon(2)}
                    <div style="margin-top: 8px; font-size: 12px;">Processing</div>
                </div>
                <div style="text-align: center; flex: 1;">
                    ${getStatusIcon(3)}
                    <div style="margin-top: 8px; font-size: 12px;">Shipped</div>
                </div>
                <div style="text-align: center; flex: 1;">
                    ${getStatusIcon(4)}
                    <div style="margin-top: 8px; font-size: 12px;">Delivered</div>
                </div>
            </div>
            
            <div style="height: 4px; background: #ddd; border-radius: 2px; margin: 20px 0;">
                <div style="width: ${progressPercent}%; height: 100%; background: #8B5E3C; border-radius: 2px;"></div>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e8e2d9;">
                <table style="width: 100%;">
                    <tr>
                        <td style="padding: 8px 0;"><strong>Status:</strong></td>
                        <td style="padding: 8px 0;">
                            <span class="status-badge status-${order.status}">
                                ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0;"><strong>Total Amount:</strong></td>
                        <td style="padding: 8px 0; color: #8B5E3C; font-weight: 700;">
                            BD ${parseFloat(order.total_amount).toFixed(2)}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0;"><strong>Order Date:</strong></td>
                        <td style="padding: 8px 0;">${new Date(order.created_at).toLocaleDateString()}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0;"><strong>Shipping Address:</strong></td>
                        <td style="padding: 8px 0;">${order.shipping_address || 'N/A'}, ${order.shipping_city || ''}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0;"><strong>Payment Method:</strong></td>
                        <td style="padding: 8px 0;">${order.payment_method || 'Credit Card'}</td>
                    </tr>
                </table>
            </div>
            
            ${order.items && order.items.length > 0 ? `
                <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e8e2d9;">
                    <h4>Order Items</h4>
                    <div style="margin-top: 10px;">
                        ${order.items.map(item => `
                            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee;">
                                <div>
                                    <strong>${item.product_name}</strong>
                                    <br>
                                    <small>Quantity: ${item.quantity}</small>
                                </div>
                                <div>BD ${parseFloat(item.price).toFixed(2)}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            <div style="margin-top: 30px; text-align: center;">
                <a href="../SHOPPING/shop.html" class="btn-secondary" style="margin-right: 10px;">Continue Shopping</a>
                <a href="account.html" class="btn-primary">View All Orders</a>
            </div>
        </div>
    `;
}

function showToast(message, type) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> ${message}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Initialize tracking form
function initTrackingForm() {
    const trackButton = document.querySelector('.btn-primary');
    const orderInput = document.getElementById('order-number');
    
    if (trackButton) {
        trackButton.addEventListener('click', trackOrder);
    }
    
    if (orderInput) {
        orderInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                trackOrder();
            }
        });
    }
}

// Auto-initialize when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    initTrackingForm();
});

// Make functions global
window.trackOrder = trackOrder;
window.initTrackingForm = initTrackingForm;