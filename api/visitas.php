<?php
// api/visitas.php - Contador de Visitas por IP y Control de Usuarios en Tiempo Real (Exclusivo Administrador)
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}
require_once __DIR__ . '/db.php';

// Crear tablas en MySQL si existe conexión
if ($pdo) {
    try {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS registro_visitas (
                VisitaID INT AUTO_INCREMENT PRIMARY KEY,
                IP VARCHAR(64) NOT NULL,
                Pais VARCHAR(50) DEFAULT 'Desconocido',
                Dispositivo VARCHAR(50) DEFAULT 'Desktop',
                Navegador VARCHAR(50) DEFAULT 'Navegador',
                Pagina VARCHAR(255) NOT NULL,
                UsuarioEmail VARCHAR(150) DEFAULT NULL,
                UsuarioNombre VARCHAR(150) DEFAULT NULL,
                FechaRegistro DATETIME DEFAULT CURRENT_TIMESTAMP,
                INDEX (IP),
                INDEX (UsuarioEmail),
                INDEX (FechaRegistro)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

            CREATE TABLE IF NOT EXISTS registro_usuarios_activos (
                UsuarioID INT AUTO_INCREMENT PRIMARY KEY,
                Email VARCHAR(150) NOT NULL UNIQUE,
                Nombre VARCHAR(150) DEFAULT 'Usuario',
                Rol VARCHAR(50) DEFAULT 'usuario',
                EsPremium TINYINT(1) DEFAULT 0,
                UltimaIP VARCHAR(64) NOT NULL,
                UltimaPagina VARCHAR(255) DEFAULT 'index.html',
                UltimaActividad DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                TotalIngresos INT DEFAULT 1,
                INDEX (Email),
                INDEX (UltimaActividad)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");
    } catch (Exception $e) {
        // Fallback transparente
    }
}

// Funciones Auxiliares para Detección de IP, Navegador y Dispositivo
function getClientIP() {
    $headers = [
        'HTTP_CF_CONNECTING_IP',
        'HTTP_X_REAL_IP',
        'HTTP_X_FORWARDED_FOR',
        'HTTP_CLIENT_IP',
        'REMOTE_ADDR'
    ];
    foreach ($headers as $h) {
        if (!empty($_SERVER[$h])) {
            $ips = explode(',', $_SERVER[$h]);
            $ip = trim($ips[0]);
            if (filter_var($ip, FILTER_VALIDATE_IP)) {
                return $ip;
            }
        }
    }
    return $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
}

function getDeviceInfo() {
    $ua = $_SERVER['HTTP_USER_AGENT'] ?? '';
    $device = 'Desktop';
    if (preg_match('/(mobile|android|iphone|ipad|ipod|blackberry|opera mini|iemobile)/i', $ua)) {
        $device = preg_match('/(ipad|tablet)/i', $ua) ? 'Tablet' : 'Móvil';
    }

    $browser = 'Navegador Web';
    if (strpos($ua, 'Edg') !== false) {
        $browser = 'Microsoft Edge';
    } elseif (strpos($ua, 'Chrome') !== false) {
        $browser = 'Google Chrome';
    } elseif (strpos($ua, 'Firefox') !== false) {
        $browser = 'Mozilla Firefox';
    } elseif (strpos($ua, 'Safari') !== false) {
        $browser = 'Apple Safari';
    } elseif (strpos($ua, 'Opera') !== false || strpos($ua, 'OPR') !== false) {
        $browser = 'Opera';
    }

    return ['device' => $device, 'browser' => $browser];
}

$action = isset($_GET['action']) ? $_GET['action'] : 'ping';
$input = json_decode(file_get_contents('php://input'), true);
if (!$input) $input = $_POST;

$statsFile = dirname(__DIR__) . '/data/visitas_stats.json';
if (!is_dir(dirname($statsFile))) {
    @mkdir(dirname($statsFile), 0777, true);
}

// Cargar estructura local de estadísticas
function loadLocalStats($filePath) {
    if (file_exists($filePath)) {
        $raw = @file_get_contents($filePath);
        if ($raw) {
            $json = json_decode($raw, true);
            if (is_array($json)) return $json;
        }
    }
    return [
        'total_visitas' => 0,
        'ips' => [],
        'usuarios' => [],
        'historial' => []
    ];
}

switch ($action) {
    case 'ping':
    case 'registrar':
        // 1. Obtener datos de la visita actual
        $ip = getClientIP();
        $dev = getDeviceInfo();
        $pais = $_SERVER['HTTP_CF_IPCOUNTRY'] ?? 'PE';
        if ($ip === '127.0.0.1' || $ip === '::1' || strpos($ip, '192.168.') === 0) {
            $pais = 'Local / Red';
        }

        $pagina = trim($input['pagina'] ?? 'index.html');
        $ahora = time();
        $fechaIso = date('Y-m-d H:i:s');

        $userObj = $input['user'] ?? null;
        $userEmail = '';
        $userName = '';
        $userRol = 'visitante';
        $esPremium = 0;

        if (is_array($userObj) && !empty($userObj['email'])) {
            $userEmail = strtolower(trim($userObj['email']));
            $userName = trim($userObj['nombre'] ?? explode('@', $userEmail)[0]);
            $userRol = trim($userObj['rol'] ?? 'usuario');
            $esPremium = (!empty($userObj['esPremium']) || $userRol === 'admin' || $userRol === 'premium') ? 1 : 0;
        }

        // 2. Actualizar almacenamiento JSON de alta velocidad
        $stats = loadLocalStats($statsFile);
        $stats['total_visitas'] = ($stats['total_visitas'] ?? 0) + 1;

        // Registrar / Actualizar IP
        $ipKey = str_replace([':', '.'], '_', $ip);
        if (!isset($stats['ips'][$ipKey])) {
            $stats['ips'][$ipKey] = [
                'ip' => $ip,
                'pais' => $pais,
                'dispositivo' => $dev['device'],
                'navegador' => $dev['browser'],
                'primera_visita' => $fechaIso,
                'ultima_visita' => $fechaIso,
                'ultima_actividad_epoch' => $ahora,
                'total_visitas' => 1,
                'ultima_pagina' => $pagina,
                'usuario_email' => $userEmail,
                'usuario_nombre' => $userName
            ];
        } else {
            $stats['ips'][$ipKey]['ultima_visita'] = $fechaIso;
            $stats['ips'][$ipKey]['ultima_actividad_epoch'] = $ahora;
            $stats['ips'][$ipKey]['total_visitas'] = ($stats['ips'][$ipKey]['total_visitas'] ?? 1) + 1;
            $stats['ips'][$ipKey]['ultima_pagina'] = $pagina;
            $stats['ips'][$ipKey]['dispositivo'] = $dev['device'];
            $stats['ips'][$ipKey]['navegador'] = $dev['browser'];
            if ($userEmail !== '') {
                $stats['ips'][$ipKey]['usuario_email'] = $userEmail;
                $stats['ips'][$ipKey]['usuario_nombre'] = $userName;
            }
        }

        // Registrar / Actualizar Cuenta de Usuario logueado
        if ($userEmail !== '') {
            $uKey = strtolower(preg_replace('/[^a-zA-Z0-9_-]/', '_', $userEmail));
            if (!isset($stats['usuarios'][$uKey])) {
                $stats['usuarios'][$uKey] = [
                    'email' => $userEmail,
                    'nombre' => $userName,
                    'rol' => $userRol,
                    'es_premium' => $esPremium,
                    'primera_conexion' => $fechaIso,
                    'ultima_conexion' => $fechaIso,
                    'ultima_actividad_epoch' => $ahora,
                    'ultima_ip' => $ip,
                    'ultima_pagina' => $pagina,
                    'total_ingresos' => 1
                ];
            } else {
                $stats['usuarios'][$uKey]['nombre'] = $userName ?: $stats['usuarios'][$uKey]['nombre'];
                $stats['usuarios'][$uKey]['rol'] = $userRol;
                $stats['usuarios'][$uKey]['es_premium'] = $esPremium;
                $stats['usuarios'][$uKey]['ultima_conexion'] = $fechaIso;
                $stats['usuarios'][$uKey]['ultima_actividad_epoch'] = $ahora;
                $stats['usuarios'][$uKey]['ultima_ip'] = $ip;
                $stats['usuarios'][$uKey]['ultima_pagina'] = $pagina;
                $stats['usuarios'][$uKey]['total_ingresos'] = ($stats['usuarios'][$uKey]['total_ingresos'] ?? 1) + 1;
            }
        }

        // Historial reciente (últimos 80 eventos)
        if (!isset($stats['historial']) || !is_array($stats['historial'])) {
            $stats['historial'] = [];
        }
        array_unshift($stats['historial'], [
            'ip' => $ip,
            'pais' => $pais,
            'dispositivo' => $dev['device'],
            'navegador' => $dev['browser'],
            'pagina' => $pagina,
            'usuario_email' => $userEmail,
            'usuario_nombre' => $userName,
            'hora' => $fechaIso,
            'epoch' => $ahora
        ]);
        if (count($stats['historial']) > 80) {
            $stats['historial'] = array_slice($stats['historial'], 0, 80);
        }

        @file_put_contents($statsFile, json_encode($stats, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        // 3. Registrar en MySQL si está disponible
        if ($pdo) {
            try {
                $stmt = $pdo->prepare("INSERT INTO registro_visitas (IP, Pais, Dispositivo, Navegador, Pagina, UsuarioEmail, UsuarioNombre) 
                                       VALUES (?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([$ip, $pais, $dev['device'], $dev['browser'], $pagina, $userEmail ?: null, $userName ?: null]);

                if ($userEmail !== '') {
                    $stmtU = $pdo->prepare("INSERT INTO registro_usuarios_activos (Email, Nombre, Rol, EsPremium, UltimaIP, UltimaPagina, TotalIngresos) 
                                            VALUES (?, ?, ?, ?, ?, ?, 1) 
                                            ON DUPLICATE KEY UPDATE 
                                                Nombre = VALUES(Nombre), 
                                                Rol = VALUES(Rol), 
                                                EsPremium = VALUES(EsPremium), 
                                                UltimaIP = VALUES(UltimaIP), 
                                                UltimaPagina = VALUES(UltimaPagina), 
                                                UltimaActividad = CURRENT_TIMESTAMP, 
                                                TotalIngresos = TotalIngresos + 1");
                    $stmtU->execute([$userEmail, $userName, $userRol, $esPremium, $ip, $pagina]);
                }
            } catch (Exception $e) {}
        }

        // Calcular usuarios online ahora (últimos 5 minutos = 300 seg)
        $onlineNow = 0;
        foreach ($stats['ips'] as $it) {
            if (($ahora - ($it['ultima_actividad_epoch'] ?? 0)) <= 300) {
                $onlineNow++;
            }
        }

        echo json_encode([
            'status' => 'success',
            'online_now' => max(1, $onlineNow),
            'total_visitas' => $stats['total_visitas'] ?? 1,
            'total_ips' => count($stats['ips'] ?? [])
        ]);
        break;

    case 'stats':
    case 'admin_stats':
        // Métricas Completas para el Dashboard del Administrador
        $stats = loadLocalStats($statsFile);
        $ahora = time();
        $hoyStr = date('Y-m-d');

        $onlineCount = 0;
        $visitasHoy = 0;
        $ipsHoy = 0;

        $listaIps = [];
        foreach (($stats['ips'] ?? []) as $ipData) {
            $lastEpoch = $ipData['ultima_actividad_epoch'] ?? 0;
            $isOnline = ($ahora - $lastEpoch) <= 300;
            if ($isOnline) $onlineCount++;

            if (isset($ipData['ultima_visita']) && strpos($ipData['ultima_visita'], $hoyStr) === 0) {
                $visitasHoy += ($ipData['total_visitas'] ?? 1);
                $ipsHoy++;
            }

            $ipData['is_online'] = $isOnline;
            $ipData['hace_segundos'] = max(0, $ahora - $lastEpoch);
            $listaIps[] = $ipData;
        }

        // Ordenar IPs por última actividad descendente
        usort($listaIps, function($a, $b) {
            return ($b['ultima_actividad_epoch'] ?? 0) <=> ($a['ultima_actividad_epoch'] ?? 0);
        });

        // Lista de usuarios con cuenta
        $listaUsuarios = [];
        foreach (($stats['usuarios'] ?? []) as $uData) {
            $lastEpoch = $uData['ultima_actividad_epoch'] ?? 0;
            $uData['is_online'] = ($ahora - $lastEpoch) <= 300;
            $uData['hace_segundos'] = max(0, $ahora - $lastEpoch);
            $listaUsuarios[] = $uData;
        }

        usort($listaUsuarios, function($a, $b) {
            return ($b['ultima_actividad_epoch'] ?? 0) <=> ($a['ultima_actividad_epoch'] ?? 0);
        });

        echo json_encode([
            'status' => 'success',
            'online_now' => max(1, $onlineCount),
            'total_visitas' => $stats['total_visitas'] ?? 0,
            'total_ips_unicas' => count($listaIps),
            'total_usuarios_registrados' => count($listaUsuarios),
            'visitas_hoy' => $visitasHoy,
            'ips_hoy' => $ipsHoy,
            'visitantes_ips' => array_slice($listaIps, 0, 50),
            'usuarios_activos' => array_slice($listaUsuarios, 0, 50),
            'historial_reciente' => array_slice($stats['historial'] ?? [], 0, 30)
        ]);
        break;

    case 'limpiar_stats':
        // Reinicio de estadísticas para administrador
        $stats = [
            'total_visitas' => 0,
            'ips' => [],
            'usuarios' => [],
            'historial' => []
        ];
        @file_put_contents($statsFile, json_encode($stats, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        echo json_encode(['status' => 'success', 'message' => 'Estadísticas reiniciadas correctamente.']);
        break;

    default:
        echo json_encode(['status' => 'error', 'message' => 'Acción no reconocida.']);
        break;
}
