<?php
/**
 * Subida de archivos al bucket S3 (Explorador S3 de Herramientas).
 *
 *   POST /api/herramientas_s3_upload.php  (multipart/form-data)
 *     - archivo: file (input type=file)
 *     - prefix:  string (carpeta destino, ej "logos/")
 *     - nombre:  string (opcional, override del nombre del archivo)
 *
 * Límite duro: 20 MB.
 */

require_once __DIR__ . '/bootstrap.php';
require_once dirname(__DIR__) . '/lib/s3.php';

requireAuth();

// Shutdown handler: si algo explota igual devolvemos JSON para que el fetch().json() no rompa.
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

const S3_UPLOAD_MAX_BYTES = 20 * 1024 * 1024; // 20 MB

try {
    if (empty($_FILES['archivo']) || !is_array($_FILES['archivo'])) {
        json_error('No se recibió ningún archivo.', 422);
    }
    $f = $_FILES['archivo'];

    if (($f['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        $codeMap = [
            UPLOAD_ERR_INI_SIZE   => 'El archivo supera el límite del servidor.',
            UPLOAD_ERR_FORM_SIZE  => 'El archivo supera el límite del formulario.',
            UPLOAD_ERR_PARTIAL    => 'El archivo se subió parcialmente.',
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
        json_error('Archivo vacío.', 422);
    }
    if ($size > S3_UPLOAD_MAX_BYTES) {
        json_error('El archivo supera el límite de 20 MB.', 422);
    }

    $prefix = (string) ($_POST['prefix'] ?? '');
    $prefix = ltrim($prefix, '/');
    if ($prefix !== '' && substr($prefix, -1) !== '/') {
        $prefix .= '/';
    }

    $nombreOriginal = (string) ($_POST['nombre'] ?? $f['name'] ?? '');
    $nombre = trim($nombreOriginal);
    // Sanitización: solo letras, números, _, ., -, espacios.
    $nombre = preg_replace('/[^\w\.\- ]/u', '_', $nombre) ?? '';
    $nombre = trim($nombre);
    if ($nombre === '' || $nombre === '.' || $nombre === '..') {
        json_error('Nombre de archivo inválido.', 422);
    }

    $key = $prefix . $nombre;

    // Detectar MIME real del contenido (no confiamos en el cliente).
    $mime = 'application/octet-stream';
    if (function_exists('finfo_open')) {
        $fi = finfo_open(FILEINFO_MIME_TYPE);
        if ($fi !== false) {
            $detected = finfo_file($fi, $f['tmp_name']);
            finfo_close($fi);
            if (is_string($detected) && $detected !== '') {
                $mime = $detected;
            }
        }
    }

    $contents = file_get_contents($f['tmp_name']);
    if ($contents === false) {
        json_error('No se pudo leer el archivo temporal.', 500);
    }

    s3_put_object($key, $contents, $mime);

    json_ok([
        'bucket'       => AWS_S3_BUCKET,
        'key'          => $key,
        'url'          => s3_public_url($key),
        'size'         => $size,
        'content_type' => $mime,
    ]);
} catch (Throwable $e) {
    $msg = APP_ENV === 'production' ? 'Error del servidor.' : $e->getMessage();
    json_error($msg, 500);
}
