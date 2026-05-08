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

// ============ CHECK AUTH ============
if ($request == 'check_auth') {
    $loggedIn = isset($_SESSION['user_id']);
    echo json_encode(['success' => $loggedIn, 'user' => $loggedIn ? ['id' => $_SESSION['user_id']] : null]);
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

// ============ DEFAULT ============
echo json_encode(['success' => false, 'message' => 'Unknown request: ' . $request]);
?>