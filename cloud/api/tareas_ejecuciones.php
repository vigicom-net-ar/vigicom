<?php
/**
 * Historial de ejecuciones del Programador de tareas.
 *
 *   GET  /api/tareas_ejecuciones.php?tarea_id=N&estado=&limite=  → listado del historial
 *   GET  /api/tareas_ejecuciones.php?id=N                        → detalle de una ejecución
 *   POST /api/tareas_ejecuciones.php   { id, accion:'detener' }  → matar el proceso
 */

require_once __DIR__ . '/bootstrap.php';
require_once dirname(__DIR__) . '/lib/tareas.php';

requireAuth();

$pdo    = db();
$method = $_SERVER['REQUEST_METHOD'];
$id     = isset($_GET['id']) && ctype_digit((string) $_GET['id']) ? (int) $_GET['id'] : 0;

try {
    if ($method === 'GET' && $id > 0) {
        $stmt = $pdo->prepare(
            'SELECT e.*, t.nombre AS tarea_nombre, t.script AS tarea_script,
                    t.cron_expr AS tarea_cron_expr, t.timeout_seg AS tarea_timeout
               FROM tareas_ejecuciones e
               JOIN tareas t ON t.id = e.tarea_id
              WHERE e.id = :id LIMIT 1'
        );
        $stmt->execute([':id' => $id]);
        $r = $stmt->fetch();
        if (!$r) { json_error('Ejecución no encontrada.', 404); }
        json_ok(ejecucionNormalizar($r));
    } elseif ($method === 'GET') {
        $tareaId = isset($_GET['tarea_id']) && ctype_digit((string) $_GET['tarea_id']) ? (int) $_GET['tarea_id'] : 0;
        $estado  = (string) ($_GET['estado'] ?? '');
        $limite  = isset($_GET['limite']) && ctype_digit((string) $_GET['limite']) ? (int) $_GET['limite'] : 200;
        if ($limite < 1)    { $limite = 200; }
        if ($limite > 2000) { $limite = 2000; }

        $where  = [];
        $params = [];
        if ($tareaId > 0) {
            $where[]           = 'e.tarea_id = :tarea';
            $params[':tarea']  = $tareaId;
        }
        if (in_array($estado, TAREAS_ESTADOS_EJ, true)) {
            $where[]            = 'e.estado = :estado';
            $params[':estado']  = $estado;
        }
        $sqlWhere = $where ? ('WHERE ' . implode(' AND ', $where)) : '';

        $sql = "SELECT e.*, t.nombre AS tarea_nombre
                  FROM tareas_ejecuciones e
                  JOIN tareas t ON t.id = e.tarea_id
                  {$sqlWhere}
                 ORDER BY e.id DESC
                 LIMIT {$limite}";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $items = array_map('ejecucionNormalizar', $stmt->fetchAll());
        json_ok(['items' => $items]);
    } elseif ($method === 'POST') {
        $body   = tareaLeerBody();
        $idBody = isset($body['id']) && ctype_digit((string) $body['id']) ? (int) $body['id'] : 0;
        $accion = (string) ($body['accion'] ?? '');

        if ($idBody <= 0)             { json_error('ID inválido.', 422); }
        if ($accion !== 'detener')    { json_error('Acción no soportada.', 400); }

        $stmt = $pdo->prepare(
            'SELECT e.*, t.nombre AS tarea_nombre
               FROM tareas_ejecuciones e
               JOIN tareas t ON t.id = e.tarea_id
              WHERE e.id = :id LIMIT 1'
        );
        $stmt->execute([':id' => $idBody]);
        $ej = $stmt->fetch();
        if (!$ej) { json_error('Ejecución no encontrada.', 404); }
        if ($ej['estado'] !== 'corriendo') {
            json_response(['ok' => false, 'error' => 'not_running',
                'detail' => 'La ejecución no está corriendo.'], 409);
        }

        $pid   = (int) ($ej['pid'] ?? 0);
        $muerto = false;
        if ($pid > 0 && function_exists('posix_kill')) {
            @posix_kill($pid, 15);
            for ($i = 0; $i < 20 && @posix_kill($pid, 0); $i++) {
                usleep(100_000);
            }
            if (@posix_kill($pid, 0)) {
                @posix_kill($pid, 9);
                usleep(200_000);
                $muerto = !@posix_kill($pid, 0);
            } else {
                $muerto = true;
            }
        }

        $mensaje = 'Detenido manualmente' . ($pid > 0 ? ' (pid ' . $pid . ')' : '');
        $upd = $pdo->prepare(
            "UPDATE tareas_ejecuciones
                SET fin = NOW(), estado = 'killed', exit_code = 143, mensaje = :m
              WHERE id = :id AND estado = 'corriendo'"
        );
        $upd->execute([':m' => $mensaje, ':id' => $idBody]);

        $updT = $pdo->prepare(
            "UPDATE tareas SET ultimo_estado = 'killed', ultimo_error = :m WHERE id = :id"
        );
        $updT->execute([':m' => $mensaje, ':id' => $ej['tarea_id']]);

        require_once dirname(__DIR__) . '/lib/sucesos.php';
        registrarSuceso($pdo, 'cron/tareas', 'alerta',
            'ejecución #' . $idBody . ' de "' . ($ej['tarea_nombre'] ?? '?') . '" detenida manualmente');

        json_ok(['killed' => $muerto]);
    } else {
        json_error('Método no permitido.', 405);
    }
} catch (Throwable $e) {
    $msg = APP_ENV === 'production' ? 'Error del servidor.' : $e->getMessage();
    json_error($msg, 500);
}
