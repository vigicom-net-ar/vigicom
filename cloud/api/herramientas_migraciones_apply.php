<?php
/**
 * Aplicar una migración del Migrador DB.
 *
 * POST /api/herramientas_migraciones_apply.php   body JSON: {nombre: "XXX.sql"}
 *   → { nombre, hash, aplicada, duracion_ms }
 *
 * Corre el `.sql` con `PDO::exec` (soporta multi-statement DDL) y registra
 * la corrida en la tabla `migraciones`. No usa transacción — las DDL en
 * MySQL hacen auto-commit por sentencia. Si una sentencia falla, las
 * anteriores ya quedaron aplicadas pero la fila en `migraciones` no se
 * inserta, así que la migración sigue figurando como pendiente y el
 * usuario tiene que corregir el `.sql` y reintentar (por eso deben ser
 * idempotentes).
 */

require_once __DIR__ . '/bootstrap.php';
require_once dirname(__DIR__) . '/lib/migraciones.php';

// Log opcional: si el helper del visor de sucesos está presente, se carga.
// El migrador NO depende del visor — si el proyecto no lo tiene, este
// bloque simplemente no hace nada y las fallas no se loguean.
$sucesosHelper = dirname(__DIR__) . '/lib/sucesos.php';
if (is_file($sucesosHelper)) {
    require_once $sucesosHelper;
}

requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('Método no permitido.', 405);
}

try {
    $raw  = file_get_contents('php://input') ?: '';
    $body = json_decode($raw, true);
    if (!is_array($body)) {
        $body = [];
    }

    $nombre = trim((string) ($body['nombre'] ?? ''));
    if (!nombreMigracionValido($nombre)) {
        json_error('Nombre de migración inválido.', 400);
    }

    $path = migracionesDir() . '/' . $nombre;
    if (!is_file($path)) {
        json_error('La migración no existe.', 404);
    }

    $sql = file_get_contents($path);
    if ($sql === false) {
        json_error('No se pudo leer el archivo de migración.', 500);
    }
    if (trim($sql) === '') {
        json_error('La migración está vacía.', 400);
    }

    $pdo = db();
    asegurarTablaMigraciones($pdo);

    $stmt = $pdo->prepare('SELECT id, aplicada FROM migraciones WHERE nombre = :n LIMIT 1');
    $stmt->execute([':n' => $nombre]);
    $prev = $stmt->fetch();
    if ($prev) {
        $cuando = $prev['aplicada'] !== null ? (string) $prev['aplicada'] : 'previamente';
        json_error("La migración ya fue aplicada el {$cuando}.", 409);
    }

    $hash = hash('sha256', $sql);
    $t0   = microtime(true);

    try {
        $pdo->exec($sql);
    } catch (Throwable $e) {
        if (function_exists('registrarSuceso')) {
            registrarSuceso(
                $pdo,
                'Migrador DB',
                'error',
                "Falló la migración «{$nombre}»: " . $e->getMessage()
            );
        }
        json_error('Error al ejecutar la migración: ' . $e->getMessage(), 500);
    }

    $duracionMs = (int) round((microtime(true) - $t0) * 1000);
    $aplicada   = date('Y-m-d H:i:s');

    $ins = $pdo->prepare(
        'INSERT INTO migraciones (nombre, hash, aplicada) VALUES (:nombre, :hash, :aplicada)'
    );
    $ins->execute([
        ':nombre'   => $nombre,
        ':hash'     => $hash,
        ':aplicada' => $aplicada,
    ]);

    json_ok([
        'nombre'      => $nombre,
        'hash'        => $hash,
        'aplicada'    => $aplicada,
        'duracion_ms' => $duracionMs,
    ]);
} catch (Throwable $e) {
    $msg = APP_ENV === 'production' ? 'Error del servidor.' : $e->getMessage();
    json_error($msg, 500);
}
