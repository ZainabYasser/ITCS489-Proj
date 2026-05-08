// =============================================
// ARTISAN COOPERATIVE - MAIN JAVASCRIPT
// Database Connected Version
// =============================================

// ===== API CONFIGURATION =====
const API_URL = 'api.php?request=';

// ===== GLOBAL VARIABLES =====
let currentUser = null;
let currentPage = 1;
let productsPerPage = 12;
let allProducts = [];
let filteredProducts = [];

// ===== CURRENCY CONFIGURATION =====
const currencyRates = {
    BHD: { symbol: 'BD', rate: 1, code: 'BHD', name: 'Bahraini Dinar' },
    SAR: { symbol: '﷼', rate: 9.96, code: 'SAR', name: 'Saudi Riyal' },
    USD: { symbol: '$', rate: 2.65, code: 'USD', name: 'US Dollar' },
    AED: { symbol: 'د.إ', rate: 9.74, code: 'AED', name: 'UAE Dirham' }
};
let currentCurrency = 'BHD';

// ===== HELPER FUNCTIONS =====

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> ${message}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function formatPrice(price) {
    const rate = currencyRates[currentCurrency].rate;
    const symbol = currencyRates[currentCurrency].symbol;
    const converted = (price * rate).toFixed(2);
    return `${symbol} ${converted}`;
}

function changeCurrency(currencyCode) {
    if (currencyRates[currencyCode]) {
        currentCurrency = currencyCode;
        localStorage.setItem('preferredCurrency', currencyCode);
        document.getElementById('current-currency').textContent = currencyCode;
        showToast(`Currency changed to ${currencyRates[currencyCode].symbol} ${currencyCode}`, 'success');
        
        // Refresh product displays
        if (typeof displayProducts === 'function') {
            displayProducts();
        }
        if (typeof loadCart === 'function') {
            loadCart();
        }
    }
}

function loadCurrencyPreference() {
    const saved = localStorage.getItem('preferredCurrency');
    if (saved && currencyRates[saved]) {
        currentCurrency = saved;
        document.getElementById('current-currency').textContent = currentCurrency;
    }
}

// ===== AUTHENTICATION FUNCTIONS =====

async function register(event) {
    if (event) event.preventDefault();
    
    const fullname = document.getElementById('fullname')?.value;
    const email = document.getElementById('email')?.value;
    const password = document.getElementById('password')?.value;
    const confirmPassword = document.getElementById('confirm_password')?.value;
    
    if (!fullname || !email || !password) {
        showToast('Please fill in all fields', 'error');
        return false;
    }
    
    if (password !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        return false;
    }
    
    if (password.length < 6) {
        showToast('Password must be at least 6 characters', 'error');
        return false;
    }
    
    try {
        const response = await fetch(API_URL + 'register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fullname, email, password, role: 'customer' })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Registration successful! Please login.', 'success');
            setTimeout(() => window.location.href = 'login.html', 1500);
        } else {
            showToast(data.message || 'Registration failed', 'error');
        }
        return data.success;
    } catch (error) {
        console.error('Register error:', error);
        showToast('Network error. Please try again.', 'error');
        return false;
    }
}

async function registerArtisan(event) {
    if (event) event.preventDefault();
    
    const fullname = document.getElementById('fullname')?.value;
    const email = document.getElementById('email')?.value;
    const shop_name = document.getElementById('shop_name')?.value;
    const bio = document.getElementById('bio')?.value;
    const location = document.getElementById('location')?.value;
    const password = document.getElementById('password')?.value;
    const confirmPassword = document.getElementById('confirm_password')?.value;
    
    if (!fullname || !email || !shop_name || !bio || !password) {
        showToast('Please fill in all required fields', 'error');
        return false;
    }
    
    if (password !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        return false;
    }
    
    if (password.length < 6) {
        showToast('Password must be at least 6 characters', 'error');
        return false;
    }
    
    try {
        const response = await fetch(API_URL + 'register_artisan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fullname, email, password, shop_name, bio, location })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Artisan registration successful! Please login.', 'success');
            setTimeout(() => window.location.href = 'login.html', 1500);
        } else {
            showToast(data.message || 'Registration failed', 'error');
        }
        return data.success;
    } catch (error) {
        console.error('Artisan register error:', error);
        showToast('Network error. Please try again.', 'error');
        return false;
    }
}

async function login(event) {
    if (event) event.preventDefault();
    
    const email = document.getElementById('email')?.value;
    const password = document.getElementById('password')?.value;
    
    if (!email || !password) {
        showToast('Please enter email and password', 'error');
        return false;
    }
    
    try {
        const response = await fetch(API_URL + 'login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentUser = data.user;
            localStorage.setItem('user', JSON.stringify(data.user));
            showToast(`Welcome back, ${data.user.fullname}!`, 'success');
            
            setTimeout(() => {
                if (data.user.role === 'admin') {
                    window.location.href = 'admin-dashboard.html';
                } else if (data.user.role === 'artisan') {
                    window.location.href = 'artisan-dashboard.html';
                } else {
                    window.location.href = 'index.html';
                }
            }, 1000);
        } else {
            showToast(data.message || 'Invalid email or password', 'error');
        }
        return data.success;
    } catch (error) {
        console.error('Login error:', error);
        showToast('Network error. Please try again.', 'error');
        return false;
    }
}

async function logout() {
    try {
        await fetch(API_URL + 'logout', { method: 'POST' });
        localStorage.removeItem('user');
        currentUser = null;
        showToast('Logged out successfully', 'success');
        setTimeout(() => window.location.href = 'index.html', 1000);
    } catch (error) {
        console.error('Logout error:', error);
        window.location.href = 'index.html';
    }
}

async function checkAuth() {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
    }
    
    try {
        const response = await fetch(API_URL + 'check_auth');
        const data = await response.json();
        if (data.success && data.user) {
            currentUser = data.user;
            localStorage.setItem('user', JSON.stringify(data.user));
        }
    } catch (error) {
        console.log('Auth check failed:', error);
    }
    
    updateUIForUser();
    return currentUser !== null;
}

function updateUIForUser() {
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const logoutBtn = document.getElementById('logout-btn');
    
    if (currentUser) {
        if (loginBtn) loginBtn.style.display = 'none';
        if (registerBtn) registerBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'inline-block';
    } else {
        if (loginBtn) loginBtn.style.display = 'inline-block';
        if (registerBtn) registerBtn.style.display = 'inline-block';
        if (logoutBtn) logoutBtn.style.display = 'none';
    }
}

function getCurrentUser() {
    return currentUser || JSON.parse(localStorage.getItem('user') || 'null');
}

// ===== PRODUCT FUNCTIONS =====

async function loadProducts() {
    const container = document.getElementById('products-container');
    if (!container) return;
    
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    try {
        const response = await fetch(API_URL + 'get_products');
        const data = await response.json();
        
        if (data.success && data.products) {
            allProducts = data.products;
            filteredProducts = [...allProducts];
            displayProducts();
        } else {
            container.innerHTML = '<p class="text-center">No products found</p>';
        }
    } catch (error) {
        console.error('Error loading products:', error);
        container.innerHTML = '<p class="text-center">Error loading products. Please try again.</p>';
    }
}

function displayProducts() {
    const container = document.getElementById('products-container');
    if (!container) return;
    
    if (!filteredProducts || filteredProducts.length === 0) {
        container.innerHTML = '<p class="text-center">No products found matching your criteria.</p>';
        return;
    }
    
    const start = (currentPage - 1) * productsPerPage;
    const paginatedProducts = filteredProducts.slice(start, start + productsPerPage);
    
    container.innerHTML = paginatedProducts.map(product => {
        const priceFormatted = formatPrice(product.price);
        return `
            <div class="product-card">
                <div class="product-image">
                    <img src="${product.image_url || 'https://via.placeholder.com/300x250?text=' + encodeURIComponent(product.name)}" 
                         alt="${product.name}" loading="lazy"
                         onerror="this.src='https://via.placeholder.com/300x250?text=Product'">
                    <span class="product-category">${product.category_name || 'Handmade'}</span>
                </div>
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <p class="artisan-name">by ${product.artisan_name || 'Local Artisan'}</p>
                    <p class="product-price">${priceFormatted}</p>
                    <div class="product-actions">
                        <button class="add-to-cart" onclick="addToCart(${product.id})">
                            <i class="fas fa-shopping-cart"></i> Add to Cart
                        </button>
                        <button class="wishlist-btn" onclick="addToWishlist(${product.id})">
                            <i class="far fa-heart"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    updatePagination();
}

function updatePagination() {
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
    const pageInfo = document.getElementById('page-info');
    if (pageInfo) pageInfo.textContent = `Page ${currentPage} of ${totalPages || 1}`;
}

function nextPage() {
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        displayProducts();
        window.scrollTo({ top: 400, behavior: 'smooth' });
    }
}

function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        displayProducts();
        window.scrollTo({ top: 400, behavior: 'smooth' });
    }
}

function applyFilters() {
    const searchTerm = document.getElementById('search-input')?.value.toLowerCase() || '';
    const minPrice = parseFloat(document.getElementById('min-price')?.value) || 0;
    const maxPrice = parseFloat(document.getElementById('max-price')?.value) || Infinity;
    const selectedCategories = Array.from(document.querySelectorAll('.filter-section input[type="checkbox"]:checked'))
        .map(cb => cb.value.toLowerCase());
    
    filteredProducts = allProducts.filter(product => {
        const matchesSearch = !searchTerm || 
            product.name.toLowerCase().includes(searchTerm) || 
            (product.artisan_name && product.artisan_name.toLowerCase().includes(searchTerm));
        const matchesPrice = product.price >= minPrice && product.price <= maxPrice;
        const matchesCategory = selectedCategories.length === 0 || 
            (product.category_name && selectedCategories.includes(product.category_name.toLowerCase()));
        
        return matchesSearch && matchesPrice && matchesCategory;
    });
    
    currentPage = 1;
    displayProducts();
}

function resetFilters() {
    document.getElementById('search-input').value = '';
    document.getElementById('min-price').value = '';
    document.getElementById('max-price').value = '';
    document.querySelectorAll('.filter-section input[type="checkbox"]').forEach(cb => cb.checked = false);
    filteredProducts = [...allProducts];
    currentPage = 1;
    displayProducts();
    showToast('All filters reset', 'success');
}

// ===== CART FUNCTIONS =====

async function addToCart(productId, quantity = 1) {
    const user = getCurrentUser();
    if (!user) {
        showToast('Please login to add items to cart', 'error');
        window.location.href = 'login.html';
        return;
    }
    
    try {
        const response = await fetch(API_URL + 'add_to_cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product_id: productId, quantity: quantity })
        });
        const data = await response.json();
        
        if (data.success) {
            showToast('Added to cart!', 'success');
            updateCartCount();
        } else {
            showToast(data.message || 'Failed to add to cart', 'error');
        }
    } catch (error) {
        console.error('Add to cart error:', error);
        showToast('Network error', 'error');
    }
}

async function loadCart() {
    const container = document.getElementById('cart-container');
    if (!container) return;
    
    const user = getCurrentUser();
    if (!user) {
        container.innerHTML = '<p class="text-center">Please login to view your cart</p>';
        return;
    }
    
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    try {
        const response = await fetch(API_URL + 'get_cart');
        const data = await response.json();
        
        if (data.success && data.cart && data.cart.length > 0) {
            displayCartItems(data.cart);
        } else {
            container.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-cart"></i>
                    <h3>Your cart is empty</h3>
                    <p>Looks like you haven't added any items yet</p>
                    <a href="shop.html" class="btn-primary">Continue Shopping</a>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading cart:', error);
        container.innerHTML = '<p class="text-center">Error loading cart</p>';
    }
    updateCartCount();
}

function displayCartItems(cart) {
    const container = document.getElementById('cart-container');
    let totalBHD = 0;
    let itemsHTML = '<div class="cart-layout"><div class="cart-items-list">';
    
    for (const item of cart) {
        const subtotalBHD = item.price * item.quantity;
        totalBHD += subtotalBHD;
        const priceFormatted = formatPrice(item.price);
        const subtotalFormatted = formatPrice(subtotalBHD);
        
        itemsHTML += `
            <div class="cart-item" id="cart-item-${item.id}">
                <div class="cart-item-image">
                    <img src="${item.image_url || 'https://via.placeholder.com/80x80'}" alt="${item.name}">
                </div>
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                </div>
                <div class="cart-item-price">${priceFormatted}</div>
                <div class="cart-item-quantity">
                    <button onclick="updateCartItem(${item.id}, ${item.quantity - 1})">-</button>
                    <span id="qty-${item.id}">${item.quantity}</span>
                    <button onclick="updateCartItem(${item.id}, ${item.quantity + 1})">+</button>
                </div>
                <div class="cart-item-subtotal" id="subtotal-${item.id}">${subtotalFormatted}</div>
                <button class="remove-item" onclick="removeFromCart(${item.id})"><i class="fas fa-trash"></i></button>
            </div>
        `;
    }
    
    const shippingBHD = totalBHD > 0 ? 5 : 0;
    const grandTotalBHD = totalBHD + shippingBHD;
    const totalFormatted = formatPrice(totalBHD);
    const shippingFormatted = formatPrice(shippingBHD);
    const grandFormatted = formatPrice(grandTotalBHD);
    
    itemsHTML += `</div><div class="summary-card"><h3>Order Summary</h3>
        <div class="summary-row"><span>Subtotal</span><span>${totalFormatted}</span></div>
        <div class="summary-row"><span>Shipping</span><span>${shippingFormatted}</span></div>
        <div class="summary-row total"><span>Total</span><span>${grandFormatted}</span></div>
        <button class="checkout-btn" onclick="proceedToCheckout()">Proceed to Checkout</button>
        <a href="shop.html" class="continue-shopping">Continue Shopping</a></div></div>`;
    
    container.innerHTML = itemsHTML;
}

async function updateCartItem(cartId, newQuantity) {
    if (newQuantity < 1) {
        removeFromCart(cartId);
        return;
    }
    
    try {
        const response = await fetch(API_URL + 'update_cart', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cart_id: cartId, quantity: newQuantity })
        });
        const data = await response.json();
        
        if (data.success) {
            document.getElementById(`qty-${cartId}`).textContent = newQuantity;
            loadCart();
        }
    } catch (error) {
        console.error('Update cart error:', error);
    }
    updateCartCount();
}

async function removeFromCart(cartId) {
    try {
        const response = await fetch(API_URL + 'update_cart', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cart_id: cartId, quantity: 0 })
        });
        const data = await response.json();
        
        if (data.success) {
            loadCart();
            showToast('Item removed from cart', 'success');
        }
    } catch (error) {
        console.error('Remove from cart error:', error);
    }
    updateCartCount();
}

async function updateCartCount() {
    const user = getCurrentUser();
    if (!user) return;
    
    try {
        const response = await fetch(API_URL + 'get_cart');
        const data = await response.json();
        const count = data.success && data.cart ? data.cart.reduce((sum, item) => sum + item.quantity, 0) : 0;
        
        const cartCountElements = document.querySelectorAll('.cart-count');
        cartCountElements.forEach(el => {
            el.textContent = count;
            el.style.display = count > 0 ? 'inline-block' : 'none';
        });
    } catch (error) {
        console.error('Update cart count error:', error);
    }
}

function proceedToCheckout() {
    window.location.href = 'checkout.html';
}

// ===== WISHLIST FUNCTIONS =====

async function addToWishlist(productId) {
    const user = getCurrentUser();
    if (!user) {
        showToast('Please login to add to wishlist', 'error');
        window.location.href = 'login.html';
        return;
    }
    
    try {
        const response = await fetch(API_URL + 'add_to_wishlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product_id: productId })
        });
        const data = await response.json();
        
        if (data.success) {
            showToast('Added to wishlist!', 'success');
        } else {
            showToast(data.message || 'Failed to add to wishlist', 'error');
        }
    } catch (error) {
        console.error('Wishlist error:', error);
    }
}

// ===== INITIALIZATION =====

document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    loadCurrencyPreference();
    updateCartCount();
    
    const page = window.location.pathname.split('/').pop();
    
    if (page === 'index.html' || page === '') {
        // Load featured products if on homepage
        const featuredContainer = document.getElementById('featured-products');
        if (featuredContainer) {
            try {
                const response = await fetch(API_URL + 'get_products');
                const data = await response.json();
                if (data.success && data.products) {
                    const featured = data.products.slice(0, 4);
                    featuredContainer.innerHTML = featured.map(product => `
                        <div class="product-card">
                            <div class="product-image">
                                <img src="${product.image_url || 'https://via.placeholder.com/300x250'}" alt="${product.name}">
                                <span class="product-category">${product.category_name || 'Handmade'}</span>
                            </div>
                            <div class="product-info">
                                <h3>${product.name}</h3>
                                <p class="product-price">${formatPrice(product.price)}</p>
                                <button class="add-to-cart" onclick="addToCart(${product.id})">Add to Cart</button>
                            </div>
                        </div>
                    `).join('');
                }
            } catch (error) {
                console.error('Error loading featured products:', error);
            }
        }
    } else if (page === 'shop.html') {
        await loadProducts();
    } else if (page === 'cart.html') {
        await loadCart();
    }
    
    // Attach event listeners
    const loginForm = document.getElementById('login-form');
    if (loginForm) loginForm.addEventListener('submit', login);
    
    const registerForm = document.getElementById('register-form');
    if (registerForm) registerForm.addEventListener('submit', register);
    
    const registerArtisanForm = document.getElementById('register-artisan-form');
    if (registerArtisanForm) registerArtisanForm.addEventListener('submit', registerArtisan);
    
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);
    
    const applyFiltersBtn = document.querySelector('.apply-filters');
    if (applyFiltersBtn) applyFiltersBtn.addEventListener('click', applyFilters);
});

// Make functions global
window.addToCart = addToCart;
window.addToWishlist = addToWishlist;
window.updateCartItem = updateCartItem;
window.removeFromCart = removeFromCart;
window.proceedToCheckout = proceedToCheckout;
window.nextPage = nextPage;
window.prevPage = prevPage;
window.applyFilters = applyFilters;
window.resetFilters = resetFilters;
window.logout = logout;
window.login = login;
window.register = register;
window.registerArtisan = registerArtisan;
window.changeCurrency = changeCurrency;
window.formatPrice = formatPrice;