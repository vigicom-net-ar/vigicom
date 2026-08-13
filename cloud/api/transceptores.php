<?php
/**
 * Endpoint REST de gestión de transceptores (brokers MQTT).
 *
 *   GET    /api/transceptores.php          → { transceptores, kpis }
 *   GET    /api/transceptores.php?id=N     → transceptor individual
 *   POST   /api/transceptores.php          → crear (body JSON)
 *   PUT    /api/transceptores.php?id=N     → actualizar (body JSON)
 *   DELETE /api/transceptores.php?id=N     → eliminar
 *
 * Regla: sólo un transceptor puede estar marcado como `predeterminado = 'S'`.
 * Al guardar uno como predeterminado, el resto se apaga automáticamente.
 *
 * Cada broker maneja dos canales independientes con sus propias credenciales:
 *   administracion_* → panel web del broker (RabbitMQ 15672, EMQX 18083…).
 *   transmision_*    → puerto MQTT que usan las alarmas para reportarse.
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
                json_ok(transceptor_get($pdo, $id));
            }
            json_ok([
                'transceptores' => transceptores_listar($pdo, $_GET),
                'kpis'          => transceptores_kpis($pdo),
            ]);
            break;

        case 'POST':
            $datos = transceptor_leer_body();
            transceptor_validar_payload($datos);

            $pdo->beginTransaction();
            $stmt = $pdo->prepare(
                'INSERT INTO transceptores
                     (nombre, host,
                      administracion_puerto, administracion_usuario, administracion_contrasena,
                      transmision_puerto,    transmision_usuario,    transmision_contrasena,
                      transmision_entrada,   transmision_salida,
                      predeterminado, habilitado)
                 VALUES
                     (:nombre, :host,
                      :administracion_puerto, :administracion_usuario, :administracion_contrasena,
                      :transmision_puerto,    :transmision_usuario,    :transmision_contrasena,
                      :transmision_entrada,   :transmision_salida,
                      :predeterminado, :habilitado)'
            );
            $stmt->execute([
                ':nombre'                    => $datos['nombre'],
                ':host'                      => $datos['host'],
                ':administracion_puerto'     => $datos['administracion_puerto'],
                ':administracion_usuario'    => $datos['administracion_usuario'],
                ':administracion_contrasena' => $datos['administracion_contrasena'],
                ':transmision_puerto'        => $datos['transmision_puerto'],
                ':transmision_usuario'       => $datos['transmision_usuario'],
                ':transmision_contrasena'    => $datos['transmision_contrasena'],
                ':transmision_entrada'       => $datos['transmision_entrada'],
                ':transmision_salida'        => $datos['transmision_salida'],
                ':predeterminado'            => $datos['predeterminado'],
                ':habilitado'                => $datos['habilitado'],
            ]);
            $nuevoId = (int) $pdo->lastInsertId();
            if ($datos['predeterminado'] === 'S') {
                transceptor_apagar_otros_predeterminados($pdo, $nuevoId);
            }
            $pdo->commit();

            json_ok(['id' => $nuevoId]);
            break;

        case 'PUT':
            if ($id <= 0) {
                json_error('ID inválido.', 422);
            }
            $datos = transceptor_leer_body();
            transceptor_validar_payload($datos);

            $pdo->beginTransaction();
            $stmt = $pdo->prepare(
                'UPDATE transceptores
                    SET nombre                    = :nombre,
                        host                      = :host,
                        administracion_puerto     = :administracion_puerto,
                        administracion_usuario    = :administracion_usuario,
                        administracion_contrasena = :administracion_contrasena,
                        transmision_puerto        = :transmision_puerto,
                        transmision_usuario       = :transmision_usuario,
                        transmision_contrasena    = :transmision_contrasena,
                        transmision_entrada       = :transmision_entrada,
                        transmision_salida        = :transmision_salida,
                        predeterminado            = :predeterminado,
                        habilitado                = :habilitado
                  WHERE id = :id'
            );
            $stmt->execute([
                ':nombre'                    => $datos['nombre'],
                ':host'                      => $datos['host'],
                ':administracion_puerto'     => $datos['administracion_puerto'],
                ':administracion_usuario'    => $datos['administracion_usuario'],
                ':administracion_contrasena' => $datos['administracion_contrasena'],
                ':transmision_puerto'        => $datos['transmision_puerto'],
                ':transmision_usuario'       => $datos['transmision_usuario'],
                ':transmision_contrasena'    => $datos['transmision_contrasena'],
                ':transmision_entrada'       => $datos['transmision_entrada'],
                ':transmision_salida'        => $datos['transmision_salida'],
                ':predeterminado'            => $datos['predeterminado'],
                ':habilitado'                => $datos['habilitado'],
                ':id'                        => $id,
            ]);
            if ($datos['predeterminado'] === 'S') {
                transceptor_apagar_otros_predeterminados($pdo, $id);
            }
            $pdo->commit();

            json_ok();
            break;

        case 'DELETE':
            if ($id <= 0) {
                json_error('ID inválido.', 422);
            }
            $stmt = $pdo->prepare('DELETE FROM transceptores WHERE id = :id');
            $stmt->execute([':id' => $id]);
            json_ok();
            break;

        default:
            json_error('Método no permitido.', 405);
    }
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    $msg = APP_ENV === 'production' ? 'Error del servidor.' : $e->getMessage();
    json_error($msg, 500);
}

// --- Helpers ----------------------------------------------------------------

function transceptor_leer_body(): array
{
    $raw  = file_get_contents('php://input') ?: '';
    $body = json_decode($raw, true);
    return is_array($body) ? $body : [];
}

function transceptor_validar_payload(array &$datos): void
{
    $datos['nombre']                    = trim((string) ($datos['nombre']                    ?? ''));
    $datos['host']                      = trim((string) ($datos['host']                      ?? ''));
    $datos['administracion_usuario']    = trim((string) ($datos['administracion_usuario']    ?? ''));
    $datos['administracion_contrasena'] = (string) ($datos['administracion_contrasena']      ?? '');
    $datos['transmision_usuario']       = trim((string) ($datos['transmision_usuario']       ?? ''));
    $datos['transmision_contrasena']    = (string) ($datos['transmision_contrasena']         ?? '');
    $datos['transmision_entrada']       = trim((string) ($datos['transmision_entrada']       ?? ''));
    $datos['transmision_salida']        = trim((string) ($datos['transmision_salida']        ?? ''));

    $datos['nombre']                    = $datos['nombre']                    !== '' ? $datos['nombre']                    : null;
    $datos['host']                      = $datos['host']                      !== '' ? $datos['host']                      : null;
    $datos['administracion_usuario']    = $datos['administracion_usuario']    !== '' ? $datos['administracion_usuario']    : null;
    $datos['administracion_contrasena'] = $datos['administracion_contrasena'] !== '' ? $datos['administracion_contrasena'] : null;
    $datos['transmision_usuario']       = $datos['transmision_usuario']       !== '' ? $datos['transmision_usuario']       : null;
    $datos['transmision_contrasena']    = $datos['transmision_contrasena']    !== '' ? $datos['transmision_contrasena']    : null;
    $datos['transmision_entrada']       = $datos['transmision_entrada']       !== '' ? $datos['transmision_entrada']       : null;
    $datos['transmision_salida']        = $datos['transmision_salida']        !== '' ? $datos['transmision_salida']        : null;

    $datos['administracion_puerto'] = isset($datos['administracion_puerto']) && $datos['administracion_puerto'] !== ''
        && ctype_digit((string) $datos['administracion_puerto'])
        ? (int) $datos['administracion_puerto'] : null;
    $datos['transmision_puerto'] = isset($datos['transmision_puerto']) && $datos['transmision_puerto'] !== ''
        && ctype_digit((string) $datos['transmision_puerto'])
        ? (int) $datos['transmision_puerto'] : null;

    $datos['predeterminado'] = !empty($datos['predeterminado']) ? 'S' : 'N';
    $datos['habilitado']     = !empty($datos['habilitado'])     ? 'S' : 'N';

    if ($datos['nombre'] === null) {
        json_error('El nombre es obligatorio.', 422);
    }
    if ($datos['host'] === null) {
        json_error('El host es obligatorio.', 422);
    }
    if (mb_strlen($datos['nombre']) > 100) { json_error('El nombre no puede tener más de 100 caracteres.', 422); }
    if (mb_strlen($datos['host'])   > 255) { json_error('El host no puede tener más de 255 caracteres.', 422); }

    foreach (['administracion_usuario', 'transmision_usuario'] as $campo) {
        if ($datos[$campo] !== null && mb_strlen($datos[$campo]) > 100) {
            json_error('El campo ' . str_replace('_', ' ', $campo) . ' no puede tener más de 100 caracteres.', 422);
        }
    }
    foreach (['administracion_contrasena', 'transmision_contrasena', 'transmision_entrada', 'transmision_salida'] as $campo) {
        if ($datos[$campo] !== null && mb_strlen($datos[$campo]) > 255) {
            json_error('El campo ' . str_replace('_', ' ', $campo) . ' no puede tener más de 255 caracteres.', 422);
        }
    }
    foreach (['administracion_puerto', 'transmision_puerto'] as $campo) {
        if ($datos[$campo] !== null && ($datos[$campo] < 1 || $datos[$campo] > 65535)) {
            json_error('El ' . str_replace('_', ' ', $campo) . ' debe estar entre 1 y 65535.', 422);
        }
    }
}

function transceptor_apagar_otros_predeterminados(PDO $pdo, int $excluirId): void
{
    $stmt = $pdo->prepare(
        "UPDATE transceptores SET predeterminado = 'N' WHERE id <> :id AND predeterminado = 'S'"
    );
    $stmt->execute([':id' => $excluirId]);
}

function transceptor_get(PDO $pdo, int $id): array
{
    $stmt = $pdo->prepare(
        'SELECT id, nombre, host,
                administracion_puerto, administracion_usuario, administracion_contrasena,
                transmision_puerto,    transmision_usuario,    transmision_contrasena,
                transmision_entrada,   transmision_salida,
                predeterminado, habilitado
           FROM transceptores
          WHERE id = :id
          LIMIT 1'
    );
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch();
    if (!$row) {
        json_error('Transceptor no encontrado.', 404);
    }
    return $row;
}

function transceptores_listar(PDO $pdo, array $opts = []): array
{
    $sortCols = [
        'id'                    => 't.id',
        'nombre'                => 't.nombre',
        'host'                  => 't.host',
        'administracion_puerto' => 't.administracion_puerto',
        'transmision_puerto'    => 't.transmision_puerto',
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
    $host = trim((string) ($opts['host'] ?? ''));
    if ($host !== '') {
        $where[] = 't.host LIKE :host';
        $params[':host'] = '%' . $host . '%';
    }
    $habilitado = (string) ($opts['habilitado'] ?? '');
    if ($habilitado === 'S' || $habilitado === 'N') {
        $where[] = "COALESCE(t.habilitado, 'N') = :habilitado";
        $params[':habilitado'] = $habilitado;
    }
    $predeterminado = (string) ($opts['predeterminado'] ?? '');
    if ($predeterminado === 'S' || $predeterminado === 'N') {
        $where[] = "COALESCE(t.predeterminado, 'N') = :predeterminado";
        $params[':predeterminado'] = $predeterminado;
    }

    $sql = 'SELECT t.id, t.nombre, t.host,
                   t.administracion_puerto, t.administracion_usuario,
                   t.transmision_puerto,    t.transmision_usuario,
                   t.predeterminado, t.habilitado
              FROM transceptores t';
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

function transceptores_kpis(PDO $pdo): array
{
    return [
        'total'          => (int) $pdo->query('SELECT COUNT(*) FROM transceptores')->fetchColumn(),
        'habilitados'    => (int) $pdo->query("SELECT COUNT(*) FROM transceptores WHERE habilitado = 'S'")->fetchColumn(),
        'predeterminado' => (int) $pdo->query("SELECT COUNT(*) FROM transceptores WHERE predeterminado = 'S'")->fetchColumn(),
    ];
}
