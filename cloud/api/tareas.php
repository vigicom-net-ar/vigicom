<?php
/**
 * CRUD del catálogo del Programador de tareas.
 *
 *   GET    /api/tareas.php                → { items, stats: { total, activas, errores, corriendo } }
 *   GET    /api/tareas.php?id=N           → tarea individual
 *   POST   /api/tareas.php                → crear (body JSON)
 *   PUT    /api/tareas.php                → actualizar (body JSON con id)
 *   DELETE /api/tareas.php?id=N           → borrado en cascada (fila + ejecuciones + .log)
 */

require_once __DIR__ . '/bootstrap.php';
require_once dirname(__DIR__) . '/lib/tareas.php';

requireAuth();

$pdo    = db();
$method = $_SERVER['REQUEST_METHOD'];
$id     = isset($_GET['id']) && ctype_digit((string) $_GET['id']) ? (int) $_GET['id'] : 0;

try {
    switch ($method) {

        case 'GET':
            if ($id > 0) {
                $r = tareaObtener($pdo, $id);
                if (!$r) { json_error('Tarea no encontrada.', 404); }
                json_ok($r);
            }
            json_ok(tareas_listar($pdo, $_GET));
            break;

        case 'POST':
            $body = tareaLeerBody();
            $val  = tareaValidarPayload($body, true);
            if ($val['errores']) { json_error('Datos inválidos.', 422); }
            $datos = $val['datos'];

            if (tareaNombreDuplicado($pdo, $datos['nombre'])) {
                json_response(['ok' => false, 'error' => 'nombre_duplicado',
                    'detail' => 'Ya existe una tarea con ese nombre.'], 409);
            }
            $stmt = $pdo->prepare(
                'INSERT INTO tareas (nombre, descripcion, script, cron_expr, activo, overlap, timeout_seg, retencion_dias)
                 VALUES (:nombre, :descripcion, :script, :cron, :activo, :overlap, :timeout, :retencion)'
            );
            $stmt->execute([
                ':nombre'      => $datos['nombre'],
                ':descripcion' => $datos['descripcion'],
                ':script'      => $datos['script'],
                ':cron'        => $datos['cron_expr'],
                ':activo'      => $datos['activo'],
                ':overlap'     => $datos['overlap'],
                ':timeout'     => $datos['timeout_seg'],
                ':retencion'   => $datos['retencion_dias'],
            ]);
            $newId = (int) $pdo->lastInsertId();
            json_ok(tareaObtener($pdo, $newId));
            break;

        case 'PUT':
            $body   = tareaLeerBody();
            $idBody = isset($body['id']) && ctype_digit((string) $body['id']) ? (int) $body['id'] : 0;
            if ($idBody <= 0) { json_error('ID inválido.', 422); }
            $existe = tareaObtener($pdo, $idBody);
            if (!$existe) { json_error('Tarea no encontrada.', 404); }

            $val = tareaValidarPayload($body, false);
            if ($val['errores']) { json_error('Datos inválidos.', 422); }
            $datos = $val['datos'];

            if (tareaNombreDuplicado($pdo, $datos['nombre'], $idBody)) {
                json_response(['ok' => false, 'error' => 'nombre_duplicado',
                    'detail' => 'Ya existe otra tarea con ese nombre.'], 409);
            }
            $stmt = $pdo->prepare(
                'UPDATE tareas
                    SET nombre = :nombre, descripcion = :descripcion, script = :script,
                        cron_expr = :cron, activo = :activo, overlap = :overlap,
                        timeout_seg = :timeout, retencion_dias = :retencion
                  WHERE id = :id'
            );
            $stmt->execute([
                ':nombre'      => $datos['nombre'],
                ':descripcion' => $datos['descripcion'],
                ':script'      => $datos['script'],
                ':cron'        => $datos['cron_expr'],
                ':activo'      => $datos['activo'],
                ':overlap'     => $datos['overlap'],
                ':timeout'     => $datos['timeout_seg'],
                ':retencion'   => $datos['retencion_dias'],
                ':id'          => $idBody,
            ]);
            json_ok(tareaObtener($pdo, $idBody));
            break;

        case 'DELETE':
            if ($id <= 0) { json_error('ID inválido.', 422); }
            $existe = tareaObtener($pdo, $id);
            if (!$existe) { json_error('Tarea no encontrada.', 404); }

            $chk = $pdo->prepare("SELECT COUNT(*) FROM tareas_ejecuciones WHERE tarea_id = :id AND estado = 'corriendo'");
            $chk->execute([':id' => $id]);
            if ((int) $chk->fetchColumn() > 0) {
                json_response(['ok' => false, 'error' => 'ejecucion_en_curso',
                    'detail' => 'La tarea tiene una ejecución en curso. Detenela desde el historial antes de eliminarla.'], 409);
            }

            $logs = $pdo->prepare('SELECT log_path FROM tareas_ejecuciones WHERE tarea_id = :id AND log_path IS NOT NULL');
            $logs->execute([':id' => $id]);
            $archivosBorrados = 0;
            foreach ($logs->fetchAll() as $r) {
                $lp = (string) ($r['log_path'] ?? '');
                if ($lp !== '' && is_file($lp) && @unlink($lp)) {
                    $archivosBorrados++;
                }
            }

            $pdo->prepare('DELETE FROM tareas_ejecuciones WHERE tarea_id = :id')->execute([':id' => $id]);
            $del = $pdo->prepare('DELETE FROM tareas WHERE id = :id');
            $del->execute([':id' => $id]);
            json_ok(['borrados' => (int) $del->rowCount(), 'archivos_borrados' => $archivosBorrados]);
            break;

        default:
            json_error('Método no permitido.', 405);
    }
} catch (Throwable $e) {
    $msg = APP_ENV === 'production' ? 'Error del servidor.' : $e->getMessage();
    json_error($msg, 500);
}

function tareas_listar(PDO $pdo, array $opts): array
{
    $q       = trim((string) ($opts['q']       ?? ''));
    $activo  = (string) ($opts['activo'] ?? '');
    $codigo  = isset($opts['codigo']) && ctype_digit((string) $opts['codigo']) ? (int) $opts['codigo'] : 0;
    $limite  = isset($opts['limite']) && ctype_digit((string) $opts['limite']) ? (int) $opts['limite'] : 100;
    if ($limite < 1)    { $limite = 100; }
    if ($limite > 1000) { $limite = 1000; }

    $ordenWhitelist = ['id', 'nombre', 'ultimo_run', 'fecha_modificacion'];
    $orden = in_array($opts['orden'] ?? '', $ordenWhitelist, true) ? (string) $opts['orden'] : 'id';
    $dir   = strtolower((string) ($opts['dir'] ?? 'desc')) === 'asc' ? 'ASC' : 'DESC';

    $where  = [];
    $params = [];

    if ($q !== '') {
        $where[]       = '(nombre LIKE :s1 OR script LIKE :s2 OR descripcion LIKE :s3 OR cron_expr LIKE :s4)';
        $like          = '%' . $q . '%';
        $params[':s1'] = $like;
        $params[':s2'] = $like;
        $params[':s3'] = $like;
        $params[':s4'] = $like;
    }
    if ($activo === '0' || $activo === '1') {
        $where[]          = 'activo = :activo';
        $params[':activo'] = (int) $activo;
    }
    if ($codigo > 0) {
        $where[]           = 'id = :codigo';
        $params[':codigo'] = $codigo;
    }
    $sqlWhere = $where ? ('WHERE ' . implode(' AND ', $where)) : '';

    $sql  = "SELECT id, nombre, descripcion, script, cron_expr, activo, overlap,
                    timeout_seg, retencion_dias, ultimo_run, ultimo_estado, ultimo_error,
                    fecha_creacion, fecha_modificacion
               FROM tareas
               {$sqlWhere}
              ORDER BY {$orden} {$dir}
              LIMIT {$limite}";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $items = array_map('tareaNormalizar', $stmt->fetchAll());

    $stats = $pdo->query(
        "SELECT
             COUNT(*) AS total,
             SUM(activo = 1) AS activas,
             SUM(ultimo_estado IN ('error','timeout','killed')) AS errores,
             SUM(ultimo_estado = 'corriendo') AS corriendo
         FROM tareas"
    )->fetch();

    return [
        'items' => $items,
        'stats' => [
            'total'     => (int) ($stats['total']     ?? 0),
            'activas'   => (int) ($stats['activas']   ?? 0),
            'errores'   => (int) ($stats['errores']   ?? 0),
            'corriendo' => (int) ($stats['corriendo'] ?? 0),
        ],
    ];
}
