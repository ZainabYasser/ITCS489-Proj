// =============================================
// ACCOUNT.JS - User Account Management
// =============================================

// ===== ORDER FUNCTIONS =====

async function loadOrders() {
    const container = document.getElementById('orders-container');
    if (!container) return;
    
    const user = getCurrentUser();
    
    if (!user) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-sign-in-alt"></i><h4>Please Login</h4><p>Login to view your orders</p><a href="login.html" class="btn-primary">Login Now</a></div>';
        return;
    }
    
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    try {
        const response = await fetch('../api.php?request=get_orders');
        const data = await response.json();
        
        if (data.success && data.orders && data.orders.length > 0) {
            container.innerHTML = `
                <div class="orders-grid">
                    ${data.orders.map(order => `
                        <div class="order-card">
                            <div class="order-header">
                                <span class="order-number"><i class="fas fa-receipt"></i> ${order.order_number}</span>
                                <span class="status-badge status-${order.status}">${order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Pending'}</span>
                            </div>
                            <div class="order-details">
                                <div class="order-info">
                                    <span><i class="fas fa-calendar"></i> ${new Date(order.created_at).toLocaleDateString()}</span>
                                    <span><i class="fas fa-box"></i> ${order.items ? order.items.length : 0} item(s)</span>
                                </div>
                                <span class="order-total">BD ${parseFloat(order.total_amount).toFixed(2)}</span>
                                <button class="view-order-btn" onclick="viewOrderDetails('${order.order_number}')">View Details →</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-shopping-bag"></i><h4>No Orders Yet</h4><p>You haven\'t placed any orders yet.</p><a href="../SHOPPING/shop.html" class="btn-primary">Start Shopping</a></div>';
        }
    } catch (error) {
        console.error('Error loading orders:', error);
        container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-circle"></i><h4>Error Loading Orders</h4><p>Please try again later.</p></div>';
    }
}

function viewOrderDetails(orderNumber) {
    window.location.href = `order_tracking.html?order=${orderNumber}`;
}

// ===== PROFILE FUNCTIONS =====

async function loadProfile() {
    const user = getCurrentUser();
    const profileContainer = document.querySelector('.profile-form');
    
    if (!user) {
        // Show login message instead of profile form
        if (profileContainer) {
            profileContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-sign-in-alt"></i>
                    <h4>Please Login</h4>
                    <p>Login to view and update your profile</p>
                    <a href="login.html" class="btn-primary">Login Now</a>
                </div>
            `;
        }
        return;
    }
    
    // User is logged in, show the form (make sure form exists)
    if (profileContainer && profileContainer.querySelector('form')) {
        const nameInput = document.getElementById('profile-name');
        const emailInput = document.getElementById('profile-email');
        const phoneInput = document.getElementById('profile-phone');
        
        if (nameInput) nameInput.value = user.fullname || '';
        if (emailInput) emailInput.value = user.email || '';
        if (phoneInput) phoneInput.value = user.phone || '';
    }
}

async function updateProfile(event) {
    if (event) event.preventDefault();
    
    const user = getCurrentUser();
    
    if (!user) {
        showToast('Please login to update profile', 'error');
        window.location.href = 'login.html';
        return;
    }
    
    const fullname = document.getElementById('profile-name')?.value;
    const email = document.getElementById('profile-email')?.value;
    const phone = document.getElementById('profile-phone')?.value;
    const password = document.getElementById('profile-password')?.value;
    
    if (!fullname || !email) {
        showToast('Name and email are required', 'error');
        return;
    }
    
    if (password && password.length < 6) {
        showToast('Password must be at least 6 characters', 'error');
        return;
    }
    
    // Show loading state
    const submitBtn = document.querySelector('#profile-form button[type="submit"]');
    const originalText = submitBtn?.innerHTML;
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
        submitBtn.disabled = true;
    }
    
    try {
        const updateData = { fullname, email, phone };
        if (password && password.length >= 6) {
            updateData.password = password;
        }
        
        const response = await fetch('../api.php?request=update_profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Update local user data
            const updatedUser = { ...user, fullname, email, phone };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            showToast('Profile updated successfully!', 'success');
            
            // Clear password field
            const passwordField = document.getElementById('profile-password');
            if (passwordField) passwordField.value = '';
            
            // Update welcome message if function exists
            if (typeof updateWelcomeMessage === 'function') {
                updateWelcomeMessage();
            }
        } else {
            showToast(data.message || 'Error updating profile', 'error');
        }
    } catch (error) {
        console.error('Update profile error:', error);
        showToast('Network error. Please try again.', 'error');
    } finally {
        if (submitBtn) {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }
}

// ===== TRACKING FUNCTIONS =====

async function trackOrder() {
    const orderNumber = document.getElementById('tracking-number')?.value;
    const resultDiv = document.getElementById('tracking-result');
    
    if (!orderNumber) {
        showToast('Please enter an order number', 'error');
        return;
    }
    
    if (resultDiv) {
        resultDiv.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    }
    
    try {
        const response = await fetch(`../api.php?request=get_order&order_number=${orderNumber}`);
        const data = await response.json();
        
        if (resultDiv) {
            if (data.success && data.order) {
                const order = data.order;
                const statusOrder = ['pending', 'processing', 'shipped', 'delivered'];
                const currentStep = statusOrder.indexOf(order.status) + 1;
                const progressPercent = (currentStep / 4) * 100;
                
                resultDiv.innerHTML = `
                    <div class="tracking-info" style="background: #f9f6f3; padding: 20px; border-radius: 10px; margin-top: 20px;">
                        <h4>Order: ${order.order_number}</h4>
                        <div class="tracking-steps" style="margin-top: 20px;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap;">
                                <div style="${currentStep >= 1 ? 'color: #28a745;' : ''}">
                                    <i class="fas ${currentStep >= 1 ? 'fa-check-circle' : 'fa-circle'}"></i> Order Placed
                                </div>
                                <div style="${currentStep >= 2 ? 'color: #28a745;' : ''}">
                                    <i class="fas ${currentStep >= 2 ? 'fa-check-circle' : 'fa-circle'}"></i> Processing
                                </div>
                                <div style="${currentStep >= 3 ? 'color: #28a745;' : ''}">
                                    <i class="fas ${currentStep >= 3 ? 'fa-check-circle' : 'fa-circle'}"></i> Shipped
                                </div>
                                <div style="${currentStep >= 4 ? 'color: #28a745;' : ''}">
                                    <i class="fas ${currentStep >= 4 ? 'fa-check-circle' : 'fa-circle'}"></i> Delivered
                                </div>
                            </div>
                            <div class="progress-bar" style="height: 4px; background: #ddd; border-radius: 2px;">
                                <div style="width: ${progressPercent}%; height: 100%; background: #1a4b72; border-radius: 2px;"></div>
                            </div>
                            <p style="margin-top: 20px;">
                                <strong>Status:</strong> ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}<br>
                                <strong>Total Amount:</strong> BD ${parseFloat(order.total_amount).toFixed(2)}<br>
                                <strong>Order Date:</strong> ${new Date(order.created_at).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                `;
            } else {
                resultDiv.innerHTML = `<p style="color: red;">Order #${orderNumber} not found.</p>`;
            }
        }
    } catch (error) {
        console.error('Track order error:', error);
        if (resultDiv) {
            resultDiv.innerHTML = '<p style="color: red;">Error tracking order. Please try again.</p>';
        }
    }
}

// ===== ADDED: Function to update welcome message =====
function updateWelcomeMessage() {
    let user = getCurrentUser();
    
    if (!user || !user.fullname) {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                user = JSON.parse(storedUser);
            } catch(e) {
                console.error('Error parsing user data:', e);
            }
        }
    }
    
    const nameElement = document.getElementById('user-name-display');
    if (nameElement) {
        if (user && user.fullname) {
            const firstName = user.fullname.split(' ')[0];
            nameElement.textContent = firstName;
        } else {
            nameElement.textContent = 'Guest';
        }
    }
}

// Make functions global
window.loadOrders = loadOrders;
window.loadProfile = loadProfile;
window.updateProfile = updateProfile;
window.trackOrder = trackOrder;
window.viewOrderDetails = viewOrderDetails;
window.updateWelcomeMessage = updateWelcomeMessage;