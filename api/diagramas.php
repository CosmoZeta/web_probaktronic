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
            $stmt = $pdo->query("SELECT MarcaID, Slug, Nombre, LogoUrl, Categoria FROM marcas WHERE Activo = 1 ORDER BY Nombre ASC");
            echo json_encode(['status' => 'success', 'data' => $stmt->fetchAll()]);
        } else {
            echo json_encode(['status' => 'success', 'data' => []]);
        }
        break;

    case 'modelos':
        // Listar modelos por marca
        if ($pdo) {
            $stmt = $pdo->prepare("SELECT m.ModeloID, m.Slug, m.Nombre, m.ImagenUrl,
                                          COALESCE(a.Anio, '') AS Anios,
                                          COALESCE(mot.NombreMotor, '') AS Motor,
                                          COALESCE(mot.TipoCombustible, 'diesel') AS Combustible
                                   FROM modelos m 
                                   INNER JOIN marcas b ON m.MarcaID = b.MarcaID 
                                   LEFT JOIN vehiculo_anios a ON a.ModeloID = m.ModeloID 
                                   LEFT JOIN vehiculo_motores mot ON mot.AnioID = a.AnioID 
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
                                   WHERE (b.Slug = :marca OR b.Nombre = :marca) AND (m.Slug = :modelo OR m.Nombre = :modelo)
                                   ORDER BY d.ArchivoID ASC");
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

    case 'subir_foto':
    case 'upload_foto':
        if (!isset($_FILES['archivo']) && !isset($_FILES['imagen'])) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'No se recibió ningún archivo de imagen.']);
            exit();
        }

        $file = $_FILES['archivo'] ?? $_FILES['imagen'];
        if ($file['error'] !== UPLOAD_ERR_OK) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Error al transferir el archivo: ' . $file['error']]);
            exit();
        }

        $marcaRaw = trim($_POST['marca'] ?? 'TOYOTA');
        $modeloRaw = trim($_POST['modelo'] ?? 'corolla');
        $anioRaw = trim($_POST['anio'] ?? '1993-1997');
        $motorRaw = trim($_POST['motor'] ?? 'motor_4e');
        $componenteRaw = trim($_POST['componente'] ?? 'ecu');
        $tipoCarpeta = trim($_POST['tipo_carpeta'] ?? 'imagen');
        $posicion = trim($_POST['posicion'] ?? 'end');

        // Limpieza y sanitización de nombres de carpetas
        $marcaClean = strtoupper(preg_replace('/[^a-zA-Z0-9_-]/', '', str_replace(' ', '_', $marcaRaw)));
        $modeloClean = strtolower(preg_replace('/[^a-zA-Z0-9_-]/', '', str_replace(' ', '_', $modeloRaw)));
        $motorClean = strtolower(preg_replace('/[^a-zA-Z0-9_-]/', '', str_replace(' ', '_', $motorRaw)));
        $componenteClean = strtolower(preg_replace('/[^a-zA-Z0-9_-]/', '', str_replace(' ', '_', $componenteRaw)));
        $tipoClean = ($tipoCarpeta === 'conexionado') ? 'conexionado' : 'imagen';

        if (empty($marcaClean)) $marcaClean = 'TOYOTA';
        if (empty($modeloClean)) $modeloClean = 'general';
        if (empty($componenteClean)) $componenteClean = 'ecu';

        // Directorio físico en el servidor de SiteGround
        $baseStorageDir = dirname(__DIR__) . '/archivos_almacenamiento/diagramas_PRUEBAS/' . $marcaClean . '/' . $modeloClean . '/' . $motorClean . '/' . $componenteClean . '/' . $tipoClean;

        if (!is_dir($baseStorageDir)) {
            @mkdir($baseStorageDir, 0755, true);
        }

        // Extensión original y nombre limpio profesional
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if (!in_array($ext, ['jpg', 'jpeg', 'png', 'webp', 'svg', 'pdf'])) {
            $ext = 'jpg';
        }

        // Conteo de archivos para el consecutivo
        $existingFiles = glob($baseStorageDir . '/*.*');
        $num = count($existingFiles) + 1;
        $cleanFileName = $modeloClean . '_' . $componenteClean . '_' . $num . '.' . $ext;
        $targetPath = $baseStorageDir . '/' . $cleanFileName;

        if (move_uploaded_file($file['tmp_name'], $targetPath)) {
            $relativeUrl = 'archivos_almacenamiento/diagramas_PRUEBAS/' . $marcaClean . '/' . $modeloClean . '/' . $motorClean . '/' . $componenteClean . '/' . $tipoClean . '/' . $cleanFileName;

            echo json_encode([
                'status' => 'success',
                'message' => 'Imagen guardada exitosamente en el servidor.',
                'url' => $relativeUrl,
                'fileName' => $cleanFileName,
                'path' => $relativeUrl
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'No se pudo mover el archivo al directorio del servidor.']);
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

    case 'delete_modelo':
        $nombreMarca = trim($input['marca'] ?? '');
        $nombreModelo = trim($input['modelo'] ?? '');
        $modeloId = intval($input['modelo_id'] ?? 0);

        if ($nombreModelo === '' && $modeloId === 0) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Se requiere el nombre o ID del modelo.']);
            exit();
        }

        if ($pdo) {
            try {
                if ($modeloId > 0) {
                    $stmt = $pdo->prepare("UPDATE modelos SET Activo = 0 WHERE ModeloID = ?");
                    $stmt->execute([$modeloId]);
                } else {
                    $marcaSlug = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $nombreMarca));
                    $modeloSlug = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $nombreModelo));
                    $stmt = $pdo->prepare("UPDATE modelos m 
                                           INNER JOIN marcas b ON m.MarcaID = b.MarcaID 
                                           SET m.Activo = 0 
                                           WHERE (b.Slug = ? OR b.Nombre = ?) AND (m.Slug = ? OR m.Nombre = ?)");
                    $stmt->execute([$marcaSlug, strtoupper($nombreMarca), $modeloSlug, strtoupper($nombreModelo)]);
                }
                echo json_encode(['status' => 'success', 'message' => 'Modelo eliminado exitosamente de MySQL.']);
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(['status' => 'error', 'message' => 'Error al eliminar modelo: ' . $e->getMessage()]);
            }
        } else {
            echo json_encode(['status' => 'success', 'message' => 'Modelo eliminado localmente.']);
        }
        break;

    case 'delete_marca':
        $nombreMarca = trim($input['marca'] ?? $input['nombre'] ?? '');
        $marcaId = intval($input['marca_id'] ?? 0);

        if ($nombreMarca === '' && $marcaId === 0) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Se requiere el nombre o ID de la marca.']);
            exit();
        }

        if ($pdo) {
            try {
                if ($marcaId > 0) {
                    $stmt = $pdo->prepare("UPDATE marcas SET Activo = 0 WHERE MarcaID = ?");
                    $stmt->execute([$marcaId]);
                } else {
                    $marcaSlug = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $nombreMarca));
                    $stmt = $pdo->prepare("UPDATE marcas SET Activo = 0 WHERE Slug = ? OR Nombre = ?");
                    $stmt->execute([$marcaSlug, strtoupper($nombreMarca)]);
                }
                echo json_encode(['status' => 'success', 'message' => 'Marca eliminada de MySQL.']);
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(['status' => 'error', 'message' => 'Error al eliminar marca: ' . $e->getMessage()]);
            }
        } else {
            echo json_encode(['status' => 'success', 'message' => 'Marca eliminada localmente.']);
        }
        break;

    case 'delete_diagrama':
        $archivoId = intval($input['archivo_id'] ?? 0);
        $titulo = trim($input['titulo'] ?? '');

        if ($pdo) {
            try {
                if ($archivoId > 0) {
                    $stmt = $pdo->prepare("DELETE FROM diagramas_archivos WHERE ArchivoID = ?");
                    $stmt->execute([$archivoId]);
                } else if ($titulo !== '') {
                    $stmt = $pdo->prepare("DELETE FROM diagramas_archivos WHERE Titulo = ?");
                    $stmt->execute([$titulo]);
                }
                echo json_encode(['status' => 'success', 'message' => 'Diagrama eliminado de MySQL.']);
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(['status' => 'error', 'message' => 'Error al eliminar diagrama: ' . $e->getMessage()]);
            }
        } else {
            echo json_encode(['status' => 'success', 'message' => 'Diagrama eliminado localmente.']);
        }
        break;

    case 'sync_json_to_mysql':
        // Migración automática del JSON del catálogo a MySQL
        $jsonPath = dirname(__DIR__) . '/data/vehiculos_diagramas.json';
        if (!file_exists($jsonPath)) {
            http_response_code(404);
            echo json_encode(['status' => 'error', 'message' => 'Archivo data/vehiculos_diagramas.json no encontrado.']);
            exit();
        }

        $jsonStr = file_get_contents($jsonPath);
        $tree = json_decode($jsonStr, true);
        if (!is_array($tree)) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'JSON inválido o vacío.']);
            exit();
        }

        if (!$pdo) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'Base de datos MySQL no conectada.']);
            exit();
        }

        $marcasCount = 0;
        $modelosCount = 0;
        $archivosCount = 0;

        try {
            $pdo->beginTransaction();

            foreach ($tree as $bKey => $bVal) {
                $bName = strtoupper($bVal['brandData']['nombre'] ?? $bKey);
                $bSlug = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $bKey));
                $bLogo = $bVal['brandData']['logoUrl'] ?? $bVal['brandData']['logo'] ?? '';
                $bComb = $bVal['brandData']['combustible'] ?? 'diesel';

                // Insertar/actualizar Marca
                $stmt = $pdo->prepare("INSERT INTO marcas (Slug, Nombre, LogoUrl, Combustible, Categoria, Activo) 
                                       VALUES (?, ?, ?, ?, 'vehiculos', 1) 
                                       ON DUPLICATE KEY UPDATE Nombre = VALUES(Nombre), LogoUrl = VALUES(LogoUrl), Combustible = VALUES(Combustible)");
                $stmt->execute([$bSlug, $bName, $bLogo, $bComb]);
                $stmtMId = $pdo->prepare("SELECT MarcaID FROM marcas WHERE Slug = ?");
                $stmtMId->execute([$bSlug]);
                $marcaId = $stmtMId->fetchColumn();
                $marcasCount++;

                $models = $bVal['models'] ?? [];
                foreach ($models as $mKey => $mVal) {
                    $mName = strtoupper($mVal['modelData']['nombre'] ?? $mKey);
                    $mSlug = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $mKey));
                    $mImg = $mVal['modelData']['imagenUrl'] ?? $mVal['modelData']['imagen'] ?? '';
                    $mComb = $mVal['modelData']['combustible'] ?? $bComb;
                    $mAnios = $mVal['modelData']['anios'] ?? '';
                    $mMotor = $mVal['modelData']['motor'] ?? '';

                    $stmtMod = $pdo->prepare("INSERT INTO modelos (MarcaID, Slug, Nombre, Anios, Motor, Combustible, ImagenUrl, Activo) 
                                              VALUES (?, ?, ?, ?, ?, ?, ?, 1) 
                                              ON DUPLICATE KEY UPDATE Nombre = VALUES(Nombre), Anios = VALUES(Anios), Motor = VALUES(Motor), Combustible = VALUES(Combustible), ImagenUrl = VALUES(ImagenUrl)");
                    $stmtMod->execute([$marcaId, $mSlug, $mName, $mAnios, $mMotor, $mComb, $mImg]);
                    $stmtModId = $pdo->prepare("SELECT ModeloID FROM modelos WHERE MarcaID = ? AND Slug = ?");
                    $stmtModId->execute([$marcaId, $mSlug]);
                    $modeloId = $stmtModId->fetchColumn();
                    $modelosCount++;

                    // Años -> Motores -> Archivos
                    $anios = $mVal['anios'] ?? [];
                    foreach ($anios as $aKey => $aVal) {
                        $stmtAnio = $pdo->prepare("INSERT INTO vehiculo_anios (ModeloID, Anio) VALUES (?, ?)");
                        $stmtAnio->execute([$modeloId, $aKey]);
                        $anioId = $pdo->lastInsertId();

                        $motores = $aVal['motores'] ?? [];
                        foreach ($motores as $motKey => $motVal) {
                            $stmtMot = $pdo->prepare("INSERT INTO vehiculo_motores (AnioID, NombreMotor, TipoCombustible) VALUES (?, ?, ?)");
                            $stmtMot->execute([$anioId, $motKey, $mComb]);
                            $motorId = $pdo->lastInsertId();

                            $archivos = $motVal['archivos'] ?? [];
                            foreach ($archivos as $arc) {
                                $arcTitulo = $arc['titulo'] ?? $arc['nombre'] ?? 'Diagrama';
                                $arcUrl = $arc['url'] ?? $arc['diagramaUrl'] ?? $arc['pdfUrl'] ?? $arc['imageUrl'] ?? '';
                                if ($arcUrl !== '') {
                                    $stmtArc = $pdo->prepare("INSERT INTO diagramas_archivos (MotorID, Titulo, UrlArchivo, Tipo, Descripcion) 
                                                              VALUES (?, ?, ?, 'pinout', ?)");
                                    $stmtArc->execute([$motorId, $arcTitulo, $arcUrl, $arc['descripcion'] ?? '']);
                                    $archivosCount++;
                                }
                            }
                        }
                    }
                }
            }

            $pdo->commit();
            echo json_encode([
                'status' => 'success',
                'message' => 'Catálogo sincronizado exitosamente en MySQL.',
                'marcas' => $marcasCount,
                'modelos' => $modelosCount,
                'archivos' => $archivosCount
            ]);
        } catch (Exception $e) {
            $pdo->rollBack();
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'Error durante la sincronización: ' . $e->getMessage()]);
        }
        break;

    default:
        echo json_encode(['status' => 'error', 'message' => 'Acción no válida.']);
        break;
}
