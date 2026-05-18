/**
 * SPA de Vigicom Cloud.
 *
 * El shell (index.php) renderiza sidebar + topbar y delega el contenido
 * de #view a este archivo. Routing por hash (#/dashboard, #/usuarios, ...).
 * Cada vista pide sus datos a un endpoint en /api/<recurso>.php.
 */

(function () {
    'use strict';

    var ME           = (window.__VIGICOM__ || {}).user || {};
    var view         = document.getElementById('view');
    var topbarTitle  = document.getElementById('topbarTitle');
    var sidebarNav   = document.getElementById('sidebarNav');
    var sidebarEl    = document.getElementById('sidebar');
    var overlayEl    = document.getElementById('sidebarOverlay');
    var hamburgerEl  = document.getElementById('hamburger');
    var userToggle   = document.getElementById('userToggle');
    var userDropdown = document.getElementById('userDropdown');
    var toastEl      = document.getElementById('toast');

    // -------- Router --------------------------------------------------------

    var routes = {
        '/dashboard':    { title: 'Dashboard',     render: renderDashboard },
        '/clientes':     { title: 'Clientes',      render: renderTodo },
        '/comunidades':  { title: 'Comunidad',     render: renderComunidades },
        '/casas':        { title: 'Casas',         render: renderCasas },
        '/dispositivos': { title: 'Dispositivos',  render: renderTodo },
        '/eventos':      { title: 'Eventos',       render: renderTodo },
        '/reportes':     { title: 'Reportes',      render: renderTodo },
        '/usuarios':     { title: 'Usuarios',      render: renderUsuarios },
        '/roles':        { title: 'Roles',         render: renderRoles },
        '/config':       { title: 'Configuración', render: renderTodo }
    };

    function currentRoute() {
        var h = location.hash.replace(/^#/, '');
        return routes[h] ? h : '/dashboard';
    }

    function setActive(hash) {
        sidebarNav.querySelectorAll('.nav-item').forEach(function (el) {
            el.classList.toggle('active', el.dataset.route === hash);
        });
        sidebarNav.querySelectorAll('.nav-group-wrap').forEach(function (g) {
            var hasActive = !!g.querySelector('.nav-sub-item.active');
            if (hasActive) g.classList.add('open');
        });
    }

    function showSpinner() {
        view.innerHTML = '<div style="display:flex;justify-content:center;padding:48px"><div class="spin"></div></div>';
    }

    function showError(msg) {
        view.innerHTML = '<div class="alert alert-error">' + e(msg) + '</div>';
    }

    async function navigate() {
        var hash  = currentRoute();
        var route = routes[hash];
        document.title = route.title + ' · Vigicom Cloud';
        topbarTitle.textContent = route.title;
        setActive(hash);
        sidebarEl.classList.remove('open');
        overlayEl.classList.remove('active');
        showSpinner();
        try {
            await route.render(view);
        } catch (err) {
            showError(err && err.message ? err.message : String(err));
        }
    }

    // -------- API ----------------------------------------------------------

    async function api(path, opts) {
        opts = opts || {};
        var headers = {
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        };
        Object.keys(opts.headers || {}).forEach(function (k) { headers[k] = opts.headers[k]; });

        var body = opts.body;
        if (body && typeof body === 'object' && !(body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
            body = JSON.stringify(body);
        }

        var res = await fetch(path, {
            method:      opts.method || 'GET',
            headers:     headers,
            body:        body,
            credentials: 'same-origin'
        });

        if (res.status === 401) {
            window.location.href = '/login.php';
            throw new Error('No autenticado.');
        }

        var json;
        try { json = await res.json(); }
        catch (e) { throw new Error('Respuesta inválida del servidor.'); }
        if (!json.ok) {
            throw new Error(json.error || 'Error desconocido.');
        }
        return json.data;
    }

    // -------- Helpers ------------------------------------------------------

    function e(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (ch) {
            return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[ch];
        });
    }

    function timeAgo(iso) {
        if (!iso) return 'sin datos';
        var diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
        if (isNaN(diff)) return 'sin datos';
        if (diff < 60)    return 'hace ' + diff + 's';
        if (diff < 3600)  return 'hace ' + Math.floor(diff / 60) + ' min';
        if (diff < 86400) return 'hace ' + Math.floor(diff / 3600) + ' h';
        return 'hace ' + Math.floor(diff / 86400) + ' d';
    }

    var toastTimer = null;
    function toast(msg, isError) {
        toastEl.textContent = msg;
        toastEl.classList.toggle('error', !!isError);
        toastEl.classList.add('show');
        if (toastTimer) clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 2800);
    }

    // -------- Vista: placeholder ------------------------------------------

    async function renderTodo(view) {
        view.innerHTML =
            '<div class="page-header"><div>' +
                '<h1>' + e(topbarTitle.textContent) + '</h1>' +
                '<p>Esta sección todavía no está implementada en la SPA.</p>' +
            '</div></div>' +
            '<div class="alert alert-info">Pronto se sumará el endpoint correspondiente en <code>/api/</code> y la vista en <code>app.js</code>.</div>';
    }

    // -------- Vista: Dashboard --------------------------------------------

    async function renderDashboard(view) {
        var d = await api('/api/dashboard.php');
        var k = d.kpis || {};
        var alarmas  = d.alarmas  || [];
        var disparos = d.disparos || [];
        var onlineSec = d.online_interval_seconds || 600;

        function badgeAlarma(latido) {
            if (!latido) return '<span class="badge badge-muted">Sin datos</span>';
            var online = (Date.now() - new Date(latido).getTime()) / 1000 <= onlineSec;
            return online
                ? '<span class="badge badge-success">Online</span>'
                : '<span class="badge badge-danger">Offline</span>';
        }
        function badgeDisparo(ev) {
            if (ev.cerrado == null && ev.estado == null && ev.resultado == null) {
                return '<span class="badge badge-warn">Pendiente</span>';
            }
            var txt = (ev.resultado != null && ev.resultado !== '')
                ? ev.resultado
                : ((ev.estado != null && ev.estado !== '') ? ev.estado : 'Pendiente');
            return '<span class="badge badge-info">' + e(txt) + '</span>';
        }

        var saludo = (ME.nombre || 'Usuario').split(' ')[0];

        view.innerHTML =
            '<div class="page-header"><div>' +
                '<h1>Buen día, ' + e(saludo) + '</h1>' +
                '<p>Resumen de actividad de la plataforma de alarmas comunitarias.</p>' +
            '</div></div>' +

            '<div class="stats-bar">' +
                statCard('Comunidades',      k.comunidades || 0,                  'orange', 'Total registradas') +
                statCard('Alarmas online',   (k.alarmas_online || 0) + ' <span class="text-muted" style="font-size:.9rem;font-weight:500;">/ ' + (k.alarmas_total || 0) + '</span>', 'green', 'Latido en los últimos 10 min') +
                statCard('Disparos abiertos',k.disparos_abiertos || 0,            'red',    'Sin cierre registrado') +
                statCard('Disparos 24 hs',   k.disparos_24h || 0,                 'orange', 'Total registrados hoy') +
            '</div>' +

            '<div class="dash-grid">' +
                '<div class="table-card">' +
                    '<div class="dash-table-header">' +
                        '<div><div>Alarmas recientes</div>' +
                        '<div class="text-muted text-sm" style="font-weight:400;">Actividad de la flota</div></div>' +
                    '</div>' +
                    '<table><thead><tr>' +
                        '<th>Alarma</th><th>Comunidad</th><th>Estado</th><th>Último latido</th>' +
                    '</tr></thead><tbody>' +
                    (alarmas.length === 0
                        ? '<tr><td colspan="4" class="table-empty">Sin alarmas cargadas.</td></tr>'
                        : alarmas.map(function (a) {
                            return '<tr>' +
                                '<td><div class="td-nombre">' + e(a.nombre || '—') + '</div>' +
                                '<div class="td-id">' + e(a.domicilio || '') + '</div></td>' +
                                '<td>' + e(a.comunidad || '—') + '</td>' +
                                '<td>' + badgeAlarma(a.latido) + '</td>' +
                                '<td class="text-muted">' + e(timeAgo(a.latido)) + '</td>' +
                            '</tr>';
                        }).join('')) +
                    '</tbody></table>' +
                '</div>' +

                '<div class="table-card">' +
                    '<div class="dash-table-header">' +
                        '<div><div>Últimos disparos</div>' +
                        '<div class="text-muted text-sm" style="font-weight:400;">Eventos de alarma del sistema</div></div>' +
                    '</div>' +
                    '<table><thead><tr>' +
                        '<th>Evento</th><th>Comunidad</th><th>Estado</th><th>Cuándo</th>' +
                    '</tr></thead><tbody>' +
                    (disparos.length === 0
                        ? '<tr><td colspan="4" class="table-empty">Sin disparos registrados.</td></tr>'
                        : disparos.map(function (ev) {
                            return '<tr>' +
                                '<td><div class="td-nombre">' + e(ev.modo || 'Disparo') + '</div>' +
                                (ev.comentario ? '<div class="td-id">' + e(ev.comentario) + '</div>' : '') +
                                '</td>' +
                                '<td>' + e(ev.comunidad || '—') + '</td>' +
                                '<td>' + badgeDisparo(ev) + '</td>' +
                                '<td class="text-muted">' + e(timeAgo(ev.fecha)) + '</td>' +
                            '</tr>';
                        }).join('')) +
                    '</tbody></table>' +
                '</div>' +
            '</div>';
    }

    function statCard(label, value, color, hint) {
        return '<div class="stat-card">' +
                    '<span class="stat-label">' + e(label) + '</span>' +
                    '<span class="stat-value ' + color + '">' + value + '</span>' +
                    '<span class="text-muted text-sm">' + e(hint) + '</span>' +
                '</div>';
    }

    // -------- Vista: Usuarios ---------------------------------------------

    var usuariosFiltros = {
        sort:      'id',
        dir:       'desc',
        limit:     100,
        comunidad: '',
        roles:     '',
        estado:    ''
    };

    function usuariosQueryString() {
        var qs = [];
        Object.keys(usuariosFiltros).forEach(function (k) {
            var v = usuariosFiltros[k];
            if (v !== '' && v != null) {
                qs.push(encodeURIComponent(k) + '=' + encodeURIComponent(v));
            }
        });
        return qs.length ? ('?' + qs.join('&')) : '';
    }

    async function renderUsuarios(view) {
        var data        = await api('/api/usuarios.php' + usuariosQueryString());
        var usuarios    = data.usuarios    || [];
        var kpis        = data.kpis        || {};
        var comunidades = data.comunidades || [];

        var filtrosActivos = (usuariosFiltros.comunidad !== '' ? 1 : 0) +
                             (usuariosFiltros.roles     !== '' ? 1 : 0) +
                             (usuariosFiltros.estado    !== '' ? 1 : 0);
        var badgeFiltros = filtrosActivos
            ? ' <span class="badge badge-info" style="margin-left:6px;">' + filtrosActivos + '</span>'
            : '';

        view.innerHTML =
            '<div class="page-header"><div>' +
                '<h1>Usuarios</h1>' +
                '<p>Cuentas con acceso al panel de Vigicom.</p>' +
            '</div></div>' +

            '<div class="stats-bar">' +
                statCard('Total',     kpis.total     || 0, 'orange', 'Usuarios registrados') +
                statCard('Activos',   kpis.activos   || 0, 'green',  'Pueden iniciar sesión') +
                statCard('Inactivos', kpis.inactivos || 0, 'red',    'Sin acceso') +
            '</div>' +

            '<div class="toolbar">' +
                '<div class="toolbar-left">' +
                    '<div class="search-wrap">' +
                        '<input type="search" id="usrSearch" class="search-input" placeholder="Buscar nombre, correo, DNI...">' +
                        '<button class="search-clear" id="usrSearchClear" type="button" style="display:none;">&times;</button>' +
                    '</div>' +
                    '<button class="btn btn-secondary" id="usrFiltros" type="button">' +
                        '<i class="fa-solid fa-filter"></i> Filtros' + badgeFiltros +
                    '</button>' +
                '</div>' +
                '<div class="toolbar-right">' +
                    '<button class="btn btn-primary" id="usrNuevo" type="button">+ Nuevo usuario</button>' +
                '</div>' +
            '</div>' +

            '<div class="table-card">' +
                '<table><thead><tr>' +
                    '<th>Usuario</th><th>Contacto</th><th>Comunidad</th><th>Rol</th><th>Estado</th>' +
                    '<th style="text-align:right;">Acciones</th>' +
                '</tr></thead><tbody id="usrTbody">' +
                renderFilasUsuarios(usuarios) +
                '</tbody></table>' +
                '<div class="table-empty" id="usrEmpty" style="display:none;">No hay usuarios que coincidan con la búsqueda.</div>' +
            '</div>' +
            '<div class="text-muted text-sm" style="margin-top:10px;">' +
                'Mostrando ' + usuarios.length + ' resultado(s) (límite ' + usuariosFiltros.limit + ').' +
            '</div>' +

            modalUsuarioHtml(comunidades) +
            modalFiltrosHtml(comunidades) +
            confirmDeleteHtml();

        wireUsuariosView(usuarios);
    }

    function renderFilasUsuarios(usuarios) {
        if (!usuarios.length) {
            return '<tr><td colspan="6" class="table-empty">No hay usuarios cargados.</td></tr>';
        }
        return usuarios.map(function (u) {
            var estado = parseInt(u.estado, 10) === 1 ? 1 : 0;
            var busq   = String((u.nombre || '') + ' ' + (u.correo || '') + ' ' + (u.dni || '') + ' ' + (u.telefono || '')).toLowerCase().trim();
            return '<tr data-id="' + u.id + '" data-estado="' + estado + '" data-search="' + e(busq) + '">' +
                '<td>' +
                    '<div class="td-nombre">' + e(u.nombre || '—') + '</div>' +
                    '<div class="td-id">#' + u.id +
                        (u.dni ? ' · DNI ' + e(u.dni) : '') +
                    '</div>' +
                '</td>' +
                '<td>' +
                    '<div>' + e(u.correo || '—') + '</div>' +
                    (u.telefono ? '<div class="td-id">' + e(u.telefono) + '</div>' : '') +
                '</td>' +
                '<td>' + e(u.comunidad_nombre || '—') + '</td>' +
                '<td>' + e(u.roles || '—') + '</td>' +
                '<td>' +
                    (estado === 1
                        ? '<span class="badge badge-success">Activo</span>'
                        : '<span class="badge badge-danger">Inactivo</span>') +
                '</td>' +
                '<td>' +
                    '<div class="actions" style="justify-content:flex-end;">' +
                        '<button class="btn-icon-sm" data-act="edit"   type="button" title="Editar"><i class="fa-solid fa-pencil"></i></button>' +
                        '<button class="btn-icon-sm" data-act="delete" type="button" title="Eliminar"><i class="fa-solid fa-trash"></i></button>' +
                    '</div>' +
                '</td>' +
            '</tr>';
        }).join('');
    }

    function modalUsuarioHtml(comunidades) {
        var opts = comunidades.map(function (c) {
            return '<option value="' + c.id + '">' + e(c.nombre) + '</option>';
        }).join('');

        return '<div class="modal-backdrop" id="usrModal"><div class="modal">' +
            '<div class="modal-header">' +
                '<div class="modal-title">' +
                    '<span id="usrModalTitulo">Nuevo usuario</span>' +
                    '<span class="modal-subtitle" id="usrModalSub"></span>' +
                '</div>' +
                '<button class="btn-icon-sm" data-act="close" type="button" aria-label="Cerrar">&times;</button>' +
            '</div>' +
            '<form id="usrForm" novalidate>' +
                '<input type="hidden" id="usrId" value="">' +
                '<div class="modal-body">' +
                    '<div class="alert alert-error" id="usrError" style="display:none;"></div>' +
                    '<div class="form-row">' +
                        '<div class="form-group"><label for="usr-nombre">Nombre</label>' +
                            '<input id="usr-nombre" name="nombre" type="text" maxlength="255" required></div>' +
                        '<div class="form-group"><label for="usr-correo">Correo</label>' +
                            '<input id="usr-correo" name="correo" type="email" maxlength="100" required></div>' +
                    '</div>' +
                    '<div class="form-row">' +
                        '<div class="form-group"><label for="usr-telefono">Teléfono</label>' +
                            '<input id="usr-telefono" name="telefono" type="tel" maxlength="10"></div>' +
                        '<div class="form-group"><label for="usr-dni">DNI</label>' +
                            '<input id="usr-dni" name="dni" type="text" maxlength="50"></div>' +
                    '</div>' +
                    '<div class="form-row">' +
                        '<div class="form-group"><label for="usr-comunidad">Comunidad</label>' +
                            '<select id="usr-comunidad" name="comunidad"><option value="">—</option>' + opts + '</select></div>' +
                        '<div class="form-group"><label for="usr-roles">Rol</label>' +
                            '<select id="usr-roles" name="roles">' +
                                '<option value="">—</option>' +
                                '<option value="admin">admin</option>' +
                                '<option value="operador">operador</option>' +
                                '<option value="vecino">vecino</option>' +
                            '</select></div>' +
                    '</div>' +
                    '<div class="form-row">' +
                        '<div class="form-group"><label for="usr-contrasena">Contraseña</label>' +
                            '<input id="usr-contrasena" name="contrasena" type="text" maxlength="16" autocomplete="new-password">' +
                            '<div class="text-muted text-sm" id="usrHintPass">Máximo 16 caracteres.</div></div>' +
                        '<div class="form-group"><label>Estado</label>' +
                            '<label class="toggle-switch" style="margin-top:6px;">' +
                                '<input id="usr-estado" name="estado" type="checkbox" value="1" checked>' +
                                '<span class="toggle-track"><span class="toggle-thumb"></span></span>' +
                                '<span class="toggle-label" id="usrEstadoLabel">Activo</span>' +
                            '</label></div>' +
                    '</div>' +
                '</div>' +
                '<div class="modal-footer">' +
                    '<button type="button" class="btn btn-ghost" data-act="close">Cancelar</button>' +
                    '<button type="submit" class="btn btn-primary" id="usrGuardar">Guardar</button>' +
                '</div>' +
            '</form>' +
        '</div></div>';
    }

    function modalFiltrosHtml(comunidades) {
        var optsCom = comunidades.map(function (c) {
            var sel = String(usuariosFiltros.comunidad) === String(c.id) ? ' selected' : '';
            return '<option value="' + c.id + '"' + sel + '>' + e(c.nombre) + '</option>';
        }).join('');
        function selOpt(value, label, current) {
            var sel = String(current) === String(value) ? ' selected' : '';
            return '<option value="' + e(value) + '"' + sel + '>' + e(label) + '</option>';
        }

        return '<div class="modal-backdrop" id="usrFiltrosModal"><div class="modal">' +
            '<div class="modal-header">' +
                '<div class="modal-title"><span>Filtros</span></div>' +
                '<button class="btn-icon-sm" data-act="close" type="button" aria-label="Cerrar">&times;</button>' +
            '</div>' +
            '<form id="usrFiltrosForm" novalidate>' +
                '<div class="modal-body">' +
                    '<div class="form-row">' +
                        '<div class="form-group"><label for="flt-comunidad">Comunidad</label>' +
                            '<select id="flt-comunidad"><option value="">Todas</option>' + optsCom + '</select></div>' +
                        '<div class="form-group"><label for="flt-roles">Rol</label>' +
                            '<select id="flt-roles">' +
                                selOpt('',         'Todos',    usuariosFiltros.roles) +
                                selOpt('admin',    'admin',    usuariosFiltros.roles) +
                                selOpt('operador', 'operador', usuariosFiltros.roles) +
                                selOpt('vecino',   'vecino',   usuariosFiltros.roles) +
                            '</select></div>' +
                    '</div>' +
                    '<div class="form-row">' +
                        '<div class="form-group"><label for="flt-estado">Estado</label>' +
                            '<select id="flt-estado">' +
                                selOpt('',  'Todos',     usuariosFiltros.estado) +
                                selOpt('1', 'Activos',   usuariosFiltros.estado) +
                                selOpt('0', 'Inactivos', usuariosFiltros.estado) +
                            '</select></div>' +
                        '<div class="form-group"><label for="flt-limit">Límite de resultados</label>' +
                            '<select id="flt-limit">' +
                                selOpt('50',   '50',   usuariosFiltros.limit) +
                                selOpt('100',  '100',  usuariosFiltros.limit) +
                                selOpt('200',  '200',  usuariosFiltros.limit) +
                                selOpt('500',  '500',  usuariosFiltros.limit) +
                                selOpt('1000', '1000', usuariosFiltros.limit) +
                            '</select></div>' +
                    '</div>' +
                    '<div class="form-row">' +
                        '<div class="form-group"><label for="flt-sort">Ordenar por</label>' +
                            '<select id="flt-sort">' +
                                selOpt('id',         'ID',                usuariosFiltros.sort) +
                                selOpt('nombre',     'Nombre',            usuariosFiltros.sort) +
                                selOpt('correo',     'Correo',            usuariosFiltros.sort) +
                                selOpt('registrado', 'Fecha de registro', usuariosFiltros.sort) +
                                selOpt('estado',     'Estado',            usuariosFiltros.sort) +
                            '</select></div>' +
                        '<div class="form-group"><label for="flt-dir">Dirección</label>' +
                            '<select id="flt-dir">' +
                                selOpt('desc', 'Descendente', usuariosFiltros.dir) +
                                selOpt('asc',  'Ascendente',  usuariosFiltros.dir) +
                            '</select></div>' +
                    '</div>' +
                '</div>' +
                '<div class="modal-footer">' +
                    '<button type="button" class="btn btn-ghost"     id="usrFiltrosReset" >Limpiar</button>' +
                    '<button type="button" class="btn btn-secondary" data-act="close"    >Cancelar</button>' +
                    '<button type="submit"  class="btn btn-primary"                       >Aplicar</button>' +
                '</div>' +
            '</form>' +
        '</div></div>';
    }

    function confirmDeleteHtml() {
        return '<div class="confirm-backdrop" id="usrConfirm"><div class="confirm-box">' +
            '<div class="confirm-title">Eliminar usuario</div>' +
            '<div class="confirm-msg" id="usrConfirmMsg">Esta acción no se puede deshacer.</div>' +
            '<div class="confirm-actions">' +
                '<button class="btn btn-ghost"  data-act="cancel" type="button">Cancelar</button>' +
                '<button class="btn btn-danger" id="usrConfirmBtn" type="button">Eliminar</button>' +
            '</div>' +
        '</div></div>';
    }

    function wireUsuariosView(/* usuarios */) {
        var tbody       = document.getElementById('usrTbody');
        var emptyState  = document.getElementById('usrEmpty');
        var searchInput = document.getElementById('usrSearch');
        var searchClear = document.getElementById('usrSearchClear');

        var modal       = document.getElementById('usrModal');
        var modalTitulo = document.getElementById('usrModalTitulo');
        var modalSub    = document.getElementById('usrModalSub');
        var modalError  = document.getElementById('usrError');
        var form        = document.getElementById('usrForm');
        var fId         = document.getElementById('usrId');
        var fEstado     = document.getElementById('usr-estado');
        var estadoLabel = document.getElementById('usrEstadoLabel');
        var hintPass    = document.getElementById('usrHintPass');
        var btnGuardar  = document.getElementById('usrGuardar');

        var confirmBox  = document.getElementById('usrConfirm');
        var confirmMsg  = document.getElementById('usrConfirmMsg');
        var btnDelete   = document.getElementById('usrConfirmBtn');

        var filtrosModal = document.getElementById('usrFiltrosModal');
        var filtrosForm  = document.getElementById('usrFiltrosForm');

        var pendingDeleteId = null;
        var modoEdicion     = false;

        function applyFilters() {
            var q = searchInput.value.trim().toLowerCase();
            var visibles = 0;
            tbody.querySelectorAll('tr[data-id]').forEach(function (tr) {
                var haystack = tr.dataset.search || '';
                var show = !q || haystack.indexOf(q) !== -1;
                tr.style.display = show ? '' : 'none';
                if (show) visibles++;
            });
            emptyState.style.display = (visibles === 0 && tbody.querySelector('tr[data-id]')) ? '' : 'none';
            searchClear.style.display = q ? '' : 'none';
        }

        searchInput.addEventListener('input', applyFilters);
        searchClear.addEventListener('click', function () {
            searchInput.value = '';
            applyFilters();
            searchInput.focus();
        });

        document.getElementById('usrFiltros').addEventListener('click', function () {
            filtrosModal.classList.add('open');
        });
        filtrosModal.addEventListener('click', function (ev) {
            if (ev.target === filtrosModal || ev.target.closest('[data-act="close"]')) {
                filtrosModal.classList.remove('open');
            }
        });
        document.getElementById('usrFiltrosReset').addEventListener('click', function () {
            usuariosFiltros.sort      = 'id';
            usuariosFiltros.dir       = 'desc';
            usuariosFiltros.limit     = 100;
            usuariosFiltros.comunidad = '';
            usuariosFiltros.roles     = '';
            usuariosFiltros.estado    = '';
            filtrosModal.classList.remove('open');
            navigate();
        });
        filtrosForm.addEventListener('submit', function (ev) {
            ev.preventDefault();
            usuariosFiltros.comunidad = document.getElementById('flt-comunidad').value;
            usuariosFiltros.roles     = document.getElementById('flt-roles').value;
            usuariosFiltros.estado    = document.getElementById('flt-estado').value;
            usuariosFiltros.limit     = parseInt(document.getElementById('flt-limit').value, 10) || 100;
            usuariosFiltros.sort      = document.getElementById('flt-sort').value || 'id';
            usuariosFiltros.dir       = document.getElementById('flt-dir').value  || 'desc';
            filtrosModal.classList.remove('open');
            navigate();
        });

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
        function openModal()  { modal.classList.add('open'); }
        function closeModal() {
            modal.classList.remove('open');
            modalError.style.display = 'none';
            modalError.textContent = '';
        }
        function showFormError(msg) {
            modalError.textContent = msg;
            modalError.style.display = '';
        }

        modal.addEventListener('click', function (ev) {
            if (ev.target === modal || ev.target.closest('[data-act="close"]')) closeModal();
        });

        document.getElementById('usrNuevo').addEventListener('click', function () {
            modoEdicion = false;
            resetForm();
            modalTitulo.textContent = 'Nuevo usuario';
            modalSub.textContent    = '';
            hintPass.textContent    = 'Máximo 16 caracteres. Obligatoria.';
            document.getElementById('usr-contrasena').setAttribute('required', 'required');
            openModal();
            document.getElementById('usr-nombre').focus();
        });

        tbody.addEventListener('click', async function (ev) {
            var btn = ev.target.closest('button[data-act]');
            if (!btn) return;
            var tr = btn.closest('tr[data-id]');
            if (!tr) return;
            var id = parseInt(tr.dataset.id, 10);

            if (btn.dataset.act === 'edit') {
                try {
                    var u = await api('/api/usuarios.php?id=' + id);
                    modoEdicion = true;
                    resetForm();
                    fId.value = u.id;
                    modalTitulo.textContent = 'Editar usuario';
                    modalSub.textContent    = '#' + u.id;
                    document.getElementById('usr-nombre').value    = u.nombre   || '';
                    document.getElementById('usr-correo').value    = u.correo   || '';
                    document.getElementById('usr-telefono').value  = u.telefono || '';
                    document.getElementById('usr-dni').value       = u.dni      || '';
                    document.getElementById('usr-comunidad').value = u.comunidad != null ? u.comunidad : '';
                    document.getElementById('usr-roles').value     = u.roles    || '';
                    fEstado.checked = parseInt(u.estado, 10) === 1;
                    setEstadoLabel();
                    hintPass.textContent = 'Dejar vacío para no cambiarla. Máximo 16 caracteres.';
                    document.getElementById('usr-contrasena').removeAttribute('required');
                    openModal();
                    document.getElementById('usr-nombre').focus();
                } catch (err) {
                    toast(err.message, true);
                }
                return;
            }

            if (btn.dataset.act === 'delete') {
                if (id === parseInt(ME.id, 10)) {
                    toast('No podés eliminar tu propio usuario.', true);
                    return;
                }
                var nombre = (tr.querySelector('.td-nombre') || {}).textContent || ('#' + id);
                confirmMsg.textContent = '¿Eliminar al usuario "' + nombre.trim() + '"? Esta acción no se puede deshacer.';
                pendingDeleteId = id;
                confirmBox.classList.add('open');
            }
        });

        confirmBox.addEventListener('click', function (ev) {
            if (ev.target === confirmBox || ev.target.closest('[data-act="cancel"]')) {
                confirmBox.classList.remove('open');
                pendingDeleteId = null;
            }
        });

        btnDelete.addEventListener('click', async function () {
            if (!pendingDeleteId) return;
            btnDelete.disabled = true;
            try {
                await api('/api/usuarios.php?id=' + pendingDeleteId, { method: 'DELETE' });
                toast('Usuario eliminado.');
                navigate();
            } catch (err) {
                toast(err.message, true);
            } finally {
                btnDelete.disabled = false;
                confirmBox.classList.remove('open');
                pendingDeleteId = null;
            }
        });

        form.addEventListener('submit', async function (ev) {
            ev.preventDefault();
            modalError.style.display = 'none';

            var payload = {
                nombre:     document.getElementById('usr-nombre').value.trim(),
                correo:     document.getElementById('usr-correo').value.trim(),
                telefono:   document.getElementById('usr-telefono').value.trim(),
                dni:        document.getElementById('usr-dni').value.trim(),
                comunidad:  document.getElementById('usr-comunidad').value || null,
                roles:      document.getElementById('usr-roles').value || null,
                estado:     fEstado.checked ? 1 : 0,
                contrasena: document.getElementById('usr-contrasena').value
            };

            btnGuardar.disabled = true;
            try {
                if (modoEdicion) {
                    await api('/api/usuarios.php?id=' + encodeURIComponent(fId.value), {
                        method: 'PUT',
                        body:   payload
                    });
                    toast('Usuario actualizado.');
                } else {
                    await api('/api/usuarios.php', {
                        method: 'POST',
                        body:   payload
                    });
                    toast('Usuario creado.');
                }
                closeModal();
                navigate();
            } catch (err) {
                showFormError(err.message);
            } finally {
                btnGuardar.disabled = false;
            }
        });

        applyFilters();
    }

    // -------- Vista: Roles ------------------------------------------------

    async function renderRoles(view) {
        var data  = await api('/api/roles.php');
        var roles = data.roles || [];
        var kpis  = data.kpis  || {};

        view.innerHTML =
            '<div class="page-header"><div>' +
                '<h1>Roles</h1>' +
                '<p>Perfiles de permisos disponibles para los usuarios del panel.</p>' +
            '</div></div>' +

            '<div class="stats-bar">' +
                statCard('Total',         kpis.total   || 0, 'orange', 'Roles registrados') +
                statCard('De sistema',    kpis.sistema || 0, 'red',    'No se pueden eliminar') +
                statCard('Personalizados',kpis.custom  || 0, 'green',  'Definidos por el usuario') +
            '</div>' +

            '<div class="toolbar">' +
                '<div class="toolbar-left">' +
                    '<div class="search-wrap">' +
                        '<input type="search" id="rolSearch" class="search-input" placeholder="Buscar nombre o descripción...">' +
                        '<button class="search-clear" id="rolSearchClear" type="button" style="display:none;">&times;</button>' +
                    '</div>' +
                '</div>' +
                '<div class="toolbar-right">' +
                    '<button class="btn btn-primary" id="rolNuevo" type="button">+ Nuevo rol</button>' +
                '</div>' +
            '</div>' +

            '<div class="table-card">' +
                '<table><thead><tr>' +
                    '<th>Rol</th><th>Descripción</th><th>Tipo</th>' +
                    '<th style="text-align:right;">Acciones</th>' +
                '</tr></thead><tbody id="rolTbody">' +
                renderFilasRoles(roles) +
                '</tbody></table>' +
                '<div class="table-empty" id="rolEmpty" style="display:none;">No hay roles que coincidan con la búsqueda.</div>' +
            '</div>' +
            '<div class="text-muted text-sm" style="margin-top:10px;">' +
                'Mostrando ' + roles.length + ' resultado(s).' +
            '</div>' +

            modalRolHtml() +
            confirmDeleteRolHtml();

        wireRolesView();
    }

    function renderFilasRoles(roles) {
        if (!roles.length) {
            return '<tr><td colspan="4" class="table-empty">No hay roles cargados.</td></tr>';
        }
        return roles.map(function (r) {
            var esSistema = String(r.sistema || '') === '1';
            var busq      = String((r.nombre || '') + ' ' + (r.descripcion || '')).toLowerCase().trim();
            return '<tr data-id="' + r.id + '" data-sistema="' + (esSistema ? 1 : 0) + '" data-search="' + e(busq) + '">' +
                '<td>' +
                    '<div class="td-nombre">' + e(r.nombre || '—') + '</div>' +
                    '<div class="td-id">#' + r.id + '</div>' +
                '</td>' +
                '<td>' + e(r.descripcion || '—') + '</td>' +
                '<td>' +
                    (esSistema
                        ? '<span class="badge badge-danger">Sistema</span>'
                        : '<span class="badge badge-success">Personalizado</span>') +
                '</td>' +
                '<td>' +
                    '<div class="actions" style="justify-content:flex-end;">' +
                        '<button class="btn-icon-sm" data-act="edit"   type="button" title="Editar"><i class="fa-solid fa-pencil"></i></button>' +
                        '<button class="btn-icon-sm" data-act="delete" type="button" title="Eliminar"' +
                            (esSistema ? ' disabled style="opacity:.4;cursor:not-allowed;"' : '') +
                            '><i class="fa-solid fa-trash"></i></button>' +
                    '</div>' +
                '</td>' +
            '</tr>';
        }).join('');
    }

    function modalRolHtml() {
        return '<div class="modal-backdrop" id="rolModal"><div class="modal">' +
            '<div class="modal-header">' +
                '<div class="modal-title">' +
                    '<span id="rolModalTitulo">Nuevo rol</span>' +
                    '<span class="modal-subtitle" id="rolModalSub"></span>' +
                '</div>' +
                '<button class="btn-icon-sm" data-act="close" type="button" aria-label="Cerrar">&times;</button>' +
            '</div>' +
            '<form id="rolForm" novalidate>' +
                '<input type="hidden" id="rolId" value="">' +
                '<div class="modal-body">' +
                    '<div class="alert alert-error" id="rolError" style="display:none;"></div>' +
                    '<div class="form-row">' +
                        '<div class="form-group"><label for="rol-nombre">Nombre</label>' +
                            '<input id="rol-nombre" name="nombre" type="text" maxlength="255" required></div>' +
                        '<div class="form-group"><label>Tipo</label>' +
                            '<label class="toggle-switch" style="margin-top:6px;">' +
                                '<input id="rol-sistema" name="sistema" type="checkbox" value="1">' +
                                '<span class="toggle-track"><span class="toggle-thumb"></span></span>' +
                                '<span class="toggle-label" id="rolSistemaLabel">Personalizado</span>' +
                            '</label></div>' +
                    '</div>' +
                    '<div class="form-row">' +
                        '<div class="form-group" style="flex:1 1 100%;"><label for="rol-descripcion">Descripción</label>' +
                            '<input id="rol-descripcion" name="descripcion" type="text" maxlength="255"></div>' +
                    '</div>' +
                    '<div class="form-row">' +
                        '<div class="form-group" style="flex:1 1 100%;"><label for="rol-permisos">Permisos</label>' +
                            '<textarea id="rol-permisos" name="permisos" rows="3"></textarea></div>' +
                    '</div>' +
                    '<div class="form-row">' +
                        '<div class="form-group"><label for="rol-menus">Menús</label>' +
                            '<textarea id="rol-menus" name="menus" rows="3"></textarea></div>' +
                        '<div class="form-group"><label for="rol-widgets">Widgets</label>' +
                            '<textarea id="rol-widgets" name="widgets" rows="3"></textarea></div>' +
                    '</div>' +
                '</div>' +
                '<div class="modal-footer">' +
                    '<button type="button" class="btn btn-ghost" data-act="close">Cancelar</button>' +
                    '<button type="submit" class="btn btn-primary" id="rolGuardar">Guardar</button>' +
                '</div>' +
            '</form>' +
        '</div></div>';
    }

    function confirmDeleteRolHtml() {
        return '<div class="confirm-backdrop" id="rolConfirm"><div class="confirm-box">' +
            '<div class="confirm-title">Eliminar rol</div>' +
            '<div class="confirm-msg" id="rolConfirmMsg">Esta acción no se puede deshacer.</div>' +
            '<div class="confirm-actions">' +
                '<button class="btn btn-ghost"  data-act="cancel" type="button">Cancelar</button>' +
                '<button class="btn btn-danger" id="rolConfirmBtn" type="button">Eliminar</button>' +
            '</div>' +
        '</div></div>';
    }

    function wireRolesView() {
        var tbody       = document.getElementById('rolTbody');
        var emptyState  = document.getElementById('rolEmpty');
        var searchInput = document.getElementById('rolSearch');
        var searchClear = document.getElementById('rolSearchClear');

        var modal        = document.getElementById('rolModal');
        var modalTitulo  = document.getElementById('rolModalTitulo');
        var modalSub     = document.getElementById('rolModalSub');
        var modalError   = document.getElementById('rolError');
        var form         = document.getElementById('rolForm');
        var fId          = document.getElementById('rolId');
        var fSistema     = document.getElementById('rol-sistema');
        var sistemaLabel = document.getElementById('rolSistemaLabel');
        var btnGuardar   = document.getElementById('rolGuardar');

        var confirmBox = document.getElementById('rolConfirm');
        var confirmMsg = document.getElementById('rolConfirmMsg');
        var btnDelete  = document.getElementById('rolConfirmBtn');

        var pendingDeleteId = null;
        var modoEdicion     = false;

        function applyFilters() {
            var q = searchInput.value.trim().toLowerCase();
            var visibles = 0;
            tbody.querySelectorAll('tr[data-id]').forEach(function (tr) {
                var haystack = tr.dataset.search || '';
                var show = !q || haystack.indexOf(q) !== -1;
                tr.style.display = show ? '' : 'none';
                if (show) visibles++;
            });
            emptyState.style.display = (visibles === 0 && tbody.querySelector('tr[data-id]')) ? '' : 'none';
            searchClear.style.display = q ? '' : 'none';
        }

        searchInput.addEventListener('input', applyFilters);
        searchClear.addEventListener('click', function () {
            searchInput.value = '';
            applyFilters();
            searchInput.focus();
        });

        function setSistemaLabel() {
            sistemaLabel.textContent = fSistema.checked ? 'Sistema' : 'Personalizado';
        }
        fSistema.addEventListener('change', setSistemaLabel);

        function resetForm() {
            form.reset();
            fId.value = '';
            fSistema.checked = false;
            setSistemaLabel();
        }
        function openModal()  { modal.classList.add('open'); }
        function closeModal() {
            modal.classList.remove('open');
            modalError.style.display = 'none';
            modalError.textContent = '';
        }
        function showFormError(msg) {
            modalError.textContent = msg;
            modalError.style.display = '';
        }

        modal.addEventListener('click', function (ev) {
            if (ev.target === modal || ev.target.closest('[data-act="close"]')) closeModal();
        });

        document.getElementById('rolNuevo').addEventListener('click', function () {
            modoEdicion = false;
            resetForm();
            modalTitulo.textContent = 'Nuevo rol';
            modalSub.textContent    = '';
            openModal();
            document.getElementById('rol-nombre').focus();
        });

        tbody.addEventListener('click', async function (ev) {
            var btn = ev.target.closest('button[data-act]');
            if (!btn || btn.disabled) return;
            var tr = btn.closest('tr[data-id]');
            if (!tr) return;
            var id = parseInt(tr.dataset.id, 10);

            if (btn.dataset.act === 'edit') {
                try {
                    var r = await api('/api/roles.php?id=' + id);
                    modoEdicion = true;
                    resetForm();
                    fId.value = r.id;
                    modalTitulo.textContent = 'Editar rol';
                    modalSub.textContent    = '#' + r.id;
                    document.getElementById('rol-nombre').value      = r.nombre      || '';
                    document.getElementById('rol-descripcion').value = r.descripcion || '';
                    document.getElementById('rol-permisos').value    = r.permisos    || '';
                    document.getElementById('rol-menus').value       = r.menus       || '';
                    document.getElementById('rol-widgets').value     = r.widgets     || '';
                    fSistema.checked = String(r.sistema || '') === '1';
                    setSistemaLabel();
                    openModal();
                    document.getElementById('rol-nombre').focus();
                } catch (err) {
                    toast(err.message, true);
                }
                return;
            }

            if (btn.dataset.act === 'delete') {
                if (parseInt(tr.dataset.sistema, 10) === 1) {
                    toast('No se puede eliminar un rol de sistema.', true);
                    return;
                }
                var nombre = (tr.querySelector('.td-nombre') || {}).textContent || ('#' + id);
                confirmMsg.textContent = '¿Eliminar el rol "' + nombre.trim() + '"? Esta acción no se puede deshacer.';
                pendingDeleteId = id;
                confirmBox.classList.add('open');
            }
        });

        confirmBox.addEventListener('click', function (ev) {
            if (ev.target === confirmBox || ev.target.closest('[data-act="cancel"]')) {
                confirmBox.classList.remove('open');
                pendingDeleteId = null;
            }
        });

        btnDelete.addEventListener('click', async function () {
            if (!pendingDeleteId) return;
            btnDelete.disabled = true;
            try {
                await api('/api/roles.php?id=' + pendingDeleteId, { method: 'DELETE' });
                toast('Rol eliminado.');
                navigate();
            } catch (err) {
                toast(err.message, true);
            } finally {
                btnDelete.disabled = false;
                confirmBox.classList.remove('open');
                pendingDeleteId = null;
            }
        });

        form.addEventListener('submit', async function (ev) {
            ev.preventDefault();
            modalError.style.display = 'none';

            var payload = {
                nombre:      document.getElementById('rol-nombre').value.trim(),
                descripcion: document.getElementById('rol-descripcion').value.trim(),
                permisos:    document.getElementById('rol-permisos').value,
                menus:       document.getElementById('rol-menus').value,
                widgets:     document.getElementById('rol-widgets').value,
                sistema:     fSistema.checked ? 1 : 0
            };

            btnGuardar.disabled = true;
            try {
                if (modoEdicion) {
                    await api('/api/roles.php?id=' + encodeURIComponent(fId.value), {
                        method: 'PUT',
                        body:   payload
                    });
                    toast('Rol actualizado.');
                } else {
                    await api('/api/roles.php', {
                        method: 'POST',
                        body:   payload
                    });
                    toast('Rol creado.');
                }
                closeModal();
                navigate();
            } catch (err) {
                showFormError(err.message);
            } finally {
                btnGuardar.disabled = false;
            }
        });

        applyFilters();
    }

    // -------- Chrome de la app --------------------------------------------

    sidebarNav.querySelectorAll('.nav-group-toggle').forEach(function (btn) {
        btn.addEventListener('click', function () {
            btn.closest('.nav-group-wrap').classList.toggle('open');
        });
    });

    if (hamburgerEl && sidebarEl && overlayEl) {
        hamburgerEl.addEventListener('click', function () {
            sidebarEl.classList.toggle('open');
            overlayEl.classList.toggle('active');
        });
        overlayEl.addEventListener('click', function () {
            sidebarEl.classList.remove('open');
            overlayEl.classList.remove('active');
        });
    }

    if (userToggle && userDropdown) {
        userToggle.addEventListener('click', function (ev) {
            ev.stopPropagation();
            userDropdown.classList.toggle('open');
        });
        document.addEventListener('click', function (ev) {
            if (!userDropdown.contains(ev.target) && ev.target !== userToggle) {
                userDropdown.classList.remove('open');
            }
        });
        document.addEventListener('keydown', function (ev) {
            if (ev.key === 'Escape') {
                userDropdown.classList.remove('open');
                var openModal   = document.querySelector('.modal-backdrop.open');
                var openConfirm = document.querySelector('.confirm-backdrop.open');
                if (openModal)   openModal.classList.remove('open');
                if (openConfirm) openConfirm.classList.remove('open');
            }
        });
    }

    window.addEventListener('hashchange', navigate);
    if (!location.hash) {
        location.hash = '#/dashboard';
    } else {
        navigate();
    }
})();
