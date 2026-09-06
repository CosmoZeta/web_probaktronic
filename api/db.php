<?php
// api/db.php - Conexión Segura a MySQL en SiteGround
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Configuración Oficial de Base de Datos SiteGround
$db_host = 'localhost';
$db_name = 'dbxmy5adrv8uwv';
$db_user = 'ueggdsruyq5wy';
$db_pass = '0!KG#Ptgh1XSx6d)GJ4wsEtV';

$pdo = null;
$pdo_error = null;

try {
    $pdo = new PDO("mysql:host={$db_host};dbname={$db_name};charset=utf8mb4", $db_user, $db_pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false
    ]);
} catch (PDOException $e) {
    $pdo_error = $e->getMessage();
    $pdo = null;
}
