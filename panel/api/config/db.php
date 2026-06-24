<?php
/**
 * Conexión PDO + lectura de configuración runtime.
 *
 * El loader de env (env.php en raíz del repo) ya definió DB_HOST / DB_PORT /
 * DB_NAME / DB_USER / DB_PASS / DB_CHARSET.
 */

date_default_timezone_set('America/Argentina/Buenos_Aires');

function db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $dsn = sprintf(
        'mysql:host=%s;port=%s;dbname=%s;charset=%s',
        DB_HOST, DB_PORT, DB_NAME, DB_CHARSET
    );

    try {
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
        $pdo->exec("SET time_zone = '-03:00'");
    } catch (PDOException $e) {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'ok'    => false,
            'error' => APP_ENV === 'production'
                ? 'Error de conexión a la base de datos.'
                : 'Error de conexión: ' . $e->getMessage(),
        ]);
        exit;
    }

    return $pdo;
}

function getConfigValue(string $clave, ?string $default = null): ?string
{
    static $cache = [];
    if (array_key_exists($clave, $cache)) {
        return $cache[$clave];
    }
    try {
        $stmt = db()->prepare('SELECT valor FROM configuracion WHERE clave = :clave LIMIT 1');
        $stmt->execute([':clave' => $clave]);
        $v = $stmt->fetchColumn();
        $cache[$clave] = ($v === false || $v === null) ? $default : (string) $v;
    } catch (Throwable $e) {
        $cache[$clave] = $default;
    }
    return $cache[$clave];
}
