<?php
/**
 * Endpoint REST de gestión de permisos del panel.
 *
 *   GET    /api/permisos.php          → { permisos, kpis }
 *   GET    /api/permisos.php?id=N     → permiso individual
 *   POST   /api/permisos.php          → crear (body JSON)
 *   PUT    /api/permisos.php?id=N     → actualizar (body JSON)
 *   DELETE /api/permisos.php?id=N     → eliminar
 *
 * Los permisos marcados como de sistema (sistema = '1') no se pueden eliminar.
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
                json_ok(permiso_get($pdo, $id));
            }
            json_ok([
                'permisos' => permisos_listar($pdo, $_GET),
                'kpis'     => permisos_kpis($pdo),
            ]);
            break;

        case 'POST':
            $datos = permiso_leer_body();
            permiso_validar_payload($datos);
            if (permiso_nombre_duplicado($pdo, $datos['nombre'])) {
                json_error('Ya existe un permiso con ese nombre.', 409);
            }
            if ($datos['slug'] !== null && permiso_slug_duplicado($pdo, $datos['slug'])) {
                json_error('Ya existe un permiso con ese slug.', 409);
            }

            $stmt = $pdo->prepare(
                'INSERT INTO permisos (sistema, nombre, slug, descripcion)
                 VALUES (:sistema, :nombre, :slug, :descripcion)'
            );
            $stmt->execute([
                ':sistema'     => $datos['sistema'],
                ':nombre'      => $datos['nombre'],
                ':slug'        => $datos['slug'],
                ':descripcion' => $datos['descripcion'],
            ]);
            json_ok(['id' => (int) $pdo->lastInsertId()]);
            break;

        case 'PUT':
            if ($id <= 0) {
                json_error('ID inválido.', 422);
            }
            $datos = permiso_leer_body();
            permiso_validar_payload($datos);
            if (permiso_nombre_duplicado($pdo, $datos['nombre'], $id)) {
                json_error('Ya existe otro permiso con ese nombre.', 409);
            }
            if ($datos['slug'] !== null && permiso_slug_duplicado($pdo, $datos['slug'], $id)) {
                json_error('Ya existe otro permiso con ese slug.', 409);
            }

            $stmt = $pdo->prepare(
                'UPDATE permisos
                    SET sistema     = :sistema,
                        nombre      = :nombre,
                        slug        = :slug,
                        descripcion = :descripcion
                  WHERE id = :id'
            );
            $stmt->execute([
                ':sistema'     => $datos['sistema'],
                ':nombre'      => $datos['nombre'],
                ':slug'        => $datos['slug'],
                ':descripcion' => $datos['descripcion'],
                ':id'          => $id,
            ]);
            json_ok();
            break;

        case 'DELETE':
            if ($id <= 0) {
                json_error('ID inválido.', 422);
            }
            $permiso = permiso_get($pdo, $id);
            if ((string) ($permiso['sistema'] ?? '') === '1') {
                json_error('No se puede eliminar un permiso de sistema.', 409);
            }
            $stmt = $pdo->prepare('DELETE FROM permisos WHERE id = :id');
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

function permiso_leer_body(): array
{
    $raw  = file_get_contents('php://input') ?: '';
    $body = json_decode($raw, true);
    return is_array($body) ? $body : [];
}

function permiso_validar_payload(array &$datos): void
{
    $datos['nombre']      = trim((string) ($datos['nombre']      ?? ''));
    $datos['slug']        = trim((string) ($datos['slug']        ?? ''));
    $datos['descripcion'] = trim((string) ($datos['descripcion'] ?? ''));

    $datos['slug']        = $datos['slug']        !== '' ? strtolower($datos['slug']) : null;
    $datos['descripcion'] = $datos['descripcion'] !== '' ? $datos['descripcion']      : null;
    $datos['sistema']     = !empty($datos['sistema']) ? '1' : null;

    if ($datos['nombre'] === '') {
        json_error('El nombre es obligatorio.', 422);
    }
    if (mb_strlen($datos['nombre']) > 255) {
        json_error('El nombre no puede tener más de 255 caracteres.', 422);
    }
    if ($datos['slug'] !== null) {
        if (mb_strlen($datos['slug']) > 64) {
            json_error('El slug no puede tener más de 64 caracteres.', 422);
        }
        if (!preg_match('/^[a-z0-9]+(?:[-_.][a-z0-9]+)*$/', $datos['slug'])) {
            json_error('El slug solo admite minúsculas, dígitos y separadores "-", "_" o ".".', 422);
        }
    }
    if ($datos['descripcion'] !== null && mb_strlen($datos['descripcion']) > 255) {
        json_error('La descripción no puede tener más de 255 caracteres.', 422);
    }
}

function permiso_nombre_duplicado(PDO $pdo, string $nombre, int $excluir_id = 0): bool
{
    $sql = 'SELECT id FROM permisos WHERE nombre = :nombre';
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

function permiso_slug_duplicado(PDO $pdo, string $slug, int $excluir_id = 0): bool
{
    $sql = 'SELECT id FROM permisos WHERE slug = :slug';
    if ($excluir_id > 0) {
        $sql .= ' AND id <> :id';
    }
    $sql .= ' LIMIT 1';
    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(':slug', $slug);
    if ($excluir_id > 0) {
        $stmt->bindValue(':id', $excluir_id, PDO::PARAM_INT);
    }
    $stmt->execute();
    return (bool) $stmt->fetchColumn();
}

function permiso_get(PDO $pdo, int $id): array
{
    $stmt = $pdo->prepare(
        'SELECT id, sistema, nombre, slug, descripcion
           FROM permisos
          WHERE id = :id
          LIMIT 1'
    );
    $stmt->execute([':id' => $id]);
    $p = $stmt->fetch();
    if (!$p) {
        json_error('Permiso no encontrado.', 404);
    }
    return $p;
}

function permisos_listar(PDO $pdo, array $opts = []): array
{
    $sortCols = [
        'id'          => 'id',
        'nombre'      => 'nombre',
        'slug'        => 'slug',
        'descripcion' => 'descripcion',
        'sistema'     => 'sistema',
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
        $where[] = 'id = :filtro_id';
        $params[':filtro_id'] = (int) $opts['filtro_id'];
    }
    $nombre = trim((string) ($opts['nombre'] ?? ''));
    if ($nombre !== '') {
        $where[] = 'nombre LIKE :nombre';
        $params[':nombre'] = '%' . $nombre . '%';
    }
    $slug = trim((string) ($opts['slug'] ?? ''));
    if ($slug !== '') {
        $where[] = 'slug LIKE :slug';
        $params[':slug'] = '%' . strtolower($slug) . '%';
    }
    $descripcion = trim((string) ($opts['descripcion'] ?? ''));
    if ($descripcion !== '') {
        $where[] = 'descripcion LIKE :descripcion';
        $params[':descripcion'] = '%' . $descripcion . '%';
    }
    $sistema = (string) ($opts['sistema'] ?? '');
    if ($sistema === '1') {
        $where[] = "sistema = '1'";
    } elseif ($sistema === '0') {
        $where[] = "(sistema IS NULL OR sistema <> '1')";
    }

    $sql = 'SELECT id, sistema, nombre, slug, descripcion FROM permisos';
    if ($where) {
        $sql .= ' WHERE ' . implode(' AND ', $where);
    }
    $sql .= " ORDER BY {$sortCols[$sortKey]} $dir LIMIT $limit";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetchAll();
}

function permisos_kpis(PDO $pdo): array
{
    return [
        'total'   => (int) $pdo->query('SELECT COUNT(*) FROM permisos')->fetchColumn(),
        'sistema' => (int) $pdo->query("SELECT COUNT(*) FROM permisos WHERE sistema = '1'")->fetchColumn(),
        'custom'  => (int) $pdo->query("SELECT COUNT(*) FROM permisos WHERE sistema IS NULL OR sistema <> '1'")->fetchColumn(),
    ];
}
