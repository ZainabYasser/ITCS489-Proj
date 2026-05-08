<?php
echo "<h1>Simple Database Test</h1>";

// Direct connection - no functions
$host = 'localhost';
$dbname = 'artisan_cooperative';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "<p style='color:green;'>✅ Connected successfully to database: <strong>" . $dbname . "</strong></p>";
    
    // Get table list
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo "<h3>📋 Tables in database:</h3>";
    echo "<ul>";
    foreach ($tables as $table) {
        echo "<li>" . $table . "</li>";
    }
    echo "</ul>";
    
    // Count users
    $stmt = $pdo->query("SELECT COUNT(*) FROM users");
    $userCount = $stmt->fetchColumn();
    echo "<p>👤 Total users: <strong>" . $userCount . "</strong></p>";
    
} catch (PDOException $e) {
    echo "<p style='color:red;'>❌ Error: " . $e->getMessage() . "</p>";
}
?>