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
$host = 'localhost';
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
    
    $stmt = $pdo->prepare("SELECT id, fullname, email, password, role FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($user && password_verify($password, $user['password'])) {
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
    
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        echo json_encode(['success' => false, 'message' => 'Email not found']);
        exit();
    }
    
    // Generate reset token
    $token = bin2hex(random_bytes(32));
    $expires = date('Y-m-d H:i:s', strtotime('+1 hour'));
    
    $stmt = $pdo->prepare("UPDATE users SET reset_token = ?, reset_expires = ? WHERE email = ?");
    $stmt->execute([$token, $expires, $email]);
    
    // In a real app, send email here
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
    
    $stmt = $pdo->prepare("SELECT p.*, u.fullname as artisan_name, c.name as category_name 
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
    
    $stmt = $pdo->prepare("SELECT c.id, c.product_id, c.quantity, p.name, p.price, p.image_url 
                           FROM cart c
                           JOIN products p ON c.product_id = p.id
                           WHERE c.user_id = ?");
    $stmt->execute([$_SESSION['user_id']]);
    $cart = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
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
    
    $stmt = $pdo->prepare("SELECT c.product_id, c.quantity, p.name, p.price 
                           FROM cart c
                           JOIN products p ON c.product_id = p.id
                           WHERE c.user_id = ?");
    $stmt->execute([$_SESSION['user_id']]);
    $cartItems = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($cartItems)) {
        echo json_encode(['success' => false, 'message' => 'Cart is empty']);
        exit();
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
            $stmt = $pdo->prepare("INSERT INTO order_items (order_id, product_id, product_name, quantity, price) 
                                   VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$orderId, $item['product_id'], $item['name'], $item['quantity'], $item['price']]);
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

if ($request == 'get_orders') {
    if (!isLoggedIn()) {
        echo json_encode(['success' => false, 'message' => 'Please login']);
        exit();
    }
    
    $stmt = $pdo->prepare("SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC");
    $stmt->execute([$_SESSION['user_id']]);
    $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['success' => true, 'orders' => $orders]);
    exit();
}

if ($request == 'get_order') {
    if (!isLoggedIn()) {
        echo json_encode(['success' => false, 'message' => 'Please login']);
        exit();
    }
    
    $orderNumber = $_GET['order_number'] ?? '';
    
    $stmt = $pdo->prepare("SELECT * FROM orders WHERE order_number = ? AND user_id = ?");
    $stmt->execute([$orderNumber, $_SESSION['user_id']]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($order) {
        $stmt = $pdo->prepare("SELECT * FROM order_items WHERE order_id = ?");
        $stmt->execute([$order['id']]);
        $order['items'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    echo json_encode(['success' => true, 'order' => $order]);
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
    $stmt = $pdo->prepare("SELECT a.*, p.name, p.image_url, u.fullname as artisan_name,
                          (SELECT COUNT(*) FROM bids WHERE auction_id = a.id) as bid_count
                          FROM auctions a
                          JOIN products p ON a.product_id = p.id
                          JOIN users u ON p.artisan_id = u.id
                          WHERE a.is_active = 1 AND a.end_time > NOW()
                          ORDER BY a.end_time ASC");
    $stmt->execute();
    $auctions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['success' => true, 'auctions' => $auctions]);
    exit();
}

// Get single auction by ID
if ($request == 'get_auction') {
    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    
    $stmt = $pdo->prepare("SELECT a.*, p.name, p.description, p.image_url, u.fullname as artisan_name
                           FROM auctions a
                           JOIN products p ON a.product_id = p.id
                           JOIN users u ON p.artisan_id = u.id
                           WHERE a.id = ?");
    $stmt->execute([$id]);
    $auction = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($auction) {
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
        
        // Update auction current bid
        $stmt = $pdo->prepare("UPDATE auctions SET current_bid = ?, current_bidder_id = ? WHERE id = ?");
        $stmt->execute([$bidAmount, $userId, $auctionId]);
        
        $pdo->commit();
        
        echo json_encode(['success' => true, 'current_bid' => $bidAmount, 'message' => 'Bid placed successfully']);
    } catch (Exception $e) {
        $pdo->rollBack();
        echo json_encode(['success' => false, 'message' => 'Failed to place bid: ' . $e->getMessage()]);
    }
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

// Create auction (for artisans)
if ($request == 'create_auction') {
    if (!isLoggedIn() || $_SESSION['user_role'] !== 'artisan') {
        echo json_encode(['success' => false, 'message' => 'Only artisans can create auctions']);
        exit();
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    $productId = $input['product_id'] ?? 0;
    $startBid = $input['start_bid'] ?? 0;
    $endTime = $input['end_time'] ?? '';
    $minIncrement = $input['min_increment'] ?? 5;
    
    if (!$productId || $startBid <= 0 || empty($endTime)) {
        echo json_encode(['success' => false, 'message' => 'Product ID, starting bid, and end time are required']);
        exit();
    }
    
    // Verify product belongs to this artisan
    $stmt = $pdo->prepare("SELECT id FROM products WHERE id = ? AND artisan_id = ?");
    $stmt->execute([$productId, $_SESSION['user_id']]);
    if (!$stmt->fetch()) {
        echo json_encode(['success' => false, 'message' => 'Product not found or does not belong to you']);
        exit();
    }
    
    try {
        $stmt = $pdo->prepare("INSERT INTO auctions (product_id, start_bid, current_bid, min_increment, start_time, end_time) 
                               VALUES (?, ?, ?, ?, NOW(), ?)");
        $stmt->execute([$productId, $startBid, $startBid, $minIncrement, $endTime]);
        
        echo json_encode(['success' => true, 'message' => 'Auction created successfully']);
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
    
    $stmt = $pdo->prepare("SELECT a.*, p.name as product_name 
                           FROM auctions a
                           JOIN products p ON a.product_id = p.id
                           WHERE p.artisan_id = ?
                           ORDER BY a.created_at DESC");
    $stmt->execute([$_SESSION['user_id']]);
    $auctions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['success' => true, 'auctions' => $auctions]);
    exit();
}



// ============ DEFAULT ============
echo json_encode(['success' => false, 'message' => 'Unknown request: ' . $request]);
?>