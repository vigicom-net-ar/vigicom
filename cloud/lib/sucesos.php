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
 *
 * `instalarCapturadorDeErrores()` engancha error_handler + exception_handler
 * + shutdown handler para que TODO error PHP no capturado (warnings, errors,
 * fatales, excepciones) quede automáticamente registrado en `sucesos_log`.
 * Lo llaman los dos bootstraps del proyecto (api y jobs).
 */

const SUCESO_TIPOS_VALIDOS = ['info', 'error', 'alerta'];

// Cap del campo `detalle` — la columna es TEXT (64 KB) pero cortamos
// mucho antes para no llenar el visor con stack traces gigantes.
const SUCESO_DETALLE_MAX = 4000;

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
            ':detalle' => mb_substr($detalle, 0, SUCESO_DETALLE_MAX),
        ]);
    } catch (Throwable $ignored) {
        // Fallo del log — silenciado a propósito.
    }
}

/**
 * Engancha handlers globales para que todo error PHP no atrapado,
 * excepción sin capturar o fatal termine registrado como suceso.
 *
 * - `capturarFatales=false` en jobs: el bootstrap de jobs ya tiene su
 *   propio shutdown handler que cierra la ejecución y emite el suceso
 *   con el origen semántico correcto (`cron/<job>`). Duplicar el registro
 *   sólo genera ruido en el visor.
 */
function instalarCapturadorDeErrores(bool $capturarFatales = true): void
{
    static $instalado = false;
    if ($instalado) {
        return;
    }
    $instalado = true;

    set_error_handler('_sucesoErrorHandler');
    set_exception_handler('_sucesoExceptionHandler');
    if ($capturarFatales) {
        register_shutdown_function('_sucesoShutdownHandler');
    }
}

function _sucesoOrigenDefault(): string
{
    if (PHP_SAPI === 'cli') {
        $file = (string) ($_SERVER['SCRIPT_FILENAME'] ?? 'cli');
        return 'cli/' . basename($file, '.php');
    }
    $script = (string) ($_SERVER['SCRIPT_NAME'] ?? '');
    $base   = basename($script, '.php');
    if ($base === '') {
        $base = 'index';
    }
    return (strpos($script, '/api/') !== false ? 'api/' : 'web/') . $base;
}

/**
 * Mapea severity de PHP a tipo del visor. Devuelve null si el error
 * debe ser ignorado (notice / deprecated / strict — política del proyecto).
 */
function _sucesoTipoDesdeSeverity(int $severity): ?string
{
    $errores = E_ERROR | E_PARSE | E_CORE_ERROR | E_COMPILE_ERROR
             | E_USER_ERROR | E_RECOVERABLE_ERROR;
    $warns   = E_WARNING | E_CORE_WARNING | E_COMPILE_WARNING | E_USER_WARNING;

    if ($severity & $errores) {
        return 'error';
    }
    if ($severity & $warns) {
        return 'alerta';
    }
    return null; // notice / deprecated / strict — no se registran
}

function _sucesoDedupHit(string $clave): bool
{
    static $vistos = [];
    $hash = md5($clave);
    if (isset($vistos[$hash])) {
        return true;
    }
    $vistos[$hash] = true;
    return false;
}

function _sucesoErrorHandler(int $severity, string $mensaje, string $archivo, int $linea): bool
{
    $tipo = _sucesoTipoDesdeSeverity($severity);
    if ($tipo === null) {
        return false;
    }

    $clave = $severity . '|' . $archivo . '|' . $linea . '|' . $mensaje;
    if (_sucesoDedupHit($clave)) {
        return false;
    }

    $detalle = sprintf('%s @ %s:%d', $mensaje, basename($archivo), $linea);

    try {
        registrarSuceso(db(), _sucesoOrigenDefault(), $tipo, $detalle);
    } catch (Throwable $ignored) {
        // Silencioso — nunca romper el flujo por un fallo del log.
    }

    return false; // dejar que PHP siga con su manejo normal (log, display si aplica)
}

function _sucesoExceptionHandler(Throwable $e): void
{
    $detalle = sprintf(
        "%s: %s @ %s:%d\n%s",
        get_class($e),
        $e->getMessage(),
        basename($e->getFile()),
        $e->getLine(),
        $e->getTraceAsString()
    );

    try {
        registrarSuceso(db(), _sucesoOrigenDefault(), 'error', $detalle);
    } catch (Throwable $ignored) {
    }

    // Reproducir el comportamiento por defecto de PHP: log al error_log y morir.
    error_log('Uncaught ' . $e);
    if (PHP_SAPI !== 'cli' && !headers_sent()) {
        http_response_code(500);
    }
}

function _sucesoShutdownHandler(): void
{
    $err = error_get_last();
    if ($err === null) {
        return;
    }
    $fatales = E_ERROR | E_PARSE | E_CORE_ERROR | E_COMPILE_ERROR | E_USER_ERROR;
    if (($err['type'] & $fatales) === 0) {
        return;
    }

    $detalle = sprintf(
        'fatal: %s @ %s:%d',
        $err['message'] ?? '(sin mensaje)',
        basename((string) ($err['file'] ?? '?')),
        (int) ($err['line'] ?? 0)
    );

    $clave = 'fatal|' . ($err['file'] ?? '') . '|' . ($err['line'] ?? 0) . '|' . ($err['message'] ?? '');
    if (_sucesoDedupHit($clave)) {
        return;
    }

    try {
        registrarSuceso(db(), _sucesoOrigenDefault(), 'error', $detalle);
    } catch (Throwable $ignored) {
    }
}
