<?php
/**
 * Pobla el desplegable "Script" del form de Alta/Edición de tareas.
 *
 *   GET /api/tareas_scripts_disponibles.php
 *     → { items: ["cloud/jobs/foo.php", ...] }
 *
 * Escanea cloud/jobs/ y descarta los archivos de infraestructura
 * (los que empiezan con `_`).
 */

require_once __DIR__ . '/bootstrap.php';
require_once dirname(__DIR__) . '/lib/tareas.php';

requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_error('Método no permitido.', 405);
}

try {
    $jobsDir = tareasJobsDirAbs();
    if (!is_dir($jobsDir)) {
        json_ok(['items' => []]);
    }

    $items = [];
    $entries = scandir($jobsDir) ?: [];
    foreach ($entries as $name) {
        if ($name === '.' || $name === '..') continue;
        if (str_starts_with($name, '_'))     continue;
        if (!str_ends_with($name, '.php'))   continue;
        $full = $jobsDir . '/' . $name;
        if (!is_file($full)) continue;
        $items[] = 'cloud/jobs/' . $name;
    }
    sort($items, SORT_NATURAL);
    json_ok(['items' => $items]);
} catch (Throwable $e) {
    $msg = APP_ENV === 'production' ? 'Error del servidor.' : $e->getMessage();
    json_error($msg, 500);
}
