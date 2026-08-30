<?php
// api/upload.php - Receptor de Subida de Archivos a archivos_almacenamiento/
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Método no permitido.']);
    exit();
}

if (!isset($_FILES['archivo']) || $_FILES['archivo']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'No se recibió ningún archivo o hubo un error al transferir.']);
    exit();
}

$categoria = isset($_POST['categoria']) ? trim($_POST['categoria']) : 'general';
$categoriaLimpia = preg_replace('/[^a-zA-Z0-9_-]/', '', $categoria);
if ($categoriaLimpia === '') $categoriaLimpia = 'general';

$directorioDestino = dirname(__DIR__) . '/archivos_almacenamiento/' . $categoriaLimpia;
if (!is_dir($directorioDestino)) {
    mkdir($directorioDestino, 0755, true);
}

$archivo = $_FILES['archivo'];
$extension = strtolower(pathinfo($archivo['name'], PATHINFO_EXTENSION));
$permitidos = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'pdf', 'rar', 'zip', 'bin'];

if (!in_array($extension, $permitidos)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Formato de archivo no permitido.']);
    exit();
}

// Nombre de archivo limpio y único
$nombreOriginal = pathinfo($archivo['name'], PATHINFO_FILENAME);
$nombreLimpio = preg_replace('/[^a-zA-Z0-9_-]/', '_', $nombreOriginal);
$nombreFinal = time() . '_' . $nombreLimpio . '.' . $extension;
$rutaFisica = $directorioDestino . '/' . $nombreFinal;
$rutaWeb = 'archivos_almacenamiento/' . $categoriaLimpia . '/' . $nombreFinal;

if (move_uploaded_file($archivo['tmp_name'], $rutaFisica)) {
    echo json_encode([
        'status' => 'success',
        'message' => 'Archivo subido exitosamente a tu hosting.',
        'ruta_local' => $rutaWeb,
        'url_completa' => 'https://' . $_SERVER['HTTP_HOST'] . '/' . $rutaWeb,
        'nombre_archivo' => $nombreFinal,
        'bytes' => $archivo['size']
    ]);
} else {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Error al mover el archivo al disco del servidor.']);
}
