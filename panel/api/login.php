<?php
require_once __DIR__ . '/bootstrap.php';
require_once dirname(__DIR__) . '/lib/crypto.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('Método no permitido.', 405);
}

$raw  = file_get_contents('php://input') ?: '';
$body = json_decode($raw, true);
if (!is_array($body)) {
    $body = $_POST;
}

$email = trim((string) ($body['email']    ?? ''));
$pass  = (string)        ($body['password'] ?? '');

if ($email === '' || $pass === '') {
    json_error('Ingresá email y contraseña.', 422);
}

$stmt = db()->prepare(
    'SELECT id, nombre, correo, contrasena, roles, estado
       FROM usuarios
      WHERE correo = :correo
      LIMIT 1'
);
$stmt->execute([':correo' => $email]);
$u = $stmt->fetch();

if (!$u || ($u['estado'] !== null && (int) $u['estado'] === 0)) {
    json_error('Credenciales inválidas.', 401);
}

$almacenada = (string) ($u['contrasena'] ?? '');
$descifrada = $almacenada === '' ? '' : cripto_desencriptar($almacenada);
if (!hash_equals($descifrada, $pass)) {
    json_error('Credenciales inválidas.', 401);
}

$token = jwt_sign([
    'sub'    => (int) $u['id'],
    'nombre' => $u['nombre'],
    'correo' => $u['correo'],
    'roles'  => (string) ($u['roles'] ?? ''),
], JWT_TTL);

jwt_cookie_set($token);
json_ok([
    'id'     => (int) $u['id'],
    'nombre' => $u['nombre'],
    'correo' => $u['correo'],
    'roles'  => (string) ($u['roles'] ?? ''),
]);
