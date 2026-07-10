<?php
/**
 * Scheduler minutal del Programador de tareas.
 *
 * Lo invoca cron cada minuto. Debe:
 *   1. Barrer huérfanos (watchdog).
 *   2. Leer las tareas activas.
 *   3. Evaluar cron_expr contra "ahora".
 *   4. Disparar las tareas que matchean en background.
 *
 * Sale en menos de 1 segundo. Los jobs corren desacoplados (nohup + &).
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit('scheduler: solo por CLI');
}

require_once dirname(__DIR__, 2) . '/env.php';
require_once dirname(__DIR__) . '/api/config/db.php';
require_once dirname(__DIR__) . '/lib/sucesos.php';

$LOG_DIR   = '/var/log/vigicom/cloud/ejecuciones';
$JOBS_DIR  = __DIR__;
$REPO_ROOT = dirname(__DIR__, 2);

@is_dir($LOG_DIR) || @mkdir($LOG_DIR, 0755, true);

$pdo = db();

/* ---------- 1. Watchdog: barrer huérfanos ---------- */

try {
    $stmt = $pdo->query(
        "SELECT e.id, e.tarea_id, e.pid, e.inicio, t.timeout_seg, t.nombre
           FROM tareas_ejecuciones e
           JOIN tareas t ON t.id = e.tarea_id
          WHERE e.estado = 'corriendo'"
    );
    foreach ($stmt->fetchAll() as $row) {
        $edad     = time() - strtotime((string) $row['inicio']);
        $timeout  = (int) $row['timeout_seg'];
        $limite   = $timeout > 0 ? $timeout * 2 : 600;
        if ($edad < $limite) {
            continue;
        }

        $pid = (int) ($row['pid'] ?? 0);
        if ($pid > 0 && function_exists('posix_kill')) {
            if (@posix_kill($pid, 0)) {
                @posix_kill($pid, 9);
            }
        }
        $mensaje = sprintf('watchdog: killed after %ds (timeout %ds)', $edad, $timeout);
        $upd = $pdo->prepare(
            "UPDATE tareas_ejecuciones
                SET fin = NOW(), estado = 'killed', exit_code = 137, mensaje = :m
              WHERE id = :id AND estado = 'corriendo'"
        );
        $upd->execute([':m' => $mensaje, ':id' => $row['id']]);

        $upd2 = $pdo->prepare(
            "UPDATE tareas SET ultimo_estado = 'killed', ultimo_error = :m WHERE id = :id"
        );
        $upd2->execute([':m' => $mensaje, ':id' => $row['tarea_id']]);

        registrarSuceso($pdo, 'cron/scheduler', 'alerta',
            'watchdog mató ejecución #' . $row['id'] . ' de "' . $row['nombre'] . '" (' . $mensaje . ')');
        fwrite(STDERR, '[scheduler] watchdog: ejecución #' . $row['id'] . ' → killed' . PHP_EOL);
    }
} catch (Throwable $e) {
    fwrite(STDERR, '[scheduler] watchdog error: ' . $e->getMessage() . PHP_EOL);
}

/* ---------- 2. Leer tareas activas ---------- */

$tareas = [];
try {
    $stmt = $pdo->query(
        'SELECT id, nombre, script, cron_expr, overlap, timeout_seg
           FROM tareas
          WHERE activo = 1'
    );
    $tareas = $stmt->fetchAll();
} catch (Throwable $e) {
    fwrite(STDERR, '[scheduler] error leyendo tareas: ' . $e->getMessage() . PHP_EOL);
    exit(0);
}

$ahora = new DateTime('now');

foreach ($tareas as $t) {
    try {
        if (!cronMatch((string) $t['cron_expr'], $ahora)) {
            continue;
        }
        if (($t['overlap'] ?? 'skip') === 'skip') {
            $chk = $pdo->prepare(
                "SELECT id FROM tareas_ejecuciones
                  WHERE tarea_id = :id AND estado = 'corriendo' LIMIT 1"
            );
            $chk->execute([':id' => $t['id']]);
            if ($chk->fetchColumn()) {
                fwrite(STDERR, '[scheduler] skip: "' . $t['nombre'] . '" ya está corriendo' . PHP_EOL);
                continue;
            }
        }
        dispararTarea($pdo, $t, 'scheduler', $LOG_DIR, $REPO_ROOT);
    } catch (Throwable $e) {
        fwrite(STDERR, '[scheduler] error disparando "' . ($t['nombre'] ?? '?') . '": ' . $e->getMessage() . PHP_EOL);
    }
}

exit(0);

/* ---------- Helpers ---------- */

function dispararTarea(PDO $pdo, array $tarea, string $disparo, string $logDir, string $repoRoot): int
{
    $ins = $pdo->prepare(
        "INSERT INTO tareas_ejecuciones (tarea_id, inicio, estado, disparo)
         VALUES (:id, NOW(), 'corriendo', :disparo)"
    );
    $ins->execute([':id' => $tarea['id'], ':disparo' => $disparo]);
    $ejecucionId = (int) $pdo->lastInsertId();

    $logPath = rtrim($logDir, '/') . '/' . $ejecucionId . '.log';

    $upd = $pdo->prepare('UPDATE tareas_ejecuciones SET log_path = :lp WHERE id = :id');
    $upd->execute([':lp' => $logPath, ':id' => $ejecucionId]);

    $updT = $pdo->prepare(
        "UPDATE tareas
            SET ultimo_run = NOW(), ultimo_estado = 'corriendo', ultimo_error = NULL
          WHERE id = :id"
    );
    $updT->execute([':id' => $tarea['id']]);

    $scriptRel = ltrim((string) $tarea['script'], '/');
    $scriptAbs = $repoRoot . '/' . $scriptRel;

    $encabezado =
        '── Ejecucion #' . $ejecucionId . ' de "' . $tarea['nombre'] . '" (' . $tarea['cron_expr'] . ') ──' . PHP_EOL .
        '── Script: ' . $scriptRel . ' ──' . PHP_EOL .
        '── Timeout: ' . (int) $tarea['timeout_seg'] . 's  |  Disparo: ' . $disparo .
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
        registrarSuceso($pdo, 'cron/scheduler', 'error', $msg . ' (tarea "' . $tarea['nombre'] . '")');
        return 0;
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
    return $ejecucionId;
}

/**
 * Evalúa una expresión cron de 5 campos contra un DateTime.
 * Soporta asterisco, N exacto, asterisco/N, N-M, y listas N,M.
 * No soporta nombres (JAN/MON), ? , L ni #.
 */
function cronMatch(string $expr, DateTime $dt): bool
{
    $partes = preg_split('/\s+/', trim($expr));
    if (!$partes || count($partes) !== 5) {
        return false;
    }
    $valores = [
        (int) $dt->format('i'),
        (int) $dt->format('G'),
        (int) $dt->format('j'),
        (int) $dt->format('n'),
        (int) $dt->format('w'),
    ];
    $rangos = [[0, 59], [0, 23], [1, 31], [1, 12], [0, 6]];
    for ($i = 0; $i < 5; $i++) {
        if (!cronCampoMatch($partes[$i], $valores[$i], $rangos[$i][0], $rangos[$i][1])) {
            return false;
        }
    }
    return true;
}

function cronCampoMatch(string $campo, int $valor, int $min, int $max): bool
{
    foreach (explode(',', $campo) as $token) {
        $token = trim($token);
        if ($token === '') {
            continue;
        }
        $step = 1;
        if (strpos($token, '/') !== false) {
            [$token, $stepStr] = explode('/', $token, 2);
            $step = max(1, (int) $stepStr);
        }
        if ($token === '*' || $token === '') {
            $desde = $min;
            $hasta = $max;
        } elseif (strpos($token, '-') !== false) {
            [$a, $b] = explode('-', $token, 2);
            $desde = (int) $a;
            $hasta = (int) $b;
        } else {
            $desde = (int) $token;
            $hasta = (int) $token;
        }
        if ($desde < $min || $hasta > $max || $desde > $hasta) {
            continue;
        }
        if ($valor < $desde || $valor > $hasta) {
            continue;
        }
        if ((($valor - $desde) % $step) === 0) {
            return true;
        }
    }
    return false;
}
