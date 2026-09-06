<?php
// api/recuperacion.php - Gestión Centralizada de Archivos de Recuperación de Tableros
require_once __DIR__ . '/db.php';

function getModificationsFile() {
    return __DIR__ . '/../data/recuperacion_modificaciones.json';
}

function loadModifications() {
    $file = getModificationsFile();
    if (file_exists($file)) {
        $content = @file_get_contents($file);
        $data = json_decode($content, true);
        if (is_array($data)) return $data;
    }
    return ['hidden_items' => [], 'hidden_brands' => []];
}

function saveModifications($data) {
    $file = getModificationsFile();
    $dir = dirname($file);
    if (!is_dir($dir)) {
        @mkdir($dir, 0777, true);
    }
    @file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

$action = isset($_GET['action']) ? $_GET['action'] : (isset($_POST['action']) ? $_POST['action'] : 'listar');
$input = json_decode(file_get_contents('php://input'), true);
if (!$input) $input = $_POST;

switch ($action) {
    case 'modificaciones':
    case 'listar_modificaciones':
        echo json_encode([
            'status' => 'success',
            'data' => loadModifications()
        ]);
        break;

    case 'eliminar_archivo':
        $itemId = trim($input['id'] ?? '');
        if ($itemId === '') {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'ID de archivo no especificado.']);
            exit();
        }

        $mods = loadModifications();
        if (!in_array($itemId, $mods['hidden_items'], true)) {
            $mods['hidden_items'][] = $itemId;
            saveModifications($mods);
        }

        if ($pdo) {
            try {
                $stmt = $pdo->prepare("DELETE FROM recuperacion_tableros WHERE CustomID = ? OR TableroID = ?");
                $stmt->execute([$itemId, $itemId]);
            } catch (Exception $e) {}
        }

        echo json_encode([
            'status' => 'success',
            'message' => 'Archivo de respaldo eliminado con éxito en el servidor.',
            'id' => $itemId
        ]);
        break;

    case 'eliminar_marca':
        $brand = strtoupper(trim($input['brand'] ?? ''));
        if ($brand === '' || $brand === 'ALL') {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Marca no válida.']);
            exit();
        }

        $mods = loadModifications();
        if (!in_array($brand, $mods['hidden_brands'], true)) {
            $mods['hidden_brands'][] = $brand;
            saveModifications($mods);
        }

        if ($pdo) {
            try {
                $stmt = $pdo->prepare("DELETE FROM recuperacion_tableros WHERE UPPER(Brand) = ?");
                $stmt->execute([$brand]);
            } catch (Exception $e) {}
        }

        echo json_encode([
            'status' => 'success',
            'message' => "Tarjeta de marca {$brand} eliminada con éxito.",
            'brand' => $brand
        ]);
        break;

    case 'restaurar_todo':
        saveModifications(['hidden_items' => [], 'hidden_brands' => []]);
        echo json_encode([
            'status' => 'success',
            'message' => 'Todos los respaldos y marcas han sido restaurados.'
        ]);
        break;

    default:
        $search = isset($_GET['q']) ? trim($_GET['q']) : '';
        $brand = isset($_GET['brand']) ? trim($_GET['brand']) : '';
        $chip = isset($_GET['chip']) ? trim($_GET['chip']) : '';

        $mods = loadModifications();

        if ($pdo) {
            try {
                $sql = "SELECT TableroID, CustomID, Brand, Model, Chip, Years, FileName, FilePath, FileSize, Bytes, Ext FROM recuperacion_tableros WHERE 1=1";
                $params = [];

                if ($search !== '') {
                    $sql .= " AND (Brand LIKE :q OR Model LIKE :q OR Chip LIKE :q OR FileName LIKE :q)";
                    $params[':q'] = "%{$search}%";
                }

                if ($brand !== '') {
                    $sql .= " AND UPPER(Brand) = :brand";
                    $params[':brand'] = strtoupper($brand);
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
                    'data' => $tableros,
                    'modificaciones' => $mods
                ]);
                exit();
            } catch (Exception $e) {}
        }

        echo json_encode([
            'status' => 'success',
            'modificaciones' => $mods
        ]);
        break;
}
