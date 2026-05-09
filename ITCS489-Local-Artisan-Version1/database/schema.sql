-- Create database
CREATE DATABASE IF NOT EXISTS artisan_cooperative;
USE artisan_cooperative;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fullname VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20) DEFAULT NULL,
    role ENUM('customer', 'artisan', 'admin') DEFAULT 'customer',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Artisan profiles table
CREATE TABLE IF NOT EXISTS artisan_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    shop_name VARCHAR(100) NOT NULL,
    bio TEXT,
    profile_picture VARCHAR(255) DEFAULT 'default-avatar.png',
    location VARCHAR(100),
    verified BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    icon VARCHAR(50) DEFAULT 'fa-tag'
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    artisan_id INT NOT NULL,
    category_id INT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    stock INT DEFAULT 1,
    image_url VARCHAR(255),
    is_featured BOOLEAN DEFAULT FALSE,
    is_auction BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (artisan_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Auctions table
CREATE TABLE IF NOT EXISTS auctions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    start_bid DECIMAL(10,2) NOT NULL,
    current_bid DECIMAL(10,2) NOT NULL,
    current_bidder_id INT,
    min_increment DECIMAL(10,2) DEFAULT 5.00,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (current_bidder_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Bids table
CREATE TABLE IF NOT EXISTS bids (
    id INT AUTO_INCREMENT PRIMARY KEY,
    auction_id INT NOT NULL,
    user_id INT NOT NULL,
    bid_amount DECIMAL(10,2) NOT NULL,
    bid_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Cart table
CREATE TABLE IF NOT EXISTS cart (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT DEFAULT 1,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    shipping_address TEXT NOT NULL,
    shipping_city VARCHAR(100),
    shipping_phone VARCHAR(20),
    payment_method VARCHAR(50),
    payment_status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    product_name VARCHAR(100) NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Wishlist table
CREATE TABLE IF NOT EXISTS wishlist (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Insert default admin user (password = 'password')
INSERT INTO users (fullname, email, password, role) VALUES
('Administrator', 'admin@artisanco.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin')
ON DUPLICATE KEY UPDATE email = email;

-- Insert categories
INSERT INTO categories (name, icon) VALUES
('Painting', 'fa-paintbrush'),
('Jewellery', 'fa-gem'),
('Pottery', 'fa-mug-hot'),
('Textiles', 'fa-tshirt'),
('Woodwork', 'fa-tree'),
('Ceramics', 'fa-mug-hot')
ON DUPLICATE KEY UPDATE name = name;


-- =============================================
-- SAMPLE PRODUCTS REMOVED
-- Products will only be added by artisans through the ARTISAN folder
-- =============================================
-- The following sample products have been removed to prevent fake products from appearing:
-- INSERT INTO products (artisan_id, category_id, name, description, price, stock, image_url, is_featured) VALUES
-- (1, 3, 'Handmade Ceramic Vase', 'Beautiful handmade ceramic vase', 45.00, 10, 'https://placehold.co/600x400/8B5E3C/white?text=Ceramic+Vase', 1),
-- (1, 2, 'Silver Pearl Earrings', 'Elegant silver earrings with pearls', 29.99, 15, 'https://placehold.co/600x400/C0C0C0/white?text=Pearl+Earrings', 1),
-- (1, 4, 'Handwoven Wool Scarf', 'Soft warm wool scarf', 35.00, 8, 'https://placehold.co/600x400/8B4513/white?text=Wool+Scarf', 1);