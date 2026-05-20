<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database connection
$host = 'localhost:3307';
$dbname = 'artisan_cooperative';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed: ' . $e->getMessage()]);
    exit();
}

// Start session if not started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$request = isset($_GET['request']) ? $_GET['request'] : '';

// Helper functions
function isLoggedIn() {
    return isset($_SESSION['user_id']);
}

function getUserId() {
    return $_SESSION['user_id'] ?? null;
}

// Helper function to delete image file
function deleteImageFile($image_url) {
    if (empty($image_url)) return false;
    
    // Only delete if it's not a placeholder URL
    if (strpos($image_url, 'placehold.co') !== false) return false;
    if (strpos($image_url, 'via.placeholder.com') !== false) return false;
    
    // Extract filename from URL
    $baseDir = __DIR__;
    $relativePath = str_replace('/LocalArtisanITCS489Project/ITCS489-Proj/ITCS489-Local-Artisan-Version1/', '', $image_url);
    $filePath = $baseDir . '/' . $relativePath;
    
    // Only delete if file exists and is in uploads folder
    if (file_exists($filePath) && strpos($filePath, '/uploads/') !== false) {
        return unlink($filePath);
    }
    return false;
}

// ============ CHECK AUTH ============
if ($request == 'check_auth') {
    $loggedIn = isLoggedIn();
    echo json_encode(['success' => $loggedIn, 'user' => $loggedIn ? ['id' => $_SESSION['user_id'], 'fullname' => $_SESSION['user_name'], 'role' => $_SESSION['user_role']] : null]);
    exit();
}

// ============ REGISTER ============
if ($request == 'register') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        echo json_encode(['success' => false, 'message' => 'No data received']);
        exit();
    }
    
    $fullname = isset($input['fullname']) ? trim($input['fullname']) : '';
    $email = isset($input['email']) ? trim($input['email']) : '';
    $password = isset($input['password']) ? $input['password'] : '';
    $role = isset($input['role']) ? $input['role'] : 'customer';
    
    if (empty($fullname) || empty($email) || empty($password)) {
        echo json_encode(['success' => false, 'message' => 'All fields are required']);
        exit();
    }
    
    if (strlen($password) < 6) {
        echo json_encode(['success' => false, 'message' => 'Password must be at least 6 characters']);
        exit();
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['success' => false, 'message' => 'Invalid email format']);
        exit();
    }
    
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        echo json_encode(['success' => false, 'message' => 'Email already registered']);
        exit();
    }
    
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("INSERT INTO users (fullname, email, password, role) VALUES (?, ?, ?, ?)");
    
    if ($stmt->execute([$fullname, $email, $hashedPassword, $role])) {
        echo json_encode([
            'success' => true, 
            'user_id' => $pdo->lastInsertId(), 
            'message' => 'Registration successful'
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Registration failed']);
    }
    exit();
}

// ============ ARTISAN REGISTER ============
if ($request == 'register_artisan') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        echo json_encode(['success' => false, 'message' => 'No data received']);
        exit();
    }
    
    $fullname = isset($input['fullname']) ? trim($input['fullname']) : '';
    $email = isset($input['email']) ? trim($input['email']) : '';
    $password = isset($input['password']) ? $input['password'] : '';
    $shop_name = isset($input['shop_name']) ? trim($input['shop_name']) : '';
    $bio = isset($input['bio']) ? trim($input['bio']) : '';
    $location = isset($input['location']) ? trim($input['location']) : '';
    
    if (empty($fullname) || empty($email) || empty($password) || empty($shop_name) || empty($bio)) {
        echo json_encode(['success' => false, 'message' => 'All fields are required']);
        exit();
    }
    
    if (strlen($password) < 6) {
        echo json_encode(['success' => false, 'message' => 'Password must be at least 6 characters']);
        exit();
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['success' => false, 'message' => 'Invalid email format']);
        exit();
    }
    
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        echo json_encode(['success' => false, 'message' => 'Email already registered']);
        exit();
    }
    
    try {
        $pdo->beginTransaction();
        
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("INSERT INTO users (fullname, email, password, role) VALUES (?, ?, ?, 'artisan')");
        $stmt->execute([$fullname, $email, $hashedPassword]);
        $userId = $pdo->lastInsertId();
        
        $stmt = $pdo->prepare("INSERT INTO artisan_profiles (user_id, shop_name, bio, location) VALUES (?, ?, ?, ?)");
        $stmt->execute([$userId, $shop_name, $bio, $location]);
        
        $pdo->commit();
        
        echo json_encode([
            'success' => true, 
            'user_id' => $userId, 
            'message' => 'Artisan registration successful! Please login.'
        ]);
    } catch (Exception $e) {
        $pdo->rollBack();
        echo json_encode(['success' => false, 'message' => 'Registration failed: ' . $e->getMessage()]);
    }
    exit();
}

// ============ LOGIN ============
if ($request == 'login') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        echo json_encode(['success' => false, 'message' => 'No data received']);
        exit();
    }
    
    $email = isset($input['email']) ? trim($input['email']) : '';
    $password = isset($input['password']) ? $input['password'] : '';
    
    if (empty($email) || empty($password)) {
        echo json_encode(['success' => false, 'message' => 'Email and password required']);
        exit();
    }
    
    // Include is_active in the SELECT
    $stmt = $pdo->prepare("SELECT id, fullname, email, password, role, is_active FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($user && password_verify($password, $user['password'])) {
        // Check if account is active
        if ($user['is_active'] == 0) {
            echo json_encode(['success' => false, 'message' => 'Your account has been disabled. Please contact support.']);
            exit();
        }
        
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user_name'] = $user['fullname'];
        $_SESSION['user_role'] = $user['role'];
        
        echo json_encode([
            'success' => true,
            'user' => [
                'id' => $user['id'],
                'fullname' => $user['fullname'],
                'email' => $user['email'],
                'role' => $user['role']
            ],
            'message' => 'Login successful'
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Invalid email or password']);
    }
    exit();
}

// ============ LOGOUT ============
if ($request == 'logout') {
    session_destroy();
    echo json_encode(['success' => true, 'message' => 'Logged out']);
    exit();
}

// ============ FORGOT PASSWORD ============
if ($request == 'forgot_password') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        echo json_encode(['success' => false, 'message' => 'No data received']);
        exit();
    }
    
    $email = isset($input['email']) ? trim($input['email']) : '';
    
    if (empty($email)) {
        echo json_encode(['success' => false, 'message' => 'Email is required']);
        exit();
    }
    
    // Check if email exists in database
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        echo json_encode(['success' => false, 'message' => 'Email not found']);
        exit();
    }
    
    // Email exists - return success (no database update needed since we don't actually send emails)
    echo json_encode(['success' => true, 'message' => 'Password reset link sent to your email']);
    exit();
}

// ============ UPDATE PROFILE ============
if ($request == 'update_profile') {
    if (!isLoggedIn()) {
        echo json_encode(['success' => false, 'message' => 'Please login']);
        exit();
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    $fullname = isset($input['fullname']) ? trim($input['fullname']) : '';
    $email = isset($input['email']) ? trim($input['email']) : '';
    $phone = isset($input['phone']) ? trim($input['phone']) : '';
    $password = isset($input['password']) ? $input['password'] : '';
    
    if (!empty($password)) {
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("UPDATE users SET fullname = ?, email = ?, phone = ?, password = ? WHERE id = ?");
        $stmt->execute([$fullname, $email, $phone, $hashedPassword, $_SESSION['user_id']]);
    } else {
        $stmt = $pdo->prepare("UPDATE users SET fullname = ?, email = ?, phone = ? WHERE id = ?");
        $stmt->execute([$fullname, $email, $phone, $_SESSION['user_id']]);
    }
    
    echo json_encode(['success' => true, 'message' => 'Profile updated successfully']);
    exit();
}

// ============ GET PRODUCTS ============
if ($request == 'get_products') {
    $stmt = $pdo->prepare("SELECT p.*, u.fullname as artisan_name, c.name as category_name 
                           FROM products p
                           LEFT JOIN users u ON p.artisan_id = u.id
                           LEFT JOIN categories c ON p.category_id = c.id
                           WHERE p.is_auction = 0
                           ORDER BY p.created_at DESC");
    $stmt->execute();
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['success' => true, 'products' => $products]);
    exit();
}

// ============ GET SINGLE PRODUCT ============
if ($request == 'get_product') {
    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    
    $stmt = $pdo->prepare("SELECT p.*, u.fullname as artisan_name, c.name as category_name,
                          (SELECT COUNT(*) FROM reviews WHERE product_id = p.id) as review_count,
                          (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE product_id = p.id) as average_rating
                           FROM products p
                           LEFT JOIN users u ON p.artisan_id = u.id
                           LEFT JOIN categories c ON p.category_id = c.id
                           WHERE p.id = ?");
    $stmt->execute([$id]);
    $product = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode(['success' => true, 'product' => $product]);
    exit();
}

// ============ CART FUNCTIONS ============
if ($request == 'get_cart') {
    if (!isLoggedIn()) {
        echo json_encode(['success' => false, 'message' => 'Please login', 'cart' => []]);
        exit();
    }
    
    $stmt = $pdo->prepare("SELECT c.id, c.product_id, c.quantity, p.name, p.price, p.image_url, u.fullname as artisan_name
                           FROM cart c
                           JOIN products p ON c.product_id = p.id
                           JOIN users u ON p.artisan_id = u.id
                           WHERE c.user_id = ?");
    $stmt->execute([$_SESSION['user_id']]);
    $cart = $stmt->fetchAll(PDO::FETCH_ASSOC);
    // 🔥 FIX: Convert quantity to integer for ALL cart items 🔥
    foreach ($cart as &$item) {
        $item['quantity'] = (int)$item['quantity'];
        $item['price'] = (float)$item['price'];
    }
    
    echo json_encode(['success' => true, 'cart' => $cart]);
    exit();
}

if ($request == 'add_to_cart') {
    if (!isLoggedIn()) {
        echo json_encode(['success' => false, 'message' => 'Please login']);
        exit();
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    $productId = $input['product_id'] ?? 0;
    $quantity = $input['quantity'] ?? 1;
    
    $stmt = $pdo->prepare("SELECT id FROM products WHERE id = ?");
    $stmt->execute([$productId]);
    if (!$stmt->fetch()) {
        echo json_encode(['success' => false, 'message' => 'Product not found']);
        exit();
    }
    
    $stmt = $pdo->prepare("SELECT id, quantity FROM cart WHERE user_id = ? AND product_id = ?");
    $stmt->execute([$_SESSION['user_id'], $productId]);
    $existing = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($existing) {
        $newQuantity = $existing['quantity'] + $quantity;
        $stmt = $pdo->prepare("UPDATE cart SET quantity = ? WHERE id = ?");
        $stmt->execute([$newQuantity, $existing['id']]);
    } else {
        $stmt = $pdo->prepare("INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)");
        $stmt->execute([$_SESSION['user_id'], $productId, $quantity]);
    }
    
    echo json_encode(['success' => true, 'message' => 'Added to cart']);
    exit();
}

if ($request == 'update_cart') {
    if (!isLoggedIn()) {
        echo json_encode(['success' => false, 'message' => 'Please login']);
        exit();
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    $cartId = $input['cart_id'] ?? 0;
    $quantity = $input['quantity'] ?? 0;
    
    if ($quantity <= 0) {
        $stmt = $pdo->prepare("DELETE FROM cart WHERE id = ? AND user_id = ?");
        $stmt->execute([$cartId, $_SESSION['user_id']]);
    } else {
        $stmt = $pdo->prepare("UPDATE cart SET quantity = ? WHERE id = ? AND user_id = ?");
        $stmt->execute([$quantity, $cartId, $_SESSION['user_id']]);
    }
    
    echo json_encode(['success' => true]);
    exit();
}

// ============ ORDER FUNCTIONS ============

function generateOrderNumber($pdo) {
    $stmt = $pdo->query("SELECT order_number FROM orders ORDER BY id DESC LIMIT 1");
    $last = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($last) {
        $num = intval($last['order_number']) + 1;
        return str_pad($num, 6, '0', STR_PAD_LEFT);
    }
    return '000001';
}

if ($request == 'place_order') {
    if (!isLoggedIn()) {
        echo json_encode(['success' => false, 'message' => 'Please login']);
        exit();
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    $shipping_address = $input['shipping_address'] ?? '';
    $shipping_city = $input['shipping_city'] ?? '';
    $shipping_phone = $input['shipping_phone'] ?? '';
    $payment_method = $input['payment_method'] ?? 'credit_card';
    
    $stmt = $pdo->prepare("SELECT c.product_id, c.quantity, p.name, p.price, p.stock 
                           FROM cart c
                           JOIN products p ON c.product_id = p.id
                           WHERE c.user_id = ?");
    $stmt->execute([$_SESSION['user_id']]);
    $cartItems = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($cartItems)) {
        echo json_encode(['success' => false, 'message' => 'Cart is empty']);
        exit();
    }
    
    // Check stock availability before proceeding
    foreach ($cartItems as $item) {
        if ($item['quantity'] > $item['stock']) {
            echo json_encode(['success' => false, 'message' => 'Insufficient stock for: ' . $item['name']]);
            exit();
        }
    }
    
    $total = 0;
    foreach ($cartItems as $item) {
        $total += $item['price'] * $item['quantity'];
    }
    $shipping = 5;
    $grandTotal = $total + $shipping;
    
    try {
        $pdo->beginTransaction();
        
        $orderNumber = generateOrderNumber($pdo);
        $stmt = $pdo->prepare("INSERT INTO orders (user_id, order_number, total_amount, shipping_address, shipping_city, shipping_phone, payment_method, status, payment_status) 
                               VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', 'pending')");
        $stmt->execute([$_SESSION['user_id'], $orderNumber, $grandTotal, $shipping_address, $shipping_city, $shipping_phone, $payment_method]);
        $orderId = $pdo->lastInsertId();
        
        foreach ($cartItems as $item) {
            // Insert order item
            $stmt = $pdo->prepare("INSERT INTO order_items (order_id, product_id, product_name, quantity, price) 
                                   VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$orderId, $item['product_id'], $item['name'], $item['quantity'], $item['price']]);
            
            // Decrease product stock
            $stmt = $pdo->prepare("UPDATE products SET stock = stock - ? WHERE id = ?");
            $stmt->execute([$item['quantity'], $item['product_id']]);
        }
        
        $stmt = $pdo->prepare("DELETE FROM cart WHERE user_id = ?");
        $stmt->execute([$_SESSION['user_id']]);
        
        $pdo->commit();
        
        echo json_encode(['success' => true, 'order_number' => $orderNumber, 'order_id' => $orderId, 'total' => $grandTotal, 'message' => 'Order placed successfully']);
    } catch (Exception $e) {
        $pdo->rollBack();
        echo json_encode(['success' => false, 'message' => 'Order failed: ' . $e->getMessage()]);
    }
    exit();
}

// Restore stock when order is cancelled
if ($request == 'restore_order_stock') {
    if (!isLoggedIn() || ($_SESSION['user_role'] !== 'admin' && $_SESSION['user_role'] !== 'artisan')) {
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    $orderId = $input['order_id'] ?? 0;
    
    // Get order items
    $stmt = $pdo->prepare("SELECT product_id, quantity FROM order_items WHERE order_id = ?");
    $stmt->execute([$orderId]);
    $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($items as $item) {
        $stmt = $pdo->prepare("UPDATE products SET stock = stock + ? WHERE id = ?");
        $stmt->execute([$item['quantity'], $item['product_id']]);
    }
    
    echo json_encode(['success' => true, 'message' => 'Stock restored']);
    exit();
}

if ($request == 'get_orders') {
    if (!isLoggedIn()) {
        echo json_encode(['success' => false, 'message' => 'Please login']);
        exit();
    }
    
    $stmt = $pdo->prepare("SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC");
    $stmt->execute([$_SESSION['user_id']]);
    $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);
     // Add item_count for each order (does NOT remove any existing data)
    foreach ($orders as &$order) {
        $stmt = $pdo->prepare("SELECT SUM(quantity) as item_count FROM order_items WHERE order_id = ?");
        $stmt->execute([$order['id']]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $order['item_count'] = $result['item_count'];
    }
    echo json_encode(['success' => true, 'orders' => $orders]);
    exit();
}

if ($request == 'get_order') {
    if (!isLoggedIn()) {
        echo json_encode(['success' => false, 'message' => 'Please login']);
        exit();
    }
    
    $orderNumber = $_GET['order_number'] ?? '';
    
    // Check if user is admin
    $isAdmin = ($_SESSION['user_role'] === 'admin');
    
    if ($isAdmin) {
        // Admin can view any order
        $stmt = $pdo->prepare("
            SELECT o.*, u.fullname as customer_name 
            FROM orders o
            JOIN users u ON o.user_id = u.id
            WHERE o.order_number = ?
        ");
        $stmt->execute([$orderNumber]);
        $order = $stmt->fetch(PDO::FETCH_ASSOC);
    } else {
        // Regular users can only view their own orders
        $stmt = $pdo->prepare("SELECT * FROM orders WHERE order_number = ? AND user_id = ?");
        $stmt->execute([$orderNumber, $_SESSION['user_id']]);
        $order = $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    if ($order) {
        $stmt = $pdo->prepare("SELECT * FROM order_items WHERE order_id = ?");
        $stmt->execute([$order['id']]);
        $order['items'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['success' => true, 'order' => $order]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Order not found']);
    }
    exit();
}

// ============ WISHLIST FUNCTIONS ============

if ($request == 'get_wishlist') {
    if (!isLoggedIn()) {
        echo json_encode(['success' => false, 'message' => 'Please login']);
        exit();
    }
    
    $stmt = $pdo->prepare("SELECT w.*, p.name, p.price, p.image_url, u.fullname as artisan_name
                           FROM wishlist w
                           JOIN products p ON w.product_id = p.id
                           LEFT JOIN users u ON p.artisan_id = u.id
                           WHERE w.user_id = ?");
    $stmt->execute([$_SESSION['user_id']]);
    $wishlist = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['success' => true, 'wishlist' => $wishlist]);
    exit();
}

if ($request == 'add_to_wishlist') {
    if (!isLoggedIn()) {
        echo json_encode(['success' => false, 'message' => 'Please login']);
        exit();
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    $productId = $input['product_id'] ?? 0;
    
    try {
        $stmt = $pdo->prepare("INSERT INTO wishlist (user_id, product_id) VALUES (?, ?)");
        $stmt->execute([$_SESSION['user_id'], $productId]);
        echo json_encode(['success' => true, 'message' => 'Added to wishlist']);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Already in wishlist']);
    }
    exit();
}

if ($request == 'remove_from_wishlist') {
    if (!isLoggedIn()) {
        echo json_encode(['success' => false, 'message' => 'Please login']);
        exit();
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    $productId = $input['product_id'] ?? 0;
    
    $stmt = $pdo->prepare("DELETE FROM wishlist WHERE user_id = ? AND product_id = ?");
    $stmt->execute([$_SESSION['user_id'], $productId]);
    
    echo json_encode(['success' => true]);
    exit();
}

// ============ AUCTION FUNCTIONS ============

// Get all active auctions
if ($request == 'get_auctions') {
    $userId = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null;
    
    // Get active auctions
    $stmt = $pdo->prepare("SELECT a.*, u.fullname as artisan_name,
                          (SELECT COUNT(*) FROM bids WHERE auction_id = a.id) as bid_count
                           FROM auctions a
                           JOIN users u ON a.artisan_id = u.id
                           WHERE a.is_active = 1 AND a.end_time > NOW()
                           ORDER BY a.end_time ASC");
    $stmt->execute();
    $auctions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // If user is logged in, also get their won auctions that are still within purchase window
    if ($userId) {
        $stmt = $pdo->prepare("SELECT a.*, u.fullname as artisan_name,
                              (SELECT COUNT(*) FROM bids WHERE auction_id = a.id) as bid_count
                               FROM auctions a
                               JOIN users u ON a.artisan_id = u.id
                               WHERE a.winner_id = ? AND a.winner_expires > NOW() AND a.is_active = 0
                               ORDER BY a.winner_expires ASC");
        $stmt->execute([$userId]);
        $wonAuctions = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Merge won auctions with active auctions
        $auctions = array_merge($auctions, $wonAuctions);
    }
    
    echo json_encode(['success' => true, 'auctions' => $auctions]);
    exit();
}

// Get single auction by ID
if ($request == 'get_auction') {
    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    $userId = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null;
    
    $stmt = $pdo->prepare("SELECT a.*, u.fullname as artisan_name,
                          (SELECT COUNT(*) FROM bids WHERE auction_id = a.id) as bid_count
                           FROM auctions a
                           JOIN users u ON a.artisan_id = u.id
                           WHERE a.id = ?");
    $stmt->execute([$id]);
    $auction = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($auction) {
        $isEnded = strtotime($auction['end_time']) < time();
        
        // FORCE set winner if auction ended and has a current_bidder_id
        if ($isEnded && $auction['current_bidder_id'] > 0) {
            // Always set/update the winner for ended auctions
            $winnerExpires = date('Y-m-d H:i:s', strtotime('+48 hours'));
            $updateStmt = $pdo->prepare("UPDATE auctions SET winner_id = ?, winner_expires = ? WHERE id = ? AND (winner_id IS NULL OR winner_id != ?)");
            $updateStmt->execute([$auction['current_bidder_id'], $winnerExpires, $id, $auction['current_bidder_id']]);
            $auction['winner_id'] = $auction['current_bidder_id'];
            $auction['winner_expires'] = $winnerExpires;
        }
        
        // SIMPLE winner check - just compare user ID with current_bidder_id
        $auction['is_winner'] = ($userId && $auction['current_bidder_id'] == $userId);
        $auction['can_purchase'] = ($auction['is_winner'] && $isEnded);
        $auction['is_ended'] = $isEnded;
        
        echo json_encode(['success' => true, 'auction' => $auction]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Auction not found']);
    }
    exit();
}

// Place a bid
if ($request == 'place_bid') {
    if (!isLoggedIn()) {
        echo json_encode(['success' => false, 'message' => 'Please login to place a bid']);
        exit();
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    $auctionId = $input['auction_id'] ?? 0;
    $bidAmount = $input['bid_amount'] ?? 0;
    $userId = $_SESSION['user_id'];
    
    // Get auction details
    $stmt = $pdo->prepare("SELECT * FROM auctions WHERE id = ? AND is_active = 1 AND end_time > NOW()");
    $stmt->execute([$auctionId]);
    $auction = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$auction) {
        echo json_encode(['success' => false, 'message' => 'Auction is not active or has ended']);
        exit();
    }
    
    // Validate bid amount
    if ($bidAmount <= $auction['current_bid']) {
        echo json_encode(['success' => false, 'message' => 'Bid must be higher than current bid of ' . $auction['current_bid']]);
        exit();
    }
    
    $minIncrement = $auction['min_increment'] ?? 5;
    $minAllowed = $auction['current_bid'] + $minIncrement;
    if ($bidAmount < $minAllowed) {
        echo json_encode(['success' => false, 'message' => 'Minimum bid is ' . $minAllowed]);
        exit();
    }
    
    try {
        $pdo->beginTransaction();
        
        // Record the bid
        $stmt = $pdo->prepare("INSERT INTO bids (auction_id, user_id, bid_amount) VALUES (?, ?, ?)");
        $stmt->execute([$auctionId, $userId, $bidAmount]);
        
        // Update auction current bid and clear any previous winner
        $stmt = $pdo->prepare("UPDATE auctions SET current_bid = ?, current_bidder_id = ?, winner_id = NULL, winner_expires = NULL, winner_notified = 0 WHERE id = ?");
        $stmt->execute([$bidAmount, $userId, $auctionId]);
        
        $pdo->commit();
        
        echo json_encode(['success' => true, 'current_bid' => $bidAmount, 'message' => 'Bid placed successfully']);
    } catch (Exception $e) {
        $pdo->rollBack();
        echo json_encode(['success' => false, 'message' => 'Failed to place bid: ' . $e->getMessage()]);
    }
    exit();
}


// Add auction item to cart (for winner)
if ($request == 'add_auction_to_cart') {
    if (!isLoggedIn()) {
        echo json_encode(['success' => false, 'message' => 'Please login']);
        exit();
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    $auctionId = $input['auction_id'] ?? 0;
    $userId = $_SESSION['user_id'];
    
    // Get auction details
    $stmt = $pdo->prepare("SELECT * FROM auctions WHERE id = ? AND winner_id = ? AND winner_expires > NOW()");
    $stmt->execute([$auctionId, $userId]);
    $auction = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$auction) {
        echo json_encode(['success' => false, 'message' => 'You are not the winner or your purchase window has expired']);
        exit();
    }
    
    // Create a temporary product from auction for cart
    // First, check if a product already exists for this auction
    $stmt = $pdo->prepare("SELECT id FROM products WHERE name = ? AND artisan_id = ?");
    $tempProductName = "[Auction] " . $auction['title'];
    $stmt->execute([$tempProductName, $auction['artisan_id']]);
    $existingProduct = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($existingProduct) {
        $productId = $existingProduct['id'];
    } else {
        // Create a temporary product for this auction win
        $stmt = $pdo->prepare("INSERT INTO products (artisan_id, name, description, price, stock, image_url, is_auction, created_at) 
                               VALUES (?, ?, ?, ?, 1, ?, 1, NOW())");
        $stmt->execute([
            $auction['artisan_id'],
            $tempProductName,
            $auction['description'],
            $auction['current_bid'],
            $auction['image_url']
        ]);
        $productId = $pdo->lastInsertId();
    }
    
    // Check if already in cart
    $stmt = $pdo->prepare("SELECT id FROM cart WHERE user_id = ? AND product_id = ?");
    $stmt->execute([$userId, $productId]);
    
    if ($stmt->fetch()) {
        echo json_encode(['success' => false, 'message' => 'Item already in cart']);
        exit();
    }
    
    // Add to cart
    $stmt = $pdo->prepare("INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, 1)");
    $stmt->execute([$userId, $productId]);
    
    echo json_encode(['success' => true, 'message' => 'Item added to cart! Proceed to checkout.']);
    exit();
}

// Check and set winners for ended auctions (call this via cron or on page load)
if ($request == 'process_ended_auctions') {
    $stmt = $pdo->prepare("
        UPDATE auctions 
        SET winner_id = current_bidder_id, 
            winner_expires = DATE_ADD(NOW(), INTERVAL 48 HOUR),
            winner_notified = 0
        WHERE end_time < NOW() 
        AND is_active = 1 
        AND current_bidder_id IS NOT NULL
        AND winner_id IS NULL
    ");
    $stmt->execute();
    
    echo json_encode(['success' => true, 'updated' => $stmt->rowCount()]);
    exit();
}

// Get bid history for an auction
if ($request == 'get_bid_history') {
    $auctionId = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    
    $stmt = $pdo->prepare("SELECT b.*, u.fullname as bidder_name 
                           FROM bids b
                           JOIN users u ON b.user_id = u.id
                           WHERE b.auction_id = ?
                           ORDER BY b.bid_time DESC");
    $stmt->execute([$auctionId]);
    $bids = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['success' => true, 'bids' => $bids]);
    exit();
}

// Get user's auction history (both won and lost)
// Get user's auction history (both won and lost)
if ($request == 'get_user_auction_history') {
    if (!isLoggedIn()) {
        echo json_encode(['success' => false, 'message' => 'Please login']);
        exit();
    }
    
    $userId = $_SESSION['user_id'];
    
    // Get WON auctions (all won auctions, regardless of expiry)
    $stmt = $pdo->prepare("
        SELECT a.*, u.fullname as artisan_name, 'won' as status,
               a.current_bid as winning_bid,
               CASE WHEN a.winner_expires > NOW() THEN 1 ELSE 0 END as can_purchase
        FROM auctions a
        JOIN users u ON a.artisan_id = u.id
        WHERE a.winner_id = ?
        ORDER BY a.end_time DESC
    ");
    $stmt->execute([$userId]);
    $wonAuctions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Add already_purchased check for won auctions
    // Add already_purchased check for won auctions
foreach ($wonAuctions as &$auction) {
    $productName = "[Auction] " . $auction['title'];
    
    // Check if product is in cart OR already in an order (paid/delivered)
    $checkStmt = $pdo->prepare("
        SELECT 'cart' as source FROM cart c
        JOIN products p ON c.product_id = p.id
        WHERE c.user_id = ? AND p.name = ?
        UNION
        SELECT 'order' as source FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        JOIN orders o ON oi.order_id = o.id
        WHERE o.user_id = ? AND p.name = ? AND o.status = 'delivered'
        LIMIT 1
    ");
    $checkStmt->execute([$userId, $productName, $userId, $productName]);
    $auction['already_purchased'] = $checkStmt->fetch() ? 1 : 0;
}
    
    // Get LOST auctions (user bid but didn't win)
    $stmt = $pdo->prepare("
        SELECT DISTINCT a.*, u.fullname as artisan_name, 'lost' as status,
               (SELECT MAX(bid_amount) FROM bids WHERE auction_id = a.id AND user_id = ?) as my_highest_bid,
               a.current_bid as winning_bid,
               0 as can_purchase,
               0 as already_purchased
        FROM auctions a
        JOIN users u ON a.artisan_id = u.id
        WHERE a.id IN (
            SELECT DISTINCT auction_id FROM bids WHERE user_id = ?
        )
        AND a.end_time < NOW()
        AND (a.winner_id IS NULL OR a.winner_id != ?)
        ORDER BY a.end_time DESC
    ");
    $stmt->execute([$userId, $userId, $userId]);
    $lostAuctions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Combine and sort by end_time (most recent first)
    $allAuctions = array_merge($wonAuctions, $lostAuctions);
    usort($allAuctions, function($a, $b) {
        return strtotime($b['end_time']) - strtotime($a['end_time']);
    });
    
    echo json_encode(['success' => true, 'auctions' => $allAuctions]);
    exit();
}

// Create auction (for artisans)
if ($request == 'create_auction') {
    if (!isLoggedIn() || $_SESSION['user_role'] !== 'artisan') {
        echo json_encode(['success' => false, 'message' => 'Only artisans can create auctions']);
        exit();
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    $artisan_id = $_SESSION['user_id'];
    $title = trim($input['title'] ?? '');
    $description = trim($input['description'] ?? '');
    $startBid = floatval($input['start_bid'] ?? 0);
    $minIncrement = floatval($input['min_increment'] ?? 5);
    $endTime = $input['end_time'] ?? '';
    $image_url = trim($input['image_url'] ?? '');
    
    // Validate required fields
    if (empty($title)) {
        echo json_encode(['success' => false, 'message' => 'Auction title is required']);
        exit();
    }
    
    if ($startBid <= 0) {
        echo json_encode(['success' => false, 'message' => 'Starting bid must be greater than 0']);
        exit();
    }
    
    if (empty($endTime)) {
        echo json_encode(['success' => false, 'message' => 'End date and time is required']);
        exit();
    }
    
    // Set default image if none provided
    if (empty($image_url)) {
        $image_url = 'https://placehold.co/600x400/8B5E3C/white?text=' . urlencode($title);
    }
    
    try {
        $stmt = $pdo->prepare("INSERT INTO auctions (artisan_id, title, description, start_bid, current_bid, min_increment, image_url, start_time, end_time, is_active, created_at) 
                               VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?, 1, NOW())");
        $stmt->execute([$artisan_id, $title, $description, $startBid, $startBid, $minIncrement, $image_url, $endTime]);
        
        echo json_encode(['success' => true, 'message' => 'Auction created successfully', 'auction_id' => $pdo->lastInsertId()]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Failed to create auction: ' . $e->getMessage()]);
    }
    exit();
}

// Get artisan's auctions
if ($request == 'get_artisan_auctions') {
    if (!isLoggedIn() || $_SESSION['user_role'] !== 'artisan') {
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }
    
    $stmt = $pdo->prepare("SELECT a.*,
                          (SELECT COUNT(*) FROM bids WHERE auction_id = a.id) as bid_count
                          FROM auctions a
                          WHERE a.artisan_id = ?
                          ORDER BY a.created_at DESC");
    $stmt->execute([$_SESSION['user_id']]);
    $auctions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['success' => true, 'auctions' => $auctions]);
    exit();
}




// ============ ARTISAN PRODUCT MANAGEMENT ============
// Get artisan's products (for dashboard)
if ($request == 'get_artisan_products') {
    if (!isLoggedIn() || $_SESSION['user_role'] !== 'artisan') {
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }
    
    $stmt = $pdo->prepare("SELECT * FROM products WHERE artisan_id = ? ORDER BY created_at DESC");
    $stmt->execute([$_SESSION['user_id']]);
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['success' => true, 'products' => $products]);
    exit();
}

// Delete product (artisan only)
if ($request == 'delete_product') {
    if (!isLoggedIn() || $_SESSION['user_role'] !== 'artisan') {
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    $productId = $input['product_id'] ?? 0;
    $artisan_id = $_SESSION['user_id'];
    
    // Get image URL before deleting
    $stmt = $pdo->prepare("SELECT image_url FROM products WHERE id = ? AND artisan_id = ?");
    $stmt->execute([$productId, $artisan_id]);
    $product = $stmt->fetch(PDO::FETCH_ASSOC);
    $image_url = $product ? $product['image_url'] : null;
    
    // First delete from cart and wishlist
    $pdo->prepare("DELETE FROM cart WHERE product_id = ?")->execute([$productId]);
    $pdo->prepare("DELETE FROM wishlist WHERE product_id = ?")->execute([$productId]);
    
    $stmt = $pdo->prepare("DELETE FROM products WHERE id = ? AND artisan_id = ?");
    $stmt->execute([$productId, $artisan_id]);
    
    // Delete image file if exists
    if ($image_url) {
        deleteImageFile($image_url);
    }
    
    echo json_encode(['success' => true, 'message' => 'Product deleted']);
    exit();
}


// Add product (artisan only)
if ($request == 'add_product') {
    if (!isLoggedIn() || $_SESSION['user_role'] !== 'artisan') {
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    $artisan_id = $_SESSION['user_id'];
    $name = trim($input['name'] ?? '');
    $category_id = isset($input['category_id']) ? (int)$input['category_id'] : null;
    $price = isset($input['price']) ? (float)$input['price'] : 0;
    $stock = isset($input['stock']) ? (int)$input['stock'] : 1;
    $description = trim($input['description'] ?? '');
    $image_url = trim($input['image_url'] ?? '');
    $is_auction = isset($input['is_auction']) ? (int)$input['is_auction'] : 0;
    
    // Validate required fields
    if (empty($name)) {
        echo json_encode(['success' => false, 'message' => 'Product name is required']);
        exit();
    }
    
    if ($price <= 0) {
        echo json_encode(['success' => false, 'message' => 'Valid price is required']);
        exit();
    }
    
    // Set default image if none provided
    if (empty($image_url)) {
        $image_url = 'https://placehold.co/600x400/8B5E3C/white?text=' . urlencode($name);
    }
    
    // Check if category exists
    if ($category_id) {
        $checkStmt = $pdo->prepare("SELECT id FROM categories WHERE id = ?");
        $checkStmt->execute([$category_id]);
        if (!$checkStmt->fetch()) {
            $category_id = null;
        }
    }
    
    $stmt = $pdo->prepare("INSERT INTO products (artisan_id, category_id, name, description, price, stock, image_url, is_auction, created_at) 
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())");
    $stmt->execute([$artisan_id, $category_id, $name, $description, $price, $stock, $image_url, $is_auction]);
    
    echo json_encode(['success' => true, 'message' => 'Product added successfully', 'product_id' => $pdo->lastInsertId()]);
    exit();
}


// Update product (artisan only)
if ($request == 'update_product') {
    if (!isLoggedIn() || $_SESSION['user_role'] !== 'artisan') {
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    $product_id = isset($input['product_id']) ? (int)$input['product_id'] : 0;
    $artisan_id = $_SESSION['user_id'];
    $name = trim($input['name'] ?? '');
    $category_id = isset($input['category_id']) ? (int)$input['category_id'] : null;
    $price = isset($input['price']) ? (float)$input['price'] : 0;
    $stock = isset($input['stock']) ? (int)$input['stock'] : 0;
    $description = trim($input['description'] ?? '');
    $new_image_url = trim($input['image_url'] ?? '');
    
    // Get old image URL before update
    $stmt = $pdo->prepare("SELECT image_url FROM products WHERE id = ? AND artisan_id = ?");
    $stmt->execute([$product_id, $artisan_id]);
    $old_image = $stmt->fetch(PDO::FETCH_ASSOC);
    $old_image_url = $old_image ? $old_image['image_url'] : null;
    
    // Validate product belongs to this artisan
    $stmt = $pdo->prepare("SELECT id FROM products WHERE id = ? AND artisan_id = ?");
    $stmt->execute([$product_id, $artisan_id]);
    if (!$stmt->fetch()) {
        echo json_encode(['success' => false, 'message' => 'Product not found or does not belong to you']);
        exit();
    }
    
    // Validate required fields
    if (empty($name)) {
        echo json_encode(['success' => false, 'message' => 'Product name is required']);
        exit();
    }
    
    if ($price <= 0) {
        echo json_encode(['success' => false, 'message' => 'Valid price is required']);
        exit();
    }
    
    if ($stock < 0) {
        echo json_encode(['success' => false, 'message' => 'Stock cannot be negative']);
        exit();
    }
    
    // Check if category exists
    if ($category_id) {
        $checkStmt = $pdo->prepare("SELECT id FROM categories WHERE id = ?");
        $checkStmt->execute([$category_id]);
        if (!$checkStmt->fetch()) {
            $category_id = null;
        }
    }
    
    $stmt = $pdo->prepare("UPDATE products 
                           SET name = ?, category_id = ?, price = ?, stock = ?, description = ?, image_url = ?
                           WHERE id = ? AND artisan_id = ?");
    $stmt->execute([$name, $category_id, $price, $stock, $description, $new_image_url, $product_id, $artisan_id]);
    
    // Delete old image if it was replaced and not a placeholder
    if ($old_image_url && $old_image_url !== $new_image_url) {
        deleteImageFile($old_image_url);
    }
    
    echo json_encode(['success' => true, 'message' => 'Product updated successfully']);
    exit();
}



// Get artisan profile
if ($request == 'get_artisan_profile') {
    if (!isLoggedIn() || $_SESSION['user_role'] !== 'artisan') {
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }
    
    $stmt = $pdo->prepare("SELECT * FROM artisan_profiles WHERE user_id = ?");
    $stmt->execute([$_SESSION['user_id']]);
    $profile = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode(['success' => true, 'profile' => $profile]);
    exit();
}

// Update artisan profile
if ($request == 'update_artisan_profile') {
    if (!isLoggedIn() || $_SESSION['user_role'] !== 'artisan') {
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    $shop_name = trim($input['shop_name'] ?? '');
    $bio = trim($input['bio'] ?? '');
    $location = trim($input['location'] ?? '');
    
    // Check if profile exists
    $stmt = $pdo->prepare("SELECT id FROM artisan_profiles WHERE user_id = ?");
    $stmt->execute([$_SESSION['user_id']]);
    
    if ($stmt->fetch()) {
        // Update existing profile
        $stmt = $pdo->prepare("UPDATE artisan_profiles SET shop_name = ?, bio = ?, location = ? WHERE user_id = ?");
        $stmt->execute([$shop_name, $bio, $location, $_SESSION['user_id']]);
    } else {
        // Insert new profile
        $stmt = $pdo->prepare("INSERT INTO artisan_profiles (user_id, shop_name, bio, location) VALUES (?, ?, ?, ?)");
        $stmt->execute([$_SESSION['user_id'], $shop_name, $bio, $location]);
    }
    
    echo json_encode(['success' => true, 'message' => 'Profile updated successfully']);
    exit();
}

// Get orders for artisan's products
if ($request == 'get_artisan_orders') {
    if (!isLoggedIn() || $_SESSION['user_role'] !== 'artisan') {
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }
    
    $stmt = $pdo->prepare("
        SELECT DISTINCT o.*, u.fullname as customer_name,
        (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        JOIN products p ON oi.product_id = p.id
        JOIN users u ON o.user_id = u.id
        WHERE p.artisan_id = ?
        ORDER BY o.created_at DESC
    ");
    $stmt->execute([$_SESSION['user_id']]);
    $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get items for each order
    foreach ($orders as &$order) {
        $stmt = $pdo->prepare("SELECT * FROM order_items WHERE order_id = ?");
        $stmt->execute([$order['id']]);
        $order['items'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    echo json_encode(['success' => true, 'orders' => $orders]);
    exit();
}

// Get artisan order detail
if ($request == 'get_artisan_order_detail') {
    if (!isLoggedIn() || $_SESSION['user_role'] !== 'artisan') {
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }
    
    $orderNumber = $_GET['order_number'] ?? '';
    
    $stmt = $pdo->prepare("
        SELECT o.*, u.fullname as customer_name
        FROM orders o
        JOIN users u ON o.user_id = u.id
        WHERE o.order_number = ?
    ");
    $stmt->execute([$orderNumber]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($order) {
        // Verify this artisan has products in this order
        $stmt = $pdo->prepare("
            SELECT COUNT(*) FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = ? AND p.artisan_id = ?
        ");
        $stmt->execute([$order['id'], $_SESSION['user_id']]);
        
        if ($stmt->fetchColumn() > 0) {
            $stmt = $pdo->prepare("SELECT * FROM order_items WHERE order_id = ?");
            $stmt->execute([$order['id']]);
            $order['items'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode(['success' => true, 'order' => $order]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Order not found']);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Order not found']);
    }
    exit();
}

// Update order status (artisan only)
// Update order status (artisan only)
if ($request == 'artisan_update_order_status') {
    if (!isLoggedIn() || $_SESSION['user_role'] !== 'artisan') {
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    $orderId = $input['order_id'] ?? 0;
    $newStatus = $input['status'] ?? '';
    
    // Verify this order contains products from this artisan
    $stmt = $pdo->prepare("
        SELECT o.id, o.status FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        JOIN products p ON oi.product_id = p.id
        WHERE o.id = ? AND p.artisan_id = ?
        LIMIT 1
    ");
    $stmt->execute([$orderId, $_SESSION['user_id']]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$order) {
        echo json_encode(['success' => false, 'message' => 'Order not found or does not belong to you']);
        exit();
    }
    
    $allowedStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!in_array($newStatus, $allowedStatuses)) {
        echo json_encode(['success' => false, 'message' => 'Invalid status']);
        exit();
    }
    
    $currentStatus = $order['status'];
    
    // Get order items (only for this artisan's products)
    $stmt = $pdo->prepare("
        SELECT oi.product_id, oi.quantity 
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ? AND p.artisan_id = ?
    ");
    $stmt->execute([$orderId, $_SESSION['user_id']]);
    $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Define which statuses are "confirmed" (stock should be deducted)
    $confirmedStatuses = ['processing', 'shipped', 'delivered'];
    $cancelledStatus = 'cancelled';
    
    $wasConfirmed = in_array($currentStatus, $confirmedStatuses);
    $isNowConfirmed = in_array($newStatus, $confirmedStatuses);
    $wasCancelled = $currentStatus === $cancelledStatus;
    $isNowCancelled = $newStatus === $cancelledStatus;
    
    // Stock adjustment logic
    if ($wasConfirmed && $isNowCancelled) {
        // Moving from confirmed to cancelled: restore stock
        foreach ($items as $item) {
            $stmt = $pdo->prepare("UPDATE products SET stock = stock + ? WHERE id = ?");
            $stmt->execute([$item['quantity'], $item['product_id']]);
        }
    } 
    else if ($wasCancelled && $isNowConfirmed) {
        // Moving from cancelled to confirmed: deduct stock
        foreach ($items as $item) {
            $stmt = $pdo->prepare("UPDATE products SET stock = stock - ? WHERE id = ?");
            $stmt->execute([$item['quantity'], $item['product_id']]);
        }
    }    
    $stmt = $pdo->prepare("UPDATE orders SET status = ? WHERE id = ?");
    $stmt->execute([$newStatus, $orderId]);
    
    echo json_encode(['success' => true, 'message' => 'Order status updated successfully']);
    exit();
}

// ============ IMAGE UPLOAD ============
if ($request == 'upload_image') {
    if (!isLoggedIn()) {
        echo json_encode(['success' => false, 'message' => 'Please login']);
        exit();
    }
    
    // Get type from POST data (product or auction)
    $type = isset($_POST['type']) ? $_POST['type'] : 'image';
    
    // Create uploads folder if it doesn't exist
    $uploadDir = __DIR__ . '/uploads/';
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }
    
    if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
        $file = $_FILES['image'];
        
        // Clean filename: remove special chars, convert to lowercase
        $originalName = pathinfo($file['name'], PATHINFO_FILENAME);
        $cleanName = preg_replace('/[^a-zA-Z0-9]/', '_', $originalName);
        $cleanName = strtolower($cleanName);
        $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        
        // Create descriptive filename: type_cleanname_timestamp.extension
        $fileName = $type . '_' . $cleanName . '_' . time() . '.' . $extension;
        $targetPath = $uploadDir . $fileName;
        
        // Check file type
        $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!in_array($file['type'], $allowedTypes)) {
            echo json_encode(['success' => false, 'message' => 'Only JPG, PNG, GIF, and WEBP images are allowed']);
            exit();
        }
        
        // Check file size (max 5MB)
        if ($file['size'] > 5 * 1024 * 1024) {
            echo json_encode(['success' => false, 'message' => 'Image must be less than 5MB']);
            exit();
        }
        
        if (move_uploaded_file($file['tmp_name'], $targetPath)) {
            $imageUrl = '/LocalArtisanITCS489Project/ITCS489-Proj/ITCS489-Local-Artisan-Version1/uploads/' . $fileName;
            echo json_encode(['success' => true, 'image_url' => $imageUrl]);
            exit();
        }
    }
    
    echo json_encode(['success' => false, 'message' => 'No image uploaded']);
    exit();
}

// ============ ADMIN FUNCTIONS ============

// Check if user is admin
function isAdmin() {
    return isset($_SESSION['user_role']) && $_SESSION['user_role'] === 'admin';
}

// ===== ADMIN STATS =====
if ($request == 'admin_stats') {
    if (!isAdmin()) {
        echo json_encode(['success' => false, 'message' => 'Admin access required']);
        exit();
    }
    
    $stats = [];
    
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM users WHERE role = 'customer'");
    $stats['users'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM users WHERE role = 'artisan'");
    $stats['artisans'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM products");
    $stats['products'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM orders");
    $stats['orders'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    // Calculate revenue from order_items (product totals only, exclude shipping)
    $stmt = $pdo->query("
        SELECT COALESCE(SUM(oi.price * oi.quantity), 0) as total 
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id 
        WHERE o.status = 'delivered'
    ");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    $stats['revenue'] = $result['total'] ?? 0;
    
    echo json_encode(['success' => true, 'stats' => $stats]);
    exit();
}

// ===== ADMIN GET ALL USERS =====
if ($request == 'admin_get_users') {
    if (!isAdmin()) {
        echo json_encode(['success' => false, 'message' => 'Admin access required']);
        exit();
    }
    
    $stmt = $pdo->query("SELECT id, fullname, email, role, is_active, created_at FROM users ORDER BY created_at DESC");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['success' => true, 'users' => $users]);
    exit();
}

// ===== ADMIN TOGGLE USER STATUS =====
if ($request == 'admin_toggle_user') {
    if (!isAdmin()) {
        echo json_encode(['success' => false, 'message' => 'Admin access required']);
        exit();
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    $userId = $input['user_id'] ?? 0;
    $isActive = $input['is_active'] ?? 1;
    
    // Prevent admin from disabling their own account
    if ($userId == $_SESSION['user_id']) {
        echo json_encode(['success' => false, 'message' => 'You cannot disable your own account']);
        exit();
    }
    
    $stmt = $pdo->prepare("UPDATE users SET is_active = ? WHERE id = ?");
    $stmt->execute([$isActive ? 1 : 0, $userId]);
    
    echo json_encode(['success' => true]);
    exit();
}

// ===== ADMIN GET ALL ARTISANS =====
if ($request == 'admin_get_artisans') {
    if (!isAdmin()) {
        echo json_encode(['success' => false, 'message' => 'Admin access required']);
        exit();
    }
    
    $stmt = $pdo->query("
        SELECT u.id, u.fullname, u.email, u.is_active, ap.shop_name,
               (SELECT COUNT(*) FROM products WHERE artisan_id = u.id) as product_count
        FROM users u
        LEFT JOIN artisan_profiles ap ON u.id = ap.user_id
        WHERE u.role = 'artisan'
        ORDER BY u.created_at DESC
    ");
    $artisans = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['success' => true, 'artisans' => $artisans]);
    exit();
}

// ===== ADMIN TOGGLE ARTISAN STATUS =====
if ($request == 'admin_toggle_artisan') {
    if (!isAdmin()) {
        echo json_encode(['success' => false, 'message' => 'Admin access required']);
        exit();
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    $userId = $input['user_id'] ?? 0;
    $isActive = $input['is_active'] ?? 1;
    
    $stmt = $pdo->prepare("UPDATE users SET is_active = ? WHERE id = ?");
    $stmt->execute([$isActive ? 1 : 0, $userId]);
    
    echo json_encode(['success' => true]);
    exit();
}

// ===== ADMIN GET ALL ORDERS =====
if ($request == 'admin_get_orders') {
    if (!isAdmin()) {
        echo json_encode(['success' => false, 'message' => 'Admin access required']);
        exit();
    }
    
    $stmt = $pdo->query("
        SELECT o.*, u.fullname as customer_name,
               (SELECT COALESCE(SUM(oi.price * oi.quantity), 0) FROM order_items oi WHERE oi.order_id = o.id) as products_total
        FROM orders o
        JOIN users u ON o.user_id = u.id
        ORDER BY o.created_at DESC
    ");
    $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['success' => true, 'orders' => $orders]);
    exit();
}

// ===== ADMIN UPDATE ORDER STATUS =====
if ($request == 'admin_update_order_status') {
    if (!isAdmin()) {
        echo json_encode(['success' => false, 'message' => 'Admin access required']);
        exit();
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    $orderId = $input['order_id'] ?? 0;
    $newStatus = $input['status'] ?? '';
    
    // Get current status
    $stmt = $pdo->prepare("SELECT status FROM orders WHERE id = ?");
    $stmt->execute([$orderId]);
    $currentStatus = $stmt->fetchColumn();
    
    if (!$currentStatus) {
        echo json_encode(['success' => false, 'message' => 'Order not found']);
        exit();
    }
    
    // Get order items
    $stmt = $pdo->prepare("SELECT product_id, quantity FROM order_items WHERE order_id = ?");
    $stmt->execute([$orderId]);
    $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Define which statuses are "confirmed" (stock should be deducted)
    $confirmedStatuses = ['processing', 'shipped', 'delivered'];
    $cancelledStatus = 'cancelled';
    
    $wasConfirmed = in_array($currentStatus, $confirmedStatuses);
    $isNowConfirmed = in_array($newStatus, $confirmedStatuses);
    $wasCancelled = $currentStatus === $cancelledStatus;
    $isNowCancelled = $newStatus === $cancelledStatus;
    
    // If moving from confirmed to cancelled: restore stock
    if ($wasConfirmed && $isNowCancelled) {
        foreach ($items as $item) {
            $stmt = $pdo->prepare("UPDATE products SET stock = stock + ? WHERE id = ?");
            $stmt->execute([$item['quantity'], $item['product_id']]);
        }
    }
    // If moving from cancelled to confirmed: deduct stock
    else if ($wasCancelled && $isNowConfirmed) {
        foreach ($items as $item) {
            $stmt = $pdo->prepare("UPDATE products SET stock = stock - ? WHERE id = ?");
            $stmt->execute([$item['quantity'], $item['product_id']]);
        }
    }
    // If moving from one confirmed to another confirmed: no stock change
    
    // Update order status
    $stmt = $pdo->prepare("UPDATE orders SET status = ? WHERE id = ?");
    $stmt->execute([$newStatus, $orderId]);
    
    echo json_encode(['success' => true, 'message' => 'Order status updated']);
    exit();
}

// ===== ADMIN DELETE PRODUCT =====
if ($request == 'admin_delete_product') {
    if (!isAdmin()) {
        echo json_encode(['success' => false, 'message' => 'Admin access required']);
        exit();
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    $productId = $input['product_id'] ?? 0;
    
    // Delete from related tables first
    $pdo->prepare("DELETE FROM cart WHERE product_id = ?")->execute([$productId]);
    $pdo->prepare("DELETE FROM wishlist WHERE product_id = ?")->execute([$productId]);
    $pdo->prepare("DELETE FROM order_items WHERE product_id = ?")->execute([$productId]);
    
    $stmt = $pdo->prepare("DELETE FROM products WHERE id = ?");
    $stmt->execute([$productId]);
    
    echo json_encode(['success' => true]);
    exit();
}

// ===== ADMIN GET ALL AUCTIONS =====
if ($request == 'admin_get_auctions') {
    if (!isAdmin()) {
        echo json_encode(['success' => false, 'message' => 'Admin access required']);
        exit();
    }
    
    $stmt = $pdo->prepare("
        SELECT a.*, u.fullname as artisan_name,
        (SELECT COUNT(*) FROM bids WHERE auction_id = a.id) as bid_count
        FROM auctions a
        JOIN users u ON a.artisan_id = u.id
        ORDER BY a.created_at DESC
    ");
    $stmt->execute();
    $auctions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['success' => true, 'auctions' => $auctions]);
    exit();
}

// ===== ADMIN CANCEL AUCTION =====
if ($request == 'admin_cancel_auction') {
    if (!isAdmin()) {
        echo json_encode(['success' => false, 'message' => 'Admin access required']);
        exit();
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    $auctionId = $input['auction_id'] ?? 0;
    
    $stmt = $pdo->prepare("UPDATE auctions SET is_active = 0 WHERE id = ?");
    $stmt->execute([$auctionId]);
    
    echo json_encode(['success' => true]);
    exit();
}

// ===== GET CATEGORIES =====
if ($request == 'get_categories') {
    $stmt = $pdo->query("SELECT * FROM categories ORDER BY id ASC");
    $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['success' => true, 'categories' => $categories]);
    exit();
}

// ===== ADMIN ADD CATEGORY =====
if ($request == 'admin_add_category') {
    if (!isAdmin()) {
        echo json_encode(['success' => false, 'message' => 'Admin access required']);
        exit();
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    $name = trim($input['name'] ?? '');
    
    if (empty($name)) {
        echo json_encode(['success' => false, 'message' => 'Category name is required']);
        exit();
    }
    
    $stmt = $pdo->prepare("INSERT INTO categories (name) VALUES (?)");
    $stmt->execute([$name]);
    
    echo json_encode(['success' => true]);
    exit();
}

// ===== ADMIN DELETE CATEGORY =====
if ($request == 'admin_delete_category') {
    if (!isAdmin()) {
        echo json_encode(['success' => false, 'message' => 'Admin access required']);
        exit();
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    $categoryId = $input['category_id'] ?? 0;
    
    // Set products in this category to NULL first
    $pdo->prepare("UPDATE products SET category_id = NULL WHERE category_id = ?")->execute([$categoryId]);
    
    $stmt = $pdo->prepare("DELETE FROM categories WHERE id = ?");
    $stmt->execute([$categoryId]);
    
    echo json_encode(['success' => true, 'message' => 'Category deleted successfully']);
    exit();
}

// ===== ADMIN REPORTS (ENHANCED) =====
if ($request == 'admin_reports') {
    if (!isAdmin()) {
        echo json_encode(['success' => false, 'message' => 'Admin access required']);
        exit();
    }
    
    $year = isset($_GET['year']) ? (int)$_GET['year'] : date('Y');
    $month = isset($_GET['month']) ? $_GET['month'] : 'all';
    
    // Monthly sales summary (using product totals only)
    if ($month == 'all') {
        $stmt = $pdo->prepare("
            SELECT COALESCE(SUM(oi.price * oi.quantity), 0) as total, COUNT(DISTINCT o.id) as order_count 
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            WHERE YEAR(o.created_at) = ? AND o.status = 'delivered'
        ");
        $stmt->execute([$year]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $monthly_sales = $result['total'] ?? 0;
    } else {
        $stmt = $pdo->prepare("
            SELECT COALESCE(SUM(oi.price * oi.quantity), 0) as total, COUNT(DISTINCT o.id) as order_count 
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            WHERE YEAR(o.created_at) = ? AND MONTH(o.created_at) = ? AND o.status = 'delivered'
        ");
        $stmt->execute([$year, $month]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $monthly_sales = $result['total'] ?? 0;
    }
    
    // Monthly breakdown (using product totals only)
    $monthly_breakdown = [];
    for ($m = 1; $m <= 12; $m++) {
        $stmt = $pdo->prepare("
            SELECT COALESCE(SUM(oi.price * oi.quantity), 0) as total, COUNT(DISTINCT o.id) as count
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            WHERE YEAR(o.created_at) = ? AND MONTH(o.created_at) = ? AND o.status = 'delivered'
        ");
        $stmt->execute([$year, $m]);
        $data = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $monthly_breakdown[] = [
            'month' => $m,
            'month_name' => date('F', mktime(0, 0, 0, $m, 1)),
            'total_sales' => (float)($data['total'] ?? 0),
            'order_count' => (int)($data['count'] ?? 0),
            'avg_order_value' => ($data['count'] > 0) ? (float)($data['total'] / $data['count']) : 0
        ];
    }
    
    // Top artisans (already using product totals - correct)
    $stmt = $pdo->query("
        SELECT u.id, u.fullname, ap.shop_name,
               COALESCE(SUM(oi.quantity), 0) as products_sold,
               COALESCE(SUM(oi.price * oi.quantity), 0) as total_revenue
        FROM users u
        LEFT JOIN artisan_profiles ap ON u.id = ap.user_id
        LEFT JOIN products p ON u.id = p.artisan_id
        LEFT JOIN order_items oi ON p.id = oi.product_id
        LEFT JOIN orders o ON oi.order_id = o.id AND o.status = 'delivered'
        WHERE u.role = 'artisan'
        GROUP BY u.id
        ORDER BY total_revenue DESC
        LIMIT 10
    ");
    $top_artisans = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Best selling products (already using product totals - correct)
    $stmt = $pdo->query("
        SELECT p.id, p.name, c.name as category_name,
               COALESCE(SUM(oi.quantity), 0) as quantity_sold,
               COALESCE(SUM(oi.price * oi.quantity), 0) as total_revenue
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN order_items oi ON p.id = oi.product_id
        LEFT JOIN orders o ON oi.order_id = o.id AND o.status = 'delivered'
        GROUP BY p.id
        ORDER BY quantity_sold DESC
        LIMIT 10
    ");
    $best_products = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Recent orders (adding products_total)
    $stmt = $pdo->query("
        SELECT o.*, u.fullname as customer_name,
            (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count,
            (SELECT COALESCE(SUM(price * quantity), 0) FROM order_items WHERE order_id = o.id) as products_total
        FROM orders o
        JOIN users u ON o.user_id = u.id
        ORDER BY o.created_at DESC
        LIMIT 20
    ");
    $recent_orders = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Top artisan (single for summary)
    $top_artisan = !empty($top_artisans) ? $top_artisans[0]['fullname'] : 'N/A';
    
    // Best selling product (single for summary)
    $best_selling = !empty($best_products) ? $best_products[0]['name'] : 'N/A';
    
    echo json_encode([
        'success' => true,
        'monthly_sales' => (float)$monthly_sales,
        'top_artisan' => $top_artisan,
        'best_selling' => $best_selling,
        'monthly_breakdown' => $monthly_breakdown,
        'top_artisans' => $top_artisans,
        'best_products' => $best_products,
        'recent_orders' => $recent_orders
    ]);
    exit();
}

// ============ REVIEW FUNCTIONS ============
if ($request == 'get_reviews') {
    $productId = isset($_GET['product_id']) ? (int)$_GET['product_id'] : 0;
    
    $stmt = $pdo->prepare("
        SELECT r.*, u.fullname 
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        WHERE r.product_id = ?
        ORDER BY r.created_at DESC
    ");
    $stmt->execute([$productId]);
    $reviews = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['success' => true, 'reviews' => $reviews]);
    exit();
}

if ($request == 'add_review') {
    if (!isLoggedIn()) {
        echo json_encode(['success' => false, 'message' => 'Please login to leave a review']);
        exit();
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    $productId = $input['product_id'] ?? 0;
    $rating = $input['rating'] ?? 5;
    $comment = trim($input['comment'] ?? '');
    
    if (empty($comment)) {
        echo json_encode(['success' => false, 'message' => 'Please enter a review comment']);
        exit();
    }
    
    if ($rating < 1 || $rating > 5) {
        echo json_encode(['success' => false, 'message' => 'Invalid rating']);
        exit();
    }
    
    
    
    // Check if user already reviewed this product
    $stmt = $pdo->prepare("SELECT id FROM reviews WHERE user_id = ? AND product_id = ?");
    $stmt->execute([$_SESSION['user_id'], $productId]);
    if ($stmt->fetch()) {
        echo json_encode(['success' => false, 'message' => 'You have already reviewed this product']);
        exit();
    }
    
    $stmt = $pdo->prepare("
        INSERT INTO reviews (user_id, product_id, rating, comment, created_at) 
        VALUES (?, ?, ?, ?, NOW())
    ");
    $stmt->execute([$_SESSION['user_id'], $productId, $rating, $comment]);
    
    echo json_encode(['success' => true, 'message' => 'Review submitted successfully!']);
    exit();
}
// ===== ADMIN UPDATE AUCTION =====
if ($request == 'admin_update_auction') {
    if (!isAdmin()) {
        echo json_encode(['success' => false, 'message' => 'Admin access required']);
        exit();
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    $auctionId = $input['auction_id'] ?? 0;
    $end_time = $input['end_time'] ?? null;
    $status = $input['status'] ?? null;
    
    $updates = [];
    $params = [];
    
    if ($end_time) {
        $updates[] = "end_time = ?";
        $params[] = $end_time;
    }
    if ($status) {
        $updates[] = "is_active = ?";
        $params[] = ($status === 'active') ? 1 : 0;
    }
    
    if (empty($updates)) {
        echo json_encode(['success' => false, 'message' => 'No updates provided']);
        exit();
    }
    
    $params[] = $auctionId;
    $sql = "UPDATE auctions SET " . implode(', ', $updates) . " WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    
    echo json_encode(['success' => true, 'message' => 'Auction updated successfully']);
    exit();
}

// ===== ADMIN EXTEND AUCTION =====
if ($request == 'admin_extend_auction') {
    if (!isAdmin()) {
        echo json_encode(['success' => false, 'message' => 'Admin access required']);
        exit();
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    $auctionId = $input['auction_id'] ?? 0;
    $hours = $input['hours'] ?? 24;
    
    $stmt = $pdo->prepare("UPDATE auctions SET end_time = DATE_ADD(end_time, INTERVAL ? HOUR) WHERE id = ?");
    $stmt->execute([$hours, $auctionId]);
    
    echo json_encode(['success' => true, 'message' => "Auction extended by {$hours} hours"]);
    exit();
}

// ===== ADMIN DELETE AUCTION =====
if ($request == 'admin_delete_auction') {
    if (!isAdmin()) {
        echo json_encode(['success' => false, 'message' => 'Admin access required']);
        exit();
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    $auctionId = $input['auction_id'] ?? 0;
    
    // First delete bids
    $pdo->prepare("DELETE FROM bids WHERE auction_id = ?")->execute([$auctionId]);
    
    // Then delete auction
    $stmt = $pdo->prepare("DELETE FROM auctions WHERE id = ?");
    $stmt->execute([$auctionId]);
    
    echo json_encode(['success' => true, 'message' => 'Auction deleted successfully']);
    exit();
}

// ============ UPDATE AUCTION ============
// ============ UPDATE AUCTION ============
if ($request == 'update_auction') {
    if (!isLoggedIn() || $_SESSION['user_role'] !== 'artisan') {
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    $auction_id = isset($input['auction_id']) ? (int)$input['auction_id'] : 0;
    $artisan_id = $_SESSION['user_id'];
    $title = trim($input['title'] ?? '');
    $description = trim($input['description'] ?? '');
    $start_bid = isset($input['start_bid']) ? (float)$input['start_bid'] : 0;
    $min_increment = isset($input['min_increment']) ? (float)$input['min_increment'] : 5;
    $end_time = $input['end_time'] ?? '';
    $new_image_url = trim($input['image_url'] ?? '');
    
    // Get old image URL before update
    $stmt = $pdo->prepare("SELECT image_url FROM auctions WHERE id = ? AND artisan_id = ?");
    $stmt->execute([$auction_id, $artisan_id]);
    $old_auction = $stmt->fetch(PDO::FETCH_ASSOC);
    $old_image_url = $old_auction ? $old_auction['image_url'] : null;
    
    // Verify auction belongs to this artisan
    $stmt = $pdo->prepare("SELECT id FROM auctions WHERE id = ? AND artisan_id = ?");
    $stmt->execute([$auction_id, $artisan_id]);
    if (!$stmt->fetch()) {
        echo json_encode(['success' => false, 'message' => 'Auction not found or does not belong to you']);
        exit();
    }
    
    // Check if auction has bids
    $stmt = $pdo->prepare("SELECT COUNT(*) as bid_count FROM bids WHERE auction_id = ?");
    $stmt->execute([$auction_id]);
    $bid_count = $stmt->fetch(PDO::FETCH_ASSOC)['bid_count'];
    
    if ($bid_count > 0 && $start_bid != $old_auction['start_bid']) {
        echo json_encode(['success' => false, 'message' => 'Cannot change starting bid because bids have been placed']);
        exit();
    }
    
    if (empty($title)) {
        echo json_encode(['success' => false, 'message' => 'Auction title is required']);
        exit();
    }
    
    if ($start_bid <= 0) {
        echo json_encode(['success' => false, 'message' => 'Starting bid must be greater than 0']);
        exit();
    }
    
    if (empty($end_time)) {
        echo json_encode(['success' => false, 'message' => 'End date and time is required']);
        exit();
    }
    
    if (empty($new_image_url)) {
        $new_image_url = 'https://placehold.co/600x400/8B5E3C/white?text=' . urlencode($title);
    }
    
    try {
        $stmt = $pdo->prepare("UPDATE auctions 
                               SET title = ?, description = ?, start_bid = ?, min_increment = ?, end_time = ?, image_url = ?
                               WHERE id = ? AND artisan_id = ?");
        $stmt->execute([$title, $description, $start_bid, $min_increment, $end_time, $new_image_url, $auction_id, $artisan_id]);
        
        // Delete old image if it was replaced and not a placeholder
        if ($old_image_url && $old_image_url !== $new_image_url) {
            deleteImageFile($old_image_url);
        }
        
        echo json_encode(['success' => true, 'message' => 'Auction updated successfully']);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Failed to update auction: ' . $e->getMessage()]);
    }
    exit();
}


// ============ DELETE AUCTION ============
if ($request == 'delete_auction') {
    if (!isLoggedIn() || $_SESSION['user_role'] !== 'artisan') {
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    $auction_id = isset($input['auction_id']) ? (int)$input['auction_id'] : 0;
    $artisan_id = $_SESSION['user_id'];
    
    // Get image URL before deleting
    $stmt = $pdo->prepare("SELECT image_url FROM auctions WHERE id = ? AND artisan_id = ?");
    $stmt->execute([$auction_id, $artisan_id]);
    $auction = $stmt->fetch(PDO::FETCH_ASSOC);
    $image_url = $auction ? $auction['image_url'] : null;
    
    // Verify auction belongs to this artisan
    $stmt = $pdo->prepare("SELECT id FROM auctions WHERE id = ? AND artisan_id = ?");
    $stmt->execute([$auction_id, $artisan_id]);
    if (!$stmt->fetch()) {
        echo json_encode(['success' => false, 'message' => 'Auction not found or does not belong to you']);
        exit();
    }
    
    try {
        // First delete bids
        $pdo->prepare("DELETE FROM bids WHERE auction_id = ?")->execute([$auction_id]);
        // Then delete auction
        $stmt = $pdo->prepare("DELETE FROM auctions WHERE id = ?");
        $stmt->execute([$auction_id]);
        
        // Delete image file if exists
        if ($image_url) {
            deleteImageFile($image_url);
        }
        
        echo json_encode(['success' => true, 'message' => 'Auction deleted successfully']);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Failed to delete auction: ' . $e->getMessage()]);
    }
    exit();
}

// ============ GET SINGLE AUCTION FOR EDIT ============
if ($request == 'get_auction_for_edit') {
    if (!isLoggedIn() || $_SESSION['user_role'] !== 'artisan') {
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }
    
    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    $artisan_id = $_SESSION['user_id'];
    
    $stmt = $pdo->prepare("SELECT * FROM auctions WHERE id = ? AND artisan_id = ?");
    $stmt->execute([$id, $artisan_id]);
    $auction = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($auction) {
        // Get bid count
        $stmt = $pdo->prepare("SELECT COUNT(*) as bid_count FROM bids WHERE auction_id = ?");
        $stmt->execute([$id]);
        $auction['bid_count'] = $stmt->fetch(PDO::FETCH_ASSOC)['bid_count'];
        
        echo json_encode(['success' => true, 'auction' => $auction]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Auction not found']);
    }
    exit();
}
// ============ ARTISAN REPORTS ============
if ($request == 'artisan_reports') {
    if (!isLoggedIn() || $_SESSION['user_role'] !== 'artisan') {
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }
    
    $artisan_id = $_SESSION['user_id'];
    $year = isset($_GET['year']) ? (int)$_GET['year'] : date('Y');
    $month = isset($_GET['month']) ? $_GET['month'] : 'all';
    
    // Total sales and orders
    if ($month == 'all') {
        $stmt = $pdo->prepare("
            SELECT COALESCE(SUM(oi.price * oi.quantity), 0) as total_sales, 
                   COUNT(DISTINCT o.id) as total_orders
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            JOIN products p ON oi.product_id = p.id
            WHERE p.artisan_id = ? AND YEAR(o.created_at) = ? AND o.status = 'delivered'
        ");
        $stmt->execute([$artisan_id, $year]);
    } else {
        $stmt = $pdo->prepare("
            SELECT COALESCE(SUM(oi.price * oi.quantity), 0) as total_sales, 
                   COUNT(DISTINCT o.id) as total_orders
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            JOIN products p ON oi.product_id = p.id
            WHERE p.artisan_id = ? AND YEAR(o.created_at) = ? AND MONTH(o.created_at) = ? AND o.status = 'delivered'
        ");
        $stmt->execute([$artisan_id, $year, $month]);
    }
    $totals = $stmt->fetch(PDO::FETCH_ASSOC);
    $total_sales = $totals['total_sales'] ?? 0;
    $total_orders = $totals['total_orders'] ?? 0;
    
    // Monthly breakdown
    $monthly_breakdown = [];
    for ($m = 1; $m <= 12; $m++) {
        $stmt = $pdo->prepare("
            SELECT COALESCE(SUM(oi.price * oi.quantity), 0) as total_sales, 
                   COUNT(DISTINCT o.id) as order_count
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            JOIN products p ON oi.product_id = p.id
            WHERE p.artisan_id = ? AND YEAR(o.created_at) = ? AND MONTH(o.created_at) = ? AND o.status = 'delivered'
        ");
        $stmt->execute([$artisan_id, $year, $m]);
        $data = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $monthly_breakdown[] = [
            'month' => $m,
            'month_name' => date('F', mktime(0, 0, 0, $m, 1)),
            'total_sales' => (float)($data['total_sales'] ?? 0),
            'order_count' => (int)($data['order_count'] ?? 0),
            'avg_order_value' => ($data['order_count'] > 0) ? (float)($data['total_sales'] / $data['order_count']) : 0
        ];
    }
    
    // Best selling products (top 5)
    $stmt = $pdo->prepare("
        SELECT p.id, p.name, 
               COALESCE(SUM(oi.quantity), 0) as quantity_sold,
               COALESCE(SUM(oi.price * oi.quantity), 0) as total_revenue
        FROM products p
        LEFT JOIN order_items oi ON p.id = oi.product_id
        LEFT JOIN orders o ON oi.order_id = o.id AND o.status = 'delivered'
        WHERE p.artisan_id = ?
        GROUP BY p.id
        ORDER BY quantity_sold DESC
        LIMIT 5
    ");
    $stmt->execute([$artisan_id]);
    $best_products = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Best selling product (single for summary card)
    $best_selling_product = !empty($best_products) ? $best_products[0]['name'] : 'N/A';
    
    // Recent orders (last 10)
    $stmt = $pdo->prepare("
        SELECT DISTINCT o.order_number, o.total_amount, o.status, o.created_at, u.fullname as customer_name
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        JOIN products p ON oi.product_id = p.id
        JOIN users u ON o.user_id = u.id
        WHERE p.artisan_id = ?
        ORDER BY o.created_at DESC
        LIMIT 10
    ");
    $stmt->execute([$artisan_id]);
    $recent_orders = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // If no data at all, return friendly empty message
    if ($total_sales == 0 && $total_orders == 0 && empty($best_products) && empty($recent_orders)) {
        echo json_encode([
            'success' => true,
            'total_sales' => 0,
            'total_orders' => 0,
            'best_selling_product' => 'No sales yet',
            'monthly_breakdown' => array_fill(0, 12, ['month_name' => '', 'order_count' => 0, 'total_sales' => 0, 'avg_order_value' => 0]),
            'best_products' => [],
            'recent_orders' => [],
            'message' => 'No sales data available yet. Start selling your products!'
        ]);
        exit();
    }
    
    echo json_encode([
        'success' => true,
        'total_sales' => (float)$total_sales,
        'total_orders' => (int)$total_orders,
        'best_selling_product' => $best_selling_product,
        'monthly_breakdown' => $monthly_breakdown,
        'best_products' => $best_products,
        'recent_orders' => $recent_orders
    ]);
    exit();
}
// ============ DEFAULT ============
echo json_encode(['success' => false, 'message' => 'Unknown request: ' . $request]);
?>