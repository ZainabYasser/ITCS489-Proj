// =============================================
// CHECKOUT.JS - Checkout and Order Processing
// =============================================

let selectedPayment = 'credit_card';
let cartItems = [];

async function loadCheckout() {
    const container = document.getElementById('checkout-container');
    const user = getCurrentUser();
    
    if (!user) {
        container.innerHTML = `
            <div class="empty-cart" style="text-align: center; padding: 60px;">
                <i class="fas fa-exclamation-circle" style="font-size: 64px; color: #ccc;"></i>
                <h3>Please Login</h3>
                <p>You need to login to complete checkout</p>
                <a href="../AUTH/login.html" class="btn-primary">Login Now</a>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    try {
        const response = await fetch('../api.php?request=get_cart');
        const data = await response.json();
        
        if (data.success && data.cart && data.cart.length > 0) {
            cartItems = data.cart;
            displayCheckoutForm(data.cart);
        } else {
            container.innerHTML = `
                <div class="empty-cart" style="text-align: center; padding: 60px;">
                    <i class="fas fa-shopping-cart" style="font-size: 64px; color: #ccc;"></i>
                    <h3>Your cart is empty</h3>
                    <p>Add some items to your cart before checking out</p>
                    <a href="shop.html" class="btn-primary">Continue Shopping</a>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading checkout:', error);
        container.innerHTML = '<p class="text-center">Error loading checkout</p>';
    }
}

function displayCheckoutForm(cart) {
    const container = document.getElementById('checkout-container');
    const rate = currencyRates[currentCurrency].rate;
    const symbol = currencyRates[currentCurrency].symbol;
    
    let itemsHTML = '';
    let totalBHD = 0;
    
    for (const item of cart) {
        const subtotalBHD = item.price * item.quantity;
        totalBHD += subtotalBHD;
        const subtotalConverted = (subtotalBHD * rate).toFixed(2);
        
        itemsHTML += `
            <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e8e2d9;">
                <div>
                    <strong>${escapeHtml(item.name)}</strong>
                    <small style="display: block; color: #666;">x${item.quantity}</small>
                </div>
                <div>${symbol} ${subtotalConverted}</div>
            </div>
        `;
    }
    
    const shippingBHD = totalBHD > 0 ? 5 : 0;
    const grandTotalBHD = totalBHD + shippingBHD;
    const totalConverted = (totalBHD * rate).toFixed(2);
    const shippingConverted = (shippingBHD * rate).toFixed(2);
    const grandConverted = (grandTotalBHD * rate).toFixed(2);
    
    // Get user data for pre-filling if available
    const user = getCurrentUser();
    
    container.innerHTML = `
        <div class="checkout-layout" style="display: grid; grid-template-columns: 1fr 380px; gap: 40px;">
            <div class="checkout-form">
                <form id="checkout-form">
                    <div class="form-section" style="background: #f9f6f3; padding: 25px; border-radius: 10px; margin-bottom: 20px;">
                        <h3 style="margin-bottom: 20px;"><i class="fas fa-user"></i> Shipping Information</h3>
                        <input type="text" id="fullname" placeholder="Full Name" value="${escapeHtml(user?.fullname || '')}" required style="width: 100%; padding: 12px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 8px;">
                        <input type="email" id="email" placeholder="Email Address" value="${escapeHtml(user?.email || '')}" required style="width: 100%; padding: 12px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 8px;">
                        <input type="text" id="address" placeholder="Street Address" required style="width: 100%; padding: 12px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 8px;">
                        <input type="text" id="city" placeholder="City" required style="width: 100%; padding: 12px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 8px;">
                        <input type="tel" id="phone" placeholder="Phone Number" required style="width: 100%; padding: 12px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 8px;">
                    </div>
                    
                    <div class="form-section" style="background: #f9f6f3; padding: 25px; border-radius: 10px; margin-bottom: 20px;">
                        <h3 style="margin-bottom: 20px;"><i class="fas fa-credit-card"></i> Payment Method</h3>
                        <div class="payment-methods" style="display: flex; gap: 20px; margin: 15px 0; flex-wrap: wrap;">
                            <div class="payment-method-card" id="payment-credit_card" onclick="selectPaymentMethod('credit_card')" style="flex: 1; min-width: 120px; padding: 15px; border: 2px solid #e8e2d9; border-radius: 12px; cursor: pointer; text-align: center;">
                                <i class="fab fa-cc-visa" style="font-size: 32px;"></i>
                                <i class="fab fa-cc-mastercard" style="font-size: 32px;"></i>
                                <div>Credit Card</div>
                            </div>
                            <div class="payment-method-card" id="payment-debit_card" onclick="selectPaymentMethod('debit_card')" style="flex: 1; min-width: 120px; padding: 15px; border: 2px solid #e8e2d9; border-radius: 12px; cursor: pointer; text-align: center;">
                                <i class="fas fa-credit-card" style="font-size: 32px;"></i>
                                <div>Debit Card</div>
                            </div>
                            <div class="payment-method-card" id="payment-apple_pay" onclick="selectPaymentMethod('apple_pay')" style="flex: 1; min-width: 120px; padding: 15px; border: 2px solid #e8e2d9; border-radius: 12px; cursor: pointer; text-align: center;">
                                <i class="fab fa-apple" style="font-size: 32px;"></i>
                                <div>Apple Pay</div>
                            </div>
                        </div>
                        
                        <div id="card-details-section">
                            <div class="card-details" style="background: white; padding: 20px; border-radius: 12px; margin-top: 20px;">
                                <input type="text" id="card_number" placeholder="Card Number" style="width: 100%; padding: 12px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 8px;">
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                                    <input type="text" id="expiry" placeholder="MM/YY" style="padding: 12px; border: 1px solid #ddd; border-radius: 8px;">
                                    <input type="text" id="cvc" placeholder="CVC" style="padding: 12px; border: 1px solid #ddd; border-radius: 8px;">
                                </div>
                                <input type="text" id="card_name" placeholder="Cardholder Name" style="width: 100%; padding: 12px; margin-top: 15px; border: 1px solid #ddd; border-radius: 8px;">
                            </div>
                        </div>
                    </div>
                    
                    <button type="submit" class="place-order-btn" style="width: 100%; background: #8B5E3C; color: white; border: none; padding: 14px; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer;">
                        <i class="fas fa-check-circle"></i> Place Order - ${symbol} ${grandConverted}
                    </button>
                </form>
            </div>
            
            <div class="order-summary" style="background: #f9f6f3; padding: 25px; border-radius: 10px; position: sticky; top: 100px;">
                <h3 style="margin-bottom: 20px;"><i class="fas fa-receipt"></i> Order Summary</h3>
                ${itemsHTML}
                <div class="summary-row" style="display: flex; justify-content: space-between; padding: 10px 0;">
                    <span>Subtotal</span>
                    <span>${symbol} ${totalConverted}</span>
                </div>
                <div class="summary-row" style="display: flex; justify-content: space-between; padding: 10px 0;">
                    <span>Shipping</span>
                    <span>${symbol} ${shippingConverted}</span>
                </div>
                <div class="summary-row total" style="display: flex; justify-content: space-between; padding: 15px 0; margin-top: 10px; border-top: 2px solid #e8e2d9; font-weight: 700; font-size: 18px;">
                    <span>Total</span>
                    <span style="color: #8B5E3C;">${symbol} ${grandConverted}</span>
                </div>
            </div>
        </div>
    `;
    
    selectPaymentMethod('credit_card');
    document.getElementById('checkout-form').addEventListener('submit', placeOrder);
}

function selectPaymentMethod(method) {
    selectedPayment = method;
    
    document.querySelectorAll('.payment-method-card').forEach(card => {
        card.classList.remove('selected');
        card.style.borderColor = '#e8e2d9';
        card.style.background = 'white';
    });
    const selectedCard = document.getElementById(`payment-${method}`);
    if (selectedCard) {
        selectedCard.classList.add('selected');
        selectedCard.style.borderColor = '#8B5E3C';
        selectedCard.style.background = '#f9f6f3';
    }
    
    const cardDetails = document.getElementById('card-details-section');
    if (method === 'apple_pay') {
        if (cardDetails) cardDetails.style.display = 'none';
    } else {
        if (cardDetails) cardDetails.style.display = 'block';
    }
}

async function placeOrder(e) {
    e.preventDefault();
    
    const fullname = document.getElementById('fullname')?.value;
    const email = document.getElementById('email')?.value;
    const address = document.getElementById('address')?.value;
    const city = document.getElementById('city')?.value;
    const phone = document.getElementById('phone')?.value;
    
    if (!fullname || !email || !address || !city || !phone) {
        showToast('Please fill in all shipping fields', 'error');
        return;
    }
    
    if (selectedPayment === 'credit_card' || selectedPayment === 'debit_card') {
        const cardNumber = document.getElementById('card_number')?.value;
        const expiry = document.getElementById('expiry')?.value;
        const cvc = document.getElementById('cvc')?.value;
        const cardName = document.getElementById('card_name')?.value;
        
        if (!cardNumber || !expiry || !cvc || !cardName) {
            showToast('Please fill in all card details', 'error');
            return;
        }
    }
    
    // Show loading state
    const submitBtn = document.querySelector('.place-order-btn');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch('../api.php?request=place_order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                shipping_address: address,
                shipping_city: city,
                shipping_phone: phone,
                payment_method: selectedPayment
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Order placed successfully!', 'success');
            setTimeout(() => {
                window.location.href = `order_confirmation.html?order=${data.order_number}`;
            }, 1500);
        } else {
            showToast(data.message || 'Order failed', 'error');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    } catch (error) {
        console.error('Place order error:', error);
        showToast('Network error. Please try again.', 'error');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make functions global
window.loadCheckout = loadCheckout;
window.selectPaymentMethod = selectPaymentMethod;
window.placeOrder = placeOrder;