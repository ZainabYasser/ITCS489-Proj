<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "Testing PHP errors...<br>";

// Test database connection
try {
    $pdo = new PDO("mysql:host=localhost;dbname=artisan_cooperative;charset=utf8mb4", "root", "");
    echo "✅ Database connection successful<br>";
} catch (PDOException $e) {
    echo "❌ Database error: " . $e->getMessage() . "<br>";
}

// Include and test api.php
echo "<br>Testing api.php include...<br>";
ob_start();
include 'api.php';
$output = ob_get_clean();
echo "API output length: " . strlen($output) . " characters<br>";
echo "First 200 characters: " . htmlspecialchars(substr($output, 0, 200));
?>
