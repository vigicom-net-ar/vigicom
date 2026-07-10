<?php
/**
 * Helper opcional para registrar eventos en la tabla `sucesos_log`
 * (visor de sucesos del panel — ver `cloud/api/sucesos_log.php`).
 *
 * Todos los módulos que quieran dejar constancia de errores, avisos o
 * acciones relevantes pueden llamar a `registrarSuceso()` sin tocar SQL
 * directo. El helper swallowea sus propios errores: si la tabla no existe
 * o el INSERT falla, no propaga la excepción — un fallo del log jamás
 * debe romper el flujo principal del módulo llamador.
 */

const SUCESO_TIPOS_VALIDOS = ['info', 'error', 'alerta'];

function registrarSuceso(PDO $pdo, string $origen, string $tipo, string $detalle): void
{
    try {
        $tipoNorm = in_array($tipo, SUCESO_TIPOS_VALIDOS, true) ? $tipo : 'info';
        $stmt = $pdo->prepare(
            'INSERT INTO sucesos_log (fecha, origen, tipo, detalle)
             VALUES (:fecha, :origen, :tipo, :detalle)'
        );
        $stmt->execute([
            ':fecha'   => date('Y-m-d H:i:s'),
            ':origen'  => mb_substr($origen, 0, 50),
            ':tipo'    => $tipoNorm,
            ':detalle' => $detalle,
        ]);
    } catch (Throwable $e) {
        // Fallo del log — silenciado a propósito.
    }
}
