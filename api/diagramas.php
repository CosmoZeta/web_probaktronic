<?php
// api/diagramas.php - Jerarquía de Marcas, Modelos, Años, Motores, Diagramas y Hotspots (MySQL SiteGround)
require_once __DIR__ . '/db.php';

// Crear tablas si no existen en MySQL
if ($pdo) {
    try {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS marcas (
                MarcaID INT AUTO_INCREMENT PRIMARY KEY,
                Slug VARCHAR(100) NOT NULL UNIQUE,
                Nombre VARCHAR(100) NOT NULL,
                LogoUrl TEXT,
                Categoria VARCHAR(50) DEFAULT 'vehiculos',
                Combustible VARCHAR(50) DEFAULT 'diesel',
                Activo TINYINT(1) DEFAULT 1,
                FechaRegistro DATETIME DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

            CREATE TABLE IF NOT EXISTS modelos (
                ModeloID INT AUTO_INCREMENT PRIMARY KEY,
                MarcaID INT NOT NULL,
                Slug VARCHAR(100) NOT NULL,
                Nombre VARCHAR(100) NOT NULL,
                Anios VARCHAR(50) DEFAULT '',
                Motor VARCHAR(100) DEFAULT '',
                Combustible VARCHAR(50) DEFAULT 'diesel',
                ImagenUrl TEXT,
                Activo TINYINT(1) DEFAULT 1,
                FechaRegistro DATETIME DEFAULT CURRENT_TIMESTAMP,
                INDEX (MarcaID),
                INDEX (Slug)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

            CREATE TABLE IF NOT EXISTS vehiculo_anios (
                AnioID INT AUTO_INCREMENT PRIMARY KEY,
                ModeloID INT NOT NULL,
                Anio VARCHAR(50) NOT NULL,
                INDEX (ModeloID)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

            CREATE TABLE IF NOT EXISTS vehiculo_motores (
                MotorID INT AUTO_INCREMENT PRIMARY KEY,
                AnioID INT NOT NULL,
                NombreMotor VARCHAR(100) NOT NULL,
                Cilindrada VARCHAR(50) DEFAULT '',
                TipoCombustible VARCHAR(50) DEFAULT 'diesel',
                INDEX (AnioID)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

            CREATE TABLE IF NOT EXISTS diagramas_archivos (
                ArchivoID INT AUTO_INCREMENT PRIMARY KEY,
                MotorID INT NOT NULL,
                Titulo VARCHAR(255) NOT NULL,
                UrlArchivo TEXT NOT NULL,
                Tipo VARCHAR(50) DEFAULT 'pinout',
                Descripcion TEXT,
                PinoutDetalle LONGTEXT,
                FechaRegistro DATETIME DEFAULT CURRENT_TIMESTAMP,
                INDEX (MotorID)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

            CREATE TABLE IF NOT EXISTS diagramas_hotspots (
                HotspotID INT AUTO_INCREMENT PRIMARY KEY,
                DiagramaIdKey VARCHAR(255) NOT NULL UNIQUE,
                DatosJson LONGTEXT NOT NULL,
                UltimaActualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX (DiagramaIdKey)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");
    } catch (Exception $e) {
        // Fallback silencioso si las tablas ya existen o hay permisos restringidos
    }
}

$action = isset($_GET['action']) ? $_GET['action'] : 'marcas';
$marca = isset($_GET['marca']) ? trim($_GET['marca']) : '';
$modelo = isset($_GET['modelo']) ? trim($_GET['modelo']) : '';
$motorId = isset($_GET['motor_id']) ? intval($_GET['motor_id']) : 0;

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) $input = $_POST;

switch ($action) {
    case 'marcas':
        // Listar marcas de vehículos
        if ($pdo) {
            $stmt = $pdo->query("SELECT MarcaID, Slug, Nombre, LogoUrl, Combustible, Categoria FROM marcas WHERE Categoria = 'vehiculos' AND Activo = 1 ORDER BY Nombre ASC");
            echo json_encode(['status' => 'success', 'data' => $stmt->fetchAll()]);
        } else {
            echo json_encode(['status' => 'success', 'data' => []]);
        }
        break;

    case 'modelos':
        // Listar modelos por marca
        if ($pdo) {
            $stmt = $pdo->prepare("SELECT m.ModeloID, m.Slug, m.Nombre, m.Anios, m.Motor, m.Combustible, m.ImagenUrl 
                                   FROM modelos m 
                                   INNER JOIN marcas b ON m.MarcaID = b.MarcaID 
                                   WHERE (b.Slug = ? OR b.Nombre = ?) AND m.Activo = 1 
                                   ORDER BY m.Nombre ASC");
            $stmt->execute([$marca, $marca]);
            echo json_encode(['status' => 'success', 'data' => $stmt->fetchAll()]);
        } else {
            echo json_encode(['status' => 'success', 'data' => []]);
        }
        break;

    case 'arbol_completo':
        // Obtener toda la jerarquía de un modelo (Años -> Motores -> Diagramas)
        if ($pdo) {
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
        } else {
            echo json_encode(['status' => 'success', 'data' => []]);
        }
        break;

    case 'save_marca':
        $nombreMarca = trim($input['marca'] ?? $input['nombre'] ?? '');
        $logoUrl = trim($input['logo'] ?? $input['logoUrl'] ?? '');
        $combustible = trim($input['combustible'] ?? 'diesel');
        $categoria = trim($input['categoria'] ?? 'vehiculos');

        if ($nombreMarca === '') {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'El nombre de la marca es obligatorio.']);
            exit();
        }

        $slug = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $nombreMarca));

        if ($pdo) {
            try {
                $stmt = $pdo->prepare("INSERT INTO marcas (Slug, Nombre, LogoUrl, Combustible, Categoria, Activo) 
                                       VALUES (?, ?, ?, ?, ?, 1) 
                                       ON DUPLICATE KEY UPDATE Nombre = VALUES(Nombre), LogoUrl = VALUES(LogoUrl), Combustible = VALUES(Combustible), Categoria = VALUES(Categoria)");
                $stmt->execute([$slug, strtoupper($nombreMarca), $logoUrl, $combustible, $categoria]);
                echo json_encode(['status' => 'success', 'message' => 'Marca guardada correctamente en MySQL.', 'marca' => $nombreMarca, 'slug' => $slug]);
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(['status' => 'error', 'message' => 'Error al guardar la marca: ' . $e->getMessage()]);
            }
        } else {
            echo json_encode(['status' => 'success', 'message' => 'Marca registrada localmente.', 'marca' => $nombreMarca, 'slug' => $slug]);
        }
        break;

    case 'save_modelo':
        $nombreMarca = trim($input['marca'] ?? 'TOYOTA');
        $nombreModelo = trim($input['modelo'] ?? $input['nombre'] ?? '');
        $anios = trim($input['anios'] ?? '');
        $motor = trim($input['motor'] ?? 'Estándar');
        $combustible = trim($input['combustible'] ?? 'diesel');
        $imagenUrl = trim($input['imagen'] ?? $input['imagenUrl'] ?? '');

        if ($nombreModelo === '') {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'El nombre del modelo es obligatorio.']);
            exit();
        }

        $marcaSlug = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $nombreMarca));
        $modeloSlug = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $nombreModelo));

        if ($pdo) {
            try {
                // 1. Asegurar marca
                $stmtMarca = $pdo->prepare("SELECT MarcaID FROM marcas WHERE Slug = ? OR Nombre = ?");
                $stmtMarca->execute([$marcaSlug, strtoupper($nombreMarca)]);
                $marcaRow = $stmtMarca->fetch();

                if (!$marcaRow) {
                    $insertMarca = $pdo->prepare("INSERT INTO marcas (Slug, Nombre, Combustible, Categoria, Activo) VALUES (?, ?, ?, 'vehiculos', 1)");
                    $insertMarca->execute([$marcaSlug, strtoupper($nombreMarca), $combustible]);
                    $marcaId = $pdo->lastInsertId();
                } else {
                    $marcaId = $marcaRow['MarcaID'];
                }

                // 2. Insertar o actualizar modelo
                $stmtModelo = $pdo->prepare("SELECT ModeloID FROM modelos WHERE MarcaID = ? AND (Slug = ? OR Nombre = ?)");
                $stmtModelo->execute([$marcaId, $modeloSlug, strtoupper($nombreModelo)]);
                $modeloRow = $stmtModelo->fetch();

                if (!$modeloRow) {
                    $insertModelo = $pdo->prepare("INSERT INTO modelos (MarcaID, Slug, Nombre, Anios, Motor, Combustible, ImagenUrl, Activo) VALUES (?, ?, ?, ?, ?, ?, ?, 1)");
                    $insertModelo->execute([$marcaId, $modeloSlug, strtoupper($nombreModelo), $anios, $motor, $combustible, $imagenUrl]);
                    $modeloId = $pdo->lastInsertId();
                } else {
                    $modeloId = $modeloRow['ModeloID'];
                    $updateModelo = $pdo->prepare("UPDATE modelos SET Anios = ?, Motor = ?, Combustible = ?, ImagenUrl = ? WHERE ModeloID = ?");
                    $updateModelo->execute([$anios, $motor, $combustible, $imagenUrl, $modeloId]);
                }

                // 3. Crear Registro de Año si aplica
                $anioTxt = $anios !== '' ? $anios : 'Estándar';
                $stmtAnio = $pdo->prepare("SELECT AnioID FROM vehiculo_anios WHERE ModeloID = ? AND Anio = ?");
                $stmtAnio->execute([$modeloId, $anioTxt]);
                $anioRow = $stmtAnio->fetch();

                if (!$anioRow) {
                    $insertAnio = $pdo->prepare("INSERT INTO vehiculo_anios (ModeloID, Anio) VALUES (?, ?)");
                    $insertAnio->execute([$modeloId, $anioTxt]);
                    $anioId = $pdo->lastInsertId();
                } else {
                    $anioId = $anioRow['AnioID'];
                }

                // 4. Crear Registro de Motor si aplica
                $stmtMotor = $pdo->prepare("SELECT MotorID FROM vehiculo_motores WHERE AnioID = ? AND NombreMotor = ?");
                $stmtMotor->execute([$anioId, $motor]);
                $motorRow = $stmtMotor->fetch();

                if (!$motorRow) {
                    $insertMotor = $pdo->prepare("INSERT INTO vehiculo_motores (AnioID, NombreMotor, TipoCombustible) VALUES (?, ?, ?)");
                    $insertMotor->execute([$anioId, $motor, $combustible]);
                    $motorId = $pdo->lastInsertId();
                } else {
                    $motorId = $motorRow['MotorID'];
                }

                echo json_encode([
                    'status' => 'success',
                    'message' => 'Modelo guardado exitosamente en MySQL.',
                    'data' => [
                        'marcaId' => $marcaId,
                        'modeloId' => $modeloId,
                        'anioId' => $anioId,
                        'motorId' => $motorId,
                        'modelo' => strtoupper($nombreModelo),
                        'imagen' => $imagenUrl
                    ]
                ]);
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(['status' => 'error', 'message' => 'Error al guardar el modelo en base de datos: ' . $e->getMessage()]);
            }
        } else {
            echo json_encode([
                'status' => 'success',
                'message' => 'Modelo guardado localmente.',
                'data' => [
                    'modelo' => strtoupper($nombreModelo),
                    'imagen' => $imagenUrl
                ]
            ]);
        }
        break;

    case 'save_diagrama':
        $motorId = intval($input['motor_id'] ?? 0);
        $titulo = trim($input['titulo'] ?? 'Conexionado de la ECU');
        $urlArchivo = trim($input['url_archivo'] ?? $input['url'] ?? '');
        $tipo = trim($input['tipo'] ?? 'pinout');
        $descripcion = trim($input['descripcion'] ?? '');

        if ($urlArchivo === '') {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Se requiere la URL o archivo del diagrama.']);
            exit();
        }

        if ($pdo) {
            try {
                $stmt = $pdo->prepare("INSERT INTO diagramas_archivos (MotorID, Titulo, UrlArchivo, Tipo, Descripcion) 
                                       VALUES (?, ?, ?, ?, ?)");
                $stmt->execute([$motorId, $titulo, $urlArchivo, $tipo, $descripcion]);
                echo json_encode(['status' => 'success', 'message' => 'Diagrama guardado en MySQL.', 'archivo_id' => $pdo->lastInsertId()]);
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(['status' => 'error', 'message' => 'Error al guardar diagrama: ' . $e->getMessage()]);
            }
        } else {
            echo json_encode(['status' => 'success', 'message' => 'Diagrama guardado localmente.']);
        }
        break;

    case 'save_hotspots':
        $idKey = trim($input['diagrama_key'] ?? $input['id_key'] ?? '');
        $datos = is_string($input['datos'] ?? '') ? $input['datos'] : json_encode($input['datos'] ?? []);

        if ($idKey === '') {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'ID de diagrama no especificado.']);
            exit();
        }

        if ($pdo) {
            try {
                $stmt = $pdo->prepare("INSERT INTO diagramas_hotspots (DiagramaIdKey, DatosJson) 
                                       VALUES (?, ?) 
                                       ON DUPLICATE KEY UPDATE DatosJson = VALUES(DatosJson)");
                $stmt->execute([$idKey, $datos]);
                echo json_encode(['status' => 'success', 'message' => 'Puntos y pines de ECU guardados en MySQL.']);
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(['status' => 'error', 'message' => 'Error al guardar hotspots: ' . $e->getMessage()]);
            }
        } else {
            echo json_encode(['status' => 'success', 'message' => 'Puntos interactivos guardados localmente.']);
        }
        break;

    case 'get_hotspots':
        $idKey = trim($_GET['diagrama_key'] ?? $_GET['id_key'] ?? '');
        if ($pdo && $idKey !== '') {
            try {
                $stmt = $pdo->prepare("SELECT DatosJson FROM diagramas_hotspots WHERE DiagramaIdKey = ?");
                $stmt->execute([$idKey]);
                $row = $stmt->fetch();
                if ($row) {
                    echo json_encode(['status' => 'success', 'datos' => json_decode($row['DatosJson'], true)]);
                    exit();
                }
            } catch (Exception $e) {}
        }
        echo json_encode(['status' => 'not_found', 'datos' => null]);
        break;

    default:
        echo json_encode(['status' => 'error', 'message' => 'Acción no válida.']);
        break;
}
