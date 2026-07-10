<?php
/**
 * Endpoint REST del Visor de sucesos (tabla `sucesos_log`).
 *
 *   GET /api/sucesos_log.php?id=N                              -> suceso individual
 *   GET /api/sucesos_log.php?q=&tipo=&desde=&hasta=&limite=    -> listado
 *
 * Read-only. Cualquier otro metodo devuelve 405.
 */

require_once __DIR__ . '/bootstrap.php';

requireAuth();

const SUCESOS_TIPOS_VALIDOS = ['info', 'error', 'alerta'];

$pdo    = db();
$method = $_SERVER['REQUEST_METHOD'];
$id     = isset($_GET['id']) && ctype_digit((string) $_GET['id']) ? (int) $_GET['id'] : 0;

try {
    if ($method === 'GET' && $id > 0) {
        json_ok(suceso_get($pdo, $id));
    } elseif ($method === 'GET') {
        json_ok(sucesos_listar($pdo, $_GET));
    } else {
        json_error('Método no permitido.', 405);
    }
} catch (Throwable $e) {
    $msg = APP_ENV === 'production' ? 'Error del servidor.' : $e->getMessage();
    json_error($msg, 500);
}

function suceso_normalizar(array $r): array
{
    $tipo = (string) ($r['tipo'] ?? 'info');
    if (!in_array($tipo, SUCESOS_TIPOS_VALIDOS, true)) {
        $tipo = 'info';
    }
    return [
        'id'      => (int) ($r['id'] ?? 0),
        'fecha'   => $r['fecha']   !== null ? (string) $r['fecha']   : null,
        'origen'  => $r['origen']  !== null ? (string) $r['origen']  : null,
        'tipo'    => $tipo,
        'detalle' => $r['detalle'] !== null ? (string) $r['detalle'] : null,
    ];
}

function suceso_get(PDO $pdo, int $id): array
{
    $stmt = $pdo->prepare(
        'SELECT id, fecha, origen, tipo, detalle
           FROM sucesos_log
          WHERE id = :id
          LIMIT 1'
    );
    $stmt->execute([':id' => $id]);
    $r = $stmt->fetch();
    if (!$r) {
        json_error('Suceso no encontrado.', 404);
    }
    return suceso_normalizar($r);
}

function sucesos_listar(PDO $pdo, array $opts): array
{
    $q      = trim((string) ($opts['q']     ?? ''));
    $tipo   = trim((string) ($opts['tipo']  ?? ''));
    $desde  = trim((string) ($opts['desde'] ?? ''));
    $hasta  = trim((string) ($opts['hasta'] ?? ''));
    $limite = isset($opts['limite']) && ctype_digit((string) $opts['limite']) ? (int) $opts['limite'] : 200;
    if ($limite < 1 || $limite > 2000) {
        $limite = 200;
    }

    $where  = [];
    $params = [];

    if ($q !== '') {
        $where[]       = '(origen LIKE :s1 OR detalle LIKE :s2)';
        $like          = '%' . $q . '%';
        $params[':s1'] = $like;
        $params[':s2'] = $like;
    }
    if ($tipo !== '' && in_array($tipo, SUCESOS_TIPOS_VALIDOS, true)) {
        $where[]         = 'tipo = :tipo';
        $params[':tipo'] = $tipo;
    }
    if ($desde !== '') {
        $where[]          = 'fecha >= :desde';
        $params[':desde'] = $desde . ' 00:00:00';
    }
    if ($hasta !== '') {
        $where[]          = 'fecha <= :hasta';
        $params[':hasta'] = $hasta . ' 23:59:59';
    }

    $sqlWhere = $where ? ('WHERE ' . implode(' AND ', $where)) : '';

    $total = (int) $pdo->query('SELECT COUNT(*) FROM sucesos_log')->fetchColumn();

    $sql  = "SELECT id, fecha, origen, tipo, detalle
               FROM sucesos_log
               {$sqlWhere}
              ORDER BY id DESC
              LIMIT {$limite}";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $items = array_map('suceso_normalizar', $stmt->fetchAll());

    return [
        'stats' => ['total' => $total, 'mostrados' => count($items)],
        'items' => $items,
    ];
}
