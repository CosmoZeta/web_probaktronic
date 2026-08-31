<?php
// api/diagramas.php - Jerarquía de Marcas, Modelos, Años, Motores y Diagramas
require_once __DIR__ . '/db.php';

$action = isset($_GET['action']) ? $_GET['action'] : 'marcas';
$marca = isset($_GET['marca']) ? trim($_GET['marca']) : '';
$modelo = isset($_GET['modelo']) ? trim($_GET['modelo']) : '';
$motorId = isset($_GET['motor_id']) ? intval($_GET['motor_id']) : 0;

switch ($action) {
    case 'marcas':
        // Listar marcas de vehículos
        $stmt = $pdo->query("SELECT MarcaID, Slug, Nombre, LogoUrl FROM marcas WHERE Categoria = 'vehiculos' AND Activo = 1 ORDER BY Nombre ASC");
        echo json_encode(['status' => 'success', 'data' => $stmt->fetchAll()]);
        break;

    case 'modelos':
        // Listar modelos por marca
        $stmt = $pdo->prepare("SELECT m.ModeloID, m.Slug, m.Nombre, m.ImagenUrl 
                               FROM modelos m 
                               INNER JOIN marcas b ON m.MarcaID = b.MarcaID 
                               WHERE (b.Slug = ? OR b.Nombre = ?) AND m.Activo = 1 
                               ORDER BY m.Nombre ASC");
        $stmt->execute([$marca, $marca]);
        echo json_encode(['status' => 'success', 'data' => $stmt->fetchAll()]);
        break;

    case 'arbol_completo':
        // Obtener toda la jerarquía de un modelo (Años -> Motores -> Diagramas)
        $stmt = $pdo->prepare("SELECT a.AnioID, a.Anio, mot.MotorID, mot.NombreMotor, mot.Cilindrada, mot.TipoCombustible, 
                                      d.ArchivoID, d.Titulo, d.UrlArchivo, d.Tipo, d.Descripcion, d.PinoutDetalle 
                               FROM modelos m 
                               INNER JOIN marcas b ON m.MarcaID = b.MarcaID 
                               LEFT JOIN vehiculo_anios a ON a.ModeloID = m.ModeloID 
                               LEFT JOIN vehiculo_motores mot ON mot.AnioID = a.AnioID 
                               LEFT JOIN diagramas_archivos d ON d.MotorID = mot.MotorID 
                               WHERE (b.Slug = :marca OR b.Nombre = :marca) AND (m.Slug = :modelo OR m.Nombre = :modelo)");
        $stmt->execute([':marca' => $marca, ':modelo' => $modelo]);
        $rows = $stmt->fetchAll();
        echo json_encode(['status' => 'success', 'data' => $rows]);
        break;

    default:
        echo json_encode(['status' => 'error', 'message' => 'Acción no válida.']);
        break;
}
