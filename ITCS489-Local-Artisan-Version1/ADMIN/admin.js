// =============================================
// ADMIN.JS - Admin Dashboard Functions
// =============================================

// ===== ADMIN STATS =====
async function loadStats() {
    try {
        const response = await fetch(getApiUrl() + 'admin_stats');
        const data = await response.json();
        if (data.success) {
            document.getElementById('stat-users').textContent = data.stats.users || 0;
            document.getElementById('stat-artisans').textContent = data.stats.artisans || 0;
            document.getElementById('stat-products').textContent = data.stats.products || 0;
            document.getElementById('stat-orders').textContent = data.stats.orders || 0;
            document.getElementById('stat-revenue').textContent = formatPrice(data.stats.revenue || 0);
        }
    } catch (error) {
        console.error('Error loading stats:', error);
        showToast('Error loading statistics', 'error');
    }
}

// ===== SECTION NAVIGATION =====
function showSection(section) {
    // Hide all sections
    document.querySelectorAll('.dashboard-content > div').forEach(div => {
        div.style.display = 'none';
    });
    
    // Show selected section
    const sectionToShow = document.getElementById(`${section}-section`);
    if (sectionToShow) {
        sectionToShow.style.display = 'block';
    }
    
    // Update active class on sidebar
    document.querySelectorAll('.sidebar nav ul li a').forEach(link => {
        link.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Load data based on section
    if (section === 'users') loadAllUsers();
    if (section === 'artisans') loadAllArtisans();
    if (section === 'products') loadAllProducts();
    if (section === 'orders') loadAllOrders();
    if (section === 'auctions') loadAllAuctions();
    if (section === 'categories') loadCategories();
    if (section === 'reports') loadReports();
}

// ===== USERS MANAGEMENT =====
async function loadAllUsers() {
    const container = document.getElementById('users-list');
    if (!container) return;
    
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    try {
        const response = await fetch(getApiUrl() + 'admin_get_users');
        const data = await response.json();
        
        if (data.success && data.users) {
            if (data.users.length === 0) {
                container.innerHTML = '<p>No users found</p>';
                return;
            }
            
            container.innerHTML = `
                <div class="table-container" style="overflow-x: auto;">
                    <table class="data-table" style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #f5f0eb;">
                                <th style="padding: 12px; text-align: left;">Name</th>
                                <th style="padding: 12px; text-align: left;">Email</th>
                                <th style="padding: 12px; text-align: left;">Role</th>
                                <th style="padding: 12px; text-align: left;">Status</th>
                                <th style="padding: 12px; text-align: left;">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.users.map(u => `
                                <tr style="border-bottom: 1px solid #eee;">
                                    <td style="padding: 12px;">${escapeHtml(u.fullname)}</td>
                                    <td style="padding: 12px;">${escapeHtml(u.email)}</td>
                                    <td style="padding: 12px;">${u.role}</td>
                                    <td style="padding: 12px;">
                                        <span class="status-badge ${u.is_active ? 'status-active' : 'status-inactive'}">
                                            ${u.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td style="padding: 12px;">
                                        <button onclick="toggleUserStatus(${u.id}, ${u.is_active})" 
                                                style="background: ${u.is_active ? '#dc3545' : '#28a745'}; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">
                                            ${u.is_active ? 'Disable' : 'Enable'}
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } else {
            container.innerHTML = '<p>No users found</p>';
        }
    } catch (error) {
        console.error('Error loading users:', error);
        container.innerHTML = '<p>Error loading users</p>';
    }
}

async function toggleUserStatus(userId, currentStatus) {
    if (!confirm(`Are you sure you want to ${currentStatus ? 'disable' : 'enable'} this user?`)) return;
    
    try {
        const response = await fetch(getApiUrl() + 'admin_toggle_user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, is_active: !currentStatus })
        });
        const data = await response.json();
        
        if (data.success) {
            showToast(`User ${!currentStatus ? 'enabled' : 'disabled'} successfully`, 'success');
            loadAllUsers();
            loadStats();
        } else {
            showToast(data.message || 'Action failed', 'error');
        }
    } catch (error) {
        showToast('Error updating user status', 'error');
    }
}

// ===== ARTISANS MANAGEMENT =====
async function loadAllArtisans() {
    const container = document.getElementById('artisans-list');
    if (!container) return;
    
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    try {
        const response = await fetch(getApiUrl() + 'admin_get_artisans');
        const data = await response.json();
        
        if (data.success && data.artisans) {
            if (data.artisans.length === 0) {
                container.innerHTML = '<p>No artisans found</p>';
                return;
            }
            
            container.innerHTML = `
                <div class="table-container" style="overflow-x: auto;">
                    <table class="data-table" style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #f5f0eb;">
                                <th style="padding: 12px;">Name</th>
                                <th style="padding: 12px;">Email</th>
                                <th style="padding: 12px;">Shop Name</th>
                                <th style="padding: 12px;">Products</th>
                                <th style="padding: 12px;">Status</th>
                                <th style="padding: 12px;">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.artisans.map(a => `
                                <tr style="border-bottom: 1px solid #eee;">
                                    <td style="padding: 12px;">${escapeHtml(a.fullname)}</td>
                                    <td style="padding: 12px;">${escapeHtml(a.email)}</td>
                                    <td style="padding: 12px;">${escapeHtml(a.shop_name || '-')}</td>
                                    <td style="padding: 12px;">${a.product_count || 0}</td>
                                    <td style="padding: 12px;">
                                        <span class="status-badge ${a.is_active ? 'status-active' : 'status-inactive'}">
                                            ${a.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td style="padding: 12px;">
                                        <button onclick="toggleArtisanStatus(${a.id}, ${a.is_active})" 
                                                style="background: ${a.is_active ? '#dc3545' : '#28a745'}; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">
                                            ${a.is_active ? 'Disable' : 'Enable'}
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } else {
            container.innerHTML = '<p>No artisans found</p>';
        }
    } catch (error) {
        console.error('Error loading artisans:', error);
        container.innerHTML = '<p>Error loading artisans</p>';
    }
}

async function toggleArtisanStatus(userId, currentStatus) {
    if (!confirm(`Are you sure you want to ${currentStatus ? 'disable' : 'enable'} this artisan?`)) return;
    
    try {
        const response = await fetch(getApiUrl() + 'admin_toggle_artisan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, is_active: !currentStatus })
        });
        const data = await response.json();
        
        if (data.success) {
            showToast(`Artisan ${!currentStatus ? 'enabled' : 'disabled'} successfully`, 'success');
            loadAllArtisans();
            loadStats();
        } else {
            showToast(data.message || 'Action failed', 'error');
        }
    } catch (error) {
        showToast('Error updating artisan status', 'error');
    }
}

// ===== PRODUCTS MANAGEMENT =====
async function loadAllProducts() {
    const container = document.getElementById('products-list');
    if (!container) return;
    
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    try {
        const response = await fetch(getApiUrl() + 'get_products');
        const data = await response.json();
        
        if (data.success && data.products) {
            if (data.products.length === 0) {
                container.innerHTML = '<p>No products found</p>';
                return;
            }
            
            container.innerHTML = `
                <div class="table-container" style="overflow-x: auto;">
                    <table class="data-table" style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #f5f0eb;">
                                <th style="padding: 12px;">ID</th>
                                <th style="padding: 12px;">Name</th>
                                <th style="padding: 12px;">Artisan</th>
                                <th style="padding: 12px;">Price</th>
                                <th style="padding: 12px;">Stock</th>
                                <th style="padding: 12px;">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.products.map(p => `
                                <tr style="border-bottom: 1px solid #eee;">
                                    <td style="padding: 12px;">${p.id}</td>
                                    <td style="padding: 12px;">${escapeHtml(p.name)}</td>
                                    <td style="padding: 12px;">${escapeHtml(p.artisan_name || 'Unknown')}</td>
                                    <td style="padding: 12px;">${formatPrice(p.price)}</td>
                                    <td style="padding: 12px;">${p.stock || 0}</td>
                                    <td style="padding: 12px;">
                                        <button onclick="adminDeleteProduct(${p.id})" 
                                                style="background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } else {
            container.innerHTML = '<p>No products found</p>';
        }
    } catch (error) {
        console.error('Error loading products:', error);
        container.innerHTML = '<p>Error loading products</p>';
    }
}

async function adminDeleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) return;
    
    try {
        const response = await fetch(getApiUrl() + 'admin_delete_product', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product_id: productId })
        });
        const data = await response.json();
        
        if (data.success) {
            showToast('Product deleted successfully', 'success');
            loadAllProducts();
            loadStats();
        } else {
            showToast(data.message || 'Delete failed', 'error');
        }
    } catch (error) {
        showToast('Error deleting product', 'error');
    }
}

// ===== ORDERS MANAGEMENT =====
async function loadAllOrders() {
    const container = document.getElementById('orders-list');
    if (!container) return;
    
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    try {
        const response = await fetch(getApiUrl() + 'admin_get_orders');
        const data = await response.json();
        
        if (data.success && data.orders) {
            if (data.orders.length === 0) {
                container.innerHTML = '<p>No orders found</p>';
                return;
            }
            
            container.innerHTML = `
                <div class="table-container" style="overflow-x: auto;">
                    <table class="data-table" style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #f5f0eb;">
                                <th style="padding: 12px;">Order #</th>
                                <th style="padding: 12px;">Customer</th>
                                <th style="padding: 12px;">Date</th>
                                <th style="padding: 12px;">Total</th>
                                <th style="padding: 12px;">Status</th>
                                <th style="padding: 12px;">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.orders.map(o => `
                                <tr style="border-bottom: 1px solid #eee;">
                                    <td style="padding: 12px;">${o.order_number}</td>
                                    <td style="padding: 12px;">${escapeHtml(o.customer_name)}</td>
                                    <td style="padding: 12px;">${new Date(o.created_at).toLocaleDateString()}</td>
                                    <td style="padding: 12px;">${formatPrice(o.total_amount)}</td>
                                    <td style="padding: 12px;">
                                        <select onchange="updateOrderStatus(${o.id}, this.value)" style="padding: 5px; border-radius: 5px;">
                                            <option value="pending" ${o.status === 'pending' ? 'selected' : ''}>Pending</option>
                                            <option value="processing" ${o.status === 'processing' ? 'selected' : ''}>Processing</option>
                                            <option value="shipped" ${o.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                                            <option value="delivered" ${o.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                                            <option value="cancelled" ${o.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                                        </select>
                                    </td>
                                    <td style="padding: 12px;">
                                        <button onclick="viewOrderDetails(${o.id})" style="background: #8B5E3C; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">
                                            View
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } else {
            container.innerHTML = '<p>No orders found</p>';
        }
    } catch (error) {
        console.error('Error loading orders:', error);
        container.innerHTML = '<p>Error loading orders</p>';
    }
}

async function updateOrderStatus(orderId, status) {
    try {
        const response = await fetch(getApiUrl() + 'admin_update_order_status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_id: orderId, status: status })
        });
        const data = await response.json();
        
        if (data.success) {
            showToast(`Order status updated to ${status}`, 'success');
            loadAllOrders();
            loadStats();
        } else {
            showToast(data.message || 'Update failed', 'error');
        }
    } catch (error) {
        showToast('Error updating order status', 'error');
    }
}

function viewOrderDetails(orderId) {
    showToast(`View order #${orderId} - Feature coming soon`, 'info');
}

// ===== AUCTIONS MANAGEMENT =====
async function loadAllAuctions() {
    const container = document.getElementById('auctions-list');
    if (!container) return;
    
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    try {
        const response = await fetch(getApiUrl() + 'admin_get_auctions');
        const data = await response.json();
        
        if (data.success && data.auctions) {
            if (data.auctions.length === 0) {
                container.innerHTML = '<p>No auctions found</p>';
                return;
            }
            
            container.innerHTML = `
                <div class="table-container" style="overflow-x: auto;">
                    <table class="data-table" style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #f5f0eb;">
                                <th style="padding: 12px;">Product</th>
                                <th style="padding: 12px;">Artisan</th>
                                <th style="padding: 12px;">Starting Bid</th>
                                <th style="padding: 12px;">Current Bid</th>
                                <th style="padding: 12px;">End Date</th>
                                <th style="padding: 12px;">Status</th>
                                <th style="padding: 12px;">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.auctions.map(a => `
                                <tr style="border-bottom: 1px solid #eee;">
                                    <td style="padding: 12px;">${escapeHtml(a.product_name)}</td>
                                    <td style="padding: 12px;">${escapeHtml(a.artisan_name)}</td>
                                    <td style="padding: 12px;">${formatPrice(a.starting_bid)}</td>
                                    <td style="padding: 12px;"><strong>${formatPrice(a.current_bid)}</strong></td>
                                    <td style="padding: 12px;">${new Date(a.end_time).toLocaleString()}</td>
                                    <td style="padding: 12px;">
                                        <span class="status-badge ${new Date(a.end_time) > new Date() ? 'status-active' : 'status-ended'}">
                                            ${new Date(a.end_time) > new Date() ? 'Active' : 'Ended'}
                                        </span>
                                    </td>
                                    <td style="padding: 12px;">
                                        ${new Date(a.end_time) > new Date() ? `
                                            <button onclick="cancelAuction(${a.id})" style="background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">
                                                Cancel
                                            </button>
                                        ` : '-'}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } else {
            container.innerHTML = '<p>No auctions found</p>';
        }
    } catch (error) {
        console.error('Error loading auctions:', error);
        container.innerHTML = '<p>Error loading auctions</p>';
    }
}

async function cancelAuction(auctionId) {
    if (!confirm('Are you sure you want to cancel this auction?')) return;
    
    try {
        const response = await fetch(getApiUrl() + 'admin_cancel_auction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ auction_id: auctionId })
        });
        const data = await response.json();
        
        if (data.success) {
            showToast('Auction cancelled successfully', 'success');
            loadAllAuctions();
        } else {
            showToast(data.message || 'Cancel failed', 'error');
        }
    } catch (error) {
        showToast('Error cancelling auction', 'error');
    }
}

// ===== CATEGORIES MANAGEMENT =====
async function loadCategories() {
    const container = document.getElementById('categories-list');
    if (!container) return;
    
    try {
        const response = await fetch(getApiUrl() + 'get_categories');
        const data = await response.json();
        
        if (data.success && data.categories) {
            if (data.categories.length === 0) {
                container.innerHTML = '<p>No categories found</p>';
                return;
            }
            
            container.innerHTML = `
                <div class="table-container" style="overflow-x: auto;">
                    <table class="data-table" style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #f5f0eb;">
                                <th style="padding: 12px;">ID</th>
                                <th style="padding: 12px;">Name</th>
                                <th style="padding: 12px;">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.categories.map(c => `
                                <tr style="border-bottom: 1px solid #eee;">
                                    <td style="padding: 12px;">${c.id}</td>
                                    <td style="padding: 12px;">${escapeHtml(c.name)}</td>
                                    <td style="padding: 12px;">
                                        <button onclick="deleteCategory(${c.id})" style="background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } else {
            container.innerHTML = '<p>No categories found</p>';
        }
    } catch (error) {
        console.error('Error loading categories:', error);
        container.innerHTML = '<p>Error loading categories</p>';
    }
    
    // Add category form handler
    const form = document.getElementById('add-category-form');
    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            const categoryName = document.getElementById('category-name')?.value;
            if (!categoryName) {
                showToast('Please enter a category name', 'error');
                return;
            }
            
            try {
                const response = await fetch(getApiUrl() + 'admin_add_category', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: categoryName })
                });
                const data = await response.json();
                
                if (data.success) {
                    showToast('Category added successfully', 'success');
                    document.getElementById('category-name').value = '';
                    loadCategories();
                } else {
                    showToast(data.message || 'Add failed', 'error');
                }
            } catch (error) {
                showToast('Error adding category', 'error');
            }
        };
    }
}

async function deleteCategory(categoryId) {
    if (!confirm('Are you sure you want to delete this category? Products in this category will lose their category.')) return;
    
    try {
        const response = await fetch(getApiUrl() + 'admin_delete_category', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ category_id: categoryId })
        });
        const data = await response.json();
        
        if (data.success) {
            showToast('Category deleted successfully', 'success');
            loadCategories();
        } else {
            showToast(data.message || 'Delete failed', 'error');
        }
    } catch (error) {
        showToast('Error deleting category', 'error');
    }
}

// ===== REPORTS =====
function loadReports() {
    const container = document.getElementById('reports-content');
    container.innerHTML = `
        <div class="stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px;">
            <div class="stat-card" style="background: #f9f6f3; padding: 20px; border-radius: 10px; text-align: center;">
                <h4>Monthly Sales</h4>
                <p id="monthly-sales" style="font-size: 28px; font-weight: bold; color: #8B5E3C;">Loading...</p>
            </div>
            <div class="stat-card" style="background: #f9f6f3; padding: 20px; border-radius: 10px; text-align: center;">
                <h4>Top Artisan</h4>
                <p id="top-artisan" style="font-size: 18px; font-weight: bold;">Loading...</p>
            </div>
            <div class="stat-card" style="background: #f9f6f3; padding: 20px; border-radius: 10px; text-align: center;">
                <h4>Best Selling Product</h4>
                <p id="best-selling" style="font-size: 18px; font-weight: bold;">Loading...</p>
            </div>
        </div>
        <canvas id="sales-chart" style="max-width: 100%; height: 300px; margin-top: 30px;"></canvas>
    `;
    
    loadReportData();
}

async function loadReportData() {
    try {
        const response = await fetch(getApiUrl() + 'admin_reports');
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('monthly-sales').textContent = formatPrice(data.monthly_sales || 0);
            document.getElementById('top-artisan').textContent = data.top_artisan || 'N/A';
            document.getElementById('best-selling').textContent = data.best_selling || 'N/A';
        }
    } catch (error) {
        console.error('Error loading reports:', error);
    }
}

// ===== TOAST NOTIFICATION =====
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.style.cssText = 'position: fixed; bottom: 20px; right: 20px; padding: 12px 20px; border-radius: 8px; color: white; z-index: 9999;';
    toast.style.backgroundColor = type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8';
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> ${message}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ===== CHECK ADMIN AUTH =====
function checkAdminAuth() {
    const user = getCurrentUser();
    if (!user || user.role !== 'admin') {
        showToast('Admin access required. Please login as admin.', 'error');
        setTimeout(() => {
            window.location.href = '../AUTH_USER/login.html';
        }, 1500);
        return false;
    }
    return true;
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    if (!checkAdminAuth()) return;
    
    loadStats();
    showSection('overview');
    
    // Set up logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.onclick = () => {
            fetch(getApiUrl() + 'logout', { method: 'POST' })
                .then(() => {
                    localStorage.removeItem('user');
                    window.location.href = '../AUTH_USER/login.html';
                });
        };
    }
});

// Make functions global
window.showSection = showSection;
window.loadStats = loadStats;
window.loadAllUsers = loadAllUsers;
window.loadAllArtisans = loadAllArtisans;
window.loadAllProducts = loadAllProducts;
window.loadAllOrders = loadAllOrders;
window.loadAllAuctions = loadAllAuctions;
window.loadCategories = loadCategories;
window.loadReports = loadReports;
window.toggleUserStatus = toggleUserStatus;
window.toggleArtisanStatus = toggleArtisanStatus;
window.adminDeleteProduct = adminDeleteProduct;
window.updateOrderStatus = updateOrderStatus;
window.viewOrderDetails = viewOrderDetails;
window.cancelAuction = cancelAuction;
window.deleteCategory = deleteCategory;