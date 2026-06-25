<?php
/**
 * Listado del bucket S3 para el "Explorador S3" de Herramientas.
 *
 *   GET /api/herramientas_s3_list.php?prefix=carpeta/&token=...
 *
 * Devuelve carpetas y archivos del prefijo (delimitado por "/").
 */

require_once __DIR__ . '/bootstrap.php';
require_once dirname(__DIR__) . '/lib/s3.php';

requireAuth();

try {
    $prefix = (string) ($_GET['prefix'] ?? '');
    $token  = isset($_GET['token']) && $_GET['token'] !== '' ? (string) $_GET['token'] : null;

    $data = s3_list_objects($prefix, $token, 200);

    json_ok([
        'bucket'     => AWS_S3_BUCKET,
        'region'     => AWS_REGION,
        'prefix'     => $prefix,
        'folders'    => $data['folders'],
        'objects'    => $data['objects'],
        'truncated'  => $data['truncated'],
        'next_token' => $data['next_token'],
    ]);
} catch (Throwable $e) {
    $msg = APP_ENV === 'production' ? 'Error del servidor.' : $e->getMessage();
    json_error($msg, 500);
}
