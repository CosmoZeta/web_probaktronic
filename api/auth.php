<?php
// api/auth.php - Autenticación Segura con MySQL en SiteGround
require_once __DIR__ . '/db.php';

// Crear tabla usuarios si no existe
if ($pdo) {
    try {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS usuarios (
                UsuarioID INT AUTO_INCREMENT PRIMARY KEY,
                Nombre VARCHAR(100) NOT NULL,
                Email VARCHAR(150) NOT NULL UNIQUE,
                PasswordHash VARCHAR(255) NOT NULL,
                Rol VARCHAR(50) DEFAULT 'admin',
                Activo TINYINT(1) DEFAULT 1,
                TwoFactorSecret VARCHAR(100) DEFAULT 'PROBAKTRONICMASTERKEY2026',
                TwoFactorEnabled TINYINT(1) DEFAULT 1,
                UltimoAcceso DATETIME DEFAULT NULL,
                FechaRegistro DATETIME DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");

        $checkAdmin = $pdo->prepare("SELECT UsuarioID FROM usuarios WHERE Email = ?");
        $checkAdmin->execute(['jhanzeta@gmail.com']);
        if (!$checkAdmin->fetch()) {
            $hash = password_hash('0!KG#Ptgh1XSx6d)GJ4wsEtV', PASSWORD_DEFAULT);
            $ins = $pdo->prepare("INSERT INTO usuarios (Nombre, Email, PasswordHash, Rol, Activo, TwoFactorSecret, TwoFactorEnabled) VALUES ('SR GATO', 'jhanzeta@gmail.com', ?, 'admin', 1, 'PROBAKTRONICMASTERKEY2026', 1)");
            $ins->execute([$hash]);
        }
    } catch (Exception $e) {}
}

$action = isset($_GET['action']) ? $_GET['action'] : 'session';
$input = json_decode(file_get_contents('php://input'), true);
if (!$input) $input = $_POST;

class GoogleAuthenticator {
    private static $base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

    public static function generateSecret($length = 16) {
        $secret = '';
        for ($i = 0; $i < $length; $i++) {
            $secret .= self::$base32Chars[random_int(0, 31)];
        }
        return $secret;
    }

    public static function getCode($secret, $timeSlice = null) {
        if ($timeSlice === null) {
            $timeSlice = floor(time() / 30);
        }
        $secretKey = self::base32Decode($secret);
        $time = chr(0).chr(0).chr(0).chr(0).pack('N*', $timeSlice);
        $hmac = hash_hmac('sha1', $time, $secretKey, true);
        $offset = ord(substr($hmac, -1)) & 0x0F;
        $hashPart = substr($hmac, $offset, 4);
        $value = unpack('N', $hashPart)[1] & 0x7FFFFFFF;
        return str_pad($value % 1000000, 6, '0', STR_PAD_LEFT);
    }

    public static function verifyCode($secret, $code, $discrepancy = 2) {
        if (empty($secret)) return false;
        $currentTimeSlice = floor(time() / 30);
        for ($i = -$discrepancy; $i <= $discrepancy; $i++) {
            if (self::getCode($secret, $currentTimeSlice + $i) === trim($code)) {
                return true;
            }
        }
        return false;
    }

    public static function getQrCodeUrl($name, $secret, $issuer = 'Probaktronic') {
        $otpauth = "otpauth://totp/" . rawurlencode($issuer) . ":" . rawurlencode($name) . "?secret=" . $secret . "&issuer=" . rawurlencode($issuer);
        return "https://api.qrserver.com/v1/create-qr-code/?data=" . rawurlencode($otpauth) . "&size=220x220&margin=10";
    }

    private static function base32Decode($b32) {
        $b32 = strtoupper(trim($b32));
        $b32 = str_replace([' ', '-', '=', '0', '1', '8', '9'], ['', '', '', 'O', 'I', '', ''], $b32);
        $buffer = 0;
        $bufferSize = 0;
        $output = '';
        for ($i = 0; $i < strlen($b32); $i++) {
            $val = strpos(self::$base32Chars, $b32[$i]);
            if ($val === false) continue;
            $buffer = ($buffer << 5) | $val;
            $bufferSize += 5;
            if ($bufferSize >= 8) {
                $bufferSize -= 8;
                $output .= chr(($buffer >> $bufferSize) & 0xFF);
            }
        }
        return $output;
    }
}

switch ($action) {
    case 'login':
        $email = trim($input['email'] ?? '');
        $password = trim($input['password'] ?? '');

        if ($email === '') {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Por favor ingrese su correo o usuario.']);
            exit();
        }

        $user = null;
        if ($pdo) {
            try {
                $stmt = $pdo->prepare("SELECT UsuarioID, Nombre, Email, PasswordHash, Rol, Activo, TwoFactorSecret, TwoFactorEnabled FROM usuarios WHERE Email = ? OR Nombre = ?");
                $stmt->execute([$email, $email]);
                $user = $stmt->fetch();
            } catch (Exception $e) {
                $user = null;
            }
        }

        // Si la base de datos MySQL no responde o no está disponible, usar almacén local de seguridad
        if (!$user) {
            $localJsonFile = __DIR__ . '/../data/usuarios.json';
            if (file_exists($localJsonFile)) {
                $localData = json_decode(file_get_contents($localJsonFile), true);
                if (is_array($localData)) {
                    foreach ($localData as $u) {
                        $uEmail = strtolower(trim($u['email'] ?? ''));
                        $uName = strtolower(trim($u['nombre'] ?? ''));
                        if ($uEmail === strtolower($email) || $uName === strtolower($email)) {
                            $user = [
                                'UsuarioID' => $u['id'] ?? 'wRmmGpDTU6PeVTKJBPB3H0WQspR2',
                                'Nombre' => $u['nombre'] ?? 'SR GATO',
                                'Email' => $u['email'] ?? $email,
                                'PasswordHash' => $u['password'] ?? '',
                                'Rol' => $u['rol'] ?? 'admin',
                                'Activo' => 1,
                                'TwoFactorSecret' => 'PROBAKTRONICMASTERKEY2026',
                                'TwoFactorEnabled' => 1
                            ];
                            break;
                        }
                    }
                }
            }
        }

        // Si es el correo maestro admin pero no estaba en JSON ni MySQL
        if (!$user && (strtolower($email) === 'jhanzeta@gmail.com' || strtolower($email) === 'prueba@probak.com')) {
            $user = [
                'UsuarioID' => 'wRmmGpDTU6PeVTKJBPB3H0WQspR2',
                'Nombre' => (strtolower($email) === 'jhanzeta@gmail.com') ? 'SR GATO' : 'SEÑOR GATO',
                'Email' => $email,
                'PasswordHash' => '',
                'Rol' => 'admin',
                'Activo' => 1,
                'TwoFactorSecret' => 'PROBAKTRONICMASTERKEY2026',
                'TwoFactorEnabled' => 1
            ];
        }

        if (!$user) {
            http_response_code(401);
            echo json_encode(['status' => 'error', 'message' => 'Usuario no encontrado.']);
            exit();
        }

        if (!$user['Activo']) {
            http_response_code(403);
            echo json_encode(['status' => 'error', 'message' => 'Cuenta inactiva o pendiente de aprobación.']);
            exit();
        }

        $userEmailLower = strtolower(trim($user['Email'] ?? $email));
        $isAdmin = ($user['Rol'] === 'admin' || $userEmailLower === 'prueba@probak.com' || $userEmailLower === 'jhanzeta@gmail.com' || strpos($userEmailLower, 'jhanzeta') !== false);

        if ($isAdmin) {
            $user['Rol'] = 'admin';
            if (empty($user['Nombre']) || $user['Nombre'] === 'Usuario' || $user['Nombre'] === 'Técnico Admin') {
                $user['Nombre'] = ($userEmailLower === 'jhanzeta@gmail.com') ? 'SR GATO' : 'SEÑOR GATO';
            }
        }

        // 1. Validar contraseña contra el hash de MySQL
        $passwordOk = false;
        if (!empty($user['PasswordHash']) && $password !== '') {
            if (password_verify($password, $user['PasswordHash'])) {
                $passwordOk = true;
            } elseif ($password === $user['PasswordHash']) {
                $passwordOk = true;
                if ($pdo) {
                    try {
                        $newHash = password_hash($password, PASSWORD_DEFAULT);
                        $pdo->prepare("UPDATE usuarios SET PasswordHash = ? WHERE UsuarioID = ?")->execute([$newHash, $user['UsuarioID']]);
                    } catch (Exception $e) {}
                }
            }
        }

        // 2. Si es Administrador y la base de datos tenía un hash desactualizado, permitir claves maestras
        if (!$passwordOk && $isAdmin) {
            $masterKeys = [
                '0!KG#Ptgh1XSx6d)GJ4wsEtV'
            ];

            if (in_array($password, $masterKeys, true)) {
                $passwordOk = true;
                if ($pdo) {
                    try {
                        $newHash = password_hash($password, PASSWORD_DEFAULT);
                        $pdo->prepare("UPDATE usuarios SET PasswordHash = ?, Rol = 'admin', Activo = 1 WHERE UsuarioID = ?")->execute([$newHash, $user['UsuarioID']]);
                    } catch (Exception $e) {}
                }
            }
        }

        if (!$passwordOk) {
            http_response_code(401);
            echo json_encode(['status' => 'error', 'message' => 'La contraseña ingresada es incorrecta.']);
            exit();
        }

        // Si es Administrador, SIEMPRE activar flujo de verificación 2FA (Google Authenticator)
        if ($isAdmin) {
            $secret = (!empty($user['TwoFactorSecret'])) ? $user['TwoFactorSecret'] : 'PROBAKTRONICMASTERKEY2026';
            echo json_encode([
                'status' => '2fa_required',
                'message' => 'Verificación en dos pasos (Google Authenticator) requerida.',
                'temp_user' => [
                    'id' => $user['UsuarioID'],
                    'nombre' => $user['Nombre'],
                    'email' => $user['Email'],
                    'rol' => 'admin',
                    'isAdmin' => true,
                    'esPremium' => true,
                    'twoFactorSecret' => $secret
                ]
            ]);
            exit();
        }

        // Actualizar último acceso
        if ($pdo) {
            try {
                $pdo->prepare("UPDATE usuarios SET UltimoAcceso = NOW() WHERE UsuarioID = ?")->execute([$user['UsuarioID']]);
            } catch (Exception $e) {}
        }

        // Retornar perfil y token de sesión
        echo json_encode([
            'status' => 'success',
            'message' => 'Bienvenido a Probaktronic',
            'user' => [
                'id' => $user['UsuarioID'],
                'nombre' => $user['Nombre'],
                'email' => $user['Email'],
                'rol' => $user['Rol'],
                'isAdmin' => false,
                'esPremium' => true,
                'token' => bin2hex(random_bytes(24))
            ]
        ]);
        break;

    case 'verify_2fa':
        $userId = trim($input['user_id'] ?? '');
        $email = trim($input['email'] ?? '');
        $code = trim($input['code'] ?? '');

        if ($code === '' || strlen($code) < 6) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Por favor ingrese el código de 6 dígitos de su app Authenticator.']);
            exit();
        }

        $user = null;
        if ($pdo) {
            try {
                $stmt = $pdo->prepare("SELECT UsuarioID, Nombre, Email, Rol, TwoFactorSecret FROM usuarios WHERE UsuarioID = ? OR Email = ?");
                $stmt->execute([$userId, $email]);
                $user = $stmt->fetch();
            } catch (Exception $e) {
                $user = null;
            }
        }

        $secret = ($user && !empty($user['TwoFactorSecret'])) ? $user['TwoFactorSecret'] : 'JHANZETAPROBAK26';
        
        $possibleSecrets = array_unique(array_filter([
            $secret,
            'JHANZETAPROBAK26',
            'PROBAKJHANKEY2026',
            'PROBAKTRONICMASTERKEY2026'
        ]));

        $verified = false;
        foreach ($possibleSecrets as $secCandidate) {
            if (!empty($secCandidate) && GoogleAuthenticator::verifyCode($secCandidate, $code, 2)) {
                $verified = true;
                if ($pdo && $user) {
                    try {
                        $pdo->prepare("UPDATE usuarios SET TwoFactorSecret = ? WHERE UsuarioID = ?")->execute([$secCandidate, $user['UsuarioID']]);
                    } catch (Exception $e) {}
                }
                break;
            }
        }

        if (!$verified) {
            http_response_code(401);
            echo json_encode(['status' => 'error', 'message' => 'El código de Google Authenticator es incorrecto o ha expirado. Asegúrate de que la hora de tu teléfono esté sincronizada automáticamente.']);
            exit();
        }

        if ($pdo && $user) {
            try {
                $pdo->prepare("UPDATE usuarios SET UltimoAcceso = NOW() WHERE UsuarioID = ?")->execute([$user['UsuarioID']]);
            } catch (Exception $e) {}
        }

        $targetEmail = $user ? $user['Email'] : $email;
        $userName = ($user && !empty($user['Nombre']) && $user['Nombre'] !== 'Usuario') ? $user['Nombre'] : (strtolower($targetEmail) === 'jhanzeta@gmail.com' ? 'SR GATO' : 'Administrador');

        echo json_encode([
            'status' => 'success',
            'message' => 'Autenticación en dos pasos confirmada con éxito.',
            'user' => [
                'id' => $user ? $user['UsuarioID'] : ($userId ?: 'wRmmGpDTU6PeVTKJBPB3H0WQspR2'),
                'nombre' => $userName,
                'email' => $targetEmail,
                'rol' => 'admin',
                'isAdmin' => true,
                'esPremium' => true,
                'token' => bin2hex(random_bytes(24))
            ]
        ]);
        break;

    case 'setup_2fa':
        $email = trim($input['email'] ?? 'jhanzeta@gmail.com');
        $secret = GoogleAuthenticator::generateSecret(16);
        $qrUrl = GoogleAuthenticator::getQrCodeUrl($email, $secret, 'Probaktronic');

        // Guardar secret en la base de datos para el admin
        if ($pdo) {
            try {
                $stmt = $pdo->prepare("UPDATE usuarios SET TwoFactorSecret = ?, TwoFactorEnabled = 1 WHERE Email = ?");
                $stmt->execute([$secret, $email]);
            } catch (Exception $e) {}
        }

        echo json_encode([
            'status' => 'success',
            'secret' => $secret,
            'qr_code_url' => $qrUrl,
            'message' => 'Escanea este código QR con la app Google Authenticator en tu teléfono.'
        ]);
        break;

    case 'register':
        $nombre = trim($input['nombre'] ?? '');
        $email = trim($input['email'] ?? '');
        $password = trim($input['password'] ?? '');

        if ($nombre === '' || $email === '' || $password === '') {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Todos los campos son obligatorios.']);
            exit();
        }

        $userId = '1';
        if ($pdo) {
            try {
                // Verificar si ya existe
                $check = $pdo->prepare("SELECT UsuarioID FROM usuarios WHERE Email = ?");
                $check->execute([$email]);
                if ($check->fetch()) {
                    http_response_code(409);
                    echo json_encode(['status' => 'error', 'message' => 'El correo electrónico ya está registrado.']);
                    exit();
                }

                $hash = password_hash($password, PASSWORD_DEFAULT);
                $insert = $pdo->prepare("INSERT INTO usuarios (Nombre, Email, PasswordHash, Rol, Activo) VALUES (?, ?, ?, 'cliente', 1)");
                $insert->execute([$nombre, $email, $hash]);
                $userId = $pdo->lastInsertId();
            } catch (Exception $e) {}
        }

        echo json_encode([
            'status' => 'success',
            'message' => 'Cuenta creada exitosamente.',
            'user' => [
                'id' => $userId,
                'nombre' => $nombre,
                'email' => $email,
                'rol' => 'cliente'
            ]
        ]);
        break;

    case 'update_password':
        $userId = trim($input['id'] ?? '');
        $email = trim($input['email'] ?? '');
        $newPassword = trim($input['password'] ?? '');

        if ($newPassword === '' || strlen($newPassword) < 6) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'La contraseña debe tener al menos 6 caracteres.']);
            exit();
        }

        if ($pdo) {
            try {
                $hash = password_hash($newPassword, PASSWORD_DEFAULT);
                if ($userId !== '') {
                    $stmt = $pdo->prepare("UPDATE usuarios SET PasswordHash = ? WHERE UsuarioID = ?");
                    $stmt->execute([$hash, $userId]);
                } else if ($email !== '') {
                    $stmt = $pdo->prepare("UPDATE usuarios SET PasswordHash = ? WHERE Email = ?");
                    $stmt->execute([$hash, $email]);
                }
            } catch (Exception $e) {}
        }

        echo json_encode(['status' => 'success', 'message' => 'Contraseña actualizada correctamente.']);
        break;

    case 'notify_security_change':
        $targetEmail = trim($input['target_email'] ?? '');
        $operatorEmail = trim($input['operator_email'] ?? '');
        $clientIp = $_SERVER['REMOTE_ADDR'] ?? 'Desconocida';
        $currentTime = date('Y-m-d H:i:s');

        $to = 'jhanzeta@gmail.com';
        $subject = '=?UTF-8?B?' . base64_encode('🚨 [ALERTA DE SEGURIDAD PROBAKTRONIC] Modificación de Administrador Maestro') . '?=';
        $message = "ALERTA DE SEGURIDAD PROBAKTRONIC\n\n";
        $message .= "Se ha registrado una solicitud de cambio de credenciales/contraseña para la cuenta Administrador Maestro: " . $targetEmail . "\n\n";
        $message .= "Detalles del Evento:\n";
        $message .= "- Cuenta Afectada: " . $targetEmail . "\n";
        $message .= "- Operado por: " . $operatorEmail . "\n";
        $message .= "- Fecha y Hora: " . $currentTime . " (Servidor)\n";
        $message .= "- Dirección IP: " . $clientIp . "\n\n";
        $message .= "Si tú autorizaste este cambio, puedes ignorar este mensaje.\n";
        $message .= "Si NO fuiste tú, por favor ingresa inmediatamente a tu panel o servidor SiteGround para revertir el acceso y bloquear conexiones sospechosas.\n\n";
        $message .= "Sistema de Seguridad Probaktronic\nhttps://probaktronic.com";

        $headers = "From: seguridad@probaktronic.com\r\n";
        $headers .= "Reply-To: soporte@probaktronic.com\r\n";
        $headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";
        $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

        @mail($to, $subject, $message, $headers);

        echo json_encode([
            'status' => 'success',
            'message' => 'Alerta de seguridad enviada a jhanzeta@gmail.com'
        ]);
        break;

    case 'usuarios':
        // Listar usuarios (para panel de configuración / admin)
        $stmt = $pdo->query("SELECT UsuarioID, Nombre, Email, Rol, Activo, FechaCreacion, UltimoAcceso FROM usuarios ORDER BY UsuarioID DESC");
        echo json_encode(['status' => 'success', 'data' => $stmt->fetchAll()]);
        break;

    default:
        echo json_encode(['status' => 'error', 'message' => 'Acción no válida.']);
        break;
}
