<?php
/**
 * Carga del firmware oficial al bucket S3 (Herramientas → Firmware).
 *
 *   POST /api/herramientas_firmware_upload.php  (multipart/form-data)
 *     - archivo: file (input type=file, el .bin del firmware)
 *
 * El endpoint:
 *   1. Guarda el payload en   firmware/firmware.bin
 *   2. Calcula MD5 del payload y lo escribe en firmware/firmware.txt
 *      (mismo nombre base que el .bin pero con extensión .txt, para que las
 *       alarmas puedan comparar contra el firmware que tienen instalado).
 *   3. Registra un suceso "info" en el log de actividad.
 *
 * Límite duro: 20 MB.
 */

require_once __DIR__ . '/bootstrap.php';
require_once dirname(__DIR__) . '/lib/s3.php';
require_once dirname(__DIR__) . '/lib/sucesos.php';

requireAuth();

// Shutdown handler: si algo explota igual devolvemos JSON para que fetch().json() no rompa.
register_shutdown_function(function () {
    $err = error_get_last();
    if ($err !== null && in_array($err['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR], true)) {
        if (!headers_sent()) {
            http_response_code(500);
            header('Content-Type: application/json; charset=utf-8');
        }
        $msg = APP_ENV === 'production' ? 'Error del servidor.' : ($err['message'] ?? 'Error fatal.');
        echo json_encode(['ok' => false, 'error' => $msg]);
    }
});

const FIRMWARE_MAX_BYTES = 20 * 1024 * 1024; // 20 MB
const FIRMWARE_BIN_KEY   = 'firmware/firmware.bin';
const FIRMWARE_MD5_KEY   = 'firmware/firmware.txt';

try {
    if (empty($_FILES['archivo']) || !is_array($_FILES['archivo'])) {
        json_error('No se recibió ningún archivo.', 422);
    }
    $f = $_FILES['archivo'];

    if (($f['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        $codeMap = [
            UPLOAD_ERR_INI_SIZE   => 'El firmware supera el límite del servidor.',
            UPLOAD_ERR_FORM_SIZE  => 'El firmware supera el límite del formulario.',
            UPLOAD_ERR_PARTIAL    => 'El firmware se subió parcialmente.',
            UPLOAD_ERR_NO_FILE    => 'No se recibió ningún archivo.',
            UPLOAD_ERR_NO_TMP_DIR => 'Falta carpeta temporal en el servidor.',
            UPLOAD_ERR_CANT_WRITE => 'No se pudo escribir el archivo en disco.',
            UPLOAD_ERR_EXTENSION  => 'Una extensión PHP rechazó la subida.',
        ];
        json_error($codeMap[$f['error']] ?? 'Error al subir el archivo.', 422);
    }

    if (!is_uploaded_file($f['tmp_name'])) {
        json_error('Subida inválida.', 400);
    }

    $size = (int) ($f['size'] ?? 0);
    if ($size <= 0) {
        json_error('El firmware está vacío.', 422);
    }
    if ($size > FIRMWARE_MAX_BYTES) {
        json_error('El firmware supera el límite de 20 MB.', 422);
    }

    $md5 = md5_file($f['tmp_name']);
    if ($md5 === false || $md5 === '') {
        json_error('No se pudo calcular el MD5 del firmware.', 500);
    }

    $contents = file_get_contents($f['tmp_name']);
    if ($contents === false) {
        json_error('No se pudo leer el archivo temporal.', 500);
    }

    // Subir el .bin primero; si falla, no dejamos un .txt huérfano.
    s3_put_object(FIRMWARE_BIN_KEY, $contents, 'application/octet-stream');
    s3_put_object(FIRMWARE_MD5_KEY, $md5,      'text/plain; charset=utf-8');

    registrarSuceso(
        db(),
        'Herramientas › Firmware',
        'info',
        'Se cargó un nuevo firmware. Tamaño: ' . $size . ' bytes. MD5: ' . $md5 . '.'
    );

    json_ok([
        'bucket'        => AWS_S3_BUCKET,
        'key'           => FIRMWARE_BIN_KEY,
        'url'           => s3_endpoint_url(FIRMWARE_BIN_KEY),
        'size'          => $size,
        'md5'           => $md5,
        'md5_key'       => FIRMWARE_MD5_KEY,
        'md5_url'       => s3_endpoint_url(FIRMWARE_MD5_KEY),
        'last_modified' => gmdate('Y-m-d\TH:i:s\Z'),
    ]);
} catch (Throwable $e) {
    $msg = APP_ENV === 'production' ? 'Error del servidor.' : $e->getMessage();
    json_error($msg, 500);
}
