<?php
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';

const CRIPTO_CLAVE_DEFECTO = '0123456789';

function cripto_encriptar(string $cadena, string $clave = ''): string
{
    if ($clave === '') {
        $clave = CRIPTO_CLAVE_DEFECTO;
    }
    $resultado = '';
    $len_clave = strlen($clave);
    for ($i = 0, $n = strlen($cadena); $i < $n; $i++) {
        $char    = $cadena[$i];
        $keychar = substr($clave, ($i % $len_clave) - 1, 1);
        $resultado .= chr(ord($char) + ord($keychar));
    }
    return base64_encode($resultado);
}

function cripto_desencriptar(string $cadena, string $clave = ''): string
{
    if ($clave === '') {
        $clave = CRIPTO_CLAVE_DEFECTO;
    }
    $cadena    = base64_decode($cadena, true);
    if ($cadena === false) {
        return '';
    }
    $resultado = '';
    $len_clave = strlen($clave);
    for ($i = 0, $n = strlen($cadena); $i < $n; $i++) {
        $char    = $cadena[$i];
        $keychar = substr($clave, ($i % $len_clave) - 1, 1);
        $resultado .= chr(ord($char) - ord($keychar));
    }
    return $resultado;
}

function usuario_actual(): ?array
{
    return $_SESSION['usuario'] ?? null;
}

function requerir_login(): void
{
    if (!usuario_actual()) {
        header('Location: /login.php');
        exit;
    }
}

function intentar_login(string $correo, string $password): bool
{
    $stmt = db()->prepare(
        'SELECT id, nombre, correo, contrasena, roles, estado
         FROM usuarios
         WHERE correo = :correo
         LIMIT 1'
    );
    $stmt->execute([':correo' => $correo]);
    $u = $stmt->fetch();

    if (!$u) {
        return false;
    }

    if ($u['estado'] !== null && (int) $u['estado'] === 0) {
        return false;
    }

    $almacenada = (string) ($u['contrasena'] ?? '');
    if ($almacenada === '') {
        return false;
    }

    $descifrada = cripto_desencriptar($almacenada);
    if (!hash_equals($descifrada, $password)) {
        return false;
    }

    $_SESSION['usuario'] = [
        'id'     => (int) $u['id'],
        'nombre' => $u['nombre'],
        'correo' => $u['correo'],
        'roles'  => (string) ($u['roles'] ?? ''),
    ];

    return true;
}

function cerrar_sesion(): void
{
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'], $p['secure'], $p['httponly']);
    }
    session_destroy();
}

function csrf_token(): string
{
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf'];
}

function csrf_validar(?string $token): bool
{
    return !empty($_SESSION['csrf']) && is_string($token) && hash_equals($_SESSION['csrf'], $token);
}

function e(?string $s): string
{
    return htmlspecialchars((string) $s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
