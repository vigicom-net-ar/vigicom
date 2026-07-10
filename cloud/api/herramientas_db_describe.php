<?php
/**
 * Estructura de una tabla del Explorador DB.
 *
 * GET /api/herramientas_db_describe.php?tabla=<nombre>
 *   → { database, tabla, columnas: [ {posicion, nombre, tipo, nullable,
 *                                     clave, predeterminado, extra, comentario}, ... ] }
 *
 * Devuelve 404 si la tabla no existe en la base activa.
 */

require_once __DIR__ . '/bootstrap.php';
require_once dirname(__DIR__) . '/lib/db_explorer.php';

requireAuth();

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_error('Método no permitido.', 405);
}

$tablaIn = trim((string) ($_GET['tabla'] ?? ''));
if ($tablaIn === '') {
    json_error('Falta el parámetro "tabla".', 400);
}

try {
    $pdo   = db();
    $tabla = dbexpResolverTabla($pdo, $tablaIn);
    if ($tabla === null) {
        json_error('La tabla no existe en esta base.', 404);
    }

    $columnas = dbexpColumnasDeTabla($pdo, $tabla);

    $out = array_map(function ($r) {
        return [
            'posicion'       => (int) $r['posicion'],
            'nombre'         => (string) $r['nombre'],
            'tipo'           => (string) $r['tipo'],
            'nullable'       => (string) $r['nullable'],
            'clave'          => (string) $r['clave'],
            'predeterminado' => $r['predeterminado'],
            'extra'          => (string) $r['extra'],
            'comentario'     => (string) $r['comentario'],
        ];
    }, $columnas);

    json_ok([
        'database' => dbexpDatabaseActual($pdo),
        'tabla'    => $tabla,
        'columnas' => $out,
    ]);
} catch (Throwable $e) {
    $msg = APP_ENV === 'production' ? 'Error del servidor.' : $e->getMessage();
    json_error($msg, 500);
}
