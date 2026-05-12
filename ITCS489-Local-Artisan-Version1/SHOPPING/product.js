// =============================================
// PRODUCT.JS - Product Details and Reviews
// =============================================

let currentProduct = null;

async function loadProductDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    
    if (!productId) {
        window.location.href = 'shop.html';
        return;
    }
    
    const container = document.getElementById('product-detail-container');
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    try {
        const response = await fetch(`../api.php?request=get_product&id=${productId}`);
        const data = await response.json();
        
        if (data.success && data.product) {
            currentProduct = data.product;
            displayProductDetail(data.product);
            loadReviews(productId);
        } else {
            container.innerHTML = '<p class="text-center">Product not found</p>';
        }
    } catch (error) {
        console.error('Error loading product:', error);
        container.innerHTML = '<p class="text-center">Error loading product</p>';
    }
}

function displayProductDetail(product) {
    const container = document.getElementById('product-detail-container');
    const priceFormatted = formatPrice(product.price);
    
    container.innerHTML = `
        <div class="product-detail-layout">
            <div class="product-gallery">
                <div class="main-image">
                    <img src="${product.image_url || 'https://placehold.co/500x500/1a4b72/E3C/white?text=' + encodeURIComponent(product.name)}" alt="${product.name}" id="main-image">
                </div>
                <div class="thumbnail-images">
                    <img src="${product.image_url || 'https://placehold.co/80x80/1a4b72/E3C/white?text=View+1'}" onclick="changeImage(this.src)">
                    <img src="https://placehold.co/80x80/1a4b72/E3C/white?text=View+2" onclick="changeImage(this.src)">
                    <img src="https://placehold.co/80x80/1a4b72/E3C/white?text=View+3" onclick="changeImage(this.src)">
                </div>
            </div>
            <div class="product-info-detail">
                <h1>${product.name}</h1>
                <div class="product-rating">
                    <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="far fa-star"></i>
                    <span>(15 reviews)</span>
                </div>
                <p class="product-price-detail">${priceFormatted}</p>
                <p class="product-description">${product.description || 'Beautiful handmade product crafted with love and care.'}</p>
                <div class="artisan-info">
                    <strong><i class="fas fa-user"></i> Artisan: ${product.artisan_name || 'Local Artisan'}</strong>
                </div>
                <div class="quantity-selector">
                    <button onclick="decrementQuantity()">-</button>
                    <input type="number" id="quantity" value="1" min="1" max="${product.stock || 99}">
                    <button onclick="incrementQuantity()">+</button>
                </div>
                <div class="product-actions-detail">
                    <button class="add-to-cart-btn" onclick="addToCartDetail(${product.id})">
                        <i class="fas fa-shopping-cart"></i> Add to Cart
                    </button>
                    <button class="wishlist-btn-detail" onclick="console.log('Button clicked, product ID:', ${product.id}); addToWishlist(${product.id});">
    <i class="far fa-heart"></i> Wishlist
</button>
                </div>
            </div>
        </div>
        <div class="reviews-section">
            <h3>Customer Reviews</h3>
            <div id="reviews-container">
                <div class="loading"><div class="spinner"></div></div>
            </div>
            <div class="add-review">
                <h4>Write a Review</h4>
                <select id="rating">
                    <option value="5">★★★★★ (5)</option>
                    <option value="4">★★★★☆ (4)</option>
                    <option value="3">★★★☆☆ (3)</option>
                    <option value="2">★★☆☆☆ (2)</option>
                    <option value="1">★☆☆☆☆ (1)</option>
                </select>
                <textarea id="review-comment" rows="3" placeholder="Share your experience..."></textarea>
                <button class="btn-primary" onclick="submitReview(${product.id})">Submit Review</button>
            </div>
        </div>
    `;
}

async function loadReviews(productId) {
    try {
        const response = await fetch(`../api.php?request=get_reviews&product_id=${productId}`);
        const data = await response.json();
        
        const container = document.getElementById('reviews-container');
        if (container && data.success && data.reviews && data.reviews.length > 0) {
            container.innerHTML = data.reviews.map(review => `
                <div class="review-card" style="background: #f9f6f3; padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                    <strong>${review.fullname}</strong>
                    <div class="rating">${'★'.repeat(review.rating)}${'☆'.repeat(5-review.rating)}</div>
                    <p>${review.comment}</p>
                    <small style="color: #888;">${new Date(review.created_at).toLocaleDateString()}</small>
                </div>
            `).join('');
        } else if (container) {
            container.innerHTML = '<p>No reviews yet. Be the first to review!</p>';
        }
    } catch (error) {
        console.error('Error loading reviews:', error);
    }
}

async function addToCartDetail(productId) {
    const user = getCurrentUser();
    if (!user) {
        showToast('Please login to add items to cart', 'error');
        window.location.href = '../AUTH/login.html';
        return;
    }
    
    const quantity = parseInt(document.getElementById('quantity')?.value || 1);
    
    try {
        const response = await fetch('../api.php?request=add_to_cart', {
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
        showToast('Network error. Please try again.', 'error');
    }
}

async function submitReview(productId) {
    const user = getCurrentUser();
    if (!user) {
        showToast('Please login to leave a review', 'error');
        window.location.href = '../AUTH/login.html';
        return;
    }
    
    const rating = document.getElementById('rating')?.value;
    const comment = document.getElementById('review-comment')?.value;
    
    if (!comment) {
        showToast('Please enter a review comment', 'error');
        return;
    }
    
    try {
        const response = await fetch('../api.php?request=add_review', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                product_id: productId, 
                rating: parseInt(rating), 
                comment: comment 
            })
        });
        const data = await response.json();
        
        if (data.success) {
            showToast('Review submitted! Thank you for your feedback.', 'success');
            document.getElementById('review-comment').value = '';
            loadReviews(productId);
        } else {
            showToast(data.message || 'Failed to submit review', 'error');
        }
    } catch (error) {
        console.error('Review error:', error);
        showToast('Network error. Please try again.', 'error');
    }
}

function incrementQuantity() {
    const input = document.getElementById('quantity');
    if (input && currentProduct && input.value < (currentProduct.stock || 99)) {
        input.value = parseInt(input.value) + 1;
    } else if (input) {
        input.value = parseInt(input.value) + 1;
    }
}

function decrementQuantity() {
    const input = document.getElementById('quantity');
    if (input && parseInt(input.value) > 1) {
        input.value = parseInt(input.value) - 1;
    }
}

function changeImage(src) {
    document.getElementById('main-image').src = src;
}

// Make functions global
window.loadProductDetail = loadProductDetail;
window.addToCartDetail = addToCartDetail;
window.submitReview = submitReview;
window.incrementQuantity = incrementQuantity;
window.decrementQuantity = decrementQuantity;
window.changeImage = changeImage;