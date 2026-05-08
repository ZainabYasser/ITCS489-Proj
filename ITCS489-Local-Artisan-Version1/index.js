  // Currency conversion rates (base: BHD = 1)
    const currencyRates = {
        BHD: { symbol: 'BD', rate: 1, code: 'BHD' },
        SAR: { symbol: '﷼', rate: 9.96, code: 'SAR' },
        USD: { symbol: '$', rate: 2.65, code: 'USD' },
        AED: { symbol: 'د.إ', rate: 9.74, code: 'AED' }
    };
    
    let currentCurrency = 'BHD';
    

// Most reliable - using Cloudimage placeholder with descriptions
// Featured products data (prices in BHD) - WITH WORKING IMAGES
const featuredProductsData = [
    {
        id: 1,
        name: "Handmade Ceramic Vase",
        artisan: "Fatima Al Khalifa",
        category: "Pottery",
        priceBHD: 45.00,
        image: "https://placehold.co/600x400/8B5E3C/white?text=Ceramic+Vase",
        badge: "Best Seller"
    },
    {
        id: 2,
        name: "Silver Pearl Earrings",
        artisan: "Ahmed Al Zayani",
        category: "Jewellery",
        priceBHD: 29.99,
        image: "https://placehold.co/600x400/C0C0C0/white?text=Pearl+Earrings",
        badge: "New"
    },
    {
        id: 3,
        name: "Handwoven Wool Scarf",
        artisan: "Noor Al Awadhi",
        category: "Textiles",
        priceBHD: 35.00,
        image: "https://placehold.co/600x400/8B4513/white?text=Wool+Scarf",
        badge: "Limited Edition"
    },
    {
        id: 4,
        name: "Abstract Oil Painting",
        artisan: "Yousef Al Doseri",
        category: "Painting",
        priceBHD: 120.00,
        image: "https://placehold.co/600x400/2E8B57/white?text=Oil+Painting",
        badge: "Featured"
    },
    {
        id: 5,
        name: "Olive Wood Serving Bowl",
        artisan: "Khalid Al Musallam",
        category: "Woodwork",
        priceBHD: 55.00,
        image: "https://placehold.co/600x400/D2691E/white?text=Wood+Bowl",
        badge: "Handmade"
    },
    {
        id: 6,
        name: "Arabic Calligraphy Art",
        artisan: "Mariam Al Safi",
        category: "Painting",
        priceBHD: 89.00,
        image: "https://placehold.co/600x400/1A1A2E/white?text=Arabic+Calligraphy",
        badge: "Cultural"
    },
    {
        id: 7,
        name: "Blue Ceramic Tea Set",
        artisan: "Fatima Al Khalifa",
        category: "Ceramics",
        priceBHD: 75.00,
        image: "https://placehold.co/600x400/4169E1/white?text=Ceramic+Tea+Set",
        badge: "Family Set"
    },
    {
        id: 8,
        name: "Gold Plated Bracelet",
        artisan: "Ahmed Al Zayani",
        category: "Jewellery",
        priceBHD: 149.00,
        image: "https://placehold.co/600x400/FFD700/1A1A1A?text=Gold+Bracelet",
        badge: "Premium"
    }
];
 
    
    // Convert price based on currency
    function convertPrice(priceBHD, currency) {
        const rate = currencyRates[currency].rate;
        return (priceBHD * rate).toFixed(2);
    }
    
    // Get currency symbol
    function getCurrencySymbol(currency) {
        return currencyRates[currency].symbol;
    }
    
    // Display products with current currency
    function displayFeaturedProducts() {
        const container = document.getElementById('featured-products');
        if (!container) return;
        
        container.innerHTML = featuredProductsData.map(product => {
            const convertedPrice = convertPrice(product.priceBHD, currentCurrency);
            const symbol = getCurrencySymbol(currentCurrency);
            
            return `
                <div class="product-card">
                    <div class="product-image">
                        <img src="${product.image}" alt="${product.name}" loading="lazy">
                        <span class="product-category">${product.badge}</span>
                    </div>
                    <div class="product-info">
                        <h3>${product.name}</h3>
                        <p class="artisan-name">by ${product.artisan}</p>
                        <p class="product-price">${symbol} ${convertedPrice} <span class="original-price">${currentCurrency !== 'BHD' ? 'BD ' + product.priceBHD : ''}</span></p>
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
        
        // Update all price displays on the page
        updateAllPrices();
    }
    
    // Change currency function
    function changeCurrency(currencyCode, symbol, rate) {
        currentCurrency = currencyCode;
        localStorage.setItem('preferredCurrency', currencyCode);
        
        // Update currency button display
        document.getElementById('current-currency').textContent = currencyCode;
        
        // Refresh product displays
        displayFeaturedProducts();
        
        // Show confirmation
        showToast(`Currency changed to ${currencyRates[currencyCode].symbol} ${currencyCode}`, 'success');
    }
    
    // Update all prices on page (for product cards, cart, etc.)
    function updateAllPrices() {
        const allPriceElements = document.querySelectorAll('.product-price');
        allPriceElements.forEach(el => {
            // Price update logic here
        });
    }
    
    // Load saved currency preference
    function loadCurrencyPreference() {
        const savedCurrency = localStorage.getItem('preferredCurrency');
        if (savedCurrency && currencyRates[savedCurrency]) {
            currentCurrency = savedCurrency;
            document.getElementById('current-currency').textContent = currentCurrency;
        }
        displayFeaturedProducts();
    }
    
    // Toast notification
    function showToast(message, type) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i> ${message}`;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
    
    // Load featured products on homepage
    document.addEventListener('DOMContentLoaded', function() {
        updateCartCount();
        loadCurrencyPreference();
        checkAuth();
    });
    
    // Update cart count from main.js
    function updateCartCount() {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const count = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        const cartCountElements = document.querySelectorAll('.cart-count');
        cartCountElements.forEach(el => {
            el.textContent = count;
            el.style.display = count > 0 ? 'inline-block' : 'none';
        });
    }
    
    // Add to cart function
    function addToCart(productId) {
        let cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const existing = cart.find(item => item.id === productId);
        if (existing) {
            existing.quantity = (existing.quantity || 1) + 1;
        } else {
            cart.push({ id: productId, quantity: 1 });
        }
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        showToast('Added to cart!', 'success');
    }
    
    // Add to wishlist
    function addToWishlist(productId) {
        const user = getCurrentUser();
        if (!user) {
            showToast('Please login to add to wishlist', 'error');
            window.location.href = 'login.html';
            return;
        }
        showToast('Added to wishlist!', 'success');
    }
    
    // Get current user from localStorage
    function getCurrentUser() {
        return JSON.parse(localStorage.getItem('user') || 'null');
    }
    
    // Check authentication
    function checkAuth() {
        const user = getCurrentUser();
        const loginBtn = document.getElementById('login-btn');
        const registerBtn = document.getElementById('register-btn');
        const logoutBtn = document.getElementById('logout-btn');
        
        if (user) {
            if (loginBtn) loginBtn.style.display = 'none';
            if (registerBtn) registerBtn.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'inline-block';
        } else {
            if (loginBtn) loginBtn.style.display = 'inline-block';
            if (registerBtn) registerBtn.style.display = 'inline-block';
            if (logoutBtn) logoutBtn.style.display = 'none';
        }
    }
    
    // Make functions global
    window.changeCurrency = changeCurrency;
    window.addToCart = addToCart;
    window.addToWishlist = addToWishlist;
    window.logout = function() {
        localStorage.removeItem('user');
        showToast('Logged out successfully', 'success');
        setTimeout(() => window.location.href = 'index.html', 1000);
    };