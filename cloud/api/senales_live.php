<?php
/**
 * Feed liviano de señales para el monitor en tiempo real.
 *
 *   GET /api/senales_live.php?since_id=N&limit=20
 *
 * Devuelve las señales con id > since_id, ordenadas por id DESC, hasta
 * `limit` filas. No incluye KPIs ni COUNTs: pensado para polling agresivo
 * (100 ms) desde el modal "Monitor en tiempo real" del módulo Señales.
 *
 * Tabla: db/schema.sql -> `senales`.
 */

require_once __DIR__ . '/bootstrap.php';

requireAuth();

$pdo    = db();
$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET') {
    json_error('Método no permitido.', 405);
}

try {
    $sinceId = isset($_GET['since_id']) && ctype_digit((string) $_GET['since_id'])
        ? (int) $_GET['since_id']
        : 0;
    if ($sinceId < 0) {
        $sinceId = 0;
    }

    $limit = isset($_GET['limit']) && ctype_digit((string) $_GET['limit'])
        ? (int) $_GET['limit']
        : 20;
    if ($limit < 1 || $limit > 250) {
        $limit = 20;
    }

    $sql = 'SELECT id, fecha, sentido, propagacion, texto,
                   prioridad, intentos, procesada, estado
              FROM senales
             WHERE id > :since
             ORDER BY id DESC
             LIMIT ' . $limit;

    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(':since', $sinceId, PDO::PARAM_INT);
    $stmt->execute();
    $senales = $stmt->fetchAll();

    $lastId = $sinceId;
    foreach ($senales as $s) {
        $id = (int) $s['id'];
        if ($id > $lastId) {
            $lastId = $id;
        }
    }

    json_ok([
        'senales' => $senales,
        'last_id' => $lastId,
    ]);
} catch (Throwable $e) {
    $msg = APP_ENV === 'production' ? 'Error del servidor.' : $e->getMessage();
    json_error($msg, 500);
}
