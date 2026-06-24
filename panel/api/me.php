<?php
require_once __DIR__ . '/bootstrap.php';
$user = requireAuth();

json_ok([
    'id'     => $user['sub']    ?? null,
    'nombre' => $user['nombre'] ?? '',
    'correo' => $user['correo'] ?? '',
    'roles'  => $user['roles']  ?? '',
]);
