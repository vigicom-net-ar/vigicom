<?php
/**
 * Endpoint REST del Plan de Cuentas.
 *
 *   GET    /api/cuentas.php                      -> { cuentas, kpis }
 *   GET    /api/cuentas.php?id=N                 -> cuenta individual
 *   GET    /api/cuentas.php?ultima_fecha=1&id=N  -> ultima fecha de asiento
 *   GET    /api/cuentas.php?recalcular=1         -> recalcula saldos toda la tabla
 *   POST   /api/cuentas.php                      -> crear (body JSON)
 *   PUT    /api/cuentas.php?id=N                 -> actualizar (body JSON)
 *   DELETE /api/cuentas.php?id=N                 -> eliminar (falla si tiene subcuentas)
 *
 * Este modulo NO modifica el esquema de la tabla `cuentas`. Los campos
 * fisicos son los legacy:
 *      id, padre, orden, categoria, tipo, nombre, observaciones, saldo.
 *
 * Todos los campos "de plan de cuentas contable" (codigo jerarquico, nivel,
 * naturaleza deudora/acreedora, imputable) se derivan en el server a partir
 * del arbol y de `tipo`:
 *   - codigo:     recorrido de padre[..root], concatenando `orden` con
 *                 padding de 2 digitos a partir del nivel 3 (formato tipico
 *                 "1.1.01.01").
 *   - nivel:      profundidad en el arbol (1 = raiz).
 *   - naturaleza: derivada de `tipo` (activo/egreso -> deudora,
 *                 pasivo/patrimonio/ingreso -> acreedora).
 *   - imputable:  hoja del arbol (sin hijos).
 *
 * El calculo de saldos lee `asientos` (cuenta1=debe, cuenta2=haber, monto)
 * y luego propaga los saldos hijos hacia los padres.
 */

require_once __DIR__ . '/bootstrap.php';

requireAuth();

$pdo    = db();
$method = $_SERVER['REQUEST_METHOD'];
$id     = isset($_GET['id']) && ctype_digit((string) $_GET['id']) ? (int) $_GET['id'] : 0;

$TIPOS_VALIDOS = ['activo', 'pasivo', 'patrimonio', 'ingreso', 'egreso'];

try {
    if ($method === 'GET' && isset($_GET['ultima_fecha']) && $id > 0) {
        json_ok(['ultima_fecha' => cuenta_ultima_fecha($pdo, $id)]);
    }

    if ($method === 'GET' && isset($_GET['recalcular'])) {
        json_ok(['cuentas' => cuentas_recalcular_saldos($pdo)]);
    }

    switch ($method) {

        case 'GET':
            if ($id > 0) {
                json_ok(cuenta_get_enriquecida($pdo, $id));
            }
            $arbol = cuentas_listar_enriquecidas($pdo, $_GET, $TIPOS_VALIDOS);
            json_ok([
                'cuentas' => $arbol,
                'kpis'    => cuentas_kpis($pdo, $TIPOS_VALIDOS),
            ]);
            break;

        case 'POST':
            $datos = cuenta_leer_body();
            cuenta_validar_payload($datos, $TIPOS_VALIDOS);
            cuenta_validar_padre($pdo, $datos['padre']);
            if ($datos['orden'] !== null && cuenta_orden_duplicado($pdo, $datos['padre'], $datos['orden'])) {
                json_error('Ya existe una cuenta con ese orden bajo el mismo padre.', 409);
            }
            $stmt = $pdo->prepare(
                'INSERT INTO cuentas (padre, orden, categoria, tipo, nombre, observaciones, saldo)
                 VALUES (:padre, :orden, :categoria, :tipo, :nombre, :observaciones, 0)'
            );
            $stmt->execute([
                ':padre'         => $datos['padre'],
                ':orden'         => $datos['orden'],
                ':categoria'     => $datos['categoria'],
                ':tipo'          => $datos['tipo'],
                ':nombre'        => $datos['nombre'],
                ':observaciones' => $datos['observaciones'],
            ]);
            json_ok(['id' => (int) $pdo->lastInsertId()]);
            break;

        case 'PUT':
            if ($id <= 0) {
                json_error('ID inválido.', 422);
            }
            $datos = cuenta_leer_body();
            cuenta_validar_payload($datos, $TIPOS_VALIDOS);
            if ($datos['padre'] === $id) {
                json_error('Una cuenta no puede ser su propio padre.', 422);
            }
            if ($datos['padre'] !== null && cuenta_es_descendiente($pdo, $id, $datos['padre'])) {
                json_error('La cuenta padre no puede ser un descendiente de esta cuenta.', 422);
            }
            cuenta_validar_padre($pdo, $datos['padre']);
            if ($datos['orden'] !== null && cuenta_orden_duplicado($pdo, $datos['padre'], $datos['orden'], $id)) {
                json_error('Ya existe otra cuenta con ese orden bajo el mismo padre.', 409);
            }
            $stmt = $pdo->prepare(
                'UPDATE cuentas
                    SET padre         = :padre,
                        orden         = :orden,
                        categoria     = :categoria,
                        tipo          = :tipo,
                        nombre        = :nombre,
                        observaciones = :observaciones
                  WHERE id = :id'
            );
            $stmt->execute([
                ':padre'         => $datos['padre'],
                ':orden'         => $datos['orden'],
                ':categoria'     => $datos['categoria'],
                ':tipo'          => $datos['tipo'],
                ':nombre'        => $datos['nombre'],
                ':observaciones' => $datos['observaciones'],
                ':id'            => $id,
            ]);
            json_ok();
            break;

        case 'DELETE':
            if ($id <= 0) {
                json_error('ID inválido.', 422);
            }
            $stmt = $pdo->prepare('SELECT COUNT(*) FROM cuentas WHERE padre = :id');
            $stmt->execute([':id' => $id]);
            if ((int) $stmt->fetchColumn() > 0) {
                json_error('No se puede eliminar: la cuenta tiene subcuentas.', 409);
            }
            $stmt = $pdo->prepare('DELETE FROM cuentas WHERE id = :id');
            $stmt->execute([':id' => $id]);
            json_ok();
            break;

        default:
            json_error('Método no permitido.', 405);
    }
} catch (Throwable $ex) {
    $msg = APP_ENV === 'production' ? 'Error del servidor.' : $ex->getMessage();
    json_error($msg, 500);
}

// --- Helpers: derivaciones -------------------------------------------------

/**
 * Devuelve el codigo jerarquico "1.1.01.02" a partir del recorrido del arbol.
 * $indice = [id => ['padre' => id|null, 'orden' => int|null]].
 */
function cuenta_codigo(int $id, array $indice): string
{
    $partes = [];
    $nivel  = 0;
    $cur    = $id;
    $safety = 32;
    while ($cur !== null && isset($indice[$cur]) && $safety-- > 0) {
        $orden = $indice[$cur]['orden'];
        $nivel++;
        $partes[] = $orden !== null ? (int) $orden : $cur;
        $cur = $indice[$cur]['padre'];
    }
    $partes = array_reverse($partes);
    $total  = count($partes);
    $salida = [];
    foreach ($partes as $i => $val) {
        $depth = $i + 1;
        $salida[] = $depth >= 3 ? str_pad((string) $val, 2, '0', STR_PAD_LEFT) : (string) $val;
    }
    return implode('.', $salida);
}

function cuenta_nivel(int $id, array $indice): int
{
    $n = 0;
    $cur = $id;
    $safety = 32;
    while ($cur !== null && isset($indice[$cur]) && $safety-- > 0) {
        $n++;
        $cur = $indice[$cur]['padre'];
    }
    return $n ?: 1;
}

function cuenta_naturaleza(?string $tipo): string
{
    $t = strtolower((string) $tipo);
    return ($t === 'activo' || $t === 'egreso') ? 'deudora' : 'acreedora';
}

function cuenta_es_imputable(int $id, array $hijosPorPadre): int
{
    return empty($hijosPorPadre[$id]) ? 1 : 0;
}

/**
 * Indexa toda la tabla en memoria para poder derivar codigo/nivel/imputable.
 * Devuelve [ $indice, $hijosPorPadre ] donde:
 *   $indice        = [id => ['padre'=>int|null, 'orden'=>int|null]]
 *   $hijosPorPadre = [padre_id => [id, id, ...]]
 */
function cuentas_indexar(PDO $pdo): array
{
    $indice = [];
    $hijos  = [];
    $rows = $pdo->query('SELECT id, padre, orden FROM cuentas')->fetchAll();
    foreach ($rows as $r) {
        $rid   = (int) $r['id'];
        $padre = ($r['padre'] === null || $r['padre'] === '') ? null : (int) $r['padre'];
        $orden = ($r['orden'] === null || $r['orden'] === '') ? null : (int) $r['orden'];
        $indice[$rid] = ['padre' => $padre, 'orden' => $orden];
        if ($padre !== null) {
            if (!isset($hijos[$padre])) $hijos[$padre] = [];
            $hijos[$padre][] = $rid;
        }
    }
    return [$indice, $hijos];
}

// --- Helpers: lectura -------------------------------------------------------

function cuenta_get_enriquecida(PDO $pdo, int $id): array
{
    $stmt = $pdo->prepare(
        'SELECT c.id, c.padre, c.orden, c.categoria, c.tipo, c.nombre,
                c.observaciones, c.saldo,
                p.nombre AS padre_nombre
           FROM cuentas c
      LEFT JOIN cuentas p ON p.id = c.padre
          WHERE c.id = :id
          LIMIT 1'
    );
    $stmt->execute([':id' => $id]);
    $c = $stmt->fetch();
    if (!$c) {
        json_error('Cuenta no encontrada.', 404);
    }
    [$indice, $hijos] = cuentas_indexar($pdo);
    $c['codigo']       = cuenta_codigo((int) $c['id'], $indice);
    $c['nivel']        = cuenta_nivel((int) $c['id'], $indice);
    $c['naturaleza']   = cuenta_naturaleza($c['tipo']);
    $c['imputable']    = cuenta_es_imputable((int) $c['id'], $hijos);
    $c['padre_codigo'] = $c['padre'] ? cuenta_codigo((int) $c['padre'], $indice) : null;
    return $c;
}

function cuentas_listar_enriquecidas(PDO $pdo, array $opts, array $tiposValidos): array
{
    $stmt = $pdo->query(
        'SELECT id, padre, orden, categoria, tipo, nombre, observaciones, saldo
           FROM cuentas'
    );
    $rows = $stmt->fetchAll();

    [$indice, $hijos] = cuentas_indexar($pdo);

    $q     = trim((string) ($opts['q']    ?? ''));
    $tipo  = strtolower(trim((string) ($opts['tipo'] ?? '')));
    $qLower = mb_strtolower($q);

    $out = [];
    foreach ($rows as $r) {
        $rid = (int) $r['id'];
        $r['codigo']     = cuenta_codigo($rid, $indice);
        $r['nivel']      = cuenta_nivel($rid, $indice);
        $r['naturaleza'] = cuenta_naturaleza($r['tipo']);
        $r['imputable']  = cuenta_es_imputable($rid, $hijos);

        if ($tipo !== '' && in_array($tipo, $tiposValidos, true) && strtolower((string) $r['tipo']) !== $tipo) {
            continue;
        }
        if ($qLower !== '') {
            $hay = mb_strtolower($r['codigo'] . ' ' . (string) $r['nombre']);
            if (mb_strpos($hay, $qLower) === false) {
                continue;
            }
        }
        $out[] = $r;
    }

    // Orden por codigo jerarquico (natural).
    usort($out, function ($a, $b) {
        return strnatcmp((string) $a['codigo'], (string) $b['codigo']);
    });
    return $out;
}

function cuentas_kpis(PDO $pdo, array $tiposValidos): array
{
    $kpis = [
        'total'      => (int) $pdo->query('SELECT COUNT(*) FROM cuentas')->fetchColumn(),
        'activo'     => 0,
        'pasivo'     => 0,
        'patrimonio' => 0,
        'ingreso'    => 0,
        'egreso'     => 0,
    ];
    $stmt = $pdo->prepare('SELECT COUNT(*) FROM cuentas WHERE LOWER(tipo) = :tipo');
    foreach ($tiposValidos as $t) {
        $stmt->execute([':tipo' => $t]);
        $kpis[$t] = (int) $stmt->fetchColumn();
    }
    return $kpis;
}

function cuenta_ultima_fecha(PDO $pdo, int $id): ?string
{
    $stmt = $pdo->prepare(
        'SELECT MAX(fecha) FROM asientos WHERE cuenta1 = :id OR cuenta2 = :id'
    );
    $stmt->execute([':id' => $id]);
    $v = $stmt->fetchColumn();
    return $v ? (string) $v : null;
}

// --- Helpers: escritura -----------------------------------------------------

function cuenta_leer_body(): array
{
    $raw  = file_get_contents('php://input') ?: '';
    $body = json_decode($raw, true);
    return is_array($body) ? $body : [];
}

function cuenta_validar_payload(array &$datos, array $tiposValidos): void
{
    $datos['nombre']        = trim((string) ($datos['nombre']        ?? ''));
    $datos['tipo']          = strtolower(trim((string) ($datos['tipo'] ?? '')));
    $datos['observaciones'] = trim((string) ($datos['observaciones'] ?? ''));

    if ($datos['nombre'] === '')                            { json_error('El nombre es obligatorio.', 422); }
    if (mb_strlen($datos['nombre']) > 255)                  { json_error('El nombre no puede tener más de 255 caracteres.', 422); }
    if (!in_array($datos['tipo'], $tiposValidos, true))     { json_error('Tipo inválido.', 422); }
    if (mb_strlen($datos['observaciones']) > 1000)          { json_error('Las observaciones no pueden exceder 1000 caracteres.', 422); }

    $datos['padre']         = (isset($datos['padre']) && ctype_digit((string) $datos['padre']) && (int) $datos['padre'] > 0)
                              ? (int) $datos['padre'] : null;
    $datos['orden']         = (isset($datos['orden']) && $datos['orden'] !== '' && $datos['orden'] !== null)
                              ? (int) $datos['orden'] : null;
    $datos['categoria']     = (isset($datos['categoria']) && $datos['categoria'] !== '' && $datos['categoria'] !== null)
                              ? (int) $datos['categoria'] : null;
    $datos['observaciones'] = $datos['observaciones'] !== '' ? $datos['observaciones'] : null;
}

function cuenta_validar_padre(PDO $pdo, ?int $padreId): void
{
    if ($padreId === null) return;
    $stmt = $pdo->prepare('SELECT id FROM cuentas WHERE id = :id');
    $stmt->execute([':id' => $padreId]);
    if (!$stmt->fetchColumn()) {
        json_error('La cuenta padre no existe.', 422);
    }
}

function cuenta_orden_duplicado(PDO $pdo, ?int $padre, int $orden, int $excluir_id = 0): bool
{
    if ($padre === null) {
        $sql = 'SELECT id FROM cuentas WHERE padre IS NULL AND orden = :orden';
        $params = [':orden' => $orden];
    } else {
        $sql = 'SELECT id FROM cuentas WHERE padre = :padre AND orden = :orden';
        $params = [':padre' => $padre, ':orden' => $orden];
    }
    if ($excluir_id > 0) {
        $sql .= ' AND id <> :ex';
        $params[':ex'] = $excluir_id;
    }
    $stmt = $pdo->prepare($sql . ' LIMIT 1');
    $stmt->execute($params);
    return (bool) $stmt->fetchColumn();
}

function cuenta_es_descendiente(PDO $pdo, int $ancestro, int $candidato): bool
{
    // Retorna true si $candidato es descendiente de $ancestro (para bloquear
    // ciclos al reasignar padre).
    [$indice] = cuentas_indexar($pdo);
    $cur = $candidato;
    $safety = 32;
    while ($cur !== null && isset($indice[$cur]) && $safety-- > 0) {
        $cur = $indice[$cur]['padre'];
        if ($cur === $ancestro) return true;
    }
    return false;
}

/**
 * Recalcula el saldo de todas las cuentas a partir de la tabla `asientos`
 * (vigicom: cuenta1 = debe, cuenta2 = haber, monto).
 *
 * Naturaleza derivada del tipo:
 *   - activo/egreso              -> deudora   (saldo = debe - haber)
 *   - pasivo/patrimonio/ingreso  -> acreedora (saldo = haber - debe)
 *
 * Luego propaga hacia los padres, ordenando por profundidad (mas hondo
 * primero).
 */
function cuentas_recalcular_saldos(PDO $pdo): int
{
    $pdo->exec('UPDATE cuentas SET saldo = 0');

    $rows = $pdo->query(
        'SELECT c.id,
                c.tipo,
                COALESCE((SELECT SUM(a.monto) FROM asientos a WHERE a.cuenta1 = c.id), 0) AS total_debe,
                COALESCE((SELECT SUM(a.monto) FROM asientos a WHERE a.cuenta2 = c.id), 0) AS total_haber
           FROM cuentas c'
    )->fetchAll();

    $acum = [];
    foreach ($rows as $r) {
        $debe  = (float) $r['total_debe'];
        $haber = (float) $r['total_haber'];
        $nat   = cuenta_naturaleza($r['tipo']);
        $acum[(int) $r['id']] = ($nat === 'acreedora') ? ($haber - $debe) : ($debe - $haber);
    }

    // Indexamos para poder ordenar por profundidad.
    [$indice] = cuentas_indexar($pdo);
    $niveles = [];
    foreach ($indice as $cid => $_) {
        $niveles[$cid] = cuenta_nivel($cid, $indice);
        if (!isset($acum[$cid])) $acum[$cid] = 0.0;
    }
    arsort($niveles);

    foreach (array_keys($niveles) as $cid) {
        $padre = $indice[$cid]['padre'];
        if ($padre && isset($acum[$padre])) {
            $acum[$padre] += $acum[$cid];
        }
    }

    $upd = $pdo->prepare('UPDATE cuentas SET saldo = :saldo WHERE id = :id');
    foreach ($acum as $cid => $saldo) {
        $upd->execute([':saldo' => round($saldo, 2), ':id' => $cid]);
    }

    return count($acum);
}
