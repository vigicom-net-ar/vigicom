<?php
/**
 * Info del firmware actual almacenado en el bucket S3 (Herramientas → Firmware).
 *
 *   GET /api/herramientas_firmware_info.php
 *
 * Busca:
 *   - firmware/firmware.bin   (payload del firmware)
 *   - firmware/firmware.txt   (hash MD5 del payload, generado en la subida)
 *
 * Devuelve `exists=false` si aún no hay firmware cargado.
 */

require_once __DIR__ . '/bootstrap.php';
require_once dirname(__DIR__) . '/lib/s3.php';

requireAuth();

const FIRMWARE_PREFIX  = 'firmware/';
const FIRMWARE_BIN_KEY = 'firmware/firmware.bin';
const FIRMWARE_MD5_KEY = 'firmware/firmware.txt';

try {
    $listing = s3_list_objects(FIRMWARE_PREFIX);
    $binMeta = null;
    $md5Meta = null;
    foreach ($listing['objects'] as $obj) {
        if ($obj['key'] === FIRMWARE_BIN_KEY) $binMeta = $obj;
        if ($obj['key'] === FIRMWARE_MD5_KEY) $md5Meta = $obj;
    }
    if ($binMeta === null) {
        json_ok(['exists' => false]);
    }

    $md5 = '';
    if ($md5Meta !== null) {
        $txt = s3_get_object(FIRMWARE_MD5_KEY);
        if ($txt !== null) {
            $md5 = trim($txt['body']);
        }
    }

    json_ok([
        'exists'        => true,
        'bucket'        => AWS_S3_BUCKET,
        'key'           => $binMeta['key'],
        'url'           => s3_endpoint_url(FIRMWARE_BIN_KEY),
        'size'          => $binMeta['size'],
        'last_modified' => $binMeta['last_modified'],
        'md5'           => $md5,
        'md5_key'       => FIRMWARE_MD5_KEY,
        'md5_url'       => s3_endpoint_url(FIRMWARE_MD5_KEY),
    ]);
} catch (Throwable $e) {
    $msg = APP_ENV === 'production' ? 'Error del servidor.' : $e->getMessage();
    json_error($msg, 500);
}
