<?php
// Simple Speed Performance Test
// File: test_api_simple.php
// Displays API speed performance directly in browser

// Start timing
$start_time = microtime(true);

// Simulate API/database processing (50ms delay)
usleep(50000); // Change this to 200000 for slower test, 1000000 for very slow

// End timing
$end_time = microtime(true);
$execution_time = ($end_time - $start_time) * 1000; // Convert to milliseconds

// Determine performance rating
if ($execution_time < 100) {
    $rating = "Excellent";
    $rating_class = "excellent";
    $icon = "✅";
    $message = "Response time is under 100ms - Very Fast!";
} elseif ($execution_time < 300) {
    $rating = "Good";
    $rating_class = "good";
    $icon = "⚠️";
    $message = "Response time is under 300ms - Acceptable";
} else {
    $rating = "Slow";
    $rating_class = "slow";
    $icon = "❌";
    $message = "Response time exceeds 300ms - Needs Optimization";
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Speed Performance Test - ArtisanCo API</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        
        .container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            text-align: center;
            max-width: 500px;
            width: 100%;
        }
        
        h1 {
            color: #333;
            margin-bottom: 10px;
            font-size: 28px;
        }
        
        .subtitle {
            color: #666;
            margin-bottom: 30px;
            font-size: 14px;
        }
        
        .speed-box {
            background: #f8f9fa;
            border-radius: 16px;
            padding: 30px;
            margin: 20px 0;
        }
        
        .speed-label {
            font-size: 14px;
            color: #888;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        
        .speed-value {
            font-size: 64px;
            font-weight: bold;
            margin: 10px 0;
        }
        
        .speed-unit {
            font-size: 20px;
            font-weight: normal;
        }
        
        .excellent {
            color: #28a745;
        }
        
        .good {
            color: #ffc107;
        }
        
        .slow {
            color: #dc3545;
        }
        
        .rating-badge {
            display: inline-block;
            padding: 8px 20px;
            border-radius: 30px;
            font-weight: bold;
            margin: 15px 0;
            font-size: 18px;
        }
        
        .rating-excellent {
            background: #d4edda;
            color: #155724;
        }
        
        .rating-good {
            background: #fff3cd;
            color: #856404;
        }
        
        .rating-slow {
            background: #f8d7da;
            color: #721c24;
        }
        
        .message {
            color: #666;
            margin: 15px 0;
            font-size: 14px;
        }
        
        button {
            background: #667eea;
            color: white;
            border: none;
            padding: 12px 30px;
            border-radius: 30px;
            font-size: 16px;
            cursor: pointer;
            margin-top: 20px;
            transition: transform 0.2s;
        }
        
        button:hover {
            background: #5a67d8;
            transform: scale(1.02);
        }
        
        .timestamp {
            margin-top: 25px;
            font-size: 11px;
            color: #aaa;
            border-top: 1px solid #eee;
            padding-top: 20px;
        }
        
        .info {
            background: #e7f3ff;
            padding: 12px;
            border-radius: 8px;
            margin-top: 20px;
            font-size: 12px;
            color: #0066cc;
        }
        
        .info i {
            font-style: normal;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>⚡ Speed Performance Test</h1>
        <div class="subtitle">Local Artisan Platform - API Response Time</div>
        
        <div class="speed-box">
            <div class="speed-label">API RESPONSE TIME</div>
            <div class="speed-value <?php echo $rating_class; ?>">
                <?php echo number_format($execution_time, 2); ?>
                <span class="speed-unit">ms</span>
            </div>
            
            <div class="rating-badge rating-<?php echo $rating_class; ?>">
                <?php echo $icon . " " . $rating; ?>
            </div>
            
            <div class="message">
                <?php echo $message; ?>
            </div>
        </div>
        
        <button onclick="location.reload()">🔄 Run Test Again</button>
        
        <div class="info">
            📊 <strong>Performance Guide:</strong><br>
            • < 100 ms: Excellent ✅<br>
            • 100 - 300 ms: Good ⚠️<br>
            • > 300 ms: Slow ❌
        </div>
        
        <div class="timestamp">
            Test completed: <?php echo date('Y-m-d h:i:s A'); ?>
        </div>
    </div>
</body>
</html>