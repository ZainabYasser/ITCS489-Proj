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
                    <strong>${item.name}</strong>
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
    
    container.innerHTML = `
        <div class="checkout-layout">
            <div class="checkout-form">
                <form id="checkout-form">
                    <div class="form-section">
                        <h3><i class="fas fa-user"></i> Shipping Information</h3>
                        <input type="text" id="fullname" placeholder="Full Name" required>
                        <input type="email" id="email" placeholder="Email Address" required>
                        <input type="text" id="address" placeholder="Street Address" required>
                        <input type="text" id="city" placeholder="City" required>
                        <input type="text" id="phone" placeholder="Phone Number" required>
                    </div>
                    
                    <div class="form-section">
                        <h3><i class="fas fa-credit-card"></i> Payment Method</h3>
                        <div class="payment-methods">
                            <div class="payment-method-card" id="payment-credit_card" onclick="selectPaymentMethod('credit_card')">
                                <i class="fab fa-cc-visa"></i>
                                <i class="fab fa-cc-mastercard"></i>
                                <span>Credit Card</span>
                            </div>
                            <div class="payment-method-card" id="payment-debit_card" onclick="selectPaymentMethod('debit_card')">
                                <i class="fas fa-credit-card"></i>
                                <span>Debit Card</span>
                            </div>
                            <div class="payment-method-card" id="payment-apple_pay" onclick="selectPaymentMethod('apple_pay')">
                                <i class="fab fa-apple"></i>
                                <span>Apple Pay</span>
                            </div>
                        </div>
                        
                        <div id="card-details-section">
                            <div class="card-details">
                                <input type="text" id="card_number" placeholder="Card Number">
                                <div class="card-row">
                                    <input type="text" id="expiry" placeholder="MM/YY">
                                    <input type="text" id="cvc" placeholder="CVC">
                                </div>
                                <input type="text" id="card_name" placeholder="Cardholder Name">
                            </div>
                        </div>
                    </div>
                    
                    <button type="submit" class="place-order-btn">
                        <i class="fas fa-check-circle"></i> Place Order - ${symbol} ${grandConverted}
                    </button>
                </form>
            </div>
            
            <div class="order-summary">
                <h3><i class="fas fa-receipt"></i> Order Summary</h3>
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
    });
    document.getElementById(`payment-${method}`).classList.add('selected');
    
    const cardDetails = document.getElementById('card-details-section');
    if (method === 'apple_pay') {
        cardDetails.style.display = 'none';
    } else {
        cardDetails.style.display = 'block';
    }
}

async function placeOrder(e) {
    e.preventDefault();
    
    const fullname = document.getElementById('fullname').value;
    const email = document.getElementById('email').value;
    const address = document.getElementById('address').value;
    const city = document.getElementById('city').value;
    const phone = document.getElementById('phone').value;
    
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
        }
    } catch (error) {
        console.error('Place order error:', error);
        showToast('Network error. Please try again.', 'error');
    }
}

// Make functions global
window.loadCheckout = loadCheckout;
window.selectPaymentMethod = selectPaymentMethod;
window.placeOrder = placeOrder;