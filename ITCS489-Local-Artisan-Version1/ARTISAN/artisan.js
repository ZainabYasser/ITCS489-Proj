// =============================================
// ARTISAN DASHBOARD - Complete JavaScript
// =============================================

// Use unique variable names to avoid conflicts
const ARTISAN_API_BASE = '../api.php';
const ARTISAN_API_URL = ARTISAN_API_BASE + '?request=';

// ===== HELPER FUNCTIONS =====

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> ${message}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function getCurrentUser() {
    return JSON.parse(localStorage.getItem('user') || 'null');
}

async function checkAuth() {
    const user = getCurrentUser();
    if (!user || user.role !== 'artisan') {
        window.location.href = '../AUTH/login.html';
        return false;
    }
    return true;
}

function logout() {
    localStorage.removeItem('user');
    window.location.href = '../index.html';
}

// Image preview function
function previewImage(input) {
    const previewDiv = document.getElementById('image-preview');
    const previewImg = document.getElementById('preview-img');
    
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            previewImg.src = e.target.result;
            previewDiv.style.display = 'block';
        }
        reader.readAsDataURL(input.files[0]);
    }
}

// ===== PRODUCT MANAGEMENT =====

async function loadProducts() {
    const container = document.getElementById('products-list');
    if (!container) return;
    
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    try {
        const response = await fetch(ARTISAN_API_URL + 'get_artisan_products');
        const data = await response.json();
        
        if (data.success && data.products) {
            if (data.products.length === 0) {
                container.innerHTML = '<p>No products yet. Click "Add New Product" to get started.</p>';
            } else {
                container.innerHTML = data.products.map(p => `
                    <div class="product-card" style="background: white; padding: 15px; border-radius: 10px; margin-bottom: 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                        <h4>${escapeHtml(p.name)}</h4>
                        <p>Price: BD ${parseFloat(p.price).toFixed(2)}</p>
                        <p>Stock: ${p.stock}</p>
                        <p>${p.description ? p.description.substring(0, 100) : ''}</p>
                        <button onclick="deleteProduct(${p.id})" class="delete-btn" style="background:#dc3545;color:white;border:none;padding:5px 15px;border-radius:5px;cursor:pointer;margin-top:10px;">Delete</button>
                    </div>
                `).join('');
            }
            document.getElementById('total-products').textContent = data.products.length;
        } else {
            container.innerHTML = '<p>Error loading products</p>';
        }
    } catch (error) {
        console.error('Error loading products:', error);
        container.innerHTML = '<p>Error loading products. Please try again.</p>';
    }
}

async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
        const response = await fetch(ARTISAN_API_URL + 'delete_product', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product_id: productId })
        });
        const data = await response.json();
        
        if (data.success) {
            showToast('Product deleted successfully!', 'success');
            loadProducts();
        } else {
            showToast(data.message || 'Error deleting product', 'error');
        }
    } catch (error) {
        console.error('Delete error:', error);
        showToast('Network error. Please try again.', 'error');
    }
}

// ===== ORDER MANAGEMENT =====

async function loadOrders() {
    const container = document.getElementById('orders-list');
    if (!container) return;
    
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    try {
        const response = await fetch(ARTISAN_API_URL + 'get_artisan_orders');
        const data = await response.json();
        
        if (data.success && data.orders) {
            if (data.orders.length === 0) {
                container.innerHTML = '<p>No orders yet.</p>';
            } else {
                container.innerHTML = data.orders.map(order => `
                    <div class="product-card" style="background: white; padding: 15px; border-radius: 10px; margin-bottom: 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                        <h4>Order #${order.order_number}</h4>
                        <p>Date: ${new Date(order.created_at).toLocaleDateString()}</p>
                        <p>Total: BD ${parseFloat(order.total_amount).toFixed(2)}</p>
                        <p>Status: ${order.status}</p>
                        <p>Payment: ${order.payment_status}</p>
                    </div>
                `).join('');
            }
        } else {
            container.innerHTML = '<p>Error loading orders</p>';
        }
    } catch (error) {
        console.error('Error loading orders:', error);
        container.innerHTML = '<p>Error loading orders. Please try again.</p>';
    }
}

// ===== AUCTION MANAGEMENT =====

function showCreateAuctionForm() {
    loadProductsForAuctionSelect();
    const form = document.getElementById('create-auction-form');
    if (form) form.style.display = 'block';
}

function hideCreateAuctionForm() {
    const form = document.getElementById('create-auction-form');
    if (form) form.style.display = 'none';
}

async function loadProductsForAuctionSelect() {
    try {
        const response = await fetch(ARTISAN_API_URL + 'get_artisan_products');
        const data = await response.json();
        
        const select = document.getElementById('auction-product-id');
        if (select) {
            select.innerHTML = '<option value="">-- Select a product --</option>';
            if (data.success && data.products && data.products.length > 0) {
                data.products.forEach(product => {
                    select.innerHTML += `<option value="${product.id}">${escapeHtml(product.name)} (BD ${product.price})</option>`;
                });
            } else {
                select.innerHTML += '<option value="" disabled>No products available. Add a product first.</option>';
            }
        }
    } catch (error) {
        console.error('Error loading products:', error);
        const select = document.getElementById('auction-product-id');
        if (select) {
            select.innerHTML = '<option value="">Error loading products</option>';
        }
    }
}

async function createAuction() {
    const productId = document.getElementById('auction-product-id').value;
    const startBid = parseFloat(document.getElementById('auction-start-bid').value);
    const minIncrement = parseFloat(document.getElementById('auction-min-increment').value);
    const endTime = document.getElementById('auction-end-time').value;
    
    if (!productId) {
        showToast('Please select a product', 'error');
        return;
    }
    
    if (isNaN(startBid) || startBid <= 0) {
        showToast('Please enter a valid starting bid', 'error');
        return;
    }
    
    if (!endTime) {
        showToast('Please select an end date and time', 'error');
        return;
    }
    
    const btn = event.target;
    const originalText = btn.textContent;
    btn.textContent = 'Creating...';
    btn.disabled = true;
    
    try {
        const response = await fetch(ARTISAN_API_URL + 'create_auction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                product_id: parseInt(productId),
                start_bid: startBid,
                min_increment: minIncrement,
                end_time: endTime
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Auction created successfully!', 'success');
            hideCreateAuctionForm();
            loadAuctions();
            document.getElementById('auction-product-id').value = '';
            document.getElementById('auction-start-bid').value = '';
            document.getElementById('auction-end-time').value = '';
        } else {
            showToast(data.message || 'Failed to create auction', 'error');
        }
    } catch (error) {
        console.error('Create auction error:', error);
        showToast('Network error. Please try again.', 'error');
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

async function loadAuctions() {
    const container = document.getElementById('auctions-list');
    if (!container) return;
    
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    try {
        const response = await fetch(ARTISAN_API_URL + 'get_artisan_auctions');
        const data = await response.json();
        
        if (data.success && data.auctions) {
            if (data.auctions.length === 0) {
                container.innerHTML = '<p>No auctions yet. Click "Create New Auction" to start.</p>';
            } else {
                container.innerHTML = data.auctions.map(auction => {
                    const endDate = new Date(auction.end_time);
                    const isActive = endDate > new Date();
                    return `
                        <div class="product-card" style="background: white; padding: 15px; border-radius: 10px; margin-bottom: 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                            <h4>${escapeHtml(auction.product_name)}</h4>
                            <p>Current Bid: BD ${parseFloat(auction.current_bid).toFixed(2)}</p>
                            <p>Starting Bid: BD ${parseFloat(auction.start_bid).toFixed(2)}</p>
                            <p>Min Increment: BD ${parseFloat(auction.min_increment).toFixed(2)}</p>
                            <p>Ends: ${endDate.toLocaleString()}</p>
                            <p>Status: ${isActive ? '<span style="color:green">Active</span>' : '<span style="color:red">Ended</span>'}</p>
                            <p>Total Bids: ${auction.bid_count || 0}</p>
                        </div>
                    `;
                }).join('');
            }
            const activeCount = data.auctions.filter(a => new Date(a.end_time) > new Date()).length;
            const activeAuctionsEl = document.getElementById('active-auctions');
            if (activeAuctionsEl) activeAuctionsEl.textContent = activeCount;
        } else {
            container.innerHTML = '<p>Error loading auctions</p>';
        }
    } catch (error) {
        console.error('Error loading auctions:', error);
        container.innerHTML = '<p>Error loading auctions. Please try again.</p>';
    }
}

// ===== SALES HISTORY =====

async function loadSales() {
    const container = document.getElementById('sales-list');
    if (!container) return;
    
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    try {
        const response = await fetch(ARTISAN_API_URL + 'get_orders');
        const data = await response.json();
        
        if (data.success && data.orders) {
            const salesOrders = data.orders.filter(order => order.status === 'delivered');
            if (salesOrders.length === 0) {
                container.innerHTML = '<p>No sales yet.</p>';
            } else {
                let totalSales = 0;
                container.innerHTML = salesOrders.map(order => {
                    totalSales += parseFloat(order.total_amount);
                    return `
                        <div class="product-card" style="background: white; padding: 15px; border-radius: 10px; margin-bottom: 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                            <h4>Order #${order.order_number}</h4>
                            <p>Date: ${new Date(order.created_at).toLocaleDateString()}</p>
                            <p>Amount: BD ${parseFloat(order.total_amount).toFixed(2)}</p>
                            <p>Customer: ${escapeHtml(order.shipping_address || 'N/A')}</p>
                        </div>
                    `;
                }).join('');
                const totalSalesEl = document.getElementById('total-sales');
                if (totalSalesEl) totalSalesEl.textContent = `BD ${totalSales.toFixed(2)}`;
            }
        } else {
            container.innerHTML = '<p>Error loading sales</p>';
        }
    } catch (error) {
        console.error('Error loading sales:', error);
        container.innerHTML = '<p>Error loading sales. Please try again.</p>';
    }
}

// ===== PROFILE MANAGEMENT =====

async function loadProfile() {
    const user = getCurrentUser();
    if (!user) return;
    
    try {
        const response = await fetch(ARTISAN_API_URL + 'get_artisan_profile');
        const data = await response.json();
        
        if (data.success && data.profile) {
            document.getElementById('shop-name').value = data.profile.shop_name || '';
            document.getElementById('shop-bio').value = data.profile.bio || '';
            document.getElementById('shop-location').value = data.profile.location || '';
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

// ===== ADD PRODUCT FORM HANDLER =====

// Wait for DOM to be ready before attaching form handlers
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, setting up form handlers...');
    
    // Add Product Form
    const addProductForm = document.getElementById('add-product-form');
    if (addProductForm) {
        addProductForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('Add product form submitted');
            
            const productData = {
                name: document.getElementById('product-name').value,
                category_id: parseInt(document.getElementById('product-category').value),
                price: parseFloat(document.getElementById('product-price').value),
                stock: parseInt(document.getElementById('product-stock').value),
                description: document.getElementById('product-description').value,
                image_url: document.getElementById('product-image-url').value || 'https://placehold.co/600x400/8B5E3C/white?text=Product',
                is_auction: document.getElementById('is-auction').checked
            };
            
            console.log('Product data:', productData);
            
            try {
                const response = await fetch(ARTISAN_API_URL + 'add_product', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(productData)
                });
                const data = await response.json();
                console.log('API response:', data);
                
                if (data.success) {
                    showToast('Product added successfully!', 'success');
                    addProductForm.reset();
                    document.getElementById('auction-fields').style.display = 'none';
                    document.getElementById('image-preview').style.display = 'none';
                    showSection('products');
                    loadProducts();
                } else {
                    showToast(data.message || 'Error adding product', 'error');
                }
            } catch (error) {
                console.error('Add product error:', error);
                showToast('Network error. Please try again.', 'error');
            }
        });
    } else {
        console.log('Add product form not found!');
    }
    
    // Toggle auction fields
    const isAuctionCheckbox = document.getElementById('is-auction');
    if (isAuctionCheckbox) {
        isAuctionCheckbox.addEventListener('change', function() {
            const auctionFields = document.getElementById('auction-fields');
            if (auctionFields) {
                auctionFields.style.display = this.checked ? 'block' : 'none';
            }
        });
    }
    
    // Shop Profile Form
    const shopProfileForm = document.getElementById('shop-profile-form');
    if (shopProfileForm) {
        shopProfileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const profileData = {
                shop_name: document.getElementById('shop-name').value,
                bio: document.getElementById('shop-bio').value,
                location: document.getElementById('shop-location').value
            };
            
            try {
                const response = await fetch(ARTISAN_API_URL + 'update_artisan_profile', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(profileData)
                });
                const data = await response.json();
                
                if (data.success) {
                    showToast('Profile updated successfully!', 'success');
                } else {
                    showToast(data.message || 'Error updating profile', 'error');
                }
            } catch (error) {
                console.error('Update profile error:', error);
                showToast('Network error. Please try again.', 'error');
            }
        });
    }
});

// ===== SECTION NAVIGATION =====

function showSection(section) {
    console.log('showSection called with:', section);
    
    // Hide all sections
    const sections = ['overview', 'products', 'add-product', 'orders', 'auctions', 'sales', 'profile'];
    for (let i = 0; i < sections.length; i++) {
        const el = document.getElementById(sections[i] + '-section');
        if (el) el.style.display = 'none';
    }
    
    // Show selected section
    const selected = document.getElementById(section + '-section');
    if (selected) {
        selected.style.display = 'block';
        console.log('Showing section:', section);
    } else {
        console.log('Section not found:', section + '-section');
    }
    
    // Load data based on section
    if (section === 'products') loadProducts();
    if (section === 'orders') loadOrders();
    if (section === 'auctions') loadAuctions();
    if (section === 'sales') loadSales();
    if (section === 'profile') loadProfile();
    
    // Update active class in sidebar
    document.querySelectorAll('.sidebar nav ul li a').forEach(link => {
        link.classList.remove('active');
    });
    if (event && event.target) {
        event.target.classList.add('active');
    }
}

// ===== ESCAPE HTML =====

function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// ===== INITIALIZATION =====

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Artisan dashboard initializing...');
    const isAuth = await checkAuth();
    if (!isAuth) return;
    
    // Load initial data
    loadProducts();
    
    // Make functions global for onclick handlers
    window.showSection = showSection;
    window.deleteProduct = deleteProduct;
    window.showCreateAuctionForm = showCreateAuctionForm;
    window.hideCreateAuctionForm = hideCreateAuctionForm;
    window.createAuction = createAuction;
    window.loadAuctions = loadAuctions;
    window.logout = logout;
    window.loadProducts = loadProducts;
    window.loadOrders = loadOrders;
    window.loadSales = loadSales;
    window.previewImage = previewImage;
});