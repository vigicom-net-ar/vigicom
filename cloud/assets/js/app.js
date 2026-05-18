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
        '/comunidades':  { title: 'Comunidades',   render: renderComunidades },
        '/casas':        { title: 'Casas',         render: renderCasas },
        '/alarmas':      { title: 'Alarmas',       render: renderAlarmas },
        '/equipos':      { title: 'Equipos',       render: renderEquipos },
        '/dispositivos': { title: 'Dispositivos',  render: renderTodo },
        '/eventos':      { title: 'Eventos',       render: renderTodo },
        '/senales':      { title: 'Señales',       render: renderSenales },
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

    // -------- Helpers ABM (modal Consultar) -------------------------------
    // Render de pares label/valor para vistas de consulta (DESIGN.md §22).
    // Compartidos entre todos los modulos ABM (usuarios, comunidades, casas,
    // alarmas, equipos).

    function abmRow(label, value, muted, full) {
        var rowCls = 'data-row' + (full ? ' data-row-full' : '');
        var valCls = 'data-value' + (muted ? ' muted' : '');
        return '<div class="' + rowCls + '">' +
            '<dt class="data-label">' + e(label) + '</dt>' +
            '<dd class="' + valCls + '">' + value + '</dd>' +
        '</div>';
    }
    function abmFecha(v) {
        if (!v) return null;
        return String(v).replace('T', ' ').replace(/\.\d+$/, '');
    }
    function abmSiNo(v) {
        if (v == null || v === '') return null;
        var s = String(v).toUpperCase();
        return (s === '1' || s === 'S' || s === 'SI' || s === 'SÍ' || s === 'Y' || s === 'TRUE') ? 'Sí' : 'No';
    }
    function abmRowTxt(label, v, vacio, full) {
        var muted = v == null || v === '';
        return abmRow(label, e(muted ? (vacio || '—') : v), muted, full);
    }
    function abmRowRef(label, id, nombre, vacio, full) {
        if (id == null || id === '') return abmRow(label, e(vacio || '—'), true, full);
        var txt = nombre ? (nombre + ' (#' + id + ')') : ('#' + id);
        return abmRow(label, e(txt), false, full);
    }
    function abmRowSiNo(label, v, full) {
        var t = abmSiNo(v);
        return abmRow(label, e(t || 'No definido'), t == null, full);
    }
    function abmRowNum(label, v, vacio, full) {
        var muted = v == null || v === '';
        return abmRow(label, e(muted ? (vacio || '—') : String(v)), muted, full);
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
        filtro_id: '',
        nombre:    '',
        correo:    '',
        telefono:  '',
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

        var filtrosActivos = (usuariosFiltros.filtro_id !== '' ? 1 : 0) +
                             (usuariosFiltros.nombre    !== '' ? 1 : 0) +
                             (usuariosFiltros.correo    !== '' ? 1 : 0) +
                             (usuariosFiltros.telefono  !== '' ? 1 : 0) +
                             (usuariosFiltros.comunidad !== '' ? 1 : 0) +
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
                    '<th>Código</th><th>Nombre</th><th>Contacto</th><th>Comunidad</th><th>Rol</th><th>Estado</th>' +
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
            modalConsultarUsuarioHtml() +
            modalFiltrosHtml(comunidades) +
            confirmDeleteHtml();

        wireUsuariosView();
    }

    function renderFilasUsuarios(usuarios) {
        if (!usuarios.length) {
            return '<tr><td colspan="7" class="table-empty">No hay usuarios cargados.</td></tr>';
        }
        return usuarios.map(function (u) {
            var estado = parseInt(u.estado, 10) === 1 ? 1 : 0;
            var busq   = String((u.nombre || '') + ' ' + (u.correo || '') + ' ' + (u.dni || '') + ' ' + (u.telefono || '')).toLowerCase().trim();
            return '<tr data-id="' + u.id + '" data-estado="' + estado + '" data-search="' + e(busq) + '">' +
                '<td class="td-id">#' + u.id + '</td>' +
                '<td>' +
                    '<div class="td-nombre">' + e(u.nombre || '—') + '</div>' +
                    (u.dni ? '<div class="td-id">DNI ' + e(u.dni) + '</div>' : '') +
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
                        '<button class="btn-icon-sm" data-act="view"   type="button" title="Consultar"><i class="fa-solid fa-eye"></i></button>' +
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
                        '<div class="form-group"><label for="usr-casa">Casa</label>' +
                            '<input id="usr-casa" name="casa" type="number" min="1" step="1" inputmode="numeric" placeholder="ID de casa"></div>' +
                    '</div>' +
                    '<div class="form-row">' +
                        '<div class="form-group"><label for="usr-roles">Rol</label>' +
                            '<select id="usr-roles" name="roles">' +
                                '<option value="">—</option>' +
                                '<option value="admin">admin</option>' +
                                '<option value="operador">operador</option>' +
                                '<option value="vecino">vecino</option>' +
                            '</select></div>' +
                        '<div class="form-group"><label for="usr-contrasena">Contraseña</label>' +
                            '<input id="usr-contrasena" name="contrasena" type="text" maxlength="16" autocomplete="new-password">' +
                            '<div class="text-muted text-sm" id="usrHintPass">Máximo 16 caracteres.</div></div>' +
                    '</div>' +
                    '<div class="form-row">' +
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
                        '<div class="form-group"><label for="flt-id">Código</label>' +
                            '<input id="flt-id" type="number" min="1" step="1" inputmode="numeric" ' +
                                'placeholder="Código del registro" value="' + e(usuariosFiltros.filtro_id) + '"></div>' +
                        '<div class="form-group"><label for="flt-nombre">Nombre</label>' +
                            '<input id="flt-nombre" type="text" maxlength="255" ' +
                                'placeholder="Nombre del usuario" value="' + e(usuariosFiltros.nombre) + '"></div>' +
                    '</div>' +
                    '<div class="form-row">' +
                        '<div class="form-group"><label for="flt-correo">Correo</label>' +
                            '<input id="flt-correo" type="search" maxlength="100" ' +
                                'placeholder="ejemplo@correo.com" value="' + e(usuariosFiltros.correo) + '"></div>' +
                        '<div class="form-group"><label for="flt-telefono">Celular</label>' +
                            '<input id="flt-telefono" type="tel" maxlength="20" ' +
                                'placeholder="Número de celular" value="' + e(usuariosFiltros.telefono) + '"></div>' +
                    '</div>' +
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
                        '<div class="form-group"><label for="flt-limit">Límite</label>' +
                            '<input id="flt-limit" type="number" min="1" max="1000" step="1" ' +
                                'inputmode="numeric" value="' + e(usuariosFiltros.limit) + '"></div>' +
                    '</div>' +
                    '<div class="form-row">' +
                        '<div class="form-group"><label for="flt-sort">Ordenar por</label>' +
                            '<select id="flt-sort">' +
                                selOpt('id',         'Código',            usuariosFiltros.sort) +
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

    function modalConsultarUsuarioHtml() {
        return '<div class="modal-backdrop" id="usrConsultar"><div class="modal modal-wide">' +
            '<div class="modal-header">' +
                '<div class="modal-title">' +
                    '<span>Consultar usuario</span>' +
                    '<span class="modal-subtitle" id="usrConsultarSub"></span>' +
                '</div>' +
                '<button class="btn-icon-sm" data-act="close" type="button" aria-label="Cerrar">&times;</button>' +
            '</div>' +
            '<div class="modal-body">' +
                '<dl class="data-list" id="usrConsultarBody"></dl>' +
            '</div>' +
            '<div class="modal-footer">' +
                '<button type="button" class="btn btn-ghost" data-act="close">Cerrar</button>' +
            '</div>' +
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

    function wireUsuariosView() {
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

        var consultarModal = document.getElementById('usrConsultar');
        var consultarSub   = document.getElementById('usrConsultarSub');
        var consultarBody  = document.getElementById('usrConsultarBody');

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
            usuariosFiltros.filtro_id = '';
            usuariosFiltros.nombre    = '';
            usuariosFiltros.correo    = '';
            usuariosFiltros.telefono  = '';
            usuariosFiltros.comunidad = '';
            usuariosFiltros.roles     = '';
            usuariosFiltros.estado    = '';
            filtrosModal.classList.remove('open');
            navigate();
        });
        filtrosForm.addEventListener('submit', function (ev) {
            ev.preventDefault();
            usuariosFiltros.filtro_id = document.getElementById('flt-id').value.trim();
            usuariosFiltros.nombre    = document.getElementById('flt-nombre').value.trim();
            usuariosFiltros.correo    = document.getElementById('flt-correo').value.trim();
            usuariosFiltros.telefono  = document.getElementById('flt-telefono').value.trim();
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

        consultarModal.addEventListener('click', function (ev) {
            if (ev.target === consultarModal || ev.target.closest('[data-act="close"]')) {
                consultarModal.classList.remove('open');
            }
        });

        function dataRow(label, value, muted, full) {
            var rowCls = 'data-row' + (full ? ' data-row-full' : '');
            var valCls = 'data-value' + (muted ? ' muted' : '');
            return '<div class="' + rowCls + '">' +
                '<dt class="data-label">' + e(label) + '</dt>' +
                '<dd class="' + valCls + '">' + value + '</dd>' +
            '</div>';
        }
        function fmtFecha(v) {
            if (!v) return null;
            return String(v).replace('T', ' ').replace(/\.\d+$/, '');
        }
        function fmtSiNo(v) {
            if (v == null || v === '') return null;
            var s = String(v);
            return (s === '1' || s.toLowerCase() === 'si' || s.toLowerCase() === 'sí') ? 'Sí' : 'No';
        }
        function rowTxt(label, v, vacio, full) {
            var muted = v == null || v === '';
            return dataRow(label, e(muted ? (vacio || '—') : v), muted, full);
        }
        function rowRef(label, id, nombre, vacio, full) {
            if (id == null || id === '') return dataRow(label, e(vacio || '—'), true, full);
            var txt = nombre ? (nombre + ' (#' + id + ')') : ('#' + id);
            return dataRow(label, e(txt), false, full);
        }
        function rowSiNo(label, v, full) {
            var t = fmtSiNo(v);
            return dataRow(label, e(t || 'No definido'), t == null, full);
        }
        async function abrirConsulta(id) {
            consultarSub.innerHTML  = '<code>#' + id + '</code>';
            consultarBody.innerHTML = '<div style="display:flex;justify-content:center;padding:24px"><div class="spin"></div></div>';
            consultarModal.classList.add('open');

            var u;
            try {
                u = await api('/api/usuarios.php?id=' + id);
            } catch (err) {
                consultarBody.innerHTML = '<div class="alert alert-error">' + e(err.message) + '</div>';
                return;
            }

            var estadoBadge = parseInt(u.estado, 10) === 1
                ? '<span class="badge badge-success">Activo</span>'
                : '<span class="badge badge-danger">Inactivo</span>';
            var nacimiento = u.nacimiento ? String(u.nacimiento).slice(0, 10) : null;

            consultarSub.innerHTML  = '<code>#' + u.id + '</code>';
            consultarBody.innerHTML =
                dataRow('Código',                 '<code>#' + u.id + '</code>') +
                rowTxt ('Nombre',                  u.nombre) +
                rowTxt ('Correo',                  u.correo) +
                rowTxt ('Teléfono',                u.telefono, 'Sin teléfono') +
                rowTxt ('DNI',                     u.dni,      'Sin DNI') +
                rowTxt ('Género',                  u.genero,   'Sin género') +
                rowTxt ('Fecha de nacimiento',     nacimiento, 'Sin fecha') +
                rowRef ('Comunidad',               u.comunidad, u.comunidad_nombre, 'Sin comunidad') +
                rowRef ('Casa',                    u.casa,      u.casa_nombre,      'Sin casa') +
                rowTxt ('Rol',                     u.roles,    'Sin rol') +
                dataRow('Estado',                  estadoBadge) +
                rowTxt ('Aplicación',              u.aplicacion,   'Sin app') +
                rowSiNo('Usuario de sistema',      u.sistema) +
                rowTxt ('Instalada',               fmtFecha(u.instalada),  'Sin instalación') +
                rowTxt ('Última ejecución',        fmtFecha(u.ejecutada),  'Sin ejecución') +
                rowTxt ('Coordenadas',             u.ubicacionCoordenadas, 'Sin coordenadas') +
                rowTxt ('Exactitud',               u.ubicacionExactitud,   'Sin exactitud') +
                rowTxt ('Ubicación actualizada',   fmtFecha(u.ubicacionActualizada), 'Sin ubicación') +
                rowSiNo('Avisos',                  u.avisos) +
                rowSiNo('Notificaciones',          u.notificaciones) +
                rowSiNo('WhatsApps',               u.whatsapps) +
                rowSiNo('Mensajes',                u.mensajes) +
                rowSiNo('Correos',                 u.correos) +
                rowTxt ('Terminal',                u.terminal != null ? '#' + u.terminal : null, 'Sin terminal') +
                rowTxt ('Fecha de registro',       fmtFecha(u.registrado), 'Sin registro') +
                rowRef ('Registrado por',          u.registrante, u.registrante_nombre, 'Sin registrante') +
                rowTxt ('Propiedades',             u.propiedades, 'Sin propiedades', true);
        }

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

            if (btn.dataset.act === 'view') {
                abrirConsulta(id);
                return;
            }

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
                    document.getElementById('usr-casa').value      = u.casa      != null ? u.casa      : '';
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
                casa:       document.getElementById('usr-casa').value      || null,
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

    var rolesFiltros = {
        sort:        'id',
        dir:         'desc',
        limit:       100,
        filtro_id:   '',
        nombre:      '',
        descripcion: '',
        sistema:     ''
    };

    function rolesQueryString() {
        var qs = [];
        Object.keys(rolesFiltros).forEach(function (k) {
            var v = rolesFiltros[k];
            if (v !== '' && v != null) {
                qs.push(encodeURIComponent(k) + '=' + encodeURIComponent(v));
            }
        });
        return qs.length ? ('?' + qs.join('&')) : '';
    }

    async function renderRoles(view) {
        var data  = await api('/api/roles.php' + rolesQueryString());
        var roles = data.roles || [];
        var kpis  = data.kpis  || {};

        var filtrosActivos = (rolesFiltros.filtro_id   !== '' ? 1 : 0) +
                             (rolesFiltros.nombre      !== '' ? 1 : 0) +
                             (rolesFiltros.descripcion !== '' ? 1 : 0) +
                             (rolesFiltros.sistema     !== '' ? 1 : 0);
        var badgeFiltros = filtrosActivos
            ? ' <span class="badge badge-info" style="margin-left:6px;">' + filtrosActivos + '</span>'
            : '';

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
                    '<button class="btn btn-secondary" id="rolFiltros" type="button">' +
                        '<i class="fa-solid fa-filter"></i> Filtros' + badgeFiltros +
                    '</button>' +
                '</div>' +
                '<div class="toolbar-right">' +
                    '<button class="btn btn-primary" id="rolNuevo" type="button">+ Nuevo rol</button>' +
                '</div>' +
            '</div>' +

            '<div class="table-card">' +
                '<table><thead><tr>' +
                    '<th>Código</th><th>Nombre</th><th>Descripción</th><th>Tipo</th>' +
                    '<th style="text-align:right;">Acciones</th>' +
                '</tr></thead><tbody id="rolTbody">' +
                renderFilasRoles(roles) +
                '</tbody></table>' +
            '</div>' +
            '<div class="text-muted text-sm" style="margin-top:10px;">' +
                'Mostrando ' + roles.length + ' resultado(s) (límite ' + rolesFiltros.limit + ').' +
            '</div>' +

            modalRolHtml() +
            modalFiltrosRolesHtml() +
            modalConsultarRolHtml() +
            confirmDeleteRolHtml();

        wireRolesView();
    }

    function renderFilasRoles(roles) {
        if (!roles.length) {
            return '<tr><td colspan="5" class="table-empty">No hay roles cargados.</td></tr>';
        }
        return roles.map(function (r) {
            var esSistema = String(r.sistema || '') === '1';
            return '<tr data-id="' + r.id + '" data-sistema="' + (esSistema ? 1 : 0) + '">' +
                '<td class="td-id">#' + r.id + '</td>' +
                '<td><div class="td-nombre">' + e(r.nombre || '—') + '</div></td>' +
                '<td>' + e(r.descripcion || '—') + '</td>' +
                '<td>' +
                    (esSistema
                        ? '<span class="badge badge-danger">Sistema</span>'
                        : '<span class="badge badge-success">Personalizado</span>') +
                '</td>' +
                '<td>' +
                    '<div class="actions" style="justify-content:flex-end;">' +
                        '<button class="btn-icon-sm" data-act="view"   type="button" title="Consultar"><i class="fa-solid fa-eye"></i></button>' +
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

    function modalFiltrosRolesHtml() {
        function selOpt(value, label, current) {
            var sel = String(current) === String(value) ? ' selected' : '';
            return '<option value="' + e(value) + '"' + sel + '>' + e(label) + '</option>';
        }
        return '<div class="modal-backdrop" id="rolFiltrosModal"><div class="modal">' +
            '<div class="modal-header">' +
                '<div class="modal-title"><span>Filtros</span></div>' +
                '<button class="btn-icon-sm" data-act="close" type="button" aria-label="Cerrar">&times;</button>' +
            '</div>' +
            '<form id="rolFiltrosForm" novalidate>' +
                '<div class="modal-body">' +
                    '<div class="form-row">' +
                        '<div class="form-group"><label for="rflt-id">Código</label>' +
                            '<input id="rflt-id" type="number" min="1" step="1" inputmode="numeric" ' +
                                'placeholder="Código del registro" value="' + e(rolesFiltros.filtro_id) + '"></div>' +
                        '<div class="form-group"><label for="rflt-nombre">Nombre</label>' +
                            '<input id="rflt-nombre" type="text" maxlength="255" ' +
                                'placeholder="Nombre del rol" value="' + e(rolesFiltros.nombre) + '"></div>' +
                    '</div>' +
                    '<div class="form-row">' +
                        '<div class="form-group"><label for="rflt-descripcion">Descripción</label>' +
                            '<input id="rflt-descripcion" type="text" maxlength="255" ' +
                                'placeholder="Texto en descripción" value="' + e(rolesFiltros.descripcion) + '"></div>' +
                        '<div class="form-group"><label for="rflt-sistema">Tipo</label>' +
                            '<select id="rflt-sistema">' +
                                selOpt('',  'Todos',          rolesFiltros.sistema) +
                                selOpt('1', 'Sistema',        rolesFiltros.sistema) +
                                selOpt('0', 'Personalizados', rolesFiltros.sistema) +
                            '</select></div>' +
                    '</div>' +
                    '<div class="form-row">' +
                        '<div class="form-group"><label for="rflt-sort">Ordenar por</label>' +
                            '<select id="rflt-sort">' +
                                selOpt('id',          'Código',      rolesFiltros.sort) +
                                selOpt('nombre',      'Nombre',      rolesFiltros.sort) +
                                selOpt('descripcion', 'Descripción', rolesFiltros.sort) +
                                selOpt('sistema',     'Tipo',        rolesFiltros.sort) +
                            '</select></div>' +
                        '<div class="form-group"><label for="rflt-dir">Dirección</label>' +
                            '<select id="rflt-dir">' +
                                selOpt('desc', 'Descendente', rolesFiltros.dir) +
                                selOpt('asc',  'Ascendente',  rolesFiltros.dir) +
                            '</select></div>' +
                    '</div>' +
                    '<div class="form-row">' +
                        '<div class="form-group"><label for="rflt-limit">Límite</label>' +
                            '<input id="rflt-limit" type="number" min="1" max="1000" step="1" ' +
                                'inputmode="numeric" value="' + e(rolesFiltros.limit) + '"></div>' +
                    '</div>' +
                '</div>' +
                '<div class="modal-footer">' +
                    '<button type="button" class="btn btn-ghost"     id="rolFiltrosReset" >Limpiar</button>' +
                    '<button type="button" class="btn btn-secondary" data-act="close"    >Cancelar</button>' +
                    '<button type="submit"  class="btn btn-primary"                       >Aplicar</button>' +
                '</div>' +
            '</form>' +
        '</div></div>';
    }

    function modalConsultarRolHtml() {
        return '<div class="modal-backdrop" id="rolConsultar"><div class="modal">' +
            '<div class="modal-header">' +
                '<div class="modal-title">' +
                    '<span>Consultar rol</span>' +
                    '<span class="modal-subtitle" id="rolConsultarSub"></span>' +
                '</div>' +
                '<button class="btn-icon-sm" data-act="close" type="button" aria-label="Cerrar">&times;</button>' +
            '</div>' +
            '<div class="modal-body">' +
                '<dl class="data-list" id="rolConsultarBody"></dl>' +
            '</div>' +
            '<div class="modal-footer">' +
                '<button type="button" class="btn btn-ghost" data-act="close">Cerrar</button>' +
            '</div>' +
        '</div></div>';
    }

    function wireRolesView() {
        var tbody       = document.getElementById('rolTbody');

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

        var filtrosModal = document.getElementById('rolFiltrosModal');
        var filtrosForm  = document.getElementById('rolFiltrosForm');

        var consultarModal = document.getElementById('rolConsultar');
        var consultarSub   = document.getElementById('rolConsultarSub');
        var consultarBody  = document.getElementById('rolConsultarBody');

        var pendingDeleteId = null;
        var modoEdicion     = false;

        document.getElementById('rolFiltros').addEventListener('click', function () {
            filtrosModal.classList.add('open');
        });
        filtrosModal.addEventListener('click', function (ev) {
            if (ev.target === filtrosModal || ev.target.closest('[data-act="close"]')) {
                filtrosModal.classList.remove('open');
            }
        });
        document.getElementById('rolFiltrosReset').addEventListener('click', function () {
            rolesFiltros.sort        = 'id';
            rolesFiltros.dir         = 'desc';
            rolesFiltros.limit       = 100;
            rolesFiltros.filtro_id   = '';
            rolesFiltros.nombre      = '';
            rolesFiltros.descripcion = '';
            rolesFiltros.sistema     = '';
            filtrosModal.classList.remove('open');
            navigate();
        });
        filtrosForm.addEventListener('submit', function (ev) {
            ev.preventDefault();
            rolesFiltros.filtro_id   = document.getElementById('rflt-id').value.trim();
            rolesFiltros.nombre      = document.getElementById('rflt-nombre').value.trim();
            rolesFiltros.descripcion = document.getElementById('rflt-descripcion').value.trim();
            rolesFiltros.sistema     = document.getElementById('rflt-sistema').value;
            rolesFiltros.limit       = parseInt(document.getElementById('rflt-limit').value, 10) || 100;
            rolesFiltros.sort        = document.getElementById('rflt-sort').value || 'id';
            rolesFiltros.dir         = document.getElementById('rflt-dir').value  || 'desc';
            filtrosModal.classList.remove('open');
            navigate();
        });

        consultarModal.addEventListener('click', function (ev) {
            if (ev.target === consultarModal || ev.target.closest('[data-act="close"]')) {
                consultarModal.classList.remove('open');
            }
        });

        async function abrirConsulta(id) {
            consultarSub.innerHTML  = '<code>#' + id + '</code>';
            consultarBody.innerHTML = '<div style="display:flex;justify-content:center;padding:24px"><div class="spin"></div></div>';
            consultarModal.classList.add('open');

            var r;
            try {
                r = await api('/api/roles.php?id=' + id);
            } catch (err) {
                consultarBody.innerHTML = '<div class="alert alert-error">' + e(err.message) + '</div>';
                return;
            }

            var esSistema = String(r.sistema || '') === '1';
            var tipoBadge = esSistema
                ? '<span class="badge badge-danger">Sistema</span>'
                : '<span class="badge badge-success">Personalizado</span>';

            consultarSub.innerHTML  = '<code>#' + r.id + '</code>';
            consultarBody.innerHTML =
                abmRow    ('Código',      '<code>#' + r.id + '</code>') +
                abmRow    ('Tipo',         tipoBadge) +
                abmRowTxt ('Nombre',       r.nombre,      'Sin nombre',      true) +
                abmRowTxt ('Descripción',  r.descripcion, 'Sin descripción', true) +
                abmRowTxt ('Permisos',     r.permisos,    'Sin permisos',    true) +
                abmRowTxt ('Menús',        r.menus,       'Sin menús',       true) +
                abmRowTxt ('Widgets',      r.widgets,     'Sin widgets',     true);
        }

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

            if (btn.dataset.act === 'view') {
                abrirConsulta(id);
                return;
            }

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
    }

    // -------- Vista: Comunidades ------------------------------------------

    var comunidadesFiltros = {
        sort:      'id',
        dir:       'desc',
        limit:     100,
        filtro_id: '',
        nombre:    '',
        estado:    ''
    };

    function comunidadesQueryString() {
        var qs = [];
        Object.keys(comunidadesFiltros).forEach(function (k) {
            var v = comunidadesFiltros[k];
            if (v !== '' && v != null) {
                qs.push(encodeURIComponent(k) + '=' + encodeURIComponent(v));
            }
        });
        return qs.length ? ('?' + qs.join('&')) : '';
    }

    async function renderComunidades(view) {
        var data        = await api('/api/comunidades.php' + comunidadesQueryString());
        var comunidades = data.comunidades || [];
        var kpis        = data.kpis        || {};

        var filtrosActivos = (comunidadesFiltros.filtro_id !== '' ? 1 : 0) +
                             (comunidadesFiltros.nombre    !== '' ? 1 : 0) +
                             (comunidadesFiltros.estado    !== '' ? 1 : 0);
        var badgeFiltros = filtrosActivos
            ? ' <span class="badge badge-info" style="margin-left:6px;">' + filtrosActivos + '</span>'
            : '';

        view.innerHTML =
            '<div class="page-header"><div>' +
                '<h1>Comunidades</h1>' +
                '<p>Barrios y comunidades cerradas administradas por la plataforma.</p>' +
            '</div></div>' +

            '<div class="stats-bar">' +
                statCard('Total',     kpis.total     || 0, 'orange', 'Comunidades registradas') +
                statCard('Activas',   kpis.activas   || 0, 'green',  'Operativas') +
                statCard('Inactivas', kpis.inactivas || 0, 'red',    'Sin operación') +
            '</div>' +

            '<div class="toolbar">' +
                '<div class="toolbar-left">' +
                    '<div class="search-wrap">' +
                        '<input type="search" id="comSearch" class="search-input" placeholder="Buscar nombre o domicilio...">' +
                        '<button class="search-clear" id="comSearchClear" type="button" style="display:none;">&times;</button>' +
                    '</div>' +
                    '<button class="btn btn-secondary" id="comFiltros" type="button">' +
                        '<i class="fa-solid fa-filter"></i> Filtros' + badgeFiltros +
                    '</button>' +
                '</div>' +
                '<div class="toolbar-right">' +
                    '<button class="btn btn-primary" id="comNuevo" type="button">+ Nueva comunidad</button>' +
                '</div>' +
            '</div>' +

            '<div class="table-card">' +
                '<table><thead><tr>' +
                    '<th>Código</th><th>Nombre</th><th>Domicilio</th><th>Casas</th><th>Estado</th>' +
                    '<th style="text-align:right;">Acciones</th>' +
                '</tr></thead><tbody id="comTbody">' +
                renderFilasComunidades(comunidades) +
                '</tbody></table>' +
                '<div class="table-empty" id="comEmpty" style="display:none;">No hay comunidades que coincidan con la búsqueda.</div>' +
            '</div>' +
            '<div class="text-muted text-sm" style="margin-top:10px;">' +
                'Mostrando ' + comunidades.length + ' resultado(s) (límite ' + comunidadesFiltros.limit + ').' +
            '</div>' +

            modalComunidadHtml() +
            modalFiltrosComunidadesHtml() +
            modalConsultarComunidadHtml() +
            confirmDeleteComunidadHtml();

        wireComunidadesView();
    }

    function renderFilasComunidades(comunidades) {
        if (!comunidades.length) {
            return '<tr><td colspan="6" class="table-empty">No hay comunidades cargadas.</td></tr>';
        }
        return comunidades.map(function (c) {
            var activa = parseInt(c.estado, 10) === 1;
            var busq   = String((c.nombre || '') + ' ' + (c.domicilio || '')).toLowerCase().trim();
            return '<tr data-id="' + c.id + '" data-search="' + e(busq) + '">' +
                '<td class="td-id">#' + c.id + '</td>' +
                '<td><div class="td-nombre">' + e(c.nombre || '—') + '</div></td>' +
                '<td>' + e(c.domicilio || '—') + '</td>' +
                '<td>' + (parseInt(c.casas_count, 10) || 0) + '</td>' +
                '<td>' +
                    (activa
                        ? '<span class="badge badge-success">Activa</span>'
                        : '<span class="badge badge-danger">Inactiva</span>') +
                '</td>' +
                '<td>' +
                    '<div class="actions" style="justify-content:flex-end;">' +
                        '<button class="btn-icon-sm" data-act="view"   type="button" title="Consultar"><i class="fa-solid fa-eye"></i></button>' +
                        '<button class="btn-icon-sm" data-act="edit"   type="button" title="Editar"><i class="fa-solid fa-pencil"></i></button>' +
                        '<button class="btn-icon-sm" data-act="delete" type="button" title="Eliminar"><i class="fa-solid fa-trash"></i></button>' +
                    '</div>' +
                '</td>' +
            '</tr>';
        }).join('');
    }

    function modalComunidadHtml() {
        return '<div class="modal-backdrop" id="comModal"><div class="modal">' +
            '<div class="modal-header">' +
                '<div class="modal-title">' +
                    '<span id="comModalTitulo">Nueva comunidad</span>' +
                    '<span class="modal-subtitle" id="comModalSub"></span>' +
                '</div>' +
                '<button class="btn-icon-sm" data-act="close" type="button" aria-label="Cerrar">&times;</button>' +
            '</div>' +
            '<form id="comForm" novalidate>' +
                '<input type="hidden" id="comId" value="">' +
                '<div class="modal-body">' +
                    '<div class="alert alert-error" id="comError" style="display:none;"></div>' +
                    '<div class="form-row">' +
                        '<div class="form-group"><label for="com-nombre">Nombre</label>' +
                            '<input id="com-nombre" name="nombre" type="text" maxlength="255" required></div>' +
                        '<div class="form-group"><label>Estado</label>' +
                            '<label class="toggle-switch" style="margin-top:6px;">' +
                                '<input id="com-estado" name="estado" type="checkbox" value="1" checked>' +
                                '<span class="toggle-track"><span class="toggle-thumb"></span></span>' +
                                '<span class="toggle-label" id="comEstadoLabel">Activa</span>' +
                            '</label></div>' +
                    '</div>' +
                    '<div class="form-row">' +
                        '<div class="form-group" style="flex:1 1 100%;"><label for="com-domicilio">Domicilio</label>' +
                            '<input id="com-domicilio" name="domicilio" type="text" maxlength="255"></div>' +
                    '</div>' +
                    '<div class="form-row">' +
                        '<div class="form-group" style="flex:1 1 100%;"><label for="com-indicaciones">Indicaciones de acceso</label>' +
                            '<textarea id="com-indicaciones" name="indicaciones" rows="2" maxlength="255"></textarea></div>' +
                    '</div>' +
                    '<div class="form-row form-row-3">' +
                        '<div class="form-group"><label for="com-policia">Policía</label>' +
                            '<input id="com-policia" name="policia" type="tel" maxlength="255"></div>' +
                        '<div class="form-group"><label for="com-ambulancia">Ambulancia</label>' +
                            '<input id="com-ambulancia" name="ambulancia" type="tel" maxlength="255"></div>' +
                        '<div class="form-group"><label for="com-bomberos">Bomberos</label>' +
                            '<input id="com-bomberos" name="bomberos" type="tel" maxlength="255"></div>' +
                    '</div>' +
                '</div>' +
                '<div class="modal-footer">' +
                    '<button type="button" class="btn btn-ghost" data-act="close">Cancelar</button>' +
                    '<button type="submit" class="btn btn-primary" id="comGuardar">Guardar</button>' +
                '</div>' +
            '</form>' +
        '</div></div>';
    }

    function confirmDeleteComunidadHtml() {
        return '<div class="confirm-backdrop" id="comConfirm"><div class="confirm-box">' +
            '<div class="confirm-title">Eliminar comunidad</div>' +
            '<div class="confirm-msg" id="comConfirmMsg">Esta acción no se puede deshacer.</div>' +
            '<div class="confirm-actions">' +
                '<button class="btn btn-ghost"  data-act="cancel" type="button">Cancelar</button>' +
                '<button class="btn btn-danger" id="comConfirmBtn" type="button">Eliminar</button>' +
            '</div>' +
        '</div></div>';
    }

    function modalFiltrosComunidadesHtml() {
        function selOpt(value, label, current) {
            var sel = String(current) === String(value) ? ' selected' : '';
            return '<option value="' + e(value) + '"' + sel + '>' + e(label) + '</option>';
        }
        return '<div class="modal-backdrop" id="comFiltrosModal"><div class="modal">' +
            '<div class="modal-header">' +
                '<div class="modal-title"><span>Filtros</span></div>' +
                '<button class="btn-icon-sm" data-act="close" type="button" aria-label="Cerrar">&times;</button>' +
            '</div>' +
            '<form id="comFiltrosForm" novalidate>' +
                '<div class="modal-body">' +
                    '<div class="form-row">' +
                        '<div class="form-group"><label for="cmflt-id">Código</label>' +
                            '<input id="cmflt-id" type="number" min="1" step="1" inputmode="numeric" ' +
                                'placeholder="Código del registro" value="' + e(comunidadesFiltros.filtro_id) + '"></div>' +
                        '<div class="form-group"><label for="cmflt-nombre">Nombre</label>' +
                            '<input id="cmflt-nombre" type="text" maxlength="255" ' +
                                'placeholder="Nombre de la comunidad" value="' + e(comunidadesFiltros.nombre) + '"></div>' +
                    '</div>' +
                    '<div class="form-row">' +
                        '<div class="form-group"><label for="cmflt-estado">Estado</label>' +
                            '<select id="cmflt-estado">' +
                                selOpt('',  'Todas',     comunidadesFiltros.estado) +
                                selOpt('1', 'Activas',   comunidadesFiltros.estado) +
                                selOpt('0', 'Inactivas', comunidadesFiltros.estado) +
                            '</select></div>' +
                        '<div class="form-group"><label for="cmflt-limit">Límite</label>' +
                            '<input id="cmflt-limit" type="number" min="1" max="1000" step="1" ' +
                                'inputmode="numeric" value="' + e(comunidadesFiltros.limit) + '"></div>' +
                    '</div>' +
                    '<div class="form-row">' +
                        '<div class="form-group"><label for="cmflt-sort">Ordenar por</label>' +
                            '<select id="cmflt-sort">' +
                                selOpt('id',        'Código',    comunidadesFiltros.sort) +
                                selOpt('nombre',    'Nombre',    comunidadesFiltros.sort) +
                                selOpt('domicilio', 'Domicilio', comunidadesFiltros.sort) +
                                selOpt('estado',    'Estado',    comunidadesFiltros.sort) +
                            '</select></div>' +
                        '<div class="form-group"><label for="cmflt-dir">Dirección</label>' +
                            '<select id="cmflt-dir">' +
                                selOpt('desc', 'Descendente', comunidadesFiltros.dir) +
                                selOpt('asc',  'Ascendente',  comunidadesFiltros.dir) +
                            '</select></div>' +
                    '</div>' +
                '</div>' +
                '<div class="modal-footer">' +
                    '<button type="button" class="btn btn-ghost"     id="comFiltrosReset" >Limpiar</button>' +
                    '<button type="button" class="btn btn-secondary" data-act="close"    >Cancelar</button>' +
                    '<button type="submit"  class="btn btn-primary"                       >Aplicar</button>' +
                '</div>' +
            '</form>' +
        '</div></div>';
    }

    function modalConsultarComunidadHtml() {
        return '<div class="modal-backdrop" id="comConsultar"><div class="modal">' +
            '<div class="modal-header">' +
                '<div class="modal-title">' +
                    '<span>Consultar comunidad</span>' +
                    '<span class="modal-subtitle" id="comConsultarSub"></span>' +
                '</div>' +
                '<button class="btn-icon-sm" data-act="close" type="button" aria-label="Cerrar">&times;</button>' +
            '</div>' +
            '<div class="modal-body">' +
                '<dl class="data-list" id="comConsultarBody"></dl>' +
            '</div>' +
            '<div class="modal-footer">' +
                '<button type="button" class="btn btn-ghost" data-act="close">Cerrar</button>' +
            '</div>' +
        '</div></div>';
    }

    function wireComunidadesView() {
        var tbody       = document.getElementById('comTbody');
        var emptyState  = document.getElementById('comEmpty');
        var searchInput = document.getElementById('comSearch');
        var searchClear = document.getElementById('comSearchClear');

        var modal       = document.getElementById('comModal');
        var modalTitulo = document.getElementById('comModalTitulo');
        var modalSub    = document.getElementById('comModalSub');
        var modalError  = document.getElementById('comError');
        var form        = document.getElementById('comForm');
        var fId         = document.getElementById('comId');
        var fEstado     = document.getElementById('com-estado');
        var estadoLabel = document.getElementById('comEstadoLabel');
        var btnGuardar  = document.getElementById('comGuardar');

        var confirmBox = document.getElementById('comConfirm');
        var confirmMsg = document.getElementById('comConfirmMsg');
        var btnDelete  = document.getElementById('comConfirmBtn');

        var filtrosModal = document.getElementById('comFiltrosModal');
        var filtrosForm  = document.getElementById('comFiltrosForm');

        var consultarModal = document.getElementById('comConsultar');
        var consultarSub   = document.getElementById('comConsultarSub');
        var consultarBody  = document.getElementById('comConsultarBody');

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

        document.getElementById('comFiltros').addEventListener('click', function () {
            filtrosModal.classList.add('open');
        });
        filtrosModal.addEventListener('click', function (ev) {
            if (ev.target === filtrosModal || ev.target.closest('[data-act="close"]')) {
                filtrosModal.classList.remove('open');
            }
        });
        document.getElementById('comFiltrosReset').addEventListener('click', function () {
            comunidadesFiltros.sort      = 'id';
            comunidadesFiltros.dir       = 'desc';
            comunidadesFiltros.limit     = 100;
            comunidadesFiltros.filtro_id = '';
            comunidadesFiltros.nombre    = '';
            comunidadesFiltros.estado    = '';
            filtrosModal.classList.remove('open');
            navigate();
        });
        filtrosForm.addEventListener('submit', function (ev) {
            ev.preventDefault();
            comunidadesFiltros.filtro_id = document.getElementById('cmflt-id').value.trim();
            comunidadesFiltros.nombre    = document.getElementById('cmflt-nombre').value.trim();
            comunidadesFiltros.estado    = document.getElementById('cmflt-estado').value;
            comunidadesFiltros.limit     = parseInt(document.getElementById('cmflt-limit').value, 10) || 100;
            comunidadesFiltros.sort      = document.getElementById('cmflt-sort').value || 'id';
            comunidadesFiltros.dir       = document.getElementById('cmflt-dir').value  || 'desc';
            filtrosModal.classList.remove('open');
            navigate();
        });

        consultarModal.addEventListener('click', function (ev) {
            if (ev.target === consultarModal || ev.target.closest('[data-act="close"]')) {
                consultarModal.classList.remove('open');
            }
        });

        async function abrirConsulta(id) {
            consultarSub.innerHTML  = '<code>#' + id + '</code>';
            consultarBody.innerHTML = '<div style="display:flex;justify-content:center;padding:24px"><div class="spin"></div></div>';
            consultarModal.classList.add('open');

            var c;
            try {
                c = await api('/api/comunidades.php?id=' + id);
            } catch (err) {
                consultarBody.innerHTML = '<div class="alert alert-error">' + e(err.message) + '</div>';
                return;
            }

            var estadoBadge = parseInt(c.estado, 10) === 1
                ? '<span class="badge badge-success">Activa</span>'
                : '<span class="badge badge-danger">Inactiva</span>';
            var promoIni = c.promoInicio ? String(c.promoInicio).slice(0, 10) : null;
            var promoFin = c.promoFin    ? String(c.promoFin).slice(0, 10)    : null;
            var registro = c.registro    ? String(c.registro).slice(0, 10)    : null;
            var alta     = c.alta        ? String(c.alta).slice(0, 10)        : null;

            consultarSub.innerHTML  = '<code>#' + c.id + '</code>';
            consultarBody.innerHTML =
                abmRow    ('Código',                    '<code>#' + c.id + '</code>') +
                abmRowTxt ('UUID',                       c.uuid,        'Sin UUID') +
                abmRowTxt ('Nombre',                     c.nombre) +
                abmRowTxt ('Domicilio',                  c.domicilio,   'Sin domicilio') +
                abmRowRef ('Ciudad',                     c.ciudad,      c.ciudad_nombre, 'Sin ciudad') +
                abmRowTxt ('Latitud',                    c.latitud,     'Sin latitud') +
                abmRowTxt ('Longitud',                   c.longitud,    'Sin longitud') +
                abmRowTxt ('Indicaciones de acceso',     c.indicaciones,'Sin indicaciones') +
                abmRowTxt ('Policía',                    c.policia,     'Sin teléfono') +
                abmRowTxt ('Ambulancia',                 c.ambulancia,  'Sin teléfono') +
                abmRowTxt ('Bomberos',                   c.bomberos,    'Sin teléfono') +
                abmRow    ('Estado',                     estadoBadge) +
                abmRowSiNo('Solvencia',                  c.solvencia) +
                abmRowNum ('Inscripción',                c.inscripcion,  'Sin inscripción') +
                abmRowNum ('Plan',                       c.plan,         'Sin plan') +
                abmRowNum ('Promo',                      c.promo,        'Sin promo') +
                abmRowTxt ('Promo inicio',               promoIni,       'Sin fecha') +
                abmRowTxt ('Promo fin',                  promoFin,       'Sin fecha') +
                abmRowSiNo('Mantenimiento',              c.mantenimiento) +
                abmRowNum ('Convenio',                   c.convenio,     'Sin convenio') +
                abmRowNum ('Contratos',                  c.contratos) +
                abmRowNum ('Contratos vigentes',         c.contratosVigentes) +
                abmRowNum ('Contratos morosos',          c.contratosMorosos) +
                abmRowNum ('Contratos suspendidos',      c.contratosSuspendidos) +
                abmRowNum ('Contratos rescindidos',      c.contratosRescindidos) +
                abmRowNum ('Permanencia contratos',      c.contratosPermanencia) +
                abmRowNum ('Alarmas',                    c.alarmas) +
                abmRowNum ('Alarmas online',             c.alarmasOnline) +
                abmRowNum ('Alarmas offline',            c.alarmasOffline) +
                abmRowNum ('Funcionamiento alarmas (%)', c.alarmasFuncionamiento) +
                abmRowNum ('Casas',                      c.casas != null ? c.casas : c.casas_count) +
                abmRowNum ('Usuarios',                   c.usuarios) +
                abmRowNum ('Disparos',                   c.disparos) +
                abmRowTxt ('Fecha de registro',          registro,       'Sin registro') +
                abmRowTxt ('Fecha de alta',              alta,           'Sin alta') +
                abmRowNum ('Modo',                       c.modo,         'Sin modo') +
                abmRowRef ('Vendedor',                   c.vendedor,     c.vendedor_nombre, 'Sin vendedor') +
                abmRowSiNo('WhatsApp habilitado',        c.wspHabilitado) +
                abmRowTxt ('WhatsApp nombre',            c.wspNombre,    'Sin nombre') +
                abmRowTxt ('WhatsApp descripción',       c.wspDescripcion, 'Sin descripción') +
                abmRowTxt ('WhatsApp grupo',             c.wspGrupo,     'Sin grupo') +
                abmRowTxt ('WhatsApp invitación',        c.wspInvitacion,'Sin link') +
                abmRowTxt ('WhatsApp ícono',             c.wspIcono,     'Sin ícono') +
                abmRowNum ('WhatsApp miembros',          c.wspMiembros) +
                abmRowTxt ('WhatsApp actualizado',       abmFecha(c.wspActualizado), 'Sin actualización') +
                abmRowTxt ('WhatsApp renovado',          abmFecha(c.wspRenovado),    'Sin renovación');
        }

        function setEstadoLabel() {
            estadoLabel.textContent = fEstado.checked ? 'Activa' : 'Inactiva';
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

        document.getElementById('comNuevo').addEventListener('click', function () {
            modoEdicion = false;
            resetForm();
            modalTitulo.textContent = 'Nueva comunidad';
            modalSub.textContent    = '';
            openModal();
            document.getElementById('com-nombre').focus();
        });

        tbody.addEventListener('click', async function (ev) {
            var btn = ev.target.closest('button[data-act]');
            if (!btn) return;
            var tr = btn.closest('tr[data-id]');
            if (!tr) return;
            var id = parseInt(tr.dataset.id, 10);

            if (btn.dataset.act === 'view') {
                abrirConsulta(id);
                return;
            }

            if (btn.dataset.act === 'edit') {
                try {
                    var c = await api('/api/comunidades.php?id=' + id);
                    modoEdicion = true;
                    resetForm();
                    fId.value = c.id;
                    modalTitulo.textContent = 'Editar comunidad';
                    modalSub.textContent    = '#' + c.id;
                    document.getElementById('com-nombre').value       = c.nombre       || '';
                    document.getElementById('com-domicilio').value    = c.domicilio    || '';
                    document.getElementById('com-indicaciones').value = c.indicaciones || '';
                    document.getElementById('com-policia').value      = c.policia      || '';
                    document.getElementById('com-ambulancia').value   = c.ambulancia   || '';
                    document.getElementById('com-bomberos').value     = c.bomberos     || '';
                    fEstado.checked = parseInt(c.estado, 10) === 1;
                    setEstadoLabel();
                    openModal();
                    document.getElementById('com-nombre').focus();
                } catch (err) {
                    toast(err.message, true);
                }
                return;
            }

            if (btn.dataset.act === 'delete') {
                var nombre = (tr.querySelector('.td-nombre') || {}).textContent || ('#' + id);
                confirmMsg.textContent = '¿Eliminar la comunidad "' + nombre.trim() + '"? Esta acción no se puede deshacer.';
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
                await api('/api/comunidades.php?id=' + pendingDeleteId, { method: 'DELETE' });
                toast('Comunidad eliminada.');
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
                nombre:       document.getElementById('com-nombre').value.trim(),
                domicilio:    document.getElementById('com-domicilio').value.trim(),
                indicaciones: document.getElementById('com-indicaciones').value.trim(),
                policia:      document.getElementById('com-policia').value.trim(),
                ambulancia:   document.getElementById('com-ambulancia').value.trim(),
                bomberos:     document.getElementById('com-bomberos').value.trim(),
                estado:       fEstado.checked ? 1 : 0
            };

            btnGuardar.disabled = true;
            try {
                if (modoEdicion) {
                    await api('/api/comunidades.php?id=' + encodeURIComponent(fId.value), {
                        method: 'PUT',
                        body:   payload
                    });
                    toast('Comunidad actualizada.');
                } else {
                    await api('/api/comunidades.php', {
                        method: 'POST',
                        body:   payload
                    });
                    toast('Comunidad creada.');
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

    // -------- Vista: Casas ------------------------------------------------

    var casasFiltros = {
        sort:      'id',
        dir:       'desc',
        limit:     100,
        filtro_id: '',
        nombre:    '',
        comunidad: '',
        monitoreo: '',
        estado:    ''
    };

    function casasQueryString() {
        var qs = [];
        Object.keys(casasFiltros).forEach(function (k) {
            var v = casasFiltros[k];
            if (v !== '' && v != null) {
                qs.push(encodeURIComponent(k) + '=' + encodeURIComponent(v));
            }
        });
        return qs.length ? ('?' + qs.join('&')) : '';
    }

    async function renderCasas(view) {
        var data        = await api('/api/casas.php' + casasQueryString());
        var casas       = data.casas       || [];
        var kpis        = data.kpis        || {};
        var comunidades = data.comunidades || [];

        var filtrosActivos = (casasFiltros.filtro_id !== '' ? 1 : 0) +
                             (casasFiltros.nombre    !== '' ? 1 : 0) +
                             (casasFiltros.comunidad !== '' ? 1 : 0) +
                             (casasFiltros.monitoreo !== '' ? 1 : 0) +
                             (casasFiltros.estado    !== '' ? 1 : 0);
        var badgeFiltros = filtrosActivos
            ? ' <span class="badge badge-info" style="margin-left:6px;">' + filtrosActivos + '</span>'
            : '';

        view.innerHTML =
            '<div class="page-header"><div>' +
                '<h1>Casas</h1>' +
                '<p>Domicilios pertenecientes a las comunidades.</p>' +
            '</div></div>' +

            '<div class="stats-bar">' +
                statCard('Total',        kpis.total        || 0, 'orange', 'Casas registradas') +
                statCard('Monitoreadas', kpis.monitoreadas || 0, 'green',  'Con servicio activo') +
                statCard('Activas',      kpis.activas      || 0, 'green',  'Estado operativo') +
            '</div>' +

            '<div class="toolbar">' +
                '<div class="toolbar-left">' +
                    '<div class="search-wrap">' +
                        '<input type="search" id="casSearch" class="search-input" placeholder="Buscar nombre o domicilio...">' +
                        '<button class="search-clear" id="casSearchClear" type="button" style="display:none;">&times;</button>' +
                    '</div>' +
                    '<button class="btn btn-secondary" id="casFiltros" type="button">' +
                        '<i class="fa-solid fa-filter"></i> Filtros' + badgeFiltros +
                    '</button>' +
                '</div>' +
                '<div class="toolbar-right">' +
                    '<button class="btn btn-primary" id="casNuevo" type="button">+ Nueva casa</button>' +
                '</div>' +
            '</div>' +

            '<div class="table-card">' +
                '<table><thead><tr>' +
                    '<th>Código</th><th>Nombre</th><th>Comunidad</th><th>Domicilio</th><th>Monitoreo</th><th>Estado</th>' +
                    '<th style="text-align:right;">Acciones</th>' +
                '</tr></thead><tbody id="casTbody">' +
                renderFilasCasas(casas) +
                '</tbody></table>' +
                '<div class="table-empty" id="casEmpty" style="display:none;">No hay casas que coincidan con la búsqueda.</div>' +
            '</div>' +
            '<div class="text-muted text-sm" style="margin-top:10px;">' +
                'Mostrando ' + casas.length + ' resultado(s) (límite ' + casasFiltros.limit + ').' +
            '</div>' +

            modalCasaHtml(comunidades) +
            modalFiltrosCasasHtml(comunidades) +
            modalConsultarCasaHtml() +
            confirmDeleteCasaHtml();

        wireCasasView();
    }

    function renderFilasCasas(casas) {
        if (!casas.length) {
            return '<tr><td colspan="7" class="table-empty">No hay casas cargadas.</td></tr>';
        }
        return casas.map(function (k) {
            var monit = String(k.monitoreo || '') === '1';
            var act   = String(k.estado    || '') === '1';
            var busq  = String((k.nombre || '') + ' ' + (k.domicilio || '') + ' ' + (k.comunidad_nombre || '')).toLowerCase().trim();
            return '<tr data-id="' + k.id + '" data-search="' + e(busq) + '">' +
                '<td class="td-id">#' + k.id + '</td>' +
                '<td><div class="td-nombre">' + e(k.nombre || '—') + '</div></td>' +
                '<td>' + e(k.comunidad_nombre || '—') + '</td>' +
                '<td>' + e(k.domicilio || '—') + '</td>' +
                '<td>' +
                    (monit
                        ? '<span class="badge badge-success">Sí</span>'
                        : '<span class="badge badge-warn">No</span>') +
                '</td>' +
                '<td>' +
                    (act
                        ? '<span class="badge badge-success">Activa</span>'
                        : '<span class="badge badge-danger">Inactiva</span>') +
                '</td>' +
                '<td>' +
                    '<div class="actions" style="justify-content:flex-end;">' +
                        '<button class="btn-icon-sm" data-act="view"   type="button" title="Consultar"><i class="fa-solid fa-eye"></i></button>' +
                        '<button class="btn-icon-sm" data-act="edit"   type="button" title="Editar"><i class="fa-solid fa-pencil"></i></button>' +
                        '<button class="btn-icon-sm" data-act="delete" type="button" title="Eliminar"><i class="fa-solid fa-trash"></i></button>' +
                    '</div>' +
                '</td>' +
            '</tr>';
        }).join('');
    }

    function modalCasaHtml(comunidades) {
        var opts = comunidades.map(function (c) {
            return '<option value="' + c.id + '">' + e(c.nombre) + '</option>';
        }).join('');

        return '<div class="modal-backdrop" id="casModal"><div class="modal">' +
            '<div class="modal-header">' +
                '<div class="modal-title">' +
                    '<span id="casModalTitulo">Nueva casa</span>' +
                    '<span class="modal-subtitle" id="casModalSub"></span>' +
                '</div>' +
                '<button class="btn-icon-sm" data-act="close" type="button" aria-label="Cerrar">&times;</button>' +
            '</div>' +
            '<form id="casForm" novalidate>' +
                '<input type="hidden" id="casId" value="">' +
                '<div class="modal-body">' +
                    '<div class="alert alert-error" id="casError" style="display:none;"></div>' +
                    '<div class="form-row">' +
                        '<div class="form-group"><label for="cas-nombre">Nombre</label>' +
                            '<input id="cas-nombre" name="nombre" type="text" maxlength="255" required></div>' +
                        '<div class="form-group"><label for="cas-comunidad">Comunidad</label>' +
                            '<select id="cas-comunidad" name="comunidad" required>' +
                                '<option value="">— Seleccionar —</option>' + opts +
                            '</select></div>' +
                    '</div>' +
                    '<div class="form-row">' +
                        '<div class="form-group" style="flex:1 1 100%;"><label for="cas-domicilio">Domicilio</label>' +
                            '<input id="cas-domicilio" name="domicilio" type="text" maxlength="255"></div>' +
                    '</div>' +
                    '<div class="form-row">' +
                        '<div class="form-group"><label for="cas-latitud">Latitud</label>' +
                            '<input id="cas-latitud" name="latitud" type="text" maxlength="100" placeholder="-34.6037"></div>' +
                        '<div class="form-group"><label for="cas-longitud">Longitud</label>' +
                            '<input id="cas-longitud" name="longitud" type="text" maxlength="100" placeholder="-58.3816"></div>' +
                    '</div>' +
                    '<div class="form-row">' +
                        '<div class="form-group"><label>Monitoreo</label>' +
                            '<label class="toggle-switch" style="margin-top:6px;">' +
                                '<input id="cas-monitoreo" name="monitoreo" type="checkbox" value="1">' +
                                '<span class="toggle-track"><span class="toggle-thumb"></span></span>' +
                                '<span class="toggle-label" id="casMonitoreoLabel">Sin monitoreo</span>' +
                            '</label></div>' +
                        '<div class="form-group"><label>Estado</label>' +
                            '<label class="toggle-switch" style="margin-top:6px;">' +
                                '<input id="cas-estado" name="estado" type="checkbox" value="1" checked>' +
                                '<span class="toggle-track"><span class="toggle-thumb"></span></span>' +
                                '<span class="toggle-label" id="casEstadoLabel">Activa</span>' +
                            '</label></div>' +
                    '</div>' +
                '</div>' +
                '<div class="modal-footer">' +
                    '<button type="button" class="btn btn-ghost" data-act="close">Cancelar</button>' +
                    '<button type="submit" class="btn btn-primary" id="casGuardar">Guardar</button>' +
                '</div>' +
            '</form>' +
        '</div></div>';
    }

    function modalFiltrosCasasHtml(comunidades) {
        var optsCom = comunidades.map(function (c) {
            var sel = String(casasFiltros.comunidad) === String(c.id) ? ' selected' : '';
            return '<option value="' + c.id + '"' + sel + '>' + e(c.nombre) + '</option>';
        }).join('');
        function selOpt(value, label, current) {
            var sel = String(current) === String(value) ? ' selected' : '';
            return '<option value="' + e(value) + '"' + sel + '>' + e(label) + '</option>';
        }

        return '<div class="modal-backdrop" id="casFiltrosModal"><div class="modal">' +
            '<div class="modal-header">' +
                '<div class="modal-title"><span>Filtros</span></div>' +
                '<button class="btn-icon-sm" data-act="close" type="button" aria-label="Cerrar">&times;</button>' +
            '</div>' +
            '<form id="casFiltrosForm" novalidate>' +
                '<div class="modal-body">' +
                    '<div class="form-row">' +
                        '<div class="form-group"><label for="cflt-id">Código</label>' +
                            '<input id="cflt-id" type="number" min="1" step="1" inputmode="numeric" ' +
                                'placeholder="Código del registro" value="' + e(casasFiltros.filtro_id) + '"></div>' +
                        '<div class="form-group"><label for="cflt-nombre">Nombre</label>' +
                            '<input id="cflt-nombre" type="text" maxlength="255" ' +
                                'placeholder="Nombre de la casa" value="' + e(casasFiltros.nombre) + '"></div>' +
                    '</div>' +
                    '<div class="form-row">' +
                        '<div class="form-group"><label for="cflt-comunidad">Comunidad</label>' +
                            '<select id="cflt-comunidad"><option value="">Todas</option>' + optsCom + '</select></div>' +
                        '<div class="form-group"><label for="cflt-monitoreo">Monitoreo</label>' +
                            '<select id="cflt-monitoreo">' +
                                selOpt('',  'Todas', casasFiltros.monitoreo) +
                                selOpt('1', 'Con monitoreo', casasFiltros.monitoreo) +
                                selOpt('0', 'Sin monitoreo', casasFiltros.monitoreo) +
                            '</select></div>' +
                    '</div>' +
                    '<div class="form-row">' +
                        '<div class="form-group"><label for="cflt-estado">Estado</label>' +
                            '<select id="cflt-estado">' +
                                selOpt('',  'Todas',     casasFiltros.estado) +
                                selOpt('1', 'Activas',   casasFiltros.estado) +
                                selOpt('0', 'Inactivas', casasFiltros.estado) +
                            '</select></div>' +
                        '<div class="form-group"><label for="cflt-limit">Límite</label>' +
                            '<input id="cflt-limit" type="number" min="1" max="1000" step="1" ' +
                                'inputmode="numeric" value="' + e(casasFiltros.limit) + '"></div>' +
                    '</div>' +
                    '<div class="form-row">' +
                        '<div class="form-group"><label for="cflt-sort">Ordenar por</label>' +
                            '<select id="cflt-sort">' +
                                selOpt('id',        'Código',    casasFiltros.sort) +
                                selOpt('nombre',    'Nombre',    casasFiltros.sort) +
                                selOpt('comunidad', 'Comunidad', casasFiltros.sort) +
                                selOpt('domicilio', 'Domicilio', casasFiltros.sort) +
                                selOpt('alta',      'Alta',      casasFiltros.sort) +
                            '</select></div>' +
                        '<div class="form-group"><label for="cflt-dir">Dirección</label>' +
                            '<select id="cflt-dir">' +
                                selOpt('desc', 'Descendente', casasFiltros.dir) +
                                selOpt('asc',  'Ascendente',  casasFiltros.dir) +
                            '</select></div>' +
                    '</div>' +
                '</div>' +
                '<div class="modal-footer">' +
                    '<button type="button" class="btn btn-ghost"     id="casFiltrosReset" >Limpiar</button>' +
                    '<button type="button" class="btn btn-secondary" data-act="close"    >Cancelar</button>' +
                    '<button type="submit"  class="btn btn-primary"                       >Aplicar</button>' +
                '</div>' +
            '</form>' +
        '</div></div>';
    }

    function modalConsultarCasaHtml() {
        return '<div class="modal-backdrop" id="casConsultar"><div class="modal">' +
            '<div class="modal-header">' +
                '<div class="modal-title">' +
                    '<span>Consultar casa</span>' +
                    '<span class="modal-subtitle" id="casConsultarSub"></span>' +
                '</div>' +
                '<button class="btn-icon-sm" data-act="close" type="button" aria-label="Cerrar">&times;</button>' +
            '</div>' +
            '<div class="modal-body">' +
                '<dl class="data-list" id="casConsultarBody"></dl>' +
            '</div>' +
            '<div class="modal-footer">' +
                '<button type="button" class="btn btn-ghost" data-act="close">Cerrar</button>' +
            '</div>' +
        '</div></div>';
    }

    function confirmDeleteCasaHtml() {
        return '<div class="confirm-backdrop" id="casConfirm"><div class="confirm-box">' +
            '<div class="confirm-title">Eliminar casa</div>' +
            '<div class="confirm-msg" id="casConfirmMsg">Esta acción no se puede deshacer.</div>' +
            '<div class="confirm-actions">' +
                '<button class="btn btn-ghost"  data-act="cancel" type="button">Cancelar</button>' +
                '<button class="btn btn-danger" id="casConfirmBtn" type="button">Eliminar</button>' +
            '</div>' +
        '</div></div>';
    }

    function wireCasasView() {
        var tbody       = document.getElementById('casTbody');
        var emptyState  = document.getElementById('casEmpty');
        var searchInput = document.getElementById('casSearch');
        var searchClear = document.getElementById('casSearchClear');

        var modal          = document.getElementById('casModal');
        var modalTitulo    = document.getElementById('casModalTitulo');
        var modalSub       = document.getElementById('casModalSub');
        var modalError     = document.getElementById('casError');
        var form           = document.getElementById('casForm');
        var fId            = document.getElementById('casId');
        var fMonitoreo     = document.getElementById('cas-monitoreo');
        var monitoreoLabel = document.getElementById('casMonitoreoLabel');
        var fEstado        = document.getElementById('cas-estado');
        var estadoLabel    = document.getElementById('casEstadoLabel');
        var btnGuardar     = document.getElementById('casGuardar');

        var confirmBox = document.getElementById('casConfirm');
        var confirmMsg = document.getElementById('casConfirmMsg');
        var btnDelete  = document.getElementById('casConfirmBtn');

        var filtrosModal = document.getElementById('casFiltrosModal');
        var filtrosForm  = document.getElementById('casFiltrosForm');

        var consultarModal = document.getElementById('casConsultar');
        var consultarSub   = document.getElementById('casConsultarSub');
        var consultarBody  = document.getElementById('casConsultarBody');

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

        document.getElementById('casFiltros').addEventListener('click', function () {
            filtrosModal.classList.add('open');
        });
        filtrosModal.addEventListener('click', function (ev) {
            if (ev.target === filtrosModal || ev.target.closest('[data-act="close"]')) {
                filtrosModal.classList.remove('open');
            }
        });
        document.getElementById('casFiltrosReset').addEventListener('click', function () {
            casasFiltros.sort      = 'id';
            casasFiltros.dir       = 'desc';
            casasFiltros.limit     = 100;
            casasFiltros.filtro_id = '';
            casasFiltros.nombre    = '';
            casasFiltros.comunidad = '';
            casasFiltros.monitoreo = '';
            casasFiltros.estado    = '';
            filtrosModal.classList.remove('open');
            navigate();
        });
        filtrosForm.addEventListener('submit', function (ev) {
            ev.preventDefault();
            casasFiltros.filtro_id = document.getElementById('cflt-id').value.trim();
            casasFiltros.nombre    = document.getElementById('cflt-nombre').value.trim();
            casasFiltros.comunidad = document.getElementById('cflt-comunidad').value;
            casasFiltros.monitoreo = document.getElementById('cflt-monitoreo').value;
            casasFiltros.estado    = document.getElementById('cflt-estado').value;
            casasFiltros.limit     = parseInt(document.getElementById('cflt-limit').value, 10) || 100;
            casasFiltros.sort      = document.getElementById('cflt-sort').value || 'id';
            casasFiltros.dir       = document.getElementById('cflt-dir').value  || 'desc';
            filtrosModal.classList.remove('open');
            navigate();
        });

        consultarModal.addEventListener('click', function (ev) {
            if (ev.target === consultarModal || ev.target.closest('[data-act="close"]')) {
                consultarModal.classList.remove('open');
            }
        });

        async function abrirConsulta(id) {
            consultarSub.innerHTML  = '<code>#' + id + '</code>';
            consultarBody.innerHTML = '<div style="display:flex;justify-content:center;padding:24px"><div class="spin"></div></div>';
            consultarModal.classList.add('open');

            var k;
            try {
                k = await api('/api/casas.php?id=' + id);
            } catch (err) {
                consultarBody.innerHTML = '<div class="alert alert-error">' + e(err.message) + '</div>';
                return;
            }

            var monitBadge = String(k.monitoreo || '') === '1'
                ? '<span class="badge badge-success">Sí</span>'
                : '<span class="badge badge-warn">No</span>';
            var estadoBadge = String(k.estado || '') === '1'
                ? '<span class="badge badge-success">Activa</span>'
                : '<span class="badge badge-danger">Inactiva</span>';

            consultarSub.innerHTML  = '<code>#' + k.id + '</code>';
            consultarBody.innerHTML =
                abmRow    ('Código',          '<code>#' + k.id + '</code>') +
                abmRowTxt ('Nombre',           k.nombre) +
                abmRowRef ('Comunidad',        k.comunidad, k.comunidad_nombre, 'Sin comunidad') +
                abmRowTxt ('Domicilio',        k.domicilio, 'Sin domicilio') +
                abmRowRef ('Ciudad',           k.ciudad,    k.ciudad_nombre,    'Sin ciudad') +
                abmRowTxt ('Latitud',          k.latitud,   'Sin latitud') +
                abmRowTxt ('Longitud',         k.longitud,  'Sin longitud') +
                abmRowTxt ('Grupos',           k.grupos,    'Sin grupos') +
                abmRowRef ('Usuario titular',  k.usuario,   k.usuario_nombre,   'Sin usuario') +
                abmRowTxt ('Cliente',          k.cliente != null ? '#' + k.cliente : null,  'Sin cliente') +
                abmRowTxt ('Contrato',         k.contrato != null ? '#' + k.contrato : null,'Sin contrato') +
                abmRowTxt ('Fecha de alta',    abmFecha(k.alta), 'Sin alta') +
                abmRow    ('Monitoreo',        monitBadge) +
                abmRow    ('Estado',           estadoBadge);
        }

        function setMonitoreoLabel() {
            monitoreoLabel.textContent = fMonitoreo.checked ? 'Con monitoreo' : 'Sin monitoreo';
        }
        function setEstadoLabel() {
            estadoLabel.textContent = fEstado.checked ? 'Activa' : 'Inactiva';
        }
        fMonitoreo.addEventListener('change', setMonitoreoLabel);
        fEstado.addEventListener('change', setEstadoLabel);

        function resetForm() {
            form.reset();
            fId.value = '';
            fMonitoreo.checked = false;
            fEstado.checked    = true;
            setMonitoreoLabel();
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

        document.getElementById('casNuevo').addEventListener('click', function () {
            modoEdicion = false;
            resetForm();
            modalTitulo.textContent = 'Nueva casa';
            modalSub.textContent    = '';
            openModal();
            document.getElementById('cas-nombre').focus();
        });

        tbody.addEventListener('click', async function (ev) {
            var btn = ev.target.closest('button[data-act]');
            if (!btn) return;
            var tr = btn.closest('tr[data-id]');
            if (!tr) return;
            var id = parseInt(tr.dataset.id, 10);

            if (btn.dataset.act === 'view') {
                abrirConsulta(id);
                return;
            }

            if (btn.dataset.act === 'edit') {
                try {
                    var k = await api('/api/casas.php?id=' + id);
                    modoEdicion = true;
                    resetForm();
                    fId.value = k.id;
                    modalTitulo.textContent = 'Editar casa';
                    modalSub.textContent    = '#' + k.id;
                    document.getElementById('cas-nombre').value    = k.nombre    || '';
                    document.getElementById('cas-comunidad').value = k.comunidad != null ? k.comunidad : '';
                    document.getElementById('cas-domicilio').value = k.domicilio || '';
                    document.getElementById('cas-latitud').value   = k.latitud   || '';
                    document.getElementById('cas-longitud').value  = k.longitud  || '';
                    fMonitoreo.checked = String(k.monitoreo || '') === '1';
                    fEstado.checked    = String(k.estado    || '') === '1';
                    setMonitoreoLabel();
                    setEstadoLabel();
                    openModal();
                    document.getElementById('cas-nombre').focus();
                } catch (err) {
                    toast(err.message, true);
                }
                return;
            }

            if (btn.dataset.act === 'delete') {
                var nombre = (tr.querySelector('.td-nombre') || {}).textContent || ('#' + id);
                confirmMsg.textContent = '¿Eliminar la casa "' + nombre.trim() + '"? Esta acción no se puede deshacer.';
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
                await api('/api/casas.php?id=' + pendingDeleteId, { method: 'DELETE' });
                toast('Casa eliminada.');
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
                nombre:    document.getElementById('cas-nombre').value.trim(),
                comunidad: document.getElementById('cas-comunidad').value || null,
                domicilio: document.getElementById('cas-domicilio').value.trim(),
                latitud:   document.getElementById('cas-latitud').value.trim(),
                longitud:  document.getElementById('cas-longitud').value.trim(),
                monitoreo: fMonitoreo.checked ? 1 : 0,
                estado:    fEstado.checked    ? 1 : 0
            };

            btnGuardar.disabled = true;
            try {
                if (modoEdicion) {
                    await api('/api/casas.php?id=' + encodeURIComponent(fId.value), {
                        method: 'PUT',
                        body:   payload
                    });
                    toast('Casa actualizada.');
                } else {
                    await api('/api/casas.php', {
                        method: 'POST',
                        body:   payload
                    });
                    toast('Casa creada.');
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

    // -------- Vista: Alarmas ----------------------------------------------

    var alarmasFiltros = {
        sort:      'id',
        dir:       'desc',
        limit:     100,
        filtro_id: '',
        nombre:    '',
        comunidad: '',
        estado:    '',
        conexion:  ''
    };

    function alarmasQueryString() {
        var qs = [];
        Object.keys(alarmasFiltros).forEach(function (k) {
            var v = alarmasFiltros[k];
            if (v !== '' && v != null) {
                qs.push(encodeURIComponent(k) + '=' + encodeURIComponent(v));
            }
        });
        return qs.length ? ('?' + qs.join('&')) : '';
    }

    async function renderAlarmas(view) {
        var data        = await api('/api/alarmas.php' + alarmasQueryString());
        var alarmas     = data.alarmas     || [];
        var kpis        = data.kpis        || {};
        var comunidades = data.comunidades || [];
        var onlineSec   = data.online_interval_seconds || 600;

        var filtrosActivos = (alarmasFiltros.filtro_id !== '' ? 1 : 0) +
                             (alarmasFiltros.nombre    !== '' ? 1 : 0) +
                             (alarmasFiltros.comunidad !== '' ? 1 : 0) +
                             (alarmasFiltros.estado    !== '' ? 1 : 0) +
                             (alarmasFiltros.conexion  !== '' ? 1 : 0);
        var badgeFiltros = filtrosActivos
            ? ' <span class="badge badge-info" style="margin-left:6px;">' + filtrosActivos + '</span>'
            : '';

        view.innerHTML =
            '<div class="page-header"><div>' +
                '<h1>Alarmas</h1>' +
                '<p>Dispositivos de alarma instalados en las comunidades.</p>' +
            '</div></div>' +

            '<div class="stats-bar">' +
                statCard('Total',   kpis.total   || 0, 'orange', 'Alarmas registradas') +
                statCard('Online',  kpis.online  || 0, 'green',  'Latido en los últimos 10 min') +
                statCard('Offline', kpis.offline || 0, 'red',    'Sin latido reciente') +
            '</div>' +

            '<div class="toolbar">' +
                '<div class="toolbar-left">' +
                    '<div class="search-wrap">' +
                        '<input type="search" id="alaSearch" class="search-input" placeholder="Buscar nombre, identidad o domicilio...">' +
                        '<button class="search-clear" id="alaSearchClear" type="button" style="display:none;">&times;</button>' +
                    '</div>' +
                    '<button class="btn btn-secondary" id="alaFiltros" type="button">' +
                        '<i class="fa-solid fa-filter"></i> Filtros' + badgeFiltros +
                    '</button>' +
                '</div>' +
                '<div class="toolbar-right">' +
                    '<button class="btn btn-primary" id="alaNuevo" type="button">+ Nueva alarma</button>' +
                '</div>' +
            '</div>' +

            '<div class="table-card">' +
                '<table><thead><tr>' +
                    '<th>Código</th><th>Nombre</th><th>Comunidad</th><th>Identidad</th><th>Conexión</th><th>Estado</th>' +
                    '<th style="text-align:right;">Acciones</th>' +
                '</tr></thead><tbody id="alaTbody">' +
                renderFilasAlarmas(alarmas, onlineSec) +
                '</tbody></table>' +
                '<div class="table-empty" id="alaEmpty" style="display:none;">No hay alarmas que coincidan con la búsqueda.</div>' +
            '</div>' +
            '<div class="text-muted text-sm" style="margin-top:10px;">' +
                'Mostrando ' + alarmas.length + ' resultado(s) (límite ' + alarmasFiltros.limit + ').' +
            '</div>' +

            modalAlarmaHtml(comunidades) +
            modalFiltrosAlarmasHtml(comunidades) +
            modalConsultarAlarmaHtml() +
            confirmDeleteAlarmaHtml();

        wireAlarmasView();
    }

    function renderFilasAlarmas(alarmas, onlineSec) {
        if (!alarmas.length) {
            return '<tr><td colspan="7" class="table-empty">No hay alarmas cargadas.</td></tr>';
        }
        return alarmas.map(function (a) {
            var online = a.latido && ((Date.now() - new Date(a.latido).getTime()) / 1000 <= onlineSec);
            var activa = parseInt(a.estado, 10) === 1;
            var busq   = String((a.nombre || '') + ' ' + (a.identidad || '') + ' ' + (a.domicilio || '') + ' ' + (a.comunidad_nombre || '')).toLowerCase().trim();
            return '<tr data-id="' + a.id + '" data-search="' + e(busq) + '">' +
                '<td class="td-id">#' + a.id + '</td>' +
                '<td>' +
                    '<div class="td-nombre">' + e(a.nombre || '—') + '</div>' +
                    (a.domicilio ? '<div class="td-id">' + e(a.domicilio) + '</div>' : '') +
                '</td>' +
                '<td>' + e(a.comunidad_nombre || '—') + '</td>' +
                '<td>' + e(a.identidad || '—') + '</td>' +
                '<td>' +
                    (a.latido
                        ? (online
                            ? '<span class="badge badge-success">Online</span>'
                            : '<span class="badge badge-danger">Offline</span>')
                        : '<span class="badge badge-warn">Sin datos</span>') +
                    '<div class="td-id">' + e(timeAgo(a.latido)) + '</div>' +
                '</td>' +
                '<td>' +
                    (activa
                        ? '<span class="badge badge-success">Activa</span>'
                        : '<span class="badge badge-danger">Inactiva</span>') +
                '</td>' +
                '<td>' +
                    '<div class="actions" style="justify-content:flex-end;">' +
                        '<button class="btn-icon-sm" data-act="view"   type="button" title="Consultar"><i class="fa-solid fa-eye"></i></button>' +
                        '<button class="btn-icon-sm" data-act="edit"   type="button" title="Editar"><i class="fa-solid fa-pencil"></i></button>' +
                        '<button class="btn-icon-sm" data-act="delete" type="button" title="Eliminar"><i class="fa-solid fa-trash"></i></button>' +
                    '</div>' +
                '</td>' +
            '</tr>';
        }).join('');
    }

    function modalAlarmaHtml(comunidades) {
        var opts = comunidades.map(function (c) {
            return '<option value="' + c.id + '">' + e(c.nombre) + '</option>';
        }).join('');

        return '<div class="modal-backdrop" id="alaModal"><div class="modal">' +
            '<div class="modal-header">' +
                '<div class="modal-title">' +
                    '<span id="alaModalTitulo">Nueva alarma</span>' +
                    '<span class="modal-subtitle" id="alaModalSub"></span>' +
                '</div>' +
                '<button class="btn-icon-sm" data-act="close" type="button" aria-label="Cerrar">&times;</button>' +
            '</div>' +
            '<form id="alaForm" novalidate>' +
                '<input type="hidden" id="alaId" value="">' +
                '<div class="modal-body">' +
                    '<div class="alert alert-error" id="alaError" style="display:none;"></div>' +
                    '<div class="form-row">' +
                        '<div class="form-group"><label for="ala-nombre">Nombre</label>' +
                            '<input id="ala-nombre" name="nombre" type="text" maxlength="255" required></div>' +
                        '<div class="form-group"><label for="ala-comunidad">Comunidad</label>' +
                            '<select id="ala-comunidad" name="comunidad" required>' +
                                '<option value="">— Seleccionar —</option>' + opts +
                            '</select></div>' +
                    '</div>' +
                    '<div class="form-row">' +
                        '<div class="form-group"><label for="ala-identidad">Identidad</label>' +
                            '<input id="ala-identidad" name="identidad" type="text" maxlength="50" placeholder="UID"></div>' +
                        '<div class="form-group"><label for="ala-tipo">Tipo</label>' +
                            '<input id="ala-tipo" name="tipo" type="text" maxlength="1" placeholder="A/B/C..."></div>' +
                    '</div>' +
                    '<div class="form-row">' +
                        '<div class="form-group" style="flex:1 1 100%;"><label for="ala-domicilio">Domicilio</label>' +
                            '<input id="ala-domicilio" name="domicilio" type="text" maxlength="255"></div>' +
                    '</div>' +
                    '<div class="form-row">' +
                        '<div class="form-group"><label for="ala-ciudad">Ciudad</label>' +
                            '<input id="ala-ciudad" name="ciudad" type="text" maxlength="50"></div>' +
                        '<div class="form-group"><label>Estado</label>' +
                            '<label class="toggle-switch" style="margin-top:6px;">' +
                                '<input id="ala-estado" name="estado" type="checkbox" value="1" checked>' +
                                '<span class="toggle-track"><span class="toggle-thumb"></span></span>' +
                                '<span class="toggle-label" id="alaEstadoLabel">Activa</span>' +
                            '</label></div>' +
                    '</div>' +
                    '<div class="form-row form-row-3">' +
                        '<div class="form-group"><label for="ala-hardware">Hardware</label>' +
                            '<input id="ala-hardware" name="hardware" type="text" maxlength="50"></div>' +
                        '<div class="form-group"><label for="ala-firmware">Firmware</label>' +
                            '<input id="ala-firmware" name="firmware" type="text" maxlength="50"></div>' +
                        '<div class="form-group"><label for="ala-revision">Revisión</label>' +
                            '<input id="ala-revision" name="revision" type="text" maxlength="50"></div>' +
                    '</div>' +
                    '<div class="form-row">' +
                        '<div class="form-group"><label for="ala-latitud">Latitud</label>' +
                            '<input id="ala-latitud" name="latitud" type="text" maxlength="255" placeholder="-34.6037"></div>' +
                        '<div class="form-group"><label for="ala-longitud">Longitud</label>' +
                            '<input id="ala-longitud" name="longitud" type="text" maxlength="255" placeholder="-58.3816"></div>' +
                    '</div>' +
                '</div>' +
                '<div class="modal-footer">' +
                    '<button type="button" class="btn btn-ghost" data-act="close">Cancelar</button>' +
                    '<button type="submit" class="btn btn-primary" id="alaGuardar">Guardar</button>' +
                '</div>' +
            '</form>' +
        '</div></div>';
    }

    function modalFiltrosAlarmasHtml(comunidades) {
        var optsCom = comunidades.map(function (c) {
            var sel = String(alarmasFiltros.comunidad) === String(c.id) ? ' selected' : '';
            return '<option value="' + c.id + '"' + sel + '>' + e(c.nombre) + '</option>';
        }).join('');
        function selOpt(value, label, current) {
            var sel = String(current) === String(value) ? ' selected' : '';
            return '<option value="' + e(value) + '"' + sel + '>' + e(label) + '</option>';
        }

        return '<div class="modal-backdrop" id="alaFiltrosModal"><div class="modal">' +
            '<div class="modal-header">' +
                '<div class="modal-title"><span>Filtros</span></div>' +
                '<button class="btn-icon-sm" data-act="close" type="button" aria-label="Cerrar">&times;</button>' +
            '</div>' +
            '<form id="alaFiltrosForm" novalidate>' +
                '<div class="modal-body">' +
                    '<div class="form-row">' +
                        '<div class="form-group"><label for="aflt-id">Código</label>' +
                            '<input id="aflt-id" type="number" min="1" step="1" inputmode="numeric" ' +
                                'placeholder="Código del registro" value="' + e(alarmasFiltros.filtro_id) + '"></div>' +
                        '<div class="form-group"><label for="aflt-nombre">Nombre</label>' +
                            '<input id="aflt-nombre" type="text" maxlength="255" ' +
                                'placeholder="Nombre de la alarma" value="' + e(alarmasFiltros.nombre) + '"></div>' +
                    '</div>' +
                    '<div class="form-row">' +
                        '<div class="form-group"><label for="aflt-comunidad">Comunidad</label>' +
                            '<select id="aflt-comunidad"><option value="">Todas</option>' + optsCom + '</select></div>' +
                        '<div class="form-group"><label for="aflt-conexion">Conexión</label>' +
                            '<select id="aflt-conexion">' +
                                selOpt('',        'Todas',   alarmasFiltros.conexion) +
                                selOpt('online',  'Online',  alarmasFiltros.conexion) +
                                selOpt('offline', 'Offline', alarmasFiltros.conexion) +
                            '</select></div>' +
                    '</div>' +
                    '<div class="form-row">' +
                        '<div class="form-group"><label for="aflt-estado">Estado</label>' +
                            '<select id="aflt-estado">' +
                                selOpt('',  'Todas',     alarmasFiltros.estado) +
                                selOpt('1', 'Activas',   alarmasFiltros.estado) +
                                selOpt('0', 'Inactivas', alarmasFiltros.estado) +
                            '</select></div>' +
                        '<div class="form-group"><label for="aflt-limit">Límite</label>' +
                            '<input id="aflt-limit" type="number" min="1" max="1000" step="1" ' +
                                'inputmode="numeric" value="' + e(alarmasFiltros.limit) + '"></div>' +
                    '</div>' +
                    '<div class="form-row">' +
                        '<div class="form-group"><label for="aflt-sort">Ordenar por</label>' +
                            '<select id="aflt-sort">' +
                                selOpt('id',          'Código',        alarmasFiltros.sort) +
                                selOpt('nombre',      'Nombre',        alarmasFiltros.sort) +
                                selOpt('comunidad',   'Comunidad',     alarmasFiltros.sort) +
                                selOpt('latido',      'Último latido', alarmasFiltros.sort) +
                                selOpt('instalacion', 'Instalación',   alarmasFiltros.sort) +
                            '</select></div>' +
                        '<div class="form-group"><label for="aflt-dir">Dirección</label>' +
                            '<select id="aflt-dir">' +
                                selOpt('desc', 'Descendente', alarmasFiltros.dir) +
                                selOpt('asc',  'Ascendente',  alarmasFiltros.dir) +
                            '</select></div>' +
                    '</div>' +
                '</div>' +
                '<div class="modal-footer">' +
                    '<button type="button" class="btn btn-ghost"     id="alaFiltrosReset" >Limpiar</button>' +
                    '<button type="button" class="btn btn-secondary" data-act="close"    >Cancelar</button>' +
                    '<button type="submit"  class="btn btn-primary"                       >Aplicar</button>' +
                '</div>' +
            '</form>' +
        '</div></div>';
    }

    function modalConsultarAlarmaHtml() {
        return '<div class="modal-backdrop" id="alaConsultar"><div class="modal">' +
            '<div class="modal-header">' +
                '<div class="modal-title">' +
                    '<span>Consultar alarma</span>' +
                    '<span class="modal-subtitle" id="alaConsultarSub"></span>' +
                '</div>' +
                '<button class="btn-icon-sm" data-act="close" type="button" aria-label="Cerrar">&times;</button>' +
            '</div>' +
            '<div class="modal-body">' +
                '<dl class="data-list" id="alaConsultarBody"></dl>' +
            '</div>' +
            '<div class="modal-footer">' +
                '<button type="button" class="btn btn-ghost" data-act="close">Cerrar</button>' +
            '</div>' +
        '</div></div>';
    }

    function confirmDeleteAlarmaHtml() {
        return '<div class="confirm-backdrop" id="alaConfirm"><div class="confirm-box">' +
            '<div class="confirm-title">Eliminar alarma</div>' +
            '<div class="confirm-msg" id="alaConfirmMsg">Esta acción no se puede deshacer.</div>' +
            '<div class="confirm-actions">' +
                '<button class="btn btn-ghost"  data-act="cancel" type="button">Cancelar</button>' +
                '<button class="btn btn-danger" id="alaConfirmBtn" type="button">Eliminar</button>' +
            '</div>' +
        '</div></div>';
    }

    function wireAlarmasView() {
        var tbody       = document.getElementById('alaTbody');
        var emptyState  = document.getElementById('alaEmpty');
        var searchInput = document.getElementById('alaSearch');
        var searchClear = document.getElementById('alaSearchClear');

        var modal       = document.getElementById('alaModal');
        var modalTitulo = document.getElementById('alaModalTitulo');
        var modalSub    = document.getElementById('alaModalSub');
        var modalError  = document.getElementById('alaError');
        var form        = document.getElementById('alaForm');
        var fId         = document.getElementById('alaId');
        var fEstado     = document.getElementById('ala-estado');
        var estadoLabel = document.getElementById('alaEstadoLabel');
        var btnGuardar  = document.getElementById('alaGuardar');

        var confirmBox = document.getElementById('alaConfirm');
        var confirmMsg = document.getElementById('alaConfirmMsg');
        var btnDelete  = document.getElementById('alaConfirmBtn');

        var filtrosModal = document.getElementById('alaFiltrosModal');
        var filtrosForm  = document.getElementById('alaFiltrosForm');

        var consultarModal = document.getElementById('alaConsultar');
        var consultarSub   = document.getElementById('alaConsultarSub');
        var consultarBody  = document.getElementById('alaConsultarBody');

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

        document.getElementById('alaFiltros').addEventListener('click', function () {
            filtrosModal.classList.add('open');
        });
        filtrosModal.addEventListener('click', function (ev) {
            if (ev.target === filtrosModal || ev.target.closest('[data-act="close"]')) {
                filtrosModal.classList.remove('open');
            }
        });
        document.getElementById('alaFiltrosReset').addEventListener('click', function () {
            alarmasFiltros.sort      = 'id';
            alarmasFiltros.dir       = 'desc';
            alarmasFiltros.limit     = 100;
            alarmasFiltros.filtro_id = '';
            alarmasFiltros.nombre    = '';
            alarmasFiltros.comunidad = '';
            alarmasFiltros.estado    = '';
            alarmasFiltros.conexion  = '';
            filtrosModal.classList.remove('open');
            navigate();
        });
        filtrosForm.addEventListener('submit', function (ev) {
            ev.preventDefault();
            alarmasFiltros.filtro_id = document.getElementById('aflt-id').value.trim();
            alarmasFiltros.nombre    = document.getElementById('aflt-nombre').value.trim();
            alarmasFiltros.comunidad = document.getElementById('aflt-comunidad').value;
            alarmasFiltros.conexion  = document.getElementById('aflt-conexion').value;
            alarmasFiltros.estado    = document.getElementById('aflt-estado').value;
            alarmasFiltros.limit     = parseInt(document.getElementById('aflt-limit').value, 10) || 100;
            alarmasFiltros.sort      = document.getElementById('aflt-sort').value || 'id';
            alarmasFiltros.dir       = document.getElementById('aflt-dir').value  || 'desc';
            filtrosModal.classList.remove('open');
            navigate();
        });

        consultarModal.addEventListener('click', function (ev) {
            if (ev.target === consultarModal || ev.target.closest('[data-act="close"]')) {
                consultarModal.classList.remove('open');
            }
        });

        async function abrirConsulta(id) {
            consultarSub.innerHTML  = '<code>#' + id + '</code>';
            consultarBody.innerHTML = '<div style="display:flex;justify-content:center;padding:24px"><div class="spin"></div></div>';
            consultarModal.classList.add('open');

            var a;
            try {
                a = await api('/api/alarmas.php?id=' + id);
            } catch (err) {
                consultarBody.innerHTML = '<div class="alert alert-error">' + e(err.message) + '</div>';
                return;
            }

            var estadoBadge = parseInt(a.estado, 10) === 1
                ? '<span class="badge badge-success">Activa</span>'
                : '<span class="badge badge-danger">Inactiva</span>';

            consultarSub.innerHTML  = '<code>#' + a.id + '</code>';
            consultarBody.innerHTML =
                abmRow    ('Código',              '<code>#' + a.id + '</code>') +
                abmRowTxt ('Nombre',               a.nombre) +
                abmRowRef ('Equipo',               a.equipo,    a.equipo_nombre || a.equipo_uuid, 'Sin equipo') +
                abmRowTxt ('Tipo',                 a.tipo,        'Sin tipo') +
                abmRowTxt ('Generación',           a.generacion,  'Sin generación') +
                abmRowTxt ('Hardware',             a.hardware,    'Sin hardware') +
                abmRowTxt ('Firmware',             a.firmware,    'Sin firmware') +
                abmRowTxt ('Revisión',             a.revision,    'Sin revisión') +
                abmRowTxt ('Prioridad',            a.prioridad,   'Sin prioridad') +
                abmRowTxt ('Altura',               a.altura,      'Sin altura') +
                abmRowTxt ('Comunicación',         a.comunicacion,'Sin comunicación') +
                abmRowTxt ('Propagación',          a.propagacion, 'Sin propagación') +
                abmRowTxt ('Identidad (UID)',      a.identidad,   'Sin identidad') +
                abmRowRef ('Comunidad',            a.comunidad,   a.comunidad_nombre, 'Sin comunidad') +
                abmRowTxt ('Domicilio',            a.domicilio,   'Sin domicilio') +
                abmRowTxt ('Ciudad',               a.ciudad,      'Sin ciudad') +
                abmRowSiNo('Foto',                 a.foto) +
                abmRowTxt ('Latitud',              a.latitud,     'Sin latitud') +
                abmRowTxt ('Longitud',             a.longitud,    'Sin longitud') +
                abmRowTxt ('Instalación',          abmFecha(a.instalacion),    'Sin instalación') +
                abmRowTxt ('Atendida',             abmFecha(a.atendida),       'No atendida') +
                abmRowTxt ('Garantía',             abmFecha(a.garantia),       'Sin garantía') +
                abmRowTxt ('Desinstalación',       abmFecha(a.desinstalacion), 'No desinstalada') +
                abmRowTxt ('Titularidad',          a.titularidad, 'Sin titularidad') +
                abmRow    ('Estado',               estadoBadge) +
                abmRowTxt ('Disuasión',            a.disuasion,   'Sin disuasión') +
                abmRowTxt ('Inicio',               abmFecha(a.inicio), 'Sin inicio') +
                abmRowTxt ('Último latido',        abmFecha(a.latido), 'Sin latido') +
                abmRowNum ('Energía',              a.energia) +
                abmRowNum ('Batería',              a.bateria) +
                abmRowNum ('Reinicios',            a.reinicios) +
                abmRowNum ('Señal',                a.senal) +
                abmRowNum ('Reconexiones',         a.reconexiones) +
                abmRowNum ('Salud',                a.salud) +
                abmRowTxt ('Último envío',         abmFecha(a.envio), 'Sin envío') +
                abmRowTxt ('Parámetros',           a.parametros,  'Sin parámetros');
        }

        function setEstadoLabel() {
            estadoLabel.textContent = fEstado.checked ? 'Activa' : 'Inactiva';
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

        document.getElementById('alaNuevo').addEventListener('click', function () {
            modoEdicion = false;
            resetForm();
            modalTitulo.textContent = 'Nueva alarma';
            modalSub.textContent    = '';
            openModal();
            document.getElementById('ala-nombre').focus();
        });

        tbody.addEventListener('click', async function (ev) {
            var btn = ev.target.closest('button[data-act]');
            if (!btn) return;
            var tr = btn.closest('tr[data-id]');
            if (!tr) return;
            var id = parseInt(tr.dataset.id, 10);

            if (btn.dataset.act === 'view') {
                abrirConsulta(id);
                return;
            }

            if (btn.dataset.act === 'edit') {
                try {
                    var a = await api('/api/alarmas.php?id=' + id);
                    modoEdicion = true;
                    resetForm();
                    fId.value = a.id;
                    modalTitulo.textContent = 'Editar alarma';
                    modalSub.textContent    = '#' + a.id;
                    document.getElementById('ala-nombre').value    = a.nombre    || '';
                    document.getElementById('ala-comunidad').value = a.comunidad != null ? a.comunidad : '';
                    document.getElementById('ala-identidad').value = a.identidad || '';
                    document.getElementById('ala-tipo').value      = a.tipo      || '';
                    document.getElementById('ala-domicilio').value = a.domicilio || '';
                    document.getElementById('ala-ciudad').value    = a.ciudad    || '';
                    document.getElementById('ala-hardware').value  = a.hardware  || '';
                    document.getElementById('ala-firmware').value  = a.firmware  || '';
                    document.getElementById('ala-revision').value  = a.revision  || '';
                    document.getElementById('ala-latitud').value   = a.latitud   || '';
                    document.getElementById('ala-longitud').value  = a.longitud  || '';
                    fEstado.checked = parseInt(a.estado, 10) === 1;
                    setEstadoLabel();
                    openModal();
                    document.getElementById('ala-nombre').focus();
                } catch (err) {
                    toast(err.message, true);
                }
                return;
            }

            if (btn.dataset.act === 'delete') {
                var nombre = (tr.querySelector('.td-nombre') || {}).textContent || ('#' + id);
                confirmMsg.textContent = '¿Eliminar la alarma "' + nombre.trim() + '"? Esta acción no se puede deshacer.';
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
                await api('/api/alarmas.php?id=' + pendingDeleteId, { method: 'DELETE' });
                toast('Alarma eliminada.');
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
                nombre:    document.getElementById('ala-nombre').value.trim(),
                comunidad: document.getElementById('ala-comunidad').value || null,
                identidad: document.getElementById('ala-identidad').value.trim(),
                tipo:      document.getElementById('ala-tipo').value.trim(),
                domicilio: document.getElementById('ala-domicilio').value.trim(),
                ciudad:    document.getElementById('ala-ciudad').value.trim(),
                hardware:  document.getElementById('ala-hardware').value.trim(),
                firmware:  document.getElementById('ala-firmware').value.trim(),
                revision:  document.getElementById('ala-revision').value.trim(),
                latitud:   document.getElementById('ala-latitud').value.trim(),
                longitud:  document.getElementById('ala-longitud').value.trim(),
                estado:    fEstado.checked ? 1 : 0
            };

            btnGuardar.disabled = true;
            try {
                if (modoEdicion) {
                    await api('/api/alarmas.php?id=' + encodeURIComponent(fId.value), {
                        method: 'PUT',
                        body:   payload
                    });
                    toast('Alarma actualizada.');
                } else {
                    await api('/api/alarmas.php', {
                        method: 'POST',
                        body:   payload
                    });
                    toast('Alarma creada.');
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

    // -------- Vista: Señales (solo lectura) -------------------------------

    var senalesFiltros = {
        sort:      'fecha',
        dir:       'desc',
        limit:     200,
        q:         '',
        estado:    '',
        prioridad: '',
        sentido:   '',
        procesada: '',
        desde:     '',
        hasta:     ''
    };

    function senalesQueryString() {
        var qs = [];
        Object.keys(senalesFiltros).forEach(function (k) {
            var v = senalesFiltros[k];
            if (v !== '' && v != null) {
                qs.push(encodeURIComponent(k) + '=' + encodeURIComponent(v));
            }
        });
        return qs.length ? ('?' + qs.join('&')) : '';
    }

    async function renderSenales(view) {
        var data    = await api('/api/senales.php' + senalesQueryString());
        var senales = data.senales || [];
        var kpis    = data.kpis    || {};

        var filtrosActivos = ['estado', 'prioridad', 'sentido', 'procesada', 'desde', 'hasta']
            .reduce(function (n, k) { return n + (senalesFiltros[k] !== '' ? 1 : 0); }, 0);
        var badgeFiltros = filtrosActivos
            ? ' <span class="badge badge-info" style="margin-left:6px;">' + filtrosActivos + '</span>'
            : '';

        view.innerHTML =
            '<div class="page-header"><div>' +
                '<h1>Señales</h1>' +
                '<p>Bitácora de señales recibidas y procesadas por la plataforma.</p>' +
            '</div></div>' +

            '<div class="stats-bar">' +
                statCard('Total',      kpis.total      || 0, 'orange', 'Señales registradas') +
                statCard('Pendientes', kpis.pendientes || 0, 'red',    'Sin procesar') +
                statCard('Hoy',        kpis.hoy        || 0, 'green',  'Recibidas hoy') +
            '</div>' +

            '<div class="toolbar">' +
                '<div class="toolbar-left">' +
                    '<div class="search-wrap">' +
                        '<input type="search" id="senSearch" class="search-input" placeholder="Buscar texto o propagación..." value="' + e(senalesFiltros.q) + '">' +
                        '<button class="search-clear" id="senSearchClear" type="button" style="' + (senalesFiltros.q ? '' : 'display:none;') + '">&times;</button>' +
                    '</div>' +
                    '<button class="btn btn-secondary" id="senFiltros" type="button">' +
                        '<i class="fa-solid fa-filter"></i> Filtros' + badgeFiltros +
                    '</button>' +
                '</div>' +
            '</div>' +

            '<div class="table-card">' +
                '<table><thead><tr>' +
                    '<th>ID</th><th>Fecha</th><th>Sentido</th><th>Propagación</th>' +
                    '<th>Prioridad</th><th>Texto</th><th>Intentos</th>' +
                    '<th>Procesada</th><th>Estado</th>' +
                '</tr></thead><tbody id="senTbody">' +
                renderFilasSenales(senales) +
                '</tbody></table>' +
            '</div>' +
            '<div class="text-muted text-sm" style="margin-top:10px;">' +
                'Mostrando ' + senales.length + ' resultado(s) (límite ' + senalesFiltros.limit + ').' +
            '</div>' +

            modalFiltrosSenalesHtml();

        wireSenalesView();
    }

    function renderFilasSenales(senales) {
        if (!senales.length) {
            return '<tr><td colspan="9" class="table-empty">No hay señales que coincidan con el filtro.</td></tr>';
        }
        return senales.map(function (s) {
            var texto = (s.texto || '').length > 80 ? (s.texto.substring(0, 80) + '…') : (s.texto || '');
            return '<tr>' +
                '<td class="td-id">#' + s.id + '</td>' +
                '<td>' + e(s.fecha || '—') + '</td>' +
                '<td>' + e(s.sentido || '—') + '</td>' +
                '<td>' + e(s.propagacion || '—') + '</td>' +
                '<td>' + e(s.prioridad || '—') + '</td>' +
                '<td title="' + e(s.texto || '') + '">' + e(texto || '—') + '</td>' +
                '<td>' + (s.intentos != null ? e(String(s.intentos)) : '—') + '</td>' +
                '<td>' +
                    (s.procesada
                        ? '<span class="badge badge-success">' + e(s.procesada) + '</span>'
                        : '<span class="badge badge-warn">Pendiente</span>') +
                '</td>' +
                '<td>' + e(s.estado || '—') + '</td>' +
            '</tr>';
        }).join('');
    }

    function modalFiltrosSenalesHtml() {
        function selOpt(value, label, current) {
            var sel = String(current) === String(value) ? ' selected' : '';
            return '<option value="' + e(value) + '"' + sel + '>' + e(label) + '</option>';
        }
        return '<div class="modal-backdrop" id="senFiltrosModal"><div class="modal">' +
            '<div class="modal-header">' +
                '<div class="modal-title"><span>Filtros</span></div>' +
                '<button class="btn-icon-sm" data-act="close" type="button" aria-label="Cerrar">&times;</button>' +
            '</div>' +
            '<form id="senFiltrosForm" novalidate>' +
                '<div class="modal-body">' +
                    '<div class="form-row">' +
                        '<div class="form-group"><label for="sflt-sentido">Sentido</label>' +
                            '<input id="sflt-sentido" type="text" maxlength="1" value="' + e(senalesFiltros.sentido) + '" placeholder="1 carácter"></div>' +
                        '<div class="form-group"><label for="sflt-prioridad">Prioridad</label>' +
                            '<input id="sflt-prioridad" type="text" maxlength="1" value="' + e(senalesFiltros.prioridad) + '" placeholder="1 carácter"></div>' +
                    '</div>' +
                    '<div class="form-row">' +
                        '<div class="form-group"><label for="sflt-estado">Estado</label>' +
                            '<input id="sflt-estado" type="text" maxlength="1" value="' + e(senalesFiltros.estado) + '" placeholder="1 carácter"></div>' +
                        '<div class="form-group"><label for="sflt-procesada">Procesada</label>' +
                            '<select id="sflt-procesada">' +
                                selOpt('',   'Todas',       senalesFiltros.procesada) +
                                selOpt('si', 'Procesadas',  senalesFiltros.procesada) +
                                selOpt('no', 'Pendientes',  senalesFiltros.procesada) +
                            '</select></div>' +
                    '</div>' +
                    '<div class="form-row">' +
                        '<div class="form-group"><label for="sflt-desde">Desde</label>' +
                            '<input id="sflt-desde" type="date" value="' + e(senalesFiltros.desde) + '"></div>' +
                        '<div class="form-group"><label for="sflt-hasta">Hasta</label>' +
                            '<input id="sflt-hasta" type="date" value="' + e(senalesFiltros.hasta) + '"></div>' +
                    '</div>' +
                    '<div class="form-row">' +
                        '<div class="form-group"><label for="sflt-sort">Ordenar por</label>' +
                            '<select id="sflt-sort">' +
                                selOpt('fecha',     'Fecha',     senalesFiltros.sort) +
                                selOpt('id',        'ID',        senalesFiltros.sort) +
                                selOpt('procesada', 'Procesada', senalesFiltros.sort) +
                                selOpt('intentos',  'Intentos',  senalesFiltros.sort) +
                            '</select></div>' +
                        '<div class="form-group"><label for="sflt-dir">Dirección</label>' +
                            '<select id="sflt-dir">' +
                                selOpt('desc', 'Descendente', senalesFiltros.dir) +
                                selOpt('asc',  'Ascendente',  senalesFiltros.dir) +
                            '</select></div>' +
                    '</div>' +
                    '<div class="form-row">' +
                        '<div class="form-group"><label for="sflt-limit">Límite de resultados</label>' +
                            '<select id="sflt-limit">' +
                                selOpt('50',   '50',   senalesFiltros.limit) +
                                selOpt('100',  '100',  senalesFiltros.limit) +
                                selOpt('200',  '200',  senalesFiltros.limit) +
                                selOpt('500',  '500',  senalesFiltros.limit) +
                                selOpt('1000', '1000', senalesFiltros.limit) +
                            '</select></div>' +
                    '</div>' +
                '</div>' +
                '<div class="modal-footer">' +
                    '<button type="button" class="btn btn-ghost"     id="senFiltrosReset">Limpiar</button>' +
                    '<button type="button" class="btn btn-secondary" data-act="close"   >Cancelar</button>' +
                    '<button type="submit"  class="btn btn-primary"                      >Aplicar</button>' +
                '</div>' +
            '</form>' +
        '</div></div>';
    }

    function wireSenalesView() {
        var searchInput  = document.getElementById('senSearch');
        var searchClear  = document.getElementById('senSearchClear');
        var filtrosModal = document.getElementById('senFiltrosModal');
        var filtrosForm  = document.getElementById('senFiltrosForm');

        var searchTimer = null;
        function dispatchSearch() {
            senalesFiltros.q = searchInput.value.trim();
            searchClear.style.display = senalesFiltros.q ? '' : 'none';
            navigate();
        }
        searchInput.addEventListener('input', function () {
            if (searchTimer) clearTimeout(searchTimer);
            searchTimer = setTimeout(dispatchSearch, 350);
        });
        searchInput.addEventListener('keydown', function (ev) {
            if (ev.key === 'Enter') {
                ev.preventDefault();
                if (searchTimer) clearTimeout(searchTimer);
                dispatchSearch();
            }
        });
        searchClear.addEventListener('click', function () {
            searchInput.value = '';
            if (searchTimer) clearTimeout(searchTimer);
            dispatchSearch();
            searchInput.focus();
        });

        document.getElementById('senFiltros').addEventListener('click', function () {
            filtrosModal.classList.add('open');
        });
        filtrosModal.addEventListener('click', function (ev) {
            if (ev.target === filtrosModal || ev.target.closest('[data-act="close"]')) {
                filtrosModal.classList.remove('open');
            }
        });
        document.getElementById('senFiltrosReset').addEventListener('click', function () {
            senalesFiltros.sort      = 'fecha';
            senalesFiltros.dir       = 'desc';
            senalesFiltros.limit     = 200;
            senalesFiltros.estado    = '';
            senalesFiltros.prioridad = '';
            senalesFiltros.sentido   = '';
            senalesFiltros.procesada = '';
            senalesFiltros.desde     = '';
            senalesFiltros.hasta     = '';
            filtrosModal.classList.remove('open');
            navigate();
        });
        filtrosForm.addEventListener('submit', function (ev) {
            ev.preventDefault();
            senalesFiltros.sentido   = document.getElementById('sflt-sentido').value.trim();
            senalesFiltros.prioridad = document.getElementById('sflt-prioridad').value.trim();
            senalesFiltros.estado    = document.getElementById('sflt-estado').value.trim();
            senalesFiltros.procesada = document.getElementById('sflt-procesada').value;
            senalesFiltros.desde     = document.getElementById('sflt-desde').value;
            senalesFiltros.hasta     = document.getElementById('sflt-hasta').value;
            senalesFiltros.sort      = document.getElementById('sflt-sort').value || 'fecha';
            senalesFiltros.dir       = document.getElementById('sflt-dir').value  || 'desc';
            senalesFiltros.limit     = parseInt(document.getElementById('sflt-limit').value, 10) || 200;
            filtrosModal.classList.remove('open');
            navigate();
        });
    }

    // -------- Vista: Equipos ----------------------------------------------

    var equiposFiltros = {
        sort:       'id',
        dir:        'desc',
        limit:      100,
        filtro_id:  '',
        nombre:     '',
        agente:     '',
        tipo:       '',
        habilitado: '',
        asignado:   ''
    };

    function equiposQueryString() {
        var qs = [];
        Object.keys(equiposFiltros).forEach(function (k) {
            var v = equiposFiltros[k];
            if (v !== '' && v != null) {
                qs.push(encodeURIComponent(k) + '=' + encodeURIComponent(v));
            }
        });
        return qs.length ? ('?' + qs.join('&')) : '';
    }

    async function renderEquipos(view) {
        var data    = await api('/api/equipos.php' + equiposQueryString());
        var equipos = data.equipos || [];
        var kpis    = data.kpis    || {};
        var agentes = data.agentes || [];
        var chips   = data.chips   || [];

        var filtrosActivos = (equiposFiltros.filtro_id  !== '' ? 1 : 0) +
                             (equiposFiltros.nombre     !== '' ? 1 : 0) +
                             (equiposFiltros.agente     !== '' ? 1 : 0) +
                             (equiposFiltros.tipo       !== '' ? 1 : 0) +
                             (equiposFiltros.habilitado !== '' ? 1 : 0) +
                             (equiposFiltros.asignado   !== '' ? 1 : 0);
        var badgeFiltros = filtrosActivos
            ? ' <span class="badge badge-info" style="margin-left:6px;">' + filtrosActivos + '</span>'
            : '';

        view.innerHTML =
            '<div class="page-header"><div>' +
                '<h1>Equipos</h1>' +
                '<p>Inventario de equipos asignables a alarmas y comunidades.</p>' +
            '</div></div>' +

            '<div class="stats-bar">' +
                statCard('Total',        kpis.total       || 0, 'orange', 'Equipos registrados') +
                statCard('Habilitados',  kpis.habilitados || 0, 'green',  'Habilitado = Sí') +
                statCard('Asignados',    kpis.asignados   || 0, 'green',  'Asignado = Sí') +
                statCard('Sin asignar',  kpis.sin_asignar || 0, 'red',    'Disponibles para asignar') +
            '</div>' +

            '<div class="toolbar">' +
                '<div class="toolbar-left">' +
                    '<div class="search-wrap">' +
                        '<input type="search" id="eqSearch" class="search-input" placeholder="Buscar nombre, UUID, serial...">' +
                        '<button class="search-clear" id="eqSearchClear" type="button" style="display:none;">&times;</button>' +
                    '</div>' +
                    '<button class="btn btn-secondary" id="eqFiltros" type="button">' +
                        '<i class="fa-solid fa-filter"></i> Filtros' + badgeFiltros +
                    '</button>' +
                '</div>' +
                '<div class="toolbar-right">' +
                    '<button class="btn btn-primary" id="eqNuevo" type="button">+ Nuevo equipo</button>' +
                '</div>' +
            '</div>' +

            '<div class="table-card">' +
                '<table><thead><tr>' +
                    '<th>Código</th><th>Nombre</th><th>Agente</th><th>Tipo</th><th>Serial / Firmware</th>' +
                    '<th>Asignado</th><th>Habilitado</th>' +
                    '<th style="text-align:right;">Acciones</th>' +
                '</tr></thead><tbody id="eqTbody">' +
                renderFilasEquipos(equipos) +
                '</tbody></table>' +
                '<div class="table-empty" id="eqEmpty" style="display:none;">No hay equipos que coincidan con la búsqueda.</div>' +
            '</div>' +
            '<div class="text-muted text-sm" style="margin-top:10px;">' +
                'Mostrando ' + equipos.length + ' resultado(s) (límite ' + equiposFiltros.limit + ').' +
            '</div>' +

            modalEquipoHtml(agentes, chips) +
            modalFiltrosEquiposHtml(agentes) +
            modalConsultarEquipoHtml() +
            confirmDeleteEquipoHtml();

        wireEquiposView();
    }

    function renderFilasEquipos(equipos) {
        if (!equipos.length) {
            return '<tr><td colspan="8" class="table-empty">No hay equipos cargados.</td></tr>';
        }
        return equipos.map(function (eq) {
            var habilitado = String(eq.habilitado || '').toUpperCase() === 'S';
            var asignado   = String(eq.asignado   || '').toUpperCase() === 'S';
            var busq = String(
                (eq.nombre || '') + ' ' + (eq.uuid || '') + ' ' + (eq.serial || '') + ' ' +
                (eq.agente_nombre || '') + ' ' + (eq.hardware || '') + ' ' + (eq.firmware || '')
            ).toLowerCase().trim();
            return '<tr data-id="' + eq.id + '" data-search="' + e(busq) + '">' +
                '<td class="td-id">#' + eq.id + '</td>' +
                '<td>' +
                    '<div class="td-nombre">' + e(eq.nombre || '—') + '</div>' +
                    (eq.uuid ? '<div class="td-id">' + e(eq.uuid) + '</div>' : '') +
                '</td>' +
                '<td>' + e(eq.agente_nombre || '—') + '</td>' +
                '<td>' + e(eq.tipo || '—') + '</td>' +
                '<td>' +
                    '<div>' + e(eq.serial || '—') + '</div>' +
                    '<div class="td-id">' +
                        e(eq.hardware || '—') +
                        (eq.firmware ? ' · fw ' + e(eq.firmware) : '') +
                    '</div>' +
                '</td>' +
                '<td>' +
                    (asignado
                        ? '<span class="badge badge-success">Sí</span>'
                        : '<span class="badge badge-warn">No</span>') +
                '</td>' +
                '<td>' +
                    (habilitado
                        ? '<span class="badge badge-success">Sí</span>'
                        : '<span class="badge badge-danger">No</span>') +
                '</td>' +
                '<td>' +
                    '<div class="actions" style="justify-content:flex-end;">' +
                        '<button class="btn-icon-sm" data-act="view"   type="button" title="Consultar"><i class="fa-solid fa-eye"></i></button>' +
                        '<button class="btn-icon-sm" data-act="edit"   type="button" title="Editar"><i class="fa-solid fa-pencil"></i></button>' +
                        '<button class="btn-icon-sm" data-act="delete" type="button" title="Eliminar"><i class="fa-solid fa-trash"></i></button>' +
                    '</div>' +
                '</td>' +
            '</tr>';
        }).join('');
    }

    function modalEquipoHtml(agentes, chips) {
        var optsAgente = agentes.map(function (a) {
            return '<option value="' + a.id + '">' + e(a.nombre || ('#' + a.id)) + '</option>';
        }).join('');
        var optsChip = chips.map(function (c) {
            var etq = (c.serie || ('#' + c.id)) + (c.telefono ? ' · ' + c.telefono : '');
            return '<option value="' + c.id + '">' + e(etq) + '</option>';
        }).join('');

        return '<div class="modal-backdrop" id="eqModal"><div class="modal">' +
            '<div class="modal-header">' +
                '<div class="modal-title">' +
                    '<span id="eqModalTitulo">Nuevo equipo</span>' +
                    '<span class="modal-subtitle" id="eqModalSub"></span>' +
                '</div>' +
                '<button class="btn-icon-sm" data-act="close" type="button" aria-label="Cerrar">&times;</button>' +
            '</div>' +
            '<form id="eqForm" novalidate>' +
                '<input type="hidden" id="eqId" value="">' +
                '<div class="modal-body">' +
                    '<div class="alert alert-error" id="eqError" style="display:none;"></div>' +
                    '<div class="form-row">' +
                        '<div class="form-group"><label for="eq-nombre">Nombre</label>' +
                            '<input id="eq-nombre" name="nombre" type="text" maxlength="100"></div>' +
                        '<div class="form-group"><label for="eq-uuid">UUID</label>' +
                            '<input id="eq-uuid" name="uuid" type="text" maxlength="50" placeholder="Identificador único"></div>' +
                    '</div>' +
                    '<div class="form-row">' +
                        '<div class="form-group"><label for="eq-agente">Agente</label>' +
                            '<select id="eq-agente" name="agente">' +
                                '<option value="">— Sin agente —</option>' + optsAgente +
                            '</select></div>' +
                        '<div class="form-group"><label for="eq-tipo">Tipo</label>' +
                            '<input id="eq-tipo" name="tipo" type="text" maxlength="1" placeholder="A/B/C..."></div>' +
                    '</div>' +
                    '<div class="form-row form-row-3">' +
                        '<div class="form-group"><label for="eq-serial">Serial</label>' +
                            '<input id="eq-serial" name="serial" type="text" maxlength="50"></div>' +
                        '<div class="form-group"><label for="eq-hardware">Hardware</label>' +
                            '<input id="eq-hardware" name="hardware" type="text" maxlength="50"></div>' +
                        '<div class="form-group"><label for="eq-firmware">Firmware</label>' +
                            '<input id="eq-firmware" name="firmware" type="text" maxlength="50"></div>' +
                    '</div>' +
                    '<div class="form-row">' +
                        '<div class="form-group"><label for="eq-chip">Chip</label>' +
                            '<select id="eq-chip" name="chip">' +
                                '<option value="">— Sin chip —</option>' + optsChip +
                            '</select></div>' +
                        '<div class="form-group"><label for="eq-control">Control (ID)</label>' +
                            '<input id="eq-control" name="control" type="number" min="0" step="1"></div>' +
                    '</div>' +
                    '<div class="form-row">' +
                        '<div class="form-group" style="flex:1 1 100%;"><label for="eq-parametros">Parámetros</label>' +
                            '<input id="eq-parametros" name="parametros" type="text" maxlength="255" placeholder="Cadena libre (opcional)"></div>' +
                    '</div>' +
                    '<div class="form-row">' +
                        '<div class="form-group"><label>Asignado</label>' +
                            '<label class="toggle-switch" style="margin-top:6px;">' +
                                '<input id="eq-asignado" name="asignado" type="checkbox" value="1">' +
                                '<span class="toggle-track"><span class="toggle-thumb"></span></span>' +
                                '<span class="toggle-label" id="eqAsignadoLabel">No</span>' +
                            '</label></div>' +
                        '<div class="form-group"><label>Habilitado</label>' +
                            '<label class="toggle-switch" style="margin-top:6px;">' +
                                '<input id="eq-habilitado" name="habilitado" type="checkbox" value="1" checked>' +
                                '<span class="toggle-track"><span class="toggle-thumb"></span></span>' +
                                '<span class="toggle-label" id="eqHabilitadoLabel">Sí</span>' +
                            '</label></div>' +
                    '</div>' +
                '</div>' +
                '<div class="modal-footer">' +
                    '<button type="button" class="btn btn-ghost" data-act="close">Cancelar</button>' +
                    '<button type="submit" class="btn btn-primary" id="eqGuardar">Guardar</button>' +
                '</div>' +
            '</form>' +
        '</div></div>';
    }

    function modalFiltrosEquiposHtml(agentes) {
        var optsAgente = agentes.map(function (a) {
            var sel = String(equiposFiltros.agente) === String(a.id) ? ' selected' : '';
            return '<option value="' + a.id + '"' + sel + '>' + e(a.nombre || ('#' + a.id)) + '</option>';
        }).join('');
        function selOpt(value, label, current) {
            var sel = String(current) === String(value) ? ' selected' : '';
            return '<option value="' + e(value) + '"' + sel + '>' + e(label) + '</option>';
        }

        return '<div class="modal-backdrop" id="eqFiltrosModal"><div class="modal">' +
            '<div class="modal-header">' +
                '<div class="modal-title"><span>Filtros</span></div>' +
                '<button class="btn-icon-sm" data-act="close" type="button" aria-label="Cerrar">&times;</button>' +
            '</div>' +
            '<form id="eqFiltrosForm" novalidate>' +
                '<div class="modal-body">' +
                    '<div class="form-row">' +
                        '<div class="form-group"><label for="eflt-id">Código</label>' +
                            '<input id="eflt-id" type="number" min="1" step="1" inputmode="numeric" ' +
                                'placeholder="Código del registro" value="' + e(equiposFiltros.filtro_id) + '"></div>' +
                        '<div class="form-group"><label for="eflt-nombre">Nombre</label>' +
                            '<input id="eflt-nombre" type="text" maxlength="100" ' +
                                'placeholder="Nombre del equipo" value="' + e(equiposFiltros.nombre) + '"></div>' +
                    '</div>' +
                    '<div class="form-row">' +
                        '<div class="form-group"><label for="eflt-agente">Agente</label>' +
                            '<select id="eflt-agente"><option value="">Todos</option>' + optsAgente + '</select></div>' +
                        '<div class="form-group"><label for="eflt-tipo">Tipo</label>' +
                            '<input id="eflt-tipo" type="text" maxlength="1" value="' + e(equiposFiltros.tipo) + '" placeholder="A/B/C..."></div>' +
                    '</div>' +
                    '<div class="form-row">' +
                        '<div class="form-group"><label for="eflt-habilitado">Habilitado</label>' +
                            '<select id="eflt-habilitado">' +
                                selOpt('',  'Todos', equiposFiltros.habilitado) +
                                selOpt('S', 'Sí',    equiposFiltros.habilitado) +
                                selOpt('N', 'No',    equiposFiltros.habilitado) +
                            '</select></div>' +
                        '<div class="form-group"><label for="eflt-asignado">Asignado</label>' +
                            '<select id="eflt-asignado">' +
                                selOpt('',  'Todos', equiposFiltros.asignado) +
                                selOpt('S', 'Sí',    equiposFiltros.asignado) +
                                selOpt('N', 'No',    equiposFiltros.asignado) +
                            '</select></div>' +
                    '</div>' +
                    '<div class="form-row">' +
                        '<div class="form-group"><label for="eflt-limit">Límite</label>' +
                            '<input id="eflt-limit" type="number" min="1" max="1000" step="1" ' +
                                'inputmode="numeric" value="' + e(equiposFiltros.limit) + '"></div>' +
                    '</div>' +
                    '<div class="form-row">' +
                        '<div class="form-group"><label for="eflt-sort">Ordenar por</label>' +
                            '<select id="eflt-sort">' +
                                selOpt('id',         'Código',     equiposFiltros.sort) +
                                selOpt('nombre',     'Nombre',     equiposFiltros.sort) +
                                selOpt('agente',     'Agente',     equiposFiltros.sort) +
                                selOpt('tipo',       'Tipo',       equiposFiltros.sort) +
                                selOpt('serial',     'Serial',     equiposFiltros.sort) +
                                selOpt('registrado', 'Registrado', equiposFiltros.sort) +
                            '</select></div>' +
                        '<div class="form-group"><label for="eflt-dir">Dirección</label>' +
                            '<select id="eflt-dir">' +
                                selOpt('desc', 'Descendente', equiposFiltros.dir) +
                                selOpt('asc',  'Ascendente',  equiposFiltros.dir) +
                            '</select></div>' +
                    '</div>' +
                '</div>' +
                '<div class="modal-footer">' +
                    '<button type="button" class="btn btn-ghost"     id="eqFiltrosReset" >Limpiar</button>' +
                    '<button type="button" class="btn btn-secondary" data-act="close"    >Cancelar</button>' +
                    '<button type="submit"  class="btn btn-primary"                       >Aplicar</button>' +
                '</div>' +
            '</form>' +
        '</div></div>';
    }

    function modalConsultarEquipoHtml() {
        return '<div class="modal-backdrop" id="eqConsultar"><div class="modal">' +
            '<div class="modal-header">' +
                '<div class="modal-title">' +
                    '<span>Consultar equipo</span>' +
                    '<span class="modal-subtitle" id="eqConsultarSub"></span>' +
                '</div>' +
                '<button class="btn-icon-sm" data-act="close" type="button" aria-label="Cerrar">&times;</button>' +
            '</div>' +
            '<div class="modal-body">' +
                '<dl class="data-list" id="eqConsultarBody"></dl>' +
            '</div>' +
            '<div class="modal-footer">' +
                '<button type="button" class="btn btn-ghost" data-act="close">Cerrar</button>' +
            '</div>' +
        '</div></div>';
    }

    function confirmDeleteEquipoHtml() {
        return '<div class="confirm-backdrop" id="eqConfirm"><div class="confirm-box">' +
            '<div class="confirm-title">Eliminar equipo</div>' +
            '<div class="confirm-msg" id="eqConfirmMsg">Esta acción no se puede deshacer.</div>' +
            '<div class="confirm-actions">' +
                '<button class="btn btn-ghost"  data-act="cancel" type="button">Cancelar</button>' +
                '<button class="btn btn-danger" id="eqConfirmBtn" type="button">Eliminar</button>' +
            '</div>' +
        '</div></div>';
    }

    function wireEquiposView() {
        var tbody       = document.getElementById('eqTbody');
        var emptyState  = document.getElementById('eqEmpty');
        var searchInput = document.getElementById('eqSearch');
        var searchClear = document.getElementById('eqSearchClear');

        var modal       = document.getElementById('eqModal');
        var modalTitulo = document.getElementById('eqModalTitulo');
        var modalSub    = document.getElementById('eqModalSub');
        var modalError  = document.getElementById('eqError');
        var form        = document.getElementById('eqForm');
        var fId         = document.getElementById('eqId');
        var fAsignado   = document.getElementById('eq-asignado');
        var fHabilitado = document.getElementById('eq-habilitado');
        var asigLabel   = document.getElementById('eqAsignadoLabel');
        var habLabel    = document.getElementById('eqHabilitadoLabel');
        var btnGuardar  = document.getElementById('eqGuardar');

        var confirmBox = document.getElementById('eqConfirm');
        var confirmMsg = document.getElementById('eqConfirmMsg');
        var btnDelete  = document.getElementById('eqConfirmBtn');

        var filtrosModal = document.getElementById('eqFiltrosModal');
        var filtrosForm  = document.getElementById('eqFiltrosForm');

        var consultarModal = document.getElementById('eqConsultar');
        var consultarSub   = document.getElementById('eqConsultarSub');
        var consultarBody  = document.getElementById('eqConsultarBody');

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

        document.getElementById('eqFiltros').addEventListener('click', function () {
            filtrosModal.classList.add('open');
        });
        filtrosModal.addEventListener('click', function (ev) {
            if (ev.target === filtrosModal || ev.target.closest('[data-act="close"]')) {
                filtrosModal.classList.remove('open');
            }
        });
        document.getElementById('eqFiltrosReset').addEventListener('click', function () {
            equiposFiltros.sort       = 'id';
            equiposFiltros.dir        = 'desc';
            equiposFiltros.limit      = 100;
            equiposFiltros.filtro_id  = '';
            equiposFiltros.nombre     = '';
            equiposFiltros.agente     = '';
            equiposFiltros.tipo       = '';
            equiposFiltros.habilitado = '';
            equiposFiltros.asignado   = '';
            filtrosModal.classList.remove('open');
            navigate();
        });
        filtrosForm.addEventListener('submit', function (ev) {
            ev.preventDefault();
            equiposFiltros.filtro_id  = document.getElementById('eflt-id').value.trim();
            equiposFiltros.nombre     = document.getElementById('eflt-nombre').value.trim();
            equiposFiltros.agente     = document.getElementById('eflt-agente').value;
            equiposFiltros.tipo       = document.getElementById('eflt-tipo').value.trim();
            equiposFiltros.habilitado = document.getElementById('eflt-habilitado').value;
            equiposFiltros.asignado   = document.getElementById('eflt-asignado').value;
            equiposFiltros.limit      = parseInt(document.getElementById('eflt-limit').value, 10) || 100;
            equiposFiltros.sort       = document.getElementById('eflt-sort').value || 'id';
            equiposFiltros.dir        = document.getElementById('eflt-dir').value  || 'desc';
            filtrosModal.classList.remove('open');
            navigate();
        });

        consultarModal.addEventListener('click', function (ev) {
            if (ev.target === consultarModal || ev.target.closest('[data-act="close"]')) {
                consultarModal.classList.remove('open');
            }
        });

        async function abrirConsulta(id) {
            consultarSub.innerHTML  = '<code>#' + id + '</code>';
            consultarBody.innerHTML = '<div style="display:flex;justify-content:center;padding:24px"><div class="spin"></div></div>';
            consultarModal.classList.add('open');

            var eq;
            try {
                eq = await api('/api/equipos.php?id=' + id);
            } catch (err) {
                consultarBody.innerHTML = '<div class="alert alert-error">' + e(err.message) + '</div>';
                return;
            }

            var asignBadge = String(eq.asignado || '').toUpperCase() === 'S'
                ? '<span class="badge badge-success">Sí</span>'
                : '<span class="badge badge-warn">No</span>';
            var habilBadge = String(eq.habilitado || '').toUpperCase() === 'S'
                ? '<span class="badge badge-success">Sí</span>'
                : '<span class="badge badge-danger">No</span>';
            var chipTxt = null;
            if (eq.chip != null) {
                chipTxt = (eq.chip_serie || ('#' + eq.chip)) + (eq.chip_telefono ? ' · ' + eq.chip_telefono : '');
            }

            consultarSub.innerHTML  = '<code>#' + eq.id + '</code>' + (eq.uuid ? ' · ' + e(eq.uuid) : '');
            consultarBody.innerHTML =
                abmRow    ('Código',              '<code>#' + eq.id + '</code>') +
                abmRowTxt ('UUID',                 eq.uuid,        'Sin UUID') +
                abmRowTxt ('Nombre',               eq.nombre,      'Sin nombre') +
                abmRowRef ('Agente',               eq.agente,      eq.agente_nombre, 'Sin agente') +
                abmRowTxt ('Tipo',                 eq.tipo,        'Sin tipo') +
                abmRowTxt ('Serial',               eq.serial,      'Sin serial') +
                abmRowTxt ('Hardware',             eq.hardware,    'Sin hardware') +
                abmRowTxt ('Firmware',             eq.firmware,    'Sin firmware') +
                abmRowTxt ('Chip',                 chipTxt,        'Sin chip') +
                abmRowTxt ('Fecha de registro',    abmFecha(eq.registrado), 'Sin registro') +
                abmRowTxt ('Control',              eq.control != null ? '#' + eq.control : null, 'Sin control') +
                abmRow    ('Asignado',             asignBadge) +
                abmRow    ('Habilitado',           habilBadge) +
                abmRowTxt ('Parámetros',           eq.parametros,  'Sin parámetros');
        }

        function setToggleLabels() {
            asigLabel.textContent = fAsignado.checked   ? 'Sí' : 'No';
            habLabel.textContent  = fHabilitado.checked ? 'Sí' : 'No';
        }
        fAsignado.addEventListener('change',   setToggleLabels);
        fHabilitado.addEventListener('change', setToggleLabels);

        function resetForm() {
            form.reset();
            fId.value = '';
            fAsignado.checked   = false;
            fHabilitado.checked = true;
            setToggleLabels();
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

        document.getElementById('eqNuevo').addEventListener('click', function () {
            modoEdicion = false;
            resetForm();
            modalTitulo.textContent = 'Nuevo equipo';
            modalSub.textContent    = '';
            openModal();
            document.getElementById('eq-nombre').focus();
        });

        tbody.addEventListener('click', async function (ev) {
            var btn = ev.target.closest('button[data-act]');
            if (!btn) return;
            var tr = btn.closest('tr[data-id]');
            if (!tr) return;
            var id = parseInt(tr.dataset.id, 10);

            if (btn.dataset.act === 'view') {
                abrirConsulta(id);
                return;
            }

            if (btn.dataset.act === 'edit') {
                try {
                    var eq = await api('/api/equipos.php?id=' + id);
                    modoEdicion = true;
                    resetForm();
                    fId.value = eq.id;
                    modalTitulo.textContent = 'Editar equipo';
                    modalSub.textContent    = '#' + eq.id + (eq.uuid ? ' · ' + eq.uuid : '');
                    document.getElementById('eq-nombre').value     = eq.nombre     || '';
                    document.getElementById('eq-uuid').value       = eq.uuid       || '';
                    document.getElementById('eq-agente').value     = eq.agente   != null ? eq.agente : '';
                    document.getElementById('eq-tipo').value       = eq.tipo       || '';
                    document.getElementById('eq-serial').value     = eq.serial     || '';
                    document.getElementById('eq-hardware').value   = eq.hardware   || '';
                    document.getElementById('eq-firmware').value   = eq.firmware   || '';
                    document.getElementById('eq-chip').value       = eq.chip     != null ? eq.chip : '';
                    document.getElementById('eq-control').value    = eq.control  != null ? eq.control : '';
                    document.getElementById('eq-parametros').value = eq.parametros || '';
                    fAsignado.checked   = String(eq.asignado   || '').toUpperCase() === 'S';
                    fHabilitado.checked = String(eq.habilitado || '').toUpperCase() === 'S';
                    setToggleLabels();
                    openModal();
                    document.getElementById('eq-nombre').focus();
                } catch (err) {
                    toast(err.message, true);
                }
                return;
            }

            if (btn.dataset.act === 'delete') {
                var nombre = (tr.querySelector('.td-nombre') || {}).textContent || ('#' + id);
                confirmMsg.textContent = '¿Eliminar el equipo "' + nombre.trim() + '"? Esta acción no se puede deshacer.';
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
                await api('/api/equipos.php?id=' + pendingDeleteId, { method: 'DELETE' });
                toast('Equipo eliminado.');
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

            var control = document.getElementById('eq-control').value;
            var payload = {
                nombre:     document.getElementById('eq-nombre').value.trim(),
                uuid:       document.getElementById('eq-uuid').value.trim(),
                agente:     document.getElementById('eq-agente').value || null,
                tipo:       document.getElementById('eq-tipo').value.trim(),
                serial:     document.getElementById('eq-serial').value.trim(),
                hardware:   document.getElementById('eq-hardware').value.trim(),
                firmware:   document.getElementById('eq-firmware').value.trim(),
                chip:       document.getElementById('eq-chip').value || null,
                control:    control === '' ? null : control,
                parametros: document.getElementById('eq-parametros').value.trim(),
                asignado:   fAsignado.checked   ? 1 : 0,
                habilitado: fHabilitado.checked ? 1 : 0
            };

            btnGuardar.disabled = true;
            try {
                if (modoEdicion) {
                    await api('/api/equipos.php?id=' + encodeURIComponent(fId.value), {
                        method: 'PUT',
                        body:   payload
                    });
                    toast('Equipo actualizado.');
                } else {
                    await api('/api/equipos.php', {
                        method: 'POST',
                        body:   payload
                    });
                    toast('Equipo creado.');
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
