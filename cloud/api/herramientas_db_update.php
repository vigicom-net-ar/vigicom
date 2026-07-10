<?php
/**
 * Update de una celda del Explorador DB.
 *
 * POST /api/herramientas_db_update.php
 *   body: { tabla, columna, pk: { col1: val1, ... }, valor }
 *   → { filas_afectadas, valor_guardado }
 *
 * Reglas:
 *  - PK obligatoria y completa (todas las columnas PK de la tabla).
 *  - Columna no puede estar en la PK ni ser auto_increment.
 *  - NULL sólo si la columna admite NULL.
 *  - WHERE por PK con LIMIT 1.
 *  - Re-lee el valor guardado (el motor pudo castear).
 */

require_once __DIR__ . '/bootstrap.php';
require_once dirname(__DIR__) . '/lib/db_explorer.php';

requireAuth();

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('Método no permitido.', 405);
}

$raw = file_get_contents('php://input');
$body = json_decode($raw, true);
if (!is_array($body)) {
    json_error('Body inválido.', 400);
}

$tablaIn   = trim((string) ($body['tabla']   ?? ''));
$columnaIn = trim((string) ($body['columna'] ?? ''));
$pkIn      = $body['pk'] ?? null;
$valorIn   = array_key_exists('valor', $body) ? $body['valor'] : null;

if ($tablaIn === '')          json_error('Falta "tabla".', 400);
if ($columnaIn === '')        json_error('Falta "columna".', 400);
if (!is_array($pkIn))         json_error('Falta "pk" (objeto).', 400);

try {
    $pdo   = db();
    $tabla = dbexpResolverTabla($pdo, $tablaIn);
    if ($tabla === null) {
        json_error('La tabla no existe en esta base.', 404);
    }

    $columnasMeta = dbexpColumnasDeTabla($pdo, $tabla);

    $pkCols       = [];
    $autoIncCols  = [];
    $nullableCols = [];
    $columnasIdx  = [];
    foreach ($columnasMeta as $c) {
        $nombre = (string) $c['nombre'];
        $columnasIdx[$nombre] = $c;
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

    if (count($pkCols) === 0) {
        json_error('La tabla no tiene PK — no es posible editar registros individuales.', 409);
    }

    // PK recibida tiene que coincidir exactamente con las columnas PK reales.
    $pkKeys = array_keys($pkIn);
    $a = $pkKeys;   sort($a);
    $b = $pkCols;   sort($b);
    if ($a !== $b) {
        json_error('PK incompleta. Se esperaba: ' . implode(', ', $pkCols), 400);
    }

    // Validar columna a editar.
    $columna = dbexpResolverColumna($pdo, $tabla, $columnaIn);
    if ($columna === null) {
        json_error('La columna no existe en esta tabla.', 404);
    }
    if (in_array($columna, $autoIncCols, true)) {
        json_error('No se puede editar una columna auto_increment.', 409);
    }
    if (in_array($columna, $pkCols, true)) {
        json_error('No se puede editar una columna que es parte de la PK.', 409);
    }
    if ($valorIn === null && !in_array($columna, $nullableCols, true)) {
        json_error('La columna no permite NULL.', 409);
    }

    // Armar SQL.
    $tablaQ   = dbexpQuoteIdent($tabla);
    $columnaQ = dbexpQuoteIdent($columna);

    $wherePartes = [];
    $wherePkOrden = [];
    foreach ($pkCols as $pkCol) {
        $wherePartes[] = dbexpQuoteIdent($pkCol) . ' = ?';
        $wherePkOrden[] = $pkCol;
    }
    $whereSql = implode(' AND ', $wherePartes);

    $sqlUpdate = 'UPDATE ' . $tablaQ .
                 ' SET ' . $columnaQ . ' = ?' .
                 ' WHERE ' . $whereSql .
                 ' LIMIT 1';

    $params = [$valorIn];
    foreach ($wherePkOrden as $pkCol) {
        $params[] = $pkIn[$pkCol];
    }

    $stmt = $pdo->prepare($sqlUpdate);
    $stmt->execute($params);
    $filasAfectadas = $stmt->rowCount();

    // Re-leer el valor guardado.
    $sqlSelect = 'SELECT ' . $columnaQ . ' FROM ' . $tablaQ .
                 ' WHERE ' . $whereSql .
                 ' LIMIT 1';
    $paramsSel = [];
    foreach ($wherePkOrden as $pkCol) {
        $paramsSel[] = $pkIn[$pkCol];
    }
    $sel = $pdo->prepare($sqlSelect);
    $sel->execute($paramsSel);
    $valorGuardado = $sel->fetchColumn();
    if ($valorGuardado === false) $valorGuardado = null;

    json_ok([
        'filas_afectadas' => $filasAfectadas,
        'valor_guardado'  => dbexpTruncarValor($valorGuardado),
    ]);
} catch (Throwable $e) {
    $msg = APP_ENV === 'production' ? 'Error del servidor.' : $e->getMessage();
    json_error($msg, 500);
}
