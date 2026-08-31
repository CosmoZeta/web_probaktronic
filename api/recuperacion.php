<?php
// api/recuperacion.php - Búsqueda y Entrega de Archivos de Tableros
require_once __DIR__ . '/db.php';

$search = isset($_GET['q']) ? trim($_GET['q']) : '';
$brand = isset($_GET['brand']) ? trim($_GET['brand']) : '';
$chip = isset($_GET['chip']) ? trim($_GET['chip']) : '';

$sql = "SELECT TableroID, CustomID, Brand, Model, Chip, Years, FileName, FilePath, FileSize, Bytes, Ext FROM recuperacion_tableros WHERE 1=1";
$params = [];

if ($search !== '') {
    $sql .= " AND (Brand LIKE :q OR Model LIKE :q OR Chip LIKE :q OR FileName LIKE :q)";
    $params[':q'] = "%{$search}%";
}

if ($brand !== '') {
    $sql .= " AND Brand = :brand";
    $params[':brand'] = $brand;
}

if ($chip !== '') {
    $sql .= " AND Chip LIKE :chip";
    $params[':chip'] = "%{$chip}%";
}

$sql .= " ORDER BY Brand ASC, Model ASC";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$tableros = $stmt->fetchAll();

echo json_encode([
    'status' => 'success',
    'total' => count($tableros),
    'data' => $tableros
]);
