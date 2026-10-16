<?php
header('Content-Type: application/json; charset=utf-8');

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Clave validada únicamente del lado del servidor (no expuesta en JS)
$ADMIN_PIN_SERVIDOR = getenv('GUARDIAS_ADMIN_PIN') ?: "SistemasHirs$$675";

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);
$pinIngresado = isset($data['pin']) ? trim((string)$data['pin']) : '';

if ($pinIngresado !== '' && hash_equals($ADMIN_PIN_SERVIDOR, $pinIngresado)) {
    $_SESSION['guardias_admin_auth'] = true;
    echo json_encode([
        'success' => true,
        'token'   => bin2hex(random_bytes(16))
    ]);
} else {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'PIN incorrecto'
    ]);
}
exit;
