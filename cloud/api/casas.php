<?php
/**
 * Endpoint REST de gestión de casas.
 *
 *   GET    /api/casas.php          → { casas, kpis, comunidades }
 *   GET    /api/casas.php?id=N     → casa individual
 *   POST   /api/casas.php          → crear (body JSON)
 *   PUT    /api/casas.php?id=N     → actualizar (body JSON)
 *   DELETE /api/casas.php?id=N     → eliminar
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
                json_ok(casa_get($pdo, $id));
            }
            json_ok([
                'casas'       => casas_listar($pdo, $_GET),
                'kpis'        => casas_kpis($pdo),
                'comunidades' => $pdo->query('SELECT id, nombre FROM comunidades ORDER BY nombre')->fetchAll(),
            ]);
            break;

        case 'POST':
            $datos = casa_leer_body();
            casa_validar_payload($datos);

            $stmt = $pdo->prepare(
                'INSERT INTO casas
                     (comunidad, nombre, domicilio, latitud, longitud, monitoreo, estado, alta)
                 VALUES
                     (:comunidad, :nombre, :domicilio, :latitud, :longitud, :monitoreo, :estado, NOW())'
            );
            $stmt->execute([
                ':comunidad' => $datos['comunidad'],
                ':nombre'    => $datos['nombre'],
                ':domicilio' => $datos['domicilio'],
                ':latitud'   => $datos['latitud'],
                ':longitud'  => $datos['longitud'],
                ':monitoreo' => $datos['monitoreo'],
                ':estado'    => $datos['estado'],
            ]);
            json_ok(['id' => (int) $pdo->lastInsertId()]);
            break;

        case 'PUT':
            if ($id <= 0) {
                json_error('ID inválido.', 422);
            }
            $datos = casa_leer_body();
            casa_validar_payload($datos);

            $stmt = $pdo->prepare(
                'UPDATE casas
                    SET comunidad = :comunidad,
                        nombre    = :nombre,
                        domicilio = :domicilio,
                        latitud   = :latitud,
                        longitud  = :longitud,
                        monitoreo = :monitoreo,
                        estado    = :estado
                  WHERE id = :id'
            );
            $stmt->execute([
                ':comunidad' => $datos['comunidad'],
                ':nombre'    => $datos['nombre'],
                ':domicilio' => $datos['domicilio'],
                ':latitud'   => $datos['latitud'],
                ':longitud'  => $datos['longitud'],
                ':monitoreo' => $datos['monitoreo'],
                ':estado'    => $datos['estado'],
                ':id'        => $id,
            ]);
            json_ok();
            break;

        case 'DELETE':
            if ($id <= 0) {
                json_error('ID inválido.', 422);
            }
            $stmt = $pdo->prepare('DELETE FROM casas WHERE id = :id');
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

function casa_leer_body(): array
{
    $raw  = file_get_contents('php://input') ?: '';
    $body = json_decode($raw, true);
    return is_array($body) ? $body : [];
}

function casa_validar_payload(array &$datos): void
{
    $datos['nombre']    = trim((string) ($datos['nombre']    ?? ''));
    $datos['domicilio'] = trim((string) ($datos['domicilio'] ?? ''));
    $datos['latitud']   = trim((string) ($datos['latitud']   ?? ''));
    $datos['longitud']  = trim((string) ($datos['longitud']  ?? ''));

    $datos['domicilio'] = $datos['domicilio'] !== '' ? $datos['domicilio'] : null;
    $datos['latitud']   = $datos['latitud']   !== '' ? $datos['latitud']   : null;
    $datos['longitud']  = $datos['longitud']  !== '' ? $datos['longitud']  : null;

    $datos['comunidad'] = isset($datos['comunidad']) && ctype_digit((string) $datos['comunidad'])
        ? (int) $datos['comunidad'] : null;
    $datos['monitoreo'] = !empty($datos['monitoreo']) ? '1' : '0';
    $datos['estado']    = !empty($datos['estado'])    ? '1' : '0';

    if ($datos['nombre'] === '') {
        json_error('El nombre es obligatorio.', 422);
    }
    if (mb_strlen($datos['nombre']) > 255) {
        json_error('El nombre no puede tener más de 255 caracteres.', 422);
    }
    if ($datos['comunidad'] === null) {
        json_error('La comunidad es obligatoria.', 422);
    }
    foreach (['domicilio'] as $campo) {
        if ($datos[$campo] !== null && mb_strlen($datos[$campo]) > 255) {
            json_error("El campo $campo no puede tener más de 255 caracteres.", 422);
        }
    }
    foreach (['latitud', 'longitud'] as $campo) {
        if ($datos[$campo] !== null && mb_strlen($datos[$campo]) > 100) {
            json_error("El campo $campo no puede tener más de 100 caracteres.", 422);
        }
    }
}

function casa_get(PDO $pdo, int $id): array
{
    $stmt = $pdo->prepare(
        'SELECT id, comunidad, nombre, domicilio, latitud, longitud, monitoreo, estado
           FROM casas
          WHERE id = :id
          LIMIT 1'
    );
    $stmt->execute([':id' => $id]);
    $c = $stmt->fetch();
    if (!$c) {
        json_error('Casa no encontrada.', 404);
    }
    return $c;
}

function casas_listar(PDO $pdo, array $opts = []): array
{
    $sortCols = [
        'id'        => 'k.id',
        'nombre'    => 'k.nombre',
        'comunidad' => 'c.nombre',
        'domicilio' => 'k.domicilio',
        'alta'      => 'k.alta',
    ];
    $sortKey = (string) ($opts['sort'] ?? 'id');
    if (!isset($sortCols[$sortKey])) {
        $sortKey = 'id';
    }
    $dir = strtolower((string) ($opts['dir'] ?? 'desc')) === 'asc' ? 'ASC' : 'DESC';

    $limit = isset($opts['limit']) && ctype_digit((string) $opts['limit']) ? (int) $opts['limit'] : 200;
    if ($limit < 1)    { $limit = 200; }
    if ($limit > 1000) { $limit = 1000; }

    $where  = [];
    $params = [];
    if (!empty($opts['comunidad']) && ctype_digit((string) $opts['comunidad'])) {
        $where[] = 'k.comunidad = :comunidad';
        $params[':comunidad'] = (int) $opts['comunidad'];
    }
    $monitoreo = (string) ($opts['monitoreo'] ?? '');
    if ($monitoreo === '0' || $monitoreo === '1') {
        $where[] = "COALESCE(k.monitoreo, '0') = :monitoreo";
        $params[':monitoreo'] = $monitoreo;
    }
    $estado = (string) ($opts['estado'] ?? '');
    if ($estado === '0' || $estado === '1') {
        $where[] = "COALESCE(k.estado, '0') = :estado";
        $params[':estado'] = $estado;
    }

    $sql = 'SELECT k.id, k.nombre, k.domicilio, k.latitud, k.longitud,
                   k.monitoreo, k.estado, k.alta,
                   k.comunidad, c.nombre AS comunidad_nombre
              FROM casas k
              LEFT JOIN comunidades c ON c.id = k.comunidad';
    if ($where) {
        $sql .= ' WHERE ' . implode(' AND ', $where);
    }
    $sql .= " ORDER BY {$sortCols[$sortKey]} $dir LIMIT $limit";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetchAll();
}

function casas_kpis(PDO $pdo): array
{
    return [
        'total'        => (int) $pdo->query('SELECT COUNT(*) FROM casas')->fetchColumn(),
        'monitoreadas' => (int) $pdo->query("SELECT COUNT(*) FROM casas WHERE monitoreo = '1'")->fetchColumn(),
        'activas'      => (int) $pdo->query("SELECT COUNT(*) FROM casas WHERE estado = '1'")->fetchColumn(),
    ];
}
