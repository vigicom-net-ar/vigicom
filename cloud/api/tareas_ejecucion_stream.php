<?php
/**
 * Streaming SSE del log de una ejecución del Programador de tareas.
 *
 *   GET /api/tareas_ejecucion_stream.php?id=N
 *
 * Emite cada línea del archivo `log_path` a medida que aparece. Cierra
 * el stream con `event: end\ndata: <estado>` cuando la fila cambia de
 * `corriendo` a un estado final.
 */

require_once __DIR__ . '/bootstrap.php';

requireAuth();

$id = isset($_GET['id']) && ctype_digit((string) $_GET['id']) ? (int) $_GET['id'] : 0;
if ($id <= 0) { json_error('ID inválido.', 422); }

$pdo  = db();
$stmt = $pdo->prepare('SELECT id, estado, log_path FROM tareas_ejecuciones WHERE id = :id LIMIT 1');
$stmt->execute([':id' => $id]);
$ej = $stmt->fetch();
if (!$ej) { json_error('Ejecución no encontrada.', 404); }

@set_time_limit(0);
ignore_user_abort(false);
while (ob_get_level() > 0) { ob_end_flush(); }
ob_implicit_flush(true);

header('Content-Type: text/event-stream; charset=utf-8');
header('Cache-Control: no-cache, no-transform');
header('X-Accel-Buffering: no');
header('Connection: keep-alive');

echo "retry: 5000\n\n";
@flush();

$logPath = (string) ($ej['log_path'] ?? '');
$MAX_LINE = 8192;

if ($logPath === '' || !is_file($logPath)) {
    emitirDatos('(log no disponible: archivo rotado o aún no creado)');
    emitirFin($ej['estado']);
    exit;
}

$fp = @fopen($logPath, 'rb');
if (!$fp) {
    emitirDatos('(no se pudo abrir el log)');
    emitirFin($ej['estado']);
    exit;
}
@stream_set_blocking($fp, false);

$buffer      = '';
$ultimoCheck = 0;
$estadoActual = (string) $ej['estado'];

while (!connection_aborted()) {
    $chunk = fread($fp, 8192);
    if ($chunk !== '' && $chunk !== false) {
        $buffer .= $chunk;
        while (($pos = strpos($buffer, "\n")) !== false) {
            $linea  = substr($buffer, 0, $pos);
            $buffer = substr($buffer, $pos + 1);
            if (strlen($linea) > $MAX_LINE) {
                $linea = substr($linea, 0, $MAX_LINE) . ' …[truncado]';
            }
            emitirDatos($linea);
        }
        continue;
    }

    if ((time() - $ultimoCheck) >= 2) {
        $ultimoCheck = time();
        try {
            $s = $pdo->prepare('SELECT estado FROM tareas_ejecuciones WHERE id = :id LIMIT 1');
            $s->execute([':id' => $id]);
            $estadoActual = (string) ($s->fetchColumn() ?: $estadoActual);
        } catch (Throwable $e) {
            // sigue con el estado que teníamos
        }
        if ($estadoActual !== 'corriendo') {
            $chunk = fread($fp, 65536);
            if ($chunk !== '' && $chunk !== false) { $buffer .= $chunk; }
            if ($buffer !== '') { emitirDatos(rtrim($buffer, "\n")); $buffer = ''; }
            emitirFin($estadoActual);
            fclose($fp);
            exit;
        }
        echo ": keepalive\n\n";
        @flush();
    }
    usleep(500_000);
}

fclose($fp);

function emitirDatos(string $linea): void
{
    $linea = str_replace(["\r\n", "\r"], "\n", $linea);
    foreach (explode("\n", $linea) as $l) {
        echo 'data: ' . $l . "\n";
    }
    echo "\n";
    @flush();
}

function emitirFin(string $estado): void
{
    echo "event: end\n";
    echo 'data: ' . $estado . "\n\n";
    @flush();
}
