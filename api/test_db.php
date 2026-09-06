<?php
// api/test_db.php - Diagnostico de Conexion MySQL en SiteGround
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/db.php';

$results = [
    'timestamp' => date('c'),
    'php_version' => phpversion(),
    'pdo_connected' => ($pdo !== null),
    'last_pdo_error' => $pdo_error ?? 'ninguno',
    'database_name' => $db_name ?? '',
    'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? '',
    'wp_config_found' => false
];

$check_paths = [
    __DIR__ . '/../wp-config.php',
    __DIR__ . '/../../wp-config.php',
    dirname(__DIR__) . '/wp-config.php',
    isset($_SERVER['DOCUMENT_ROOT']) ? ($_SERVER['DOCUMENT_ROOT'] . '/wp-config.php') : '',
    isset($_SERVER['DOCUMENT_ROOT']) ? ($_SERVER['DOCUMENT_ROOT'] . '/../wp-config.php') : ''
];

foreach ($check_paths as $p) {
    if ($p && file_exists($p)) {
        $results['wp_config_found'] = true;
        $results['wp_config_path'] = $p;
        break;
    }
}

if ($pdo) {
    try {
        $stmt = $pdo->query("SELECT count(*) as total_usuarios FROM usuarios");
        $row = $stmt->fetch();
        $results['total_usuarios_mysql'] = $row['total_usuarios'] ?? 0;
    } catch (Exception $e) {
        $results['query_error'] = $e->getMessage();
    }
}

echo json_encode($results, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
