<?php
/**
 * Monitor SSE del canal MQTT de un transceptor.
 *
 *   GET /api/transceptores_monitor.php?id=N
 *
 * Se suscribe al topic `transmision_entrada` del transceptor #N y streamea
 * en tiempo real cada mensaje recibido como Server-Sent Events. Cada mensaje
 * se emite como una línea `data: {json}` con `{ts, topic, payload}`, así el
 * cliente lo puede pintar con timestamp local en el modal de monitor.
 *
 * Se cierra automáticamente si:
 *   - El browser cierra la conexión (`connection_aborted()`).
 *   - Se alcanza el timeout de vida máxima ($MAX_VIDA_SEG) — safety valve
 *     por si algún proxy o Apache pierden la detección de cierre.
 *
 * El helper de conexión vive en cloud/lib/mqtt.php. Este endpoint sólo se
 * encarga del framing SSE + resolver los headers de Apache.
 */

require_once __DIR__ . '/bootstrap.php';
require_once dirname(__DIR__) . '/lib/mqtt.php';

use PhpMqtt\Client\Exceptions\MqttClientException;

requireAuth();

$id = isset($_GET['id']) && ctype_digit((string) $_GET['id']) ? (int) $_GET['id'] : 0;
if ($id <= 0) {
    json_error('ID de transceptor inválido.', 422);
}

$pdo = db();
try {
    $t = mqttTransceptorPorId($pdo, $id);
} catch (Throwable $e) {
    json_error($e->getMessage(), 404);
}

// `transmision_entrada` puede tener uno o varios filtros MQTT separados por
// coma (ej: "IN/#,UP/#"). La coma no es válida dentro de un topic MQTT: hay
// que splitear y suscribirse a cada uno por separado, si no el broker cierra
// la conexión con EOF apenas recibe el SUBSCRIBE.
$topicsRaw = (string) ($t['transmision_entrada'] ?? '');
$topics    = array_values(array_filter(array_map('trim', explode(',', $topicsRaw)), 'strlen'));
if (!$topics) {
    json_error('El transceptor no tiene topic de entrada configurado.', 422);
}

// --- Headers SSE + config del proceso PHP ---------------------------------

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

// --- Conexión al broker + loop principal ----------------------------------

$MAX_VIDA_SEG   = 30 * 60;   // corte defensivo tras 30 min conectado
$KEEPALIVE_SEG  = 15;        // comentario SSE cada 15s por si hay proxies

sseInfo("Conectando a {$t['host']}:{$t['transmision_puerto']} …");

try {
    $client = mqttCliente($t, 'vigicom-monitor');
} catch (Throwable $e) {
    sseError('No se pudo conectar al broker: ' . $e->getMessage());
    sseFin('error');
    exit;
}

$topicsPretty = implode(', ', $topics);
sseInfo("Conectado. Suscribiendo a «{$topicsPretty}» (QoS 0)…");

$handler = static function (string $t, string $msg): void {
    sseMensaje($t, $msg);
};

try {
    foreach ($topics as $filtro) {
        $client->subscribe($filtro, $handler, 0);
    }
} catch (Throwable $e) {
    sseError('No se pudo suscribir: ' . $e->getMessage());
    try { $client->disconnect(); } catch (Throwable $ignored) {}
    sseFin('error');
    exit;
}

sseInfo('Suscripción activa. Esperando mensajes en vivo…');

$inicio     = time();
$ultimoPing = time();

try {
    while (true) {
        // loopOnce: procesa keepalives MQTT, lee del socket y dispara los
        // callbacks de subscribe si llegaron mensajes. allowSleep=true hace
        // un usleep chico si no hay data, así no comemos CPU.
        try {
            $client->loopOnce(microtime(true), true);
        } catch (MqttClientException $e) {
            sseError('Broker desconectado: ' . $e->getMessage());
            break;
        }

        if (connection_aborted()) {
            break;
        }
        if ((time() - $inicio) >= $MAX_VIDA_SEG) {
            sseInfo('Se alcanzó el límite de sesión (30 min). Cerrando.');
            break;
        }
        if ((time() - $ultimoPing) >= $KEEPALIVE_SEG) {
            echo ": keepalive\n\n";
            @flush();
            $ultimoPing = time();
        }
    }
} finally {
    try { $client->disconnect(); } catch (Throwable $ignored) {}
}

sseFin('ok');
exit;

// --- Helpers de framing SSE -----------------------------------------------

function sseMensaje(string $topic, string $payload): void
{
    $data = json_encode([
        'ts'      => date('H:i:s'),
        'topic'   => $topic,
        'payload' => $payload,
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($data === false) {
        $data = json_encode(['ts' => date('H:i:s'), 'topic' => $topic, 'payload' => '(payload no serializable)']);
    }
    echo 'event: mqtt' . "\n";
    echo 'data: ' . $data . "\n\n";
    @flush();
}

function sseInfo(string $mensaje): void
{
    echo 'event: info' . "\n";
    echo 'data: ' . json_encode(['ts' => date('H:i:s'), 'mensaje' => $mensaje], JSON_UNESCAPED_UNICODE) . "\n\n";
    @flush();
}

function sseError(string $mensaje): void
{
    echo 'event: error' . "\n";
    echo 'data: ' . json_encode(['ts' => date('H:i:s'), 'mensaje' => $mensaje], JSON_UNESCAPED_UNICODE) . "\n\n";
    @flush();
}

function sseFin(string $estado): void
{
    echo "event: end\n";
    echo 'data: ' . $estado . "\n\n";
    @flush();
}
