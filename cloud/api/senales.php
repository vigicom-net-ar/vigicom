<?php
/**
 * Endpoint REST de consulta de señales (solo lectura).
 *
 *   GET /api/senales.php  → { senales, kpis, total }
 *
 * Filtros (querystring):
 *   q           texto libre (LIKE sobre `texto` y `propagacion`)
 *   estado      coincidencia exacta (1 char)
 *   prioridad   coincidencia exacta (1 char)
 *   sentido     coincidencia exacta (1 char)
 *   propagacion coincidencia exacta (12 chars max) — para filtrar por
 *               `identidad` de alarma (se guarda en `senales.propagacion`)
 *   procesada   '' | 'si' | 'no'
 *   desde       YYYY-MM-DD (fecha >=)
 *   hasta       YYYY-MM-DD (fecha <= 23:59:59)
 *   sort        id | fecha | procesada | intentos
 *   dir         asc | desc
 *   limit       1..1000  (default 200)
 */

require_once __DIR__ . '/bootstrap.php';

requireAuth();

$pdo    = db();
$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET') {
    json_error('Método no permitido.', 405);
}

try {
    json_ok([
        'senales' => senales_listar($pdo, $_GET),
        'kpis'    => senales_kpis($pdo),
    ]);
} catch (Throwable $e) {
    $msg = APP_ENV === 'production' ? 'Error del servidor.' : $e->getMessage();
    json_error($msg, 500);
}

// --- Helpers ----------------------------------------------------------------

function senales_listar(PDO $pdo, array $opts = []): array
{
    $sortCols = [
        'id'        => 's.id',
        'fecha'     => 's.fecha',
        'procesada' => 's.procesada',
        'intentos'  => 's.intentos',
    ];
    $sortKey = (string) ($opts['sort'] ?? 'fecha');
    if (!isset($sortCols[$sortKey])) {
        $sortKey = 'fecha';
    }
    $dir = strtolower((string) ($opts['dir'] ?? 'desc')) === 'asc' ? 'ASC' : 'DESC';

    $limit = isset($opts['limit']) && ctype_digit((string) $opts['limit']) ? (int) $opts['limit'] : 200;
    if ($limit < 1)    { $limit = 200; }
    if ($limit > 1000) { $limit = 1000; }

    $where  = [];
    $params = [];

    $q = trim((string) ($opts['q'] ?? ''));
    if ($q !== '') {
        $where[] = '(s.texto LIKE :q OR s.propagacion LIKE :q)';
        $params[':q'] = '%' . $q . '%';
    }

    foreach (['estado', 'prioridad', 'sentido'] as $f) {
        $v = (string) ($opts[$f] ?? '');
        if ($v !== '') {
            $where[] = "s.$f = :$f";
            $params[":$f"] = mb_substr($v, 0, 1);
        }
    }

    $propagacion = trim((string) ($opts['propagacion'] ?? ''));
    if ($propagacion !== '') {
        $where[] = 's.propagacion = :propagacion';
        $params[':propagacion'] = mb_substr($propagacion, 0, 12);
    }

    $procesada = (string) ($opts['procesada'] ?? '');
    if ($procesada === 'si') {
        $where[] = 's.procesada IS NOT NULL';
    } elseif ($procesada === 'no') {
        $where[] = 's.procesada IS NULL';
    }

    $desde = (string) ($opts['desde'] ?? '');
    if ($desde !== '' && preg_match('/^\d{4}-\d{2}-\d{2}$/', $desde)) {
        $where[] = 's.fecha >= :desde';
        $params[':desde'] = $desde . ' 00:00:00';
    }
    $hasta = (string) ($opts['hasta'] ?? '');
    if ($hasta !== '' && preg_match('/^\d{4}-\d{2}-\d{2}$/', $hasta)) {
        $where[] = 's.fecha <= :hasta';
        $params[':hasta'] = $hasta . ' 23:59:59';
    }

    $sql = 'SELECT s.id, s.fecha, s.sentido, s.propagacion, s.texto,
                   s.prioridad, s.intentos, s.procesada, s.estado
              FROM senales s';
    if ($where) {
        $sql .= ' WHERE ' . implode(' AND ', $where);
    }
    $sql .= " ORDER BY {$sortCols[$sortKey]} $dir LIMIT $limit";

    $stmt = $pdo->prepare($sql);
    foreach ($params as $k => $v) {
        $stmt->bindValue($k, $v);
    }
    $stmt->execute();
    return $stmt->fetchAll();
}

function senales_kpis(PDO $pdo): array
{
    return [
        'total'      => (int) $pdo->query('SELECT COUNT(*) FROM senales')->fetchColumn(),
        'pendientes' => (int) $pdo->query('SELECT COUNT(*) FROM senales WHERE procesada IS NULL')->fetchColumn(),
        'hoy'        => (int) $pdo->query('SELECT COUNT(*) FROM senales WHERE fecha >= CURDATE()')->fetchColumn(),
    ];
}
