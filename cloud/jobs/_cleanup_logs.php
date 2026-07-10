<?php
/**
 * Cleanup nocturno de tareas_ejecuciones + archivos .log en disco.
 *
 * Invocado por cron una vez por día. Borra las filas cerradas cuya
 * antigüedad supera la `retencion_dias` de su tarea, junto con el
 * archivo .log asociado. No toca las ejecuciones en estado 'corriendo'
 * (esas son responsabilidad del watchdog del scheduler).
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit('cleanup: solo por CLI');
}

require_once dirname(__DIR__, 2) . '/env.php';
require_once dirname(__DIR__) . '/api/config/db.php';
require_once dirname(__DIR__) . '/lib/sucesos.php';

$inicio = microtime(true);
$pdo    = db();

$filasBorradas    = 0;
$archivosBorrados = 0;
$sinArchivo       = 0;
$errores          = 0;

try {
    $stmt = $pdo->query(
        "SELECT e.id, e.log_path
           FROM tareas_ejecuciones e
           JOIN tareas t ON t.id = e.tarea_id
          WHERE e.estado != 'corriendo'
            AND TIMESTAMPDIFF(DAY, e.inicio, NOW()) > t.retencion_dias
          ORDER BY e.id"
    );
    $filas = $stmt->fetchAll();

    $delFila = $pdo->prepare('DELETE FROM tareas_ejecuciones WHERE id = :id');

    foreach ($filas as $r) {
        try {
            $lp = (string) ($r['log_path'] ?? '');
            if ($lp !== '' && is_file($lp)) {
                if (@unlink($lp)) {
                    $archivosBorrados++;
                } else {
                    $errores++;
                }
            } else {
                $sinArchivo++;
            }
            $delFila->execute([':id' => $r['id']]);
            $filasBorradas++;
        } catch (Throwable $e) {
            $errores++;
            fwrite(STDERR, '[cleanup] fila ' . $r['id'] . ': ' . $e->getMessage() . PHP_EOL);
        }
    }
} catch (Throwable $e) {
    fwrite(STDERR, '[cleanup] error general: ' . $e->getMessage() . PHP_EOL);
    $errores++;
}

$dur = number_format(microtime(true) - $inicio, 2);
$resumen = $filasBorradas . ' filas borradas | ' . $archivosBorrados . ' archivos borrados | ' .
           $sinArchivo . ' sin archivo | ' . $errores . ' errores | ' . $dur . 's';
echo $resumen . PHP_EOL;

if ($errores > 0) {
    registrarSuceso($pdo, 'cron/cleanup_logs', 'alerta', $resumen);
} elseif ($filasBorradas > 0) {
    registrarSuceso($pdo, 'cron/cleanup_logs', 'info', $resumen);
}
