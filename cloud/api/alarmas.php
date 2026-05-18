<?php
/**
 * Endpoint REST de gestión de alarmas.
 *
 *   GET    /api/alarmas.php          → { alarmas, kpis, comunidades, online_interval_seconds }
 *   GET    /api/alarmas.php?id=N     → alarma individual
 *   POST   /api/alarmas.php          → crear (body JSON)
 *   PUT    /api/alarmas.php?id=N     → actualizar (body JSON)
 *   DELETE /api/alarmas.php?id=N     → eliminar
 */

require_once __DIR__ . '/bootstrap.php';

requireAuth();

const ALARMA_ONLINE_SECONDS = 600;

$pdo    = db();
$method = $_SERVER['REQUEST_METHOD'];
$id     = isset($_GET['id']) && ctype_digit((string) $_GET['id']) ? (int) $_GET['id'] : 0;

try {
    switch ($method) {

        case 'GET':
            if ($id > 0) {
                json_ok(alarma_get($pdo, $id));
            }
            json_ok([
                'alarmas'                 => alarmas_listar($pdo, $_GET),
                'kpis'                    => alarmas_kpis($pdo),
                'comunidades'             => $pdo->query('SELECT id, nombre FROM comunidades ORDER BY nombre')->fetchAll(),
                'online_interval_seconds' => ALARMA_ONLINE_SECONDS,
            ]);
            break;

        case 'POST':
            $datos = alarma_leer_body();
            alarma_validar_payload($datos);

            $stmt = $pdo->prepare(
                'INSERT INTO alarmas
                     (nombre, comunidad, domicilio, ciudad, identidad,
                      tipo, hardware, firmware, revision,
                      latitud, longitud, estado, instalacion)
                 VALUES
                     (:nombre, :comunidad, :domicilio, :ciudad, :identidad,
                      :tipo, :hardware, :firmware, :revision,
                      :latitud, :longitud, :estado, NOW())'
            );
            $stmt->execute([
                ':nombre'    => $datos['nombre'],
                ':comunidad' => $datos['comunidad'],
                ':domicilio' => $datos['domicilio'],
                ':ciudad'    => $datos['ciudad'],
                ':identidad' => $datos['identidad'],
                ':tipo'      => $datos['tipo'],
                ':hardware'  => $datos['hardware'],
                ':firmware'  => $datos['firmware'],
                ':revision'  => $datos['revision'],
                ':latitud'   => $datos['latitud'],
                ':longitud'  => $datos['longitud'],
                ':estado'    => $datos['estado'],
            ]);
            json_ok(['id' => (int) $pdo->lastInsertId()]);
            break;

        case 'PUT':
            if ($id <= 0) {
                json_error('ID inválido.', 422);
            }
            $datos = alarma_leer_body();
            alarma_validar_payload($datos);

            $stmt = $pdo->prepare(
                'UPDATE alarmas
                    SET nombre    = :nombre,
                        comunidad = :comunidad,
                        domicilio = :domicilio,
                        ciudad    = :ciudad,
                        identidad = :identidad,
                        tipo      = :tipo,
                        hardware  = :hardware,
                        firmware  = :firmware,
                        revision  = :revision,
                        latitud   = :latitud,
                        longitud  = :longitud,
                        estado    = :estado
                  WHERE id = :id'
            );
            $stmt->execute([
                ':nombre'    => $datos['nombre'],
                ':comunidad' => $datos['comunidad'],
                ':domicilio' => $datos['domicilio'],
                ':ciudad'    => $datos['ciudad'],
                ':identidad' => $datos['identidad'],
                ':tipo'      => $datos['tipo'],
                ':hardware'  => $datos['hardware'],
                ':firmware'  => $datos['firmware'],
                ':revision'  => $datos['revision'],
                ':latitud'   => $datos['latitud'],
                ':longitud'  => $datos['longitud'],
                ':estado'    => $datos['estado'],
                ':id'        => $id,
            ]);
            json_ok();
            break;

        case 'DELETE':
            if ($id <= 0) {
                json_error('ID inválido.', 422);
            }
            $stmt = $pdo->prepare('DELETE FROM alarmas WHERE id = :id');
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

function alarma_leer_body(): array
{
    $raw  = file_get_contents('php://input') ?: '';
    $body = json_decode($raw, true);
    return is_array($body) ? $body : [];
}

function alarma_validar_payload(array &$datos): void
{
    $datos['nombre']    = trim((string) ($datos['nombre']    ?? ''));
    $datos['domicilio'] = trim((string) ($datos['domicilio'] ?? ''));
    $datos['ciudad']    = trim((string) ($datos['ciudad']    ?? ''));
    $datos['identidad'] = trim((string) ($datos['identidad'] ?? ''));
    $datos['tipo']      = trim((string) ($datos['tipo']      ?? ''));
    $datos['hardware']  = trim((string) ($datos['hardware']  ?? ''));
    $datos['firmware']  = trim((string) ($datos['firmware']  ?? ''));
    $datos['revision']  = trim((string) ($datos['revision']  ?? ''));
    $datos['latitud']   = trim((string) ($datos['latitud']   ?? ''));
    $datos['longitud']  = trim((string) ($datos['longitud']  ?? ''));

    $datos['domicilio'] = $datos['domicilio'] !== '' ? $datos['domicilio'] : null;
    $datos['ciudad']    = $datos['ciudad']    !== '' ? $datos['ciudad']    : null;
    $datos['identidad'] = $datos['identidad'] !== '' ? $datos['identidad'] : null;
    $datos['tipo']      = $datos['tipo']      !== '' ? mb_substr($datos['tipo'], 0, 1) : null;
    $datos['hardware']  = $datos['hardware']  !== '' ? $datos['hardware']  : null;
    $datos['firmware']  = $datos['firmware']  !== '' ? $datos['firmware']  : null;
    $datos['revision']  = $datos['revision']  !== '' ? $datos['revision']  : null;
    $datos['latitud']   = $datos['latitud']   !== '' ? $datos['latitud']   : null;
    $datos['longitud']  = $datos['longitud']  !== '' ? $datos['longitud']  : null;

    $datos['comunidad'] = isset($datos['comunidad']) && ctype_digit((string) $datos['comunidad'])
        ? (int) $datos['comunidad'] : null;
    $datos['estado']    = !empty($datos['estado']) ? 1 : 0;

    if ($datos['nombre'] === '') {
        json_error('El nombre es obligatorio.', 422);
    }
    if (mb_strlen($datos['nombre']) > 255) {
        json_error('El nombre no puede tener más de 255 caracteres.', 422);
    }
    if ($datos['comunidad'] === null) {
        json_error('La comunidad es obligatoria.', 422);
    }
    if ($datos['ciudad']    !== null && mb_strlen($datos['ciudad'])    > 50)  { json_error('La ciudad no puede tener más de 50 caracteres.', 422); }
    if ($datos['identidad'] !== null && mb_strlen($datos['identidad']) > 50)  { json_error('La identidad no puede tener más de 50 caracteres.', 422); }
    if ($datos['hardware']  !== null && mb_strlen($datos['hardware'])  > 50)  { json_error('Hardware no puede tener más de 50 caracteres.', 422); }
    if ($datos['firmware']  !== null && mb_strlen($datos['firmware'])  > 50)  { json_error('Firmware no puede tener más de 50 caracteres.', 422); }
    if ($datos['revision']  !== null && mb_strlen($datos['revision'])  > 50)  { json_error('Revisión no puede tener más de 50 caracteres.', 422); }
    if ($datos['domicilio'] !== null && mb_strlen($datos['domicilio']) > 255) { json_error('El domicilio no puede tener más de 255 caracteres.', 422); }
}

function alarma_get(PDO $pdo, int $id): array
{
    // Devuelve todos los campos del registro, con nombres resueltos para
    // comunidad, equipo y ciudad (referenciada solo como string libre).
    $stmt = $pdo->prepare(
        'SELECT a.id, a.nombre, a.equipo, a.tipo, a.generacion,
                a.hardware, a.firmware, a.revision,
                a.prioridad, a.altura, a.comunicacion, a.propagacion, a.identidad,
                a.comunidad, a.domicilio, a.ciudad, a.foto, a.latitud, a.longitud,
                a.instalacion, a.atendida, a.garantia, a.desinstalacion,
                a.titularidad, a.estado, a.disuasion,
                a.inicio, a.latido, a.energia, a.bateria, a.reinicios,
                a.senal, a.reconexiones, a.salud, a.envio, a.parametros,
                c.nombre AS comunidad_nombre,
                e.nombre AS equipo_nombre,
                e.uuid   AS equipo_uuid
           FROM alarmas a
           LEFT JOIN comunidades c ON c.id = a.comunidad
           LEFT JOIN equipos     e ON e.id = a.equipo
          WHERE a.id = :id
          LIMIT 1'
    );
    $stmt->execute([':id' => $id]);
    $a = $stmt->fetch();
    if (!$a) {
        json_error('Alarma no encontrada.', 404);
    }
    return $a;
}

function alarmas_listar(PDO $pdo, array $opts = []): array
{
    $sortCols = [
        'id'        => 'a.id',
        'nombre'    => 'a.nombre',
        'comunidad' => 'c.nombre',
        'latido'    => 'a.latido',
        'instalacion' => 'a.instalacion',
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
        $where[] = 'a.id = :filtro_id';
        $params[':filtro_id'] = (int) $opts['filtro_id'];
    }
    $nombre = trim((string) ($opts['nombre'] ?? ''));
    if ($nombre !== '') {
        $where[] = 'a.nombre LIKE :nombre';
        $params[':nombre'] = '%' . $nombre . '%';
    }
    if (!empty($opts['comunidad']) && ctype_digit((string) $opts['comunidad'])) {
        $where[] = 'a.comunidad = :comunidad';
        $params[':comunidad'] = (int) $opts['comunidad'];
    }
    $estado = (string) ($opts['estado'] ?? '');
    if ($estado === '0' || $estado === '1') {
        $where[] = 'COALESCE(a.estado, 0) = :estado';
        $params[':estado'] = (int) $estado;
    }
    $conexion = (string) ($opts['conexion'] ?? '');
    if ($conexion === 'online') {
        $where[] = 'a.latido IS NOT NULL AND a.latido >= (NOW() - INTERVAL :win SECOND)';
        $params[':win'] = ALARMA_ONLINE_SECONDS;
    } elseif ($conexion === 'offline') {
        $where[] = '(a.latido IS NULL OR a.latido < (NOW() - INTERVAL :win SECOND))';
        $params[':win'] = ALARMA_ONLINE_SECONDS;
    }

    $sql = 'SELECT a.id, a.nombre, a.domicilio, a.ciudad, a.identidad,
                   a.tipo, a.hardware, a.firmware, a.estado, a.latido,
                   a.comunidad, c.nombre AS comunidad_nombre
              FROM alarmas a
              LEFT JOIN comunidades c ON c.id = a.comunidad';
    if ($where) {
        $sql .= ' WHERE ' . implode(' AND ', $where);
    }
    $sql .= " ORDER BY {$sortCols[$sortKey]} $dir LIMIT $limit";

    $stmt = $pdo->prepare($sql);
    foreach ($params as $k => $v) {
        $stmt->bindValue($k, $v, is_int($v) ? PDO::PARAM_INT : PDO::PARAM_STR);
    }
    $stmt->execute();
    return $stmt->fetchAll();
}

function alarmas_kpis(PDO $pdo): array
{
    $win = ALARMA_ONLINE_SECONDS;
    $online = (int) $pdo->query(
        "SELECT COUNT(*) FROM alarmas WHERE latido IS NOT NULL AND latido >= (NOW() - INTERVAL $win SECOND)"
    )->fetchColumn();
    $total = (int) $pdo->query('SELECT COUNT(*) FROM alarmas')->fetchColumn();
    return [
        'total'   => $total,
        'online'  => $online,
        'offline' => max($total - $online, 0),
    ];
}
