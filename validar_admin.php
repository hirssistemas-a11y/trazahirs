
<?php
header('Content-Type: application/json; charset=utf-8');

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Clave de administrador resguardada en el backend
$ADMIN_PIN_CORRECTO = "SistemasHirs$$675";

$input = json_decode(file_get_contents('php://input'), true);
$pinIngresado = trim($input['pin'] ?? '');

if ($pinIngresado !== '' && $pinIngresado === $ADMIN_PIN_CORRECTO) {
    $_SESSION['is_admin_guardias'] = true;
    echo json_encode(['success' => true, 'token' => bin2hex(random_bytes(16))]);
} else {
    echo json_encode(['success' => false, 'message' => 'PIN incorrecto']);
}
exit;
