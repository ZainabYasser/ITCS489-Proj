// =============================================
// ACCOUNT.JS - User Account Management
// =============================================

// ===== ORDER FUNCTIONS =====

async function loadOrders() {
    const container = document.getElementById('orders-container');
    if (!container) return;
    
    const user = getCurrentUser();
    
    if (!user) {
        container.innerHTML = '<p>Please login to view orders</p>';
        return;
    }
    
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    try {
        const response = await fetch('../api.php?request=get_orders');
        const data = await response.json();
        
        if (data.success && data.orders && data.orders.length > 0) {
            container.innerHTML = `
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Order #</th>
                                <th>Date</th>
                                <th>Total</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.orders.map(order => `
                                <tr>
                                    <td>${order.order_number}</td>
                                    <td>${new Date(order.created_at).toLocaleDateString()}</td>
                                    <td>BD ${parseFloat(order.total_amount).toFixed(2)}</td>
                                    <td><span class="status-badge status-${order.status}">${order.status}</span></td>
                                    <td><button onclick="viewOrderDetails('${order.order_number}')">View</button></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } else {
            container.innerHTML = '<p>No orders yet. <a href="../SHOPPING/shop.html">Start shopping</a></p>';
        }
    } catch (error) {
        console.error('Error loading orders:', error);
        container.innerHTML = '<p>Error loading orders. Please try again later.</p>';
    }
}

function viewOrderDetails(orderNumber) {
    window.location.href = `order_tracking.html?order=${orderNumber}`;
}

// ===== PROFILE FUNCTIONS =====

async function loadProfile() {
    const user = getCurrentUser();
    
    if (user) {
        const nameInput = document.getElementById('profile-name');
        const emailInput = document.getElementById('profile-email');
        const phoneInput = document.getElementById('profile-phone');
        
        if (nameInput) nameInput.value = user.fullname || '';
        if (emailInput) emailInput.value = user.email || '';
        if (phoneInput) phoneInput.value = user.phone || '';
    }
}

async function updateProfile(event) {
    event.preventDefault();
    
    const user = getCurrentUser();
    
    if (!user) {
        showToast('Please login to update profile', 'error');
        window.location.href = 'login.html';
        return;
    }
    
    const fullname = document.getElementById('profile-name').value;
    const email = document.getElementById('profile-email').value;
    const phone = document.getElementById('profile-phone').value;
    const password = document.getElementById('profile-password')?.value;
    
    try {
        const updateData = { fullname, email, phone };
        if (password) {
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
        } else {
            showToast(data.message || 'Error updating profile', 'error');
        }
    } catch (error) {
        console.error('Update profile error:', error);
        showToast('Network error. Please try again.', 'error');
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
                                <div style="width: ${progressPercent}%; height: 100%; background: #8B5E3C; border-radius: 2px;"></div>
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

// ===== TAB FUNCTIONS =====

function showTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab
    const selectedTab = document.getElementById(`${tabName}-tab`);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Update active button style
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Find and highlight the clicked button
    const buttons = document.querySelectorAll('.tab-btn');
    for (let btn of buttons) {
        if (btn.textContent.toLowerCase().includes(tabName.toLowerCase())) {
            btn.classList.add('active');
            break;
        }
    }
    
    // Load tab-specific data
    if (tabName === 'orders') {
        loadOrders();
    } else if (tabName === 'wishlist') {
        if (typeof loadWishlist === 'function') {
            loadWishlist();
        }
    } else if (tabName === 'profile') {
        loadProfile();
    }
}

// ===== INITIALIZATION =====

document.addEventListener('DOMContentLoaded', () => {
    // Load orders if on orders tab
    const ordersContainer = document.getElementById('orders-container');
    if (ordersContainer) {
        loadOrders();
    }
    
    // Load wishlist if on wishlist tab
    const wishlistContainer = document.getElementById('wishlist-container');
    if (wishlistContainer && typeof loadWishlist === 'function') {
        loadWishlist();
    }
    
    // Load profile if on profile tab
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        loadProfile();
        profileForm.addEventListener('submit', updateProfile);
    }
    
    // Setup tracking form
    const trackBtn = document.querySelector('#tracking-tab .btn-primary');
    if (trackBtn) {
        trackBtn.onclick = trackOrder;
    }
});

// Make functions global
window.loadOrders = loadOrders;
window.loadProfile = loadProfile;
window.updateProfile = updateProfile;
window.trackOrder = trackOrder;
window.showTab = showTab;
window.viewOrderDetails = viewOrderDetails;