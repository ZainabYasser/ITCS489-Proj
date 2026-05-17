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
            if (previewDiv) previewDiv.style.display = 'block';
        }
        reader.readAsDataURL(input.files[0]);
    }
}

// Preview for edit product image
function previewEditProductImage(input) {
    const previewDiv = document.getElementById('edit-product-image-preview');
    const previewImg = document.getElementById('edit-product-preview-img');
    
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            previewImg.src = e.target.result;
            if (previewDiv) previewDiv.style.display = 'block';
        }
        reader.readAsDataURL(input.files[0]);
    }
}

// ===== LOAD CATEGORIES FOR FORM =====
async function loadCategoriesForForm() {
    try {
        const response = await fetch(ARTISAN_API_URL + 'get_categories');
        const data = await response.json();
        
        const categorySelect = document.getElementById('product-category');
        if (categorySelect && data.success && data.categories) {
            categorySelect.innerHTML = '';
            data.categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                categorySelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading categories:', error);
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
                container.innerHTML = `
                    <div class="empty-state-message">
                        <i class="fas fa-box-open"></i>
                        <h4>No Products Yet</h4>
                        <p>Click "Add New Product" to get started.</p>
                    </div>`;
            } else {
                container.innerHTML = data.products.map(p => {
                    const imageUrl = p.image_url || 'https://placehold.co/600x400/1a4b72/white?text=' + encodeURIComponent(p.name);
                    return `
                        <div class="product-card" style="background: white; padding: 15px; border-radius: 10px; margin-bottom: 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                            <img src="${imageUrl}" alt="${escapeHtml(p.name)}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px; margin-right: 15px; float: left;">
                            <div style="overflow: hidden;">
                                <h4>${escapeHtml(p.name)}</h4>
                                <p>Price: BD ${parseFloat(p.price).toFixed(2)}</p>
                                <p>Stock: ${p.stock}</p>
                                <p>${p.description ? escapeHtml(p.description.substring(0, 100)) : ''}</p>
                                <div style="display: flex; gap: 10px; margin-top: 10px;">
                                    <button onclick="editProduct(${p.id})" class="edit-btn" style="background:#1a4b72;color:white;border:none;padding:5px 15px;border-radius:5px;cursor:pointer;">Edit</button>
                                    <button onclick="deleteProduct(${p.id})" class="delete-btn" style="background:#dc3545;color:white;border:none;padding:5px 15px;border-radius:5px;cursor:pointer;">Delete</button>
                                </div>
                            </div>
                            <div style="clear: both;"></div>
                        </div>
                    `;
                }).join('');
            }
            const totalProductsEl = document.getElementById('total-products');
            if (totalProductsEl) totalProductsEl.textContent = data.products.length;
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

// Edit product - opens modal with product data
async function editProduct(productId) {
    try {
        // First fetch categories
        const catResponse = await fetch(ARTISAN_API_URL + 'get_categories');
        const catData = await catResponse.json();
        
        // Then fetch product
        const response = await fetch(ARTISAN_API_URL + 'get_product&id=' + productId);
        const data = await response.json();
        
        if (data.success && data.product) {
            const product = data.product;
            
            // Build category options dynamically
            let categoryOptions = '';
            if (catData.success && catData.categories) {
                categoryOptions = catData.categories.map(cat => 
                    `<option value="${cat.id}" ${product.category_id == cat.id ? 'selected' : ''}>${escapeHtml(cat.name)}</option>`
                ).join('');
            } else {
                categoryOptions = '<option value="">No categories available</option>';
            }
            
            const modalHtml = `
                <div id="edit-product-modal" class="modal" style="display: flex;">
                    <div class="modal-content" style="max-width: 500px; width: 90%;">
                        <span class="close-modal" onclick="closeEditModal()">&times;</span>
                        <h3 style="margin-bottom: 20px; color: #1a4b72;">Edit Product</h3>
                        <form id="edit-product-form">
                            <input type="hidden" id="edit-product-id" value="${product.id}">
                            <div class="form-group">
                                <label>Product Name</label>
                                <input type="text" id="edit-product-name" value="${escapeHtml(product.name)}" required>
                            </div>
                            <div class="form-group">
                                <label>Category</label>
                                <select id="edit-product-category" required>
                                    ${categoryOptions}
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Price (BHD)</label>
                                <input type="number" id="edit-product-price" step="0.01" value="${product.price}" required>
                            </div>
                            <div class="form-group">
                                <label>Stock Quantity</label>
                                <input type="number" id="edit-product-stock" value="${product.stock}" required>
                            </div>
                            <div class="form-group">
                                <label>Description</label>
                                <textarea id="edit-product-description" rows="4">${escapeHtml(product.description || '')}</textarea>
                            </div>
                            <div class="form-group">
                                <label>Image URL</label>
                                <input type="text" id="edit-product-image" value="${escapeHtml(product.image_url || '')}" placeholder="https://...">
                                <small style="color: #666;">Or upload a new image below</small>
                            </div>
                            <div class="form-group">
                                <label>Upload New Image (optional)</label>
                                <input type="file" id="edit-product-image-file" accept="image/*" onchange="previewEditProductImage(this)">
                                <div id="edit-product-image-preview" style="margin-top: 10px; display: none;">
                                    <img id="edit-product-preview-img" src="#" alt="Preview" style="max-width: 150px; border-radius: 8px;">
                                </div>
                            </div>
                            <button type="submit" class="auth-btn">Save Changes</button>
                        </form>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            
            document.getElementById('edit-product-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                await updateProduct();
            });
        } else {
            showToast('Error loading product details', 'error');
        }
    } catch (error) {
        console.error('Edit product error:', error);
        showToast('Error loading product details', 'error');
    }
}

function closeEditModal() {
    const modal = document.getElementById('edit-product-modal');
    if (modal) {
        modal.remove();
    }
}

async function updateProduct() {
    const productId = document.getElementById('edit-product-id').value;
    let image_url = document.getElementById('edit-product-image').value;
    const imageFile = document.getElementById('edit-product-image-file').files[0];
    
    // Upload new image if selected
    if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        
        try {
            const uploadResponse = await fetch('../api.php?request=upload_image', {
                method: 'POST',
                body: formData
            });
            const uploadData = await uploadResponse.json();
            if (uploadData.success) {
                image_url = uploadData.image_url;
                showToast('Image uploaded!', 'success');
            }
        } catch (error) {
            console.error('Upload error:', error);
        }
    }
    
    const productData = {
        product_id: parseInt(productId),
        name: document.getElementById('edit-product-name').value,
        category_id: parseInt(document.getElementById('edit-product-category').value),
        price: parseFloat(document.getElementById('edit-product-price').value),
        stock: parseInt(document.getElementById('edit-product-stock').value),
        description: document.getElementById('edit-product-description').value,
        image_url: image_url
    };
    
    if (productData.price <= 0) {
        showToast('Price must be greater than 0', 'error');
        return;
    }
    
    if (productData.stock < 0) {
        showToast('Stock cannot be negative', 'error');
        return;
    }
    
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Saving...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch(ARTISAN_API_URL + 'update_product', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData)
        });
        const data = await response.json();
        
        if (data.success) {
            showToast('Product updated successfully!', 'success');
            closeEditModal();
            loadProducts(); 
        } else {
            showToast(data.message || 'Error updating product', 'error');
        }
    } catch (error) {
        console.error('Update product error:', error);
        showToast('Network error. Please try again.', 'error');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
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
                container.innerHTML = `
                    <div class="empty-state-message">
                        <i class="fas fa-shopping-bag"></i>
                        <h4>No Orders Yet</h4>
                        <p>When customers place orders, they will appear here.</p>
                    </div>`;
            } else {
                container.innerHTML = `
                    <div class="table-container" style="overflow-x: auto;">
                        <table class="data-table" style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="background: var(--bg-warm);">
                                    <th style="padding: 12px;">Order #</th>
                                    <th style="padding: 12px;">Date</th>
                                    <th style="padding: 12px;">Total</th>
                                    <th style="padding: 12px;">Status</th>
                                    <th style="padding: 12px;">Action</th>
                                 </tr>
                            </thead>
                            <tbody>
                                ${data.orders.map(order => `
                                    <tr style="border-bottom: 1px solid var(--border-light);">
                                        <td style="padding: 12px;">${escapeHtml(order.order_number)}</td>
                                        <td style="padding: 12px;">${new Date(order.created_at).toLocaleDateString()}</td>
                                        <td style="padding: 12px;">BD ${parseFloat(order.total_amount).toFixed(2)}</td>
                                        <td style="padding: 12px;">
                                            <select class="order-status-select" data-order-id="${order.id}" data-order-number="${order.order_number}" style="padding: 5px 10px; border-radius: 5px; border: 1px solid var(--border);">
                                                <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                                                <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
                                                <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                                                <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                                                <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                                            </select>
                                        </td>
                                        <td style="padding: 12px;">
                                            <button onclick="viewOrderDetails('${order.order_number}')" class="view-order-btn" style="background: var(--primary); color: white; border: none; padding: 5px 12px; border-radius: 5px; cursor: pointer;">View</button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
                
                // Add event listeners to all status selects
                document.querySelectorAll('.order-status-select').forEach(select => {
                    select.addEventListener('change', async function() {
                        const orderId = this.dataset.orderId;
                        const orderNumber = this.dataset.orderNumber;
                        const newStatus = this.value;
                        await updateArtisanOrderStatus(orderId, orderNumber, newStatus, this);
                    });
                });
            }
        } else {
            container.innerHTML = '<p>Error loading orders</p>';
        }
    } catch (error) {
        console.error('Error loading orders:', error);
        container.innerHTML = '<p>Error loading orders. Please try again.</p>';
    }
}

// Add this new function after loadOrders()
async function updateArtisanOrderStatus(orderId, orderNumber, newStatus, selectElement) {
    const originalStatus = selectElement.querySelector(`option[value="${newStatus}"]`)?.textContent || newStatus;
    
    try {
        const response = await fetch(ARTISAN_API_URL + 'artisan_update_order_status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_id: orderId, status: newStatus })
        });
        const data = await response.json();
        
        if (data.success) {
            showToast(`Order #${orderNumber} status updated to ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`, 'success');
            // Refresh the orders list to show updated status
            loadOrders();
            // Also update overview stats
            if (typeof updateOverviewStats === 'function') {
                updateOverviewStats();
            }
        } else {
            showToast(data.message || 'Failed to update order status', 'error');
            // Reset select to previous value
            loadOrders();
        }
    } catch (error) {
        console.error('Update order status error:', error);
        showToast('Network error. Please try again.', 'error');
        loadOrders();
    }
}





// ===== AUCTION MANAGEMENT =====

function showCreateAuctionForm() {
    const form = document.getElementById('create-auction-form');
    const button = document.querySelector('#auctions-section .dashboard-header');
    const auctionsList = document.getElementById('auctions-list');
    
    if (form) {
        form.style.display = 'block';
        if (button) button.style.display = 'none';
        if (auctionsList) auctionsList.style.display = 'none';
    }
}

function hideCreateAuctionForm() {
    const form = document.getElementById('create-auction-form');
    const button = document.querySelector('#auctions-section .dashboard-header');
    const auctionsList = document.getElementById('auctions-list');
    
    if (form) form.style.display = 'none';
    if (button) button.style.display = 'flex';
    if (auctionsList) auctionsList.style.display = 'block';
    
    const auctionForm = document.getElementById('auction-form');
    if (auctionForm) auctionForm.reset();
    const preview = document.getElementById('auction-image-preview');
    if (preview) preview.style.display = 'none';
}

function toggleAuctionForm() {
    const form = document.getElementById('create-auction-form');
    if (form && form.style.display === 'block') {
        hideCreateAuctionForm();
    } else {
        showCreateAuctionForm();
    }
}

function previewAuctionImage(input) {
    const previewDiv = document.getElementById('auction-image-preview');
    const previewImg = document.getElementById('auction-preview-img');
    
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            previewImg.src = e.target.result;
            if (previewDiv) previewDiv.style.display = 'block';
        }
        reader.readAsDataURL(input.files[0]);
    }
}

async function createAuction() {
    const title = document.getElementById('auction-title').value;
    const description = document.getElementById('auction-description').value;
    const startBid = parseFloat(document.getElementById('auction-start-bid').value);
    const minIncrement = parseFloat(document.getElementById('auction-min-increment').value);
    const endTime = document.getElementById('auction-end-time').value;
    const imageFile = document.getElementById('auction-image-file').files[0];
    
    if (!title) {
        showToast('Please enter an auction title', 'error');
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
    
    let image_url = 'https://placehold.co/600x400/1a4b72/white?text=' + encodeURIComponent(title);
    
    if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        
        try {
            const uploadResponse = await fetch('../api.php?request=upload_image', {
                method: 'POST',
                body: formData
            });
            const uploadData = await uploadResponse.json();
            if (uploadData.success) {
                image_url = uploadData.image_url;
                showToast('Image uploaded!', 'success');
            }
        } catch (error) {
            console.error('Upload error:', error);
        }
    }
    
    const auctionData = {
        title: title,
        description: description,
        start_bid: startBid,
        min_increment: minIncrement,
        end_time: endTime,
        image_url: image_url
    };
    
    try {
        const response = await fetch(ARTISAN_API_URL + 'create_auction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(auctionData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Auction created successfully!', 'success');
            hideCreateAuctionForm();
            loadAuctions();
        } else {
            showToast(data.message || 'Failed to create auction', 'error');
        }
    } catch (error) {
        console.error('Create auction error:', error);
        showToast('Network error. Please try again.', 'error');
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
                container.innerHTML = `
                    <div class="empty-state-message">
                        <i class="fas fa-gavel"></i>
                        <h4>No Auctions Yet</h4>
                        <p>Click "Create New Auction" to start selling.</p>
                    </div>`;
            } else {
                container.innerHTML = data.auctions.map(auction => {
                    const endDate = new Date(auction.end_time);
                    const isActive = endDate > new Date();
                    const imageUrl = auction.image_url || 'https://placehold.co/600x400/1a4b72/white?text=' + encodeURIComponent(auction.title);
                    const hasBids = (auction.bid_count || 0) > 0;
                    return `
                        <div class="product-card" style="background: white; padding: 15px; border-radius: 10px; margin-bottom: 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                            <img src="${imageUrl}" alt="${escapeHtml(auction.title)}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px; margin-right: 15px; float: left;">
                            <div style="overflow: hidden;">
                                <h4>${escapeHtml(auction.title)}</h4>
                                <p>${escapeHtml(auction.description || '')}</p>
                                <p>Current Bid: BD ${parseFloat(auction.current_bid).toFixed(2)}</p>
                                <p>Starting Bid: BD ${parseFloat(auction.start_bid).toFixed(2)}</p>
                                <p>Min Increment: BD ${parseFloat(auction.min_increment).toFixed(2)}</p>
                                <p>Ends: ${endDate.toLocaleString()}</p>
                                <p>Status: ${isActive ? '<span style="color:green">Active</span>' : '<span style="color:red">Ended</span>'}</p>
                                <p>Total Bids: ${auction.bid_count || 0}</p>
                                <div style="display: flex; gap: 10px; margin-top: 10px;">
                                    <button onclick="attemptEditAuction(${auction.id}, ${hasBids})" class="edit-btn" style="background:#1a4b72;color:white;border:none;padding:5px 15px;border-radius:5px;cursor:pointer;">Edit</button>
                                    <button onclick="deleteAuction(${auction.id})" class="delete-btn" style="background:#dc3545;color:white;border:none;padding:5px 15px;border-radius:5px;cursor:pointer;">Delete</button>
                                </div>
                            </div>
                            <div style="clear: both;"></div>
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

// ===== AUCTION EDIT/DELETE FUNCTIONS =====
function attemptEditAuction(auctionId, hasBids) {
    if (hasBids) {
        showToast('Cannot edit this auction because bids have already been placed', 'error');
        return;
    }
    editAuction(auctionId);
}

async function editAuction(auctionId) {
    try {
        const response = await fetch(ARTISAN_API_URL + 'get_auction_for_edit&id=' + auctionId);
        const data = await response.json();
        
        if (data.success && data.auction) {
            const auction = data.auction;
            const hasBids = (auction.bid_count || 0) > 0;
            
            const modalHtml = `
                <div id="edit-auction-modal" class="modal" style="display: flex;">
                    <div class="modal-content" style="max-width: 500px; width: 90%;">
                        <span class="close-modal" onclick="closeAuctionEditModal()">&times;</span>
                        <h3 style="margin-bottom: 20px; color: #1a4b72;">Edit Auction</h3>
                        ${hasBids ? '<p style="color: #dc3545; margin-bottom: 15px;"><i class="fas fa-exclamation-triangle"></i> This auction has bids. Starting bid cannot be changed.</p>' : ''}
                        <form id="edit-auction-form">
                            <input type="hidden" id="edit-auction-id" value="${auction.id}">
                            <div class="form-group">
                                <label>Auction Title</label>
                                <input type="text" id="edit-auction-title" value="${escapeHtml(auction.title)}" required>
                            </div>
                            <div class="form-group">
                                <label>Description</label>
                                <textarea id="edit-auction-description" rows="3">${escapeHtml(auction.description || '')}</textarea>
                            </div>
                            <div class="form-group">
                                <label>Starting Bid (BHD)</label>
                                <input type="number" id="edit-auction-start-bid" step="0.01" value="${auction.start_bid}" required ${hasBids ? 'disabled' : ''}>
                                ${hasBids ? '<small style="color: #666;">Starting bid cannot be changed after bids are placed</small>' : ''}
                            </div>
                            <div class="form-group">
                                <label>Minimum Increment (BHD)</label>
                                <input type="number" id="edit-auction-min-increment" step="0.01" value="${auction.min_increment}" required>
                            </div>
                            <div class="form-group">
                                <label>End Date & Time</label>
                                <input type="datetime-local" id="edit-auction-end-time" value="${auction.end_time.replace(' ', 'T').slice(0, 16)}" required>
                            </div>
                            <div class="form-group">
                                <label>Auction Image URL</label>
                                <input type="text" id="edit-auction-image" value="${escapeHtml(auction.image_url || '')}" placeholder="https://...">
                                <small style="color: #666;">Or upload a new image below</small>
                            </div>
                            <div class="form-group">
                                <label>Upload New Image (optional)</label>
                                <input type="file" id="edit-auction-image-file" accept="image/*" onchange="previewEditAuctionImage(this)">
                                <div id="edit-auction-image-preview" style="margin-top: 10px; display: none;">
                                    <img id="edit-auction-preview-img" src="#" alt="Preview" style="max-width: 150px; border-radius: 8px;">
                                </div>
                            </div>
                            <button type="submit" class="auth-btn">Save Changes</button>
                        </form>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            
            document.getElementById('edit-auction-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                await updateAuction();
            });
        } else {
            showToast('Error loading auction details', 'error');
        }
    } catch (error) {
        console.error('Edit auction error:', error);
        showToast('Error loading auction details', 'error');
    }
}

function closeAuctionEditModal() {
    const modal = document.getElementById('edit-auction-modal');
    if (modal) {
        modal.remove();
    }
}

function previewEditAuctionImage(input) {
    const previewDiv = document.getElementById('edit-auction-image-preview');
    const previewImg = document.getElementById('edit-auction-preview-img');
    
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            previewImg.src = e.target.result;
            if (previewDiv) previewDiv.style.display = 'block';
        }
        reader.readAsDataURL(input.files[0]);
    }
}

async function updateAuction() {
    const auctionId = document.getElementById('edit-auction-id').value;
    const title = document.getElementById('edit-auction-title').value;
    const description = document.getElementById('edit-auction-description').value;
    const startBid = parseFloat(document.getElementById('edit-auction-start-bid').value);
    const minIncrement = parseFloat(document.getElementById('edit-auction-min-increment').value);
    const endTime = document.getElementById('edit-auction-end-time').value;
    let image_url = document.getElementById('edit-auction-image').value;
    const imageFile = document.getElementById('edit-auction-image-file').files[0];
    
    if (!title) {
        showToast('Please enter an auction title', 'error');
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
    
    // Upload new image if selected
    if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        
        try {
            const uploadResponse = await fetch('../api.php?request=upload_image', {
                method: 'POST',
                body: formData
            });
            const uploadData = await uploadResponse.json();
            if (uploadData.success) {
                image_url = uploadData.image_url;
                showToast('Image uploaded!', 'success');
            }
        } catch (error) {
            console.error('Upload error:', error);
        }
    }
    
    if (!image_url) {
        image_url = 'https://placehold.co/600x400/1a4b72/white?text=' + encodeURIComponent(title);
    }
    
    const auctionData = {
        auction_id: parseInt(auctionId),
        title: title,
        description: description,
        start_bid: startBid,
        min_increment: minIncrement,
        end_time: endTime,
        image_url: image_url
    };
    
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Saving...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch(ARTISAN_API_URL + 'update_auction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(auctionData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Auction updated successfully!', 'success');
            closeAuctionEditModal();
            loadAuctions();
        } else {
            showToast(data.message || 'Failed to update auction', 'error');
        }
    } catch (error) {
        console.error('Update auction error:', error);
        showToast('Network error. Please try again.', 'error');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

async function deleteAuction(auctionId) {
    if (!confirm('Are you sure you want to delete this auction? This will also delete all bids and cannot be undone.')) return;
    
    try {
        const response = await fetch(ARTISAN_API_URL + 'delete_auction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ auction_id: auctionId })
        });
        const data = await response.json();
        
        if (data.success) {
            showToast('Auction deleted successfully!', 'success');
            loadAuctions();
        } else {
            showToast(data.message || 'Error deleting auction', 'error');
        }
    } catch (error) {
        console.error('Delete auction error:', error);
        showToast('Network error. Please try again.', 'error');
    }
}

// ===== SALES HISTORY =====
async function loadSales() {
    const container = document.getElementById('sales-list');
    if (!container) return;
    
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    try {
        const response = await fetch(ARTISAN_API_URL + 'get_artisan_orders');
        const data = await response.json();
        
        if (data.success && data.orders) {
            const salesOrders = data.orders.filter(order => order.status === 'delivered');
            
            if (salesOrders.length === 0) {
                container.innerHTML = `
                    <div class="empty-state-message">
                        <i class="fas fa-chart-line"></i>
                        <h4>No Sales Yet</h4>
                        <p>Once you make sales, they will appear here.</p>
                    </div>`;
            } else {
                let totalSales = 0;
                
                container.innerHTML = `
                    <div class="table-container" style="overflow-x: auto;">
                        <table class="data-table" style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="background: var(--bg-warm);">
                                    <th style="padding: 12px;">Order #</th>
                                    <th style="padding: 12px;">Date</th>
                                    <th style="padding: 12px;">Amount</th>
                                    <th style="padding: 12px;">Customer</th>
                                    <th style="padding: 12px;">Items</th>
                                    <th style="padding: 12px;">Action</th>
                                 </tr>
                            </thead>
                            <tbody>
                                ${salesOrders.map(order => {
                                    totalSales += parseFloat(order.total_amount);
                                    return `
                                        <tr style="border-bottom: 1px solid var(--border-light);">
                                            <td style="padding: 12px;">
                                                <strong>#${escapeHtml(order.order_number)}</strong>
                                            </td>
                                            <td style="padding: 12px;">${new Date(order.created_at).toLocaleDateString()}</td>
                                            <td style="padding: 12px;">
                                                <strong style="color: var(--primary);">BD ${parseFloat(order.total_amount).toFixed(2)}</strong>
                                            </td>
                                            <td style="padding: 12px;">
                                                <i class="fas fa-user" style="color: var(--primary); margin-right: 5px;"></i>
                                                ${escapeHtml(order.customer_name || 'N/A')}
                                                ${order.shipping_city ? `<br><small style="color: var(--text-light);"><i class="fas fa-map-marker-alt"></i> ${escapeHtml(order.shipping_city)}</small>` : ''}
                                            </td>
                                            <td style="padding: 12px;">
                                                ${order.item_count || order.items?.length || '-'}
                                            </td>
                                            <td style="padding: 12px;">
                                                <button onclick="viewOrderDetails('${order.order_number}')" class="view-order-btn" style="background: var(--primary); color: white; border: none; padding: 5px 12px; border-radius: 5px; cursor: pointer;">
                                                    <i class="fas fa-eye"></i> View
                                                </button>
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                            <tfoot>
                                <tr style="background: var(--bg-warm); font-weight: bold;">
                                    <td colspan="2" style="padding: 12px;">Total Sales</td>
                                    <td colspan="4" style="padding: 12px;">
                                        <strong style="color: var(--primary); font-size: 18px;">BD ${totalSales.toFixed(2)}</strong>
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                `;
                
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
            const shopNameEl = document.getElementById('shop-name');
            const shopBioEl = document.getElementById('shop-bio');
            const shopLocationEl = document.getElementById('shop-location');
            if (shopNameEl) shopNameEl.value = data.profile.shop_name || '';
            if (shopBioEl) shopBioEl.value = data.profile.bio || '';
            if (shopLocationEl) shopLocationEl.value = data.profile.location || '';
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

// ===== ADD PRODUCT FORM HANDLER =====
document.addEventListener('DOMContentLoaded', function() {    
    const addProductForm = document.getElementById('add-product-form');
    if (addProductForm) {
        addProductForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const imageFile = document.getElementById('product-image-file').files[0];
            let image_url = 'https://placehold.co/600x400/1a4b72/white?text=Product';
            
            if (imageFile) {
                const formData = new FormData();
                formData.append('image', imageFile);
                
                try {
                    const uploadResponse = await fetch('../api.php?request=upload_image', {
                        method: 'POST',
                        body: formData
                    });
                    const uploadData = await uploadResponse.json();
                    if (uploadData.success) {
                        image_url = uploadData.image_url;
                        showToast('Image uploaded!', 'success');
                    }
                } catch (error) {
                    console.error('Upload error:', error);
                }
            }
            
            const productData = {
                name: document.getElementById('product-name').value,
                category_id: parseInt(document.getElementById('product-category').value),
                price: parseFloat(document.getElementById('product-price').value),
                stock: parseInt(document.getElementById('product-stock').value),
                description: document.getElementById('product-description').value,
                image_url: image_url
            };
                        
            try {
                const response = await fetch(ARTISAN_API_URL + 'add_product', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(productData)
                });
                const data = await response.json();
                
                if (data.success) {
                    showToast('Product added successfully!', 'success');
                    addProductForm.reset();
                    const previewDiv = document.getElementById('image-preview');
                    if (previewDiv) {
                        previewDiv.style.display = 'none';
                    }
                    const previewImg = document.getElementById('preview-img');
                    if (previewImg) {
                        previewImg.src = '';
                    }
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
    }
    
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

    // Auction Form Submit
    const auctionForm = document.getElementById('auction-form');
    if (auctionForm) {
        auctionForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await createAuction();
        });
    }
});


// ===== SECTION NAVIGATION =====
function showSection(section) {    
    const sections = ['overview', 'products', 'add-product', 'orders', 'auctions', 'sales', 'profile'];
    for (let i = 0; i < sections.length; i++) {
        const el = document.getElementById(sections[i] + '-section');
        if (el) el.style.display = 'none';
    }
    
    const selected = document.getElementById(section + '-section');
    if (selected) {
        selected.style.display = 'block';
    }
    
    if (section === 'overview') {
        updateOverviewStats();
        loadRecentOrders();
    }
    
    if (section === 'products') loadProducts();
    if (section === 'orders') loadOrders();
    if (section === 'auctions') loadAuctions();
    if (section === 'sales') loadSales();
    if (section === 'profile') loadProfile();
    
    document.querySelectorAll('.sidebar nav ul li a').forEach(link => {
        link.classList.remove('active');
    });
    if (event && event.target) {
        event.target.classList.add('active');
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// ===== UPDATE OVERVIEW STATS =====
async function updateOverviewStats() {
    try {
        // Get products count
        const productsResponse = await fetch(ARTISAN_API_URL + 'get_artisan_products');
        const productsData = await productsResponse.json();
        const totalProducts = productsData.success ? productsData.products.length : 0;
        document.getElementById('total-products').textContent = totalProducts;
        
        // Get orders and calculate total sales & pending orders
        const ordersResponse = await fetch(ARTISAN_API_URL + 'get_artisan_orders');
        const ordersData = await ordersResponse.json();
        
        let totalSales = 0;
        let pendingOrders = 0;
        
        if (ordersData.success && ordersData.orders) {
            ordersData.orders.forEach(order => {
                if (order.status === 'delivered') {
                    totalSales += parseFloat(order.total_amount);
                }
                if (order.status === 'pending' || order.status === 'processing') {
                    pendingOrders++;
                }
            });
        }
        
        document.getElementById('total-sales').textContent = `BD ${totalSales.toFixed(2)}`;
        document.getElementById('pending-orders').textContent = pendingOrders;
        
        // Get active auctions
        const auctionsResponse = await fetch(ARTISAN_API_URL + 'get_artisan_auctions');
        const auctionsData = await auctionsResponse.json();
        
        let activeAuctions = 0;
        if (auctionsData.success && auctionsData.auctions) {
            activeAuctions = auctionsData.auctions.filter(a => new Date(a.end_time) > new Date()).length;
        }
        
        document.getElementById('active-auctions').textContent = activeAuctions;
       
        // Load recent orders
        await loadRecentOrders();
    } catch (error) {
        console.error('Error updating overview stats:', error);
    }
}

// ===== LOAD RECENT ORDERS FOR OVERVIEW =====
async function loadRecentOrders() {
    const container = document.getElementById('recent-orders');
    if (!container) return;
    
    try {
        const response = await fetch(ARTISAN_API_URL + 'get_artisan_orders');
        const data = await response.json();
        
        if (data.success && data.orders && data.orders.length > 0) {
            const recentOrders = data.orders.slice(0, 5);
            
            container.innerHTML = `
                <div style="overflow-x: auto; margin-top: 15px;">
                    <table class="data-table" style="width: 100%;">
                        <thead>
                            <tr style="background: var(--bg-warm);">
                                <th style="padding: 12px;">Order #</th>
                                <th style="padding: 12px;">Date</th>
                                <th style="padding: 12px;">Total</th>
                                <th style="padding: 12px;">Status</th>
                             </tr>
                        </thead>
                        <tbody>
                            ${recentOrders.map(order => `
                                <tr style="border-bottom: 1px solid var(--border-light);">
                                    <td style="padding: 12px;">${escapeHtml(order.order_number)}</td>
                                    <td style="padding: 12px;">${new Date(order.created_at).toLocaleDateString()}</td>
                                    <td style="padding: 12px;">BD ${parseFloat(order.total_amount).toFixed(2)}</td>
                                    <td style="padding: 12px;">
                                        <span class="status-badge status-${order.status}">${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="empty-state-message" style="padding: 40px;">
                    <i class="fas fa-shopping-bag" style="font-size: 48px; color: #ccc;"></i>
                    <h4>No Orders Yet</h4>
                    <p>When customers place orders, they will appear here.</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading recent orders:', error);
        container.innerHTML = '<p style="text-align: center; color: red;">Error loading recent orders</p>';
    }
}

// Replace the viewOrderDetails function in artisan.js
function viewOrderDetails(orderNumber) {
    // Fetch order details from API
    fetch(ARTISAN_API_URL + 'get_artisan_order_detail&order_number=' + orderNumber)
        .then(r => r.json())
        .then(data => {
            if (data.success && data.order) {
                showOrderDetailsModal(data.order);
            } else {
                showToast('Error loading order details', 'error');
            }
        })
        .catch(err => {
            console.error('Error:', err);
            showToast('Error loading order details', 'error');
        });
}

function showOrderDetailsModal(order) {
    let itemsHtml = '';
    if (order.items && order.items.length > 0) {
        itemsHtml = '<table style="width: 100%; border-collapse: collapse;"><thead><tr style="background: var(--bg-warm);"><th style="padding: 8px;">Product</th><th style="padding: 8px;">Qty</th><th style="padding: 8px;">Price</th><th style="padding: 8px;">Subtotal</th></tr></thead><tbody>';
        for (const item of order.items) {
            itemsHtml += `<tr><td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(item.product_name)}</td>
                          <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.quantity}</td>
                          <td style="padding: 8px; border-bottom: 1px solid #eee;">BD ${parseFloat(item.price).toFixed(2)}</td>
                          <td style="padding: 8px; border-bottom: 1px solid #eee;">BD ${(item.price * item.quantity).toFixed(2)}</td></tr>`;
        }
        itemsHtml += '</tbody></table>';
    }
    
    const modalHtml = `
        <div id="order-detail-modal" class="modal" style="display: flex;">
            <div class="modal-content" style="max-width: 600px; width: 90%;">
                <span class="close-modal" onclick="closeOrderModal()">&times;</span>
                <h3 style="margin-bottom: 20px; color: var(--primary);">
                    <i class="fas fa-receipt"></i> Order #${order.order_number}
                </h3>
                <div style="margin-bottom: 15px;">
                    <strong><i class="fas fa-user"></i> Customer:</strong> ${escapeHtml(order.customer_name || 'N/A')}<br>
                    <strong><i class="fas fa-map-marker-alt"></i> Shipping Address:</strong> ${escapeHtml(order.shipping_address || 'N/A')}, ${escapeHtml(order.shipping_city || '')}<br>
                    <strong><i class="fas fa-calendar"></i> Date:</strong> ${new Date(order.created_at).toLocaleString()}<br>
                    <strong><i class="fas fa-tag"></i> Status:</strong> <span class="status-badge status-${order.status}">${order.status}</span><br>
                    <strong><i class="fas fa-credit-card"></i> Payment:</strong> ${order.payment_status === 'completed' ? 'Paid' : 'Pending'}
                </div>
                
                <div style="margin: 20px 0;">
                    <h4 style="margin-bottom: 10px;">Order Items</h4>
                    ${itemsHtml}
                </div>
                
                <div style="text-align: right; padding-top: 15px; border-top: 1px solid var(--border);">
                    <strong style="font-size: 18px;">Total: BD ${parseFloat(order.total_amount).toFixed(2)}</strong>
                </div>
                
                <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end;">
                    <button onclick="closeOrderModal()" class="btn-secondary">Close</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function closeOrderModal() {
    const modal = document.getElementById('order-detail-modal');
    if (modal) modal.remove();
}


document.addEventListener('DOMContentLoaded', async () => {
    const isAuth = await checkAuth();
    if (!isAuth) return;
    
    loadProducts();
    updateOverviewStats(); 
    loadCategoriesForForm();


    window.closeOrderModal = closeOrderModal;
    window.viewOrderDetails = viewOrderDetails;
    window.updateArtisanOrderStatus = updateArtisanOrderStatus;
    window.showSection = showSection;
    window.deleteProduct = deleteProduct;
    window.editProduct = editProduct;  
    window.updateProduct = updateProduct;  
    window.closeEditModal = closeEditModal;
    window.editAuction = editAuction;
    window.deleteAuction = deleteAuction;
    window.closeAuctionEditModal = closeAuctionEditModal;
    window.toggleAuctionForm = toggleAuctionForm;
    window.showCreateAuctionForm = showCreateAuctionForm;
    window.hideCreateAuctionForm = hideCreateAuctionForm;
    window.createAuction = createAuction;
    window.loadAuctions = loadAuctions;
    window.logout = logout;
    window.loadProducts = loadProducts;
    window.loadOrders = loadOrders;
    window.loadSales = loadSales;
    window.previewImage = previewImage;
    window.previewAuctionImage = previewAuctionImage;
    window.previewEditAuctionImage = previewEditAuctionImage;
});