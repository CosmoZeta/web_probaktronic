<?php
// api/visitas.php - Telemetría Avanzada: Registro de Visitas por IP, Sistema Operativo, Dispositivos y Usuarios en Tiempo Real
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
                SistemaOperativo VARCHAR(100) DEFAULT 'Desconocido',
                Dispositivo VARCHAR(100) DEFAULT 'Computadora',
                Navegador VARCHAR(100) DEFAULT 'Navegador Web',
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
                UltimoSO VARCHAR(100) DEFAULT 'Desconocido',
                UltimoDispositivo VARCHAR(100) DEFAULT 'Computadora',
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

// 1. Obtener la IP Real del Visitante
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

// 2. Detección Exhaustiva de Sistema Operativo, Dispositivo y Navegador
function getDeviceInfo($clientData = null) {
    $ua = $_SERVER['HTTP_USER_AGENT'] ?? '';
    
    // A) Sistema Operativo
    $so = 'Desconocido';
    $icon = 'bi-laptop';
    $deviceType = '💻 Laptop / PC';

    if (preg_match('/windows nt 10\.0/i', $ua)) {
        $so = 'Windows 11 / 10';
        $deviceType = '💻 PC / Laptop (Windows)';
        $icon = 'bi-windows';
    } elseif (preg_match('/windows nt 6\.3/i', $ua)) {
        $so = 'Windows 8.1';
        $deviceType = '💻 PC / Laptop (Windows)';
        $icon = 'bi-windows';
    } elseif (preg_match('/windows nt 6\.1/i', $ua)) {
        $so = 'Windows 7';
        $deviceType = '💻 PC / Laptop (Windows)';
        $icon = 'bi-windows';
    } elseif (preg_match('/windows/i', $ua)) {
        $so = 'Windows';
        $deviceType = '💻 PC / Laptop (Windows)';
        $icon = 'bi-windows';
    } elseif (preg_match('/android/i', $ua)) {
        $so = 'Android';
        if (preg_match('/android\s([0-9\.]+)/i', $ua, $matches)) {
            $so = 'Android ' . $matches[1];
        }
        $isTablet = preg_match('/tablet/i', $ua);
        $deviceType = $isTablet ? '📱 Tablet (Android)' : '📱 Celular (Android)';
        $icon = $isTablet ? 'bi-tablet' : 'bi-phone';
    } elseif (preg_match('/iphone/i', $ua)) {
        $so = 'iOS (iPhone)';
        $deviceType = '📱 Celular (iPhone)';
        $icon = 'bi-apple';
    } elseif (preg_match('/ipad/i', $ua)) {
        $so = 'iPadOS (iPad)';
        $deviceType = '📱 Tablet (iPad)';
        $icon = 'bi-tablet';
    } elseif (preg_match('/macintosh|mac os x/i', $ua)) {
        $so = 'macOS (Apple)';
        $deviceType = '💻 MacBook / Mac';
        $icon = 'bi-apple';
    } elseif (preg_match('/linux/i', $ua)) {
        $so = 'Linux';
        $deviceType = '💻 PC (Linux)';
        $icon = 'bi-terminal-fill';
    } elseif (preg_match('/cros/i', $ua)) {
        $so = 'Chrome OS';
        $deviceType = '💻 Chromebook';
        $icon = 'bi-laptop';
    }

    // B) Navegador Web
    $browser = 'Navegador Web';
    if (preg_match('/edg\/([0-9\.]+)/i', $ua)) {
        $browser = 'Microsoft Edge';
    } elseif (preg_match('/samsungbrowser/i', $ua)) {
        $browser = 'Samsung Internet';
    } elseif (preg_match('/brave/i', $ua)) {
        $browser = 'Brave Browser';
    } elseif (preg_match('/opr\/([0-9\.]+)|opera/i', $ua)) {
        $browser = 'Opera';
    } elseif (preg_match('/chrome\/([0-9\.]+)/i', $ua)) {
        $browser = 'Google Chrome';
    } elseif (preg_match('/firefox\/([0-9\.]+)/i', $ua)) {
        $browser = 'Mozilla Firefox';
    } elseif (preg_match('/safari/i', $ua) && !preg_match('/chrome/i', $ua)) {
        $browser = 'Apple Safari';
    }

    // C) Si el frontend envía datos de detección directa de JavaScript (User-Agent Client Hints)
    if (is_array($clientData)) {
        if (!empty($clientData['client_os'])) $so = $clientData['client_os'];
        if (!empty($clientData['client_browser'])) $browser = $clientData['client_browser'];
        if (!empty($clientData['client_device'])) $deviceType = $clientData['client_device'];
        if (!empty($clientData['client_icon'])) $icon = $clientData['client_icon'];
    }

    return [
        'so' => $so,
        'device' => $deviceType,
        'browser' => $browser,
        'icon' => $icon
    ];
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
            if (is_array($json)) {
                if (!isset($json['visitas_por_dia'])) $json['visitas_por_dia'] = [];
                if (!isset($json['ips_por_dia'])) $json['ips_por_dia'] = [];
                return $json;
            }
        }
    }
    return [
        'total_visitas' => 0,
        'visitas_por_dia' => [],
        'ips_por_dia' => [],
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
        $dev = getDeviceInfo($input['device_info'] ?? null);
        $pais = $_SERVER['HTTP_CF_IPCOUNTRY'] ?? 'PE';
        if ($ip === '127.0.0.1' || $ip === '::1' || strpos($ip, '192.168.') === 0) {
            $pais = 'Local / Red';
        }

        $pagina = trim($input['pagina'] ?? 'index.html');
        $ahora = time();
        $fechaIso = date('Y-m-d H:i:s');
        $hoyStr = date('Y-m-d');

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

        // Registrar contador de visitas por fecha global
        if (!isset($stats['visitas_por_dia'][$hoyStr])) {
            $stats['visitas_por_dia'][$hoyStr] = 0;
        }
        $stats['visitas_por_dia'][$hoyStr]++;

        // Registrar lista de IPs únicas por día
        if (!isset($stats['ips_por_dia'][$hoyStr])) {
            $stats['ips_por_dia'][$hoyStr] = [];
        }
        if (!in_array($ip, $stats['ips_por_dia'][$hoyStr])) {
            $stats['ips_por_dia'][$hoyStr][] = $ip;
        }

        // Registrar / Actualizar Detalle de la IP
        $ipKey = str_replace([':', '.'], '_', $ip);
        if (!isset($stats['ips'][$ipKey])) {
            $stats['ips'][$ipKey] = [
                'ip' => $ip,
                'pais' => $pais,
                'so' => $dev['so'],
                'dispositivo' => $dev['device'],
                'navegador' => $dev['browser'],
                'icon' => $dev['icon'],
                'primera_visita' => $fechaIso,
                'ultima_visita' => $fechaIso,
                'ultima_actividad_epoch' => $ahora,
                'total_visitas' => 1,
                'visitas_hoy' => 1,
                'fecha_hoy' => $hoyStr,
                'ultima_pagina' => $pagina,
                'usuario_email' => $userEmail,
                'usuario_nombre' => $userName
            ];
        } else {
            // Si es un nuevo día, reiniciar contador de hoy para esta IP
            if (($stats['ips'][$ipKey]['fecha_hoy'] ?? '') !== $hoyStr) {
                $stats['ips'][$ipKey]['visitas_hoy'] = 1;
                $stats['ips'][$ipKey]['fecha_hoy'] = $hoyStr;
            } else {
                $stats['ips'][$ipKey]['visitas_hoy'] = ($stats['ips'][$ipKey]['visitas_hoy'] ?? 0) + 1;
            }

            $stats['ips'][$ipKey]['ultima_visita'] = $fechaIso;
            $stats['ips'][$ipKey]['ultima_actividad_epoch'] = $ahora;
            $stats['ips'][$ipKey]['total_visitas'] = ($stats['ips'][$ipKey]['total_visitas'] ?? 1) + 1;
            $stats['ips'][$ipKey]['ultima_pagina'] = $pagina;
            $stats['ips'][$ipKey]['so'] = $dev['so'];
            $stats['ips'][$ipKey]['dispositivo'] = $dev['device'];
            $stats['ips'][$ipKey]['navegador'] = $dev['browser'];
            $stats['ips'][$ipKey]['icon'] = $dev['icon'];
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
                    'ultimo_so' => $dev['so'],
                    'ultimo_dispositivo' => $dev['device'],
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
                $stats['usuarios'][$uKey]['ultimo_so'] = $dev['so'];
                $stats['usuarios'][$uKey]['ultimo_dispositivo'] = $dev['device'];
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
            'so' => $dev['so'],
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
                $stmt = $pdo->prepare("INSERT INTO registro_visitas (IP, Pais, SistemaOperativo, Dispositivo, Navegador, Pagina, UsuarioEmail, UsuarioNombre) 
                                       VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([$ip, $pais, $dev['so'], $dev['device'], $dev['browser'], $pagina, $userEmail ?: null, $userName ?: null]);

                if ($userEmail !== '') {
                    $stmtU = $pdo->prepare("INSERT INTO registro_usuarios_activos (Email, Nombre, Rol, EsPremium, UltimaIP, UltimaPagina, UltimoSO, UltimoDispositivo, TotalIngresos) 
                                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1) 
                                            ON DUPLICATE KEY UPDATE 
                                                Nombre = VALUES(Nombre), 
                                                Rol = VALUES(Rol), 
                                                EsPremium = VALUES(EsPremium), 
                                                UltimaIP = VALUES(UltimaIP), 
                                                UltimaPagina = VALUES(UltimaPagina), 
                                                UltimoSO = VALUES(UltimoSO), 
                                                UltimoDispositivo = VALUES(UltimoDispositivo), 
                                                UltimaActividad = CURRENT_TIMESTAMP, 
                                                TotalIngresos = TotalIngresos + 1");
                    $stmtU->execute([$userEmail, $userName, $userRol, $esPremium, $ip, $pagina, $dev['so'], $dev['device']]);
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

        $ipsHoyCount = count($stats['ips_por_dia'][$hoyStr] ?? []);
        $visitasHoyCount = $stats['visitas_por_dia'][$hoyStr] ?? 1;

        echo json_encode([
            'status' => 'success',
            'online_now' => max(1, $onlineNow),
            'total_visitas' => $stats['total_visitas'] ?? 1,
            'total_ips' => count($stats['ips'] ?? []),
            'ips_hoy' => max(1, $ipsHoyCount),
            'visitas_hoy' => $visitasHoyCount
        ]);
        break;

    case 'stats':
    case 'admin_stats':
        // Métricas Completas para el Dashboard del Administrador
        $stats = loadLocalStats($statsFile);
        $ahora = time();
        $hoyStr = date('Y-m-d');

        $onlineCount = 0;
        $visitasHoy = $stats['visitas_por_dia'][$hoyStr] ?? 0;
        $ipsHoy = count($stats['ips_por_dia'][$hoyStr] ?? []);

        $listaIps = [];
        foreach (($stats['ips'] ?? []) as $ipData) {
            $lastEpoch = $ipData['ultima_actividad_epoch'] ?? 0;
            $isOnline = ($ahora - $lastEpoch) <= 300;
            if ($isOnline) $onlineCount++;

            // Si es de hoy, asegurar visitas_hoy
            if (($ipData['fecha_hoy'] ?? '') === $hoyStr) {
                $ipData['visitas_hoy'] = $ipData['visitas_hoy'] ?? 1;
            } else if (isset($ipData['ultima_visita']) && strpos($ipData['ultima_visita'], $hoyStr) === 0) {
                $ipData['visitas_hoy'] = $ipData['visitas_hoy'] ?? 1;
            } else {
                $ipData['visitas_hoy'] = 0;
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
            'visitantes_ips' => array_slice($listaIps, 0, 100),
            'usuarios_activos' => array_slice($listaUsuarios, 0, 50),
            'historial_reciente' => array_slice($stats['historial'] ?? [], 0, 40)
        ]);
        break;

    case 'limpiar_stats':
        // Reinicio de estadísticas para administrador
        $stats = [
            'total_visitas' => 0,
            'visitas_por_dia' => [],
            'ips_por_dia' => [],
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
