<?php
/**
 * Runtime común de los jobs del Programador de tareas.
 *
 * Todo job de cloud/jobs/*.php arranca con:
 *
 *   require_once __DIR__ . '/_bootstrap.php';
 *   try {
 *       // trabajo real
 *       marcarEjecucionOk('resumen opcional');
 *   } catch (Throwable $e) {
 *       marcarEjecucionError($e);
 *       throw $e;
 *   }
 *
 * El scheduler pasa el id de la fila en `tareas_ejecuciones` vía
 * la variable de entorno EJECUCION_ID.
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit('jobs: solo por CLI');
}

// Line-buffering agresivo del stdout para que el streaming SSE del
// modal terminal muestre líneas apenas se emiten (sin esto PHP acumula
// en bloques de 4-8 KB y la terminal se ve congelada).
@ini_set('output_buffering', '0');
@ini_set('implicit_flush', '1');
ob_implicit_flush(true);
while (ob_get_level() > 0) {
    ob_end_flush();
}

require_once dirname(__DIR__, 2) . '/env.php';
require_once dirname(__DIR__) . '/api/config/db.php';
require_once dirname(__DIR__) . '/lib/sucesos.php';

$__ejecucionId = (int) (getenv('EJECUCION_ID') ?: 0);
$__cerrada     = false;

function ejecucionId(): int
{
    global $__ejecucionId;
    return (int) $__ejecucionId;
}

function jobNombre(): string
{
    $traza = debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS);
    $archivo = $traza && !empty($traza[count($traza) - 1]['file'])
        ? $traza[count($traza) - 1]['file']
        : ($_SERVER['SCRIPT_FILENAME'] ?? '');
    return basename((string) $archivo, '.php');
}

function anotarLog(string $linea): void
{
    echo '[' . date('H:i:s') . '] ' . $linea . PHP_EOL;
}

function _cerrarEjecucion(string $estado, int $exitCode, ?string $mensaje): void
{
    global $__ejecucionId, $__cerrada;
    if ($__cerrada) {
        return;
    }
    $__cerrada = true;
    if ($__ejecucionId <= 0) {
        return;
    }
    try {
        $pdo = db();

        $stmt = $pdo->prepare('SELECT estado, tarea_id FROM tareas_ejecuciones WHERE id = :id LIMIT 1');
        $stmt->execute([':id' => $__ejecucionId]);
        $fila = $stmt->fetch();
        if (!$fila) {
            return;
        }
        if ($fila['estado'] !== 'corriendo') {
            return;
        }

        $stmt = $pdo->prepare(
            'UPDATE tareas_ejecuciones
                SET fin = NOW(), estado = :estado, exit_code = :ec, mensaje = :msg
              WHERE id = :id'
        );
        $stmt->execute([
            ':estado' => $estado,
            ':ec'     => $exitCode,
            ':msg'    => $mensaje !== null ? mb_substr($mensaje, 0, 1000) : null,
            ':id'     => $__ejecucionId,
        ]);

        $stmt = $pdo->prepare(
            'UPDATE tareas
                SET ultimo_estado = :estado, ultimo_error = :err
              WHERE id = :id'
        );
        $stmt->execute([
            ':estado' => $estado,
            ':err'    => $estado === 'ok' ? null : ($mensaje !== null ? mb_substr($mensaje, 0, 1000) : null),
            ':id'     => (int) $fila['tarea_id'],
        ]);

        if ($estado !== 'ok') {
            registrarSuceso(
                $pdo,
                'cron/' . jobNombre(),
                $estado === 'error' ? 'error' : 'alerta',
                $mensaje ?? ('ejecución #' . $__ejecucionId . ' terminó ' . $estado)
            );
        }
    } catch (Throwable $e) {
        error_log('[bootstrap] fallo al cerrar ejecución ' . $__ejecucionId . ': ' . $e->getMessage());
    }
}

function marcarEjecucionOk(?string $mensaje = null): void
{
    _cerrarEjecucion('ok', 0, $mensaje);
}

function marcarEjecucionError(Throwable $e): void
{
    $msg = $e->getMessage() . ' @ ' . basename($e->getFile()) . ':' . $e->getLine();
    _cerrarEjecucion('error', 1, $msg);
}

// Handler de SIGTERM: cuando `timeout` de coreutils dispara al llegar
// a timeout_seg, PHP CLI muere sin correr el shutdown handler. Con
// pcntl instalado, esta captura cierra la fila de inmediato en vez de
// esperar al watchdog del scheduler (~1 min de latencia).
if (function_exists('pcntl_async_signals') && function_exists('pcntl_signal') && defined('SIGTERM')) {
    pcntl_async_signals(true);
    pcntl_signal(SIGTERM, function () {
        _cerrarEjecucion('timeout', 124, 'timeout: SIGTERM recibido');
        exit(143);
    });
}

// Última línea de defensa: fatales PHP.
register_shutdown_function(function () {
    global $__cerrada;
    if ($__cerrada) {
        return;
    }
    $err = error_get_last();
    if ($err === null) {
        // El job terminó sin llamar a marcarEjecucionOk/Error: lo
        // marcamos como error explícito para no dejar la fila en `corriendo`.
        _cerrarEjecucion('error', 1, 'job terminó sin marcar estado (falta marcarEjecucionOk/Error)');
        return;
    }
    $fatales = E_ERROR | E_PARSE | E_CORE_ERROR | E_COMPILE_ERROR | E_USER_ERROR;
    if (($err['type'] & $fatales) !== 0) {
        _cerrarEjecucion('error', 1, sprintf(
            'fatal: %s @ %s:%d',
            $err['message'] ?? '(sin mensaje)',
            basename($err['file'] ?? '?'),
            (int) ($err['line'] ?? 0)
        ));
    }
});
