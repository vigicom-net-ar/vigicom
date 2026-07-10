<?php
/**
 * Disparo manual de una tarea del Programador.
 *
 *   POST /api/tareas_ejecutar.php  { tarea_id: N }
 *
 * Devuelve { ejecucion_id, pid }. El front usa `ejecucion_id` para
 * abrir el modal terminal y arrancar el streaming SSE.
 */

require_once __DIR__ . '/bootstrap.php';
require_once dirname(__DIR__) . '/lib/tareas.php';
require_once dirname(__DIR__) . '/lib/sucesos.php';

requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('Método no permitido.', 405);
}

try {
    $pdo    = db();
    $body   = tareaLeerBody();
    $tareaId = isset($body['tarea_id']) && ctype_digit((string) $body['tarea_id']) ? (int) $body['tarea_id'] : 0;
    if ($tareaId <= 0) { json_error('tarea_id inválido.', 422); }

    $tarea = tareaObtener($pdo, $tareaId);
    if (!$tarea) { json_error('Tarea no encontrada.', 404); }

    if (($tarea['overlap'] ?? 'skip') === 'skip') {
        $chk = $pdo->prepare("SELECT id FROM tareas_ejecuciones WHERE tarea_id = :id AND estado = 'corriendo' LIMIT 1");
        $chk->execute([':id' => $tareaId]);
        if ($chk->fetchColumn()) {
            json_response(['ok' => false, 'error' => 'ya_esta_corriendo',
                'detail' => 'La tarea ya tiene una ejecución en curso y su overlap es "skip".'], 409);
        }
    }

    $res = tareaDispararManual($pdo, $tarea);
    registrarSuceso($pdo, 'cron/tareas', 'info',
        'ejecución manual #' . $res['ejecucion_id'] . ' de "' . $tarea['nombre'] . '" (pid ' . $res['pid'] . ')');

    json_ok([
        'ejecucion_id' => (int) $res['ejecucion_id'],
        'pid'          => (int) $res['pid'],
        'error'        => $res['error'],
    ]);
} catch (Throwable $e) {
    $msg = APP_ENV === 'production' ? 'Error del servidor.' : $e->getMessage();
    json_error($msg, 500);
}
