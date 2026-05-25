// =============================================
// SHOP.JS - Product Listing and Filters
// =============================================

let allProducts = [];
let filteredProducts = [];
let currentPage = 1;
let productsPerPage = 12;

async function loadProducts() {
    const container = document.getElementById('products-container');
    if (!container) return;
    
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    try {
        const response = await fetch('../api.php?request=get_products');
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
        container.innerHTML = `
            <div class="no-products-message">
                <i class="fas fa-search"></i>
                <h4>No Products Found</h4>
                <p>No products match your search criteria.</p>
                <button onclick="resetFilters()" class="btn-primary">Clear Filters</button>
            </div>
        `;        
        return;
    }
    
    const start = (currentPage - 1) * productsPerPage;
    const paginatedProducts = filteredProducts.slice(start, start + productsPerPage);
    
    container.innerHTML = paginatedProducts.map(product => {
        const priceFormatted = formatPrice(product.price);
        
        return `
            <div class="product-card" onclick="goToProductDetail(${product.id}, event)">
                <div class="product-image">
                    <img src="${product.image_url || 'https://placehold.co/600x400/1a4b72/white?text=' + encodeURIComponent(product.name)}" 
                         alt="${product.name}" loading="lazy"
                         onerror="this.src='https://placehold.co/600x400/1a4b72/white?text=Product'">
                    <span class="product-category">${product.category_name || 'Handmade'}</span>
                </div>
                <div class="product-info">
                    <h3>${escapeHtml(product.name)}</h3>
                    <p class="artisan-name">by ${escapeHtml(product.artisan_name || 'Local Artisan')}</p>
                    <p class="product-price" data-original-price="${product.price}">${priceFormatted}</p>
                    <div class="product-actions" onclick="event.stopPropagation()">
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

function goToProductDetail(productId, event) {
    // Don't navigate if the click was on a button
    if (event.target.closest('.add-to-cart') || event.target.closest('.wishlist-btn')) {
        return;
    }
    window.location.href = `product-detail.html?id=${productId}`;
}

function updatePagination() {
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
    const pageInfo = document.getElementById('page-info');
    if (pageInfo) pageInfo.textContent = `Page ${currentPage} of ${totalPages || 1}`;
    
    const prevBtn = document.querySelector('.pagination button:first-child');
    const nextBtn = document.querySelector('.pagination button:last-child');
    if (prevBtn) prevBtn.disabled = currentPage === 1;
    if (nextBtn) nextBtn.disabled = currentPage === totalPages || totalPages === 0;
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
        .map(cb => cb.value);
    
    filteredProducts = allProducts.filter(product => {
        const matchesSearch = !searchTerm || 
            product.name.toLowerCase().includes(searchTerm) || 
            (product.artisan_name && product.artisan_name.toLowerCase().includes(searchTerm));
        const matchesPrice = product.price >= minPrice && product.price <= maxPrice;
        const matchesCategory = selectedCategories.length === 0 || 
            (product.category_name && selectedCategories.includes(product.category_name));
        
        return matchesSearch && matchesPrice && matchesCategory;
    });
    
    currentPage = 1;
    displayProducts();
    
    const resultCount = filteredProducts.length;
    
    // Show toast with appropriate color
    if (resultCount === 0) {
        showToast(`No products found.`, 'error');
    } else {
        showToast(`Found ${resultCount} product${resultCount === 1 ? '' : 's'}`, 'success');
    }
}

function resetFilters() {
    document.getElementById('search-input').value = '';
    document.getElementById('min-price').value = '';
    document.getElementById('max-price').value = '';
    document.querySelectorAll('.filter-section input[type="checkbox"]').forEach(cb => cb.checked = false);
    filteredProducts = [...allProducts];
    currentPage = 1;
    displayProducts();
    if (typeof showToast === 'function') showToast('All filters reset', 'success');
}

async function addToWishlist(productId) {
    const user = getCurrentUser();
    if (!user) {
        showToast('Please login to add to wishlist', 'error');
        window.location.href = '../AUTH/login.html';
        return;
    }
    
    try {
        const response = await fetch('../api.php?request=add_to_wishlist', {
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
        showToast('Network error. Please try again.', 'error');
    }
}

// Make functions global
window.loadProducts = loadProducts;
window.displayProducts = displayProducts;
window.applyFilters = applyFilters;
window.resetFilters = resetFilters;
window.prevPage = prevPage;
window.nextPage = nextPage;
window.addToWishlist = addToWishlist;