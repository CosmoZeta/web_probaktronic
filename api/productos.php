<?php
// api/productos.php - Gestión de Catálogo y Repuestos
require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Buscar o listar productos
        $search = isset($_GET['q']) ? trim($_GET['q']) : '';
        $categoria = isset($_GET['categoria']) ? trim($_GET['categoria']) : '';

        $sql = "SELECT ProductoID, Codigo, Nombre, Descripcion, Precio, ImagenUrl, RutaLocal, Stock, Categoria, Activo FROM productos WHERE Activo = 1";
        $params = [];

        if ($search !== '') {
            $sql .= " AND (Codigo LIKE :search OR Nombre LIKE :search OR Descripcion LIKE :search)";
            $params[':search'] = "%{$search}%";
        }

        if ($categoria !== '') {
            $sql .= " AND Categoria = :cat";
            $params[':cat'] = $categoria;
        }

        $sql .= " ORDER BY ProductoID ASC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $productos = $stmt->fetchAll();

        echo json_encode([
            'status' => 'success',
            'total' => count($productos),
            'data' => $productos
        ]);
        break;

    case 'POST':
        // Agregar nuevo producto
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input) $input = $_POST;

        $codigo = trim($input['codigo'] ?? '');
        $nombre = trim($input['nombre'] ?? '');
        $descripcion = trim($input['descripcion'] ?? '');
        $precio = floatval($input['precio'] ?? 0);
        $imagenUrl = trim($input['imagen_url'] ?? '');
        $rutaLocal = trim($input['ruta_local'] ?? '');
        $stock = intval($input['stock'] ?? 0);
        $categoria = trim($input['categoria'] ?? 'Componentes');

        if ($codigo === '' || $nombre === '') {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Código y Nombre son obligatorios.']);
            exit();
        }

        $stmt = $pdo->prepare("INSERT INTO productos (Codigo, Nombre, Descripcion, Precio, ImagenUrl, RutaLocal, Stock, Categoria) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$codigo, $nombre, $descripcion, $precio, $imagenUrl, $rutaLocal, $stock, $categoria]);

        echo json_encode([
            'status' => 'success',
            'message' => 'Producto agregado exitosamente.',
            'producto_id' => $pdo->lastInsertId()
        ]);
        break;

    case 'DELETE':
        // Eliminar producto
        $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
        if ($id <= 0) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'ID inválido.']);
            exit();
        }

        $stmt = $pdo->prepare("DELETE FROM productos WHERE ProductoID = ?");
        $stmt->execute([$id]);

        echo json_encode(['status' => 'success', 'message' => 'Producto eliminado correctamente.']);
        break;

    default:
        http_response_code(405);
        echo json_encode(['status' => 'error', 'message' => 'Método no permitido.']);
        break;
}
