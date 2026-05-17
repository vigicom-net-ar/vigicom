<?php
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';

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

function intentar_login(string $email, string $password): bool
{
    $stmt = db()->prepare(
        'SELECT id, nombre, email, password_hash, rol, activo
         FROM usuarios WHERE email = :email LIMIT 1'
    );
    $stmt->execute([':email' => $email]);
    $u = $stmt->fetch();

    if (!$u || !$u['activo']) {
        return false;
    }

    if (!password_verify($password, $u['password_hash'])) {
        return false;
    }

    $upd = db()->prepare('UPDATE usuarios SET ultimo_login = NOW() WHERE id = :id');
    $upd->execute([':id' => $u['id']]);

    $_SESSION['usuario'] = [
        'id'     => (int) $u['id'],
        'nombre' => $u['nombre'],
        'email'  => $u['email'],
        'rol'    => $u['rol'],
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
