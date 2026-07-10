<?php
/**
 * Endpoint REST de gestión de talonarios.
 *
 *   GET    /api/talonarios.php          → { talonarios, kpis }
 *   GET    /api/talonarios.php?id=N     → talonario individual
 *   POST   /api/talonarios.php          → crear (body JSON)
 *   PUT    /api/talonarios.php?id=N     → actualizar (body JSON)
 *   DELETE /api/talonarios.php?id=N     → eliminar
 *
 * Trabaja sobre la tabla `talonarios` del esquema compartido
 * (ver db/schema.sql).
 */

require_once __DIR__ . '/bootstrap.php';

requireAuth();

$pdo    = db();
$method = $_SERVER['REQUEST_METHOD'];
$id     = isset($_GET['id']) && ctype_digit((string) $_GET['id']) ? (int) $_GET['id'] : 0;

try {
    switch ($method) {

        case 'GET':
            if ($id > 0) {
                json_ok(talonario_get($pdo, $id));
            }
            json_ok([
                'talonarios' => talonarios_listar($pdo, $_GET),
                'kpis'       => talonarios_kpis($pdo),
            ]);
            break;

        case 'POST':
            $datos = talonario_leer_body();
            talonario_validar_payload($datos);

            $stmt = $pdo->prepare(
                'INSERT INTO talonarios
                     (nombre, empresa, tipo, punto, serie, fiscal, estado)
                 VALUES
                     (:nombre, :empresa, :tipo, :punto, :serie, :fiscal, :estado)'
            );
            $stmt->execute([
                ':nombre'  => $datos['nombre'],
                ':empresa' => $datos['empresa'],
                ':tipo'    => $datos['tipo'],
                ':punto'   => $datos['punto'],
                ':serie'   => $datos['serie'],
                ':fiscal'  => $datos['fiscal'],
                ':estado'  => $datos['estado'],
            ]);
            json_ok(['id' => (int) $pdo->lastInsertId()]);
            break;

        case 'PUT':
            if ($id <= 0) {
                json_error('ID inválido.', 422);
            }
            $datos = talonario_leer_body();
            talonario_validar_payload($datos);

            $stmt = $pdo->prepare(
                'UPDATE talonarios
                    SET nombre  = :nombre,
                        empresa = :empresa,
                        tipo    = :tipo,
                        punto   = :punto,
                        serie   = :serie,
                        fiscal  = :fiscal,
                        estado  = :estado
                  WHERE id = :id'
            );
            $stmt->execute([
                ':nombre'  => $datos['nombre'],
                ':empresa' => $datos['empresa'],
                ':tipo'    => $datos['tipo'],
                ':punto'   => $datos['punto'],
                ':serie'   => $datos['serie'],
                ':fiscal'  => $datos['fiscal'],
                ':estado'  => $datos['estado'],
                ':id'      => $id,
            ]);
            json_ok();
            break;

        case 'DELETE':
            if ($id <= 0) {
                json_error('ID inválido.', 422);
            }
            $stmt = $pdo->prepare('SELECT COUNT(*) FROM comprobantes WHERE talonario = :id');
            $stmt->execute([':id' => $id]);
            if ((int) $stmt->fetchColumn() > 0) {
                json_error('No se puede eliminar: el talonario tiene comprobantes asociados.', 409);
            }
            $stmt = $pdo->prepare('DELETE FROM talonarios WHERE id = :id');
            $stmt->execute([':id' => $id]);
            json_ok();
            break;

        default:
            json_error('Método no permitido.', 405);
    }
} catch (Throwable $e) {
    $msg = APP_ENV === 'production' ? 'Error del servidor.' : $e->getMessage();
    json_error($msg, 500);
}

// --- Helpers ----------------------------------------------------------------

function talonario_leer_body(): array
{
    $raw  = file_get_contents('php://input') ?: '';
    $body = json_decode($raw, true);
    return is_array($body) ? $body : [];
}

function talonario_validar_payload(array &$datos): void
{
    $datos['nombre'] = trim((string) ($datos['nombre'] ?? ''));
    $datos['tipo']   = strtoupper(trim((string) ($datos['tipo'] ?? '')));
    $datos['fiscal'] = strtoupper(trim((string) ($datos['fiscal'] ?? '')));

    $datos['empresa'] = isset($datos['empresa']) && $datos['empresa'] !== '' ? (int) $datos['empresa'] : null;
    $datos['punto']   = isset($datos['punto'])   && $datos['punto']   !== '' ? (int) $datos['punto']   : null;
    $datos['serie']   = isset($datos['serie'])   && $datos['serie']   !== '' ? (int) $datos['serie']   : null;
    $datos['estado']  = !empty($datos['estado']) ? 1 : 0;

    if ($datos['tipo']   === '') { $datos['tipo']   = null; }
    if ($datos['fiscal'] === '') { $datos['fiscal'] = null; }

    if ($datos['nombre'] === '') {
        json_error('El nombre es obligatorio.', 422);
    }
    if (mb_strlen($datos['nombre']) > 255) {
        json_error('El nombre no puede tener más de 255 caracteres.', 422);
    }
    if ($datos['tipo'] !== null && mb_strlen($datos['tipo']) > 2) {
        json_error('El tipo no puede tener más de 2 caracteres.', 422);
    }
    if ($datos['fiscal'] !== null && mb_strlen($datos['fiscal']) > 1) {
        json_error('Fiscal debe ser un único carácter (S/N).', 422);
    }
}

function talonario_get(PDO $pdo, int $id): array
{
    $stmt = $pdo->prepare(
        'SELECT id, nombre, empresa, tipo, punto, serie, fiscal, estado
           FROM talonarios
          WHERE id = :id
          LIMIT 1'
    );
    $stmt->execute([':id' => $id]);
    $t = $stmt->fetch();
    if (!$t) {
        json_error('Talonario no encontrado.', 404);
    }
    return $t;
}

function talonarios_listar(PDO $pdo, array $opts = []): array
{
    $sortCols = [
        'id'      => 't.id',
        'nombre'  => 't.nombre',
        'tipo'    => 't.tipo',
        'punto'   => 't.punto',
        'serie'   => 't.serie',
        'estado'  => 't.estado',
    ];
    $sortKey = (string) ($opts['sort'] ?? 'id');
    if (!isset($sortCols[$sortKey])) {
        $sortKey = 'id';
    }
    $dir = strtolower((string) ($opts['dir'] ?? 'desc')) === 'asc' ? 'ASC' : 'DESC';

    $limit = isset($opts['limit']) && ctype_digit((string) $opts['limit']) ? (int) $opts['limit'] : 100;
    if ($limit < 1)    { $limit = 100; }
    if ($limit > 1000) { $limit = 1000; }

    $where  = [];
    $params = [];
    if (isset($opts['filtro_id']) && ctype_digit((string) $opts['filtro_id']) && (int) $opts['filtro_id'] > 0) {
        $where[] = 't.id = :filtro_id';
        $params[':filtro_id'] = (int) $opts['filtro_id'];
    }
    $nombre = trim((string) ($opts['nombre'] ?? ''));
    if ($nombre !== '') {
        $where[] = 't.nombre LIKE :nombre';
        $params[':nombre'] = '%' . $nombre . '%';
    }
    $tipo = strtoupper(trim((string) ($opts['tipo'] ?? '')));
    if ($tipo !== '') {
        $where[] = 't.tipo = :tipo';
        $params[':tipo'] = $tipo;
    }
    $estado = (string) ($opts['estado'] ?? '');
    if ($estado === '0' || $estado === '1') {
        $where[] = 'COALESCE(t.estado, 0) = :estado';
        $params[':estado'] = (int) $estado;
    }

    $sql = 'SELECT t.id, t.nombre, t.empresa, t.tipo, t.punto, t.serie, t.fiscal, t.estado,
                   (SELECT COUNT(*) FROM comprobantes cp WHERE cp.talonario = t.id) AS comprobantes_count
              FROM talonarios t';
    if ($where) {
        $sql .= ' WHERE ' . implode(' AND ', $where);
    }
    $sql .= " ORDER BY {$sortCols[$sortKey]} $dir LIMIT $limit";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetchAll();
}

function talonarios_kpis(PDO $pdo): array
{
    return [
        'total'     => (int) $pdo->query('SELECT COUNT(*) FROM talonarios')->fetchColumn(),
        'activos'   => (int) $pdo->query('SELECT COUNT(*) FROM talonarios WHERE estado = 1')->fetchColumn(),
        'inactivos' => (int) $pdo->query('SELECT COUNT(*) FROM talonarios WHERE estado = 0 OR estado IS NULL')->fetchColumn(),
    ];
}
