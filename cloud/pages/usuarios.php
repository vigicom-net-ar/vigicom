<?php
/**
 * Gestion de usuarios del panel.
 *
 *  - GET  /pages/usuarios.php          Renderiza la pantalla (lista + modales).
 *  - POST /pages/usuarios.php (JSON)   Acciones CRUD: get / create / update / delete.
 *
 * La contrasena se guarda con cripto_encriptar() para mantener compatibilidad
 * con la verificacion existente en includes/auth.php.
 */

require_once __DIR__ . '/../includes/auth.php';
requerir_login();
require_once __DIR__ . '/../config/database.php';

// --- Solo admin --------------------------------------------------------------
$me = usuario_actual();
$es_admin = str_contains((string) ($me['roles'] ?? ''), 'admin');

// --- API JSON ----------------------------------------------------------------
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    header('Content-Type: application/json; charset=utf-8');

    if (!$es_admin) {
        http_response_code(403);
        echo json_encode(['ok' => false, 'error' => 'No tenes permiso.']);
        exit;
    }
    if (!csrf_validar($_POST['_csrf'] ?? null)) {
        http_response_code(403);
        echo json_encode(['ok' => false, 'error' => 'Token CSRF invalido. Recargue la pagina.']);
        exit;
    }

    $accion = (string) $_POST['action'];
    $pdo    = db();

    try {
        switch ($accion) {

            case 'get': {
                $id = (int) ($_POST['id'] ?? 0);
                $stmt = $pdo->prepare(
                    'SELECT id, nombre, correo, telefono, dni, comunidad, casa,
                            roles, estado
                       FROM usuarios
                      WHERE id = :id
                      LIMIT 1'
                );
                $stmt->execute([':id' => $id]);
                $u = $stmt->fetch();
                if (!$u) {
                    http_response_code(404);
                    echo json_encode(['ok' => false, 'error' => 'Usuario no encontrado.']);
                    exit;
                }
                echo json_encode(['ok' => true, 'data' => $u]);
                exit;
            }

            case 'create': {
                $datos = leer_form_usuario();
                $pass  = (string) ($_POST['contrasena'] ?? '');
                if ($datos['nombre'] === '' || $datos['correo'] === '' || $pass === '') {
                    http_response_code(422);
                    echo json_encode(['ok' => false, 'error' => 'Nombre, correo y contrasena son obligatorios.']);
                    exit;
                }
                if (!filter_var($datos['correo'], FILTER_VALIDATE_EMAIL)) {
                    http_response_code(422);
                    echo json_encode(['ok' => false, 'error' => 'Correo invalido.']);
                    exit;
                }
                if (strlen($pass) > 16) {
                    http_response_code(422);
                    echo json_encode(['ok' => false, 'error' => 'La contrasena no puede tener mas de 16 caracteres.']);
                    exit;
                }
                if (correo_duplicado($pdo, $datos['correo'])) {
                    http_response_code(409);
                    echo json_encode(['ok' => false, 'error' => 'Ya existe un usuario con ese correo.']);
                    exit;
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
                    ':registrante' => (int) ($me['id'] ?? 0) ?: null,
                ]);
                echo json_encode(['ok' => true, 'id' => (int) $pdo->lastInsertId()]);
                exit;
            }

            case 'update': {
                $id = (int) ($_POST['id'] ?? 0);
                if ($id <= 0) {
                    http_response_code(422);
                    echo json_encode(['ok' => false, 'error' => 'ID invalido.']);
                    exit;
                }
                $datos = leer_form_usuario();
                $pass  = (string) ($_POST['contrasena'] ?? '');
                if ($datos['nombre'] === '' || $datos['correo'] === '') {
                    http_response_code(422);
                    echo json_encode(['ok' => false, 'error' => 'Nombre y correo son obligatorios.']);
                    exit;
                }
                if (!filter_var($datos['correo'], FILTER_VALIDATE_EMAIL)) {
                    http_response_code(422);
                    echo json_encode(['ok' => false, 'error' => 'Correo invalido.']);
                    exit;
                }
                if ($pass !== '' && strlen($pass) > 16) {
                    http_response_code(422);
                    echo json_encode(['ok' => false, 'error' => 'La contrasena no puede tener mas de 16 caracteres.']);
                    exit;
                }
                if (correo_duplicado($pdo, $datos['correo'], $id)) {
                    http_response_code(409);
                    echo json_encode(['ok' => false, 'error' => 'Ya existe otro usuario con ese correo.']);
                    exit;
                }

                // No permitir desactivarse a si mismo.
                if ($id === (int) ($me['id'] ?? 0) && $datos['estado'] === 0) {
                    http_response_code(409);
                    echo json_encode(['ok' => false, 'error' => 'No podes desactivar tu propio usuario.']);
                    exit;
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

                echo json_encode(['ok' => true]);
                exit;
            }

            case 'delete': {
                $id = (int) ($_POST['id'] ?? 0);
                if ($id <= 0) {
                    http_response_code(422);
                    echo json_encode(['ok' => false, 'error' => 'ID invalido.']);
                    exit;
                }
                if ($id === (int) ($me['id'] ?? 0)) {
                    http_response_code(409);
                    echo json_encode(['ok' => false, 'error' => 'No podes eliminar tu propio usuario.']);
                    exit;
                }
                $stmt = $pdo->prepare('DELETE FROM usuarios WHERE id = :id');
                $stmt->execute([':id' => $id]);
                echo json_encode(['ok' => true]);
                exit;
            }

            default:
                http_response_code(400);
                echo json_encode(['ok' => false, 'error' => 'Accion desconocida.']);
                exit;
        }
    } catch (Throwable $e) {
        http_response_code(500);
        $msg = APP_ENV === 'dev' ? $e->getMessage() : 'Error del servidor.';
        echo json_encode(['ok' => false, 'error' => $msg]);
        exit;
    }
}

// --- Helpers de form ---------------------------------------------------------
function leer_form_usuario(): array
{
    $nombre   = trim((string) ($_POST['nombre']   ?? ''));
    $correo   = trim((string) ($_POST['correo']   ?? ''));
    $telefono = trim((string) ($_POST['telefono'] ?? ''));
    $dni      = trim((string) ($_POST['dni']      ?? ''));
    $roles    = trim((string) ($_POST['roles']    ?? ''));

    return [
        'nombre'    => $nombre,
        'correo'    => $correo,
        'telefono'  => $telefono !== '' ? $telefono : null,
        'dni'       => $dni      !== '' ? $dni      : null,
        'comunidad' => ctype_digit((string) ($_POST['comunidad'] ?? '')) ? (int) $_POST['comunidad'] : null,
        'casa'      => ctype_digit((string) ($_POST['casa']      ?? '')) ? (int) $_POST['casa']      : null,
        'roles'     => $roles !== '' ? $roles : null,
        'estado'    => isset($_POST['estado']) && (string) $_POST['estado'] === '1' ? 1 : 0,
    ];
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

// --- Render HTML -------------------------------------------------------------
$pagina_actual = 'usuarios';
$titulo        = 'Usuarios';

if (!$es_admin) {
    require __DIR__ . '/../includes/layout_top.php';
    ?>
    <div class="page-header"><div><h1>Usuarios</h1></div></div>
    <div class="alert alert-error">No tenes permiso para acceder a este modulo. Pedi a un administrador que te asigne el rol <code>admin</code>.</div>
    <?php
    require __DIR__ . '/../includes/layout_bottom.php';
    exit;
}

$pdo = db();

$kpis = [
    'total'     => (int) $pdo->query('SELECT COUNT(*) FROM usuarios')->fetchColumn(),
    'activos'   => (int) $pdo->query('SELECT COUNT(*) FROM usuarios WHERE estado = 1')->fetchColumn(),
    'inactivos' => (int) $pdo->query('SELECT COUNT(*) FROM usuarios WHERE estado = 0 OR estado IS NULL')->fetchColumn(),
];

$usuarios = $pdo->query("
    SELECT u.id, u.nombre, u.correo, u.telefono, u.dni, u.roles, u.estado,
           u.comunidad, c.nombre AS comunidad_nombre
      FROM usuarios u
      LEFT JOIN comunidades c ON c.id = u.comunidad
     ORDER BY u.nombre IS NULL, u.nombre, u.id
")->fetchAll();

$comunidades = $pdo->query('SELECT id, nombre FROM comunidades ORDER BY nombre')->fetchAll();

require __DIR__ . '/../includes/layout_top.php';
?>

<div class="page-header">
    <div>
        <h1>Usuarios</h1>
        <p>Cuentas con acceso al panel de Vigicom.</p>
    </div>
</div>

<div class="stats-bar">
    <div class="stat-card">
        <span class="stat-label">Total</span>
        <span class="stat-value orange"><?php echo $kpis['total']; ?></span>
        <span class="text-muted text-sm">Usuarios registrados</span>
    </div>
    <div class="stat-card">
        <span class="stat-label">Activos</span>
        <span class="stat-value green"><?php echo $kpis['activos']; ?></span>
        <span class="text-muted text-sm">Pueden iniciar sesion</span>
    </div>
    <div class="stat-card">
        <span class="stat-label">Inactivos</span>
        <span class="stat-value red"><?php echo $kpis['inactivos']; ?></span>
        <span class="text-muted text-sm">Sin acceso</span>
    </div>
</div>

<div class="toolbar">
    <div class="toolbar-left">
        <div class="search-wrap">
            <input type="search" id="searchInput" class="search-input" placeholder="Buscar nombre, correo, DNI...">
            <button class="search-clear" id="searchClear" type="button" style="display:none;">&times;</button>
        </div>
        <button class="filter-chip active" data-filter="all"      type="button">Todos</button>
        <button class="filter-chip"        data-filter="active"   type="button">Activos</button>
        <button class="filter-chip"        data-filter="inactive" type="button">Inactivos</button>
    </div>
    <div class="toolbar-right">
        <button class="btn btn-primary" id="btnNuevo" type="button">+ Nuevo usuario</button>
    </div>
</div>

<div class="table-card">
    <table>
        <thead>
            <tr>
                <th>Usuario</th>
                <th>Contacto</th>
                <th>Comunidad</th>
                <th>Rol</th>
                <th>Estado</th>
                <th style="text-align:right;">Acciones</th>
            </tr>
        </thead>
        <tbody id="usuariosTbody">
        <?php if (!$usuarios): ?>
            <tr><td colspan="6" class="table-empty">No hay usuarios cargados.</td></tr>
        <?php else: foreach ($usuarios as $u):
            $estado_int = (int) ($u['estado'] ?? 0);
            $busqueda = mb_strtolower(trim(($u['nombre'] ?? '') . ' ' . ($u['correo'] ?? '') . ' ' . ($u['dni'] ?? '') . ' ' . ($u['telefono'] ?? '')));
        ?>
            <tr data-id="<?php echo (int) $u['id']; ?>"
                data-estado="<?php echo $estado_int; ?>"
                data-search="<?php echo e($busqueda); ?>">
                <td>
                    <div class="td-nombre"><?php echo e($u['nombre'] ?? '—'); ?></div>
                    <div class="td-id">#<?php echo (int) $u['id']; ?>
                        <?php if (!empty($u['dni'])): ?>· DNI <?php echo e($u['dni']); ?><?php endif; ?>
                    </div>
                </td>
                <td>
                    <div><?php echo e($u['correo'] ?? '—'); ?></div>
                    <?php if (!empty($u['telefono'])): ?>
                        <div class="td-id"><?php echo e($u['telefono']); ?></div>
                    <?php endif; ?>
                </td>
                <td><?php echo e($u['comunidad_nombre'] ?? '—'); ?></td>
                <td><?php echo e($u['roles'] ?: '—'); ?></td>
                <td>
                    <?php if ($estado_int === 1): ?>
                        <span class="badge badge-success">Activo</span>
                    <?php else: ?>
                        <span class="badge badge-danger">Inactivo</span>
                    <?php endif; ?>
                </td>
                <td>
                    <div class="actions" style="justify-content:flex-end;">
                        <button class="btn-icon-sm" data-act="edit"   type="button" title="Editar"><i class="fa-solid fa-pencil"></i></button>
                        <button class="btn-icon-sm" data-act="delete" type="button" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        <?php endforeach; endif; ?>
        </tbody>
    </table>
    <div class="table-empty" id="emptyState" style="display:none;">No hay usuarios que coincidan con la busqueda.</div>
</div>

<!-- Modal alta / edicion -->
<div class="modal-backdrop" id="modalUsuario">
    <div class="modal">
        <div class="modal-header">
            <div class="modal-title">
                <span id="modalTitulo">Nuevo usuario</span>
                <span class="modal-subtitle" id="modalSubtitulo"></span>
            </div>
            <button class="btn-icon-sm" data-act="close" type="button" aria-label="Cerrar">&times;</button>
        </div>

        <form id="formUsuario" novalidate>
            <input type="hidden" name="_csrf"  value="<?php echo e(csrf_token()); ?>">
            <input type="hidden" name="action" id="f-action" value="create">
            <input type="hidden" name="id"     id="f-id"     value="">

            <div class="modal-body">
                <div class="alert alert-error" id="modalError" style="display:none;"></div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="f-nombre">Nombre</label>
                        <input id="f-nombre" name="nombre" type="text" maxlength="255" required>
                    </div>
                    <div class="form-group">
                        <label for="f-correo">Correo</label>
                        <input id="f-correo" name="correo" type="email" maxlength="100" required>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="f-telefono">Teléfono</label>
                        <input id="f-telefono" name="telefono" type="tel" maxlength="10">
                    </div>
                    <div class="form-group">
                        <label for="f-dni">DNI</label>
                        <input id="f-dni" name="dni" type="text" maxlength="50">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="f-comunidad">Comunidad</label>
                        <select id="f-comunidad" name="comunidad">
                            <option value="">—</option>
                            <?php foreach ($comunidades as $c): ?>
                                <option value="<?php echo (int) $c['id']; ?>"><?php echo e($c['nombre']); ?></option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="f-roles">Rol</label>
                        <select id="f-roles" name="roles">
                            <option value="">—</option>
                            <option value="admin">admin</option>
                            <option value="operador">operador</option>
                            <option value="vecino">vecino</option>
                        </select>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="f-contrasena">Contraseña</label>
                        <input id="f-contrasena" name="contrasena" type="text" maxlength="16" autocomplete="new-password">
                        <div class="text-muted text-sm" id="hintPass">Máximo 16 caracteres.</div>
                    </div>
                    <div class="form-group">
                        <label>Estado</label>
                        <label class="toggle-switch" style="margin-top:6px;">
                            <input id="f-estado" name="estado" type="checkbox" value="1" checked>
                            <span class="toggle-track"><span class="toggle-thumb"></span></span>
                            <span class="toggle-label" id="estadoLabel">Activo</span>
                        </label>
                    </div>
                </div>
            </div>

            <div class="modal-footer">
                <button type="button" class="btn btn-ghost" data-act="close">Cancelar</button>
                <button type="submit" class="btn btn-primary" id="btnGuardar">Guardar</button>
            </div>
        </form>
    </div>
</div>

<!-- Confirm delete -->
<div class="confirm-backdrop" id="confirmDelete">
    <div class="confirm-box">
        <div class="confirm-title">Eliminar usuario</div>
        <div class="confirm-msg" id="confirmMsg">Esta acción no se puede deshacer.</div>
        <div class="confirm-actions">
            <button class="btn btn-ghost"  data-act="cancel" type="button">Cancelar</button>
            <button class="btn btn-danger" id="btnConfirmDelete" type="button">Eliminar</button>
        </div>
    </div>
</div>

<div id="toast" class="toast"></div>

<script>
(function () {
    'use strict';

    const CSRF = <?php echo json_encode(csrf_token()); ?>;
    const ME_ID = <?php echo (int) ($me['id'] ?? 0); ?>;

    const tbody       = document.getElementById('usuariosTbody');
    const emptyState  = document.getElementById('emptyState');
    const searchInput = document.getElementById('searchInput');
    const searchClear = document.getElementById('searchClear');
    const chips       = document.querySelectorAll('.filter-chip[data-filter]');

    const modal       = document.getElementById('modalUsuario');
    const modalTitulo = document.getElementById('modalTitulo');
    const modalSub    = document.getElementById('modalSubtitulo');
    const modalError  = document.getElementById('modalError');
    const form        = document.getElementById('formUsuario');
    const fAction     = document.getElementById('f-action');
    const fId         = document.getElementById('f-id');
    const fEstado     = document.getElementById('f-estado');
    const estadoLabel = document.getElementById('estadoLabel');
    const hintPass    = document.getElementById('hintPass');
    const btnGuardar  = document.getElementById('btnGuardar');

    const confirmBox  = document.getElementById('confirmDelete');
    const confirmMsg  = document.getElementById('confirmMsg');
    const btnDelete   = document.getElementById('btnConfirmDelete');

    const toast = document.getElementById('toast');
    let currentFilter = 'all';
    let pendingDeleteId = null;

    // -------- Filtros / busqueda --------------------------------------------
    function applyFilters() {
        const q = searchInput.value.trim().toLowerCase();
        let visibles = 0;
        tbody.querySelectorAll('tr[data-id]').forEach(tr => {
            const haystack = tr.dataset.search || '';
            const estado   = tr.dataset.estado;
            const okQ      = !q || haystack.indexOf(q) !== -1;
            const okEstado = currentFilter === 'all'
                          || (currentFilter === 'active'   && estado === '1')
                          || (currentFilter === 'inactive' && estado !== '1');
            const show = okQ && okEstado;
            tr.style.display = show ? '' : 'none';
            if (show) visibles++;
        });
        emptyState.style.display = (visibles === 0 && tbody.querySelector('tr[data-id]')) ? '' : 'none';
        searchClear.style.display = q ? '' : 'none';
    }

    searchInput.addEventListener('input', applyFilters);
    searchClear.addEventListener('click', () => { searchInput.value = ''; applyFilters(); searchInput.focus(); });
    chips.forEach(c => c.addEventListener('click', () => {
        chips.forEach(x => x.classList.remove('active'));
        c.classList.add('active');
        currentFilter = c.dataset.filter;
        applyFilters();
    }));

    // -------- Modal ----------------------------------------------------------
    function openModal() { modal.classList.add('open'); }
    function closeModal() {
        modal.classList.remove('open');
        modalError.style.display = 'none';
        modalError.textContent   = '';
        form.querySelectorAll('.input-invalid').forEach(el => el.classList.remove('input-invalid'));
    }
    modal.addEventListener('click', e => {
        if (e.target === modal || e.target.closest('[data-act="close"]')) closeModal();
    });

    function showError(msg) {
        modalError.textContent   = msg;
        modalError.style.display = '';
    }

    function setEstadoLabel() {
        estadoLabel.textContent = fEstado.checked ? 'Activo' : 'Inactivo';
    }
    fEstado.addEventListener('change', setEstadoLabel);

    function resetForm() {
        form.reset();
        fId.value = '';
        fEstado.checked = true;
        setEstadoLabel();
    }

    // -------- Nuevo ----------------------------------------------------------
    document.getElementById('btnNuevo').addEventListener('click', () => {
        resetForm();
        fAction.value             = 'create';
        modalTitulo.textContent   = 'Nuevo usuario';
        modalSub.textContent      = '';
        hintPass.textContent      = 'Máximo 16 caracteres. Obligatoria.';
        document.getElementById('f-contrasena').setAttribute('required', 'required');
        openModal();
        document.getElementById('f-nombre').focus();
    });

    // -------- Editar / Eliminar (delegado en la tabla) ----------------------
    tbody.addEventListener('click', async e => {
        const btn = e.target.closest('button[data-act]');
        if (!btn) return;
        const tr = btn.closest('tr[data-id]');
        if (!tr) return;
        const id = parseInt(tr.dataset.id, 10);

        if (btn.dataset.act === 'edit') {
            try {
                const r = await api({ action: 'get', id });
                if (!r.ok) throw new Error(r.error || 'No se pudo cargar el usuario.');
                resetForm();
                fAction.value          = 'update';
                fId.value              = r.data.id;
                modalTitulo.textContent = 'Editar usuario';
                modalSub.textContent   = '#' + r.data.id;
                document.getElementById('f-nombre').value    = r.data.nombre   || '';
                document.getElementById('f-correo').value    = r.data.correo   || '';
                document.getElementById('f-telefono').value  = r.data.telefono || '';
                document.getElementById('f-dni').value       = r.data.dni      || '';
                document.getElementById('f-comunidad').value = r.data.comunidad ?? '';
                document.getElementById('f-roles').value     = r.data.roles    || '';
                fEstado.checked = parseInt(r.data.estado, 10) === 1;
                setEstadoLabel();
                hintPass.textContent = 'Dejar vacío para no cambiarla. Máximo 16 caracteres.';
                document.getElementById('f-contrasena').removeAttribute('required');
                openModal();
                document.getElementById('f-nombre').focus();
            } catch (err) {
                showToast(err.message, true);
            }
            return;
        }

        if (btn.dataset.act === 'delete') {
            if (id === ME_ID) {
                showToast('No podés eliminar tu propio usuario.', true);
                return;
            }
            const nombre = tr.querySelector('.td-nombre')?.textContent.trim() || ('#' + id);
            confirmMsg.textContent = '¿Eliminar al usuario "' + nombre + '"? Esta acción no se puede deshacer.';
            pendingDeleteId = id;
            confirmBox.classList.add('open');
        }
    });

    // -------- Confirm delete -------------------------------------------------
    confirmBox.addEventListener('click', e => {
        if (e.target === confirmBox || e.target.closest('[data-act="cancel"]')) {
            confirmBox.classList.remove('open');
            pendingDeleteId = null;
        }
    });
    btnDelete.addEventListener('click', async () => {
        if (!pendingDeleteId) return;
        btnDelete.disabled = true;
        try {
            const r = await api({ action: 'delete', id: pendingDeleteId });
            if (!r.ok) throw new Error(r.error || 'No se pudo eliminar.');
            showToast('Usuario eliminado.');
            location.reload();
        } catch (err) {
            showToast(err.message, true);
        } finally {
            btnDelete.disabled = false;
            confirmBox.classList.remove('open');
            pendingDeleteId = null;
        }
    });

    // -------- Submit alta / edicion ------------------------------------------
    form.addEventListener('submit', async e => {
        e.preventDefault();
        modalError.style.display = 'none';
        form.querySelectorAll('.input-invalid').forEach(el => el.classList.remove('input-invalid'));

        const fd = new FormData(form);
        // estado: el checkbox solo manda valor cuando esta checked
        if (!fd.has('estado')) fd.set('estado', '0');

        btnGuardar.disabled = true;
        try {
            const r = await apiForm(fd);
            if (!r.ok) {
                showError(r.error || 'No se pudo guardar.');
                return;
            }
            showToast(fAction.value === 'create' ? 'Usuario creado.' : 'Usuario actualizado.');
            closeModal();
            location.reload();
        } catch (err) {
            showError(err.message);
        } finally {
            btnGuardar.disabled = false;
        }
    });

    // -------- API helpers ----------------------------------------------------
    async function api(payload) {
        const fd = new FormData();
        Object.keys(payload).forEach(k => fd.append(k, payload[k]));
        fd.append('_csrf', CSRF);
        return apiForm(fd);
    }
    async function apiForm(fd) {
        const res = await fetch(location.pathname, { method: 'POST', body: fd, credentials: 'same-origin' });
        const ct  = res.headers.get('content-type') || '';
        if (!ct.includes('application/json')) {
            throw new Error('Respuesta inesperada del servidor.');
        }
        return res.json();
    }

    // -------- Toast ----------------------------------------------------------
    let toastTimer = null;
    function showToast(msg, isError) {
        toast.textContent = msg;
        toast.classList.toggle('error', !!isError);
        toast.classList.add('show');
        if (toastTimer) clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
    }

    // -------- Atajos ---------------------------------------------------------
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            if (modal.classList.contains('open'))      closeModal();
            if (confirmBox.classList.contains('open')) { confirmBox.classList.remove('open'); pendingDeleteId = null; }
        }
    });
})();
</script>

<?php require __DIR__ . '/../includes/layout_bottom.php'; ?>
