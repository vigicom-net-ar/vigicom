<?php
/**
 * Endpoint REST de gestión de usuarios del panel.
 *
 *   GET  /api/usuarios.php          → { usuarios, kpis, comunidades }
 *   GET  /api/usuarios.php?id=N     → usuario individual
 *   POST /api/usuarios.php          → crear (body JSON)
 *   PUT  /api/usuarios.php?id=N     → actualizar (body JSON)
 *   DELETE /api/usuarios.php?id=N   → eliminar
 *
 * Las contraseñas se guardan con cripto_encriptar() para mantener
 * compatibilidad con api/login.php (que verifica con cripto_desencriptar()).
 */

require_once __DIR__ . '/bootstrap.php';
require_once dirname(__DIR__) . '/lib/crypto.php';

$me = requireAuth();

$pdo    = db();
$method = $_SERVER['REQUEST_METHOD'];
$id     = isset($_GET['id']) && ctype_digit((string) $_GET['id']) ? (int) $_GET['id'] : 0;

try {
    switch ($method) {

        case 'GET':
            if ($id > 0) {
                json_ok(usuario_get($pdo, $id));
            }
            json_ok([
                'usuarios'    => usuarios_listar($pdo, $_GET),
                'kpis'        => usuarios_kpis($pdo),
                'comunidades' => $pdo->query('SELECT id, nombre FROM comunidades ORDER BY nombre')->fetchAll(),
            ]);
            break;

        case 'POST':
            $datos = leer_body();
            $pass  = trim((string) ($datos['contrasena'] ?? ''));
            validar_payload($datos, requireContrasena: true);
            if ($pass !== '' && mb_strlen($pass) > 16) {
                json_error('La contraseña no puede tener más de 16 caracteres.', 422);
            }
            if (correo_duplicado($pdo, $datos['correo'])) {
                json_error('Ya existe un usuario con ese correo.', 409);
            }

            $stmt = $pdo->prepare(
                'INSERT INTO usuarios
                     (nombre, correo, telefono, dni, comunidad, casa, roles,
                      contrasena, estado, registrado, registrante)
                 VALUES
                     (:nombre, :correo, :telefono, :dni, :comunidad, :casa, :roles,
                      :contrasena, :estado, NOW(), :registrante)'
            );
            $stmt->execute([
                ':nombre'      => $datos['nombre'],
                ':correo'      => $datos['correo'],
                ':telefono'    => $datos['telefono'],
                ':dni'         => $datos['dni'],
                ':comunidad'   => $datos['comunidad'],
                ':casa'        => $datos['casa'],
                ':roles'       => $datos['roles'],
                ':contrasena'  => cripto_encriptar($pass),
                ':estado'      => $datos['estado'],
                ':registrante' => (int) ($me['sub'] ?? 0) ?: null,
            ]);
            json_ok(['id' => (int) $pdo->lastInsertId()]);
            break;

        case 'PUT':
            if ($id <= 0) {
                json_error('ID inválido.', 422);
            }
            $datos = leer_body();
            $pass  = trim((string) ($datos['contrasena'] ?? ''));
            validar_payload($datos, requireContrasena: false);
            if ($pass !== '' && mb_strlen($pass) > 16) {
                json_error('La contraseña no puede tener más de 16 caracteres.', 422);
            }
            if (correo_duplicado($pdo, $datos['correo'], $id)) {
                json_error('Ya existe otro usuario con ese correo.', 409);
            }
            if ($id === (int) ($me['sub'] ?? 0) && $datos['estado'] === 0) {
                json_error('No podés desactivar tu propio usuario.', 409);
            }

            $sets = [
                'nombre = :nombre', 'correo = :correo', 'telefono = :telefono',
                'dni = :dni', 'comunidad = :comunidad', 'casa = :casa',
                'roles = :roles', 'estado = :estado',
            ];
            $params = [
                ':nombre'    => $datos['nombre'],
                ':correo'    => $datos['correo'],
                ':telefono'  => $datos['telefono'],
                ':dni'       => $datos['dni'],
                ':comunidad' => $datos['comunidad'],
                ':casa'      => $datos['casa'],
                ':roles'     => $datos['roles'],
                ':estado'    => $datos['estado'],
                ':id'        => $id,
            ];
            if ($pass !== '') {
                $sets[]                = 'contrasena = :contrasena';
                $params[':contrasena'] = cripto_encriptar($pass);
            }
            $stmt = $pdo->prepare('UPDATE usuarios SET ' . implode(', ', $sets) . ' WHERE id = :id');
            $stmt->execute($params);
            json_ok();
            break;

        case 'DELETE':
            if ($id <= 0) {
                json_error('ID inválido.', 422);
            }
            if ($id === (int) ($me['sub'] ?? 0)) {
                json_error('No podés eliminar tu propio usuario.', 409);
            }
            $stmt = $pdo->prepare('DELETE FROM usuarios WHERE id = :id');
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

function leer_body(): array
{
    $raw  = file_get_contents('php://input') ?: '';
    $body = json_decode($raw, true);
    return is_array($body) ? $body : [];
}

function validar_payload(array &$datos, bool $requireContrasena): void
{
    $datos['nombre']   = trim((string) ($datos['nombre']   ?? ''));
    $datos['correo']   = trim((string) ($datos['correo']   ?? ''));
    $datos['telefono'] = trim((string) ($datos['telefono'] ?? ''));
    $datos['dni']      = trim((string) ($datos['dni']      ?? ''));
    $datos['roles']    = trim((string) ($datos['roles']    ?? ''));

    $datos['telefono']  = $datos['telefono'] !== '' ? $datos['telefono'] : null;
    $datos['dni']       = $datos['dni']      !== '' ? $datos['dni']      : null;
    $datos['roles']     = $datos['roles']    !== '' ? $datos['roles']    : null;
    $datos['comunidad'] = isset($datos['comunidad']) && ctype_digit((string) $datos['comunidad'])
        ? (int) $datos['comunidad'] : null;
    $datos['casa']      = isset($datos['casa']) && ctype_digit((string) $datos['casa'])
        ? (int) $datos['casa'] : null;
    $datos['estado']    = !empty($datos['estado']) ? 1 : 0;

    if ($datos['nombre'] === '' || $datos['correo'] === '') {
        json_error('Nombre y correo son obligatorios.', 422);
    }
    if (!filter_var($datos['correo'], FILTER_VALIDATE_EMAIL)) {
        json_error('Correo inválido.', 422);
    }
    if ($requireContrasena && trim((string) ($datos['contrasena'] ?? '')) === '') {
        json_error('La contraseña es obligatoria.', 422);
    }
}

function correo_duplicado(PDO $pdo, string $correo, int $excluir_id = 0): bool
{
    $sql = 'SELECT id FROM usuarios WHERE correo = :correo';
    if ($excluir_id > 0) {
        $sql .= ' AND id <> :id';
    }
    $sql .= ' LIMIT 1';
    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(':correo', $correo);
    if ($excluir_id > 0) {
        $stmt->bindValue(':id', $excluir_id, PDO::PARAM_INT);
    }
    $stmt->execute();
    return (bool) $stmt->fetchColumn();
}

function usuario_get(PDO $pdo, int $id): array
{
    // Devuelve todos los campos del registro excepto secretos (contrasena, clave, token),
    // con los nombres resueltos para comunidad, casa y registrante.
    $stmt = $pdo->prepare(
        'SELECT u.id, u.nombre, u.casa, u.comunidad, u.telefono, u.correo,
                u.genero, u.nacimiento, u.dni, u.aplicacion,
                u.ubicacionCoordenadas, u.ubicacionExactitud, u.ubicacionActualizada,
                u.sistema, u.instalada, u.ejecutada,
                u.avisos, u.notificaciones, u.whatsapps, u.mensajes, u.correos,
                u.terminal, u.registrado, u.registrante, u.roles, u.estado, u.propiedades,
                c.nombre  AS comunidad_nombre,
                k.nombre  AS casa_nombre,
                r.nombre  AS registrante_nombre
           FROM usuarios u
           LEFT JOIN comunidades c ON c.id = u.comunidad
           LEFT JOIN casas       k ON k.id = u.casa
           LEFT JOIN usuarios    r ON r.id = u.registrante
          WHERE u.id = :id
          LIMIT 1'
    );
    $stmt->execute([':id' => $id]);
    $u = $stmt->fetch();
    if (!$u) {
        json_error('Usuario no encontrado.', 404);
    }
    return $u;
}

function usuarios_listar(PDO $pdo, array $opts = []): array
{
    $sortCols = [
        'id'         => 'u.id',
        'nombre'     => 'u.nombre',
        'correo'     => 'u.correo',
        'registrado' => 'u.registrado',
        'estado'     => 'u.estado',
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
        $where[] = 'u.id = :filtro_id';
        $params[':filtro_id'] = (int) $opts['filtro_id'];
    }
    $nombre = trim((string) ($opts['nombre'] ?? ''));
    if ($nombre !== '') {
        $where[] = 'u.nombre LIKE :nombre';
        $params[':nombre'] = '%' . $nombre . '%';
    }
    $correo = trim((string) ($opts['correo'] ?? ''));
    if ($correo !== '') {
        $where[] = 'u.correo LIKE :correo';
        $params[':correo'] = '%' . $correo . '%';
    }
    $telefono = trim((string) ($opts['telefono'] ?? ''));
    if ($telefono !== '') {
        $where[] = 'u.telefono LIKE :telefono';
        $params[':telefono'] = '%' . $telefono . '%';
    }
    if (!empty($opts['comunidad']) && ctype_digit((string) $opts['comunidad'])) {
        $where[] = 'u.comunidad = :comunidad';
        $params[':comunidad'] = (int) $opts['comunidad'];
    }
    $roles = trim((string) ($opts['roles'] ?? ''));
    if ($roles !== '') {
        $where[] = 'u.roles = :roles';
        $params[':roles'] = $roles;
    }
    $estado = (string) ($opts['estado'] ?? '');
    if ($estado === '0' || $estado === '1') {
        $where[] = 'COALESCE(u.estado, 0) = :estado';
        $params[':estado'] = (int) $estado;
    }

    $sql = "SELECT u.id, u.nombre, u.correo, u.telefono, u.dni, u.roles, u.estado,
                   u.comunidad, c.nombre AS comunidad_nombre, u.casa, u.registrado
              FROM usuarios u
              LEFT JOIN comunidades c ON c.id = u.comunidad";
    if ($where) {
        $sql .= ' WHERE ' . implode(' AND ', $where);
    }
    $sql .= " ORDER BY {$sortCols[$sortKey]} $dir LIMIT $limit";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetchAll();
}

function usuarios_kpis(PDO $pdo): array
{
    return [
        'total'     => (int) $pdo->query('SELECT COUNT(*) FROM usuarios')->fetchColumn(),
        'activos'   => (int) $pdo->query('SELECT COUNT(*) FROM usuarios WHERE estado = 1')->fetchColumn(),
        'inactivos' => (int) $pdo->query('SELECT COUNT(*) FROM usuarios WHERE estado = 0 OR estado IS NULL')->fetchColumn(),
    ];
}
