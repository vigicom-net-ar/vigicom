<?php
/**
 * Endpoint REST del Editor de estados (módulo Herramientas).
 *
 * Cada fila del catálogo se identifica por el par (campo, valor) que también
 * es la PRIMARY KEY compuesta de la tabla `estados` en el esquema compartido
 * de Vigicom (db/schema.sql). No hay `id` autoincremental — el skill
 * genérico lo asume, pero acá se preserva la PK histórica que ya usan
 * los JOIN de alarmas.php (ver skill: crear_editor_de_estados § "esquema").
 *
 * Ruta y forma:
 *   GET    /api/estados.php
 *          ?q=...&campo=<filtro>&limite=N&order_by=...&dir=asc|desc
 *          → { items:[], campos:[], stats:{total} }
 *   GET    /api/estados.php?campo_key=X&valor_key=Y  → row individual
 *   POST   /api/estados.php  {campo, valor, texto, orden}
 *          → {campo, valor}
 *   PUT    /api/estados.php?campo_key=X&valor_key=Y  {campo, valor, texto, orden}
 *          → {campo, valor}
 *   DELETE /api/estados.php?campo_key=X&valor_key=Y  → {campo, valor}
 *
 * La unicidad del par (campo, valor) queda garantizada por la PK compuesta
 * de la tabla — al insertar/actualizar sobre un par ya existente
 * MySQL devolvería 1062 (duplicate); acá lo pre-chequeamos con SELECT
 * para devolver un 409 legible antes de llegar a esa capa.
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

    $campoKey = isset($_GET['campo_key']) ? (string) $_GET['campo_key'] : '';
    $valorKey = isset($_GET['valor_key']) ? (string) $_GET['valor_key'] : '';

    if ($campoKey !== '') {
        $stmt = $pdo->prepare(
            'SELECT campo, valor, texto, orden
               FROM estados
              WHERE campo = :c AND valor = :v
              LIMIT 1'
        );
        $stmt->execute([':c' => $campoKey, ':v' => $valorKey]);
        $row = $stmt->fetch();
        if (!$row) { json_error('Estado no encontrado.', 404); }
        json_ok(estado_normalizar($row));
        return;
    }

    $q           = trim((string) ($_GET['q'] ?? ''));
    $campoFiltro = trim((string) ($_GET['campo'] ?? ''));

    $orderBy = $_GET['order_by'] ?? 'campo_orden';
    if (!in_array($orderBy, ['campo', 'valor', 'texto', 'orden', 'campo_orden'], true)) {
        $orderBy = 'campo_orden';
    }
    $dir = strtolower((string) ($_GET['dir'] ?? 'asc'));
    if ($dir !== 'desc') { $dir = 'asc'; }
    $dirSql = strtoupper($dir);

    switch ($orderBy) {
        case 'campo':       $orderSql = "campo $dirSql, COALESCE(orden, 0) $dirSql, valor $dirSql"; break;
        case 'valor':       $orderSql = "valor $dirSql, campo $dirSql"; break;
        case 'texto':       $orderSql = "texto $dirSql, campo $dirSql, valor $dirSql"; break;
        case 'orden':       $orderSql = "COALESCE(orden, 0) $dirSql, campo $dirSql, valor $dirSql"; break;
        case 'campo_orden':
        default:            $orderSql = "campo $dirSql, COALESCE(orden, 0) $dirSql, valor $dirSql"; break;
    }

    $limite = isset($_GET['limite']) && ctype_digit((string) $_GET['limite']) ? (int) $_GET['limite'] : 500;
    if ($limite < 1 || $limite > 5000) { $limite = 500; }

    $where  = [];
    $params = [];
    if ($q !== '') {
        $where[] = '(campo LIKE :q OR texto LIKE :q OR valor LIKE :q)';
        $params[':q'] = '%' . $q . '%';
    }
    if ($campoFiltro !== '') {
        $where[] = 'campo = :cf';
        $params[':cf'] = $campoFiltro;
    }
    $sqlWhere = $where ? (' WHERE ' . implode(' AND ', $where)) : '';

    $sql = 'SELECT campo, valor, texto, orden
              FROM estados'
         . $sqlWhere
         . ' ORDER BY ' . $orderSql
         . ' LIMIT ' . $limite;

    $stmt = $pdo->prepare($sql);
    foreach ($params as $k => $v) {
        $stmt->bindValue($k, $v);
    }
    $stmt->execute();
    $items = array_map('estado_normalizar', $stmt->fetchAll());

    $total = (int) $pdo->query('SELECT COUNT(*) FROM estados')->fetchColumn();

    $stmtC = $pdo->query(
        "SELECT DISTINCT campo
           FROM estados
          WHERE campo IS NOT NULL AND campo <> ''
          ORDER BY campo"
    );
    $campos = array_map(
        static function (array $r) { return (string) $r['campo']; },
        $stmtC->fetchAll()
    );

    json_ok([
        'items'  => $items,
        'campos' => $campos,
        'stats'  => ['total' => $total],
    ]);
}

function handlePost(): void
{
    $pdo = db();
    $d   = estado_leer_body();
    if (($err = estado_validar($d)) !== null) { json_error($err, 400); }

    if (estado_par_existe($pdo, $d['campo'], $d['valor'])) {
        json_error('Ya existe un estado con ese valor para ese campo.', 409);
    }

    $stmt = $pdo->prepare(
        'INSERT INTO estados (campo, valor, texto, orden)
         VALUES (:c, :v, :t, :o)'
    );
    $stmt->bindValue(':c', $d['campo']);
    $stmt->bindValue(':v', $d['valor']);
    $stmt->bindValue(':t', $d['texto']);
    if ($d['orden'] === null) {
        $stmt->bindValue(':o', null, PDO::PARAM_NULL);
    } else {
        $stmt->bindValue(':o', $d['orden'], PDO::PARAM_INT);
    }
    $stmt->execute();

    json_ok(['campo' => $d['campo'], 'valor' => $d['valor']]);
}

function handlePut(): void
{
    $pdo = db();

    $origCampo = isset($_GET['campo_key']) ? (string) $_GET['campo_key'] : '';
    $origValor = isset($_GET['valor_key']) ? (string) $_GET['valor_key'] : '';
    if ($origCampo === '') { json_error('Falta la clave del estado (campo).', 400); }

    $d = estado_leer_body();
    if (($err = estado_validar($d)) !== null) { json_error($err, 400); }

    $stmt = $pdo->prepare('SELECT 1 FROM estados WHERE campo = :c AND valor = :v LIMIT 1');
    $stmt->execute([':c' => $origCampo, ':v' => $origValor]);
    if (!$stmt->fetchColumn()) { json_error('Estado no encontrado.', 404); }

    $cambiaPar = ($d['campo'] !== $origCampo || $d['valor'] !== $origValor);
    if ($cambiaPar && estado_par_existe($pdo, $d['campo'], $d['valor'])) {
        json_error('Ya existe un estado con ese valor para ese campo.', 409);
    }

    $stmt = $pdo->prepare(
        'UPDATE estados
            SET campo = :nc, valor = :nv, texto = :t, orden = :o
          WHERE campo = :oc AND valor = :ov'
    );
    $stmt->bindValue(':nc', $d['campo']);
    $stmt->bindValue(':nv', $d['valor']);
    $stmt->bindValue(':t',  $d['texto']);
    if ($d['orden'] === null) {
        $stmt->bindValue(':o', null, PDO::PARAM_NULL);
    } else {
        $stmt->bindValue(':o', $d['orden'], PDO::PARAM_INT);
    }
    $stmt->bindValue(':oc', $origCampo);
    $stmt->bindValue(':ov', $origValor);
    $stmt->execute();

    json_ok(['campo' => $d['campo'], 'valor' => $d['valor']]);
}

function handleDelete(): void
{
    $pdo = db();
    $c   = isset($_GET['campo_key']) ? (string) $_GET['campo_key'] : '';
    $v   = isset($_GET['valor_key']) ? (string) $_GET['valor_key'] : '';
    if ($c === '') { json_error('Falta la clave del estado (campo).', 400); }

    $stmt = $pdo->prepare('DELETE FROM estados WHERE campo = :c AND valor = :v');
    $stmt->execute([':c' => $c, ':v' => $v]);
    if ($stmt->rowCount() === 0) { json_error('Estado no encontrado.', 404); }

    json_ok(['campo' => $c, 'valor' => $v]);
}

// --- Helpers ----------------------------------------------------------------

function estado_leer_body_raw(): array
{
    $raw  = file_get_contents('php://input') ?: '';
    $body = json_decode($raw, true);
    return is_array($body) ? $body : [];
}

function estado_leer_body(): array
{
    $b        = estado_leer_body_raw();
    $campo    = trim((string) ($b['campo'] ?? ''));
    $valor    = (string) ($b['valor'] ?? ''); // valor NO se trimea — puede ser significativo
    $texto    = trim((string) ($b['texto'] ?? ''));
    $ordenRaw = $b['orden'] ?? null;
    $orden    = ($ordenRaw === '' || $ordenRaw === null) ? null : (int) $ordenRaw;
    return compact('campo', 'valor', 'texto', 'orden');
}

/**
 * Valida el payload del editor. La tabla en vigicom conserva
 * campo VARCHAR(100) NOT NULL / valor VARCHAR(50) NOT NULL / texto VARCHAR(255) NULL,
 * así que los límites del validador se ajustan a esas cotas (no a las 255
 * genéricas de la skill).
 */
function estado_validar(array $d): ?string
{
    if ($d['campo'] === '') {
        return 'El campo es obligatorio.';
    }
    if (mb_strlen($d['campo']) > 100) {
        return 'El campo no puede superar los 100 caracteres.';
    }
    if (!preg_match('/^[A-Za-z0-9_.\-]+$/', $d['campo'])) {
        return 'El campo sólo admite letras, números, punto, guión y guión bajo (ej. tabla.columna).';
    }
    if ($d['texto'] === '') {
        return 'El texto es obligatorio.';
    }
    if (mb_strlen($d['texto']) > 255) {
        return 'El texto no puede superar los 255 caracteres.';
    }
    if (mb_strlen((string) $d['valor']) > 50) {
        return 'El valor no puede superar los 50 caracteres.';
    }
    return null;
}

function estado_par_existe(PDO $pdo, string $campo, string $valor): bool
{
    $stmt = $pdo->prepare('SELECT 1 FROM estados WHERE campo = :c AND valor = :v LIMIT 1');
    $stmt->execute([':c' => $campo, ':v' => $valor]);
    return (bool) $stmt->fetchColumn();
}

function estado_normalizar(array $r): array
{
    return [
        'campo' => (string) ($r['campo'] ?? ''),
        'valor' => (string) ($r['valor'] ?? ''),
        'texto' => (string) ($r['texto'] ?? ''),
        'orden' => isset($r['orden']) && $r['orden'] !== null ? (int) $r['orden'] : null,
    ];
}
