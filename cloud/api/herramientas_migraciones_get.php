<?php
/**
 * Preview de una migración del Migrador DB.
 *
 * GET /api/herramientas_migraciones_get.php?nombre=YYYYMMDD_..._algo.sql
 *   → { nombre, contenido, tamano, hash }
 *
 * Solo lee del disco — no toca la BD.
 */

require_once __DIR__ . '/bootstrap.php';
require_once dirname(__DIR__) . '/lib/migraciones.php';

requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_error('Método no permitido.', 405);
}

try {
    $nombre = trim((string) ($_GET['nombre'] ?? ''));
    if (!nombreMigracionValido($nombre)) {
        json_error('Nombre de migración inválido.', 400);
    }

    $path = migracionesDir() . '/' . $nombre;
    if (!is_file($path)) {
        json_error('La migración no existe.', 404);
    }

    $contenido = file_get_contents($path);
    if ($contenido === false) {
        json_error('No se pudo leer el archivo de migración.', 500);
    }

    json_ok([
        'nombre'    => $nombre,
        'contenido' => $contenido,
        'tamano'    => strlen($contenido),
        'hash'      => hash('sha256', $contenido),
    ]);
} catch (Throwable $e) {
    $msg = APP_ENV === 'production' ? 'Error del servidor.' : $e->getMessage();
    json_error($msg, 500);
}
