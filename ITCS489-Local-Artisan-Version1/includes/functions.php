<?php
require_once __DIR__ . '/db.php';

// =============================================
// AUTHENTICATION FUNCTIONS
// =============================================

function registerUser($fullname, $email, $password, $role = 'customer') {
    $db = db();
    
    // Check if email exists
    $existing = $db->fetch("SELECT id FROM users WHERE email = ?", [$email]);
    if ($existing) {
        return ['success' => false, 'message' => 'Email already registered'];
    }
    
    // Validate
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return ['success' => false, 'message' => 'Invalid email format'];
    }
    
    if (strlen($password) < 6) {
        return ['success' => false, 'message' => 'Password must be at least 6 characters'];
    }
    
    // Hash password
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    
    try {
        $userId = $db->insert('users', [
            'fullname' => $fullname,
            'email' => $email,
            'password' => $hashedPassword,
            'role' => $role
        ]);
        
        return ['success' => true, 'user_id' => $userId, 'message' => 'Registration successful'];
    } catch (Exception $e) {
        return ['success' => false, 'message' => 'Registration failed: ' . $e->getMessage()];
    }
}

function loginUser($email, $password) {
    $db = db();
    
    $user = $db->fetch("SELECT * FROM users WHERE email = ?", [$email]);
    
    if (!$user) {
        return ['success' => false, 'message' => 'Invalid email or password'];
    }
    
    if (!password_verify($password, $user['password'])) {
        return ['success' => false, 'message' => 'Invalid email or password'];
    }
    
    if (!$user['is_active']) {
        return ['success' => false, 'message' => 'Account is deactivated'];
    }
    
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['user_name'] = $user['fullname'];
    $_SESSION['user_email'] = $user['email'];
    $_SESSION['user_role'] = $user['role'];
    
    return [
        'success' => true,
        'user' => [
            'id' => $user['id'],
            'fullname' => $user['fullname'],
            'email' => $user['email'],
            'role' => $user['role']
        ],
        'message' => 'Login successful'
    ];
}

function logoutUser() {
    $_SESSION = [];
    session_destroy();
    return ['success' => true, 'message' => 'Logged out successfully'];
}

function isLoggedIn() {
    return isset($_SESSION['user_id']);
}

function getCurrentUser() {
    if (!isLoggedIn()) return null;
    
    $db = db();
    return $db->fetch("SELECT id, fullname, email, role FROM users WHERE id = ?", [$_SESSION['user_id']]);
}

function sendJSON($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit();
}

function requireAuth() {
    if (!isLoggedIn()) {
        sendJSON(['success' => false, 'message' => 'Authentication required'], 401);
    }
}
?>