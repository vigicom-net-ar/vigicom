<?php
/**
 * Endpoint REST de gestión de disparos.
 *
 *   GET    /api/disparos.php          → { disparos, kpis, comunidades, casas, guardias }
 *   GET    /api/disparos.php?id=N     → disparo individual
 *   POST   /api/disparos.php          → crear (body JSON)
 *   PUT    /api/disparos.php?id=N     → actualizar (body JSON)
 *   DELETE /api/disparos.php?id=N     → eliminar
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
                json_ok(disparo_get($pdo, $id));
            }
            json_ok([
                'disparos'    => disparos_listar($pdo, $_GET),
                'kpis'        => disparos_kpis($pdo),
                'comunidades' => $pdo->query('SELECT id, nombre FROM comunidades ORDER BY nombre')->fetchAll(),
                'casas'       => $pdo->query('SELECT id, nombre, comunidad FROM casas ORDER BY nombre')->fetchAll(),
                'guardias'    => $pdo->query('SELECT id, nombre FROM guardias ORDER BY nombre')->fetchAll(),
            ]);
            break;

        case 'POST':
            $datos = disparo_leer_body();
            disparo_validar_payload($datos);

            $stmt = $pdo->prepare(
                'INSERT INTO disparos
                     (fecha, comunidad, casa, usuario, ubicacion, modo,
                      procesado, tomado, guardia, patrulla, resultado,
                      detalle, comentario, cerrado, espera, reportado, estado)
                 VALUES
                     (:fecha, :comunidad, :casa, :usuario, :ubicacion, :modo,
                      :procesado, :tomado, :guardia, :patrulla, :resultado,
                      :detalle, :comentario, :cerrado, :espera, :reportado, :estado)'
            );
            $stmt->execute([
                ':fecha'      => $datos['fecha'],
                ':comunidad'  => $datos['comunidad'],
                ':casa'       => $datos['casa'],
                ':usuario'    => $datos['usuario'],
                ':ubicacion'  => $datos['ubicacion'],
                ':modo'       => $datos['modo'],
                ':procesado'  => $datos['procesado'],
                ':tomado'     => $datos['tomado'],
                ':guardia'    => $datos['guardia'],
                ':patrulla'   => $datos['patrulla'],
                ':resultado'  => $datos['resultado'],
                ':detalle'    => $datos['detalle'],
                ':comentario' => $datos['comentario'],
                ':cerrado'    => $datos['cerrado'],
                ':espera'     => $datos['espera'],
                ':reportado'  => $datos['reportado'],
                ':estado'     => $datos['estado'],
            ]);
            json_ok(['id' => (int) $pdo->lastInsertId()]);
            break;

        case 'PUT':
            if ($id <= 0) {
                json_error('ID inválido.', 422);
            }
            $datos = disparo_leer_body();
            disparo_validar_payload($datos);

            $stmt = $pdo->prepare(
                'UPDATE disparos
                    SET fecha      = :fecha,
                        comunidad  = :comunidad,
                        casa       = :casa,
                        usuario    = :usuario,
                        ubicacion  = :ubicacion,
                        modo       = :modo,
                        procesado  = :procesado,
                        tomado     = :tomado,
                        guardia    = :guardia,
                        patrulla   = :patrulla,
                        resultado  = :resultado,
                        detalle    = :detalle,
                        comentario = :comentario,
                        cerrado    = :cerrado,
                        espera     = :espera,
                        reportado  = :reportado,
                        estado     = :estado
                  WHERE id = :id'
            );
            $stmt->execute([
                ':fecha'      => $datos['fecha'],
                ':comunidad'  => $datos['comunidad'],
                ':casa'       => $datos['casa'],
                ':usuario'    => $datos['usuario'],
                ':ubicacion'  => $datos['ubicacion'],
                ':modo'       => $datos['modo'],
                ':procesado'  => $datos['procesado'],
                ':tomado'     => $datos['tomado'],
                ':guardia'    => $datos['guardia'],
                ':patrulla'   => $datos['patrulla'],
                ':resultado'  => $datos['resultado'],
                ':detalle'    => $datos['detalle'],
                ':comentario' => $datos['comentario'],
                ':cerrado'    => $datos['cerrado'],
                ':espera'     => $datos['espera'],
                ':reportado'  => $datos['reportado'],
                ':estado'     => $datos['estado'],
                ':id'         => $id,
            ]);
            json_ok();
            break;

        case 'DELETE':
            if ($id <= 0) {
                json_error('ID inválido.', 422);
            }
            $stmt = $pdo->prepare('DELETE FROM disparos WHERE id = :id');
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

function disparo_leer_body(): array
{
    $raw  = file_get_contents('php://input') ?: '';
    $body = json_decode($raw, true);
    return is_array($body) ? $body : [];
}

function disparo_normalizar_dt(?string $v): ?string
{
    $v = trim((string) $v);
    if ($v === '') return null;
    // Soporta "YYYY-MM-DDTHH:MM" del <input type="datetime-local">.
    $v = str_replace('T', ' ', $v);
    // Agrega segundos si faltan.
    if (preg_match('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/', $v)) {
        $v .= ':00';
    }
    return $v;
}

function disparo_validar_payload(array &$datos): void
{
    $datos['ubicacion']  = trim((string) ($datos['ubicacion']  ?? ''));
    $datos['modo']       = trim((string) ($datos['modo']       ?? ''));
    $datos['patrulla']   = trim((string) ($datos['patrulla']   ?? ''));
    $datos['resultado']  = trim((string) ($datos['resultado']  ?? ''));
    $datos['detalle']    = trim((string) ($datos['detalle']    ?? ''));
    $datos['comentario'] = trim((string) ($datos['comentario'] ?? ''));
    $datos['reportado']  = trim((string) ($datos['reportado']  ?? ''));

    $datos['ubicacion']  = $datos['ubicacion']  !== '' ? $datos['ubicacion']  : null;
    $datos['modo']       = $datos['modo']       !== '' ? $datos['modo']       : null;
    $datos['patrulla']   = $datos['patrulla']   !== '' ? mb_substr($datos['patrulla'],  0, 10) : null;
    $datos['resultado']  = $datos['resultado']  !== '' ? mb_substr($datos['resultado'], 0, 10) : null;
    $datos['detalle']    = $datos['detalle']    !== '' ? mb_substr($datos['detalle'],   0, 10) : null;
    $datos['comentario'] = $datos['comentario'] !== '' ? $datos['comentario'] : null;
    $datos['reportado']  = $datos['reportado']  !== '' ? mb_substr($datos['reportado'], 0, 1)  : null;

    $datos['fecha']     = disparo_normalizar_dt($datos['fecha']     ?? null);
    $datos['procesado'] = disparo_normalizar_dt($datos['procesado'] ?? null);
    $datos['tomado']    = disparo_normalizar_dt($datos['tomado']    ?? null);
    $datos['cerrado']   = disparo_normalizar_dt($datos['cerrado']   ?? null);

    $datos['comunidad'] = isset($datos['comunidad']) && ctype_digit((string) $datos['comunidad'])
        ? (int) $datos['comunidad'] : null;
    $datos['casa']      = isset($datos['casa'])      && ctype_digit((string) $datos['casa'])
        ? (int) $datos['casa'] : null;
    $datos['usuario']   = isset($datos['usuario'])   && ctype_digit((string) $datos['usuario'])
        ? (int) $datos['usuario'] : null;
    $datos['guardia']   = isset($datos['guardia'])   && ctype_digit((string) $datos['guardia'])
        ? (int) $datos['guardia'] : null;
    $esperaRaw = trim((string) ($datos['espera'] ?? ''));
    $datos['espera']    = $esperaRaw !== '' && is_numeric($esperaRaw) ? (int) $esperaRaw : null;

    $estadoStr = trim((string) ($datos['estado'] ?? ''));
    $datos['estado'] = $estadoStr !== '' ? mb_substr($estadoStr, 0, 1) : null;

    if ($datos['ubicacion']  !== null && mb_strlen($datos['ubicacion'])  > 255) { json_error('La ubicación no puede tener más de 255 caracteres.', 422); }
    if ($datos['modo']       !== null && mb_strlen($datos['modo'])       > 255) { json_error('El modo no puede tener más de 255 caracteres.', 422); }
    if ($datos['comentario'] !== null && mb_strlen($datos['comentario']) > 255) { json_error('El comentario no puede tener más de 255 caracteres.', 422); }
}

function disparo_get(PDO $pdo, int $id): array
{
    $stmt = $pdo->prepare(
        "SELECT d.id, d.fecha, d.comunidad, d.casa, d.usuario, d.ubicacion, d.modo,
                d.procesado, d.tomado, d.guardia, d.patrulla, d.resultado,
                d.detalle, d.comentario, d.cerrado, d.espera, d.reportado, d.estado,
                c.nombre AS comunidad_nombre,
                ca.nombre AS casa_nombre,
                u.nombre  AS usuario_nombre,
                g.nombre  AS guardia_nombre,
                est.texto AS estado_texto
           FROM disparos d
           LEFT JOIN comunidades c  ON c.id    = d.comunidad
           LEFT JOIN casas       ca ON ca.id   = d.casa
           LEFT JOIN usuarios    u  ON u.id    = d.usuario
           LEFT JOIN guardias    g  ON g.id    = d.guardia
           LEFT JOIN estados     est ON est.campo = 'disparo.estado' AND est.valor = d.estado
          WHERE d.id = :id
          LIMIT 1"
    );
    $stmt->execute([':id' => $id]);
    $d = $stmt->fetch();
    if (!$d) {
        json_error('Disparo no encontrado.', 404);
    }
    return $d;
}

function disparos_listar(PDO $pdo, array $opts = []): array
{
    $sortCols = [
        'id'        => 'd.id',
        'fecha'     => 'd.fecha',
        'comunidad' => 'c.nombre',
        'casa'      => 'ca.nombre',
        'cerrado'   => 'd.cerrado',
        'espera'    => 'd.espera',
        'estado'    => 'd.estado',
    ];
    $sortKey = (string) ($opts['sort'] ?? 'id');
    if (!isset($sortCols[$sortKey])) {
        $sortKey = 'id';
    }
    $dir = strtolower((string) ($opts['dir'] ?? 'desc')) === 'asc' ? 'ASC' : 'DESC';

    $limit = isset($opts['limit']) && ctype_digit((string) $opts['limit']) ? (int) $opts['limit'] : 100;
    if ($limit < 1)     { $limit = 100; }
    if ($limit > 10000) { $limit = 10000; }

    // Filtro fijo: excluir disparos cuyo modo contenga "alerta".
    $where  = ['(d.modo IS NULL OR d.modo NOT LIKE \'%alerta%\')'];
    $params = [];
    if (isset($opts['filtro_id']) && ctype_digit((string) $opts['filtro_id']) && (int) $opts['filtro_id'] > 0) {
        $where[] = 'd.id = :filtro_id';
        $params[':filtro_id'] = (int) $opts['filtro_id'];
    }
    if (!empty($opts['comunidad']) && ctype_digit((string) $opts['comunidad'])) {
        $where[] = 'd.comunidad = :comunidad';
        $params[':comunidad'] = (int) $opts['comunidad'];
    }
    if (!empty($opts['casa']) && ctype_digit((string) $opts['casa'])) {
        $where[] = 'd.casa = :casa';
        $params[':casa'] = (int) $opts['casa'];
    }
    if (!empty($opts['guardia']) && ctype_digit((string) $opts['guardia'])) {
        $where[] = 'd.guardia = :guardia';
        $params[':guardia'] = (int) $opts['guardia'];
    }
    $estado = trim((string) ($opts['estado'] ?? ''));
    if ($estado !== '') {
        $where[] = 'd.estado = :estado';
        $params[':estado'] = mb_substr($estado, 0, 1);
    }
    $cerrado = (string) ($opts['cerrado'] ?? '');
    if ($cerrado === 'si') {
        $where[] = 'd.cerrado IS NOT NULL';
    } elseif ($cerrado === 'no') {
        $where[] = 'd.cerrado IS NULL';
    }
    $desde = trim((string) ($opts['desde'] ?? ''));
    if ($desde !== '') {
        $where[] = 'd.fecha >= :desde';
        $params[':desde'] = $desde . ' 00:00:00';
    }
    $hasta = trim((string) ($opts['hasta'] ?? ''));
    if ($hasta !== '') {
        $where[] = 'd.fecha <= :hasta';
        $params[':hasta'] = $hasta . ' 23:59:59';
    }

    $sql = "SELECT d.id, d.fecha, d.comunidad, d.casa, d.modo, d.resultado,
                   d.cerrado, d.espera, d.estado, d.guardia,
                   c.nombre  AS comunidad_nombre,
                   ca.nombre AS casa_nombre,
                   g.nombre  AS guardia_nombre,
                   est.texto AS estado_texto
              FROM disparos d
              LEFT JOIN comunidades c  ON c.id    = d.comunidad
              LEFT JOIN casas       ca ON ca.id   = d.casa
              LEFT JOIN guardias    g  ON g.id    = d.guardia
              LEFT JOIN estados     est ON est.campo = 'disparo.estado' AND est.valor = d.estado";
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

function disparos_kpis(PDO $pdo): array
{
    // Mismo filtro que el listado: excluye disparos con modo "alerta".
    $excluyeAlerta = "(modo IS NULL OR modo NOT LIKE '%alerta%')";
    $total    = (int) $pdo->query("SELECT COUNT(*) FROM disparos WHERE $excluyeAlerta")->fetchColumn();
    $abiertos = (int) $pdo->query("SELECT COUNT(*) FROM disparos WHERE cerrado IS NULL AND $excluyeAlerta")->fetchColumn();
    $hoy      = (int) $pdo->query("SELECT COUNT(*) FROM disparos WHERE DATE(fecha) = CURDATE() AND $excluyeAlerta")->fetchColumn();
    return [
        'total'    => $total,
        'abiertos' => $abiertos,
        'hoy'      => $hoy,
    ];
}
