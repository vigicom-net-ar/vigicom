<?php
/**
 * Endpoint REST de gestión de roles del panel.
 *
 *   GET    /api/roles.php          → { roles, kpis }
 *   GET    /api/roles.php?id=N     → rol individual
 *   POST   /api/roles.php          → crear (body JSON)
 *   PUT    /api/roles.php?id=N     → actualizar (body JSON)
 *   DELETE /api/roles.php?id=N     → eliminar
 *
 * Los roles marcados como de sistema (sistema = '1') no se pueden eliminar.
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
                json_ok(rol_get($pdo, $id));
            }
            json_ok([
                'roles' => roles_listar($pdo, $_GET),
                'kpis'  => roles_kpis($pdo),
            ]);
            break;

        case 'POST':
            $datos = rol_leer_body();
            rol_validar_payload($datos);
            if (rol_nombre_duplicado($pdo, $datos['nombre'])) {
                json_error('Ya existe un rol con ese nombre.', 409);
            }

            $stmt = $pdo->prepare(
                'INSERT INTO roles (sistema, nombre, descripcion, permisos, menus, widgets)
                 VALUES (:sistema, :nombre, :descripcion, :permisos, :menus, :widgets)'
            );
            $stmt->execute([
                ':sistema'     => $datos['sistema'],
                ':nombre'      => $datos['nombre'],
                ':descripcion' => $datos['descripcion'],
                ':permisos'    => $datos['permisos'],
                ':menus'       => $datos['menus'],
                ':widgets'     => $datos['widgets'],
            ]);
            json_ok(['id' => (int) $pdo->lastInsertId()]);
            break;

        case 'PUT':
            if ($id <= 0) {
                json_error('ID inválido.', 422);
            }
            $datos = rol_leer_body();
            rol_validar_payload($datos);
            if (rol_nombre_duplicado($pdo, $datos['nombre'], $id)) {
                json_error('Ya existe otro rol con ese nombre.', 409);
            }

            $stmt = $pdo->prepare(
                'UPDATE roles
                    SET sistema     = :sistema,
                        nombre      = :nombre,
                        descripcion = :descripcion,
                        permisos    = :permisos,
                        menus       = :menus,
                        widgets     = :widgets
                  WHERE id = :id'
            );
            $stmt->execute([
                ':sistema'     => $datos['sistema'],
                ':nombre'      => $datos['nombre'],
                ':descripcion' => $datos['descripcion'],
                ':permisos'    => $datos['permisos'],
                ':menus'       => $datos['menus'],
                ':widgets'     => $datos['widgets'],
                ':id'          => $id,
            ]);
            json_ok();
            break;

        case 'DELETE':
            if ($id <= 0) {
                json_error('ID inválido.', 422);
            }
            $rol = rol_get($pdo, $id);
            if ((string) ($rol['sistema'] ?? '') === '1') {
                json_error('No se puede eliminar un rol de sistema.', 409);
            }
            $stmt = $pdo->prepare('DELETE FROM roles WHERE id = :id');
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

function rol_leer_body(): array
{
    $raw  = file_get_contents('php://input') ?: '';
    $body = json_decode($raw, true);
    return is_array($body) ? $body : [];
}

function rol_validar_payload(array &$datos): void
{
    $datos['nombre']      = trim((string) ($datos['nombre']      ?? ''));
    $datos['descripcion'] = trim((string) ($datos['descripcion'] ?? ''));
    $datos['permisos']    = (string) ($datos['permisos'] ?? '');
    $datos['menus']       = (string) ($datos['menus']    ?? '');
    $datos['widgets']     = (string) ($datos['widgets']  ?? '');

    $datos['descripcion'] = $datos['descripcion'] !== '' ? $datos['descripcion'] : null;
    $datos['permisos']    = $datos['permisos']    !== '' ? $datos['permisos']    : null;
    $datos['menus']       = $datos['menus']       !== '' ? $datos['menus']       : null;
    $datos['widgets']     = $datos['widgets']     !== '' ? $datos['widgets']     : null;
    $datos['sistema']     = !empty($datos['sistema']) ? '1' : null;

    if ($datos['nombre'] === '') {
        json_error('El nombre es obligatorio.', 422);
    }
    if (mb_strlen($datos['nombre']) > 255) {
        json_error('El nombre no puede tener más de 255 caracteres.', 422);
    }
    if ($datos['descripcion'] !== null && mb_strlen($datos['descripcion']) > 255) {
        json_error('La descripción no puede tener más de 255 caracteres.', 422);
    }
}

function rol_nombre_duplicado(PDO $pdo, string $nombre, int $excluir_id = 0): bool
{
    $sql = 'SELECT id FROM roles WHERE nombre = :nombre';
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

function rol_get(PDO $pdo, int $id): array
{
    $stmt = $pdo->prepare(
        'SELECT id, sistema, nombre, descripcion, permisos, menus, widgets
           FROM roles
          WHERE id = :id
          LIMIT 1'
    );
    $stmt->execute([':id' => $id]);
    $r = $stmt->fetch();
    if (!$r) {
        json_error('Rol no encontrado.', 404);
    }
    return $r;
}

function roles_listar(PDO $pdo, array $opts = []): array
{
    $sortCols = [
        'id'      => 'id',
        'nombre'  => 'nombre',
        'sistema' => 'sistema',
    ];
    $sortKey = (string) ($opts['sort'] ?? 'id');
    if (!isset($sortCols[$sortKey])) {
        $sortKey = 'id';
    }
    $dir = strtolower((string) ($opts['dir'] ?? 'asc')) === 'desc' ? 'DESC' : 'ASC';

    $limit = isset($opts['limit']) && ctype_digit((string) $opts['limit']) ? (int) $opts['limit'] : 200;
    if ($limit < 1)    { $limit = 200; }
    if ($limit > 1000) { $limit = 1000; }

    $where  = [];
    $params = [];
    $sistema = (string) ($opts['sistema'] ?? '');
    if ($sistema === '1') {
        $where[] = "sistema = '1'";
    } elseif ($sistema === '0') {
        $where[] = "(sistema IS NULL OR sistema <> '1')";
    }

    $sql = 'SELECT id, sistema, nombre, descripcion FROM roles';
    if ($where) {
        $sql .= ' WHERE ' . implode(' AND ', $where);
    }
    $sql .= " ORDER BY {$sortCols[$sortKey]} $dir LIMIT $limit";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetchAll();
}

function roles_kpis(PDO $pdo): array
{
    return [
        'total'   => (int) $pdo->query('SELECT COUNT(*) FROM roles')->fetchColumn(),
        'sistema' => (int) $pdo->query("SELECT COUNT(*) FROM roles WHERE sistema = '1'")->fetchColumn(),
        'custom'  => (int) $pdo->query("SELECT COUNT(*) FROM roles WHERE sistema IS NULL OR sistema <> '1'")->fetchColumn(),
    ];
}
