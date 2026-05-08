<?php
echo "<h1>📊 Database Connection Test</h1>";

// Direct database connection (no functions needed)
$host = 'localhost';
$dbname = 'artisan_cooperative';
$username = 'root';
$password = '';

try {
    // Connect directly to database
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "<p style='color:green; font-weight:bold;'>✅ Database connection successful!</p>";
    
    // Test 1: Count users
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM users");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "<p>📋 Total users: <strong>" . $result['count'] . "</strong></p>";
    
    // Test 2: Show all users
    $stmt = $pdo->query("SELECT id, fullname, email, role FROM users");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<h3>👤 Users in Database:</h3>";
    if (count($users) > 0) {
        echo "<table border='1' cellpadding='8' style='border-collapse: collapse;'>";
        echo "<tr style='background:#f5f0eb;'><th>ID</th><th>Name</th><th>Email</th><th>Role</th>tr";
        foreach ($users as $user) {
            echo "<tr>";
            echo "<td>" . $user['id'] . "</td>";
            echo "<td>" . htmlspecialchars($user['fullname']) . "</td>";
            echo "<td>" . htmlspecialchars($user['email']) . "</td>";
            echo "<td>" . $user['role'] . "</td>";
            echo "</tr>";
        }
        echo "</table>";
    } else {
        echo "<p>No users found</p>";
    }
    
    // Test 3: Show categories
    $stmt = $pdo->query("SELECT * FROM categories");
    $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<h3>📂 Categories:</h3>";
    if (count($categories) > 0) {
        echo "<ul>";
        foreach ($categories as $cat) {
            echo "<li><strong>" . htmlspecialchars($cat['name']) . "</strong></li>";
        }
        echo "</ul>";
    } else {
        echo "<p>No categories found</p>";
    }
    
    // Test 4: Show products count
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM products");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "<p>🛍️ Total products: <strong>" . $result['count'] . "</strong></p>";
    
    echo "<hr>";
    echo "<p style='color:green;'>🎉 Database is working perfectly!</p>";
    
} catch (PDOException $e) {
    echo "<p style='color:red; font-weight:bold;'>❌ Database Error: " . $e->getMessage() . "</p>";
    echo "<p>Make sure:</p>";
    echo "<ul>";
    echo "<li>MySQL is running in XAMPP (green check)</li>";
    echo "<li>The database 'artisan_cooperative' exists</li>";
    echo "<li>Username is 'root' and password is empty</li>";
    echo "</ul>";
}
?>