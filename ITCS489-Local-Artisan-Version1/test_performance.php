<?php
// =============================================
// SPEED PERFORMANCE TEST - ArtisanCo
// =============================================

// Start timing
$start_time = microtime(true);

// Simulate API/database processing (adjust for testing)
usleep(50000); // 50ms delay - change to 200000 for slower test

// End timing
$end_time = microtime(true);
$execution_time = ($end_time - $start_time) * 1000; // Convert to milliseconds

// Determine performance rating
if ($execution_time < 100) {
    $rating = "Excellent";
    $rating_class = "excellent";
    $icon = "fa-check-circle";
    $message = "Response time is under 100ms - Very Fast!";
} elseif ($execution_time < 300) {
    $rating = "Good";
    $rating_class = "good";
    $icon = "fa-exclamation-triangle";
    $message = "Response time is under 300ms - Acceptable";
} else {
    $rating = "Slow";
    $rating_class = "slow";
    $icon = "fa-times-circle";
    $message = "Response time exceeds 300ms - Needs Optimization";
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Performance Test - ArtisanCo</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', sans-serif;
            background: linear-gradient(135deg, #f7f9fc 0%, #e7edf2 100%);
            min-height: 100vh;
            padding: 40px 20px;
        }
        
        .container {
            max-width: 600px;
            margin: 0 auto;
        }
        
        /* Header */
        .header {
            background: white;
            border-radius: 20px;
            padding: 25px 30px;
            margin-bottom: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.08);
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 15px;
        }
        
        .logo h2 {
            font-size: 28px;
            color: #1a2a3a;
        }
        
        .logo span {
            color: #1a4b72;
        }
        
        .back-btn {
            background: #1a4b72;
            color: white;
            border: none;
            padding: 10px 24px;
            border-radius: 30px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            transition: all 0.3s ease;
        }
        
        .back-btn:hover {
            background: #1e3a5f;
            transform: translateY(-2px);
        }
        
        /* Main Card */
        .card {
            background: white;
            border-radius: 24px;
            padding: 40px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.08);
            text-align: center;
        }
        
        .card h1 {
            font-size: 28px;
            color: #1a2a3a;
            margin-bottom: 8px;
        }
        
        .subtitle {
            color: #7a8a9a;
            font-size: 14px;
            margin-bottom: 30px;
        }
        
        /* Speed Box */
        .speed-box {
            background: #f8fafc;
            border-radius: 20px;
            padding: 35px;
            margin: 20px 0;
            border: 1px solid #e2e8f0;
        }
        
        .speed-label {
            font-size: 12px;
            color: #7a8a9a;
            text-transform: uppercase;
            letter-spacing: 2px;
            font-weight: 600;
        }
        
        .speed-value {
            font-size: 72px;
            font-weight: 700;
            margin: 15px 0;
            line-height: 1;
        }
        
        .speed-unit {
            font-size: 20px;
            font-weight: 500;
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
        
        /* Rating Badge */
        .rating-badge {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            padding: 10px 24px;
            border-radius: 40px;
            font-weight: 600;
            font-size: 16px;
            margin: 15px 0;
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
            color: #5a6a7a;
            font-size: 14px;
            margin-top: 15px;
        }
        
        /* Buttons */
        .test-btn {
            background: #1a4b72;
            color: white;
            border: none;
            padding: 14px 32px;
            border-radius: 40px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            display: inline-flex;
            align-items: center;
            gap: 10px;
            margin-top: 10px;
        }
        
        .test-btn:hover {
            background: #1e3a5f;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(26, 75, 114, 0.3);
        }
        
        /* Info Box */
        .info-box {
            background: #e7edf2;
            border-radius: 16px;
            padding: 20px;
            margin-top: 30px;
            text-align: left;
        }
        
        .info-box h4 {
            color: #1a4b72;
            margin-bottom: 12px;
            font-size: 14px;
            font-weight: 600;
        }
        
        .info-box p {
            color: #5a6a7a;
            font-size: 12px;
            line-height: 1.6;
            margin-bottom: 8px;
        }
        
        .info-box i {
            width: 20px;
            color: #1a4b72;
            margin-right: 8px;
        }
        
        /* Footer */
        .footer {
            text-align: center;
            margin-top: 30px;
            color: #7a8a9a;
            font-size: 12px;
        }
        
        .timestamp {
            background: #f8fafc;
            padding: 12px 20px;
            border-radius: 30px;
            display: inline-block;
            font-size: 11px;
            color: #7a8a9a;
        }
        
        @media (max-width: 600px) {
            .card {
                padding: 25px;
            }
            
            .speed-value {
                font-size: 52px;
            }
            
            .header {
                flex-direction: column;
                text-align: center;
            }
        }
    </style>
</head>
<body>

<div class="container">
    <!-- Header -->
    <div class="header">
        <div class="logo">
            <h2>Artisan<span>Co</span></h2>
        </div>
        <a href="ADMIN/admin-dashboard.html" class="back-btn">
            <i class="fas fa-arrow-left"></i> Back to Dashboard
        </a>
    </div>
    
    <!-- Main Card -->
    <div class="card">
        <h1><i class="fas fa-tachometer-alt" style="color: #1a4b72; margin-right: 10px;"></i> Performance Test</h1>
        <p class="subtitle">API Response Time Measurement</p>
        
        <div class="speed-box">
            <div class="speed-label">RESPONSE TIME</div>
            <div class="speed-value <?php echo $rating_class; ?>">
                <?php echo number_format($execution_time, 2); ?>
                <span class="speed-unit">ms</span>
            </div>
            
            <div class="rating-badge rating-<?php echo $rating_class; ?>">
                <i class="fas <?php echo $icon; ?>"></i>
                <span><?php echo $rating; ?></span>
            </div>
            
            <div class="message">
                <i class="fas fa-info-circle"></i> <?php echo $message; ?>
            </div>
        </div>
        
        <button class="test-btn" onclick="location.reload()">
            <i class="fas fa-sync-alt"></i> Run Test Again
        </button>
        
        <div class="info-box">
            <h4><i class="fas fa-chart-line"></i> Performance Guide</h4>
            <p><i class="fas fa-check-circle" style="color: #28a745;"></i> <strong>Excellent (&lt; 100ms)</strong> - Very fast response time</p>
            <p><i class="fas fa-exclamation-triangle" style="color: #ffc107;"></i> <strong>Good (100-300ms)</strong> - Acceptable response time</p>
            <p><i class="fas fa-times-circle" style="color: #dc3545;"></i> <strong>Slow (&gt; 300ms)</strong> - Needs optimization</p>
        </div>
        
        <div class="footer">
            <div class="timestamp">
                <i class="far fa-clock"></i> Test completed: <?php echo date('Y-m-d h:i:s A'); ?>
            </div>
        </div>
    </div>
</div>

</body>
</html>