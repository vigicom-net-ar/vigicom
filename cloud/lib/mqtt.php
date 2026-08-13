<?php
/**
 * Capa MQTT reutilizable de Vigicom Cloud.
 *
 * Envoltura fina sobre php-mqtt/client que resuelve la config a partir de la
 * tabla `transceptores` para que el resto de los módulos no tenga que saber
 * ni cómo se conecta al broker ni con qué credenciales.
 *
 * Cualquier endpoint que necesite hablar MQTT (monitor SSE, publish de
 * comandos, jobs programados, etc.) usa este helper:
 *
 *     $t = mqttTransceptorPredeterminado($pdo);
 *     mqttPublicar($t, 'alarmas/1/comando', 'RESET');
 *
 *     mqttEscuchar($t, ['alarmas/+/eventos'], function ($topic, $payload) {
 *         // procesar mensaje
 *     }, timeoutSeg: 60);
 *
 * El cliente subyacente (\PhpMqtt\Client\MqttClient) también se expone crudo
 * vía mqttCliente() para casos avanzados (multi-topic, QoS 2, etc.).
 */

use PhpMqtt\Client\ConnectionSettings;
use PhpMqtt\Client\Exceptions\MqttClientException;
use PhpMqtt\Client\MqttClient;

// ---------------------------------------------------------------------------
// Resolución de transceptor desde la tabla
// ---------------------------------------------------------------------------

/**
 * Devuelve el transceptor marcado como `predeterminado='S'` (y habilitado).
 * Si no hay ninguno predeterminado, cae al primer habilitado por id.
 * Tira RuntimeException si no hay ningún transceptor válido.
 */
function mqttTransceptorPredeterminado(PDO $pdo): array
{
    $stmt = $pdo->query(
        "SELECT id, nombre, host,
                transmision_puerto, transmision_usuario, transmision_contrasena,
                transmision_entrada, transmision_salida,
                predeterminado, habilitado
           FROM transceptores
          WHERE habilitado = 'S'
          ORDER BY (predeterminado = 'S') DESC, id ASC
          LIMIT 1"
    );
    $row = $stmt->fetch();
    if (!$row) {
        throw new RuntimeException('No hay transceptor habilitado disponible.');
    }
    return $row;
}

/**
 * Devuelve un transceptor por id (habilitado o no — la validación queda al
 * caller). Tira RuntimeException si no existe.
 */
function mqttTransceptorPorId(PDO $pdo, int $id): array
{
    $stmt = $pdo->prepare(
        'SELECT id, nombre, host,
                transmision_puerto, transmision_usuario, transmision_contrasena,
                transmision_entrada, transmision_salida,
                predeterminado, habilitado
           FROM transceptores
          WHERE id = :id
          LIMIT 1'
    );
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch();
    if (!$row) {
        throw new RuntimeException("Transceptor #{$id} no encontrado.");
    }
    return $row;
}

// ---------------------------------------------------------------------------
// Cliente MQTT
// ---------------------------------------------------------------------------

/**
 * Construye (y opcionalmente conecta) un MqttClient a partir de una fila de
 * `transceptores`. Devuelve el cliente conectado si $conectar=true (por
 * defecto), listo para publish/subscribe.
 *
 * El clientId incluye el prefijo + el pid + microtime, así múltiples procesos
 * suscritos al mismo broker no se pelean por el mismo clientId (que provoca
 * desconexiones en cadena en EMQX).
 */
function mqttCliente(array $t, string $clientIdPrefix = 'vigicom-cloud', bool $conectar = true): MqttClient
{
    if (empty($t['host'])) {
        throw new RuntimeException('El transceptor no tiene host configurado.');
    }
    $puerto = isset($t['transmision_puerto']) && $t['transmision_puerto'] !== null
        ? (int) $t['transmision_puerto']
        : 1883;
    if ($puerto < 1 || $puerto > 65535) {
        throw new RuntimeException("Puerto de transmisión inválido: {$puerto}.");
    }

    $clientId = $clientIdPrefix . '-' . getmypid() . '-' . bin2hex(random_bytes(4));

    $client = new MqttClient($t['host'], $puerto, $clientId, MqttClient::MQTT_3_1_1);

    if (!$conectar) {
        return $client;
    }

    $settings = (new ConnectionSettings())
        ->setUsername(!empty($t['transmision_usuario'])   ? (string) $t['transmision_usuario']   : null)
        ->setPassword(!empty($t['transmision_contrasena']) ? (string) $t['transmision_contrasena'] : null)
        ->setKeepAliveInterval(30)
        ->setConnectTimeout(5)
        ->setSocketTimeout(5)
        ->setResendTimeout(10);

    try {
        $client->connect($settings, true);
    } catch (MqttClientException $ex) {
        throw new RuntimeException('No se pudo conectar al broker MQTT: ' . $ex->getMessage(), 0, $ex);
    }

    return $client;
}

// ---------------------------------------------------------------------------
// Publish / Subscribe de alto nivel
// ---------------------------------------------------------------------------

/**
 * Publica un mensaje one-shot en un topic. Conecta, publica, desconecta.
 * $qos: 0 (fire-and-forget), 1 (at-least-once), 2 (exactly-once).
 * $retain: si el broker debe guardar el mensaje como retained.
 */
function mqttPublicar(
    array  $t,
    string $topic,
    string $payload,
    int    $qos = 0,
    bool   $retain = false
): void {
    $client = mqttCliente($t);
    try {
        $client->publish($topic, $payload, $qos, $retain);
    } finally {
        try { $client->disconnect(); } catch (Throwable $ignored) {}
    }
}

/**
 * Se suscribe a uno o varios topics y llama a $onMessage($topic, $payload)
 * por cada mensaje recibido. Bloqueante.
 *
 *   $timeoutSeg > 0 → el loop se corta cuando pasa ese tiempo sin recibir
 *                     mensajes nuevos (mide desde el último mensaje o desde
 *                     la conexión). 0 = sin límite (loop infinito, que rompe
 *                     el caller con Ctrl-C o cerrando el socket).
 *   $qos            → QoS de la suscripción (default 0).
 *
 * El caller es responsable de manejar la desconexión (llamar disconnect())
 * si obtiene el cliente crudo. Esta función lo maneja automáticamente.
 */
function mqttEscuchar(
    array    $t,
    array    $topics,
    callable $onMessage,
    int      $timeoutSeg = 0,
    int      $qos = 0
): void {
    if (empty($topics)) {
        throw new InvalidArgumentException('mqttEscuchar: la lista de topics no puede estar vacía.');
    }

    $client = mqttCliente($t);

    // Wrap para adaptar la firma de php-mqtt/client (topic, message, retained,
    // matchedWildcards) a la firma más simple ($topic, $payload) que ofrecemos.
    $handler = static function (string $topic, string $message, bool $retained, array $matchedWildcards)
        use ($onMessage): void {
        $onMessage($topic, $message);
    };

    foreach ($topics as $topic) {
        $client->subscribe((string) $topic, $handler, $qos);
    }

    try {
        // Loop manual con loopOnce() para poder chequear cortes del cliente
        // HTTP entre polls (SSE). Con $allowSleep=true el cliente hace un
        // usleep chico si no hay data pendiente, así no comemos CPU.
        $inicio = time();
        while (true) {
            $client->loopOnce(microtime(true), true);

            if (function_exists('connection_aborted') && connection_aborted()) {
                break;
            }
            if ($timeoutSeg > 0 && (time() - $inicio) >= $timeoutSeg) {
                break;
            }
        }
    } finally {
        try { $client->disconnect(); } catch (Throwable $ignored) {}
    }
}
