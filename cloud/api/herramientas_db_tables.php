<?php
/**
 * Listado de tablas del Explorador DB.
 *
 * GET /api/herramientas_db_tables.php
 *   → { database, env, tablas: [ {nombre, filas_aprox, engine, comentario}, ... ] }
 *
 * Filtra únicamente BASE TABLE de la base activa (SELECT DATABASE()).
 * No enumera otras bases del servidor: el explorador es per-DB.
 */

require_once __DIR__ . '/bootstrap.php';
require_once dirname(__DIR__) . '/lib/db_explorer.php';

requireAuth();

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_error('Método no permitido.', 405);
}

try {
    $pdo = db();
    $database = dbexpDatabaseActual($pdo);
    $env      = strtolower((string) (defined('APP_ENV') ? APP_ENV : 'unknown'));

    $stmt = $pdo->prepare(
        'SELECT
            TABLE_NAME     AS nombre,
            TABLE_ROWS     AS filas_aprox,
            ENGINE         AS engine,
            TABLE_COMMENT  AS comentario
          FROM INFORMATION_SCHEMA.TABLES
         WHERE TABLE_SCHEMA = :db
           AND TABLE_TYPE   = ' . "'BASE TABLE'" . '
         ORDER BY TABLE_NAME ASC'
    );
    $stmt->execute([':db' => $database]);

    $tablas = [];
    foreach ($stmt->fetchAll() as $r) {
        $tablas[] = [
            'nombre'      => (string) $r['nombre'],
            'filas_aprox' => $r['filas_aprox'] === null ? null : (int) $r['filas_aprox'],
            'engine'      => $r['engine'] === null ? '' : (string) $r['engine'],
            'comentario'  => $r['comentario'] === null ? '' : (string) $r['comentario'],
        ];
    }

    json_ok([
        'database' => $database,
        'env'      => $env,
        'tablas'   => $tablas,
    ]);
} catch (Throwable $e) {
    $msg = APP_ENV === 'production' ? 'Error del servidor.' : $e->getMessage();
    json_error($msg, 500);
}
