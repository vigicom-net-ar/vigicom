<?php
/**
 * Endpoint REST del Editor de parámetros (módulo Herramientas).
 *
 * Contrato (skill "crear_editor_de_parametros"):
 *   GET    /api/parametros.php                            → { data:[], stats:{total} }
 *   GET    /api/parametros.php?id=N                       → row individual
 *   GET    /api/parametros.php?q=...&limite=N&orden=&dir= → listado filtrado
 *   POST   /api/parametros.php  {clave, valor, descripcion} → {id}
 *   PUT    /api/parametros.php  {id, clave, valor, descripcion}
 *   DELETE /api/parametros.php?id=N                       → {borrados:N}
 *
 * Nota de mapeo: la tabla `parametros` de vigicom usa las columnas históricas
 * `variable`/`comentario`; la API las expone como `clave`/`descripcion`.
 */

require_once __DIR__ . '/bootstrap.php';

requireAuth();

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':    handleGet();    break;
        case 'POST':   handlePost();   break;
        case 'PUT':    handlePut();    break;
        case 'DELETE': handleDelete(); break;
        default:       json_error('Método no permitido.', 405);
    }
} catch (Throwable $ex) {
    $msg = APP_ENV === 'production' ? 'Error del servidor.' : $ex->getMessage();
    json_error($msg, 500);
}

// --- Handlers ---------------------------------------------------------------

function handleGet(): void
{
    $pdo = db();
    $id  = isset($_GET['id']) && ctype_digit((string) $_GET['id']) ? (int) $_GET['id'] : 0;

    if ($id > 0) {
        $row = parametro_por_id($pdo, $id);
        if (!$row) { json_error('Parámetro no encontrado.', 404); }
        json_ok(parametro_normalizar($row));
        return;
    }

    $q       = trim((string) ($_GET['q'] ?? ''));
    $codigo  = isset($_GET['codigo']) && ctype_digit((string) $_GET['codigo']) ? (int) $_GET['codigo'] : 0;

    $orden   = $_GET['orden'] ?? 'id';
    if (!in_array($orden, ['id', 'clave', 'fecha_modificacion'], true)) {
        $orden = 'id';
    }
    $ordenSql = $orden === 'clave' ? 'variable'
              : ($orden === 'fecha_modificacion' ? 'id' : 'id');

    $dir = strtolower((string) ($_GET['dir'] ?? 'desc'));
    if ($dir !== 'asc') { $dir = 'desc'; }

    $limite = isset($_GET['limite']) && ctype_digit((string) $_GET['limite']) ? (int) $_GET['limite'] : 100;
    if ($limite < 1 || $limite > 1000) { $limite = 100; }

    $where  = [];
    $params = [];
    if ($q !== '') {
        $where[] = '(variable LIKE :q OR valor LIKE :q OR comentario LIKE :q)';
        $params[':q'] = '%' . $q . '%';
    }
    if ($codigo > 0) {
        $where[] = 'id = :codigo';
        $params[':codigo'] = $codigo;
    }
    $sqlWhere = $where ? (' WHERE ' . implode(' AND ', $where)) : '';

    $sql = 'SELECT id, variable, valor, comentario
              FROM parametros'
         . $sqlWhere
         . ' ORDER BY ' . $ordenSql . ' ' . strtoupper($dir)
         . ' LIMIT ' . $limite;

    $stmt = $pdo->prepare($sql);
    foreach ($params as $k => $v) {
        $stmt->bindValue($k, $v, is_int($v) ? PDO::PARAM_INT : PDO::PARAM_STR);
    }
    $stmt->execute();
    $rows = array_map('parametro_normalizar', $stmt->fetchAll());

    $total = (int) $pdo->query('SELECT COUNT(*) FROM parametros')->fetchColumn();

    json_ok([
        'data'  => $rows,
        'stats' => ['total' => $total],
    ]);
}

function handlePost(): void
{
    $pdo   = db();
    $datos = parametro_leer_body();
    if (($err = parametro_validar($datos)) !== null) {
        json_error($err, 400);
    }
    if (parametro_variable_duplicada($pdo, $datos['clave'])) {
        json_error('Ya existe un parámetro con esa clave.', 409);
    }

    $stmt = $pdo->prepare(
        'INSERT INTO parametros (variable, valor, comentario)
         VALUES (:variable, :valor, :comentario)'
    );
    $stmt->execute([
        ':variable'   => $datos['clave'],
        ':valor'      => $datos['valor'],
        ':comentario' => $datos['descripcion'],
    ]);
    json_ok(['id' => (int) $pdo->lastInsertId()]);
}

function handlePut(): void
{
    $pdo   = db();
    $body  = parametro_leer_body_raw();
    $id    = isset($body['id']) && ctype_digit((string) $body['id']) ? (int) $body['id'] : 0;
    if ($id <= 0 && isset($_GET['id']) && ctype_digit((string) $_GET['id'])) {
        $id = (int) $_GET['id'];
    }
    if ($id <= 0) { json_error('Falta el id.', 400); }

    $datos = parametro_leer_body($body);
    if (($err = parametro_validar($datos)) !== null) {
        json_error($err, 400);
    }
    if (parametro_variable_duplicada($pdo, $datos['clave'], $id)) {
        json_error('Ya existe un parámetro con esa clave.', 409);
    }

    $stmt = $pdo->prepare(
        'UPDATE parametros
            SET variable   = :variable,
                valor      = :valor,
                comentario = :comentario
          WHERE id = :id'
    );
    $stmt->execute([
        ':variable'   => $datos['clave'],
        ':valor'      => $datos['valor'],
        ':comentario' => $datos['descripcion'],
        ':id'         => $id,
    ]);
    json_ok(['ok' => true]);
}

function handleDelete(): void
{
    $pdo = db();
    $id  = isset($_GET['id']) && ctype_digit((string) $_GET['id']) ? (int) $_GET['id'] : 0;
    if ($id <= 0) { json_error('Falta el id.', 400); }

    $stmt = $pdo->prepare('DELETE FROM parametros WHERE id = :id');
    $stmt->execute([':id' => $id]);
    json_ok(['borrados' => (int) $stmt->rowCount()]);
}

// --- Helpers ----------------------------------------------------------------

function parametro_leer_body_raw(): array
{
    $raw  = file_get_contents('php://input') ?: '';
    $body = json_decode($raw, true);
    return is_array($body) ? $body : [];
}

function parametro_leer_body(?array $body = null): array
{
    if ($body === null) { $body = parametro_leer_body_raw(); }
    $clave       = trim((string) ($body['clave']       ?? ''));
    $valor       = (string) ($body['valor']            ?? '');
    $descripcion = trim((string) ($body['descripcion'] ?? ''));
    return [
        'clave'       => $clave,
        'valor'       => $valor,
        'descripcion' => $descripcion === '' ? null : $descripcion,
    ];
}

function parametro_validar(array $d): ?string
{
    if ($d['clave'] === '') {
        return 'La clave es obligatoria.';
    }
    if (mb_strlen($d['clave']) > 120) {
        return 'La clave no puede superar los 120 caracteres.';
    }
    if (!preg_match('/^[A-Za-z0-9_.\-]+$/', $d['clave'])) {
        return 'La clave sólo admite letras, números, punto, guión y guión bajo.';
    }
    // La tabla `parametros` en vigicom tiene valor VARCHAR(255).
    if ($d['valor'] !== null && mb_strlen((string) $d['valor']) > 255) {
        return 'El valor no puede superar los 255 caracteres.';
    }
    // Se conserva el límite histórico de comentario (VARCHAR(1024)).
    if ($d['descripcion'] !== null && mb_strlen($d['descripcion']) > 1024) {
        return 'La descripción no puede superar los 1024 caracteres.';
    }
    return null;
}

function parametro_variable_duplicada(PDO $pdo, string $clave, int $excluirId = 0): bool
{
    $sql = 'SELECT id FROM parametros WHERE variable = :variable';
    if ($excluirId > 0) { $sql .= ' AND id <> :id'; }
    $sql .= ' LIMIT 1';
    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(':variable', $clave);
    if ($excluirId > 0) { $stmt->bindValue(':id', $excluirId, PDO::PARAM_INT); }
    $stmt->execute();
    return (bool) $stmt->fetchColumn();
}

function parametro_por_id(PDO $pdo, int $id): ?array
{
    $stmt = $pdo->prepare(
        'SELECT id, variable, valor, comentario
           FROM parametros
          WHERE id = :id
          LIMIT 1'
    );
    $stmt->execute([':id' => $id]);
    $r = $stmt->fetch();
    return $r ?: null;
}

function parametro_normalizar(array $r): array
{
    return [
        'id'          => (int) $r['id'],
        'clave'       => (string) ($r['variable']   ?? ''),
        'valor'       => (string) ($r['valor']      ?? ''),
        'descripcion' => $r['comentario'] ?? null,
    ];
}
