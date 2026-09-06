<?php
// api/manuales.php - Gestión Centralizada de Manuales de Probadores Probaktronic (MySQL + JSON)
require_once __DIR__ . '/db.php';

function getManualesJsonFile() {
    $dirData = __DIR__ . '/../data/manuales_probadores.json';
    if (file_exists($dirData)) return $dirData;
    $dirRoot = __DIR__ . '/../manuales_probadores.json';
    if (file_exists($dirRoot)) return $dirRoot;
    return $dirData;
}

function getDefaultManuales() {
    return [
        [
            "id" => "man_01",
            "titulo" => "Manual Probador de ECUs y Módulos Ligeros",
            "categoria" => "ecu_gasolina",
            "categoriaNombre" => "Probadores de ECU Ligeros",
            "codigo" => "PRB-ECU-01",
            "descripcion" => "Guía completa de conexionado, prueba de fuentes conmutadas, transistores de encendido y simulación en banco.",
            "archivoPdf" => "archivos_almacenamiento/probadores_probaktronic/probador_ecu_ligeros.pdf",
            "portada" => "archivos_almacenamiento/probadores_probaktronic/imagenes_portada_probadores/probador_ecu_ligeros_img.jpeg",
            "tamano" => "2.0 MB",
            "paginas" => 48,
            "idioma" => "Español",
            "version" => "1.0",
            "fecha" => "2026-09-01",
            "destacado" => true
        ],
        [
            "id" => "man_02",
            "titulo" => "Manual Probador Sistema Common Rail & Inyectores",
            "categoria" => "diesel_commonrail",
            "categoriaNombre" => "Diésel & Common Rail",
            "codigo" => "PRB-CR-01",
            "descripcion" => "Esquemas de conexión para válvulas reguladoras de presión (SCV/DRV), sensores de riel e inyectores inductivos y piezoeléctricos.",
            "archivoPdf" => "archivos_almacenamiento/probadores_probaktronic/probador_commonrail.pdf",
            "portada" => "archivos_almacenamiento/probadores_probaktronic/imagenes_portada_probadores/probador_commonrail_img.jpeg",
            "tamano" => "612 KB",
            "paginas" => 24,
            "idioma" => "Español",
            "version" => "1.0",
            "fecha" => "2026-09-01",
            "destacado" => true
        ],
        [
            "id" => "man_03",
            "titulo" => "Manual Probador de Sensores & Actuadores Automotrices",
            "categoria" => "sensores_actuadores",
            "categoriaNombre" => "Sensores & Actuadores",
            "codigo" => "PRB-SEN-01",
            "descripcion" => "Instrucciones de prueba para cuerpos de aceleración electrónicos (TPS/APP), válvulas IAC, sensores MAP, MAF y actuadores PWM.",
            "archivoPdf" => "archivos_almacenamiento/probadores_probaktronic/probador_sensores_actuadores.pdf",
            "portada" => "archivos_almacenamiento/probadores_probaktronic/imagenes_portada_probadores/probador_sensores_actuadores_img.jpeg",
            "tamano" => "2.8 MB",
            "paginas" => 62,
            "idioma" => "Español",
            "version" => "1.0",
            "fecha" => "2026-09-01",
            "destacado" => true
        ],
        [
            "id" => "man_04",
            "titulo" => "Manual Generador de Señales CKP/CMP Plus Avanzado",
            "categoria" => "simuladores",
            "categoriaNombre" => "Generadores & Simuladores",
            "codigo" => "GEN-PLUS-01",
            "descripcion" => "Configuración de ruedas fónicas digitales (60-2, 36-1, patrones sincronizados CKP+CMP Hall e Inductivo) para simulación.",
            "archivoPdf" => "archivos_almacenamiento/probadores_probaktronic/generador_plus.pdf",
            "portada" => "archivos_almacenamiento/probadores_probaktronic/imagenes_portada_probadores/generador_plus_img.png",
            "tamano" => "1.2 MB",
            "paginas" => 36,
            "idioma" => "Español",
            "version" => "1.0",
            "fecha" => "2026-09-01",
            "destacado" => true
        ],
        [
            "id" => "man_05",
            "titulo" => "Manual Generador de Pulsos y Señales Básico",
            "categoria" => "simuladores",
            "categoriaNombre" => "Generadores & Simuladores",
            "codigo" => "GEN-BAS-01",
            "descripcion" => "Generación de ondas cuadradas, variador de frecuencia y ciclo de trabajo para prueba de velocímetros, tacómetros y módulos.",
            "archivoPdf" => "archivos_almacenamiento/probadores_probaktronic/generador_basico.pdf",
            "portada" => "archivos_almacenamiento/probadores_probaktronic/imagenes_portada_probadores/generador_basico_img.jpeg",
            "tamano" => "547 KB",
            "paginas" => 16,
            "idioma" => "Español",
            "version" => "1.0",
            "fecha" => "2026-09-01",
            "destacado" => true
        ]
    ];
}

function loadManualesJson() {
    $file = getManualesJsonFile();
    if (file_exists($file)) {
        $content = @file_get_contents($file);
        $data = json_decode($content, true);
        if (is_array($data) && !empty($data)) return $data;
    }
    $defaults = getDefaultManuales();
    saveManualesJson($defaults);
    return $defaults;
}

function saveManualesJson($data) {
    $file = __DIR__ . '/../data/manuales_probadores.json';
    $dir = dirname($file);
    if (!is_dir($dir)) {
        @mkdir($dir, 0777, true);
    }
    @file_put_contents($file, json_encode(array_values($data), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

// Crear tabla MySQL si está disponible
if ($pdo) {
    try {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS manuales_probadores (
                ManualID INT AUTO_INCREMENT PRIMARY KEY,
                CustomID VARCHAR(100) UNIQUE,
                Titulo VARCHAR(255) NOT NULL,
                Categoria VARCHAR(100) NOT NULL,
                CategoriaNombre VARCHAR(150),
                Codigo VARCHAR(50),
                Descripcion TEXT,
                ArchivoPdf VARCHAR(255) NOT NULL,
                Portada VARCHAR(255),
                Tamano VARCHAR(50),
                Paginas INT DEFAULT 0,
                Idioma VARCHAR(50) DEFAULT 'Español',
                Version VARCHAR(20) DEFAULT '1.0',
                Destacado TINYINT(1) DEFAULT 0,
                Orden INT DEFAULT 0,
                FechaRegistro DATETIME DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");
        $pdo->exec("ALTER TABLE manuales_probadores ADD COLUMN IF NOT EXISTS Orden INT DEFAULT 0;");
    } catch (Exception $e) {}
}

$action = isset($_GET['action']) ? $_GET['action'] : (isset($_POST['action']) ? $_POST['action'] : 'listar');
$input = json_decode(file_get_contents('php://input'), true);
if (!$input) $input = $_POST;

switch ($action) {
    case 'listar':
        $list = loadManualesJson();
        if ($pdo) {
            try {
                // Si la tabla MySQL existe pero está vacía, auto-sembrar los 5 manuales
                $countCheck = $pdo->query("SELECT COUNT(*) FROM manuales_probadores")->fetchColumn();
                if ((int)$countCheck === 0 && !empty($list)) {
                    $ins = $pdo->prepare("INSERT INTO manuales_probadores (CustomID, Titulo, Categoria, CategoriaNombre, Codigo, Descripcion, ArchivoPdf, Portada, Tamano, Paginas, Idioma, Version, Destacado, Orden) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                    foreach ($list as $idx => $m) {
                        $ins->execute([
                            $m['id'], $m['titulo'], $m['categoria'], $m['categoriaNombre'],
                            $m['codigo'], $m['descripcion'], $m['archivoPdf'], $m['portada'],
                            $m['tamano'], (int)($m['paginas'] ?? 20), $m['idioma'] ?? 'Español',
                            $m['version'] ?? '1.0', !empty($m['destacado']) ? 1 : 0, $idx
                        ]);
                    }
                }

                $stmt = $pdo->query("SELECT * FROM manuales_probadores ORDER BY Orden ASC, ManualID DESC");
                $dbItems = $stmt->fetchAll();
                if (!empty($dbItems)) {
                    $jsonMap = [];
                    foreach ($list as $item) {
                        $jsonMap[$item['id']] = $item;
                    }
                    $orderedList = [];
                    foreach ($dbItems as $row) {
                        $cId = $row['CustomID'] ?: ('db_' . $row['ManualID']);
                        $itemData = isset($jsonMap[$cId]) ? $jsonMap[$cId] : [
                            'id' => $cId,
                            'titulo' => $row['Titulo'],
                            'categoria' => $row['Categoria'],
                            'categoriaNombre' => $row['CategoriaNombre'] ?: $row['Categoria'],
                            'codigo' => $row['Codigo'],
                            'descripcion' => $row['Descripcion'],
                            'archivoPdf' => $row['ArchivoPdf'],
                            'portada' => $row['Portada'],
                            'tamano' => $row['Tamano'],
                            'paginas' => (int)$row['Paginas'],
                            'idioma' => $row['Idioma'],
                            'version' => $row['Version'],
                            'destacado' => (bool)$row['Destacado'],
                            'fecha' => substr($row['FechaRegistro'], 0, 10)
                        ];
                        $orderedList[] = $itemData;
                        unset($jsonMap[$cId]);
                    }
                    foreach ($jsonMap as $remItem) {
                        $orderedList[] = $remItem;
                    }
                    $list = $orderedList;
                }
            } catch (Exception $e) {}
        }
        if (empty($list)) {
            $list = getDefaultManuales();
        }
        echo json_encode([
            'status' => 'success',
            'data' => $list
        ]);
        break;

    case 'reordenar':
        $orderIds = $input['order'] ?? ($input['orderIds'] ?? []);
        $items = $input['items'] ?? [];
        
        $currentList = loadManualesJson();
        $map = [];
        foreach ($currentList as $m) {
            $map[$m['id']] = $m;
        }

        $newList = [];
        if (!empty($items) && is_array($items)) {
            $newList = $items;
        } else if (!empty($orderIds) && is_array($orderIds)) {
            foreach ($orderIds as $id) {
                if (isset($map[$id])) {
                    $newList[] = $map[$id];
                    unset($map[$id]);
                }
            }
            // Agregar cualquier elemento no incluido en la lista de orden al final
            foreach ($map as $rem) {
                $newList[] = $rem;
            }
        }

        if (!empty($newList)) {
            saveManualesJson($newList);

            // Actualizar Orden en MySQL
            if ($pdo) {
                try {
                    $upd = $pdo->prepare("UPDATE manuales_probadores SET Orden = ? WHERE CustomID = ?");
                    foreach ($newList as $idx => $m) {
                        $upd->execute([$idx, $m['id']]);
                    }
                } catch (Exception $e) {}
            }

            echo json_encode([
                'status' => 'success',
                'message' => 'Orden de manuales actualizado y guardado con éxito.',
                'data' => $newList
            ]);
        } else {
            http_response_code(400);
            echo json_encode([
                'status' => 'error',
                'message' => 'No se proporcionaron IDs u orden válido.'
            ]);
        }
        break;

    case 'guardar':
    case 'agregar':
        $id = trim($input['id'] ?? ('man_' . time()));
        $titulo = trim($input['titulo'] ?? '');
        $categoria = trim($input['categoria'] ?? 'ecu_gasolina');
        $categoriaNombre = trim($input['categoriaNombre'] ?? 'Probadores de ECU');
        $codigo = trim($input['codigo'] ?? 'PRB-01');
        $descripcion = trim($input['descripcion'] ?? '');
        $archivoPdf = trim($input['archivoPdf'] ?? '');
        $portada = trim($input['portada'] ?? '');
        $tamano = trim($input['tamano'] ?? '1.5 MB');
        $paginas = (int)($input['paginas'] ?? 20);
        $idioma = trim($input['idioma'] ?? 'Español');
        $version = trim($input['version'] ?? '1.0');
        $destacado = !empty($input['destacado']);

        if ($titulo === '' || $archivoPdf === '') {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'El título y el archivo PDF son obligatorios.']);
            exit();
        }

        $newEntry = [
            'id' => $id,
            'titulo' => $titulo,
            'categoria' => $categoria,
            'categoriaNombre' => $categoriaNombre,
            'codigo' => $codigo,
            'descripcion' => $descripcion,
            'archivoPdf' => $archivoPdf,
            'portada' => $portada,
            'tamano' => $tamano,
            'paginas' => $paginas,
            'idioma' => $idioma,
            'version' => $version,
            'fecha' => date('Y-m-d'),
            'destacado' => $destacado
        ];

        // Guardar en JSON
        $list = loadManualesJson();
        $found = false;
        foreach ($list as $k => $item) {
            if ($item['id'] === $id) {
                $list[$k] = $newEntry;
                $found = true;
                break;
            }
        }
        if (!$found) {
            array_unshift($list, $newEntry);
        }
        saveManualesJson($list);

        // Guardar en MySQL
        if ($pdo) {
            try {
                $check = $pdo->prepare("SELECT ManualID FROM manuales_probadores WHERE CustomID = ?");
                $check->execute([$id]);
                if ($check->fetch()) {
                    $upd = $pdo->prepare("UPDATE manuales_probadores SET Titulo=?, Categoria=?, CategoriaNombre=?, Codigo=?, Descripcion=?, ArchivoPdf=?, Portada=?, Tamano=?, Paginas=?, Idioma=?, Version=?, Destacado=? WHERE CustomID=?");
                    $upd->execute([$titulo, $categoria, $categoriaNombre, $codigo, $descripcion, $archivoPdf, $portada, $tamano, $paginas, $idioma, $version, $destacado ? 1 : 0, $id]);
                } else {
                    $ins = $pdo->prepare("INSERT INTO manuales_probadores (CustomID, Titulo, Categoria, CategoriaNombre, Codigo, Descripcion, ArchivoPdf, Portada, Tamano, Paginas, Idioma, Version, Destacado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                    $ins->execute([$id, $titulo, $categoria, $categoriaNombre, $codigo, $descripcion, $archivoPdf, $portada, $tamano, $paginas, $idioma, $version, $destacado ? 1 : 0]);
                }
            } catch (Exception $e) {}
        }

        echo json_encode([
            'status' => 'success',
            'message' => 'Manual guardado correctamente.',
            'data' => $newEntry
        ]);
        break;

    case 'eliminar':
        $id = trim($input['id'] ?? '');
        if ($id === '') {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'ID de manual no especificado.']);
            exit();
        }

        $list = loadManualesJson();
        $filtered = array_filter($list, function($item) use ($id) {
            return $item['id'] !== $id;
        });
        saveManualesJson($filtered);

        if ($pdo) {
            try {
                $del = $pdo->prepare("DELETE FROM manuales_probadores WHERE CustomID = ?");
                $del->execute([$id]);
            } catch (Exception $e) {}
        }

        echo json_encode([
            'status' => 'success',
            'message' => 'Manual eliminado correctamente.'
        ]);
        break;

    case 'subir_archivo':
        if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Error al transferir el archivo.']);
            exit();
        }

        $file = $_FILES['file'];
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $isPdf = ($ext === 'pdf');
        $isImg = in_array($ext, ['png', 'jpg', 'jpeg', 'svg', 'webp'], true);

        if (!$isPdf && !$isImg) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Formato no permitido. Solo PDF o imágenes (PNG, JPG, SVG).']);
            exit();
        }

        $targetDir = $isPdf ? (__DIR__ . '/../archivos_almacenamiento/probadores_probaktronic') : (__DIR__ . '/../archivos_almacenamiento/productos');
        if (!is_dir($targetDir)) {
            @mkdir($targetDir, 0777, true);
        }

        $safeName = preg_replace('/[^a-zA-Z0-9_-]/', '_', pathinfo($file['name'], PATHINFO_FILENAME)) . '_' . time() . '.' . $ext;
        $targetPath = $targetDir . '/' . $safeName;

        if (move_uploaded_file($file['tmp_name'], $targetPath)) {
            $relPath = $isPdf ? ('archivos_almacenamiento/probadores_probaktronic/' . $safeName) : ('archivos_almacenamiento/productos/' . $safeName);
            echo json_encode([
                'status' => 'success',
                'file_path' => $relPath,
                'file_name' => $safeName
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'No se pudo mover el archivo al servidor.']);
        }
        break;

    default:
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Acción no válida.']);
        break;
}
