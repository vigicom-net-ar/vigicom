<?php
/**
 * Eliminación de objetos / carpetas en S3.
 *
 *   POST /api/herramientas_s3_delete.php
 *     { "key": "carpeta/archivo.jpg", "recursivo": false }
 *
 * Si key termina en "/" y recursivo=true, borra todos los objetos bajo ese prefijo.
 */

require_once __DIR__ . '/bootstrap.php';
require_once dirname(__DIR__) . '/lib/s3.php';

requireAuth();

try {
    $raw  = file_get_contents('php://input') ?: '';
    $body = json_decode($raw, true);
    if (!is_array($body)) $body = [];

    $key = trim((string) ($body['key'] ?? ''));

    // Hard guards: nunca tocar la raíz ni un wildcard.
    if ($key === '' || $key === '/' || $key === '*') {
        json_error('Operación no permitida.', 422);
    }

    $recursivo = !empty($body['recursivo']);
    $esCarpeta = substr($key, -1) === '/';

    $eliminados = 0;
    $errores    = [];

    if ($esCarpeta) {
        if ($recursivo) {
            $keys = s3_list_all($key);
            foreach ($keys as $k) {
                try {
                    s3_delete_object($k);
                    $eliminados++;
                } catch (Throwable $e) {
                    $errores[] = ['key' => $k, 'error' => $e->getMessage()];
                }
            }
            // Intentar borrar el marker de carpeta (puede no existir si solo había contenido)
            try {
                s3_delete_object($key);
                $eliminados++;
            } catch (Throwable $e) {
                // Si el marker no existía, no es un error real.
            }
        } else {
            s3_delete_object($key);
            $eliminados++;
        }
    } else {
        s3_delete_object($key);
        $eliminados++;
    }

    json_ok([
        'key'        => $key,
        'eliminados' => $eliminados,
        'errores'    => $errores,
    ]);
} catch (Throwable $e) {
    $msg = APP_ENV === 'production' ? 'Error del servidor.' : $e->getMessage();
    json_error($msg, 500);
}
