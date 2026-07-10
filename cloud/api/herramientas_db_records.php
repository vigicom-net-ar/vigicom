<?php
/**
 * Últimos registros de una tabla del Explorador DB.
 *
 * GET /api/herramientas_db_records.php?tabla=<nombre>&limite=<n>
 *   → { database, tabla, pk[], auto_inc[], nullable[], columnas[],
 *       limite, total, registros[] }
 *
 * - Orden: PK DESC (primero los más nuevos). Si no hay PK, orden natural
 *   del motor y `pk = []` (la UI lo marca como solo lectura).
 * - Límite: 1..500 (default 50).
 * - Strings de más de 500 caracteres se truncan con sufijo "… (truncado)".
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

$limite = isset($_GET['limite']) ? (int) $_GET['limite'] : 50;
if ($limite < 1 || $limite > 500) {
    $limite = 50;
}

try {
    $pdo   = db();
    $tabla = dbexpResolverTabla($pdo, $tablaIn);
    if ($tabla === null) {
        json_error('La tabla no existe en esta base.', 404);
    }

    $columnasMeta = dbexpColumnasDeTabla($pdo, $tabla);

    $columnas    = [];
    $pkCols      = [];
    $autoIncCols = [];
    $nullableCols = [];
    foreach ($columnasMeta as $c) {
        $nombre = (string) $c['nombre'];
        $columnas[] = $nombre;
        if ($c['clave'] === 'PRI') {
            $pkCols[] = $nombre;
        }
        if (stripos((string) $c['extra'], 'auto_increment') !== false) {
            $autoIncCols[] = $nombre;
        }
        if ($c['nullable'] === 'YES') {
            $nullableCols[] = $nombre;
        }
    }

    $tablaQ = dbexpQuoteIdent($tabla);

    // COUNT(*) por separado para meta preciso mostrados/total.
    $total = (int) $pdo->query('SELECT COUNT(*) FROM ' . $tablaQ)->fetchColumn();

    $orderBy = '';
    if (count($pkCols) > 0) {
        $parts = [];
        foreach ($pkCols as $pk) {
            $parts[] = dbexpQuoteIdent($pk) . ' DESC';
        }
        $orderBy = ' ORDER BY ' . implode(', ', $parts);
    }

    // Limite ya validado como entero: concatenar es seguro
    // (algunos drivers bindean int como string y rompen LIMIT).
    $sql = 'SELECT * FROM ' . $tablaQ . $orderBy . ' LIMIT ' . $limite;
    $stmt = $pdo->query($sql);
    $rows = $stmt->fetchAll();

    $registros = [];
    foreach ($rows as $row) {
        $out = [];
        foreach ($columnas as $col) {
            $v = array_key_exists($col, $row) ? $row[$col] : null;
            $out[$col] = dbexpTruncarValor($v);
        }
        $registros[] = $out;
    }

    json_ok([
        'database'  => dbexpDatabaseActual($pdo),
        'tabla'     => $tabla,
        'pk'        => $pkCols,
        'auto_inc'  => $autoIncCols,
        'nullable'  => $nullableCols,
        'columnas'  => $columnas,
        'limite'    => $limite,
        'total'     => $total,
        'registros' => $registros,
    ]);
} catch (Throwable $e) {
    $msg = APP_ENV === 'production' ? 'Error del servidor.' : $e->getMessage();
    json_error($msg, 500);
}
