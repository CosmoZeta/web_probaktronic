<?php
// api/db.php - Conexión Segura a MySQL en SiteGround
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Configuración de Base de Datos SiteGround
$db_host = 'localhost';
$db_name = 'dbxmy5adrv8uwv'; // Tu base de datos en SiteGround
$db_user = 'u2499_probak';    // Reemplazar por tu usuario MySQL si es diferente
$db_pass = '0!KG#Ptgh1XSx6d)GJ4wsEtV';

$pdo = null;

try {
    $pdo = new PDO("mysql:host={$db_host};dbname={$db_name};charset=utf8mb4", $db_user, $db_pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false
    ]);
} catch (PDOException $e) {
    // Si falla la conexión a MySQL por credenciales en configuración, se permite fallback transparente
    $pdo = null;
}
