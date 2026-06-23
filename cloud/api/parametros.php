<?php
/**
 * Endpoint REST de gestión de parámetros del sistema.
 *
 *   GET    /api/parametros.php          → { parametros }
 *   GET    /api/parametros.php?id=N     → parámetro individual
 *   POST   /api/parametros.php          → crear (body JSON)
 *   PUT    /api/parametros.php?id=N     → actualizar (body JSON)
 *   DELETE /api/parametros.php?id=N     → eliminar
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
                json_ok(parametro_get($pdo, $id));
            }
            json_ok([
                'parametros' => parametros_listar($pdo, $_GET),
            ]);
            break;

        case 'POST':
            $datos = parametro_leer_body();
            parametro_validar_payload($datos);
            if (parametro_variable_duplicada($pdo, $datos['variable'])) {
                json_error('Ya existe un parámetro con esa variable.', 409);
            }

            $stmt = $pdo->prepare(
                'INSERT INTO parametros (variable, valor, comentario)
                 VALUES (:variable, :valor, :comentario)'
            );
            $stmt->execute([
                ':variable'   => $datos['variable'],
                ':valor'      => $datos['valor'],
                ':comentario' => $datos['comentario'],
            ]);
            json_ok(['id' => (int) $pdo->lastInsertId()]);
            break;

        case 'PUT':
            if ($id <= 0) {
                json_error('ID inválido.', 422);
            }
            $datos = parametro_leer_body();
            parametro_validar_payload($datos);
            if (parametro_variable_duplicada($pdo, $datos['variable'], $id)) {
                json_error('Ya existe otro parámetro con esa variable.', 409);
            }

            $stmt = $pdo->prepare(
                'UPDATE parametros
                    SET variable   = :variable,
                        valor      = :valor,
                        comentario = :comentario
                  WHERE id = :id'
            );
            $stmt->execute([
                ':variable'   => $datos['variable'],
                ':valor'      => $datos['valor'],
                ':comentario' => $datos['comentario'],
                ':id'         => $id,
            ]);
            json_ok();
            break;

        case 'DELETE':
            if ($id <= 0) {
                json_error('ID inválido.', 422);
            }
            parametro_get($pdo, $id);
            $stmt = $pdo->prepare('DELETE FROM parametros WHERE id = :id');
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

function parametro_leer_body(): array
{
    $raw  = file_get_contents('php://input') ?: '';
    $body = json_decode($raw, true);
    return is_array($body) ? $body : [];
}

function parametro_validar_payload(array &$datos): void
{
    $datos['variable']   = trim((string) ($datos['variable']   ?? ''));
    $datos['valor']      = trim((string) ($datos['valor']      ?? ''));
    $datos['comentario'] = trim((string) ($datos['comentario'] ?? ''));

    $datos['valor']      = $datos['valor']      !== '' ? $datos['valor']      : null;
    $datos['comentario'] = $datos['comentario'] !== '' ? $datos['comentario'] : null;

    if ($datos['variable'] === '') {
        json_error('La variable es obligatoria.', 422);
    }
    if (mb_strlen($datos['variable']) > 255) {
        json_error('La variable no puede tener más de 255 caracteres.', 422);
    }
    if ($datos['valor'] !== null && mb_strlen($datos['valor']) > 255) {
        json_error('El valor no puede tener más de 255 caracteres.', 422);
    }
    if ($datos['comentario'] !== null && mb_strlen($datos['comentario']) > 1024) {
        json_error('El comentario no puede tener más de 1024 caracteres.', 422);
    }
}

function parametro_variable_duplicada(PDO $pdo, string $variable, int $excluir_id = 0): bool
{
    $sql = 'SELECT id FROM parametros WHERE variable = :variable';
    if ($excluir_id > 0) {
        $sql .= ' AND id <> :id';
    }
    $sql .= ' LIMIT 1';
    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(':variable', $variable);
    if ($excluir_id > 0) {
        $stmt->bindValue(':id', $excluir_id, PDO::PARAM_INT);
    }
    $stmt->execute();
    return (bool) $stmt->fetchColumn();
}

function parametro_get(PDO $pdo, int $id): array
{
    $stmt = $pdo->prepare(
        'SELECT id, variable, valor, comentario
           FROM parametros
          WHERE id = :id
          LIMIT 1'
    );
    $stmt->execute([':id' => $id]);
    $r = $stmt->fetch();
    if (!$r) {
        json_error('Parámetro no encontrado.', 404);
    }
    return $r;
}

function parametros_listar(PDO $pdo, array $opts = []): array
{
    $limit = isset($opts['limit']) && ctype_digit((string) $opts['limit']) ? (int) $opts['limit'] : 1000;
    if ($limit < 1)    { $limit = 1000; }
    if ($limit > 5000) { $limit = 5000; }

    $sql = 'SELECT id, variable, valor, comentario FROM parametros ORDER BY id DESC LIMIT ' . $limit;
    $stmt = $pdo->query($sql);
    return $stmt->fetchAll();
}
