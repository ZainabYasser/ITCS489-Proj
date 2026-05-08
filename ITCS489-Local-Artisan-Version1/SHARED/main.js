// =============================================
// MAIN.JS - Page Initialization Only
// =============================================

// ===== GLOBAL VARIABLES =====
let currentUser = null;
let currentPage = 1;
let productsPerPage = 12;
let allProducts = [];
let filteredProducts = [];

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    loadCurrencyPreference();
    updateCartCount();
    
    const page = window.location.pathname.split('/').pop();
    
    if (page === 'index.html' || page === '') {
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
});

// Make functions global
window.currentPage = currentPage;
window.productsPerPage = productsPerPage;
window.allProducts = allProducts;
window.filteredProducts = filteredProducts;
