<?php
define('DB_HOST', 'localhost:3307');
define('DB_NAME', 'artisan_cooperative');
define('DB_USER', 'root');
define('DB_PASS', '');

define('SITE_URL', 'http://localhost:8081/ITCS489-Local-Artisan-Version1/');
define('SITE_NAME', 'ArtisanCo');

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

error_reporting(E_ALL);
ini_set('display_errors', 1);
?>