<?php
/**
 * Creación de carpeta virtual en S3 (objeto vacío con key terminada en "/").
 *
 *   POST /api/herramientas_s3_create_folder.php
 *     { "prefix": "carpeta/", "nombre": "subcarpeta" }
 */

require_once __DIR__ . '/bootstrap.php';
require_once dirname(__DIR__) . '/lib/s3.php';

requireAuth();

try {
    $raw  = file_get_contents('php://input') ?: '';
    $body = json_decode($raw, true);
    if (!is_array($body)) $body = [];

    $prefix = (string) ($body['prefix'] ?? '');
    $prefix = ltrim($prefix, '/');
    if ($prefix !== '' && substr($prefix, -1) !== '/') {
        $prefix .= '/';
    }

    $nombre = trim((string) ($body['nombre'] ?? ''));
    $nombre = preg_replace('/[^\w\.\- ]/u', '_', $nombre) ?? '';
    $nombre = trim($nombre);
    if ($nombre === '' || $nombre === '.' || $nombre === '..') {
        json_error('Nombre de carpeta inválido.', 422);
    }

    $key = $prefix . $nombre . '/';
    s3_put_object($key, '', 'application/x-directory');

    json_ok([
        'key' => $key,
    ]);
} catch (Throwable $e) {
    $msg = APP_ENV === 'production' ? 'Error del servidor.' : $e->getMessage();
    json_error($msg, 500);
}
