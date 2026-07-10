<?php
/**
 * Helpers compartidos por los endpoints del Programador de tareas
 * (Herramientas > Programador de tareas).
 *
 * La fuente de verdad de qué corre y cuándo vive en las tablas
 * `tareas` y `tareas_ejecuciones`. Los archivos .log de cada
 * ejecución viven en `/var/log/vigicom/cloud/ejecuciones/<id>.log`
 * dentro del contenedor Apache.
 */

const TAREAS_LOG_DIR    = '/var/log/vigicom/cloud/ejecuciones';
const TAREAS_JOBS_DIR   = __DIR__ . '/../jobs';
const TAREAS_ESTADOS_EJ = ['corriendo', 'ok', 'error', 'timeout', 'killed'];
const TAREAS_OVERLAP    = ['skip', 'allow'];
const TAREAS_DISPARO    = ['scheduler', 'manual'];

function tareasRepoRoot(): string
{
    // cloud/lib -> raíz del monorepo
    return realpath(dirname(__DIR__, 2)) ?: dirname(__DIR__, 2);
}

function tareasJobsDirAbs(): string
{
    // cloud/lib -> cloud/jobs
    return realpath(dirname(__DIR__) . '/jobs') ?: (dirname(__DIR__) . '/jobs');
}

function tareaNormalizar(array $r): array
{
    return [
        'id'                 => (int) ($r['id'] ?? 0),
        'nombre'             => (string) ($r['nombre'] ?? ''),
        'descripcion'        => $r['descripcion'] !== null ? (string) $r['descripcion'] : null,
        'script'             => (string) ($r['script'] ?? ''),
        'cron_expr'          => (string) ($r['cron_expr'] ?? ''),
        'activo'             => (int) (!empty($r['activo']) ? 1 : 0),
        'overlap'            => in_array($r['overlap'] ?? '', TAREAS_OVERLAP, true) ? (string) $r['overlap'] : 'skip',
        'timeout_seg'        => (int) ($r['timeout_seg'] ?? 300),
        'retencion_dias'     => (int) ($r['retencion_dias'] ?? 7),
        'ultimo_run'         => $r['ultimo_run']    !== null ? (string) $r['ultimo_run']    : null,
        'ultimo_estado'      => $r['ultimo_estado'] !== null ? (string) $r['ultimo_estado'] : null,
        'ultimo_error'       => $r['ultimo_error']  !== null ? (string) $r['ultimo_error']  : null,
        'fecha_creacion'     => $r['fecha_creacion']     ?? null,
        'fecha_modificacion' => $r['fecha_modificacion'] ?? null,
    ];
}

function ejecucionNormalizar(array $r): array
{
    return [
        'id'            => (int) ($r['id'] ?? 0),
        'tarea_id'      => (int) ($r['tarea_id'] ?? 0),
        'tarea_nombre'  => isset($r['tarea_nombre']) ? (string) $r['tarea_nombre'] : null,
        'pid'           => $r['pid']       !== null && $r['pid'] !== '' ? (int) $r['pid'] : null,
        'inicio'        => $r['inicio']    !== null ? (string) $r['inicio']    : null,
        'fin'           => $r['fin']       !== null ? (string) $r['fin']       : null,
        'estado'        => in_array($r['estado'] ?? '', TAREAS_ESTADOS_EJ, true) ? (string) $r['estado'] : 'corriendo',
        'exit_code'     => $r['exit_code'] !== null && $r['exit_code'] !== '' ? (int) $r['exit_code'] : null,
        'mensaje'       => $r['mensaje']   !== null ? (string) $r['mensaje']   : null,
        'log_path'      => $r['log_path']  !== null ? (string) $r['log_path']  : null,
        'disparo'       => in_array($r['disparo'] ?? '', TAREAS_DISPARO, true) ? (string) $r['disparo'] : 'scheduler',
    ];
}

function tareaValidarPayload(array $body, bool $creando): array
{
    $errores = [];

    $nombre      = trim((string) ($body['nombre'] ?? ''));
    $descripcion = trim((string) ($body['descripcion'] ?? ''));
    $script      = trim((string) ($body['script'] ?? ''));
    $cronExpr    = trim((string) ($body['cron_expr'] ?? ''));
    $overlap     = (string) ($body['overlap'] ?? 'skip');
    $activo      = isset($body['activo']) ? (int) (!!$body['activo']) : 1;
    $timeout     = isset($body['timeout_seg']) ? (int) $body['timeout_seg'] : 300;
    $retencion   = isset($body['retencion_dias']) ? (int) $body['retencion_dias'] : 7;

    if ($nombre === '' || mb_strlen($nombre) > 120) {
        $errores['nombre'] = 'El nombre es obligatorio y debe tener hasta 120 caracteres.';
    }
    if ($descripcion !== '' && mb_strlen($descripcion) > 255) {
        $errores['descripcion'] = 'La descripción no puede tener más de 255 caracteres.';
    }
    if ($script === '' || mb_strlen($script) > 255 || !preg_match('/^[A-Za-z0-9_\/.\-]+\.php$/', $script)) {
        $errores['script'] = 'El script es obligatorio y debe ser una ruta .php válida.';
    }
    if ($cronExpr === '') {
        $errores['cron_expr'] = 'La expresión cron es obligatoria.';
    } else {
        $partes = preg_split('/\s+/', $cronExpr);
        if (!$partes || count($partes) !== 5) {
            $errores['cron_expr'] = 'La expresión cron debe tener exactamente 5 campos.';
        } else {
            foreach ($partes as $p) {
                if (!preg_match('/^[\d*,\/\-]+$/', $p)) {
                    $errores['cron_expr'] = 'Cada campo debe ser dígitos, asterisco, coma, guión o barra.';
                    break;
                }
            }
        }
    }
    if (!in_array($overlap, TAREAS_OVERLAP, true)) {
        $overlap = 'skip';
    }
    if ($timeout < 5)     { $timeout = 5; }
    if ($timeout > 86400) { $timeout = 86400; }
    if ($retencion < 1)    { $retencion = 1; }
    if ($retencion > 3650) { $retencion = 3650; }

    return [
        'errores' => $errores,
        'datos'   => [
            'nombre'         => $nombre,
            'descripcion'    => $descripcion !== '' ? $descripcion : null,
            'script'         => $script,
            'cron_expr'      => $cronExpr,
            'overlap'        => $overlap,
            'activo'         => $activo ? 1 : 0,
            'timeout_seg'    => $timeout,
            'retencion_dias' => $retencion,
        ],
    ];
}

function tareaLeerBody(): array
{
    $raw  = file_get_contents('php://input') ?: '';
    $body = json_decode($raw, true);
    return is_array($body) ? $body : [];
}

function tareaNombreDuplicado(PDO $pdo, string $nombre, int $excluirId = 0): bool
{
    $sql = 'SELECT id FROM tareas WHERE nombre = :n';
    if ($excluirId > 0) {
        $sql .= ' AND id <> :id';
    }
    $sql .= ' LIMIT 1';
    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(':n', $nombre);
    if ($excluirId > 0) {
        $stmt->bindValue(':id', $excluirId, PDO::PARAM_INT);
    }
    $stmt->execute();
    return (bool) $stmt->fetchColumn();
}

function tareaObtener(PDO $pdo, int $id): ?array
{
    $stmt = $pdo->prepare(
        'SELECT id, nombre, descripcion, script, cron_expr, activo, overlap,
                timeout_seg, retencion_dias, ultimo_run, ultimo_estado, ultimo_error,
                fecha_creacion, fecha_modificacion
           FROM tareas WHERE id = :id LIMIT 1'
    );
    $stmt->execute([':id' => $id]);
    $r = $stmt->fetch();
    return $r ? tareaNormalizar($r) : null;
}

/**
 * Dispara una tarea "ahora". Comparte técnica con el scheduler.
 * Devuelve el id de `tareas_ejecuciones` creado o 0 si falló antes de crear la fila.
 */
function tareaDispararManual(PDO $pdo, array $tarea): array
{
    @is_dir(TAREAS_LOG_DIR) || @mkdir(TAREAS_LOG_DIR, 0755, true);

    $ins = $pdo->prepare(
        "INSERT INTO tareas_ejecuciones (tarea_id, inicio, estado, disparo)
         VALUES (:id, NOW(), 'corriendo', 'manual')"
    );
    $ins->execute([':id' => $tarea['id']]);
    $ejecucionId = (int) $pdo->lastInsertId();

    $logPath = rtrim(TAREAS_LOG_DIR, '/') . '/' . $ejecucionId . '.log';

    $upd = $pdo->prepare('UPDATE tareas_ejecuciones SET log_path = :lp WHERE id = :id');
    $upd->execute([':lp' => $logPath, ':id' => $ejecucionId]);

    $updT = $pdo->prepare(
        "UPDATE tareas
            SET ultimo_run = NOW(), ultimo_estado = 'corriendo', ultimo_error = NULL
          WHERE id = :id"
    );
    $updT->execute([':id' => $tarea['id']]);

    $scriptRel = ltrim((string) $tarea['script'], '/');
    $scriptAbs = tareasRepoRoot() . '/' . $scriptRel;

    $encabezado =
        '── Ejecucion #' . $ejecucionId . ' de "' . $tarea['nombre'] . '" (' . $tarea['cron_expr'] . ') ──' . PHP_EOL .
        '── Script: ' . $scriptRel . ' ──' . PHP_EOL .
        '── Timeout: ' . (int) $tarea['timeout_seg'] . 's  |  Disparo: manual' .
                '  |  Inicio: ' . date('Y-m-d H:i:s') . ' ──' . PHP_EOL . PHP_EOL;
    @file_put_contents($logPath, $encabezado);

    if (!is_file($scriptAbs)) {
        $msg = 'script no encontrado: ' . $scriptRel;
        @file_put_contents($logPath, $msg . PHP_EOL, FILE_APPEND);
        $err = $pdo->prepare(
            "UPDATE tareas_ejecuciones
                SET fin = NOW(), estado = 'error', exit_code = 127, mensaje = :m
              WHERE id = :id"
        );
        $err->execute([':m' => $msg, ':id' => $ejecucionId]);
        $errT = $pdo->prepare(
            "UPDATE tareas SET ultimo_estado = 'error', ultimo_error = :m WHERE id = :id"
        );
        $errT->execute([':m' => $msg, ':id' => $tarea['id']]);
        return ['ejecucion_id' => $ejecucionId, 'pid' => 0, 'error' => $msg];
    }

    $timeout = max(5, (int) $tarea['timeout_seg']);
    $cmd = sprintf(
        'EJECUCION_ID=%d timeout --signal=TERM --kill-after=10s %ds ' .
        'stdbuf -oL -eL php %s >> %s 2>&1 & echo $!',
        $ejecucionId,
        $timeout,
        escapeshellarg($scriptAbs),
        escapeshellarg($logPath)
    );
    $pid = (int) trim((string) shell_exec($cmd));

    if ($pid > 0) {
        $updPid = $pdo->prepare('UPDATE tareas_ejecuciones SET pid = :pid WHERE id = :id');
        $updPid->execute([':pid' => $pid, ':id' => $ejecucionId]);
    }
    return ['ejecucion_id' => $ejecucionId, 'pid' => $pid, 'error' => null];
}
