<?php
/**
 * Endpoint de listado de comprobantes (read-only).
 *
 *   GET /api/comprobantes.php?grupo=presupuestos → listado filtrado por tipo
 *   GET /api/comprobantes.php?grupo=facturas     → listado filtrado por tipo
 *   GET /api/comprobantes.php?grupo=recibos      → listado filtrado por tipo
 *
 * Cada grupo mapea a un conjunto de códigos AFIP-style que se aplican
 * contra `comprobantes.tipo` (varchar(2)). Si tu convención de tipos
 * es distinta, editar $GRUPOS_TIPO abajo.
 *
 * Query params opcionales:
 *   filtro_id, contraparte (nombre/razón), desde, hasta,
 *   sort, dir, limit
 */

require_once __DIR__ . '/bootstrap.php';

requireAuth();

// Mapeo de "grupo lógico" → códigos AFIP (comprobantes.tipo, 2 chars).
// Ajustar si la convención local no coincide.
$GRUPOS_TIPO = [
    'presupuestos' => ['PP', 'PA', 'PB', 'PC'],
    'facturas'     => ['FA', 'FB', 'FC', 'FE', 'FM'],
    'recibos'      => ['RA', 'RB', 'RC'],
];

$grupo = strtolower(trim((string) ($_GET['grupo'] ?? '')));
if (!isset($GRUPOS_TIPO[$grupo])) {
    json_error('Grupo inválido. Usá presupuestos, facturas o recibos.', 422);
}

$pdo    = db();
$tipos  = $GRUPOS_TIPO[$grupo];

try {
    json_ok([
        'comprobantes' => comprobantes_listar($pdo, $tipos, $_GET),
        'kpis'         => comprobantes_kpis($pdo, $tipos),
        'grupo'        => $grupo,
        'tipos'        => $tipos,
    ]);
} catch (Throwable $e) {
    $msg = APP_ENV === 'production' ? 'Error del servidor.' : $e->getMessage();
    json_error($msg, 500);
}

// --- Helpers ----------------------------------------------------------------

function comprobantes_listar(PDO $pdo, array $tipos, array $opts): array
{
    $sortCols = [
        'id'      => 'cp.id',
        'emision' => 'cp.emision',
        'total'   => 'cp.total',
        'razon'   => 'cp.razon',
        'tipo'    => 'cp.tipo',
    ];
    $sortKey = (string) ($opts['sort'] ?? 'emision');
    if (!isset($sortCols[$sortKey])) {
        $sortKey = 'emision';
    }
    $dir = strtolower((string) ($opts['dir'] ?? 'desc')) === 'asc' ? 'ASC' : 'DESC';

    $limit = isset($opts['limit']) && ctype_digit((string) $opts['limit']) ? (int) $opts['limit'] : 100;
    if ($limit < 1)    { $limit = 100; }
    if ($limit > 1000) { $limit = 1000; }

    $placeholders = [];
    $params = [];
    foreach ($tipos as $i => $t) {
        $key = ':tipo' . $i;
        $placeholders[] = $key;
        $params[$key]   = $t;
    }
    $where = ['cp.tipo IN (' . implode(',', $placeholders) . ')'];

    if (isset($opts['filtro_id']) && ctype_digit((string) $opts['filtro_id']) && (int) $opts['filtro_id'] > 0) {
        $where[] = 'cp.id = :filtro_id';
        $params[':filtro_id'] = (int) $opts['filtro_id'];
    }
    $razon = trim((string) ($opts['contraparte'] ?? ''));
    if ($razon !== '') {
        $where[] = '(cp.razon LIKE :razon OR c.nombre LIKE :razon)';
        $params[':razon'] = '%' . $razon . '%';
    }
    $desde = trim((string) ($opts['desde'] ?? ''));
    if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $desde)) {
        $where[] = 'cp.emision >= :desde';
        $params[':desde'] = $desde;
    }
    $hasta = trim((string) ($opts['hasta'] ?? ''));
    if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $hasta)) {
        $where[] = 'cp.emision <= :hasta';
        $params[':hasta'] = $hasta;
    }

    $sql = 'SELECT cp.id, cp.tipo, cp.punto, cp.serie, cp.emision, cp.vencimiento,
                   cp.contraparte, COALESCE(cp.razon, c.nombre) AS razon,
                   cp.cuit, cp.subtotal, cp.total, cp.estado,
                   t.nombre AS talonario_nombre
              FROM comprobantes cp
              LEFT JOIN clientes   c ON c.id = cp.contraparte
              LEFT JOIN talonarios t ON t.id = cp.talonario
             WHERE ' . implode(' AND ', $where) .
            " ORDER BY {$sortCols[$sortKey]} $dir, cp.id DESC
             LIMIT $limit";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetchAll();
}

function comprobantes_kpis(PDO $pdo, array $tipos): array
{
    $placeholders = [];
    $params = [];
    foreach ($tipos as $i => $t) {
        $key = ':tipo' . $i;
        $placeholders[] = $key;
        $params[$key]   = $t;
    }
    $inClause = implode(',', $placeholders);

    $total = $pdo->prepare("SELECT COUNT(*) FROM comprobantes WHERE tipo IN ($inClause)");
    $total->execute($params);

    $mes = $pdo->prepare(
        "SELECT COUNT(*), COALESCE(SUM(total),0)
           FROM comprobantes
          WHERE tipo IN ($inClause)
            AND emision >= CURDATE() - INTERVAL 30 DAY"
    );
    $mes->execute($params);
    $mesRow = $mes->fetch(PDO::FETCH_NUM);

    return [
        'total'          => (int) $total->fetchColumn(),
        'cantidad_30d'   => (int)   $mesRow[0],
        'monto_30d'      => (float) $mesRow[1],
    ];
}
