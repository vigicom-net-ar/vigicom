<?php
/**
 * Listado del Migrador DB.
 *
 * GET /api/herramientas_migraciones_list.php
 *   → { database, env, items: [ {id, nombre, hash, tamano, aplicada, hash_drift, estado}, ... ] }
 *
 * Cruza los `.sql` del disco (`db/migrations/`) contra las filas de la
 * tabla `migraciones` de la BD del entorno actual, calculando drift
 * de hash cuando el archivo cambió después de aplicarse.
 */

require_once __DIR__ . '/bootstrap.php';
require_once dirname(__DIR__) . '/lib/migraciones.php';

requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_error('Método no permitido.', 405);
}

try {
    $pdo = db();
    asegurarTablaMigraciones($pdo);

    $database = (string) $pdo->query('SELECT DATABASE()')->fetchColumn();
    $env      = strtolower((string) (defined('APP_ENV') ? APP_ENV : 'unknown'));

    $dir = migracionesDir();
    $archivos = is_dir($dir) ? glob($dir . '/*.sql') : [];
    if (!is_array($archivos)) {
        $archivos = [];
    }
    sort($archivos, SORT_STRING);

    $stmt   = $pdo->query('SELECT id, nombre, hash, aplicada FROM migraciones');
    $mapDb  = [];
    foreach ($stmt->fetchAll() as $r) {
        $mapDb[(string) $r['nombre']] = $r;
    }

    $items = [];
    foreach ($archivos as $path) {
        $nombre    = basename($path);
        $contenido = file_get_contents($path);
        if ($contenido === false) {
            $contenido = '';
        }
        $hashActual = hash('sha256', $contenido);
        $tamano     = strlen($contenido);

        if (isset($mapDb[$nombre])) {
            $row      = $mapDb[$nombre];
            $hashDb   = $row['hash'] !== null ? (string) $row['hash'] : null;
            $items[] = [
                'id'         => (int) $row['id'],
                'nombre'     => $nombre,
                'hash'       => $hashActual,
                'tamano'     => $tamano,
                'aplicada'   => $row['aplicada'] !== null ? (string) $row['aplicada'] : null,
                'hash_drift' => ($hashDb !== null && $hashDb !== $hashActual),
                'estado'     => 'aplicada',
            ];
        } else {
            $items[] = [
                'id'         => null,
                'nombre'     => $nombre,
                'hash'       => $hashActual,
                'tamano'     => $tamano,
                'aplicada'   => null,
                'hash_drift' => false,
                'estado'     => 'pendiente',
            ];
        }
    }

    json_ok([
        'database' => $database,
        'env'      => $env,
        'items'    => $items,
    ]);
} catch (Throwable $e) {
    $msg = APP_ENV === 'production' ? 'Error del servidor.' : $e->getMessage();
    json_error($msg, 500);
}
