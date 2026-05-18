<?php
/**
 * Endpoint REST de gestión de comunidades.
 *
 *   GET    /api/comunidades.php          → { comunidades, kpis }
 *   GET    /api/comunidades.php?id=N     → comunidad individual
 *   POST   /api/comunidades.php          → crear (body JSON)
 *   PUT    /api/comunidades.php?id=N     → actualizar (body JSON)
 *   DELETE /api/comunidades.php?id=N     → eliminar
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
                json_ok(comunidad_get($pdo, $id));
            }
            json_ok([
                'comunidades' => comunidades_listar($pdo, $_GET),
                'kpis'        => comunidades_kpis($pdo),
            ]);
            break;

        case 'POST':
            $datos = comunidad_leer_body();
            comunidad_validar_payload($datos);
            if (comunidad_nombre_duplicado($pdo, $datos['nombre'])) {
                json_error('Ya existe una comunidad con ese nombre.', 409);
            }

            $stmt = $pdo->prepare(
                'INSERT INTO comunidades
                     (nombre, domicilio, indicaciones, policia, ambulancia, bomberos, estado, registro)
                 VALUES
                     (:nombre, :domicilio, :indicaciones, :policia, :ambulancia, :bomberos, :estado, CURDATE())'
            );
            $stmt->execute([
                ':nombre'       => $datos['nombre'],
                ':domicilio'    => $datos['domicilio'],
                ':indicaciones' => $datos['indicaciones'],
                ':policia'      => $datos['policia'],
                ':ambulancia'   => $datos['ambulancia'],
                ':bomberos'     => $datos['bomberos'],
                ':estado'       => $datos['estado'],
            ]);
            json_ok(['id' => (int) $pdo->lastInsertId()]);
            break;

        case 'PUT':
            if ($id <= 0) {
                json_error('ID inválido.', 422);
            }
            $datos = comunidad_leer_body();
            comunidad_validar_payload($datos);
            if (comunidad_nombre_duplicado($pdo, $datos['nombre'], $id)) {
                json_error('Ya existe otra comunidad con ese nombre.', 409);
            }

            $stmt = $pdo->prepare(
                'UPDATE comunidades
                    SET nombre       = :nombre,
                        domicilio    = :domicilio,
                        indicaciones = :indicaciones,
                        policia      = :policia,
                        ambulancia   = :ambulancia,
                        bomberos     = :bomberos,
                        estado       = :estado
                  WHERE id = :id'
            );
            $stmt->execute([
                ':nombre'       => $datos['nombre'],
                ':domicilio'    => $datos['domicilio'],
                ':indicaciones' => $datos['indicaciones'],
                ':policia'      => $datos['policia'],
                ':ambulancia'   => $datos['ambulancia'],
                ':bomberos'     => $datos['bomberos'],
                ':estado'       => $datos['estado'],
                ':id'           => $id,
            ]);
            json_ok();
            break;

        case 'DELETE':
            if ($id <= 0) {
                json_error('ID inválido.', 422);
            }
            $stmt = $pdo->prepare('SELECT COUNT(*) FROM casas WHERE comunidad = :id');
            $stmt->execute([':id' => $id]);
            if ((int) $stmt->fetchColumn() > 0) {
                json_error('No se puede eliminar: la comunidad tiene casas asociadas.', 409);
            }
            $stmt = $pdo->prepare('DELETE FROM comunidades WHERE id = :id');
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

function comunidad_leer_body(): array
{
    $raw  = file_get_contents('php://input') ?: '';
    $body = json_decode($raw, true);
    return is_array($body) ? $body : [];
}

function comunidad_validar_payload(array &$datos): void
{
    $datos['nombre']       = trim((string) ($datos['nombre']       ?? ''));
    $datos['domicilio']    = trim((string) ($datos['domicilio']    ?? ''));
    $datos['indicaciones'] = trim((string) ($datos['indicaciones'] ?? ''));
    $datos['policia']      = trim((string) ($datos['policia']      ?? ''));
    $datos['ambulancia']   = trim((string) ($datos['ambulancia']   ?? ''));
    $datos['bomberos']     = trim((string) ($datos['bomberos']     ?? ''));

    $datos['domicilio']    = $datos['domicilio']    !== '' ? $datos['domicilio']    : null;
    $datos['indicaciones'] = $datos['indicaciones'] !== '' ? $datos['indicaciones'] : null;
    $datos['policia']      = $datos['policia']      !== '' ? $datos['policia']      : null;
    $datos['ambulancia']   = $datos['ambulancia']   !== '' ? $datos['ambulancia']   : null;
    $datos['bomberos']     = $datos['bomberos']     !== '' ? $datos['bomberos']     : null;
    $datos['estado']       = !empty($datos['estado']) ? 1 : 0;

    if ($datos['nombre'] === '') {
        json_error('El nombre es obligatorio.', 422);
    }
    if (mb_strlen($datos['nombre']) > 255) {
        json_error('El nombre no puede tener más de 255 caracteres.', 422);
    }
    foreach (['domicilio', 'indicaciones', 'policia', 'ambulancia', 'bomberos'] as $campo) {
        if ($datos[$campo] !== null && mb_strlen($datos[$campo]) > 255) {
            json_error("El campo $campo no puede tener más de 255 caracteres.", 422);
        }
    }
}

function comunidad_nombre_duplicado(PDO $pdo, string $nombre, int $excluir_id = 0): bool
{
    $sql = 'SELECT id FROM comunidades WHERE nombre = :nombre';
    if ($excluir_id > 0) {
        $sql .= ' AND id <> :id';
    }
    $sql .= ' LIMIT 1';
    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(':nombre', $nombre);
    if ($excluir_id > 0) {
        $stmt->bindValue(':id', $excluir_id, PDO::PARAM_INT);
    }
    $stmt->execute();
    return (bool) $stmt->fetchColumn();
}

function comunidad_get(PDO $pdo, int $id): array
{
    // Devuelve todos los campos del registro, con nombres resueltos para la ciudad
    // (referenciada como ID) y un conteo agregado de casas asociadas.
    $stmt = $pdo->prepare(
        'SELECT c.id, c.uuid, c.nombre, c.domicilio, c.ciudad, c.latitud, c.longitud,
                c.indicaciones, c.policia, c.ambulancia, c.bomberos,
                c.solvencia, c.inscripcion, c.plan, c.promo, c.promoInicio, c.promoFin,
                c.mantenimiento, c.convenio,
                c.contratos, c.contratosVigentes, c.contratosMorosos,
                c.contratosSuspendidos, c.contratosRescindidos, c.contratosPermanencia,
                c.alarmas, c.alarmasOnline, c.alarmasOffline, c.alarmasFuncionamiento,
                c.casas, c.usuarios, c.disparos,
                c.registro, c.alta, c.modo, c.vendedor, c.estado,
                c.wspHabilitado, c.wspNombre, c.wspDescripcion, c.wspGrupo,
                c.wspInvitacion, c.wspIcono, c.wspMiembros,
                c.wspActualizado, c.wspRenovado,
                CONCAT_WS(", ", ci.localidad, ci.provincia) AS ciudad_nombre,
                v.nombre AS vendedor_nombre,
                (SELECT COUNT(*) FROM casas k WHERE k.comunidad = c.id) AS casas_count
           FROM comunidades c
           LEFT JOIN ciudades ci ON ci.id = c.ciudad
           LEFT JOIN usuarios v  ON v.id  = c.vendedor
          WHERE c.id = :id
          LIMIT 1'
    );
    $stmt->execute([':id' => $id]);
    $c = $stmt->fetch();
    if (!$c) {
        json_error('Comunidad no encontrada.', 404);
    }
    return $c;
}

function comunidades_listar(PDO $pdo, array $opts = []): array
{
    $sortCols = [
        'id'        => 'c.id',
        'nombre'    => 'c.nombre',
        'domicilio' => 'c.domicilio',
        'estado'    => 'c.estado',
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
        $where[] = 'c.id = :filtro_id';
        $params[':filtro_id'] = (int) $opts['filtro_id'];
    }
    $nombre = trim((string) ($opts['nombre'] ?? ''));
    if ($nombre !== '') {
        $where[] = 'c.nombre LIKE :nombre';
        $params[':nombre'] = '%' . $nombre . '%';
    }
    $estado = (string) ($opts['estado'] ?? '');
    if ($estado === '0' || $estado === '1') {
        $where[] = 'COALESCE(c.estado, 0) = :estado';
        $params[':estado'] = (int) $estado;
    }

    $sql = 'SELECT c.id, c.nombre, c.domicilio, c.policia, c.estado,
                   (SELECT COUNT(*) FROM casas k WHERE k.comunidad = c.id) AS casas_count
              FROM comunidades c';
    if ($where) {
        $sql .= ' WHERE ' . implode(' AND ', $where);
    }
    $sql .= " ORDER BY {$sortCols[$sortKey]} $dir LIMIT $limit";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetchAll();
}

function comunidades_kpis(PDO $pdo): array
{
    return [
        'total'     => (int) $pdo->query('SELECT COUNT(*) FROM comunidades')->fetchColumn(),
        'activas'   => (int) $pdo->query('SELECT COUNT(*) FROM comunidades WHERE estado = 1')->fetchColumn(),
        'inactivas' => (int) $pdo->query('SELECT COUNT(*) FROM comunidades WHERE estado = 0 OR estado IS NULL')->fetchColumn(),
    ];
}
