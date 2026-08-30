<?php
// api/bobinas.php - Marcas y Esquemas de Bobinas
require_once __DIR__ . '/db.php';

$marca = isset($_GET['marca']) ? trim($_GET['marca']) : '';

if ($marca === '') {
    // Listar marcas con bobinas
    $stmt = $pdo->query("SELECT m.MarcaID, m.Slug, m.Nombre, m.LogoUrl, COUNT(b.BobinaID) AS TotalModelos 
                         FROM marcas m 
                         INNER JOIN bobinas b ON b.MarcaID = m.MarcaID 
                         GROUP BY m.MarcaID, m.Slug, m.Nombre, m.LogoUrl 
                         ORDER BY m.Nombre ASC");
    $marcas = $stmt->fetchAll();
    echo json_encode(['status' => 'success', 'data' => $marcas]);
} else {
    // Listar modelos y esquemas de una marca
    $stmt = $pdo->prepare("SELECT b.BobinaID, b.Codigo, b.TipoBobina, b.ImagenUrl, b.Pinout, b.SenalOsciloscopio, b.Descripcion, m.Nombre AS MarcaNombre, m.Slug AS MarcaSlug 
                           FROM bobinas b 
                           INNER JOIN marcas m ON b.MarcaID = m.MarcaID 
                           WHERE m.Slug = ? OR m.Nombre = ? 
                           ORDER BY b.Codigo ASC");
    $stmt->execute([$marca, $marca]);
    $modelos = $stmt->fetchAll();
    echo json_encode(['status' => 'success', 'marca' => $marca, 'data' => $modelos]);
}
