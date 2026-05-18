<?php
/**
 * Endpoint REST de gestión de equipos.
 *
 *   GET    /api/equipos.php          → { equipos, kpis, agentes, chips }
 *   GET    /api/equipos.php?id=N     → equipo individual
 *   POST   /api/equipos.php          → crear (body JSON)
 *   PUT    /api/equipos.php?id=N     → actualizar (body JSON)
 *   DELETE /api/equipos.php?id=N     → eliminar
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
                json_ok(equipo_get($pdo, $id));
            }
            json_ok([
                'equipos' => equipos_listar($pdo, $_GET),
                'kpis'    => equipos_kpis($pdo),
                'agentes' => $pdo->query('SELECT id, nombre FROM agentes ORDER BY nombre')->fetchAll(),
                'chips'   => $pdo->query('SELECT id, serie, telefono FROM chips ORDER BY serie')->fetchAll(),
            ]);
            break;

        case 'POST':
            $datos = equipo_leer_body();
            equipo_validar_payload($datos);
            if ($datos['uuid'] !== null && equipo_uuid_duplicado($pdo, $datos['uuid'])) {
                json_error('Ya existe un equipo con ese UUID.', 409);
            }

            $stmt = $pdo->prepare(
                'INSERT INTO equipos
                     (uuid, agente, nombre, tipo, serial, hardware, firmware,
                      chip, registrado, control, asignado, habilitado, parametros)
                 VALUES
                     (:uuid, :agente, :nombre, :tipo, :serial, :hardware, :firmware,
                      :chip, NOW(), :control, :asignado, :habilitado, :parametros)'
            );
            $stmt->execute([
                ':uuid'       => $datos['uuid'],
                ':agente'     => $datos['agente'],
                ':nombre'     => $datos['nombre'],
                ':tipo'       => $datos['tipo'],
                ':serial'     => $datos['serial'],
                ':hardware'   => $datos['hardware'],
                ':firmware'   => $datos['firmware'],
                ':chip'       => $datos['chip'],
                ':control'    => $datos['control'],
                ':asignado'   => $datos['asignado'],
                ':habilitado' => $datos['habilitado'],
                ':parametros' => $datos['parametros'],
            ]);
            json_ok(['id' => (int) $pdo->lastInsertId()]);
            break;

        case 'PUT':
            if ($id <= 0) {
                json_error('ID inválido.', 422);
            }
            $datos = equipo_leer_body();
            equipo_validar_payload($datos);
            if ($datos['uuid'] !== null && equipo_uuid_duplicado($pdo, $datos['uuid'], $id)) {
                json_error('Ya existe otro equipo con ese UUID.', 409);
            }

            $stmt = $pdo->prepare(
                'UPDATE equipos
                    SET uuid       = :uuid,
                        agente     = :agente,
                        nombre     = :nombre,
                        tipo       = :tipo,
                        serial     = :serial,
                        hardware   = :hardware,
                        firmware   = :firmware,
                        chip       = :chip,
                        control    = :control,
                        asignado   = :asignado,
                        habilitado = :habilitado,
                        parametros = :parametros
                  WHERE id = :id'
            );
            $stmt->execute([
                ':uuid'       => $datos['uuid'],
                ':agente'     => $datos['agente'],
                ':nombre'     => $datos['nombre'],
                ':tipo'       => $datos['tipo'],
                ':serial'     => $datos['serial'],
                ':hardware'   => $datos['hardware'],
                ':firmware'   => $datos['firmware'],
                ':chip'       => $datos['chip'],
                ':control'    => $datos['control'],
                ':asignado'   => $datos['asignado'],
                ':habilitado' => $datos['habilitado'],
                ':parametros' => $datos['parametros'],
                ':id'         => $id,
            ]);
            json_ok();
            break;

        case 'DELETE':
            if ($id <= 0) {
                json_error('ID inválido.', 422);
            }
            $stmt = $pdo->prepare('DELETE FROM equipos WHERE id = :id');
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

function equipo_leer_body(): array
{
    $raw  = file_get_contents('php://input') ?: '';
    $body = json_decode($raw, true);
    return is_array($body) ? $body : [];
}

function equipo_validar_payload(array &$datos): void
{
    $datos['uuid']       = trim((string) ($datos['uuid']       ?? ''));
    $datos['nombre']     = trim((string) ($datos['nombre']     ?? ''));
    $datos['tipo']       = trim((string) ($datos['tipo']       ?? ''));
    $datos['serial']     = trim((string) ($datos['serial']     ?? ''));
    $datos['hardware']   = trim((string) ($datos['hardware']   ?? ''));
    $datos['firmware']   = trim((string) ($datos['firmware']   ?? ''));
    $datos['parametros'] = trim((string) ($datos['parametros'] ?? ''));

    $datos['uuid']       = $datos['uuid']       !== '' ? $datos['uuid']       : null;
    $datos['nombre']     = $datos['nombre']     !== '' ? $datos['nombre']     : null;
    $datos['tipo']       = $datos['tipo']       !== '' ? mb_substr($datos['tipo'], 0, 1) : null;
    $datos['serial']     = $datos['serial']     !== '' ? $datos['serial']     : null;
    $datos['hardware']   = $datos['hardware']   !== '' ? $datos['hardware']   : null;
    $datos['firmware']   = $datos['firmware']   !== '' ? $datos['firmware']   : null;
    $datos['parametros'] = $datos['parametros'] !== '' ? $datos['parametros'] : null;

    $datos['agente'] = isset($datos['agente']) && ctype_digit((string) $datos['agente'])
        ? (int) $datos['agente'] : null;
    $datos['chip'] = isset($datos['chip']) && ctype_digit((string) $datos['chip'])
        ? (int) $datos['chip'] : null;
    $datos['control'] = isset($datos['control']) && ctype_digit((string) $datos['control'])
        ? (int) $datos['control'] : null;

    $datos['asignado']   = !empty($datos['asignado'])   ? 'S' : 'N';
    $datos['habilitado'] = !empty($datos['habilitado']) ? 'S' : 'N';

    if ($datos['uuid']     !== null && mb_strlen($datos['uuid'])     > 50)  { json_error('El UUID no puede tener más de 50 caracteres.', 422); }
    if ($datos['nombre']   !== null && mb_strlen($datos['nombre'])   > 100) { json_error('El nombre no puede tener más de 100 caracteres.', 422); }
    if ($datos['serial']   !== null && mb_strlen($datos['serial'])   > 50)  { json_error('El serial no puede tener más de 50 caracteres.', 422); }
    if ($datos['hardware'] !== null && mb_strlen($datos['hardware']) > 50)  { json_error('Hardware no puede tener más de 50 caracteres.', 422); }
    if ($datos['firmware'] !== null && mb_strlen($datos['firmware']) > 50)  { json_error('Firmware no puede tener más de 50 caracteres.', 422); }
    if ($datos['parametros'] !== null && mb_strlen($datos['parametros']) > 255) {
        json_error('Parámetros no puede tener más de 255 caracteres.', 422);
    }
}

function equipo_uuid_duplicado(PDO $pdo, string $uuid, int $excluir_id = 0): bool
{
    $sql = 'SELECT id FROM equipos WHERE uuid = :uuid';
    if ($excluir_id > 0) {
        $sql .= ' AND id <> :id';
    }
    $sql .= ' LIMIT 1';
    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(':uuid', $uuid);
    if ($excluir_id > 0) {
        $stmt->bindValue(':id', $excluir_id, PDO::PARAM_INT);
    }
    $stmt->execute();
    return (bool) $stmt->fetchColumn();
}

function equipo_get(PDO $pdo, int $id): array
{
    // Devuelve todos los campos del registro, con nombres resueltos para
    // agente y chip (referenciados como IDs).
    $stmt = $pdo->prepare(
        'SELECT e.id, e.uuid, e.agente, e.nombre, e.tipo, e.serial,
                e.hardware, e.firmware, e.chip, e.registrado, e.control,
                e.asignado, e.habilitado, e.parametros,
                a.nombre   AS agente_nombre,
                c.serie    AS chip_serie,
                c.telefono AS chip_telefono
           FROM equipos e
           LEFT JOIN agentes a ON a.id = e.agente
           LEFT JOIN chips   c ON c.id = e.chip
          WHERE e.id = :id
          LIMIT 1'
    );
    $stmt->execute([':id' => $id]);
    $eq = $stmt->fetch();
    if (!$eq) {
        json_error('Equipo no encontrado.', 404);
    }
    return $eq;
}

function equipos_listar(PDO $pdo, array $opts = []): array
{
    $sortCols = [
        'id'         => 'e.id',
        'nombre'     => 'e.nombre',
        'agente'     => 'a.nombre',
        'tipo'       => 'e.tipo',
        'serial'     => 'e.serial',
        'registrado' => 'e.registrado',
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
        $where[] = 'e.id = :filtro_id';
        $params[':filtro_id'] = (int) $opts['filtro_id'];
    }
    $nombre = trim((string) ($opts['nombre'] ?? ''));
    if ($nombre !== '') {
        $where[] = 'e.nombre LIKE :nombre';
        $params[':nombre'] = '%' . $nombre . '%';
    }
    if (!empty($opts['agente']) && ctype_digit((string) $opts['agente'])) {
        $where[] = 'e.agente = :agente';
        $params[':agente'] = (int) $opts['agente'];
    }
    $tipo = trim((string) ($opts['tipo'] ?? ''));
    if ($tipo !== '') {
        $where[] = 'e.tipo = :tipo';
        $params[':tipo'] = mb_substr($tipo, 0, 1);
    }
    $habilitado = (string) ($opts['habilitado'] ?? '');
    if ($habilitado === 'S' || $habilitado === 'N') {
        $where[] = 'COALESCE(e.habilitado, \'N\') = :habilitado';
        $params[':habilitado'] = $habilitado;
    }
    $asignado = (string) ($opts['asignado'] ?? '');
    if ($asignado === 'S' || $asignado === 'N') {
        $where[] = 'COALESCE(e.asignado, \'N\') = :asignado';
        $params[':asignado'] = $asignado;
    }

    $sql = 'SELECT e.id, e.uuid, e.nombre, e.tipo, e.serial,
                   e.hardware, e.firmware, e.registrado,
                   e.asignado, e.habilitado,
                   e.agente, a.nombre AS agente_nombre,
                   e.chip,   c.serie  AS chip_serie
              FROM equipos e
              LEFT JOIN agentes a ON a.id = e.agente
              LEFT JOIN chips   c ON c.id = e.chip';
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

function equipos_kpis(PDO $pdo): array
{
    return [
        'total'         => (int) $pdo->query('SELECT COUNT(*) FROM equipos')->fetchColumn(),
        'habilitados'   => (int) $pdo->query("SELECT COUNT(*) FROM equipos WHERE habilitado = 'S'")->fetchColumn(),
        'asignados'     => (int) $pdo->query("SELECT COUNT(*) FROM equipos WHERE asignado   = 'S'")->fetchColumn(),
        'sin_asignar'   => (int) $pdo->query("SELECT COUNT(*) FROM equipos WHERE asignado IS NULL OR asignado <> 'S'")->fetchColumn(),
    ];
}