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
        '/presupuestos': { title: 'Presupuestos',  render: renderPresupuestos },
        '/facturas':     { title: 'Facturas',      render: renderFacturas },
        '/recibos':      { title: 'Recibos',       render: renderRecibos },
        '/talonarios':   { title: 'Talonarios',    render: renderTalonarios },
        '/comunidades':  { title: 'Comunidades',   render: renderComunidades },
        '/casas':        { title: 'Casas',         render: renderCasas },
        '/alarmas':      { title: 'Alarmas',       render: renderAlarmas },
        '/equipos':      { title: 'Equipos',       render: renderEquipos },
        '/dispositivos': { title: 'Dispositivos',  render: renderTodo },
        '/disparos':     { title: 'Disparos',      render: renderDisparos },
        '/eventos':      { title: 'Eventos',       render: renderTodo },
        '/senales':      { title: 'Señales',       render: renderSenales },
        '/reportes':     { title: 'Reportes',      render: renderTodo },
        '/analizador':   { title: 'Analizador',    render: renderAnalizador },
        '/cuentas':      { title: 'Plan de cuentas', render: renderCuentas },
        '/usuarios':     { title: 'Usuarios',      render: renderUsuarios },
        '/roles':        { title: 'Roles',         render: renderRoles },
        '/permisos':     { title: 'Permisos',      render: renderPermisos },
        '/config':       { title: 'Herramientas',  render: renderConfig }
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
    function toast(msg, opts) {
        // Compat: segundo argumento acepta bool (isError) o {error, duration}.
        var isError = false;
        var duration = 2800;
        if (typeof opts === 'boolean') {
            isError = opts;
        } else if (opts && typeof opts === 'object') {
            isError = !!opts.error;
            if (typeof opts.duration === 'number') duration = opts.duration;
        }
        toastEl.textContent = msg;
        toastEl.classList.toggle('error', isError);
        toastEl.classList.add('show');
        if (toastTimer) clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, duration);
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

    // -------- Vista: Analizador (estadísticas comerciales) ----------------

    function fmtMoney(v) {
        var n = Number(v);
        if (!isFinite(n)) return '$0';
        return '$' + n.toLocaleString('es-AR', { maximumFractionDigits: 0 });
    }
    function fmtInt(v) {
        var n = Number(v);
        if (!isFinite(n)) return '0';
        return n.toLocaleString('es-AR');
    }
    function fmtMes(ym) {
        if (!ym) return '—';
        var p = String(ym).split('-');
        if (p.length !== 2) return String(ym);
        var meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
        var mi = parseInt(p[1], 10) - 1;
        return (meses[mi] || p[1]) + ' ' + p[0];
    }

    function analizadorGraficoMensualHTML(cfg) {
        var rows = cfg.rows || [];
        var maxMes = rows.reduce(function (m, r) {
            var t = Number(r.total) || 0;
            return t > m ? t : m;
        }, 0);
        var subtitulo = cfg.actualizado
            ? 'Últimos 12 meses · Actualizado ' + timeAgo(String(cfg.actualizado).replace(' ', 'T'))
            : 'Últimos 12 meses · Sin datos, presioná Refrescar';

        return '<div class="table-card">' +
                '<div class="dash-table-header">' +
                    '<div><div>' + e(cfg.titulo) + '</div>' +
                    '<div class="text-muted text-sm" style="font-weight:400;">' + e(subtitulo) + '</div></div>' +
                    '<button type="button" class="btn btn-ghost btn-sm" id="' + e(cfg.btnId) + '" title="' + e(cfg.btnTitle) + '">' +
                        '<i class="fa-solid fa-arrows-rotate"></i> Refrescar' +
                    '</button>' +
                '</div>' +
                '<table><thead><tr>' +
                    '<th>Mes</th><th>' + e(cfg.colCantidad) + '</th><th style="text-align:right">Total</th><th style="width:35%">Volumen</th>' +
                '</tr></thead><tbody>' +
                (rows.length === 0
                    ? '<tr><td colspan="4" class="table-empty">Sin datos. Presioná <b>Refrescar</b> para generar la caché.</td></tr>'
                    : rows.map(function (r) {
                        var t   = Number(r.total) || 0;
                        var pct = maxMes > 0 ? Math.round((t / maxMes) * 100) : 0;
                        return '<tr>' +
                            '<td><div class="td-nombre">' + e(fmtMes(r.mes)) + '</div></td>' +
                            '<td class="text-muted">' + fmtInt(r.cantidad || 0) + '</td>' +
                            '<td style="text-align:right;font-weight:600">' + fmtMoney(t) + '</td>' +
                            '<td>' +
                                '<div style="height:6px;background:var(--bg);border-radius:99px;overflow:hidden">' +
                                    '<div style="height:100%;width:' + pct + '%;background:' + e(cfg.barColor) + '"></div>' +
                                '</div>' +
                            '</td>' +
                        '</tr>';
                    }).join('')) +
                '</tbody></table>' +
            '</div>';
    }

    function analizadorBindRefresh(btnId, endpoint, okMsg, view) {
        var btn = document.getElementById(btnId);
        if (!btn) return;
        btn.addEventListener('click', async function () {
            btn.disabled = true;
            var label = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-arrows-rotate fa-spin"></i> Refrescando…';
            try {
                await api(endpoint, { method: 'POST' });
                toast(okMsg);
                await renderAnalizador(view);
            } catch (err) {
                btn.disabled = false;
                btn.innerHTML = label;
                toast(err.message || 'No se pudo refrescar.', true);
            }
        });
    }

    async function renderAnalizador(view) {
        var d = await api('/api/analizador.php');
        var k = d.kpis || {};
        var topCli  = d.top_clientes    || [];
        var recient = d.comprobantes_recientes || [];

        view.innerHTML =
            '<div class="page-header"><div>' +
                '<h1>Analizador</h1>' +
                '<p>Estadísticas comerciales del negocio.</p>' +
            '</div></div>' +

            '<div class="stats-bar">' +
                statCard('Facturado 30 días', fmtMoney(k.facturado_30d || 0), 'orange',
                         fmtInt(k.comprobantes_30d || 0) + ' comprobantes') +
                statCard('Facturado año',     fmtMoney(k.facturado_anio || 0), 'green',
                         fmtInt(k.comprobantes_anio || 0) + ' comprobantes') +
                statCard('Ticket promedio',   fmtMoney(k.ticket_promedio_30d || 0), 'orange',
                         'Últimos 30 días') +
                statCard('Clientes activos',  fmtInt(k.clientes_activos || 0), 'green',
                         fmtInt(k.clientes_con_deuda || 0) + ' con deuda') +
            '</div>' +

            '<div class="dash-grid">' +
                analizadorGraficoMensualHTML({
                    titulo:      'Cobros por mes',
                    rows:        d.cobros_por_mes || [],
                    actualizado: d.cobros_actualizado,
                    btnId:       'analRefrescarCobros',
                    btnTitle:    'Recalcular desde recibos (RX) emitidos',
                    colCantidad: 'Recibos',
                    barColor:    'var(--success)'
                }) +
                analizadorGraficoMensualHTML({
                    titulo:      'Pagos por mes',
                    rows:        d.pagos_por_mes || [],
                    actualizado: d.pagos_actualizado,
                    btnId:       'analRefrescarPagos',
                    btnTitle:    'Recalcular desde salidas en Cajas (0.1.01) y Bancos (0.1.03)',
                    colCantidad: 'Movs.',
                    barColor:    'var(--danger)'
                }) +
            '</div>' +

            '<div class="dash-grid" style="margin-top:20px">' +
                '<div class="table-card">' +
                    '<div class="dash-table-header">' +
                        '<div><div>Top clientes</div>' +
                        '<div class="text-muted text-sm" style="font-weight:400;">Facturación acumulada del año</div></div>' +
                    '</div>' +
                    '<table><thead><tr>' +
                        '<th>Cliente</th><th>Comprobantes</th><th style="text-align:right">Total</th>' +
                    '</tr></thead><tbody>' +
                    (topCli.length === 0
                        ? '<tr><td colspan="3" class="table-empty">Sin ventas registradas.</td></tr>'
                        : topCli.map(function (c) {
                            return '<tr>' +
                                '<td><div class="td-nombre">' + e(c.nombre || '—') + '</div>' +
                                '<div class="td-id">#' + e(c.id) + '</div></td>' +
                                '<td class="text-muted">' + fmtInt(c.cantidad || 0) + '</td>' +
                                '<td style="text-align:right;font-weight:600">' + fmtMoney(c.total || 0) + '</td>' +
                            '</tr>';
                        }).join('')) +
                    '</tbody></table>' +
                '</div>' +

                '<div class="table-card">' +
                    '<div class="dash-table-header">' +
                        '<div><div>Comprobantes recientes</div>' +
                        '<div class="text-muted text-sm" style="font-weight:400;">Últimas emisiones</div></div>' +
                    '</div>' +
                    '<table><thead><tr>' +
                        '<th>Emisión</th><th>Tipo</th><th>Cliente</th><th style="text-align:right">Total</th>' +
                    '</tr></thead><tbody>' +
                    (recient.length === 0
                        ? '<tr><td colspan="4" class="table-empty">Sin comprobantes recientes.</td></tr>'
                        : recient.map(function (r) {
                            return '<tr>' +
                                '<td class="text-muted">' + e(r.emision || '—') + '</td>' +
                                '<td>' + e(r.tipo || '—') + '</td>' +
                                '<td><div class="td-nombre">' + e(r.razon || '—') + '</div></td>' +
                                '<td style="text-align:right;font-weight:600">' + fmtMoney(r.total || 0) + '</td>' +
                            '</tr>';
                        }).join('')) +
                    '</tbody></table>' +
                '</div>' +
            '</div>';

        analizadorBindRefresh('analRefrescarCobros', '/api/analizador_refrescar_cobros.php', 'Cobros actualizados', view);
        analizadorBindRefresh('analRefrescarPagos',  '/api/analizador_refrescar_pagos.php',  'Pagos actualizados',  view);
    }

    // -------- Vista: Cuentas (Plan de Cuentas contable) -------------------
    //
    // Arbol jerarquico de cuentas contables (activo/pasivo/patrimonio/
    // ingreso/egreso). El backend devuelve la lista plana ordenada por
    // codigo; aca la reconstruimos como arbol para renderizar con expand/
    // collapse. Cada cuenta puede tener subcuentas.
    //
    // Endpoint: /api/cuentas.php (GET lista+kpis, GET ?id, POST, PUT, DELETE,
    // GET ?recalcular=1, GET ?ultima_fecha=1&id).

    var ctaState = {
        cuentas:    [],
        busqueda:   '',
        filtroTipo: '',
        colapsadas: {},
        editandoId: null
    };

    var CTA_TIPO_LABEL = {
        activo:     'Activo',
        pasivo:     'Pasivo',
        patrimonio: 'Patrimonio',
        ingreso:    'Ingreso',
        egreso:     'Egreso'
    };
    var CTA_TIPO_BADGE = {
        activo:     'badge-info',
        pasivo:     'badge-danger',
        patrimonio: 'badge-warn',
        ingreso:    'badge-success',
        egreso:     'badge-warn'
    };

    function ctaFmtSaldo(v) {
        var n = Number(v);
        if (!isFinite(n)) n = 0;
        var s = n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return '$ ' + s;
    }

    async function renderCuentas(view) {
        var data = await api('/api/cuentas.php');
        ctaState.cuentas = data.cuentas || [];
        var k = data.kpis || {};

        view.innerHTML =
            '<div class="page-header"><div>' +
                '<h1>Plan de Cuentas</h1>' +
                '<p>Cuentas contables jerárquicas (activo, pasivo, patrimonio, ingresos, egresos).</p>' +
            '</div></div>' +

            '<div class="stats-bar">' +
                statCard('Total cuentas',  k.total      || 0, 'orange', 'Registradas en el plan') +
                statCard('Activo',         k.activo     || 0, 'green',  'Cuentas de activo') +
                statCard('Pasivo',         k.pasivo     || 0, 'red',    'Cuentas de pasivo') +
                statCard('Patrimonio',     k.patrimonio || 0, 'orange', 'Cuentas patrimoniales') +
                statCard('Ingresos',       k.ingreso    || 0, 'green',  'Cuentas de ingresos') +
                statCard('Egresos',        k.egreso     || 0, 'red',    'Cuentas de egresos') +
            '</div>' +

            '<div class="toolbar">' +
                '<div class="toolbar-left">' +
                    '<div class="search-wrap">' +
                        '<input type="search" id="ctaSearch" class="search-input" placeholder="Buscar por código o nombre..." value="' + e(ctaState.busqueda) + '">' +
                        '<button class="search-clear" id="ctaSearchClear" type="button" style="' + (ctaState.busqueda ? '' : 'display:none;') + '">&times;</button>' +
                    '</div>' +
                    ctaFiltroChip('',           'Todos') +
                    ctaFiltroChip('activo',     'Activo') +
                    ctaFiltroChip('pasivo',     'Pasivo') +
                    ctaFiltroChip('patrimonio', 'Patrimonio') +
                    ctaFiltroChip('ingreso',    'Ingresos') +
                    ctaFiltroChip('egreso',     'Egresos') +
                '</div>' +
                '<div class="toolbar-right">' +
                    '<button class="btn btn-ghost" id="ctaExpandir"  type="button" title="Expandir todo">' +
                        '<i class="fa-solid fa-plus-square"></i> Expandir</button>' +
                    '<button class="btn btn-ghost" id="ctaColapsar"  type="button" title="Colapsar todo">' +
                        '<i class="fa-solid fa-minus-square"></i> Colapsar</button>' +
                    '<button class="btn btn-secondary" id="ctaRecalcular" type="button" title="Recalcular saldos desde asientos">' +
                        '<i class="fa-solid fa-arrows-rotate"></i> Recalcular saldos</button>' +
                    '<button class="btn btn-primary" id="ctaNueva" type="button">+ Nueva cuenta</button>' +
                '</div>' +
            '</div>' +

            '<div class="table-card">' +
                '<table><thead><tr>' +
                    '<th style="width:180px;">Código</th>' +
                    '<th>Nombre</th>' +
                    '<th style="width:120px;">Tipo</th>' +
                    '<th style="width:80px;text-align:center;">Nat.</th>' +
                    '<th style="width:90px;text-align:center;">Imputable</th>' +
                    '<th style="width:160px;text-align:right;">Saldo</th>' +
                    '<th style="width:120px;text-align:right;">Acciones</th>' +
                '</tr></thead><tbody id="ctaTbody">' +
                renderFilasCuentas() +
                '</tbody></table>' +
            '</div>' +

            modalCuentaHtml() +
            modalConsultarCuentaHtml() +
            confirmDeleteCuentaHtml();

        wireCuentasView();
    }

    function ctaFiltroChip(val, label) {
        var active = String(ctaState.filtroTipo) === String(val) ? ' active' : '';
        return '<button type="button" class="filter-chip' + active + '" data-tipo="' + e(val) + '">' + e(label) + '</button>';
    }

    function renderFilasCuentas() {
        if (!ctaState.cuentas.length) {
            return '<tr><td colspan="7" class="table-empty">No hay cuentas cargadas.</td></tr>';
        }

        // Construimos el arbol.
        var byId = {};
        ctaState.cuentas.forEach(function (c) {
            byId[c.id] = { data: c, children: [] };
        });
        var raices = [];
        ctaState.cuentas.forEach(function (c) {
            var pid = c.padre;
            if (pid && byId[pid]) byId[pid].children.push(byId[c.id]);
            else raices.push(byId[c.id]);
        });

        var busq  = ctaState.busqueda.trim().toLowerCase();
        var tipo  = ctaState.filtroTipo;
        var plano = !!(busq || tipo);

        var html = '';
        if (plano) {
            ctaState.cuentas.forEach(function (c) {
                if (tipo && c.tipo !== tipo) return;
                if (busq) {
                    var hay = ((c.codigo || '') + ' ' + (c.nombre || '')).toLowerCase();
                    if (hay.indexOf(busq) === -1) return;
                }
                html += filaCuenta(c, 0, false, false);
            });
            if (!html) {
                html = '<tr><td colspan="7" class="table-empty">Ninguna cuenta coincide con la búsqueda.</td></tr>';
            }
        } else {
            function walk(nodo, depth) {
                var c = nodo.data;
                var tieneHijos = nodo.children.length > 0;
                var colapsada  = !!ctaState.colapsadas[c.id];
                html += filaCuenta(c, depth, tieneHijos, colapsada);
                if (tieneHijos && !colapsada) {
                    nodo.children.forEach(function (h) { walk(h, depth + 1); });
                }
            }
            raices.forEach(function (r) { walk(r, 0); });
        }
        return html;
    }

    function filaCuenta(c, depth, tieneHijos, colapsada) {
        var indent = depth * 22;
        var toggle = tieneHijos
            ? '<button class="btn-icon-sm" data-act="toggle" title="' + (colapsada ? 'Expandir' : 'Colapsar') + '" style="width:22px;padding:0 4px;">' +
                    (colapsada ? '<i class="fa-solid fa-caret-right"></i>' : '<i class="fa-solid fa-caret-down"></i>') +
              '</button>'
            : '<span style="display:inline-block;width:22px;"></span>';

        var tipoBadge = c.tipo
            ? '<span class="badge ' + (CTA_TIPO_BADGE[c.tipo] || 'badge-muted') + '">' + e(CTA_TIPO_LABEL[c.tipo] || c.tipo) + '</span>'
            : '<span class="badge badge-muted">—</span>';

        var nat = c.naturaleza === 'acreedora'
            ? '<span style="color:var(--danger);font-weight:700;">A</span>'
            : '<span style="color:var(--info);font-weight:700;">D</span>';

        var imputable = parseInt(c.imputable, 10) === 1
            ? '<i class="fa-solid fa-check" style="color:var(--success);"></i>'
            : '<span class="text-muted">—</span>';

        var saldoVal   = parseFloat(c.saldo || 0);
        var saldoColor = saldoVal > 0 ? 'var(--success)' : (saldoVal < 0 ? 'var(--danger)' : 'var(--muted)');
        var negrita    = parseInt(c.imputable, 10) === 0 ? 'font-weight:700;' : '';

        return '<tr data-id="' + c.id + '">' +
            '<td><span style="display:inline-flex;align-items:center;gap:4px;padding-left:' + indent + 'px;">' +
                toggle +
                '<code class="text-sm">' + e(c.codigo || ('#' + c.id)) + '</code></span></td>' +
            '<td style="' + negrita + '">' + e(c.nombre || '—') + '</td>' +
            '<td>' + tipoBadge + '</td>' +
            '<td style="text-align:center;">' + nat + '</td>' +
            '<td style="text-align:center;">' + imputable + '</td>' +
            '<td style="text-align:right;font-family:monospace;font-weight:600;color:' + saldoColor + ';">' +
                ctaFmtSaldo(saldoVal) +
            '</td>' +
            '<td><div class="actions" style="justify-content:flex-end;">' +
                '<button class="btn-icon-sm" data-act="view"       type="button" title="Consultar"><i class="fa-solid fa-eye"></i></button>' +
                '<button class="btn-icon-sm" data-act="add-child"  type="button" title="Agregar subcuenta"><i class="fa-solid fa-plus"></i></button>' +
                '<button class="btn-icon-sm" data-act="edit"       type="button" title="Editar"><i class="fa-solid fa-pencil"></i></button>' +
                '<button class="btn-icon-sm" data-act="delete"     type="button" title="Eliminar"><i class="fa-solid fa-trash"></i></button>' +
            '</div></td>' +
        '</tr>';
    }

    function modalCuentaHtml() {
        return '<div class="modal-backdrop" id="ctaModal"><div class="modal">' +
            '<div class="modal-header">' +
                '<div class="modal-title">' +
                    '<span id="ctaModalTitulo">Nueva cuenta</span>' +
                    '<span class="modal-subtitle" id="ctaModalSub"></span>' +
                '</div>' +
                '<button class="btn-icon-sm" data-act="close" type="button" aria-label="Cerrar">&times;</button>' +
            '</div>' +
            '<form id="ctaForm" novalidate>' +
                '<input type="hidden" id="ctaId" value="">' +
                '<div class="modal-body">' +
                    '<div class="alert alert-error" id="ctaError" style="display:none;"></div>' +
                    '<div class="form-row">' +
                        '<div class="form-group" style="grid-column:1 / -1;"><label for="cta-nombre">Nombre</label>' +
                            '<input id="cta-nombre" name="nombre" type="text" maxlength="255" required></div>' +
                    '</div>' +
                    '<div class="form-row">' +
                        '<div class="form-group"><label for="cta-padre">Cuenta padre</label>' +
                            '<select id="cta-padre" name="padre"><option value="">— Sin padre (raíz) —</option></select></div>' +
                        '<div class="form-group"><label for="cta-orden">Orden</label>' +
                            '<input id="cta-orden" name="orden" type="number" min="1" step="1" inputmode="numeric" placeholder="Ej: 1">' +
                            '<div class="text-muted text-sm">Determina el código jerárquico (1, 2, 3…) bajo el mismo padre.</div></div>' +
                    '</div>' +
                    '<div class="form-row">' +
                        '<div class="form-group"><label for="cta-tipo">Tipo</label>' +
                            '<select id="cta-tipo" name="tipo">' +
                                '<option value="activo">Activo (naturaleza deudora)</option>' +
                                '<option value="pasivo">Pasivo (naturaleza acreedora)</option>' +
                                '<option value="patrimonio">Patrimonio (naturaleza acreedora)</option>' +
                                '<option value="ingreso">Ingreso (naturaleza acreedora)</option>' +
                                '<option value="egreso">Egreso (naturaleza deudora)</option>' +
                            '</select></div>' +
                        '<div class="form-group"><label for="cta-categoria">Categoría</label>' +
                            '<input id="cta-categoria" name="categoria" type="number" step="1" inputmode="numeric" placeholder="Opcional"></div>' +
                    '</div>' +
                    '<div class="form-row">' +
                        '<div class="form-group" style="grid-column:1 / -1;"><label for="cta-obs">Observaciones</label>' +
                            '<textarea id="cta-obs" name="observaciones" rows="2" maxlength="1000"></textarea></div>' +
                    '</div>' +
                    '<div class="text-muted text-sm">' +
                        'El <b>código</b>, la <b>naturaleza</b> (deudora/acreedora) y si es <b>imputable</b> se derivan automáticamente ' +
                        'del padre, el orden y el tipo.' +
                    '</div>' +
                '</div>' +
                '<div class="modal-footer">' +
                    '<button type="button" class="btn btn-ghost" data-act="close">Cancelar</button>' +
                    '<button type="submit" class="btn btn-primary" id="ctaGuardar">Guardar</button>' +
                '</div>' +
            '</form>' +
        '</div></div>';
    }

    function modalConsultarCuentaHtml() {
        return '<div class="modal-backdrop" id="ctaConsultar"><div class="modal modal-wide">' +
            '<div class="modal-header">' +
                '<div class="modal-title">' +
                    '<span>Consultar cuenta</span>' +
                    '<span class="modal-subtitle" id="ctaConsSub"></span>' +
                '</div>' +
                '<button class="btn-icon-sm" data-act="close" type="button" aria-label="Cerrar">&times;</button>' +
            '</div>' +
            '<div class="modal-body">' +
                '<dl class="data-list" id="ctaConsBody"></dl>' +
            '</div>' +
            '<div class="modal-footer">' +
                '<button type="button" class="btn btn-ghost" data-act="close">Cerrar</button>' +
            '</div>' +
        '</div></div>';
    }

    function confirmDeleteCuentaHtml() {
        return '<div class="confirm-backdrop" id="ctaConfirm"><div class="confirm-box">' +
            '<div class="confirm-title">Eliminar cuenta</div>' +
            '<div class="confirm-msg" id="ctaConfirmMsg">Esta acción no se puede deshacer.</div>' +
            '<div class="confirm-actions">' +
                '<button class="btn btn-ghost"  data-act="cancel" type="button">Cancelar</button>' +
                '<button class="btn btn-danger" id="ctaConfirmBtn" type="button">Eliminar</button>' +
            '</div>' +
        '</div></div>';
    }

    function poblarSelectPadreCuenta(excludeId) {
        var sel = document.getElementById('cta-padre');
        var html = '<option value="">— Sin padre (raíz) —</option>';

        // Excluir la cuenta y sus descendientes (no puede ser su propio padre).
        var excluidos = {};
        if (excludeId) {
            excluidos[excludeId] = true;
            var cambio = true;
            while (cambio) {
                cambio = false;
                ctaState.cuentas.forEach(function (c) {
                    if (c.padre && excluidos[c.padre] && !excluidos[c.id]) {
                        excluidos[c.id] = true;
                        cambio = true;
                    }
                });
            }
        }

        ctaState.cuentas.forEach(function (c) {
            if (excluidos[c.id]) return;
            var label = (c.codigo || '#' + c.id) + ' — ' + (c.nombre || '');
            html += '<option value="' + c.id + '">' + e(label) + '</option>';
        });
        sel.innerHTML = html;
    }

    function wireCuentasView() {
        var searchInput = document.getElementById('ctaSearch');
        var searchClear = document.getElementById('ctaSearchClear');
        var tbody       = document.getElementById('ctaTbody');
        var modal       = document.getElementById('ctaModal');
        var modalTit    = document.getElementById('ctaModalTitulo');
        var modalSub    = document.getElementById('ctaModalSub');
        var modalError  = document.getElementById('ctaError');
        var form        = document.getElementById('ctaForm');
        var fId         = document.getElementById('ctaId');
        var fNombre     = document.getElementById('cta-nombre');
        var fTipo       = document.getElementById('cta-tipo');
        var fPadre      = document.getElementById('cta-padre');
        var fOrden      = document.getElementById('cta-orden');
        var fCategoria  = document.getElementById('cta-categoria');
        var fObs        = document.getElementById('cta-obs');
        var btnGuardar  = document.getElementById('ctaGuardar');

        var confirmBox  = document.getElementById('ctaConfirm');
        var confirmMsg  = document.getElementById('ctaConfirmMsg');
        var btnDelete   = document.getElementById('ctaConfirmBtn');
        var consultarM  = document.getElementById('ctaConsultar');
        var consultarS  = document.getElementById('ctaConsSub');
        var consultarB  = document.getElementById('ctaConsBody');

        var pendingDeleteId = null;
        var searchTimer     = null;

        function refreshTable() {
            tbody.innerHTML = renderFilasCuentas();
        }

        // Buscador (client-side, no vuelve al servidor).
        searchInput.addEventListener('input', function () {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(function () {
                ctaState.busqueda = searchInput.value;
                searchClear.style.display = searchInput.value ? '' : 'none';
                refreshTable();
            }, 200);
        });
        searchClear.addEventListener('click', function () {
            searchInput.value = '';
            ctaState.busqueda = '';
            searchClear.style.display = 'none';
            refreshTable();
            searchInput.focus();
        });

        // Chips de tipo.
        document.querySelectorAll('.toolbar-left .filter-chip').forEach(function (chip) {
            chip.addEventListener('click', function () {
                var val = chip.dataset.tipo || '';
                ctaState.filtroTipo = val;
                document.querySelectorAll('.toolbar-left .filter-chip').forEach(function (c) {
                    c.classList.toggle('active', c === chip);
                });
                refreshTable();
            });
        });

        // Expandir / colapsar todo.
        document.getElementById('ctaExpandir').addEventListener('click', function () {
            ctaState.colapsadas = {};
            refreshTable();
        });
        document.getElementById('ctaColapsar').addEventListener('click', function () {
            ctaState.colapsadas = {};
            var conHijos = {};
            ctaState.cuentas.forEach(function (c) { if (c.padre) conHijos[c.padre] = true; });
            Object.keys(conHijos).forEach(function (id) { ctaState.colapsadas[id] = true; });
            refreshTable();
        });

        // Recalcular saldos.
        var btnRec = document.getElementById('ctaRecalcular');
        btnRec.addEventListener('click', async function () {
            var origHtml = btnRec.innerHTML;
            btnRec.disabled = true;
            btnRec.innerHTML = '<i class="fa-solid fa-arrows-rotate fa-spin"></i> Recalculando…';
            try {
                var data = await api('/api/cuentas.php?recalcular=1');
                toast('Saldos recalculados (' + (data.cuentas || 0) + ' cuentas).');
                await navigate();
            } catch (err) {
                toast(err.message || 'No se pudo recalcular.', true);
                btnRec.disabled = false;
                btnRec.innerHTML = origHtml;
            }
        });

        // Modal ABM.
        function resetForm() {
            form.reset();
            fId.value = '';
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
        consultarM.addEventListener('click', function (ev) {
            if (ev.target === consultarM || ev.target.closest('[data-act="close"]')) {
                consultarM.classList.remove('open');
            }
        });
        confirmBox.addEventListener('click', function (ev) {
            if (ev.target === confirmBox || ev.target.closest('[data-act="cancel"]')) {
                confirmBox.classList.remove('open');
                pendingDeleteId = null;
            }
        });

        function abrirNueva(parentId) {
            ctaState.editandoId = null;
            resetForm();
            modalTit.textContent = 'Nueva cuenta';
            modalSub.textContent = '';
            poblarSelectPadreCuenta(null);
            if (parentId) {
                var padre = ctaState.cuentas.find(function (x) { return x.id === parentId; });
                if (padre) {
                    fPadre.value = parentId;
                    fTipo.value  = padre.tipo || 'activo';
                }
            }
            openModal();
            fNombre.focus();
        }

        function abrirEditar(id) {
            var c = ctaState.cuentas.find(function (x) { return x.id === id; });
            if (!c) return;
            ctaState.editandoId = id;
            resetForm();
            modalTit.textContent = 'Editar cuenta';
            modalSub.innerHTML   = '<code>' + e(c.codigo || '#' + id) + '</code>';
            fId.value            = c.id;
            fNombre.value        = c.nombre || '';
            fTipo.value          = c.tipo || 'activo';
            fOrden.value         = c.orden != null ? c.orden : '';
            fCategoria.value     = c.categoria != null ? c.categoria : '';
            fObs.value           = c.observaciones || '';
            poblarSelectPadreCuenta(id);
            fPadre.value         = c.padre != null ? c.padre : '';
            openModal();
            fNombre.focus();
        }

        async function abrirConsulta(id) {
            consultarS.innerHTML = '<code>#' + id + '</code>';
            consultarB.innerHTML = '<div style="display:flex;justify-content:center;padding:24px"><div class="spin"></div></div>';
            consultarM.classList.add('open');

            var c;
            try {
                c = await api('/api/cuentas.php?id=' + id);
            } catch (err) {
                consultarB.innerHTML = '<div class="alert alert-error">' + e(err.message) + '</div>';
                return;
            }

            var saldoVal   = parseFloat(c.saldo || 0);
            var saldoColor = saldoVal > 0 ? 'var(--success)' : (saldoVal < 0 ? 'var(--danger)' : 'var(--muted)');
            var saldoHtml  = '<span style="font-family:monospace;font-weight:700;color:' + saldoColor + '">' + ctaFmtSaldo(saldoVal) + '</span>';

            var tipoLabel  = CTA_TIPO_LABEL[c.tipo] || c.tipo || '—';
            var natLabel   = c.naturaleza === 'acreedora' ? 'Acreedora' : (c.naturaleza === 'deudora' ? 'Deudora' : '—');
            var impLabel2  = parseInt(c.imputable, 10) === 1 ? 'Sí (recibe asientos)' : 'No (cuenta de agrupación)';
            var padreTxt = c.padre
                ? ((c.padre_codigo ? c.padre_codigo + ' — ' : '') + (c.padre_nombre || '') + ' (#' + c.padre + ')')
                : 'Cuenta raíz';

            consultarS.innerHTML = '<code>' + e(c.codigo || '#' + c.id) + '</code>';
            consultarB.innerHTML =
                abmRow('Código',        '<code>' + e(c.codigo || '—') + '</code>') +
                abmRow('Nombre',        e(c.nombre || '—')) +
                abmRow('Tipo',          e(tipoLabel)) +
                abmRow('Naturaleza',    e(natLabel)) +
                abmRow('Imputable',     e(impLabel2)) +
                abmRow('Nivel',         'Nivel ' + (c.nivel != null ? c.nivel : '—')) +
                abmRow('Orden',         c.orden != null ? String(c.orden) : '—', c.orden == null) +
                abmRow('Categoría',     c.categoria != null ? String(c.categoria) : '—', c.categoria == null) +
                abmRow('Cuenta padre',  e(padreTxt), c.padre == null) +
                abmRow('Saldo',         saldoHtml) +
                abmRow('Última fecha',  '<span id="ctaConsUlt">…</span>') +
                abmRowTxt('Observaciones', c.observaciones, 'Sin observaciones', true);

            // Ultima fecha async.
            try {
                var uf = await api('/api/cuentas.php?ultima_fecha=1&id=' + id);
                var span = document.getElementById('ctaConsUlt');
                if (span) span.textContent = uf.ultima_fecha ? String(uf.ultima_fecha).replace('T', ' ').replace(/\.\d+$/, '') : 'Sin movimientos';
            } catch (_) {}
        }

        document.getElementById('ctaNueva').addEventListener('click', function () { abrirNueva(null); });

        tbody.addEventListener('click', async function (ev) {
            var btn = ev.target.closest('button[data-act]');
            if (!btn) return;
            var tr = btn.closest('tr[data-id]');
            if (!tr) return;
            var id = parseInt(tr.dataset.id, 10);

            if (btn.dataset.act === 'toggle') {
                if (ctaState.colapsadas[id]) delete ctaState.colapsadas[id];
                else ctaState.colapsadas[id] = true;
                refreshTable();
                return;
            }
            if (btn.dataset.act === 'view')      { abrirConsulta(id); return; }
            if (btn.dataset.act === 'edit')      { abrirEditar(id);   return; }
            if (btn.dataset.act === 'add-child') { abrirNueva(id);    return; }
            if (btn.dataset.act === 'delete') {
                var c = ctaState.cuentas.find(function (x) { return x.id === id; });
                var nombre = c ? (c.codigo ? c.codigo + ' — ' : '') + (c.nombre || '#' + id) : '#' + id;
                confirmMsg.textContent = '¿Eliminar la cuenta "' + nombre + '"? Esta acción no se puede deshacer.';
                pendingDeleteId = id;
                confirmBox.classList.add('open');
            }
        });

        btnDelete.addEventListener('click', async function () {
            if (!pendingDeleteId) return;
            btnDelete.disabled = true;
            try {
                await api('/api/cuentas.php?id=' + pendingDeleteId, { method: 'DELETE' });
                toast('Cuenta eliminada.');
                await navigate();
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
                nombre:        fNombre.value.trim(),
                tipo:          fTipo.value,
                padre:         fPadre.value ? parseInt(fPadre.value, 10) : null,
                orden:         fOrden.value !== '' ? parseInt(fOrden.value, 10) : null,
                categoria:     fCategoria.value !== '' ? parseInt(fCategoria.value, 10) : null,
                observaciones: fObs.value.trim()
            };

            btnGuardar.disabled = true;
            try {
                if (ctaState.editandoId) {
                    await api('/api/cuentas.php?id=' + ctaState.editandoId, { method: 'PUT', body: payload });
                    toast('Cuenta actualizada.');
                } else {
                    await api('/api/cuentas.php', { method: 'POST', body: payload });
                    toast('Cuenta creada.');
                }
                closeModal();
                await navigate();
            } catch (err) {
                showFormError(err.message);
            } finally {
                btnGuardar.disabled = false;
            }
        });
    }

    // -------- Vista: Comprobantes (Presupuestos / Facturas / Recibos) -----
    //
    // Los 3 grupos son listados read-only sobre la tabla `comprobantes`
    // filtrados por tipo (mapa en /api/comprobantes.php). Comparten un
    // mismo renderer parametrizado por grupo.

    var comprobantesFiltrosPorGrupo = {
        presupuestos: { sort:'emision', dir:'desc', limit:100, filtro_id:'', contraparte:'', desde:'', hasta:'' },
        facturas:     { sort:'emision', dir:'desc', limit:100, filtro_id:'', contraparte:'', desde:'', hasta:'' },
        recibos:      { sort:'emision', dir:'desc', limit:100, filtro_id:'', contraparte:'', desde:'', hasta:'' }
    };

    function comprobantesQueryString(grupo) {
        var f = comprobantesFiltrosPorGrupo[grupo] || {};
        var qs = ['grupo=' + encodeURIComponent(grupo)];
        Object.keys(f).forEach(function (k) {
            var v = f[k];
            if (v !== '' && v != null) {
                qs.push(encodeURIComponent(k) + '=' + encodeURIComponent(v));
            }
        });
        return '?' + qs.join('&');
    }

    async function renderComprobantesGrupo(view, grupo, titulo, subtitulo) {
        var data  = await api('/api/comprobantes.php' + comprobantesQueryString(grupo));
        var lista = data.comprobantes || [];
        var kpis  = data.kpis || {};
        var f     = comprobantesFiltrosPorGrupo[grupo];

        var filtrosActivos = (f.filtro_id   !== '' ? 1 : 0) +
                             (f.contraparte !== '' ? 1 : 0) +
                             (f.desde       !== '' ? 1 : 0) +
                             (f.hasta       !== '' ? 1 : 0);
        var badgeFiltros = filtrosActivos
            ? ' <span class="badge badge-info" style="margin-left:6px;">' + filtrosActivos + '</span>'
            : '';

        var searchIdInp   = 'cbSearch_'   + grupo;
        var searchIdClear = 'cbSearchC_'  + grupo;
        var btnFiltros    = 'cbFiltros_'  + grupo;
        var tbodyId       = 'cbTbody_'    + grupo;
        var emptyId       = 'cbEmpty_'    + grupo;
        var filtrosModal  = 'cbFiltrosM_' + grupo;

        view.innerHTML =
            '<div class="page-header"><div>' +
                '<h1>' + e(titulo) + '</h1>' +
                '<p>' + e(subtitulo) + '</p>' +
            '</div></div>' +

            '<div class="stats-bar">' +
                statCard('Total',           fmtInt(kpis.total        || 0), 'orange', 'Registros en la tabla') +
                statCard('Últimos 30 días', fmtInt(kpis.cantidad_30d || 0), 'green',  'Emitidos en el mes') +
                statCard('Monto 30 días',   fmtMoney(kpis.monto_30d  || 0), 'orange', 'Facturación reciente') +
            '</div>' +

            '<div class="toolbar">' +
                '<div class="toolbar-left">' +
                    '<div class="search-wrap">' +
                        '<input type="search" id="' + searchIdInp + '" class="search-input" placeholder="Buscar cliente, razón, CUIT...">' +
                        '<button class="search-clear" id="' + searchIdClear + '" type="button" style="display:none;">&times;</button>' +
                    '</div>' +
                    '<button class="btn btn-secondary" id="' + btnFiltros + '" type="button">' +
                        '<i class="fa-solid fa-filter"></i> Filtros' + badgeFiltros +
                    '</button>' +
                '</div>' +
            '</div>' +

            '<div class="table-card">' +
                '<table><thead><tr>' +
                    '<th>Código</th><th>Emisión</th><th>Tipo</th><th>Nro</th>' +
                    '<th>Cliente</th><th>Talonario</th>' +
                    '<th style="text-align:right;">Subtotal</th>' +
                    '<th style="text-align:right;">Total</th>' +
                '</tr></thead><tbody id="' + tbodyId + '">' +
                renderFilasComprobantes(lista) +
                '</tbody></table>' +
                '<div class="table-empty" id="' + emptyId + '" style="display:none;">No hay comprobantes que coincidan con la búsqueda.</div>' +
            '</div>' +
            '<div class="text-muted text-sm" style="margin-top:10px;">' +
                'Mostrando ' + lista.length + ' resultado(s) (límite ' + f.limit + ').' +
            '</div>' +

            modalFiltrosComprobantesHtml(grupo, filtrosModal);

        wireComprobantesView(grupo, {
            searchIdInp:   searchIdInp,
            searchIdClear: searchIdClear,
            btnFiltros:    btnFiltros,
            tbodyId:       tbodyId,
            emptyId:       emptyId,
            filtrosModal:  filtrosModal
        });
    }

    function renderFilasComprobantes(lista) {
        if (!lista.length) {
            return '<tr><td colspan="8" class="table-empty">Sin comprobantes.</td></tr>';
        }
        return lista.map(function (r) {
            var nro    = (r.punto != null ? String(r.punto).padStart(4, '0') : '----') +
                         '-' +
                         (r.serie != null ? String(r.serie).padStart(8, '0') : '--------');
            var razon  = r.razon || '—';
            var busq   = String((r.razon || '') + ' ' + (r.cuit || '') + ' ' + nro).toLowerCase().trim();
            return '<tr data-id="' + r.id + '" data-search="' + e(busq) + '">' +
                '<td class="td-id">#' + r.id + '</td>' +
                '<td class="text-muted">' + e(r.emision || '—') + '</td>' +
                '<td>' + e(r.tipo || '—') + '</td>' +
                '<td class="td-id">' + e(nro) + '</td>' +
                '<td><div class="td-nombre">' + e(razon) + '</div>' +
                    (r.cuit ? '<div class="td-id">CUIT ' + e(r.cuit) + '</div>' : '') +
                '</td>' +
                '<td class="text-muted">' + e(r.talonario_nombre || '—') + '</td>' +
                '<td style="text-align:right;">' + fmtMoney(r.subtotal || 0) + '</td>' +
                '<td style="text-align:right;font-weight:600;">' + fmtMoney(r.total || 0) + '</td>' +
            '</tr>';
        }).join('');
    }

    function modalFiltrosComprobantesHtml(grupo, modalId) {
        function selOpt(value, label, current) {
            var sel = String(current) === String(value) ? ' selected' : '';
            return '<option value="' + e(value) + '"' + sel + '>' + e(label) + '</option>';
        }
        var f = comprobantesFiltrosPorGrupo[grupo];
        var p = 'cbflt_' + grupo + '_';
        return '<div class="modal-backdrop" id="' + modalId + '"><div class="modal">' +
            '<div class="modal-header">' +
                '<div class="modal-title"><span>Filtros</span></div>' +
                '<button class="btn-icon-sm" data-act="close" type="button" aria-label="Cerrar">&times;</button>' +
            '</div>' +
            '<form id="' + p + 'form" novalidate>' +
                '<div class="modal-body">' +
                    '<div class="form-row">' +
                        '<div class="form-group"><label for="' + p + 'id">Código</label>' +
                            '<input id="' + p + 'id" type="number" min="1" step="1" ' +
                                'inputmode="numeric" placeholder="Código del comprobante" value="' + e(f.filtro_id) + '"></div>' +
                        '<div class="form-group"><label for="' + p + 'razon">Cliente / razón</label>' +
                            '<input id="' + p + 'razon" type="text" maxlength="255" ' +
                                'placeholder="Nombre o razón social" value="' + e(f.contraparte) + '"></div>' +
                    '</div>' +
                    '<div class="form-row">' +
                        '<div class="form-group"><label for="' + p + 'desde">Desde</label>' +
                            '<input id="' + p + 'desde" type="date" value="' + e(f.desde) + '"></div>' +
                        '<div class="form-group"><label for="' + p + 'hasta">Hasta</label>' +
                            '<input id="' + p + 'hasta" type="date" value="' + e(f.hasta) + '"></div>' +
                    '</div>' +
                    '<div class="form-row">' +
                        '<div class="form-group"><label for="' + p + 'limit">Límite</label>' +
                            '<input id="' + p + 'limit" type="number" min="1" max="1000" step="1" ' +
                                'inputmode="numeric" value="' + e(f.limit) + '"></div>' +
                        '<div class="form-group"><label for="' + p + 'sort">Ordenar por</label>' +
                            '<select id="' + p + 'sort">' +
                                selOpt('emision', 'Emisión', f.sort) +
                                selOpt('id',      'Código',  f.sort) +
                                selOpt('total',   'Total',   f.sort) +
                                selOpt('razon',   'Cliente', f.sort) +
                                selOpt('tipo',    'Tipo',    f.sort) +
                            '</select></div>' +
                    '</div>' +
                    '<div class="form-row">' +
                        '<div class="form-group"><label for="' + p + 'dir">Dirección</label>' +
                            '<select id="' + p + 'dir">' +
                                selOpt('desc', 'Descendente', f.dir) +
                                selOpt('asc',  'Ascendente',  f.dir) +
                            '</select></div>' +
                        '<div class="form-group"></div>' +
                    '</div>' +
                '</div>' +
                '<div class="modal-footer">' +
                    '<button type="button" class="btn btn-ghost"     id="' + p + 'reset" >Limpiar</button>' +
                    '<button type="button" class="btn btn-secondary" data-act="close"    >Cancelar</button>' +
                    '<button type="submit"  class="btn btn-primary"                       >Aplicar</button>' +
                '</div>' +
            '</form>' +
        '</div></div>';
    }

    function wireComprobantesView(grupo, ids) {
        var tbody       = document.getElementById(ids.tbodyId);
        var emptyState  = document.getElementById(ids.emptyId);
        var searchInput = document.getElementById(ids.searchIdInp);
        var searchClear = document.getElementById(ids.searchIdClear);
        var filtrosMod  = document.getElementById(ids.filtrosModal);
        var p = 'cbflt_' + grupo + '_';

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

        document.getElementById(ids.btnFiltros).addEventListener('click', function () {
            filtrosMod.classList.add('open');
        });
        filtrosMod.addEventListener('click', function (ev) {
            if (ev.target === filtrosMod || ev.target.closest('[data-act="close"]')) {
                filtrosMod.classList.remove('open');
            }
        });
        document.getElementById(p + 'reset').addEventListener('click', function () {
            var f = comprobantesFiltrosPorGrupo[grupo];
            f.sort = 'emision'; f.dir = 'desc'; f.limit = 100;
            f.filtro_id = ''; f.contraparte = ''; f.desde = ''; f.hasta = '';
            filtrosMod.classList.remove('open');
            navigate();
        });
        document.getElementById(p + 'form').addEventListener('submit', function (ev) {
            ev.preventDefault();
            var f = comprobantesFiltrosPorGrupo[grupo];
            f.filtro_id   = document.getElementById(p + 'id').value.trim();
            f.contraparte = document.getElementById(p + 'razon').value.trim();
            f.desde       = document.getElementById(p + 'desde').value;
            f.hasta       = document.getElementById(p + 'hasta').value;
            f.limit       = parseInt(document.getElementById(p + 'limit').value, 10) || 100;
            f.sort        = document.getElementById(p + 'sort').value || 'emision';
            f.dir         = document.getElementById(p + 'dir').value  || 'desc';
            filtrosMod.classList.remove('open');
            navigate();
        });

        applyFilters();
    }

    async function renderPresupuestos(view) {
        return renderComprobantesGrupo(view, 'presupuestos', 'Presupuestos',
            'Comprobantes emitidos como presupuestos (tipos PP, PA, PB, PC).');
    }
    async function renderFacturas(view) {
        return renderComprobantesGrupo(view, 'facturas', 'Facturas',
            'Facturas fiscales emitidas (tipos FA, FB, FC, FE, FM).');
    }
    async function renderRecibos(view) {
        return renderComprobantesGrupo(view, 'recibos', 'Recibos',
            'Recibos de cobro emitidos (tipos RA, RB, RC).');
    }

    // -------- Vista: Talonarios -------------------------------------------

    var talonariosFiltros = {
        sort:      'id',
        dir:       'desc',
        limit:     100,
        filtro_id: '',
        nombre:    '',
        tipo:      '',
        estado:    ''
    };

    function talonariosQueryString() {
        var qs = [];
        Object.keys(talonariosFiltros).forEach(function (k) {
            var v = talonariosFiltros[k];
            if (v !== '' && v != null) {
                qs.push(encodeURIComponent(k) + '=' + encodeURIComponent(v));
            }
        });
        return qs.length ? ('?' + qs.join('&')) : '';
    }

    async function renderTalonarios(view) {
        var data       = await api('/api/talonarios.php' + talonariosQueryString());
        var talonarios = data.talonarios || [];
        var kpis       = data.kpis       || {};

        var filtrosActivos = (talonariosFiltros.filtro_id !== '' ? 1 : 0) +
                             (talonariosFiltros.nombre    !== '' ? 1 : 0) +
                             (talonariosFiltros.tipo      !== '' ? 1 : 0) +
                             (talonariosFiltros.estado    !== '' ? 1 : 0);
        var badgeFiltros = filtrosActivos
            ? ' <span class="badge badge-info" style="margin-left:6px;">' + filtrosActivos + '</span>'
            : '';

        view.innerHTML =
            '<div class="page-header"><div>' +
                '<h1>Talonarios</h1>' +
                '<p>Talonarios de emisión de comprobantes (facturas, recibos, presupuestos).</p>' +
            '</div></div>' +

            '<div class="stats-bar">' +
                statCard('Total',     kpis.total     || 0, 'orange', 'Talonarios registrados') +
                statCard('Activos',   kpis.activos   || 0, 'green',  'Habilitados para emitir') +
                statCard('Inactivos', kpis.inactivos || 0, 'red',    'Deshabilitados') +
            '</div>' +

            '<div class="toolbar">' +
                '<div class="toolbar-left">' +
                    '<div class="search-wrap">' +
                        '<input type="search" id="talSearch" class="search-input" placeholder="Buscar nombre o tipo...">' +
                        '<button class="search-clear" id="talSearchClear" type="button" style="display:none;">&times;</button>' +
                    '</div>' +
                    '<button class="btn btn-secondary" id="talFiltros" type="button">' +
                        '<i class="fa-solid fa-filter"></i> Filtros' + badgeFiltros +
                    '</button>' +
                '</div>' +
                '<div class="toolbar-right">' +
                    '<button class="btn btn-primary" id="talNuevo" type="button">+ Nuevo talonario</button>' +
                '</div>' +
            '</div>' +

            '<div class="table-card">' +
                '<table><thead><tr>' +
                    '<th>Código</th><th>Nombre</th><th>Tipo</th><th>Punto</th>' +
                    '<th>Serie</th><th>Fiscal</th><th>Comprobantes</th><th>Estado</th>' +
                    '<th style="text-align:right;">Acciones</th>' +
                '</tr></thead><tbody id="talTbody">' +
                renderFilasTalonarios(talonarios) +
                '</tbody></table>' +
                '<div class="table-empty" id="talEmpty" style="display:none;">No hay talonarios que coincidan con la búsqueda.</div>' +
            '</div>' +
            '<div class="text-muted text-sm" style="margin-top:10px;">' +
                'Mostrando ' + talonarios.length + ' resultado(s) (límite ' + talonariosFiltros.limit + ').' +
            '</div>' +

            modalTalonarioHtml() +
            modalFiltrosTalonariosHtml() +
            modalConsultarTalonarioHtml() +
            confirmDeleteTalonarioHtml();

        wireTalonariosView();
    }

    function renderFilasTalonarios(talonarios) {
        if (!talonarios.length) {
            return '<tr><td colspan="9" class="table-empty">No hay talonarios cargados.</td></tr>';
        }
        return talonarios.map(function (t) {
            var activo = parseInt(t.estado, 10) === 1;
            var busq   = String((t.nombre || '') + ' ' + (t.tipo || '')).toLowerCase().trim();
            var fiscal = (t.fiscal || '').toUpperCase();
            var fiscalBadge = fiscal === 'S'
                ? '<span class="badge badge-success">Fiscal</span>'
                : (fiscal === 'N'
                    ? '<span class="badge badge-warn">No fiscal</span>'
                    : '<span class="text-muted">—</span>');
            return '<tr data-id="' + t.id + '" data-search="' + e(busq) + '">' +
                '<td class="td-id">#' + t.id + '</td>' +
                '<td><div class="td-nombre">' + e(t.nombre || '—') + '</div></td>' +
                '<td>' + e(t.tipo || '—') + '</td>' +
                '<td>' + (t.punto != null ? e(String(t.punto).padStart(4, '0')) : '—') + '</td>' +
                '<td class="td-id">' + (t.serie != null ? e(String(t.serie).padStart(8, '0')) : '—') + '</td>' +
                '<td>' + fiscalBadge + '</td>' +
                '<td>' + (parseInt(t.comprobantes_count, 10) || 0) + '</td>' +
                '<td>' +
                    (activo
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

    function modalTalonarioHtml() {
        return '<div class="modal-backdrop" id="talModal"><div class="modal">' +
            '<div class="modal-header">' +
                '<div class="modal-title">' +
                    '<span id="talModalTitulo">Nuevo talonario</span>' +
                    '<span class="modal-subtitle" id="talModalSub"></span>' +
                '</div>' +
                '<button class="btn-icon-sm" data-act="close" type="button" aria-label="Cerrar">&times;</button>' +
            '</div>' +
            '<form id="talForm" novalidate>' +
                '<input type="hidden" id="talId" value="">' +
                '<div class="modal-body">' +
                    '<div class="alert alert-error" id="talError" style="display:none;"></div>' +
                    '<div class="form-row">' +
                        '<div class="form-group" style="flex:1 1 100%;"><label for="tal-nombre">Nombre</label>' +
                            '<input id="tal-nombre" name="nombre" type="text" maxlength="255" required></div>' +
                    '</div>' +
                    '<div class="form-row form-row-3">' +
                        '<div class="form-group"><label for="tal-tipo">Tipo</label>' +
                            '<input id="tal-tipo" name="tipo" type="text" maxlength="2" ' +
                                'placeholder="FA, RA, PP..." style="text-transform:uppercase;"></div>' +
                        '<div class="form-group"><label for="tal-punto">Punto de venta</label>' +
                            '<input id="tal-punto" name="punto" type="number" min="0" step="1" inputmode="numeric"></div>' +
                        '<div class="form-group"><label for="tal-serie">Serie inicial</label>' +
                            '<input id="tal-serie" name="serie" type="number" min="0" step="1" inputmode="numeric"></div>' +
                    '</div>' +
                    '<div class="form-row">' +
                        '<div class="form-group"><label for="tal-empresa">Empresa</label>' +
                            '<input id="tal-empresa" name="empresa" type="number" min="1" step="1" inputmode="numeric" ' +
                                'placeholder="ID de empresa"></div>' +
                        '<div class="form-group"><label for="tal-fiscal">Fiscal</label>' +
                            '<select id="tal-fiscal" name="fiscal">' +
                                '<option value="">— Sin definir —</option>' +
                                '<option value="S">Sí (fiscal)</option>' +
                                '<option value="N">No fiscal</option>' +
                            '</select></div>' +
                    '</div>' +
                    '<div class="form-row">' +
                        '<div class="form-group"><label>Estado</label>' +
                            '<label class="toggle-switch" style="margin-top:6px;">' +
                                '<input id="tal-estado" name="estado" type="checkbox" value="1" checked>' +
                                '<span class="toggle-track"><span class="toggle-thumb"></span></span>' +
                                '<span class="toggle-label" id="talEstadoLabel">Activo</span>' +
                            '</label></div>' +
                        '<div class="form-group"></div>' +
                    '</div>' +
                '</div>' +
                '<div class="modal-footer">' +
                    '<button type="button" class="btn btn-ghost" data-act="close">Cancelar</button>' +
                    '<button type="submit" class="btn btn-primary" id="talGuardar">Guardar</button>' +
                '</div>' +
            '</form>' +
        '</div></div>';
    }

    function confirmDeleteTalonarioHtml() {
        return '<div class="confirm-backdrop" id="talConfirm"><div class="confirm-box">' +
            '<div class="confirm-title">Eliminar talonario</div>' +
            '<div class="confirm-msg" id="talConfirmMsg">Esta acción no se puede deshacer.</div>' +
            '<div class="confirm-actions">' +
                '<button class="btn btn-ghost"  data-act="cancel" type="button">Cancelar</button>' +
                '<button class="btn btn-danger" id="talConfirmBtn" type="button">Eliminar</button>' +
            '</div>' +
        '</div></div>';
    }

    function modalFiltrosTalonariosHtml() {
        function selOpt(value, label, current) {
            var sel = String(current) === String(value) ? ' selected' : '';
            return '<option value="' + e(value) + '"' + sel + '>' + e(label) + '</option>';
        }
        return '<div class="modal-backdrop" id="talFiltrosModal"><div class="modal">' +
            '<div class="modal-header">' +
                '<div class="modal-title"><span>Filtros</span></div>' +
                '<button class="btn-icon-sm" data-act="close" type="button" aria-label="Cerrar">&times;</button>' +
            '</div>' +
            '<form id="talFiltrosForm" novalidate>' +
                '<div class="modal-body">' +
                    '<div class="form-row">' +
                        '<div class="form-group"><label for="tflt-id">Código</label>' +
                            '<input id="tflt-id" type="number" min="1" step="1" inputmode="numeric" ' +
                                'placeholder="Código del registro" value="' + e(talonariosFiltros.filtro_id) + '"></div>' +
                        '<div class="form-group"><label for="tflt-nombre">Nombre</label>' +
                            '<input id="tflt-nombre" type="text" maxlength="255" ' +
                                'placeholder="Nombre del talonario" value="' + e(talonariosFiltros.nombre) + '"></div>' +
                    '</div>' +
                    '<div class="form-row">' +
                        '<div class="form-group"><label for="tflt-tipo">Tipo</label>' +
                            '<input id="tflt-tipo" type="text" maxlength="2" ' +
                                'placeholder="FA, RA, PP..." style="text-transform:uppercase;" ' +
                                'value="' + e(talonariosFiltros.tipo) + '"></div>' +
                        '<div class="form-group"><label for="tflt-estado">Estado</label>' +
                            '<select id="tflt-estado">' +
                                selOpt('',  'Todos',      talonariosFiltros.estado) +
                                selOpt('1', 'Activos',    talonariosFiltros.estado) +
                                selOpt('0', 'Inactivos',  talonariosFiltros.estado) +
                            '</select></div>' +
                    '</div>' +
                    '<div class="form-row">' +
                        '<div class="form-group"><label for="tflt-limit">Límite</label>' +
                            '<input id="tflt-limit" type="number" min="1" max="1000" step="1" ' +
                                'inputmode="numeric" value="' + e(talonariosFiltros.limit) + '"></div>' +
                        '<div class="form-group"><label for="tflt-sort">Ordenar por</label>' +
                            '<select id="tflt-sort">' +
                                selOpt('id',     'Código',  talonariosFiltros.sort) +
                                selOpt('nombre', 'Nombre',  talonariosFiltros.sort) +
                                selOpt('tipo',   'Tipo',    talonariosFiltros.sort) +
                                selOpt('punto',  'Punto',   talonariosFiltros.sort) +
                                selOpt('serie',  'Serie',   talonariosFiltros.sort) +
                                selOpt('estado', 'Estado',  talonariosFiltros.sort) +
                            '</select></div>' +
                    '</div>' +
                    '<div class="form-row">' +
                        '<div class="form-group"><label for="tflt-dir">Dirección</label>' +
                            '<select id="tflt-dir">' +
                                selOpt('desc', 'Descendente', talonariosFiltros.dir) +
                                selOpt('asc',  'Ascendente',  talonariosFiltros.dir) +
                            '</select></div>' +
                        '<div class="form-group"></div>' +
                    '</div>' +
                '</div>' +
                '<div class="modal-footer">' +
                    '<button type="button" class="btn btn-ghost"     id="talFiltrosReset" >Limpiar</button>' +
                    '<button type="button" class="btn btn-secondary" data-act="close"    >Cancelar</button>' +
                    '<button type="submit"  class="btn btn-primary"                       >Aplicar</button>' +
                '</div>' +
            '</form>' +
        '</div></div>';
    }

    function modalConsultarTalonarioHtml() {
        return '<div class="modal-backdrop" id="talConsultar"><div class="modal">' +
            '<div class="modal-header">' +
                '<div class="modal-title">' +
                    '<span>Consultar talonario</span>' +
                    '<span class="modal-subtitle" id="talConsultarSub"></span>' +
                '</div>' +
                '<button class="btn-icon-sm" data-act="close" type="button" aria-label="Cerrar">&times;</button>' +
            '</div>' +
            '<div class="modal-body">' +
                '<dl class="data-list" id="talConsultarBody"></dl>' +
            '</div>' +
            '<div class="modal-footer">' +
                '<button type="button" class="btn btn-ghost" data-act="close">Cerrar</button>' +
            '</div>' +
        '</div></div>';
    }

    function wireTalonariosView() {
        var tbody       = document.getElementById('talTbody');
        var emptyState  = document.getElementById('talEmpty');
        var searchInput = document.getElementById('talSearch');
        var searchClear = document.getElementById('talSearchClear');

        var modal       = document.getElementById('talModal');
        var modalTitulo = document.getElementById('talModalTitulo');
        var modalSub    = document.getElementById('talModalSub');
        var modalError  = document.getElementById('talError');
        var form        = document.getElementById('talForm');
        var fId         = document.getElementById('talId');
        var fEstado     = document.getElementById('tal-estado');
        var estadoLabel = document.getElementById('talEstadoLabel');
        var btnGuardar  = document.getElementById('talGuardar');

        var confirmBox = document.getElementById('talConfirm');
        var confirmMsg = document.getElementById('talConfirmMsg');
        var btnDelete  = document.getElementById('talConfirmBtn');

        var filtrosModal = document.getElementById('talFiltrosModal');
        var filtrosForm  = document.getElementById('talFiltrosForm');

        var consultarModal = document.getElementById('talConsultar');
        var consultarSub   = document.getElementById('talConsultarSub');
        var consultarBody  = document.getElementById('talConsultarBody');

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

        document.getElementById('talFiltros').addEventListener('click', function () {
            filtrosModal.classList.add('open');
        });
        filtrosModal.addEventListener('click', function (ev) {
            if (ev.target === filtrosModal || ev.target.closest('[data-act="close"]')) {
                filtrosModal.classList.remove('open');
            }
        });
        document.getElementById('talFiltrosReset').addEventListener('click', function () {
            talonariosFiltros.sort      = 'id';
            talonariosFiltros.dir       = 'desc';
            talonariosFiltros.limit     = 100;
            talonariosFiltros.filtro_id = '';
            talonariosFiltros.nombre    = '';
            talonariosFiltros.tipo      = '';
            talonariosFiltros.estado    = '';
            filtrosModal.classList.remove('open');
            navigate();
        });
        filtrosForm.addEventListener('submit', function (ev) {
            ev.preventDefault();
            talonariosFiltros.filtro_id = document.getElementById('tflt-id').value.trim();
            talonariosFiltros.nombre    = document.getElementById('tflt-nombre').value.trim();
            talonariosFiltros.tipo      = document.getElementById('tflt-tipo').value.trim().toUpperCase();
            talonariosFiltros.estado    = document.getElementById('tflt-estado').value;
            talonariosFiltros.limit     = parseInt(document.getElementById('tflt-limit').value, 10) || 100;
            talonariosFiltros.sort      = document.getElementById('tflt-sort').value || 'id';
            talonariosFiltros.dir       = document.getElementById('tflt-dir').value  || 'desc';
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

            var t;
            try {
                t = await api('/api/talonarios.php?id=' + id);
            } catch (err) {
                consultarBody.innerHTML = '<div class="alert alert-error">' + e(err.message) + '</div>';
                return;
            }
            var estadoBadge = parseInt(t.estado, 10) === 1
                ? '<span class="badge badge-success">Activo</span>'
                : '<span class="badge badge-danger">Inactivo</span>';
            var fiscalTxt = (t.fiscal || '').toUpperCase();
            fiscalTxt = fiscalTxt === 'S' ? 'Sí (fiscal)' : (fiscalTxt === 'N' ? 'No fiscal' : null);

            consultarSub.innerHTML  = '<code>#' + t.id + '</code>';
            consultarBody.innerHTML =
                abmRow    ('Código',  '<code>#' + t.id + '</code>') +
                abmRowTxt ('Nombre',  t.nombre) +
                abmRowNum ('Empresa', t.empresa, 'Sin empresa') +
                abmRowTxt ('Tipo',    t.tipo,    'Sin tipo') +
                abmRowNum ('Punto',   t.punto,   'Sin punto') +
                abmRowNum ('Serie',   t.serie,   'Sin serie') +
                abmRowTxt ('Fiscal',  fiscalTxt, 'Sin definir') +
                abmRow    ('Estado',  estadoBadge);
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

        document.getElementById('talNuevo').addEventListener('click', function () {
            modoEdicion = false;
            resetForm();
            modalTitulo.textContent = 'Nuevo talonario';
            modalSub.textContent    = '';
            openModal();
            document.getElementById('tal-nombre').focus();
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
                    var t = await api('/api/talonarios.php?id=' + id);
                    modoEdicion = true;
                    resetForm();
                    fId.value = t.id;
                    modalTitulo.textContent = 'Editar talonario';
                    modalSub.textContent    = '#' + t.id;
                    document.getElementById('tal-nombre').value  = t.nombre  || '';
                    document.getElementById('tal-tipo').value    = t.tipo    || '';
                    document.getElementById('tal-punto').value   = t.punto   != null ? t.punto : '';
                    document.getElementById('tal-serie').value   = t.serie   != null ? t.serie : '';
                    document.getElementById('tal-empresa').value = t.empresa != null ? t.empresa : '';
                    document.getElementById('tal-fiscal').value  = (t.fiscal || '').toUpperCase();
                    fEstado.checked = parseInt(t.estado, 10) === 1;
                    setEstadoLabel();
                    openModal();
                    document.getElementById('tal-nombre').focus();
                } catch (err) {
                    toast(err.message, true);
                }
                return;
            }

            if (btn.dataset.act === 'delete') {
                var nombre = (tr.querySelector('.td-nombre') || {}).textContent || ('#' + id);
                confirmMsg.textContent = '¿Eliminar el talonario "' + nombre.trim() + '"? Esta acción no se puede deshacer.';
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
                await api('/api/talonarios.php?id=' + pendingDeleteId, { method: 'DELETE' });
                toast('Talonario eliminado.');
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
                nombre:  document.getElementById('tal-nombre').value.trim(),
                empresa: document.getElementById('tal-empresa').value.trim(),
                tipo:    document.getElementById('tal-tipo').value.trim().toUpperCase(),
                punto:   document.getElementById('tal-punto').value.trim(),
                serie:   document.getElementById('tal-serie').value.trim(),
                fiscal:  document.getElementById('tal-fiscal').value,
                estado:  fEstado.checked ? 1 : 0
            };

            btnGuardar.disabled = true;
            try {
                if (modoEdicion) {
                    await api('/api/talonarios.php?id=' + encodeURIComponent(fId.value), {
                        method: 'PUT',
                        body:   payload
                    });
                    toast('Talonario actualizado.');
                } else {
                    await api('/api/talonarios.php', {
                        method: 'POST',
                        body:   payload
                    });
                    toast('Talonario creado.');
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

    // -------- Helpers ABM: seguridad (usuarios / roles / permisos) --------

    function toolbarSeguridadHtml(prefijo, placeholderBuscar, botonPrimarioTexto, filtrosActivos) {
        var badge  = '<span class="btn-icon-badge"' + (filtrosActivos ? '' : ' style="display:none;"') + '>' + (filtrosActivos || '') + '</span>';
        var activo = filtrosActivos ? ' active' : '';
        return '<div class="toolbar">' +
            '<div class="toolbar-left" style="gap:8px;flex-wrap:wrap;">' +
                '<div class="search-wrap">' +
                    '<input type="search" id="' + prefijo + 'Search" class="search-input" placeholder="' + placeholderBuscar + '">' +
                    '<button class="search-clear" id="' + prefijo + 'SearchClear" type="button" style="display:none;">&times;</button>' +
                '</div>' +
                '<button class="btn btn-ghost btn-icon' + activo + '" id="' + prefijo + 'Filtros" type="button" title="Filtros">' +
                    '<i class="fa-solid fa-filter"></i>' + badge +
                '</button>' +
                '<button class="btn btn-ghost btn-icon" id="' + prefijo + 'Refrescar" type="button" title="Refrescar">' +
                    '<i class="fa-solid fa-rotate"></i>' +
                '</button>' +
            '</div>' +
            '<div class="toolbar-right">' +
                '<button class="btn btn-primary" id="' + prefijo + 'Nuevo" type="button">' + botonPrimarioTexto + '</button>' +
            '</div>' +
        '</div>';
    }

    function ctxMenuAbmHtml(id) {
        return '<div id="' + id + '" class="ctx-menu" role="menu">' +
            '<button type="button" data-action="consultar" role="menuitem">' +
                '<i class="fa-solid fa-eye"></i><span>Consultar</span>' +
            '</button>' +
            '<div class="ctx-menu-sep"></div>' +
            '<button type="button" data-action="editar" role="menuitem">' +
                '<i class="fa-solid fa-pen"></i><span>Editar</span>' +
            '</button>' +
            '<button type="button" data-action="eliminar" class="ctx-menu-danger" role="menuitem">' +
                '<i class="fa-solid fa-trash"></i><span>Eliminar</span>' +
            '</button>' +
        '</div>';
    }

    function abrirCtxMenuFlotante(ctxMenu, x, y) {
        ctxMenu.classList.add('open');
        var rect = ctxMenu.getBoundingClientRect();
        var w = rect.width, h = rect.height;
        var vw = window.innerWidth, vh = window.innerHeight;
        var left = Math.min(x, vw - w - 8);
        var top  = Math.min(y, vh - h - 8);
        ctxMenu.style.left = Math.max(8, left) + 'px';
        ctxMenu.style.top  = Math.max(8, top)  + 'px';
    }

    function conectarCierreCtxMenu(ctxMenu, cerrar) {
        document.addEventListener('click', function (ev) {
            if (ctxMenu.classList.contains('open') && !ctxMenu.contains(ev.target)) cerrar();
        });
        document.addEventListener('scroll',  function () { cerrar(); }, true);
        window.addEventListener('resize',    function () { cerrar(); });
        document.addEventListener('keydown', function (ev) {
            if (ev.key === 'Escape') cerrar();
        });
    }

    // -------- Vista: Usuarios ---------------------------------------------

    var usuariosFiltrosDefault = {
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
    var usuariosFiltros         = Object.assign({}, usuariosFiltrosDefault);
    var usuariosFiltrosSnapshot = null;
    var usuariosCache           = { comunidades: [] };
    var usuariosRegistroCache   = {};

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

    function usuariosFiltrosActivos() {
        var n = 0;
        Object.keys(usuariosFiltrosDefault).forEach(function (k) {
            if (k === 'sort' || k === 'dir' || k === 'limit') return;
            if (String(usuariosFiltros[k]) !== String(usuariosFiltrosDefault[k])) n++;
        });
        return n;
    }

    function usuariosCountText(n) {
        return 'Mostrando ' + n + ' resultado(s) (límite ' + usuariosFiltros.limit + ').';
    }

    function moduleHelpUsuariosHtml() {
        return '<div class="module-help" style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:14px 18px;margin-bottom:16px;box-shadow:var(--shadow);display:flex;gap:14px;align-items:center;">' +
            '<div style="font-size:1.6rem;line-height:1;">👤</div>' +
            '<div style="font-size:.88rem;color:var(--muted);line-height:1.45;">' +
                'Los usuarios son las personas con acceso al panel de Vigicom, con sus credenciales, datos de contacto y rol asignado que define qué acciones pueden ejecutar.' +
            '</div>' +
        '</div>';
    }

    function renderUsuariosStats(kpis) {
        return statCard('Total',     kpis.total     || 0, 'orange', 'Usuarios registrados') +
               statCard('Activos',   kpis.activos   || 0, 'green',  'Pueden iniciar sesión') +
               statCard('Inactivos', kpis.inactivos || 0, 'red',    'Sin acceso');
    }

    async function recargarUsuariosLista() {
        try {
            var data     = await api('/api/usuarios.php' + usuariosQueryString());
            var usuarios = data.usuarios    || [];
            var kpis     = data.kpis        || {};
            usuariosCache.comunidades = data.comunidades || [];
            usuariosRegistroCache = {};
            var stats = document.getElementById('usrStats');
            var tbody = document.getElementById('usrTbody');
            var count = document.getElementById('usrCount');
            if (stats) stats.innerHTML = renderUsuariosStats(kpis);
            if (tbody) tbody.innerHTML = renderFilasUsuarios(usuarios);
            if (count) count.textContent = usuariosCountText(usuarios.length);
            var btn = document.getElementById('usrFiltros');
            if (btn) {
                var n = usuariosFiltrosActivos();
                var badge = btn.querySelector('.btn-icon-badge');
                btn.classList.toggle('active', n > 0);
                if (badge) {
                    badge.textContent = n || '';
                    badge.style.display = n ? '' : 'none';
                }
            }
            var searchInput = document.getElementById('usrSearch');
            if (searchInput) searchInput.dispatchEvent(new Event('input'));
        } catch (err) {
            toast(err.message, true);
        }
    }

    async function renderUsuarios(view) {
        var data     = await api('/api/usuarios.php' + usuariosQueryString());
        var usuarios = data.usuarios    || [];
        var kpis     = data.kpis        || {};
        usuariosCache.comunidades = data.comunidades || [];
        usuariosRegistroCache = {};

        view.innerHTML =
            moduleHelpUsuariosHtml() +

            '<div class="stats-bar" id="usrStats">' + renderUsuariosStats(kpis) + '</div>' +

            toolbarSeguridadHtml('usr', '🔍 Buscar nombre, correo, DNI o teléfono…', '+ Nuevo usuario', usuariosFiltrosActivos()) +

            '<div class="table-card">' +
                '<table><thead><tr>' +
                    '<th>Código</th><th>Nombre</th><th>Contacto</th><th>Comunidad</th><th>Rol</th><th>Estado</th>' +
                    '<th style="text-align:center;">Acciones</th>' +
                '</tr></thead><tbody id="usrTbody">' +
                renderFilasUsuarios(usuarios) +
                '</tbody></table>' +
                '<div class="table-empty" id="usrEmpty" style="display:none;">No hay usuarios que coincidan con la búsqueda.</div>' +
            '</div>' +
            '<div class="text-muted text-sm" id="usrCount" style="margin-top:10px;">' +
                usuariosCountText(usuarios.length) +
            '</div>' +

            modalUsuarioHtml(usuariosCache.comunidades) +
            modalConsultarUsuarioHtml() +
            modalFiltrosUsuariosHtml(usuariosCache.comunidades) +
            confirmDeleteUsuarioHtml() +
            ctxMenuAbmHtml('usrCtxMenu');

        wireUsuariosView();
    }

    function renderFilasUsuarios(usuarios) {
        if (!usuarios.length) {
            return '<tr><td colspan="7" class="table-empty">No hay usuarios cargados.</td></tr>';
        }
        return usuarios.map(function (u) {
            var estado = parseInt(u.estado, 10) === 1 ? 1 : 0;
            var busq   = String((u.nombre || '') + ' ' + (u.correo || '') + ' ' + (u.dni || '') + ' ' + (u.telefono || '')).toLowerCase().trim();
            return '<tr data-id="' + u.id + '" data-estado="' + estado + '" data-search="' + e(busq) + '" style="cursor:pointer;">' +
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
                '<td style="text-align:center;">' +
                    '<div class="actions" style="justify-content:center;">' +
                        '<button class="btn-icon-sm" data-act="menu" type="button" title="Más acciones">' +
                            '<i class="fa-solid fa-bars"></i>' +
                        '</button>' +
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

    function modalFiltrosUsuariosHtml(comunidades) {
        var optsCom = comunidades.map(function (c) {
            return '<option value="' + c.id + '">' + e(c.nombre) + '</option>';
        }).join('');

        return '<div class="modal-backdrop" id="usrFiltrosModal"><div class="modal" style="max-width:560px;">' +
            '<div class="modal-header">' +
                '<div class="modal-title"><i class="fa-solid fa-filter"></i> Filtros</div>' +
                '<button class="btn btn-ghost" data-act="cerrar" type="button" title="Cerrar">&times;</button>' +
            '</div>' +
            '<div class="modal-body">' +
                '<div class="form-row">' +
                    '<div class="form-group"><label for="uflt-id">Código</label>' +
                        '<input id="uflt-id" type="number" min="1" step="1" inputmode="numeric" placeholder="ID del usuario…"></div>' +
                    '<div class="form-group"><label for="uflt-nombre">Nombre</label>' +
                        '<input id="uflt-nombre" type="text" maxlength="255" placeholder="Nombre del usuario…"></div>' +
                '</div>' +
                '<div class="form-row">' +
                    '<div class="form-group"><label for="uflt-correo">Correo</label>' +
                        '<input id="uflt-correo" type="search" maxlength="100" placeholder="ejemplo@correo.com"></div>' +
                    '<div class="form-group"><label for="uflt-telefono">Celular</label>' +
                        '<input id="uflt-telefono" type="tel" maxlength="20" placeholder="Número de celular"></div>' +
                '</div>' +
                '<div class="form-row">' +
                    '<div class="form-group"><label for="uflt-comunidad">Comunidad</label>' +
                        '<select id="uflt-comunidad"><option value="">Todas</option>' + optsCom + '</select></div>' +
                    '<div class="form-group"><label for="uflt-roles">Rol</label>' +
                        '<select id="uflt-roles">' +
                            '<option value="">Todos</option>' +
                            '<option value="admin">admin</option>' +
                            '<option value="operador">operador</option>' +
                            '<option value="vecino">vecino</option>' +
                        '</select></div>' +
                '</div>' +
                '<div class="form-group">' +
                    '<label>Estado del registro</label>' +
                    '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
                        '<button type="button" class="filter-chip" data-chip="estado" data-value="" >Todos</button>' +
                        '<button type="button" class="filter-chip" data-chip="estado" data-value="1">Activos</button>' +
                        '<button type="button" class="filter-chip" data-chip="estado" data-value="0">Inactivos</button>' +
                    '</div>' +
                '</div>' +
                '<div class="form-row form-row-3">' +
                    '<div class="form-group"><label for="uflt-limit">Límite</label>' +
                        '<input id="uflt-limit" type="number" min="1" max="1000" step="1" inputmode="numeric"></div>' +
                    '<div class="form-group"><label for="uflt-sort">Ordenar por</label>' +
                        '<select id="uflt-sort">' +
                            '<option value="id">Código</option>' +
                            '<option value="nombre">Nombre</option>' +
                            '<option value="correo">Correo</option>' +
                            '<option value="registrado">Fecha de registro</option>' +
                            '<option value="estado">Estado</option>' +
                        '</select></div>' +
                    '<div class="form-group"><label for="uflt-dir">Dirección</label>' +
                        '<select id="uflt-dir">' +
                            '<option value="desc">Descendente</option>' +
                            '<option value="asc">Ascendente</option>' +
                        '</select></div>' +
                '</div>' +
            '</div>' +
            '<div class="modal-footer">' +
                '<button type="button" class="btn btn-ghost"   data-act="cerrar"  >Cerrar</button>' +
                '<button type="button" class="btn btn-ghost"   data-act="limpiar" >Limpiar</button>' +
                '<button type="button" class="btn btn-primary" data-act="aplicar" >Aplicar</button>' +
            '</div>' +
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
                '<button type="button" class="btn btn-primary" id="usrConsultarEditar">' +
                    '<i class="fa-solid fa-pen"></i> Editar' +
                '</button>' +
            '</div>' +
        '</div></div>';
    }

    function confirmDeleteUsuarioHtml() {
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

        var confirmBox = document.getElementById('usrConfirm');
        var confirmMsg = document.getElementById('usrConfirmMsg');
        var btnDelete  = document.getElementById('usrConfirmBtn');

        var filtrosModal = document.getElementById('usrFiltrosModal');

        var consultarModal  = document.getElementById('usrConsultar');
        var consultarSub    = document.getElementById('usrConsultarSub');
        var consultarBody   = document.getElementById('usrConsultarBody');
        var consultarEditar = document.getElementById('usrConsultarEditar');

        var ctxMenu = document.getElementById('usrCtxMenu');
        var ctxId   = null;

        var pendingDeleteId   = null;
        var modoEdicion       = false;
        var consultarIdActual = null;

        // --- Búsqueda rápida cliente ----------------------------------------
        function applyClientFilter() {
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
        searchInput.addEventListener('input', applyClientFilter);
        searchClear.addEventListener('click', function () {
            searchInput.value = '';
            applyClientFilter();
            searchInput.focus();
        });

        // --- Refrescar -----------------------------------------------------
        document.getElementById('usrRefrescar').addEventListener('click', function () {
            recargarUsuariosLista();
        });

        // --- Modal de filtros (live apply + snapshot) ----------------------
        var fFltId    = document.getElementById('uflt-id');
        var fFltNom   = document.getElementById('uflt-nombre');
        var fFltCor   = document.getElementById('uflt-correo');
        var fFltTel   = document.getElementById('uflt-telefono');
        var fFltCom   = document.getElementById('uflt-comunidad');
        var fFltRol   = document.getElementById('uflt-roles');
        var fFltLim   = document.getElementById('uflt-limit');
        var fFltSort  = document.getElementById('uflt-sort');
        var fFltDir   = document.getElementById('uflt-dir');
        var fChipsEst = filtrosModal.querySelectorAll('.filter-chip[data-chip="estado"]');

        function sincronizarFiltros() {
            fFltId.value  = usuariosFiltros.filtro_id;
            fFltNom.value = usuariosFiltros.nombre;
            fFltCor.value = usuariosFiltros.correo;
            fFltTel.value = usuariosFiltros.telefono;
            fFltCom.value = usuariosFiltros.comunidad;
            fFltRol.value = usuariosFiltros.roles;
            fFltLim.value = usuariosFiltros.limit;
            fFltSort.value = usuariosFiltros.sort;
            fFltDir.value  = usuariosFiltros.dir;
            fChipsEst.forEach(function (c) {
                c.classList.toggle('active', c.dataset.value === String(usuariosFiltros.estado || ''));
            });
        }
        function abrirModalFiltros() {
            usuariosFiltrosSnapshot = Object.assign({}, usuariosFiltros);
            sincronizarFiltros();
            filtrosModal.classList.add('open');
        }
        function cerrarModalFiltros() { filtrosModal.classList.remove('open'); }
        function cancelarFiltros() {
            if (usuariosFiltrosSnapshot) {
                Object.keys(usuariosFiltrosSnapshot).forEach(function (k) {
                    usuariosFiltros[k] = usuariosFiltrosSnapshot[k];
                });
                usuariosFiltrosSnapshot = null;
                recargarUsuariosLista();
            }
            cerrarModalFiltros();
        }
        function limpiarFiltros() {
            Object.assign(usuariosFiltros, usuariosFiltrosDefault);
            sincronizarFiltros();
            recargarUsuariosLista();
        }

        document.getElementById('usrFiltros').addEventListener('click', abrirModalFiltros);
        filtrosModal.addEventListener('click', function (ev) {
            if (ev.target === filtrosModal) { cancelarFiltros(); return; }
            var b = ev.target.closest('button[data-act]');
            if (!b) return;
            if (b.dataset.act === 'cerrar')  cancelarFiltros();
            if (b.dataset.act === 'limpiar') limpiarFiltros();
            if (b.dataset.act === 'aplicar') { usuariosFiltrosSnapshot = null; cerrarModalFiltros(); }
        });

        function liveApply(field, valueGetter) {
            return function () {
                usuariosFiltros[field] = valueGetter();
                recargarUsuariosLista();
            };
        }
        fFltId.addEventListener('input',   liveApply('filtro_id', function () { return fFltId.value.trim(); }));
        fFltNom.addEventListener('input',  liveApply('nombre',    function () { return fFltNom.value.trim(); }));
        fFltCor.addEventListener('input',  liveApply('correo',    function () { return fFltCor.value.trim(); }));
        fFltTel.addEventListener('input',  liveApply('telefono',  function () { return fFltTel.value.trim(); }));
        fFltCom.addEventListener('change', liveApply('comunidad', function () { return fFltCom.value; }));
        fFltRol.addEventListener('change', liveApply('roles',     function () { return fFltRol.value; }));
        fFltLim.addEventListener('change', liveApply('limit',     function () { return parseInt(fFltLim.value, 10) || 100; }));
        fFltSort.addEventListener('change', liveApply('sort',     function () { return fFltSort.value || 'id'; }));
        fFltDir.addEventListener('change',  liveApply('dir',      function () { return fFltDir.value  || 'desc'; }));
        fChipsEst.forEach(function (chip) {
            chip.addEventListener('click', function () {
                usuariosFiltros.estado = chip.dataset.value;
                fChipsEst.forEach(function (c) { c.classList.toggle('active', c === chip); });
                recargarUsuariosLista();
            });
        });

        // --- Menú contextual de fila ---------------------------------------
        function cerrarCtxMenu() {
            ctxMenu.classList.remove('open');
            ctxId = null;
        }
        ctxMenu.addEventListener('click', function (ev) {
            var b = ev.target.closest('button[data-action]');
            if (!b || ctxId == null) return;
            var id = ctxId;
            cerrarCtxMenu();
            if (b.dataset.action === 'consultar')     abrirConsulta(id);
            else if (b.dataset.action === 'editar')   abrirEdicion(id);
            else if (b.dataset.action === 'eliminar') pedirEliminar(id);
        });
        conectarCierreCtxMenu(ctxMenu, cerrarCtxMenu);

        // --- Filas: clic = Consultar, click derecho = ctx menu -------------
        tbody.addEventListener('click', function (ev) {
            var tr = ev.target.closest('tr[data-id]');
            if (!tr) return;
            var id = parseInt(tr.dataset.id, 10);
            var btn = ev.target.closest('button[data-act="menu"]');
            if (btn) {
                ev.stopPropagation();
                var rect = btn.getBoundingClientRect();
                abrirCtxMenuFlotante(ctxMenu, rect.right - 200, rect.bottom + 4);
                ctxId = id;
                return;
            }
            if (ev.target.closest('a,input,select,button')) return;
            abrirConsulta(id);
        });
        tbody.addEventListener('contextmenu', function (ev) {
            var tr = ev.target.closest('tr[data-id]');
            if (!tr) return;
            ev.preventDefault();
            var id = parseInt(tr.dataset.id, 10);
            abrirCtxMenuFlotante(ctxMenu, ev.clientX, ev.clientY);
            ctxId = id;
        });

        // --- Modal Consultar ----------------------------------------------
        consultarModal.addEventListener('click', function (ev) {
            if (ev.target === consultarModal || ev.target.closest('[data-act="close"]')) {
                consultarModal.classList.remove('open');
            }
        });
        consultarEditar.addEventListener('click', function () {
            if (consultarIdActual == null) return;
            consultarModal.classList.remove('open');
            abrirEdicion(consultarIdActual);
        });

        async function abrirConsulta(id) {
            consultarIdActual = id;
            consultarSub.innerHTML  = '<code>#' + id + '</code>';
            consultarBody.innerHTML = '<div style="display:flex;justify-content:center;padding:24px"><div class="spin"></div></div>';
            consultarModal.classList.add('open');

            var u;
            try {
                u = usuariosRegistroCache[id] || (usuariosRegistroCache[id] = await api('/api/usuarios.php?id=' + id));
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
                abmRow    ('Código',                 '<code>#' + u.id + '</code>') +
                abmRow    ('Estado',                 estadoBadge) +
                abmRowTxt ('Nombre',                 u.nombre,               'Sin nombre',    true) +
                abmRowTxt ('Correo',                 u.correo,               'Sin correo') +
                abmRowTxt ('Teléfono',               u.telefono,             'Sin teléfono') +
                abmRowTxt ('DNI',                    u.dni,                  'Sin DNI') +
                abmRowTxt ('Género',                 u.genero,               'Sin género') +
                abmRowTxt ('Fecha de nacimiento',    nacimiento,             'Sin fecha') +
                abmRowRef ('Comunidad',              u.comunidad,  u.comunidad_nombre, 'Sin comunidad') +
                abmRowRef ('Casa',                   u.casa,       u.casa_nombre,      'Sin casa') +
                abmRowTxt ('Rol',                    u.roles,                'Sin rol') +
                abmRowTxt ('Aplicación',             u.aplicacion,           'Sin app') +
                abmRowSiNo('Usuario de sistema',     u.sistema) +
                abmRowTxt ('Instalada',              abmFecha(u.instalada),           'Sin instalación') +
                abmRowTxt ('Última ejecución',       abmFecha(u.ejecutada),           'Sin ejecución') +
                abmRowTxt ('Coordenadas',            u.ubicacionCoordenadas,          'Sin coordenadas') +
                abmRowTxt ('Exactitud',              u.ubicacionExactitud,            'Sin exactitud') +
                abmRowTxt ('Ubicación actualizada',  abmFecha(u.ubicacionActualizada),'Sin ubicación') +
                abmRowSiNo('Avisos',                 u.avisos) +
                abmRowSiNo('Notificaciones',         u.notificaciones) +
                abmRowSiNo('WhatsApps',              u.whatsapps) +
                abmRowSiNo('Mensajes',               u.mensajes) +
                abmRowSiNo('Correos',                u.correos) +
                abmRowTxt ('Terminal',               u.terminal != null ? '#' + u.terminal : null, 'Sin terminal') +
                abmRowTxt ('Fecha de registro',      abmFecha(u.registrado),          'Sin registro') +
                abmRowRef ('Registrado por',         u.registrante, u.registrante_nombre, 'Sin registrante') +
                abmRowTxt ('Propiedades',            u.propiedades,          'Sin propiedades', true);
        }

        // --- Modal Alta / Edición -----------------------------------------
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

        async function abrirEdicion(id) {
            try {
                var u = await api('/api/usuarios.php?id=' + id);
                usuariosRegistroCache[id] = u;
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
        }

        function pedirEliminar(id) {
            if (id === parseInt(ME.id, 10)) {
                toast('No podés eliminar tu propio usuario.', true);
                return;
            }
            var tr = tbody.querySelector('tr[data-id="' + id + '"]');
            var nombre = tr ? ((tr.querySelector('.td-nombre') || {}).textContent || '').trim() : '';
            confirmMsg.textContent = nombre
                ? '¿Eliminar al usuario "' + nombre + '"? Esta acción no se puede deshacer.'
                : '¿Eliminar al usuario #' + id + '? Esta acción no se puede deshacer.';
            pendingDeleteId = id;
            confirmBox.classList.add('open');
        }
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
                recargarUsuariosLista();
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
                recargarUsuariosLista();
            } catch (err) {
                showFormError(err.message);
            } finally {
                btnGuardar.disabled = false;
            }
        });

        applyClientFilter();
    }

    // -------- Vista: Roles ------------------------------------------------

    var rolesFiltrosDefault = {
        sort:        'id',
        dir:         'desc',
        limit:       100,
        filtro_id:   '',
        nombre:      '',
        slug:        '',
        descripcion: '',
        sistema:     ''
    };
    var rolesFiltros         = Object.assign({}, rolesFiltrosDefault);
    var rolesFiltrosSnapshot = null;
    var rolesRegistroCache   = {};

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

    function rolesFiltrosActivos() {
        var n = 0;
        Object.keys(rolesFiltrosDefault).forEach(function (k) {
            if (k === 'sort' || k === 'dir' || k === 'limit') return;
            if (String(rolesFiltros[k]) !== String(rolesFiltrosDefault[k])) n++;
        });
        return n;
    }

    function rolesCountText(n) {
        return 'Mostrando ' + n + ' resultado(s) (límite ' + rolesFiltros.limit + ').';
    }

    function moduleHelpRolesHtml() {
        return '<div class="module-help" style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:14px 18px;margin-bottom:16px;box-shadow:var(--shadow);display:flex;gap:14px;align-items:center;">' +
            '<div style="font-size:1.6rem;line-height:1;">🛡️</div>' +
            '<div style="font-size:.88rem;color:var(--muted);line-height:1.45;">' +
                'Los roles son los conjuntos de permisos que se asignan a los usuarios para definir qué pueden ver y qué acciones pueden ejecutar dentro del sistema.' +
            '</div>' +
        '</div>';
    }

    function renderRolesStats(kpis) {
        return statCard('Total',         kpis.total   || 0, 'orange', 'Roles registrados') +
               statCard('De sistema',    kpis.sistema || 0, 'red',    'No se pueden eliminar') +
               statCard('Personalizados',kpis.custom  || 0, 'green',  'Definidos por el usuario');
    }

    async function recargarRolesLista() {
        try {
            var data  = await api('/api/roles.php' + rolesQueryString());
            var roles = data.roles || [];
            var kpis  = data.kpis  || {};
            rolesRegistroCache = {};
            var stats = document.getElementById('rolStats');
            var tbody = document.getElementById('rolTbody');
            var count = document.getElementById('rolCount');
            if (stats) stats.innerHTML = renderRolesStats(kpis);
            if (tbody) tbody.innerHTML = renderFilasRoles(roles);
            if (count) count.textContent = rolesCountText(roles.length);
            var btn = document.getElementById('rolFiltros');
            if (btn) {
                var n = rolesFiltrosActivos();
                var badge = btn.querySelector('.btn-icon-badge');
                btn.classList.toggle('active', n > 0);
                if (badge) {
                    badge.textContent = n || '';
                    badge.style.display = n ? '' : 'none';
                }
            }
            var searchInput = document.getElementById('rolSearch');
            if (searchInput) searchInput.dispatchEvent(new Event('input'));
        } catch (err) {
            toast(err.message, true);
        }
    }

    async function renderRoles(view) {
        var data  = await api('/api/roles.php' + rolesQueryString());
        var roles = data.roles || [];
        var kpis  = data.kpis  || {};
        rolesRegistroCache = {};

        view.innerHTML =
            moduleHelpRolesHtml() +

            '<div class="stats-bar" id="rolStats">' + renderRolesStats(kpis) + '</div>' +

            toolbarSeguridadHtml('rol', '🔍 Buscar nombre, slug o descripción…', '+ Nuevo rol', rolesFiltrosActivos()) +

            '<div class="table-card">' +
                '<table><thead><tr>' +
                    '<th>Código</th><th>Nombre</th><th>Slug</th><th>Descripción</th><th>Tipo</th>' +
                    '<th style="text-align:center;">Acciones</th>' +
                '</tr></thead><tbody id="rolTbody">' +
                renderFilasRoles(roles) +
                '</tbody></table>' +
                '<div class="table-empty" id="rolEmpty" style="display:none;">No hay roles que coincidan con la búsqueda.</div>' +
            '</div>' +
            '<div class="text-muted text-sm" id="rolCount" style="margin-top:10px;">' +
                rolesCountText(roles.length) +
            '</div>' +

            modalRolHtml() +
            modalFiltrosRolesHtml() +
            modalConsultarRolHtml() +
            confirmDeleteRolHtml() +
            ctxMenuAbmHtml('rolCtxMenu');

        wireRolesView();
    }

    function renderFilasRoles(roles) {
        if (!roles.length) {
            return '<tr><td colspan="6" class="table-empty">No hay roles cargados.</td></tr>';
        }
        return roles.map(function (r) {
            var esSistema = String(r.sistema || '') === '1';
            var busq   = String((r.nombre || '') + ' ' + (r.slug || '') + ' ' + (r.descripcion || '')).toLowerCase().trim();
            return '<tr data-id="' + r.id + '" data-sistema="' + (esSistema ? 1 : 0) + '" data-search="' + e(busq) + '" style="cursor:pointer;">' +
                '<td class="td-id">#' + r.id + '</td>' +
                '<td><div class="td-nombre">' + e(r.nombre || '—') + '</div></td>' +
                '<td>' + (r.slug ? '<code>' + e(r.slug) + '</code>' : '<span class="text-muted">—</span>') + '</td>' +
                '<td>' + e(r.descripcion || '—') + '</td>' +
                '<td>' +
                    (esSistema
                        ? '<span class="badge badge-danger">Sistema</span>'
                        : '<span class="badge badge-success">Personalizado</span>') +
                '</td>' +
                '<td style="text-align:center;">' +
                    '<div class="actions" style="justify-content:center;">' +
                        '<button class="btn-icon-sm" data-act="menu" type="button" title="Más acciones">' +
                            '<i class="fa-solid fa-bars"></i>' +
                        '</button>' +
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
                        '<div class="form-group" style="flex:1 1 100%;"><label for="rol-slug">Slug</label>' +
                            '<input id="rol-slug" name="slug" type="text" maxlength="64" ' +
                                'pattern="[a-z0-9]+(?:[-_.][a-z0-9]+)*" ' +
                                'placeholder="ej: admin, gestor.ventas, operador_l2" ' +
                                'style="font-family:monospace;"></div>' +
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
        return '<div class="modal-backdrop" id="rolFiltrosModal"><div class="modal" style="max-width:560px;">' +
            '<div class="modal-header">' +
                '<div class="modal-title"><i class="fa-solid fa-filter"></i> Filtros</div>' +
                '<button class="btn btn-ghost" data-act="cerrar" type="button" title="Cerrar">&times;</button>' +
            '</div>' +
            '<div class="modal-body">' +
                '<div class="form-row">' +
                    '<div class="form-group"><label for="rflt-id">Código</label>' +
                        '<input id="rflt-id" type="number" min="1" step="1" inputmode="numeric" placeholder="ID del rol…"></div>' +
                    '<div class="form-group"><label for="rflt-nombre">Nombre</label>' +
                        '<input id="rflt-nombre" type="text" maxlength="255" placeholder="Nombre del rol…"></div>' +
                '</div>' +
                '<div class="form-row">' +
                    '<div class="form-group"><label for="rflt-slug">Slug</label>' +
                        '<input id="rflt-slug" type="text" maxlength="64" placeholder="Texto en slug" style="font-family:monospace;"></div>' +
                    '<div class="form-group"><label for="rflt-descripcion">Descripción</label>' +
                        '<input id="rflt-descripcion" type="text" maxlength="255" placeholder="Texto en descripción"></div>' +
                '</div>' +
                '<div class="form-group">' +
                    '<label>Tipo</label>' +
                    '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
                        '<button type="button" class="filter-chip" data-chip="sistema" data-value="" >Todos</button>' +
                        '<button type="button" class="filter-chip" data-chip="sistema" data-value="1">Sistema</button>' +
                        '<button type="button" class="filter-chip" data-chip="sistema" data-value="0">Personalizados</button>' +
                    '</div>' +
                '</div>' +
                '<div class="form-row form-row-3">' +
                    '<div class="form-group"><label for="rflt-limit">Límite</label>' +
                        '<input id="rflt-limit" type="number" min="1" max="1000" step="1" inputmode="numeric"></div>' +
                    '<div class="form-group"><label for="rflt-sort">Ordenar por</label>' +
                        '<select id="rflt-sort">' +
                            '<option value="id">Código</option>' +
                            '<option value="nombre">Nombre</option>' +
                            '<option value="slug">Slug</option>' +
                            '<option value="descripcion">Descripción</option>' +
                            '<option value="sistema">Tipo</option>' +
                        '</select></div>' +
                    '<div class="form-group"><label for="rflt-dir">Dirección</label>' +
                        '<select id="rflt-dir">' +
                            '<option value="desc">Descendente</option>' +
                            '<option value="asc">Ascendente</option>' +
                        '</select></div>' +
                '</div>' +
            '</div>' +
            '<div class="modal-footer">' +
                '<button type="button" class="btn btn-ghost"   data-act="cerrar"  >Cerrar</button>' +
                '<button type="button" class="btn btn-ghost"   data-act="limpiar" >Limpiar</button>' +
                '<button type="button" class="btn btn-primary" data-act="aplicar" >Aplicar</button>' +
            '</div>' +
        '</div></div>';
    }

    function modalConsultarRolHtml() {
        return '<div class="modal-backdrop" id="rolConsultar"><div class="modal modal-wide">' +
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
                '<button type="button" class="btn btn-primary" id="rolConsultarEditar">' +
                    '<i class="fa-solid fa-pen"></i> Editar' +
                '</button>' +
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

        var filtrosModal = document.getElementById('rolFiltrosModal');

        var consultarModal  = document.getElementById('rolConsultar');
        var consultarSub    = document.getElementById('rolConsultarSub');
        var consultarBody   = document.getElementById('rolConsultarBody');
        var consultarEditar = document.getElementById('rolConsultarEditar');

        var ctxMenu = document.getElementById('rolCtxMenu');
        var ctxId   = null;

        var pendingDeleteId   = null;
        var modoEdicion       = false;
        var consultarIdActual = null;

        // --- Búsqueda rápida cliente ----------------------------------------
        function applyClientFilter() {
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
        searchInput.addEventListener('input', applyClientFilter);
        searchClear.addEventListener('click', function () {
            searchInput.value = '';
            applyClientFilter();
            searchInput.focus();
        });

        // --- Refrescar -----------------------------------------------------
        document.getElementById('rolRefrescar').addEventListener('click', function () {
            recargarRolesLista();
        });

        // --- Modal de filtros (live apply + snapshot) ----------------------
        var fFltId    = document.getElementById('rflt-id');
        var fFltNom   = document.getElementById('rflt-nombre');
        var fFltSlug  = document.getElementById('rflt-slug');
        var fFltDesc  = document.getElementById('rflt-descripcion');
        var fFltLim   = document.getElementById('rflt-limit');
        var fFltSort  = document.getElementById('rflt-sort');
        var fFltDir   = document.getElementById('rflt-dir');
        var fChipsSis = filtrosModal.querySelectorAll('.filter-chip[data-chip="sistema"]');

        function sincronizarFiltros() {
            fFltId.value   = rolesFiltros.filtro_id;
            fFltNom.value  = rolesFiltros.nombre;
            fFltSlug.value = rolesFiltros.slug;
            fFltDesc.value = rolesFiltros.descripcion;
            fFltLim.value  = rolesFiltros.limit;
            fFltSort.value = rolesFiltros.sort;
            fFltDir.value  = rolesFiltros.dir;
            fChipsSis.forEach(function (c) {
                c.classList.toggle('active', c.dataset.value === String(rolesFiltros.sistema || ''));
            });
        }
        function abrirModalFiltros() {
            rolesFiltrosSnapshot = Object.assign({}, rolesFiltros);
            sincronizarFiltros();
            filtrosModal.classList.add('open');
        }
        function cerrarModalFiltros() { filtrosModal.classList.remove('open'); }
        function cancelarFiltros() {
            if (rolesFiltrosSnapshot) {
                Object.keys(rolesFiltrosSnapshot).forEach(function (k) {
                    rolesFiltros[k] = rolesFiltrosSnapshot[k];
                });
                rolesFiltrosSnapshot = null;
                recargarRolesLista();
            }
            cerrarModalFiltros();
        }
        function limpiarFiltros() {
            Object.assign(rolesFiltros, rolesFiltrosDefault);
            sincronizarFiltros();
            recargarRolesLista();
        }

        document.getElementById('rolFiltros').addEventListener('click', abrirModalFiltros);
        filtrosModal.addEventListener('click', function (ev) {
            if (ev.target === filtrosModal) { cancelarFiltros(); return; }
            var b = ev.target.closest('button[data-act]');
            if (!b) return;
            if (b.dataset.act === 'cerrar')  cancelarFiltros();
            if (b.dataset.act === 'limpiar') limpiarFiltros();
            if (b.dataset.act === 'aplicar') { rolesFiltrosSnapshot = null; cerrarModalFiltros(); }
        });

        function liveApply(field, valueGetter) {
            return function () {
                rolesFiltros[field] = valueGetter();
                recargarRolesLista();
            };
        }
        fFltId.addEventListener('input',   liveApply('filtro_id',   function () { return fFltId.value.trim(); }));
        fFltNom.addEventListener('input',  liveApply('nombre',      function () { return fFltNom.value.trim(); }));
        fFltSlug.addEventListener('input', liveApply('slug',        function () { return fFltSlug.value.trim(); }));
        fFltDesc.addEventListener('input', liveApply('descripcion', function () { return fFltDesc.value.trim(); }));
        fFltLim.addEventListener('change',  liveApply('limit',      function () { return parseInt(fFltLim.value, 10) || 100; }));
        fFltSort.addEventListener('change', liveApply('sort',       function () { return fFltSort.value || 'id'; }));
        fFltDir.addEventListener('change',  liveApply('dir',        function () { return fFltDir.value  || 'desc'; }));
        fChipsSis.forEach(function (chip) {
            chip.addEventListener('click', function () {
                rolesFiltros.sistema = chip.dataset.value;
                fChipsSis.forEach(function (c) { c.classList.toggle('active', c === chip); });
                recargarRolesLista();
            });
        });

        // --- Menú contextual de fila ---------------------------------------
        function cerrarCtxMenu() {
            ctxMenu.classList.remove('open');
            ctxId = null;
        }
        ctxMenu.addEventListener('click', function (ev) {
            var b = ev.target.closest('button[data-action]');
            if (!b || ctxId == null) return;
            var id = ctxId;
            cerrarCtxMenu();
            if (b.dataset.action === 'consultar')     abrirConsulta(id);
            else if (b.dataset.action === 'editar')   abrirEdicion(id);
            else if (b.dataset.action === 'eliminar') pedirEliminar(id);
        });
        conectarCierreCtxMenu(ctxMenu, cerrarCtxMenu);

        // --- Filas: clic = Consultar, click derecho = ctx menu -------------
        tbody.addEventListener('click', function (ev) {
            var tr = ev.target.closest('tr[data-id]');
            if (!tr) return;
            var id = parseInt(tr.dataset.id, 10);
            var btn = ev.target.closest('button[data-act="menu"]');
            if (btn) {
                ev.stopPropagation();
                var rect = btn.getBoundingClientRect();
                abrirCtxMenuFlotante(ctxMenu, rect.right - 200, rect.bottom + 4);
                ctxId = id;
                return;
            }
            if (ev.target.closest('a,input,select,button')) return;
            abrirConsulta(id);
        });
        tbody.addEventListener('contextmenu', function (ev) {
            var tr = ev.target.closest('tr[data-id]');
            if (!tr) return;
            ev.preventDefault();
            var id = parseInt(tr.dataset.id, 10);
            abrirCtxMenuFlotante(ctxMenu, ev.clientX, ev.clientY);
            ctxId = id;
        });

        // --- Modal Consultar ----------------------------------------------
        consultarModal.addEventListener('click', function (ev) {
            if (ev.target === consultarModal || ev.target.closest('[data-act="close"]')) {
                consultarModal.classList.remove('open');
            }
        });
        consultarEditar.addEventListener('click', function () {
            if (consultarIdActual == null) return;
            consultarModal.classList.remove('open');
            abrirEdicion(consultarIdActual);
        });

        async function abrirConsulta(id) {
            consultarIdActual = id;
            consultarSub.innerHTML  = '<code>#' + id + '</code>';
            consultarBody.innerHTML = '<div style="display:flex;justify-content:center;padding:24px"><div class="spin"></div></div>';
            consultarModal.classList.add('open');

            var r;
            try {
                r = rolesRegistroCache[id] || (rolesRegistroCache[id] = await api('/api/roles.php?id=' + id));
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
                abmRowTxt ('Nombre',       r.nombre,      'Sin nombre') +
                abmRow    ('Slug',         r.slug ? '<code>' + e(r.slug) + '</code>' : '<span class="muted">Sin slug</span>') +
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

        async function abrirEdicion(id) {
            try {
                var r = await api('/api/roles.php?id=' + id);
                rolesRegistroCache[id] = r;
                modoEdicion = true;
                resetForm();
                fId.value = r.id;
                modalTitulo.textContent = 'Editar rol';
                modalSub.textContent    = '#' + r.id;
                document.getElementById('rol-nombre').value      = r.nombre      || '';
                document.getElementById('rol-slug').value        = r.slug        || '';
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
        }

        function pedirEliminar(id) {
            var tr = tbody.querySelector('tr[data-id="' + id + '"]');
            if (tr && parseInt(tr.dataset.sistema, 10) === 1) {
                toast('No se puede eliminar un rol de sistema.', true);
                return;
            }
            var nombre = tr ? ((tr.querySelector('.td-nombre') || {}).textContent || '').trim() : '';
            confirmMsg.textContent = nombre
                ? '¿Eliminar el rol "' + nombre + '"? Esta acción no se puede deshacer.'
                : '¿Eliminar el rol #' + id + '? Esta acción no se puede deshacer.';
            pendingDeleteId = id;
            confirmBox.classList.add('open');
        }
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
                recargarRolesLista();
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
                slug:        document.getElementById('rol-slug').value.trim(),
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
                recargarRolesLista();
            } catch (err) {
                showFormError(err.message);
            } finally {
                btnGuardar.disabled = false;
            }
        });

        applyClientFilter();
    }

    // -------- Vista: Permisos ---------------------------------------------

    var permisosFiltrosDefault = {
        sort:        'id',
        dir:         'desc',
        limit:       100,
        filtro_id:   '',
        nombre:      '',
        slug:        '',
        descripcion: '',
        sistema:     ''
    };
    var permisosFiltros         = Object.assign({}, permisosFiltrosDefault);
    var permisosFiltrosSnapshot = null;
    var permisosRegistroCache   = {};

    function permisosQueryString() {
        var qs = [];
        Object.keys(permisosFiltros).forEach(function (k) {
            var v = permisosFiltros[k];
            if (v !== '' && v != null) {
                qs.push(encodeURIComponent(k) + '=' + encodeURIComponent(v));
            }
        });
        return qs.length ? ('?' + qs.join('&')) : '';
    }

    function permisosFiltrosActivos() {
        var n = 0;
        Object.keys(permisosFiltrosDefault).forEach(function (k) {
            if (k === 'sort' || k === 'dir' || k === 'limit') return;
            if (String(permisosFiltros[k]) !== String(permisosFiltrosDefault[k])) n++;
        });
        return n;
    }

    function permisosCountText(n) {
        return 'Mostrando ' + n + ' resultado(s) (límite ' + permisosFiltros.limit + ').';
    }

    function moduleHelpPermisosHtml() {
        return '<div class="module-help" style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:14px 18px;margin-bottom:16px;box-shadow:var(--shadow);display:flex;gap:14px;align-items:center;">' +
            '<div style="font-size:1.6rem;line-height:1;">🔑</div>' +
            '<div style="font-size:.88rem;color:var(--muted);line-height:1.45;">' +
                'Los permisos son las capacidades individuales que se agrupan dentro de los roles y determinan qué operaciones concretas puede ejecutar cada usuario del sistema.' +
            '</div>' +
        '</div>';
    }

    function renderPermisosStats(kpis) {
        return statCard('Total',         kpis.total   || 0, 'orange', 'Permisos registrados') +
               statCard('De sistema',    kpis.sistema || 0, 'red',    'No se pueden eliminar') +
               statCard('Personalizados',kpis.custom  || 0, 'green',  'Definidos por el usuario');
    }

    async function recargarPermisosLista() {
        try {
            var data     = await api('/api/permisos.php' + permisosQueryString());
            var permisos = data.permisos || [];
            var kpis     = data.kpis     || {};
            permisosRegistroCache = {};
            var stats = document.getElementById('permStats');
            var tbody = document.getElementById('permTbody');
            var count = document.getElementById('permCount');
            if (stats) stats.innerHTML = renderPermisosStats(kpis);
            if (tbody) tbody.innerHTML = renderFilasPermisos(permisos);
            if (count) count.textContent = permisosCountText(permisos.length);
            var btn = document.getElementById('permFiltros');
            if (btn) {
                var n = permisosFiltrosActivos();
                var badge = btn.querySelector('.btn-icon-badge');
                btn.classList.toggle('active', n > 0);
                if (badge) {
                    badge.textContent = n || '';
                    badge.style.display = n ? '' : 'none';
                }
            }
            var searchInput = document.getElementById('permSearch');
            if (searchInput) searchInput.dispatchEvent(new Event('input'));
        } catch (err) {
            toast(err.message, true);
        }
    }

    async function renderPermisos(view) {
        var data     = await api('/api/permisos.php' + permisosQueryString());
        var permisos = data.permisos || [];
        var kpis     = data.kpis     || {};
        permisosRegistroCache = {};

        view.innerHTML =
            moduleHelpPermisosHtml() +

            '<div class="stats-bar" id="permStats">' + renderPermisosStats(kpis) + '</div>' +

            toolbarSeguridadHtml('perm', '🔍 Buscar nombre, slug o descripción…', '+ Nuevo permiso', permisosFiltrosActivos()) +

            '<div class="table-card">' +
                '<table><thead><tr>' +
                    '<th>Código</th><th>Nombre</th><th>Slug</th><th>Descripción</th><th>Tipo</th>' +
                    '<th style="text-align:center;">Acciones</th>' +
                '</tr></thead><tbody id="permTbody">' +
                renderFilasPermisos(permisos) +
                '</tbody></table>' +
                '<div class="table-empty" id="permEmpty" style="display:none;">No hay permisos que coincidan con la búsqueda.</div>' +
            '</div>' +
            '<div class="text-muted text-sm" id="permCount" style="margin-top:10px;">' +
                permisosCountText(permisos.length) +
            '</div>' +

            modalPermisoHtml() +
            modalFiltrosPermisosHtml() +
            modalConsultarPermisoHtml() +
            confirmDeletePermisoHtml() +
            ctxMenuAbmHtml('permCtxMenu');

        wirePermisosView();
    }

    function renderFilasPermisos(permisos) {
        if (!permisos.length) {
            return '<tr><td colspan="6" class="table-empty">No hay permisos cargados.</td></tr>';
        }
        return permisos.map(function (p) {
            var esSistema = String(p.sistema || '') === '1';
            var busq   = String((p.nombre || '') + ' ' + (p.slug || '') + ' ' + (p.descripcion || '')).toLowerCase().trim();
            return '<tr data-id="' + p.id + '" data-sistema="' + (esSistema ? 1 : 0) + '" data-search="' + e(busq) + '" style="cursor:pointer;">' +
                '<td class="td-id">#' + p.id + '</td>' +
                '<td><div class="td-nombre">' + e(p.nombre || '—') + '</div></td>' +
                '<td>' + (p.slug ? '<code>' + e(p.slug) + '</code>' : '<span class="text-muted">—</span>') + '</td>' +
                '<td>' + e(p.descripcion || '—') + '</td>' +
                '<td>' +
                    (esSistema
                        ? '<span class="badge badge-danger">Sistema</span>'
                        : '<span class="badge badge-success">Personalizado</span>') +
                '</td>' +
                '<td style="text-align:center;">' +
                    '<div class="actions" style="justify-content:center;">' +
                        '<button class="btn-icon-sm" data-act="menu" type="button" title="Más acciones">' +
                            '<i class="fa-solid fa-bars"></i>' +
                        '</button>' +
                    '</div>' +
                '</td>' +
            '</tr>';
        }).join('');
    }

    function modalPermisoHtml() {
        return '<div class="modal-backdrop" id="permModal"><div class="modal">' +
            '<div class="modal-header">' +
                '<div class="modal-title">' +
                    '<span id="permModalTitulo">Nuevo permiso</span>' +
                    '<span class="modal-subtitle" id="permModalSub"></span>' +
                '</div>' +
                '<button class="btn-icon-sm" data-act="close" type="button" aria-label="Cerrar">&times;</button>' +
            '</div>' +
            '<form id="permForm" novalidate>' +
                '<input type="hidden" id="permId" value="">' +
                '<div class="modal-body">' +
                    '<div class="alert alert-error" id="permError" style="display:none;"></div>' +
                    '<div class="form-row">' +
                        '<div class="form-group"><label for="perm-nombre">Nombre</label>' +
                            '<input id="perm-nombre" name="nombre" type="text" maxlength="255" required></div>' +
                        '<div class="form-group"><label>Tipo</label>' +
                            '<label class="toggle-switch" style="margin-top:6px;">' +
                                '<input id="perm-sistema" name="sistema" type="checkbox" value="1">' +
                                '<span class="toggle-track"><span class="toggle-thumb"></span></span>' +
                                '<span class="toggle-label" id="permSistemaLabel">Personalizado</span>' +
                            '</label></div>' +
                    '</div>' +
                    '<div class="form-row">' +
                        '<div class="form-group" style="flex:1 1 100%;"><label for="perm-slug">Slug</label>' +
                            '<input id="perm-slug" name="slug" type="text" maxlength="64" ' +
                                'pattern="[a-z0-9]+(?:[-_.][a-z0-9]+)*" ' +
                                'placeholder="ej: usuarios.editar, comunidades.baja" ' +
                                'style="font-family:monospace;"></div>' +
                    '</div>' +
                    '<div class="form-row">' +
                        '<div class="form-group" style="flex:1 1 100%;"><label for="perm-descripcion">Descripción</label>' +
                            '<textarea id="perm-descripcion" name="descripcion" rows="3" maxlength="255"></textarea></div>' +
                    '</div>' +
                '</div>' +
                '<div class="modal-footer">' +
                    '<button type="button" class="btn btn-ghost" data-act="close">Cancelar</button>' +
                    '<button type="submit" class="btn btn-primary" id="permGuardar">Guardar</button>' +
                '</div>' +
            '</form>' +
        '</div></div>';
    }

    function confirmDeletePermisoHtml() {
        return '<div class="confirm-backdrop" id="permConfirm"><div class="confirm-box">' +
            '<div class="confirm-title">Eliminar permiso</div>' +
            '<div class="confirm-msg" id="permConfirmMsg">Esta acción no se puede deshacer.</div>' +
            '<div class="confirm-actions">' +
                '<button class="btn btn-ghost"  data-act="cancel" type="button">Cancelar</button>' +
                '<button class="btn btn-danger" id="permConfirmBtn" type="button">Eliminar</button>' +
            '</div>' +
        '</div></div>';
    }

    function modalFiltrosPermisosHtml() {
        return '<div class="modal-backdrop" id="permFiltrosModal"><div class="modal" style="max-width:560px;">' +
            '<div class="modal-header">' +
                '<div class="modal-title"><i class="fa-solid fa-filter"></i> Filtros</div>' +
                '<button class="btn btn-ghost" data-act="cerrar" type="button" title="Cerrar">&times;</button>' +
            '</div>' +
            '<div class="modal-body">' +
                '<div class="form-row">' +
                    '<div class="form-group"><label for="pflt-id">Código</label>' +
                        '<input id="pflt-id" type="number" min="1" step="1" inputmode="numeric" placeholder="ID del permiso…"></div>' +
                    '<div class="form-group"><label for="pflt-nombre">Nombre</label>' +
                        '<input id="pflt-nombre" type="text" maxlength="255" placeholder="Nombre del permiso…"></div>' +
                '</div>' +
                '<div class="form-row">' +
                    '<div class="form-group"><label for="pflt-slug">Slug</label>' +
                        '<input id="pflt-slug" type="text" maxlength="64" placeholder="Texto en slug" style="font-family:monospace;"></div>' +
                    '<div class="form-group"><label for="pflt-descripcion">Descripción</label>' +
                        '<input id="pflt-descripcion" type="text" maxlength="255" placeholder="Texto en descripción"></div>' +
                '</div>' +
                '<div class="form-group">' +
                    '<label>Tipo</label>' +
                    '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
                        '<button type="button" class="filter-chip" data-chip="sistema" data-value="" >Todos</button>' +
                        '<button type="button" class="filter-chip" data-chip="sistema" data-value="1">Sistema</button>' +
                        '<button type="button" class="filter-chip" data-chip="sistema" data-value="0">Personalizados</button>' +
                    '</div>' +
                '</div>' +
                '<div class="form-row form-row-3">' +
                    '<div class="form-group"><label for="pflt-limit">Límite</label>' +
                        '<input id="pflt-limit" type="number" min="1" max="1000" step="1" inputmode="numeric"></div>' +
                    '<div class="form-group"><label for="pflt-sort">Ordenar por</label>' +
                        '<select id="pflt-sort">' +
                            '<option value="id">Código</option>' +
                            '<option value="nombre">Nombre</option>' +
                            '<option value="slug">Slug</option>' +
                            '<option value="descripcion">Descripción</option>' +
                            '<option value="sistema">Tipo</option>' +
                        '</select></div>' +
                    '<div class="form-group"><label for="pflt-dir">Dirección</label>' +
                        '<select id="pflt-dir">' +
                            '<option value="desc">Descendente</option>' +
                            '<option value="asc">Ascendente</option>' +
                        '</select></div>' +
                '</div>' +
            '</div>' +
            '<div class="modal-footer">' +
                '<button type="button" class="btn btn-ghost"   data-act="cerrar"  >Cerrar</button>' +
                '<button type="button" class="btn btn-ghost"   data-act="limpiar" >Limpiar</button>' +
                '<button type="button" class="btn btn-primary" data-act="aplicar" >Aplicar</button>' +
            '</div>' +
        '</div></div>';
    }

    function modalConsultarPermisoHtml() {
        return '<div class="modal-backdrop" id="permConsultar"><div class="modal">' +
            '<div class="modal-header">' +
                '<div class="modal-title">' +
                    '<span>Consultar permiso</span>' +
                    '<span class="modal-subtitle" id="permConsultarSub"></span>' +
                '</div>' +
                '<button class="btn-icon-sm" data-act="close" type="button" aria-label="Cerrar">&times;</button>' +
            '</div>' +
            '<div class="modal-body">' +
                '<dl class="data-list" id="permConsultarBody"></dl>' +
            '</div>' +
            '<div class="modal-footer">' +
                '<button type="button" class="btn btn-ghost" data-act="close">Cerrar</button>' +
                '<button type="button" class="btn btn-primary" id="permConsultarEditar">' +
                    '<i class="fa-solid fa-pen"></i> Editar' +
                '</button>' +
            '</div>' +
        '</div></div>';
    }

    function wirePermisosView() {
        var tbody       = document.getElementById('permTbody');
        var emptyState  = document.getElementById('permEmpty');
        var searchInput = document.getElementById('permSearch');
        var searchClear = document.getElementById('permSearchClear');

        var modal        = document.getElementById('permModal');
        var modalTitulo  = document.getElementById('permModalTitulo');
        var modalSub     = document.getElementById('permModalSub');
        var modalError   = document.getElementById('permError');
        var form         = document.getElementById('permForm');
        var fId          = document.getElementById('permId');
        var fSistema     = document.getElementById('perm-sistema');
        var sistemaLabel = document.getElementById('permSistemaLabel');
        var btnGuardar   = document.getElementById('permGuardar');

        var confirmBox = document.getElementById('permConfirm');
        var confirmMsg = document.getElementById('permConfirmMsg');
        var btnDelete  = document.getElementById('permConfirmBtn');

        var filtrosModal = document.getElementById('permFiltrosModal');

        var consultarModal  = document.getElementById('permConsultar');
        var consultarSub    = document.getElementById('permConsultarSub');
        var consultarBody   = document.getElementById('permConsultarBody');
        var consultarEditar = document.getElementById('permConsultarEditar');

        var ctxMenu = document.getElementById('permCtxMenu');
        var ctxId   = null;

        var pendingDeleteId   = null;
        var modoEdicion       = false;
        var consultarIdActual = null;

        // --- Búsqueda rápida cliente ----------------------------------------
        function applyClientFilter() {
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
        searchInput.addEventListener('input', applyClientFilter);
        searchClear.addEventListener('click', function () {
            searchInput.value = '';
            applyClientFilter();
            searchInput.focus();
        });

        // --- Refrescar -----------------------------------------------------
        document.getElementById('permRefrescar').addEventListener('click', function () {
            recargarPermisosLista();
        });

        // --- Modal de filtros (live apply + snapshot) ----------------------
        var fFltId    = document.getElementById('pflt-id');
        var fFltNom   = document.getElementById('pflt-nombre');
        var fFltSlug  = document.getElementById('pflt-slug');
        var fFltDesc  = document.getElementById('pflt-descripcion');
        var fFltLim   = document.getElementById('pflt-limit');
        var fFltSort  = document.getElementById('pflt-sort');
        var fFltDir   = document.getElementById('pflt-dir');
        var fChipsSis = filtrosModal.querySelectorAll('.filter-chip[data-chip="sistema"]');

        function sincronizarFiltros() {
            fFltId.value   = permisosFiltros.filtro_id;
            fFltNom.value  = permisosFiltros.nombre;
            fFltSlug.value = permisosFiltros.slug;
            fFltDesc.value = permisosFiltros.descripcion;
            fFltLim.value  = permisosFiltros.limit;
            fFltSort.value = permisosFiltros.sort;
            fFltDir.value  = permisosFiltros.dir;
            fChipsSis.forEach(function (c) {
                c.classList.toggle('active', c.dataset.value === String(permisosFiltros.sistema || ''));
            });
        }
        function abrirModalFiltros() {
            permisosFiltrosSnapshot = Object.assign({}, permisosFiltros);
            sincronizarFiltros();
            filtrosModal.classList.add('open');
        }
        function cerrarModalFiltros() { filtrosModal.classList.remove('open'); }
        function cancelarFiltros() {
            if (permisosFiltrosSnapshot) {
                Object.keys(permisosFiltrosSnapshot).forEach(function (k) {
                    permisosFiltros[k] = permisosFiltrosSnapshot[k];
                });
                permisosFiltrosSnapshot = null;
                recargarPermisosLista();
            }
            cerrarModalFiltros();
        }
        function limpiarFiltros() {
            Object.assign(permisosFiltros, permisosFiltrosDefault);
            sincronizarFiltros();
            recargarPermisosLista();
        }

        document.getElementById('permFiltros').addEventListener('click', abrirModalFiltros);
        filtrosModal.addEventListener('click', function (ev) {
            if (ev.target === filtrosModal) { cancelarFiltros(); return; }
            var b = ev.target.closest('button[data-act]');
            if (!b) return;
            if (b.dataset.act === 'cerrar')  cancelarFiltros();
            if (b.dataset.act === 'limpiar') limpiarFiltros();
            if (b.dataset.act === 'aplicar') { permisosFiltrosSnapshot = null; cerrarModalFiltros(); }
        });

        function liveApply(field, valueGetter) {
            return function () {
                permisosFiltros[field] = valueGetter();
                recargarPermisosLista();
            };
        }
        fFltId.addEventListener('input',   liveApply('filtro_id',   function () { return fFltId.value.trim(); }));
        fFltNom.addEventListener('input',  liveApply('nombre',      function () { return fFltNom.value.trim(); }));
        fFltSlug.addEventListener('input', liveApply('slug',        function () { return fFltSlug.value.trim(); }));
        fFltDesc.addEventListener('input', liveApply('descripcion', function () { return fFltDesc.value.trim(); }));
        fFltLim.addEventListener('change',  liveApply('limit',      function () { return parseInt(fFltLim.value, 10) || 100; }));
        fFltSort.addEventListener('change', liveApply('sort',       function () { return fFltSort.value || 'id'; }));
        fFltDir.addEventListener('change',  liveApply('dir',        function () { return fFltDir.value  || 'desc'; }));
        fChipsSis.forEach(function (chip) {
            chip.addEventListener('click', function () {
                permisosFiltros.sistema = chip.dataset.value;
                fChipsSis.forEach(function (c) { c.classList.toggle('active', c === chip); });
                recargarPermisosLista();
            });
        });

        // --- Menú contextual de fila ---------------------------------------
        function cerrarCtxMenu() {
            ctxMenu.classList.remove('open');
            ctxId = null;
        }
        ctxMenu.addEventListener('click', function (ev) {
            var b = ev.target.closest('button[data-action]');
            if (!b || ctxId == null) return;
            var id = ctxId;
            cerrarCtxMenu();
            if (b.dataset.action === 'consultar')     abrirConsulta(id);
            else if (b.dataset.action === 'editar')   abrirEdicion(id);
            else if (b.dataset.action === 'eliminar') pedirEliminar(id);
        });
        conectarCierreCtxMenu(ctxMenu, cerrarCtxMenu);

        // --- Filas: clic = Consultar, click derecho = ctx menu -------------
        tbody.addEventListener('click', function (ev) {
            var tr = ev.target.closest('tr[data-id]');
            if (!tr) return;
            var id = parseInt(tr.dataset.id, 10);
            var btn = ev.target.closest('button[data-act="menu"]');
            if (btn) {
                ev.stopPropagation();
                var rect = btn.getBoundingClientRect();
                abrirCtxMenuFlotante(ctxMenu, rect.right - 200, rect.bottom + 4);
                ctxId = id;
                return;
            }
            if (ev.target.closest('a,input,select,button')) return;
            abrirConsulta(id);
        });
        tbody.addEventListener('contextmenu', function (ev) {
            var tr = ev.target.closest('tr[data-id]');
            if (!tr) return;
            ev.preventDefault();
            var id = parseInt(tr.dataset.id, 10);
            abrirCtxMenuFlotante(ctxMenu, ev.clientX, ev.clientY);
            ctxId = id;
        });

        // --- Modal Consultar ----------------------------------------------
        consultarModal.addEventListener('click', function (ev) {
            if (ev.target === consultarModal || ev.target.closest('[data-act="close"]')) {
                consultarModal.classList.remove('open');
            }
        });
        consultarEditar.addEventListener('click', function () {
            if (consultarIdActual == null) return;
            consultarModal.classList.remove('open');
            abrirEdicion(consultarIdActual);
        });

        async function abrirConsulta(id) {
            consultarIdActual = id;
            consultarSub.innerHTML  = '<code>#' + id + '</code>';
            consultarBody.innerHTML = '<div style="display:flex;justify-content:center;padding:24px"><div class="spin"></div></div>';
            consultarModal.classList.add('open');

            var p;
            try {
                p = permisosRegistroCache[id] || (permisosRegistroCache[id] = await api('/api/permisos.php?id=' + id));
            } catch (err) {
                consultarBody.innerHTML = '<div class="alert alert-error">' + e(err.message) + '</div>';
                return;
            }

            var esSistema = String(p.sistema || '') === '1';
            var tipoBadge = esSistema
                ? '<span class="badge badge-danger">Sistema</span>'
                : '<span class="badge badge-success">Personalizado</span>';

            consultarSub.innerHTML  = '<code>#' + p.id + '</code>';
            consultarBody.innerHTML =
                abmRow    ('Código',      '<code>#' + p.id + '</code>') +
                abmRow    ('Tipo',         tipoBadge) +
                abmRowTxt ('Nombre',       p.nombre,      'Sin nombre') +
                abmRow    ('Slug',         p.slug ? '<code>' + e(p.slug) + '</code>' : '<span class="muted">Sin slug</span>') +
                abmRowTxt ('Descripción',  p.descripcion, 'Sin descripción', true);
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

        document.getElementById('permNuevo').addEventListener('click', function () {
            modoEdicion = false;
            resetForm();
            modalTitulo.textContent = 'Nuevo permiso';
            modalSub.textContent    = '';
            openModal();
            document.getElementById('perm-nombre').focus();
        });

        async function abrirEdicion(id) {
            try {
                var p = await api('/api/permisos.php?id=' + id);
                permisosRegistroCache[id] = p;
                modoEdicion = true;
                resetForm();
                fId.value = p.id;
                modalTitulo.textContent = 'Editar permiso';
                modalSub.textContent    = '#' + p.id;
                document.getElementById('perm-nombre').value      = p.nombre      || '';
                document.getElementById('perm-slug').value        = p.slug        || '';
                document.getElementById('perm-descripcion').value = p.descripcion || '';
                fSistema.checked = String(p.sistema || '') === '1';
                setSistemaLabel();
                openModal();
                document.getElementById('perm-nombre').focus();
            } catch (err) {
                toast(err.message, true);
            }
        }

        function pedirEliminar(id) {
            var tr = tbody.querySelector('tr[data-id="' + id + '"]');
            if (tr && parseInt(tr.dataset.sistema, 10) === 1) {
                toast('No se puede eliminar un permiso de sistema.', true);
                return;
            }
            var nombre = tr ? ((tr.querySelector('.td-nombre') || {}).textContent || '').trim() : '';
            confirmMsg.textContent = nombre
                ? '¿Eliminar el permiso "' + nombre + '"? Esta acción no se puede deshacer.'
                : '¿Eliminar el permiso #' + id + '? Esta acción no se puede deshacer.';
            pendingDeleteId = id;
            confirmBox.classList.add('open');
        }
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
                await api('/api/permisos.php?id=' + pendingDeleteId, { method: 'DELETE' });
                toast('Permiso eliminado.');
                recargarPermisosLista();
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
                nombre:      document.getElementById('perm-nombre').value.trim(),
                slug:        document.getElementById('perm-slug').value.trim(),
                descripcion: document.getElementById('perm-descripcion').value.trim(),
                sistema:     fSistema.checked ? 1 : 0
            };

            btnGuardar.disabled = true;
            try {
                if (modoEdicion) {
                    await api('/api/permisos.php?id=' + encodeURIComponent(fId.value), {
                        method: 'PUT',
                        body:   payload
                    });
                    toast('Permiso actualizado.');
                } else {
                    await api('/api/permisos.php', {
                        method: 'POST',
                        body:   payload
                    });
                    toast('Permiso creado.');
                }
                closeModal();
                recargarPermisosLista();
            } catch (err) {
                showFormError(err.message);
            } finally {
                btnGuardar.disabled = false;
            }
        });

        applyClientFilter();
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

    var alarmasFiltrosDefault = {
        sort:      'id',
        dir:       'desc',
        limit:     100,
        filtro_id: '',
        nombre:    '',
        comunidad: '',
        estado:    '',
        conexion:  ''
    };
    var alarmasFiltros         = Object.assign({}, alarmasFiltrosDefault);
    var alarmasFiltrosSnapshot = null;
    var alarmasCache           = { comunidades: [], onlineSec: 600 };
    var alarmasRegistroCache   = {};

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

    function alarmasFiltrosActivos() {
        var n = 0;
        Object.keys(alarmasFiltrosDefault).forEach(function (k) {
            if (k === 'sort' || k === 'dir' || k === 'limit') return;
            if (String(alarmasFiltros[k]) !== String(alarmasFiltrosDefault[k])) n++;
        });
        return n;
    }

    function actualizarBadgeFiltrosAlarmas() {
        var btn = document.getElementById('alaFiltros');
        if (!btn) return;
        var badge = btn.querySelector('.btn-icon-badge');
        var n = alarmasFiltrosActivos();
        btn.classList.toggle('active', n > 0);
        if (badge) {
            badge.textContent = n || '';
            badge.style.display = n ? '' : 'none';
        }
    }

    function alarmasCountText(n) {
        return 'Mostrando ' + n + ' resultado(s) (límite ' + alarmasFiltros.limit + ').';
    }

    function moduleHelpAlarmasHtml() {
        return '<div class="module-help" style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:14px 18px;margin-bottom:16px;box-shadow:var(--shadow);display:flex;gap:14px;align-items:center;">' +
            '<div style="font-size:1.6rem;line-height:1;">🚨</div>' +
            '<div style="font-size:.88rem;color:var(--muted);line-height:1.45;">' +
                'Las alarmas son los dispositivos instalados en las casas y comunidades que detectan eventos y reportan al sistema su estado de conexión, salud y telemetría.' +
            '</div>' +
        '</div>';
    }

    function renderAlarmasStats(kpis) {
        return statCard('Online',  kpis.online  || 0, 'green',  'Latido en los últimos 10 min') +
               statCard('Offline', kpis.offline || 0, 'red',    'Sin latido reciente') +
               statCard('Total',   kpis.total   || 0, 'orange', 'Alarmas registradas');
    }

    function toolbarAlarmasHtml() {
        var n = alarmasFiltrosActivos();
        var badge = '<span class="btn-icon-badge"' + (n ? '' : ' style="display:none;"') + '>' + (n || '') + '</span>';
        var activo = n ? ' active' : '';
        return '<div class="toolbar">' +
            '<div class="toolbar-left" style="gap:8px;flex-wrap:wrap;">' +
                '<div class="search-wrap">' +
                    '<input type="search" id="alaSearch" class="search-input" placeholder="🔍 Buscar nombre, identidad o domicilio…">' +
                    '<button class="search-clear" id="alaSearchClear" type="button" style="display:none;">&times;</button>' +
                '</div>' +
                '<button class="btn btn-ghost btn-icon' + activo + '" id="alaFiltros" type="button" title="Filtros">' +
                    '<i class="fa-solid fa-filter"></i>' + badge +
                '</button>' +
                '<button class="btn btn-ghost btn-icon" id="alaRefrescar" type="button" title="Refrescar">' +
                    '<i class="fa-solid fa-rotate"></i>' +
                '</button>' +
            '</div>' +
            '<div class="toolbar-right">' +
                '<button class="btn btn-primary" id="alaNuevo" type="button">+ Nueva alarma</button>' +
            '</div>' +
        '</div>';
    }

    function ctxMenuAlarmasHtml() {
        return '<div id="alaCtxMenu" class="ctx-menu" role="menu">' +
            '<button type="button" data-action="consultar" role="menuitem">' +
                '<i class="fa-solid fa-eye"></i><span>Consultar</span>' +
            '</button>' +
            '<div class="ctx-menu-sep"></div>' +
            '<button type="button" data-action="editar" role="menuitem">' +
                '<i class="fa-solid fa-pen"></i><span>Editar</span>' +
            '</button>' +
            '<button type="button" data-action="eliminar" class="ctx-menu-danger" role="menuitem">' +
                '<i class="fa-solid fa-trash"></i><span>Eliminar</span>' +
            '</button>' +
        '</div>';
    }

    async function recargarAlarmasLista() {
        try {
            var data    = await api('/api/alarmas.php' + alarmasQueryString());
            var alarmas = data.alarmas     || [];
            var kpis    = data.kpis        || {};
            alarmasCache.comunidades = data.comunidades             || [];
            alarmasCache.onlineSec   = data.online_interval_seconds || 600;
            alarmasRegistroCache     = {};
            var stats = document.getElementById('alaStats');
            var tbody = document.getElementById('alaTbody');
            var count = document.getElementById('alaCount');
            if (stats) stats.innerHTML = renderAlarmasStats(kpis);
            if (tbody) tbody.innerHTML = renderFilasAlarmas(alarmas, alarmasCache.onlineSec);
            if (count) count.textContent = alarmasCountText(alarmas.length);
            actualizarBadgeFiltrosAlarmas();
            var searchInput = document.getElementById('alaSearch');
            if (searchInput) searchInput.dispatchEvent(new Event('input'));
        } catch (err) {
            toast(err.message, true);
        }
    }

    async function renderAlarmas(view) {
        var data    = await api('/api/alarmas.php' + alarmasQueryString());
        var alarmas = data.alarmas     || [];
        var kpis    = data.kpis        || {};
        alarmasCache.comunidades = data.comunidades             || [];
        alarmasCache.onlineSec   = data.online_interval_seconds || 600;
        alarmasRegistroCache     = {};

        view.innerHTML =
            moduleHelpAlarmasHtml() +

            '<div class="stats-bar" id="alaStats">' + renderAlarmasStats(kpis) + '</div>' +

            toolbarAlarmasHtml() +

            '<div class="table-card">' +
                '<table><thead><tr>' +
                    '<th>Código</th><th>Nombre</th><th>Comunidad</th><th>Identidad</th><th>Conexión</th><th>Estado</th>' +
                    '<th style="text-align:center;">Acciones</th>' +
                '</tr></thead><tbody id="alaTbody">' +
                renderFilasAlarmas(alarmas, alarmasCache.onlineSec) +
                '</tbody></table>' +
                '<div class="table-empty" id="alaEmpty" style="display:none;">No hay alarmas que coincidan con la búsqueda.</div>' +
            '</div>' +
            '<div class="text-muted text-sm" id="alaCount" style="margin-top:10px;">' +
                alarmasCountText(alarmas.length) +
            '</div>' +

            modalAlarmaHtml(alarmasCache.comunidades) +
            modalFiltrosAlarmasHtml(alarmasCache.comunidades) +
            modalConsultarAlarmaHtml() +
            confirmDeleteAlarmaHtml() +
            ctxMenuAlarmasHtml();

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
            return '<tr data-id="' + a.id + '" data-search="' + e(busq) + '" style="cursor:pointer;">' +
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
                '<td style="text-align:center;">' +
                    '<div class="actions" style="justify-content:center;">' +
                        '<button class="btn-icon-sm" data-act="menu" type="button" title="Más acciones">' +
                            '<i class="fa-solid fa-bars"></i>' +
                        '</button>' +
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
            return '<option value="' + c.id + '">' + e(c.nombre) + '</option>';
        }).join('');

        return '<div class="modal-backdrop" id="alaFiltrosModal"><div class="modal" style="max-width:560px;">' +
            '<div class="modal-header">' +
                '<div class="modal-title"><i class="fa-solid fa-filter"></i> Filtros</div>' +
                '<button class="btn btn-ghost" data-act="cerrar" type="button" title="Cerrar">&times;</button>' +
            '</div>' +
            '<div class="modal-body">' +
                '<div class="form-row">' +
                    '<div class="form-group"><label for="aflt-id">Código</label>' +
                        '<input id="aflt-id" type="number" min="1" step="1" inputmode="numeric" placeholder="ID de la alarma…"></div>' +
                    '<div class="form-group"><label for="aflt-nombre">Nombre</label>' +
                        '<input id="aflt-nombre" type="text" maxlength="255" placeholder="Nombre de la alarma…"></div>' +
                '</div>' +
                '<div class="form-group"><label for="aflt-comunidad">Comunidad</label>' +
                    '<select id="aflt-comunidad"><option value="">Todas</option>' + optsCom + '</select></div>' +
                '<div class="form-group">' +
                    '<label>Conexión</label>' +
                    '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
                        '<button type="button" class="filter-chip" data-chip="conexion" data-value=""       >Todas</button>' +
                        '<button type="button" class="filter-chip" data-chip="conexion" data-value="online" >Online</button>' +
                        '<button type="button" class="filter-chip" data-chip="conexion" data-value="offline">Offline</button>' +
                    '</div>' +
                '</div>' +
                '<div class="form-group">' +
                    '<label>Estado del registro</label>' +
                    '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
                        '<button type="button" class="filter-chip" data-chip="estado" data-value="" >Todas</button>' +
                        '<button type="button" class="filter-chip" data-chip="estado" data-value="1">Activas</button>' +
                        '<button type="button" class="filter-chip" data-chip="estado" data-value="0">Inactivas</button>' +
                    '</div>' +
                '</div>' +
                '<div class="form-row form-row-3">' +
                    '<div class="form-group"><label for="aflt-limit">Límite</label>' +
                        '<input id="aflt-limit" type="number" min="1" max="1000" step="1" inputmode="numeric"></div>' +
                    '<div class="form-group"><label for="aflt-sort">Ordenar por</label>' +
                        '<select id="aflt-sort">' +
                            '<option value="id">Código</option>' +
                            '<option value="nombre">Nombre</option>' +
                            '<option value="comunidad">Comunidad</option>' +
                            '<option value="latido">Último latido</option>' +
                            '<option value="instalacion">Instalación</option>' +
                        '</select></div>' +
                    '<div class="form-group"><label for="aflt-dir">Dirección</label>' +
                        '<select id="aflt-dir">' +
                            '<option value="desc">Descendente</option>' +
                            '<option value="asc">Ascendente</option>' +
                        '</select></div>' +
                '</div>' +
            '</div>' +
            '<div class="modal-footer">' +
                '<button type="button" class="btn btn-ghost"   data-act="cerrar"  >Cerrar</button>' +
                '<button type="button" class="btn btn-ghost"   data-act="limpiar" >Limpiar</button>' +
                '<button type="button" class="btn btn-primary" data-act="aplicar" >Aplicar</button>' +
            '</div>' +
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
                '<button type="button" class="btn btn-primary" id="alaConsultarEditar">' +
                    '<i class="fa-solid fa-pen"></i> Editar' +
                '</button>' +
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

        var consultarModal  = document.getElementById('alaConsultar');
        var consultarSub    = document.getElementById('alaConsultarSub');
        var consultarBody   = document.getElementById('alaConsultarBody');
        var consultarEditar = document.getElementById('alaConsultarEditar');

        var ctxMenu = document.getElementById('alaCtxMenu');
        var ctxId   = null;

        var pendingDeleteId   = null;
        var modoEdicion       = false;
        var consultarIdActual = null;

        // --- Búsqueda rápida cliente ------------------------------------
        function applyClientFilter() {
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
        searchInput.addEventListener('input', applyClientFilter);
        searchClear.addEventListener('click', function () {
            searchInput.value = '';
            applyClientFilter();
            searchInput.focus();
        });

        // --- Refrescar ---------------------------------------------------
        document.getElementById('alaRefrescar').addEventListener('click', function () {
            recargarAlarmasLista();
        });

        // --- Modal de filtros (live apply + snapshot) -------------------
        var fId_     = document.getElementById('aflt-id');
        var fNombre  = document.getElementById('aflt-nombre');
        var fCom     = document.getElementById('aflt-comunidad');
        var fLimit   = document.getElementById('aflt-limit');
        var fSort    = document.getElementById('aflt-sort');
        var fDir     = document.getElementById('aflt-dir');
        var fChipsConexion = filtrosModal.querySelectorAll('.filter-chip[data-chip="conexion"]');
        var fChipsEstado   = filtrosModal.querySelectorAll('.filter-chip[data-chip="estado"]');

        function sincronizarControlesFiltros() {
            fId_.value    = alarmasFiltros.filtro_id;
            fNombre.value = alarmasFiltros.nombre;
            fCom.value    = alarmasFiltros.comunidad;
            fLimit.value  = alarmasFiltros.limit;
            fSort.value   = alarmasFiltros.sort;
            fDir.value    = alarmasFiltros.dir;
            fChipsConexion.forEach(function (c) {
                c.classList.toggle('active', c.dataset.value === String(alarmasFiltros.conexion || ''));
            });
            fChipsEstado.forEach(function (c) {
                c.classList.toggle('active', c.dataset.value === String(alarmasFiltros.estado || ''));
            });
        }
        function abrirModalFiltros() {
            alarmasFiltrosSnapshot = Object.assign({}, alarmasFiltros);
            sincronizarControlesFiltros();
            filtrosModal.classList.add('open');
        }
        function cerrarModalFiltros() { filtrosModal.classList.remove('open'); }
        function cancelarFiltros() {
            if (alarmasFiltrosSnapshot) {
                Object.keys(alarmasFiltrosSnapshot).forEach(function (k) {
                    alarmasFiltros[k] = alarmasFiltrosSnapshot[k];
                });
                alarmasFiltrosSnapshot = null;
                recargarAlarmasLista();
            }
            cerrarModalFiltros();
        }
        function limpiarFiltros() {
            Object.assign(alarmasFiltros, alarmasFiltrosDefault);
            sincronizarControlesFiltros();
            recargarAlarmasLista();
        }

        document.getElementById('alaFiltros').addEventListener('click', abrirModalFiltros);
        filtrosModal.addEventListener('click', function (ev) {
            if (ev.target === filtrosModal) { cancelarFiltros(); return; }
            var b = ev.target.closest('button[data-act]');
            if (!b) return;
            if (b.dataset.act === 'cerrar')  cancelarFiltros();
            if (b.dataset.act === 'limpiar') limpiarFiltros();
            if (b.dataset.act === 'aplicar') { alarmasFiltrosSnapshot = null; cerrarModalFiltros(); }
        });

        function liveApply(field, valueGetter) {
            return function () {
                alarmasFiltros[field] = valueGetter();
                recargarAlarmasLista();
            };
        }
        fId_.addEventListener('input',    liveApply('filtro_id', function () { return fId_.value.trim(); }));
        fNombre.addEventListener('input', liveApply('nombre',    function () { return fNombre.value.trim(); }));
        fCom.addEventListener('change',   liveApply('comunidad', function () { return fCom.value; }));
        fLimit.addEventListener('change', liveApply('limit',     function () { return parseInt(fLimit.value, 10) || 100; }));
        fSort.addEventListener('change',  liveApply('sort',      function () { return fSort.value || 'id'; }));
        fDir.addEventListener('change',   liveApply('dir',       function () { return fDir.value  || 'desc'; }));
        fChipsConexion.forEach(function (chip) {
            chip.addEventListener('click', function () {
                alarmasFiltros.conexion = chip.dataset.value;
                fChipsConexion.forEach(function (c) { c.classList.toggle('active', c === chip); });
                recargarAlarmasLista();
            });
        });
        fChipsEstado.forEach(function (chip) {
            chip.addEventListener('click', function () {
                alarmasFiltros.estado = chip.dataset.value;
                fChipsEstado.forEach(function (c) { c.classList.toggle('active', c === chip); });
                recargarAlarmasLista();
            });
        });

        // --- Menú contextual de fila -----------------------------------
        function cerrarCtxMenu() {
            ctxMenu.classList.remove('open');
            ctxId = null;
        }
        function abrirCtxMenu(x, y, id) {
            ctxId = id;
            ctxMenu.classList.add('open');
            var rect = ctxMenu.getBoundingClientRect();
            var w = rect.width, h = rect.height;
            var vw = window.innerWidth, vh = window.innerHeight;
            var left = Math.min(x, vw - w - 8);
            var top  = Math.min(y, vh - h - 8);
            ctxMenu.style.left = Math.max(8, left) + 'px';
            ctxMenu.style.top  = Math.max(8, top)  + 'px';
        }
        ctxMenu.addEventListener('click', function (ev) {
            var b = ev.target.closest('button[data-action]');
            if (!b || ctxId == null) return;
            var id = ctxId;
            cerrarCtxMenu();
            if (b.dataset.action === 'consultar')     abrirConsulta(id);
            else if (b.dataset.action === 'editar')   abrirEdicion(id);
            else if (b.dataset.action === 'eliminar') pedirEliminar(id);
        });

        // Cierre global del menú contextual.
        document.addEventListener('click', function (ev) {
            if (ctxMenu.classList.contains('open') && !ctxMenu.contains(ev.target)) cerrarCtxMenu();
        });
        document.addEventListener('scroll',  function () { cerrarCtxMenu(); }, true);
        window.addEventListener('resize',    function () { cerrarCtxMenu(); });
        document.addEventListener('keydown', function (ev) {
            if (ev.key === 'Escape') cerrarCtxMenu();
        });

        // --- Filas: clic = Consultar, click derecho = ctx menu ---------
        tbody.addEventListener('click', function (ev) {
            var tr = ev.target.closest('tr[data-id]');
            if (!tr) return;
            var id = parseInt(tr.dataset.id, 10);
            var btn = ev.target.closest('button[data-act="menu"]');
            if (btn) {
                ev.stopPropagation();
                var rect = btn.getBoundingClientRect();
                abrirCtxMenu(rect.right - 200, rect.bottom + 4, id);
                return;
            }
            if (ev.target.closest('a,input,select,button')) return;
            abrirConsulta(id);
        });
        tbody.addEventListener('contextmenu', function (ev) {
            var tr = ev.target.closest('tr[data-id]');
            if (!tr) return;
            ev.preventDefault();
            var id = parseInt(tr.dataset.id, 10);
            abrirCtxMenu(ev.clientX, ev.clientY, id);
        });

        // --- Modal Consultar -------------------------------------------
        consultarModal.addEventListener('click', function (ev) {
            if (ev.target === consultarModal || ev.target.closest('[data-act="close"]')) {
                consultarModal.classList.remove('open');
            }
        });
        consultarEditar.addEventListener('click', function () {
            if (consultarIdActual == null) return;
            consultarModal.classList.remove('open');
            abrirEdicion(consultarIdActual);
        });

        async function abrirConsulta(id) {
            consultarIdActual = id;
            consultarSub.innerHTML  = '<code>#' + id + '</code>';
            consultarBody.innerHTML = '<div style="display:flex;justify-content:center;padding:24px"><div class="spin"></div></div>';
            consultarModal.classList.add('open');

            var a;
            try {
                a = alarmasRegistroCache[id] || (alarmasRegistroCache[id] = await api('/api/alarmas.php?id=' + id));
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

        // --- Modal Alta / Edición --------------------------------------
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

        async function abrirEdicion(id) {
            try {
                var a = alarmasRegistroCache[id] || (alarmasRegistroCache[id] = await api('/api/alarmas.php?id=' + id));
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
        }

        function pedirEliminar(id) {
            var tr = tbody.querySelector('tr[data-id="' + id + '"]');
            var nombre = tr ? ((tr.querySelector('.td-nombre') || {}).textContent || '').trim() : '';
            confirmMsg.textContent = nombre
                ? '¿Eliminar la alarma "' + nombre + '"? Esta acción no se puede deshacer.'
                : '¿Eliminar la alarma #' + id + '? Esta acción no se puede deshacer.';
            pendingDeleteId = id;
            confirmBox.classList.add('open');
        }
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
                recargarAlarmasLista();
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
                recargarAlarmasLista();
            } catch (err) {
                showFormError(err.message);
            } finally {
                btnGuardar.disabled = false;
            }
        });

        applyClientFilter();
    }

    // -------- Vista: Disparos ---------------------------------------------

    var disparosFiltrosDefault = {
        sort:      'id',
        dir:       'desc',
        limit:     100,
        filtro_id: '',
        comunidad: '',
        casa:      '',
        guardia:   '',
        estado:    '',
        cerrado:   '',
        desde:     '',
        hasta:     ''
    };
    var disparosFiltros = Object.assign({}, disparosFiltrosDefault);
    var disparosFiltrosSnapshot = null;
    var disparosCache = { comunidades: [], casas: [], guardias: [] };
    var disparosRegistroCache = {};
    var disparosEditarIdPendiente = null;

    function disparosQueryString() {
        var qs = [];
        Object.keys(disparosFiltros).forEach(function (k) {
            var v = disparosFiltros[k];
            if (v !== '' && v != null) {
                qs.push(encodeURIComponent(k) + '=' + encodeURIComponent(v));
            }
        });
        return qs.length ? ('?' + qs.join('&')) : '';
    }

    function disparosFiltrosActivos() {
        var n = 0;
        Object.keys(disparosFiltrosDefault).forEach(function (k) {
            if (k === 'sort' || k === 'dir' || k === 'limit') return;
            if (String(disparosFiltros[k]) !== String(disparosFiltrosDefault[k])) n++;
        });
        return n;
    }

    async function renderDisparos(view) {
        var data        = await api('/api/disparos.php' + disparosQueryString());
        var disparos    = data.disparos    || [];
        var kpis        = data.kpis        || {};
        disparosCache.comunidades = data.comunidades || [];
        disparosCache.casas       = data.casas       || [];
        disparosCache.guardias    = data.guardias    || [];
        disparosRegistroCache     = {};

        view.innerHTML =
            moduleHelpDisparosHtml() +

            '<div class="stats-bar" id="dspStats">' + renderDisparosStats(kpis) + '</div>' +

            toolbarDisparosHtml() +

            '<div class="table-card">' +
                '<table><thead><tr>' +
                    '<th>Código</th><th>Modo</th><th>Fecha</th><th>Comunidad</th><th>Usuario</th>' +
                    '<th>Guardia</th><th>Resultado</th><th>Espera</th><th>Estado</th>' +
                    '<th style="text-align:center;">Acciones</th>' +
                '</tr></thead><tbody id="dspTbody">' +
                renderFilasDisparos(disparos) +
                '</tbody></table>' +
                '<div class="table-empty" id="dspEmpty" style="display:none;">No hay disparos que coincidan con la búsqueda.</div>' +
            '</div>' +
            '<div class="text-muted text-sm" id="dspCount" style="margin-top:10px;">' +
                disparosCountText(disparos.length) +
            '</div>' +

            modalDisparoHtml(disparosCache.comunidades, disparosCache.casas, disparosCache.guardias) +
            modalFiltrosDisparosHtml(disparosCache.comunidades, disparosCache.casas, disparosCache.guardias) +
            modalConsultarDisparoHtml() +
            modalCalculadorDisparosHtml(disparosCache.guardias) +
            modalAyudaCalculadorHtml() +
            confirmDeleteDisparoHtml() +
            ctxMenuDisparosHtml() +
            ctxMenuToolbarDisparosHtml();

        wireDisparosView();
    }

    function moduleHelpDisparosHtml() {
        return '<div class="module-help" style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:14px 18px;margin-bottom:16px;box-shadow:var(--shadow);display:flex;gap:14px;align-items:center;">' +
            '<div style="font-size:1.6rem;line-height:1;">🚨</div>' +
            '<div style="font-size:.88rem;color:var(--muted);line-height:1.45;">' +
                'Los disparos son los eventos de alarma generados por las casas y comunidades, con el momento del aviso, la guardia que los toma y el resultado de la atención.' +
            '</div>' +
        '</div>';
    }

    function renderDisparosStats(kpis) {
        return statCard('Total',    kpis.total    || 0, 'orange', 'Disparos registrados') +
               statCard('Abiertos', kpis.abiertos || 0, 'red',    'Sin cierre registrado') +
               statCard('Hoy',      kpis.hoy      || 0, 'green',  'Registrados hoy');
    }

    function disparosCountText(n) {
        return 'Mostrando ' + n + ' resultado(s) (límite ' + disparosFiltros.limit + ').';
    }

    function toolbarDisparosHtml() {
        var n = disparosFiltrosActivos();
        var badge = '<span class="btn-icon-badge"' + (n ? '' : ' style="display:none;"') + '>' + (n || '') + '</span>';
        var activo = n ? ' active' : '';
        return '<div class="toolbar">' +
            '<div class="toolbar-left" style="gap:8px;flex-wrap:wrap;">' +
                '<div class="search-wrap">' +
                    '<input type="search" id="dspSearch" class="search-input" placeholder="🔍 Buscar modo, comunidad, casa o comentario…">' +
                    '<button class="search-clear" id="dspSearchClear" type="button" style="display:none;">&times;</button>' +
                '</div>' +
                '<button class="btn btn-ghost btn-icon' + activo + '" id="dspFiltros" type="button" title="Filtros">' +
                    '<i class="fa-solid fa-filter"></i>' + badge +
                '</button>' +
                '<button class="btn btn-ghost btn-icon" id="dspRefrescar" type="button" title="Refrescar">' +
                    '<i class="fa-solid fa-rotate"></i>' +
                '</button>' +
                '<button class="btn btn-ghost btn-icon" id="dspMenuToolbar" type="button" title="Más opciones">' +
                    '<i class="fa-solid fa-bars"></i>' +
                '</button>' +
            '</div>' +
            '<div class="toolbar-right">' +
                '<button class="btn btn-primary" id="dspNuevo" type="button">+ Nuevo disparo</button>' +
            '</div>' +
        '</div>';
    }

    function ctxMenuToolbarDisparosHtml() {
        return '<div id="dspToolbarCtxMenu" class="ctx-menu" role="menu">' +
            '<button type="button" data-action="calculador" role="menuitem">' +
                '<i class="fa-solid fa-calculator"></i><span>Calculador</span>' +
            '</button>' +
        '</div>';
    }

    function modalCalculadorDisparosHtml(guardias) {
        var optsGuardia = guardias.map(function (g) {
            return '<option value="' + g.id + '">' + e(g.nombre || ('#' + g.id)) + '</option>';
        }).join('');
        var hoy   = new Date();
        var mesPad = (hoy.getMonth() + 1) < 10 ? '0' + (hoy.getMonth() + 1) : '' + (hoy.getMonth() + 1);
        var mesActual = hoy.getFullYear() + '-' + mesPad;

        return '<div class="modal-backdrop" id="dspCalcModal"><div class="modal" style="max-width:1560px;width:calc(100vw - 32px);">' +
            '<div class="modal-header">' +
                '<div class="modal-title">' +
                    '<i class="fa-solid fa-calculator"></i> Calculador de disparos' +
                '</div>' +
                '<div style="display:flex;gap:6px;align-items:center;">' +
                    '<button class="btn btn-ghost" id="dspCalcAyuda" type="button" title="Ayuda">' +
                        '<i class="fa-regular fa-circle-question"></i>' +
                    '</button>' +
                    '<button class="btn btn-ghost" data-act="close" type="button" title="Cerrar">&times;</button>' +
                '</div>' +
            '</div>' +
            '<div class="modal-body">' +
                '<div class="form-row form-row-3">' +
                    '<div class="form-group"><label for="dspCalcMes">Mes</label>' +
                        '<input id="dspCalcMes" type="month" value="' + e(mesActual) + '"></div>' +
                    '<div class="form-group"><label for="dspCalcGuardia">Guardia</label>' +
                        '<select id="dspCalcGuardia"><option value="">Todas</option>' + optsGuardia + '</select></div>' +
                    '<div class="form-group"><label for="dspCalcPrecio">Valor por disparo ($)</label>' +
                        '<input id="dspCalcPrecio" type="number" min="0" step="1" inputmode="numeric" value="1000"></div>' +
                '</div>' +
                '<div id="dspCalcResumen" class="alert alert-info" style="margin-bottom:12px;">' +
                    'Seleccioná un mes y, opcionalmente, una guardia para ver el cálculo.' +
                '</div>' +
                '<div class="table-card dsp-calc-table" style="max-height:38vh;overflow:auto;">' +
                    '<table><thead><tr>' +
                        '<th>Código</th><th>Fecha</th><th>Modo</th><th>Comunidad</th><th>Casa</th>' +
                        '<th>Guardia</th><th>Espera</th><th>Factor</th>' +
                        '<th style="text-align:right;">Valor</th>' +
                    '</tr></thead><tbody id="dspCalcTbody">' +
                        '<tr><td colspan="9" class="table-empty">— Sin resultados —</td></tr>' +
                    '</tbody></table>' +
                '</div>' +
            '</div>' +
            '<div class="modal-footer" style="justify-content:space-between;">' +
                '<div id="dspCalcTotal" style="font-weight:700;font-size:1.05rem;">Total: $0</div>' +
                '<button type="button" class="btn btn-ghost" data-act="close">Cerrar</button>' +
            '</div>' +
        '</div></div>';
    }

    function modalAyudaCalculadorHtml() {
        var filas = [
            ['0 – 10',   '2.0x'],
            ['10 – 20',  '1.8x'],
            ['20 – 30',  '1.6x'],
            ['30 – 40',  '1.4x'],
            ['40 – 50',  '1.2x'],
            ['50 – 60',  '1.0x'],
            ['60 – 70',  '0.9x'],
            ['70 – 80',  '0.8x'],
            ['80 – 90',  '0.7x'],
            ['90 – 100', '0.6x'],
            ['100 o más','0.5x']
        ].map(function (r) {
            return '<tr><td>' + r[0] + '</td><td style="text-align:right;font-weight:600;">' + r[1] + '</td></tr>';
        }).join('');

        return '<div class="modal-backdrop" id="dspCalcAyudaModal"><div class="modal" style="max-width:520px;">' +
            '<div class="modal-header">' +
                '<div class="modal-title">' +
                    '<i class="fa-regular fa-circle-question"></i> ¿Cómo funciona el calculador?' +
                '</div>' +
                '<button class="btn btn-ghost" data-act="close" type="button" title="Cerrar">&times;</button>' +
            '</div>' +
            '<div class="modal-body">' +
                '<p style="font-size:.88rem;color:var(--muted);line-height:1.5;margin:0;">' +
                    'El calculador toma todos los disparos de un mes y, opcionalmente, de una guardia. ' +
                    'A cada disparo le asigna un <strong>valor base</strong> (editable, por defecto $1.000) ' +
                    'y lo multiplica por un <strong>factor</strong> que depende del tiempo de espera en segundos: ' +
                    'cuanto más rápido se atiende el disparo, mayor es el factor. El total mostrado al pie es la suma de ' +
                    '<code>valor base × factor</code> de cada fila.' +
                '</p>' +
                '<p style="font-size:.85rem;color:var(--muted);margin:0;">' +
                    'Los disparos sin espera registrada no suman al total.' +
                '</p>' +
                '<div class="table-card" style="max-height:none;">' +
                    '<table><thead><tr>' +
                        '<th>Espera (s)</th>' +
                        '<th style="text-align:right;">Factor</th>' +
                    '</tr></thead><tbody>' + filas + '</tbody></table>' +
                '</div>' +
            '</div>' +
            '<div class="modal-footer">' +
                '<button type="button" class="btn btn-ghost" data-act="close">Cerrar</button>' +
            '</div>' +
        '</div></div>';
    }

    function formatearPesos(n) {
        try {
            return '$' + new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(n);
        } catch (err) {
            return '$' + Math.round(n);
        }
    }

    // Multiplicador por tiempo de espera (segundos).
    //   00–10 → 2.0   10–20 → 1.8   20–30 → 1.6   30–40 → 1.4   40–50 → 1.2
    //   50–60 → 1.0   60–70 → 0.9   70–80 → 0.8   80–90 → 0.7   90–100 → 0.6
    //   ≥100 → 0.5    (piso fijo, sin tope superior)
    // Devuelve `null` si no hay espera registrada.
    function disparoFactor(espera) {
        if (espera == null || espera === '') return null;
        var s = parseFloat(espera);
        if (!isFinite(s) || s < 0) return null;
        var tabla = [2.0, 1.8, 1.6, 1.4, 1.2, 1.0, 0.9, 0.8, 0.7, 0.6];
        var bucket = Math.floor(s / 10);
        return bucket < tabla.length ? tabla[bucket] : 0.5;
    }

    function actualizarBadgeFiltrosDisparos() {
        var btn = document.getElementById('dspFiltros');
        if (!btn) return;
        var badge = btn.querySelector('.btn-icon-badge');
        var n = disparosFiltrosActivos();
        btn.classList.toggle('active', n > 0);
        if (badge) {
            badge.textContent = n || '';
            badge.style.display = n ? '' : 'none';
        }
    }

    // Mapeo `disparos.estado` → clase de badge para colorear la columna `Modo`.
    // A = atendido (verde), P = pendiente (rojo), C = cerrado (gris).
    function disparoBadgeClase(estado) {
        switch (String(estado || '').toUpperCase()) {
            case 'A': return 'badge-success';
            case 'P': return 'badge-danger';
            case 'C': return 'badge-muted';
            default:  return 'badge-info';
        }
    }

    function renderFilasDisparos(disparos) {
        if (!disparos.length) {
            return '<tr><td colspan="10" class="table-empty">No hay disparos cargados.</td></tr>';
        }
        return disparos.map(function (d) {
            var busq = String((d.modo || '') + ' ' + (d.comunidad_nombre || '') + ' ' + (d.usuario_nombre || '') + ' ' + (d.resultado || '') + ' ' + (d.guardia_nombre || '') + ' ' + (d.estado_texto || '')).toLowerCase().trim();
            var espera;
            if (d.espera != null && d.espera !== '') {
                var n = Number(d.espera);
                var cls = n < 30 ? 'badge-success' : (n <= 60 ? 'badge-warn' : 'badge-danger');
                espera = '<span class="badge ' + cls + '">' + e(String(d.espera)) + ' s</span>';
            } else {
                espera = '—';
            }
            var modo = d.modo
                ? '<span class="badge ' + disparoBadgeClase(d.estado) + '">' + e(d.modo) + '</span>'
                : '—';
            var estadoTxt = d.estado_texto || d.estado || '—';
            return '<tr data-id="' + d.id + '" data-search="' + e(busq) + '" style="cursor:pointer;">' +
                '<td class="td-id">#' + d.id + '</td>' +
                '<td>' + modo + '</td>' +
                '<td>' + e(abmFecha(d.fecha) || '—') + '</td>' +
                '<td>' + e(d.comunidad_nombre || '—') + '</td>' +
                '<td>' + e(d.usuario_nombre || '—') + '</td>' +
                '<td>' + e(d.guardia_nombre || '—') + '</td>' +
                '<td>' + e(d.resultado || '—') + '</td>' +
                '<td>' + espera + '</td>' +
                '<td>' + e(estadoTxt) + '</td>' +
                '<td style="text-align:center;">' +
                    '<div class="actions" style="justify-content:center;">' +
                        '<button class="btn-icon-sm" data-act="menu" type="button" title="Más acciones">' +
                            '<i class="fa-solid fa-bars"></i>' +
                        '</button>' +
                    '</div>' +
                '</td>' +
            '</tr>';
        }).join('');
    }

    function ctxMenuDisparosHtml() {
        return '<div id="dspCtxMenu" class="ctx-menu" role="menu">' +
            '<button type="button" data-action="consultar" role="menuitem">' +
                '<i class="fa-solid fa-eye"></i><span>Consultar</span>' +
            '</button>' +
            '<div class="ctx-menu-sep"></div>' +
            '<button type="button" data-action="editar" role="menuitem">' +
                '<i class="fa-solid fa-pen"></i><span>Editar</span>' +
            '</button>' +
            '<button type="button" data-action="eliminar" class="ctx-menu-danger" role="menuitem">' +
                '<i class="fa-solid fa-trash"></i><span>Eliminar</span>' +
            '</button>' +
        '</div>';
    }

    function modalDisparoHtml(comunidades, casas, guardias) {
        var optsCom = comunidades.map(function (c) {
            return '<option value="' + c.id + '">' + e(c.nombre) + '</option>';
        }).join('');
        var optsCasa = casas.map(function (c) {
            return '<option value="' + c.id + '" data-comunidad="' + (c.comunidad || '') + '">' + e(c.nombre) + '</option>';
        }).join('');
        var optsGuardia = guardias.map(function (g) {
            return '<option value="' + g.id + '">' + e(g.nombre || ('#' + g.id)) + '</option>';
        }).join('');

        return '<div class="modal-backdrop" id="dspModal"><div class="modal">' +
            '<div class="modal-header">' +
                '<div class="modal-title">' +
                    '<span id="dspModalTitulo">Nuevo disparo</span>' +
                    '<span class="modal-subtitle" id="dspModalSub"></span>' +
                '</div>' +
                '<button class="btn-icon-sm" data-act="close" type="button" aria-label="Cerrar">&times;</button>' +
            '</div>' +
            '<form id="dspForm" novalidate>' +
                '<input type="hidden" id="dspId" value="">' +
                '<div class="modal-body">' +
                    '<div class="alert alert-error" id="dspError" style="display:none;"></div>' +
                    '<div class="form-row">' +
                        '<div class="form-group"><label for="dsp-fecha">Fecha</label>' +
                            '<input id="dsp-fecha" name="fecha" type="datetime-local"></div>' +
                        '<div class="form-group"><label for="dsp-modo">Modo</label>' +
                            '<input id="dsp-modo" name="modo" type="text" maxlength="255" placeholder="Pánico, prueba, etc."></div>' +
                    '</div>' +
                    '<div class="form-row">' +
                        '<div class="form-group"><label for="dsp-comunidad">Comunidad</label>' +
                            '<select id="dsp-comunidad" name="comunidad">' +
                                '<option value="">— Sin comunidad —</option>' + optsCom +
                            '</select></div>' +
                        '<div class="form-group"><label for="dsp-casa">Casa</label>' +
                            '<select id="dsp-casa" name="casa">' +
                                '<option value="">— Sin casa —</option>' + optsCasa +
                            '</select></div>' +
                    '</div>' +
                    '<div class="form-row">' +
                        '<div class="form-group"><label for="dsp-usuario">Usuario (ID)</label>' +
                            '<input id="dsp-usuario" name="usuario" type="number" min="1" step="1" inputmode="numeric"></div>' +
                        '<div class="form-group"><label for="dsp-guardia">Guardia</label>' +
                            '<select id="dsp-guardia" name="guardia">' +
                                '<option value="">— Sin guardia —</option>' + optsGuardia +
                            '</select></div>' +
                    '</div>' +
                    '<div class="form-row">' +
                        '<div class="form-group" style="flex:1 1 100%;"><label for="dsp-ubicacion">Ubicación</label>' +
                            '<input id="dsp-ubicacion" name="ubicacion" type="text" maxlength="255" placeholder="Coordenadas o descripción"></div>' +
                    '</div>' +
                    '<div class="form-row form-row-3">' +
                        '<div class="form-group"><label for="dsp-patrulla">Patrulla</label>' +
                            '<input id="dsp-patrulla" name="patrulla" type="text" maxlength="10"></div>' +
                        '<div class="form-group"><label for="dsp-resultado">Resultado</label>' +
                            '<input id="dsp-resultado" name="resultado" type="text" maxlength="10"></div>' +
                        '<div class="form-group"><label for="dsp-detalle">Detalle</label>' +
                            '<input id="dsp-detalle" name="detalle" type="text" maxlength="10"></div>' +
                    '</div>' +
                    '<div class="form-row">' +
                        '<div class="form-group" style="flex:1 1 100%;"><label for="dsp-comentario">Comentario</label>' +
                            '<input id="dsp-comentario" name="comentario" type="text" maxlength="255"></div>' +
                    '</div>' +
                    '<div class="form-row">' +
                        '<div class="form-group"><label for="dsp-procesado">Procesado</label>' +
                            '<input id="dsp-procesado" name="procesado" type="datetime-local"></div>' +
                        '<div class="form-group"><label for="dsp-tomado">Tomado</label>' +
                            '<input id="dsp-tomado" name="tomado" type="datetime-local"></div>' +
                    '</div>' +
                    '<div class="form-row">' +
                        '<div class="form-group"><label for="dsp-cerrado">Cerrado</label>' +
                            '<input id="dsp-cerrado" name="cerrado" type="datetime-local"></div>' +
                        '<div class="form-group"><label for="dsp-espera">Espera (segundos)</label>' +
                            '<input id="dsp-espera" name="espera" type="number" min="0" step="1" inputmode="numeric"></div>' +
                    '</div>' +
                    '<div class="form-row">' +
                        '<div class="form-group"><label for="dsp-reportado">Reportado</label>' +
                            '<input id="dsp-reportado" name="reportado" type="text" maxlength="1" placeholder="S/N"></div>' +
                        '<div class="form-group"><label for="dsp-estado">Estado</label>' +
                            '<input id="dsp-estado" name="estado" type="text" maxlength="1" placeholder="1 carácter"></div>' +
                    '</div>' +
                '</div>' +
                '<div class="modal-footer">' +
                    '<button type="button" class="btn btn-ghost" data-act="close">Cancelar</button>' +
                    '<button type="submit" class="btn btn-primary" id="dspGuardar">Guardar</button>' +
                '</div>' +
            '</form>' +
        '</div></div>';
    }

    function modalFiltrosDisparosHtml(comunidades, casas, guardias) {
        var optsCom = comunidades.map(function (c) {
            return '<option value="' + c.id + '">' + e(c.nombre) + '</option>';
        }).join('');
        var optsCasa = casas.map(function (c) {
            return '<option value="' + c.id + '">' + e(c.nombre) + '</option>';
        }).join('');
        var optsGuardia = guardias.map(function (g) {
            return '<option value="' + g.id + '">' + e(g.nombre || ('#' + g.id)) + '</option>';
        }).join('');

        return '<div class="modal-backdrop" id="dspFiltrosModal"><div class="modal" style="max-width:560px;">' +
            '<div class="modal-header">' +
                '<div class="modal-title"><i class="fa-solid fa-filter"></i> Filtros</div>' +
                '<button class="btn btn-ghost" data-act="cerrar" type="button" title="Cerrar">&times;</button>' +
            '</div>' +
            '<div class="modal-body">' +
                '<div class="form-row">' +
                    '<div class="form-group"><label for="dflt-id">Código</label>' +
                        '<input id="dflt-id" type="number" min="1" step="1" inputmode="numeric" placeholder="ID del disparo…"></div>' +
                    '<div class="form-group"><label for="dflt-comunidad">Comunidad</label>' +
                        '<select id="dflt-comunidad"><option value="">Todas</option>' + optsCom + '</select></div>' +
                '</div>' +
                '<div class="form-row">' +
                    '<div class="form-group"><label for="dflt-casa">Casa</label>' +
                        '<select id="dflt-casa"><option value="">Todas</option>' + optsCasa + '</select></div>' +
                    '<div class="form-group"><label for="dflt-guardia">Guardia</label>' +
                        '<select id="dflt-guardia"><option value="">Todas</option>' + optsGuardia + '</select></div>' +
                '</div>' +
                '<div class="form-group">' +
                    '<label>Estado del registro</label>' +
                    '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
                        '<button type="button" class="filter-chip" data-chip="cerrado" data-value=""  >Todos</button>' +
                        '<button type="button" class="filter-chip" data-chip="cerrado" data-value="no">Abiertos</button>' +
                        '<button type="button" class="filter-chip" data-chip="cerrado" data-value="si">Cerrados</button>' +
                    '</div>' +
                '</div>' +
                '<div class="form-row">' +
                    '<div class="form-group"><label for="dflt-desde">Desde</label>' +
                        '<input id="dflt-desde" type="date"></div>' +
                    '<div class="form-group"><label for="dflt-hasta">Hasta</label>' +
                        '<input id="dflt-hasta" type="date"></div>' +
                '</div>' +
                '<div class="form-group"><label for="dflt-estado">Estado (código)</label>' +
                    '<input id="dflt-estado" type="text" maxlength="1" placeholder="1 carácter"></div>' +
                '<div class="form-row form-row-3">' +
                    '<div class="form-group"><label for="dflt-limit">Límite</label>' +
                        '<input id="dflt-limit" type="number" min="1" max="1000" step="1" inputmode="numeric"></div>' +
                    '<div class="form-group"><label for="dflt-sort">Ordenar por</label>' +
                        '<select id="dflt-sort">' +
                            '<option value="id">Código</option>' +
                            '<option value="fecha">Fecha</option>' +
                            '<option value="comunidad">Comunidad</option>' +
                            '<option value="casa">Casa</option>' +
                            '<option value="cerrado">Cierre</option>' +
                            '<option value="espera">Espera</option>' +
                            '<option value="estado">Estado</option>' +
                        '</select></div>' +
                    '<div class="form-group"><label for="dflt-dir">Dirección</label>' +
                        '<select id="dflt-dir">' +
                            '<option value="desc">Descendente</option>' +
                            '<option value="asc">Ascendente</option>' +
                        '</select></div>' +
                '</div>' +
            '</div>' +
            '<div class="modal-footer">' +
                '<button type="button" class="btn btn-ghost"   data-act="cerrar"  >Cerrar</button>' +
                '<button type="button" class="btn btn-ghost"   data-act="limpiar" >Limpiar</button>' +
                '<button type="button" class="btn btn-primary" data-act="aplicar" >Aplicar</button>' +
            '</div>' +
        '</div></div>';
    }

    function modalConsultarDisparoHtml() {
        return '<div class="modal-backdrop" id="dspConsultar"><div class="modal">' +
            '<div class="modal-header">' +
                '<div class="modal-title">' +
                    '<span>Consultar disparo</span>' +
                    '<span class="modal-subtitle" id="dspConsultarSub"></span>' +
                '</div>' +
                '<button class="btn-icon-sm" data-act="close" type="button" aria-label="Cerrar">&times;</button>' +
            '</div>' +
            '<div class="modal-body">' +
                '<dl class="data-list" id="dspConsultarBody"></dl>' +
            '</div>' +
            '<div class="modal-footer">' +
                '<button type="button" class="btn btn-ghost" data-act="close">Cerrar</button>' +
                '<button type="button" class="btn btn-primary" id="dspConsultarEditar">' +
                    '<i class="fa-solid fa-pen"></i> Editar' +
                '</button>' +
            '</div>' +
        '</div></div>';
    }

    function confirmDeleteDisparoHtml() {
        return '<div class="confirm-backdrop" id="dspConfirm"><div class="confirm-box">' +
            '<div class="confirm-title">Eliminar disparo</div>' +
            '<div class="confirm-msg" id="dspConfirmMsg">Esta acción no se puede deshacer.</div>' +
            '<div class="confirm-actions">' +
                '<button class="btn btn-ghost"  data-act="cancel" type="button">Cancelar</button>' +
                '<button class="btn btn-danger" id="dspConfirmBtn" type="button">Eliminar</button>' +
            '</div>' +
        '</div></div>';
    }

    function dtLocal(v) {
        if (!v) return '';
        // YYYY-MM-DD HH:MM:SS -> YYYY-MM-DDTHH:MM (input datetime-local)
        var s = String(v).replace(' ', 'T');
        return s.length >= 16 ? s.substring(0, 16) : s;
    }

    async function recargarDisparosLista() {
        try {
            var data = await api('/api/disparos.php' + disparosQueryString());
            var disparos = data.disparos || [];
            var kpis     = data.kpis     || {};
            var stats = document.getElementById('dspStats');
            var tbody = document.getElementById('dspTbody');
            var count = document.getElementById('dspCount');
            if (stats) stats.innerHTML = renderDisparosStats(kpis);
            if (tbody) tbody.innerHTML = renderFilasDisparos(disparos);
            if (count) count.textContent = disparosCountText(disparos.length);
            disparosRegistroCache = {};
            actualizarBadgeFiltrosDisparos();
            var searchInput = document.getElementById('dspSearch');
            if (searchInput) searchInput.dispatchEvent(new Event('input'));
        } catch (err) {
            toast(err.message, true);
        }
    }

    function wireDisparosView() {
        var tbody       = document.getElementById('dspTbody');
        var emptyState  = document.getElementById('dspEmpty');
        var searchInput = document.getElementById('dspSearch');
        var searchClear = document.getElementById('dspSearchClear');

        var modal       = document.getElementById('dspModal');
        var modalTitulo = document.getElementById('dspModalTitulo');
        var modalSub    = document.getElementById('dspModalSub');
        var modalError  = document.getElementById('dspError');
        var form        = document.getElementById('dspForm');
        var fId         = document.getElementById('dspId');
        var btnGuardar  = document.getElementById('dspGuardar');

        var confirmBox = document.getElementById('dspConfirm');
        var confirmMsg = document.getElementById('dspConfirmMsg');
        var btnDelete  = document.getElementById('dspConfirmBtn');

        var filtrosModal = document.getElementById('dspFiltrosModal');

        var consultarModal  = document.getElementById('dspConsultar');
        var consultarSub    = document.getElementById('dspConsultarSub');
        var consultarBody   = document.getElementById('dspConsultarBody');
        var consultarEditar = document.getElementById('dspConsultarEditar');

        var ctxMenu = document.getElementById('dspCtxMenu');
        var ctxId   = null;

        var toolbarMenu = document.getElementById('dspToolbarCtxMenu');

        var pendingDeleteId = null;
        var modoEdicion     = false;
        var consultarIdActual = null;

        // --- Búsqueda rápida cliente ------------------------------------
        function applyClientFilter() {
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
        searchInput.addEventListener('input', applyClientFilter);
        searchClear.addEventListener('click', function () {
            searchInput.value = '';
            applyClientFilter();
            searchInput.focus();
        });

        // --- Refrescar ---------------------------------------------------
        document.getElementById('dspRefrescar').addEventListener('click', function () {
            recargarDisparosLista();
        });

        // --- Modal de filtros (live apply + snapshot) -------------------
        var fId_     = document.getElementById('dflt-id');
        var fCom     = document.getElementById('dflt-comunidad');
        var fCasa    = document.getElementById('dflt-casa');
        var fGuard   = document.getElementById('dflt-guardia');
        var fEstado  = document.getElementById('dflt-estado');
        var fDesde   = document.getElementById('dflt-desde');
        var fHasta   = document.getElementById('dflt-hasta');
        var fLimit   = document.getElementById('dflt-limit');
        var fSort    = document.getElementById('dflt-sort');
        var fDir     = document.getElementById('dflt-dir');
        var fChips   = filtrosModal.querySelectorAll('.filter-chip[data-chip="cerrado"]');

        function sincronizarControlesFiltros() {
            fId_.value    = disparosFiltros.filtro_id;
            fCom.value    = disparosFiltros.comunidad;
            fCasa.value   = disparosFiltros.casa;
            fGuard.value  = disparosFiltros.guardia;
            fEstado.value = disparosFiltros.estado;
            fDesde.value  = disparosFiltros.desde;
            fHasta.value  = disparosFiltros.hasta;
            fLimit.value  = disparosFiltros.limit;
            fSort.value   = disparosFiltros.sort;
            fDir.value    = disparosFiltros.dir;
            fChips.forEach(function (c) {
                c.classList.toggle('active', c.dataset.value === String(disparosFiltros.cerrado || ''));
            });
        }
        function abrirModalFiltros() {
            disparosFiltrosSnapshot = Object.assign({}, disparosFiltros);
            sincronizarControlesFiltros();
            filtrosModal.classList.add('open');
        }
        function cerrarModalFiltros() { filtrosModal.classList.remove('open'); }
        function cancelarFiltros() {
            if (disparosFiltrosSnapshot) {
                Object.keys(disparosFiltrosSnapshot).forEach(function (k) {
                    disparosFiltros[k] = disparosFiltrosSnapshot[k];
                });
                disparosFiltrosSnapshot = null;
                recargarDisparosLista();
            }
            cerrarModalFiltros();
        }
        function limpiarFiltros() {
            Object.assign(disparosFiltros, disparosFiltrosDefault);
            sincronizarControlesFiltros();
            recargarDisparosLista();
        }

        document.getElementById('dspFiltros').addEventListener('click', abrirModalFiltros);
        filtrosModal.addEventListener('click', function (ev) {
            if (ev.target === filtrosModal) { cancelarFiltros(); return; }
            var b = ev.target.closest('button[data-act]');
            if (!b) return;
            if (b.dataset.act === 'cerrar')   cancelarFiltros();
            if (b.dataset.act === 'limpiar')  limpiarFiltros();
            if (b.dataset.act === 'aplicar')  { disparosFiltrosSnapshot = null; cerrarModalFiltros(); }
        });

        // Live apply en cada cambio de control.
        function liveApply(field, valueGetter) {
            return function () {
                disparosFiltros[field] = valueGetter();
                recargarDisparosLista();
            };
        }
        fId_.addEventListener('input',   liveApply('filtro_id', function () { return fId_.value.trim(); }));
        fCom.addEventListener('change',  liveApply('comunidad', function () { return fCom.value; }));
        fCasa.addEventListener('change', liveApply('casa',      function () { return fCasa.value; }));
        fGuard.addEventListener('change',liveApply('guardia',   function () { return fGuard.value; }));
        fEstado.addEventListener('input',liveApply('estado',    function () { return fEstado.value.trim(); }));
        fDesde.addEventListener('change',liveApply('desde',     function () { return fDesde.value; }));
        fHasta.addEventListener('change',liveApply('hasta',     function () { return fHasta.value; }));
        fLimit.addEventListener('change',liveApply('limit',     function () { return parseInt(fLimit.value, 10) || 100; }));
        fSort.addEventListener('change', liveApply('sort',      function () { return fSort.value || 'id'; }));
        fDir.addEventListener('change',  liveApply('dir',       function () { return fDir.value  || 'desc'; }));
        fChips.forEach(function (chip) {
            chip.addEventListener('click', function () {
                disparosFiltros.cerrado = chip.dataset.value;
                fChips.forEach(function (c) { c.classList.toggle('active', c === chip); });
                recargarDisparosLista();
            });
        });

        // --- Menú contextual de fila -----------------------------------
        function cerrarCtxMenu() {
            ctxMenu.classList.remove('open');
            ctxId = null;
        }
        function abrirCtxMenu(x, y, id) {
            ctxId = id;
            ctxMenu.classList.add('open');
            // Reposicionar para no salirse del viewport.
            var rect = ctxMenu.getBoundingClientRect();
            var w = rect.width, h = rect.height;
            var vw = window.innerWidth, vh = window.innerHeight;
            var left = Math.min(x, vw - w - 8);
            var top  = Math.min(y, vh - h - 8);
            ctxMenu.style.left = Math.max(8, left) + 'px';
            ctxMenu.style.top  = Math.max(8, top)  + 'px';
        }
        ctxMenu.addEventListener('click', function (ev) {
            var b = ev.target.closest('button[data-action]');
            if (!b || ctxId == null) return;
            var id = ctxId;
            cerrarCtxMenu();
            if (b.dataset.action === 'consultar') abrirConsulta(id);
            else if (b.dataset.action === 'editar')    abrirEdicion(id);
            else if (b.dataset.action === 'eliminar')  pedirEliminar(id);
        });

        // --- Menú contextual de la toolbar (botón hamburguesa) ---------
        function cerrarToolbarMenu() { toolbarMenu.classList.remove('open'); }
        function abrirToolbarMenu(x, y) {
            toolbarMenu.classList.add('open');
            var rect = toolbarMenu.getBoundingClientRect();
            var w = rect.width, h = rect.height;
            var vw = window.innerWidth, vh = window.innerHeight;
            toolbarMenu.style.left = Math.max(8, Math.min(x, vw - w - 8)) + 'px';
            toolbarMenu.style.top  = Math.max(8, Math.min(y, vh - h - 8)) + 'px';
        }
        document.getElementById('dspMenuToolbar').addEventListener('click', function (ev) {
            ev.stopPropagation();
            if (toolbarMenu.classList.contains('open')) { cerrarToolbarMenu(); return; }
            var rect = this.getBoundingClientRect();
            abrirToolbarMenu(rect.left, rect.bottom + 4);
        });
        toolbarMenu.addEventListener('click', function (ev) {
            var b = ev.target.closest('button[data-action]');
            if (!b) return;
            cerrarToolbarMenu();
            if (b.dataset.action === 'calculador') {
                abrirCalculador();
            }
        });

        // --- Modal Calculador -----------------------------------------
        var calcModal   = document.getElementById('dspCalcModal');
        var calcMes     = document.getElementById('dspCalcMes');
        var calcGuardia = document.getElementById('dspCalcGuardia');
        var calcPrecio  = document.getElementById('dspCalcPrecio');
        var calcResumen = document.getElementById('dspCalcResumen');
        var calcTbody   = document.getElementById('dspCalcTbody');
        var calcTotal   = document.getElementById('dspCalcTotal');
        var calcSeq     = 0;
        var calcTimer   = null;

        calcModal.addEventListener('click', function (ev) {
            if (ev.target === calcModal || ev.target.closest('[data-act="close"]')) {
                calcModal.classList.remove('open');
            }
        });

        var calcAyudaModal = document.getElementById('dspCalcAyudaModal');
        document.getElementById('dspCalcAyuda').addEventListener('click', function () {
            calcAyudaModal.classList.add('open');
        });
        calcAyudaModal.addEventListener('click', function (ev) {
            if (ev.target === calcAyudaModal || ev.target.closest('[data-act="close"]')) {
                calcAyudaModal.classList.remove('open');
            }
        });

        function abrirCalculador() {
            calcModal.classList.add('open');
            recalcular();
        }
        function programarRecalculo() {
            if (calcTimer) clearTimeout(calcTimer);
            calcTimer = setTimeout(recalcular, 250);
        }
        calcMes.addEventListener('input',     programarRecalculo);
        calcGuardia.addEventListener('change', recalcular);
        calcPrecio.addEventListener('input',  programarRecalculo);

        async function recalcular() {
            var mes = (calcMes.value || '').trim();
            if (!/^\d{4}-\d{2}$/.test(mes)) {
                calcResumen.className   = 'alert alert-info';
                calcResumen.textContent = 'Seleccioná un mes válido (formato YYYY-MM).';
                calcTbody.innerHTML     = '<tr><td colspan="6" class="table-empty">— Sin resultados —</td></tr>';
                calcTotal.textContent   = 'Total: $0';
                return;
            }
            var precio = parseFloat(calcPrecio.value);
            if (!isFinite(precio) || precio < 0) precio = 0;

            // Rango del mes.
            var partes = mes.split('-');
            var y = parseInt(partes[0], 10);
            var m = parseInt(partes[1], 10);
            var desde = mes + '-01';
            // Último día del mes: día 0 del mes siguiente.
            var ultimo = new Date(Date.UTC(y, m, 0)).getUTCDate();
            var hasta  = mes + '-' + (ultimo < 10 ? '0' + ultimo : ultimo);

            var qs = ['desde=' + encodeURIComponent(desde),
                      'hasta=' + encodeURIComponent(hasta),
                      'limit=10000', 'sort=id', 'dir=desc'];
            if (calcGuardia.value) qs.push('guardia=' + encodeURIComponent(calcGuardia.value));

            var seq = ++calcSeq;
            calcResumen.className   = 'alert alert-info';
            calcResumen.textContent = 'Calculando…';
            calcTbody.innerHTML     = '<tr><td colspan="6" class="table-empty">Cargando…</td></tr>';

            try {
                var data = await api('/api/disparos.php?' + qs.join('&'));
                if (seq !== calcSeq) return; // hay otro pedido más nuevo en curso
                var lista = data.disparos || [];
                var n = lista.length;
                var total = 0;

                var nombreGuardia = '';
                if (calcGuardia.value) {
                    var sel = calcGuardia.options[calcGuardia.selectedIndex];
                    nombreGuardia = sel ? sel.textContent : '';
                }
                calcResumen.className   = 'alert alert-success';
                calcResumen.textContent = n + ' disparo(s) en ' + mes +
                    (nombreGuardia ? ' · Guardia: ' + nombreGuardia : ' · Todas las guardias') +
                    ' · Base ' + formatearPesos(precio) + ' c/u × factor por espera';

                if (!n) {
                    calcTbody.innerHTML = '<tr><td colspan="9" class="table-empty">No hay disparos para este filtro.</td></tr>';
                } else {
                    calcTbody.innerHTML = lista.map(function (d) {
                        var esperaTxt = (d.espera != null && d.espera !== '') ? (e(String(d.espera)) + ' s') : '—';
                        var factor    = disparoFactor(d.espera);
                        var factorTxt = factor != null ? (factor.toFixed(1) + 'x') : '—';
                        var valor     = factor != null ? precio * factor : 0;
                        total += valor;
                        return '<tr>' +
                            '<td class="td-id">#' + d.id + '</td>' +
                            '<td>' + e(abmFecha(d.fecha) || '—') + '</td>' +
                            '<td>' + e(d.modo || '—') + '</td>' +
                            '<td>' + e(d.comunidad_nombre || '—') + '</td>' +
                            '<td>' + e(d.casa_nombre || '—') + '</td>' +
                            '<td>' + e(d.guardia_nombre || '—') + '</td>' +
                            '<td>' + esperaTxt + '</td>' +
                            '<td>' + factorTxt + '</td>' +
                            '<td style="text-align:right;">' + (factor != null ? formatearPesos(valor) : '—') + '</td>' +
                        '</tr>';
                    }).join('');
                }
                calcTotal.textContent = 'Total: ' + formatearPesos(total);
            } catch (err) {
                if (seq !== calcSeq) return;
                calcResumen.className   = 'alert alert-error';
                calcResumen.textContent = err.message;
                calcTbody.innerHTML     = '<tr><td colspan="9" class="table-empty">—</td></tr>';
                calcTotal.textContent   = 'Total: $0';
            }
        }

        // Cierre global para AMBOS menús contextuales.
        document.addEventListener('click', function (ev) {
            if (ctxMenu.classList.contains('open')     && !ctxMenu.contains(ev.target))     cerrarCtxMenu();
            if (toolbarMenu.classList.contains('open') && !toolbarMenu.contains(ev.target)) cerrarToolbarMenu();
        });
        document.addEventListener('scroll',  function () { cerrarCtxMenu(); cerrarToolbarMenu(); }, true);
        window.addEventListener('resize',    function () { cerrarCtxMenu(); cerrarToolbarMenu(); });
        document.addEventListener('keydown', function (ev) {
            if (ev.key === 'Escape') { cerrarCtxMenu(); cerrarToolbarMenu(); }
        });

        // --- Filas: clic = Consultar, click derecho = ctx menu ---------
        tbody.addEventListener('click', function (ev) {
            var tr = ev.target.closest('tr[data-id]');
            if (!tr) return;
            var id = parseInt(tr.dataset.id, 10);
            var btn = ev.target.closest('button[data-act="menu"]');
            if (btn) {
                ev.stopPropagation();
                var rect = btn.getBoundingClientRect();
                abrirCtxMenu(rect.right - 200, rect.bottom + 4, id);
                return;
            }
            // Ignorar clics sobre elementos interactivos dentro de la fila.
            if (ev.target.closest('a,input,select,button')) return;
            abrirConsulta(id);
        });
        tbody.addEventListener('contextmenu', function (ev) {
            var tr = ev.target.closest('tr[data-id]');
            if (!tr) return;
            ev.preventDefault();
            var id = parseInt(tr.dataset.id, 10);
            abrirCtxMenu(ev.clientX, ev.clientY, id);
        });

        // --- Modal Consultar -------------------------------------------
        consultarModal.addEventListener('click', function (ev) {
            if (ev.target === consultarModal || ev.target.closest('[data-act="close"]')) {
                consultarModal.classList.remove('open');
            }
        });
        consultarEditar.addEventListener('click', function () {
            if (consultarIdActual == null) return;
            consultarModal.classList.remove('open');
            abrirEdicion(consultarIdActual);
        });

        async function abrirConsulta(id) {
            consultarIdActual = id;
            consultarSub.innerHTML  = '<code>#' + id + '</code>';
            consultarBody.innerHTML = '<div style="display:flex;justify-content:center;padding:24px"><div class="spin"></div></div>';
            consultarModal.classList.add('open');

            var d;
            try {
                d = disparosRegistroCache[id] || (disparosRegistroCache[id] = await api('/api/disparos.php?id=' + id));
            } catch (err) {
                consultarBody.innerHTML = '<div class="alert alert-error">' + e(err.message) + '</div>';
                return;
            }

            var cierreBadge = d.cerrado
                ? '<span class="badge badge-success">' + e(abmFecha(d.cerrado)) + '</span>'
                : '<span class="badge badge-warn">Abierto</span>';
            var esperaTxt = (d.espera != null && d.espera !== '') ? (d.espera + ' s') : null;

            var modoBadge = d.modo
                ? '<span class="badge ' + disparoBadgeClase(d.estado) + '">' + e(d.modo) + '</span>'
                : null;

            consultarSub.innerHTML  = '<code>#' + d.id + '</code>';
            consultarBody.innerHTML =
                abmRow    ('Código',          '<code>#' + d.id + '</code>') +
                (modoBadge
                    ? abmRow ('Modo',         modoBadge)
                    : abmRowTxt('Modo',       d.modo, 'Sin modo')) +
                abmRowTxt ('Fecha',           abmFecha(d.fecha),     'Sin fecha') +
                abmRowRef ('Comunidad',       d.comunidad, d.comunidad_nombre, 'Sin comunidad') +
                abmRowRef ('Casa',            d.casa,      d.casa_nombre,      'Sin casa') +
                abmRowRef ('Usuario',         d.usuario,   d.usuario_nombre,   'Sin usuario') +
                abmRowTxt ('Ubicación',       d.ubicacion, 'Sin ubicación', true) +
                abmRowTxt ('Procesado',       abmFecha(d.procesado), 'No procesado') +
                abmRowTxt ('Tomado',          abmFecha(d.tomado),    'No tomado') +
                abmRowRef ('Guardia',         d.guardia,   d.guardia_nombre, 'Sin guardia') +
                abmRowTxt ('Patrulla',        d.patrulla,  'Sin patrulla') +
                abmRowTxt ('Resultado',       d.resultado, 'Sin resultado') +
                abmRowTxt ('Detalle',         d.detalle,   'Sin detalle') +
                abmRowTxt ('Comentario',      d.comentario, 'Sin comentario', true) +
                abmRow    ('Cierre',          cierreBadge) +
                abmRowTxt ('Espera',          esperaTxt,   'Sin espera') +
                abmRowTxt ('Reportado',       d.reportado, 'Sin reportar') +
                abmRowTxt ('Estado',          d.estado_texto || d.estado, 'Sin estado');
        }

        // --- Modal Alta / Edición --------------------------------------
        function resetForm() { form.reset(); fId.value = ''; }
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

        document.getElementById('dspNuevo').addEventListener('click', function () {
            modoEdicion = false;
            resetForm();
            modalTitulo.textContent = 'Nuevo disparo';
            modalSub.textContent    = '';
            var now = new Date();
            var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
            document.getElementById('dsp-fecha').value =
                now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()) +
                'T' + pad(now.getHours()) + ':' + pad(now.getMinutes());
            openModal();
            document.getElementById('dsp-fecha').focus();
        });

        async function abrirEdicion(id) {
            try {
                var d = disparosRegistroCache[id] || (disparosRegistroCache[id] = await api('/api/disparos.php?id=' + id));
                modoEdicion = true;
                resetForm();
                fId.value = d.id;
                modalTitulo.textContent = 'Editar disparo';
                modalSub.textContent    = '#' + d.id;
                document.getElementById('dsp-fecha').value      = dtLocal(d.fecha);
                document.getElementById('dsp-modo').value       = d.modo       || '';
                document.getElementById('dsp-comunidad').value  = d.comunidad != null ? d.comunidad : '';
                document.getElementById('dsp-casa').value       = d.casa      != null ? d.casa      : '';
                document.getElementById('dsp-usuario').value    = d.usuario   != null ? d.usuario   : '';
                document.getElementById('dsp-guardia').value    = d.guardia   != null ? d.guardia   : '';
                document.getElementById('dsp-ubicacion').value  = d.ubicacion  || '';
                document.getElementById('dsp-patrulla').value   = d.patrulla   || '';
                document.getElementById('dsp-resultado').value  = d.resultado  || '';
                document.getElementById('dsp-detalle').value    = d.detalle    || '';
                document.getElementById('dsp-comentario').value = d.comentario || '';
                document.getElementById('dsp-procesado').value  = dtLocal(d.procesado);
                document.getElementById('dsp-tomado').value     = dtLocal(d.tomado);
                document.getElementById('dsp-cerrado').value    = dtLocal(d.cerrado);
                document.getElementById('dsp-espera').value     = d.espera   != null ? d.espera   : '';
                document.getElementById('dsp-reportado').value  = d.reportado  || '';
                document.getElementById('dsp-estado').value     = d.estado     || '';
                openModal();
                document.getElementById('dsp-fecha').focus();
            } catch (err) {
                toast(err.message, true);
            }
        }

        function pedirEliminar(id) {
            confirmMsg.textContent = '¿Eliminar el disparo #' + id + '? Esta acción no se puede deshacer.';
            pendingDeleteId = id;
            confirmBox.classList.add('open');
        }
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
                await api('/api/disparos.php?id=' + pendingDeleteId, { method: 'DELETE' });
                toast('Disparo eliminado.');
                recargarDisparosLista();
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
                fecha:      document.getElementById('dsp-fecha').value,
                modo:       document.getElementById('dsp-modo').value.trim(),
                comunidad:  document.getElementById('dsp-comunidad').value || null,
                casa:       document.getElementById('dsp-casa').value      || null,
                usuario:    document.getElementById('dsp-usuario').value   || null,
                guardia:    document.getElementById('dsp-guardia').value   || null,
                ubicacion:  document.getElementById('dsp-ubicacion').value.trim(),
                patrulla:   document.getElementById('dsp-patrulla').value.trim(),
                resultado:  document.getElementById('dsp-resultado').value.trim(),
                detalle:    document.getElementById('dsp-detalle').value.trim(),
                comentario: document.getElementById('dsp-comentario').value.trim(),
                procesado:  document.getElementById('dsp-procesado').value,
                tomado:     document.getElementById('dsp-tomado').value,
                cerrado:    document.getElementById('dsp-cerrado').value,
                espera:     document.getElementById('dsp-espera').value,
                reportado:  document.getElementById('dsp-reportado').value.trim(),
                estado:     document.getElementById('dsp-estado').value.trim()
            };

            btnGuardar.disabled = true;
            try {
                if (modoEdicion) {
                    await api('/api/disparos.php?id=' + encodeURIComponent(fId.value), {
                        method: 'PUT',
                        body:   payload
                    });
                    toast('Disparo actualizado.');
                } else {
                    await api('/api/disparos.php', {
                        method: 'POST',
                        body:   payload
                    });
                    toast('Disparo creado.');
                }
                closeModal();
                recargarDisparosLista();
            } catch (err) {
                showFormError(err.message);
            } finally {
                btnGuardar.disabled = false;
            }
        });

        applyClientFilter();
    }

    // -------- Vista: Señales (solo lectura) -------------------------------

    var senalesFiltrosDefault = {
        sort:      'id',
        dir:       'desc',
        limit:     100,
        filtro_id: '',
        sentido:   '',
        prioridad: '',
        estado:    '',
        procesada: '',
        desde:     '',
        hasta:     ''
    };
    var senalesFiltros         = Object.assign({}, senalesFiltrosDefault);
    var senalesFiltrosSnapshot = null;
    var senalesRegistroCache   = {};

    function senalesQueryString() {
        // `filtro_id` se aplica client-side (el endpoint no acepta filtro por id).
        var qs = [];
        Object.keys(senalesFiltros).forEach(function (k) {
            if (k === 'filtro_id') return;
            var v = senalesFiltros[k];
            if (v !== '' && v != null) {
                qs.push(encodeURIComponent(k) + '=' + encodeURIComponent(v));
            }
        });
        return qs.length ? ('?' + qs.join('&')) : '';
    }

    function senalesFiltrosActivos() {
        var n = 0;
        Object.keys(senalesFiltrosDefault).forEach(function (k) {
            if (k === 'sort' || k === 'dir' || k === 'limit') return;
            if (String(senalesFiltros[k]) !== String(senalesFiltrosDefault[k])) n++;
        });
        return n;
    }

    async function renderSenales(view) {
        var data    = await api('/api/senales.php' + senalesQueryString());
        var senales = data.senales || [];
        var kpis    = data.kpis    || {};
        senalesRegistroCache = {};
        senales.forEach(function (s) { senalesRegistroCache[s.id] = s; });

        view.innerHTML =
            moduleHelpSenalesHtml() +

            '<div class="stats-bar" id="senStats">' + renderSenalesStats(kpis) + '</div>' +

            toolbarSenalesHtml() +

            '<div class="table-card">' +
                '<table><thead><tr>' +
                    '<th>Código</th><th>Fecha</th><th>Sentido</th><th>Propagación</th>' +
                    '<th>Prioridad</th><th>Texto</th><th>Intentos</th>' +
                    '<th>Procesada</th><th>Estado</th>' +
                    '<th style="text-align:center;">Acciones</th>' +
                '</tr></thead><tbody id="senTbody">' +
                renderFilasSenales(senales) +
                '</tbody></table>' +
                '<div class="table-empty" id="senEmpty" style="display:none;">No hay señales que coincidan con la búsqueda.</div>' +
            '</div>' +
            '<div class="text-muted text-sm" id="senCount" style="margin-top:10px;">' +
                senalesCountText(senales.length) +
            '</div>' +

            modalConsultarSenalHtml() +
            modalFiltrosSenalesHtml() +
            ctxMenuSenalesHtml();

        wireSenalesView();
    }

    function moduleHelpSenalesHtml() {
        return '<div class="module-help" style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:14px 18px;margin-bottom:16px;box-shadow:var(--shadow);display:flex;gap:14px;align-items:center;">' +
            '<div style="font-size:1.6rem;line-height:1;">📡</div>' +
            '<div style="font-size:.88rem;color:var(--muted);line-height:1.45;">' +
                'Las señales son los paquetes de comunicación que la plataforma intercambia con los equipos, con su contenido, prioridad, intentos y estado de procesamiento.' +
            '</div>' +
        '</div>';
    }

    function renderSenalesStats(kpis) {
        return statCard('Total',      kpis.total      || 0, 'orange', 'Señales registradas') +
               statCard('Pendientes', kpis.pendientes || 0, 'red',    'Sin procesar') +
               statCard('Hoy',        kpis.hoy        || 0, 'green',  'Recibidas hoy');
    }

    function senalesCountText(n) {
        return 'Mostrando ' + n + ' resultado(s) (límite ' + senalesFiltros.limit + ').';
    }

    function toolbarSenalesHtml() {
        var n = senalesFiltrosActivos();
        var badge  = '<span class="btn-icon-badge"' + (n ? '' : ' style="display:none;"') + '>' + (n || '') + '</span>';
        var activo = n ? ' active' : '';
        return '<div class="toolbar">' +
            '<div class="toolbar-left" style="gap:8px;flex-wrap:wrap;">' +
                '<div class="search-wrap">' +
                    '<input type="search" id="senSearch" class="search-input" placeholder="🔍 Buscar texto, propagación, sentido o estado…">' +
                    '<button class="search-clear" id="senSearchClear" type="button" style="display:none;">&times;</button>' +
                '</div>' +
                '<button class="btn btn-ghost btn-icon' + activo + '" id="senFiltros" type="button" title="Filtros">' +
                    '<i class="fa-solid fa-filter"></i>' + badge +
                '</button>' +
                '<button class="btn btn-ghost btn-icon" id="senRefrescar" type="button" title="Refrescar">' +
                    '<i class="fa-solid fa-rotate"></i>' +
                '</button>' +
            '</div>' +
            '<div class="toolbar-right">' +
                '<button class="btn btn-primary" id="senMonitor" type="button" title="Monitor en tiempo real de señales entrantes">' +
                    '<i class="fa-solid fa-tower-broadcast"></i> Ver en tiempo real' +
                '</button>' +
            '</div>' +
        '</div>';
    }

    function ctxMenuSenalesHtml() {
        return '<div id="senCtxMenu" class="ctx-menu" role="menu">' +
            '<button type="button" data-action="consultar" role="menuitem">' +
                '<i class="fa-solid fa-eye"></i><span>Consultar</span>' +
            '</button>' +
        '</div>';
    }

    function renderFilasSenales(senales) {
        if (!senales.length) {
            return '<tr><td colspan="10" class="table-empty">No hay señales cargadas.</td></tr>';
        }
        return senales.map(function (s) {
            var busq  = String((s.texto || '') + ' ' + (s.propagacion || '') + ' ' + (s.sentido || '') + ' ' + (s.prioridad || '') + ' ' + (s.estado || '')).toLowerCase().trim();
            var texto = (s.texto || '').length > 80 ? (s.texto.substring(0, 80) + '…') : (s.texto || '');
            var procesada = s.procesada
                ? '<span class="badge badge-success">' + e(abmFecha(s.procesada)) + '</span>'
                : '<span class="badge badge-warn">Pendiente</span>';
            return '<tr data-id="' + s.id + '" data-search="' + e(busq) + '" style="cursor:pointer;">' +
                '<td class="td-id">#' + s.id + '</td>' +
                '<td>' + e(abmFecha(s.fecha) || '—') + '</td>' +
                '<td>' + e(s.sentido || '—') + '</td>' +
                '<td>' + e(s.propagacion || '—') + '</td>' +
                '<td>' + e(s.prioridad || '—') + '</td>' +
                '<td title="' + e(s.texto || '') + '">' + e(texto || '—') + '</td>' +
                '<td>' + (s.intentos != null ? e(String(s.intentos)) : '—') + '</td>' +
                '<td>' + procesada + '</td>' +
                '<td>' + e(s.estado || '—') + '</td>' +
                '<td style="text-align:center;">' +
                    '<div class="actions" style="justify-content:center;">' +
                        '<button class="btn-icon-sm" data-act="menu" type="button" title="Más acciones">' +
                            '<i class="fa-solid fa-bars"></i>' +
                        '</button>' +
                    '</div>' +
                '</td>' +
            '</tr>';
        }).join('');
    }

    function modalConsultarSenalHtml() {
        return '<div class="modal-backdrop" id="senConsultar"><div class="modal">' +
            '<div class="modal-header">' +
                '<div class="modal-title">' +
                    '<span>Consultar señal</span>' +
                    '<span class="modal-subtitle" id="senConsultarSub"></span>' +
                '</div>' +
                '<button class="btn-icon-sm" data-act="close" type="button" aria-label="Cerrar">&times;</button>' +
            '</div>' +
            '<div class="modal-body">' +
                '<dl class="data-list" id="senConsultarBody"></dl>' +
            '</div>' +
            '<div class="modal-footer">' +
                '<button type="button" class="btn btn-ghost" data-act="close">Cerrar</button>' +
            '</div>' +
        '</div></div>';
    }

    function modalFiltrosSenalesHtml() {
        return '<div class="modal-backdrop" id="senFiltrosModal"><div class="modal" style="max-width:560px;">' +
            '<div class="modal-header">' +
                '<div class="modal-title"><i class="fa-solid fa-filter"></i> Filtros</div>' +
                '<button class="btn btn-ghost" data-act="cerrar" type="button" title="Cerrar">&times;</button>' +
            '</div>' +
            '<div class="modal-body">' +
                '<div class="form-row">' +
                    '<div class="form-group"><label for="sflt-id">Código</label>' +
                        '<input id="sflt-id" type="number" min="1" step="1" inputmode="numeric" placeholder="ID de la señal…"></div>' +
                    '<div class="form-group"><label for="sflt-sentido">Sentido</label>' +
                        '<input id="sflt-sentido" type="text" maxlength="1" placeholder="1 carácter"></div>' +
                '</div>' +
                '<div class="form-row">' +
                    '<div class="form-group"><label for="sflt-prioridad">Prioridad</label>' +
                        '<input id="sflt-prioridad" type="text" maxlength="1" placeholder="1 carácter"></div>' +
                    '<div class="form-group"><label for="sflt-estado">Estado</label>' +
                        '<input id="sflt-estado" type="text" maxlength="1" placeholder="1 carácter"></div>' +
                '</div>' +
                '<div class="form-group">' +
                    '<label>Estado del registro</label>' +
                    '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
                        '<button type="button" class="filter-chip" data-chip="procesada" data-value=""  >Todas</button>' +
                        '<button type="button" class="filter-chip" data-chip="procesada" data-value="no">Pendientes</button>' +
                        '<button type="button" class="filter-chip" data-chip="procesada" data-value="si">Procesadas</button>' +
                    '</div>' +
                '</div>' +
                '<div class="form-row">' +
                    '<div class="form-group"><label for="sflt-desde">Desde</label>' +
                        '<input id="sflt-desde" type="date"></div>' +
                    '<div class="form-group"><label for="sflt-hasta">Hasta</label>' +
                        '<input id="sflt-hasta" type="date"></div>' +
                '</div>' +
                '<div class="form-row form-row-3">' +
                    '<div class="form-group"><label for="sflt-limit">Límite</label>' +
                        '<input id="sflt-limit" type="number" min="1" max="1000" step="1" inputmode="numeric"></div>' +
                    '<div class="form-group"><label for="sflt-sort">Ordenar por</label>' +
                        '<select id="sflt-sort">' +
                            '<option value="id">Código</option>' +
                            '<option value="fecha">Fecha</option>' +
                            '<option value="procesada">Procesada</option>' +
                            '<option value="intentos">Intentos</option>' +
                        '</select></div>' +
                    '<div class="form-group"><label for="sflt-dir">Dirección</label>' +
                        '<select id="sflt-dir">' +
                            '<option value="desc">Descendente</option>' +
                            '<option value="asc">Ascendente</option>' +
                        '</select></div>' +
                '</div>' +
            '</div>' +
            '<div class="modal-footer">' +
                '<button type="button" class="btn btn-ghost"   data-act="cerrar"  >Cerrar</button>' +
                '<button type="button" class="btn btn-ghost"   data-act="limpiar" >Limpiar</button>' +
                '<button type="button" class="btn btn-primary" data-act="aplicar" >Aplicar</button>' +
            '</div>' +
        '</div></div>';
    }

    function actualizarBadgeFiltrosSenales() {
        var btn = document.getElementById('senFiltros');
        if (!btn) return;
        var badge = btn.querySelector('.btn-icon-badge');
        var n = senalesFiltrosActivos();
        btn.classList.toggle('active', n > 0);
        if (badge) {
            badge.textContent = n || '';
            badge.style.display = n ? '' : 'none';
        }
    }

    async function recargarSenalesLista() {
        try {
            var data    = await api('/api/senales.php' + senalesQueryString());
            var senales = data.senales || [];
            var kpis    = data.kpis    || {};
            senalesRegistroCache = {};
            senales.forEach(function (s) { senalesRegistroCache[s.id] = s; });

            var stats = document.getElementById('senStats');
            var tbody = document.getElementById('senTbody');
            var count = document.getElementById('senCount');
            if (stats) stats.innerHTML = renderSenalesStats(kpis);
            if (tbody) tbody.innerHTML = renderFilasSenales(senales);
            if (count) count.textContent = senalesCountText(senales.length);

            actualizarBadgeFiltrosSenales();
            var searchInput = document.getElementById('senSearch');
            if (searchInput) searchInput.dispatchEvent(new Event('input'));
        } catch (err) {
            toast(err.message, true);
        }
    }

    function wireSenalesView() {
        var tbody       = document.getElementById('senTbody');
        var emptyState  = document.getElementById('senEmpty');
        var searchInput = document.getElementById('senSearch');
        var searchClear = document.getElementById('senSearchClear');

        var filtrosModal   = document.getElementById('senFiltrosModal');
        var consultarModal = document.getElementById('senConsultar');
        var consultarSub   = document.getElementById('senConsultarSub');
        var consultarBody  = document.getElementById('senConsultarBody');

        var ctxMenu = document.getElementById('senCtxMenu');
        var ctxId   = null;

        // --- Búsqueda rápida cliente + filtro por Código (client-side) -----
        function applyClientFilter() {
            var q = searchInput.value.trim().toLowerCase();
            var codFilter = String(senalesFiltros.filtro_id || '').trim();
            var visibles = 0;
            tbody.querySelectorAll('tr[data-id]').forEach(function (tr) {
                var haystack = tr.dataset.search || '';
                var matchQ   = !q || haystack.indexOf(q) !== -1;
                var matchCod = !codFilter || tr.dataset.id === codFilter;
                var show = matchQ && matchCod;
                tr.style.display = show ? '' : 'none';
                if (show) visibles++;
            });
            if (emptyState) {
                var hayFilas = !!tbody.querySelector('tr[data-id]');
                emptyState.style.display = (visibles === 0 && hayFilas) ? '' : 'none';
            }
            if (searchClear) searchClear.style.display = q ? '' : 'none';
        }
        searchInput.addEventListener('input', applyClientFilter);
        searchClear.addEventListener('click', function () {
            searchInput.value = '';
            applyClientFilter();
            searchInput.focus();
        });

        // --- Refrescar ------------------------------------------------------
        document.getElementById('senRefrescar').addEventListener('click', recargarSenalesLista);

        // --- Ver en tiempo real --------------------------------------------
        document.getElementById('senMonitor').addEventListener('click', openSenalesLiveMonitorModal);

        // --- Modal de filtros (live apply + snapshot) ----------------------
        var fId    = document.getElementById('sflt-id');
        var fSen   = document.getElementById('sflt-sentido');
        var fPrio  = document.getElementById('sflt-prioridad');
        var fEst   = document.getElementById('sflt-estado');
        var fDesde = document.getElementById('sflt-desde');
        var fHasta = document.getElementById('sflt-hasta');
        var fLimit = document.getElementById('sflt-limit');
        var fSort  = document.getElementById('sflt-sort');
        var fDir   = document.getElementById('sflt-dir');
        var fChips = filtrosModal.querySelectorAll('.filter-chip[data-chip="procesada"]');

        function sincronizarControlesFiltros() {
            fId.value    = senalesFiltros.filtro_id;
            fSen.value   = senalesFiltros.sentido;
            fPrio.value  = senalesFiltros.prioridad;
            fEst.value   = senalesFiltros.estado;
            fDesde.value = senalesFiltros.desde;
            fHasta.value = senalesFiltros.hasta;
            fLimit.value = senalesFiltros.limit;
            fSort.value  = senalesFiltros.sort;
            fDir.value   = senalesFiltros.dir;
            fChips.forEach(function (c) {
                c.classList.toggle('active', c.dataset.value === String(senalesFiltros.procesada || ''));
            });
        }
        function abrirModalFiltros() {
            senalesFiltrosSnapshot = Object.assign({}, senalesFiltros);
            sincronizarControlesFiltros();
            filtrosModal.classList.add('open');
        }
        function cerrarModalFiltros() { filtrosModal.classList.remove('open'); }
        function cancelarFiltros() {
            if (senalesFiltrosSnapshot) {
                Object.keys(senalesFiltrosSnapshot).forEach(function (k) {
                    senalesFiltros[k] = senalesFiltrosSnapshot[k];
                });
                senalesFiltrosSnapshot = null;
                recargarSenalesLista();
            }
            cerrarModalFiltros();
        }
        function limpiarFiltros() {
            Object.assign(senalesFiltros, senalesFiltrosDefault);
            sincronizarControlesFiltros();
            recargarSenalesLista();
        }

        document.getElementById('senFiltros').addEventListener('click', abrirModalFiltros);
        filtrosModal.addEventListener('click', function (ev) {
            if (ev.target === filtrosModal) { cancelarFiltros(); return; }
            var b = ev.target.closest('button[data-act]');
            if (!b) return;
            if (b.dataset.act === 'cerrar')  cancelarFiltros();
            if (b.dataset.act === 'limpiar') limpiarFiltros();
            if (b.dataset.act === 'aplicar') { senalesFiltrosSnapshot = null; cerrarModalFiltros(); }
        });

        // Live apply: `filtro_id` filtra client-side; el resto reconsulta el backend.
        function liveApply(field, valueGetter, clientOnly) {
            return function () {
                senalesFiltros[field] = valueGetter();
                if (clientOnly) {
                    actualizarBadgeFiltrosSenales();
                    applyClientFilter();
                } else {
                    recargarSenalesLista();
                }
            };
        }
        fId.addEventListener('input',     liveApply('filtro_id', function () { return fId.value.trim(); }, true));
        fSen.addEventListener('input',    liveApply('sentido',   function () { return fSen.value.trim(); }));
        fPrio.addEventListener('input',   liveApply('prioridad', function () { return fPrio.value.trim(); }));
        fEst.addEventListener('input',    liveApply('estado',    function () { return fEst.value.trim(); }));
        fDesde.addEventListener('change', liveApply('desde',     function () { return fDesde.value; }));
        fHasta.addEventListener('change', liveApply('hasta',     function () { return fHasta.value; }));
        fLimit.addEventListener('change', liveApply('limit',     function () { return parseInt(fLimit.value, 10) || 100; }));
        fSort.addEventListener('change',  liveApply('sort',      function () { return fSort.value || 'id'; }));
        fDir.addEventListener('change',   liveApply('dir',       function () { return fDir.value  || 'desc'; }));
        fChips.forEach(function (chip) {
            chip.addEventListener('click', function () {
                senalesFiltros.procesada = chip.dataset.value;
                fChips.forEach(function (c) { c.classList.toggle('active', c === chip); });
                recargarSenalesLista();
            });
        });

        // --- Menú contextual de fila ----------------------------------------
        function cerrarCtxMenu() {
            ctxMenu.classList.remove('open');
            ctxId = null;
        }
        function abrirCtxMenu(x, y, id) {
            ctxId = id;
            ctxMenu.classList.add('open');
            var rect = ctxMenu.getBoundingClientRect();
            var w = rect.width, h = rect.height;
            var vw = window.innerWidth, vh = window.innerHeight;
            ctxMenu.style.left = Math.max(8, Math.min(x, vw - w - 8)) + 'px';
            ctxMenu.style.top  = Math.max(8, Math.min(y, vh - h - 8)) + 'px';
        }
        ctxMenu.addEventListener('click', function (ev) {
            var b = ev.target.closest('button[data-action]');
            if (!b || ctxId == null) return;
            var id = ctxId;
            cerrarCtxMenu();
            if (b.dataset.action === 'consultar') abrirConsulta(id);
        });

        document.addEventListener('click', function (ev) {
            if (ctxMenu.classList.contains('open') && !ctxMenu.contains(ev.target)) cerrarCtxMenu();
        });
        document.addEventListener('scroll',  function () { cerrarCtxMenu(); }, true);
        window.addEventListener('resize',    function () { cerrarCtxMenu(); });
        document.addEventListener('keydown', function (ev) {
            if (ev.key === 'Escape') cerrarCtxMenu();
        });

        // --- Filas: clic = Consultar, hamburguesa / click derecho = ctx ----
        tbody.addEventListener('click', function (ev) {
            var tr = ev.target.closest('tr[data-id]');
            if (!tr) return;
            var id = parseInt(tr.dataset.id, 10);
            var btn = ev.target.closest('button[data-act="menu"]');
            if (btn) {
                ev.stopPropagation();
                var rect = btn.getBoundingClientRect();
                abrirCtxMenu(rect.right - 200, rect.bottom + 4, id);
                return;
            }
            if (ev.target.closest('a,input,select,button')) return;
            abrirConsulta(id);
        });
        tbody.addEventListener('contextmenu', function (ev) {
            var tr = ev.target.closest('tr[data-id]');
            if (!tr) return;
            ev.preventDefault();
            var id = parseInt(tr.dataset.id, 10);
            abrirCtxMenu(ev.clientX, ev.clientY, id);
        });

        // --- Modal Consultar -----------------------------------------------
        consultarModal.addEventListener('click', function (ev) {
            if (ev.target === consultarModal || ev.target.closest('[data-act="close"]')) {
                consultarModal.classList.remove('open');
            }
        });

        function abrirConsulta(id) {
            var s = senalesRegistroCache[id];
            if (!s) { toast('Señal #' + id + ' no encontrada.', true); return; }
            var procesada = s.procesada
                ? '<span class="badge badge-success">' + e(abmFecha(s.procesada)) + '</span>'
                : '<span class="badge badge-warn">Pendiente</span>';
            consultarSub.innerHTML  = '<code>#' + s.id + '</code>';
            consultarBody.innerHTML =
                abmRow    ('Código',      '<code>#' + s.id + '</code>') +
                abmRowTxt ('Fecha',       abmFecha(s.fecha), 'Sin fecha') +
                abmRowTxt ('Sentido',     s.sentido,         'Sin sentido') +
                abmRowTxt ('Propagación', s.propagacion,     'Sin propagación') +
                abmRowTxt ('Prioridad',   s.prioridad,       'Sin prioridad') +
                abmRowNum ('Intentos',    s.intentos,        'Sin intentos') +
                abmRow    ('Procesada',   procesada) +
                abmRowTxt ('Estado',      s.estado,          'Sin estado') +
                abmRowTxt ('Texto',       s.texto,           'Sin texto', true);
            consultarModal.classList.add('open');
        }

        actualizarBadgeFiltrosSenales();
    }

    /* Modal "Monitor en tiempo real" (Señales).
     *
     * Modal tipo log de consola/terminal que muestra las señales que van
     * ingresando en vivo, poll-eando `senales_live.php` cada 100 ms (el
     * guard `fetching` evita pisar requests si el server tarda).
     *
     * Tabla real: db/schema.sql -> `senales` (id, fecha, sentido,
     * propagacion, texto, prioridad, intentos, procesada, estado).
     *
     *   - vive en un modal `signals-monitor-modal` (≈1000px de ancho).
     *   - estética terminal: fondo `#0a0a0a`, font monoespaciada.
     *   - orden cronológico ascendente (nuevas abajo, auto-scroll).
     *   - pausa manual (botón) + pausa por hover sobre la consola.
     *   - el timer se limpia al cerrar el modal.
     */
    function openSenalesLiveMonitorModal() {
        var MAX_ROWS = 250;
        var TICK_MS  = 100;

        var backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop';
        backdrop.innerHTML =
            '<div class="modal signals-monitor-modal" role="dialog" aria-modal="true" aria-labelledby="sen-monitor-title">' +
                '<div class="modal-header">' +
                    '<div class="modal-title" id="sen-monitor-title">' +
                        'Monitor en tiempo real' +
                        '<span class="dash-live-status" id="sen-monitor-status">' +
                            '<span class="live-dot"></span> En vivo · 100 ms' +
                        '</span>' +
                    '</div>' +
                    '<div class="signals-monitor-controls">' +
                        '<button type="button" class="btn-icon-sm" id="sen-monitor-toggle" ' +
                                'title="Pausar" aria-label="Pausar feed">' +
                            '<i class="fa-solid fa-pause"></i>' +
                        '</button>' +
                        '<button type="button" class="btn-icon-sm" data-act="close" aria-label="Cerrar">&times;</button>' +
                    '</div>' +
                '</div>' +
                '<div class="modal-body">' +
                    '<div class="signals-monitor-console" id="sen-monitor-console">' +
                        '<div class="signals-monitor-empty">$ esperando señales…<span class="signals-monitor-caret"></span></div>' +
                    '</div>' +
                '</div>' +
                '<div class="modal-footer">' +
                    '<span class="signals-monitor-footer-info">' +
                        '<i class="fa-solid fa-terminal"></i> ' +
                        '<strong id="sen-monitor-count">0</strong> de <strong>' + MAX_ROWS + '</strong> líneas' +
                    '</span>' +
                    '<button class="btn btn-ghost" data-act="close" type="button">Cerrar</button>' +
                '</div>' +
            '</div>';
        document.body.appendChild(backdrop);
        requestAnimationFrame(function () { backdrop.classList.add('open'); });

        var modal      = backdrop.querySelector('.modal');
        var console_   = backdrop.querySelector('#sen-monitor-console');
        var status     = backdrop.querySelector('#sen-monitor-status');
        var toggle     = backdrop.querySelector('#sen-monitor-toggle');
        var countLabel = backdrop.querySelector('#sen-monitor-count');

        // Buffer cronológico ascendente: índice 0 = más vieja, último = más nueva.
        var buffer      = [];
        var maxId       = 0;
        var userPaused  = false;
        var hoverPaused = false;
        var fetching    = false;
        var firstTick   = true;

        function isPaused() { return userPaused || hoverPaused; }

        function updateStatus() {
            if (userPaused) {
                status.innerHTML = '<span class="live-dot"></span> Pausado';
                modal.classList.add('live-paused');
            } else if (hoverPaused) {
                status.innerHTML = '<span class="live-dot"></span> En pausa (hover)';
                modal.classList.add('live-paused');
            } else {
                status.innerHTML = '<span class="live-dot"></span> En vivo · 100 ms';
                modal.classList.remove('live-paused');
            }
        }

        function fmtTs(v) {
            if (!v) return '—';
            return String(v).replace('T', ' ').replace(/\.\d+$/, '');
        }

        function sentidoBits(s) {
            if (s === 'E' || s === 'I') return { cls: 'log-in',    txt: ' IN' };
            if (s === 'S' || s === 'O') return { cls: 'log-out',   txt: 'OUT' };
            return { cls: 'log-muted', txt: ' --' };
        }

        function prioBits(p) {
            var v = (p == null ? '' : String(p)).toUpperCase();
            if (v === 'A' || v === '1' || v === 'H') return { cls: 'log-prio-high', txt: v || '—' };
            if (v === 'M' || v === '2')              return { cls: 'log-prio-mid',  txt: v };
            if (v === '')                            return { cls: 'log-prio-low',  txt: '—' };
            return { cls: 'log-prio-low', txt: v };
        }

        function renderLine(s, isNew) {
            var sb   = sentidoBits(s.sentido);
            var pb   = prioBits(s.prioridad);
            var prop = s.propagacion ? e(s.propagacion) : '—';
            var txt  = (s.texto != null && s.texto !== '')
                ? e(String(s.texto).replace(/\s+/g, ' ').trim())
                : '—';
            var procesada = s.procesada
                ? '<span class="log-processed" title="Procesada ' + e(fmtTs(s.procesada)) + '"><i class="fa-solid fa-check"></i></span>'
                : '<span class="log-pending" title="Pendiente"><i class="fa-regular fa-clock"></i></span>';

            return '<div class="log-line' + (isNew ? ' is-new' : '') + '" data-id="' + s.id + '">' +
                '<span class="log-ts">' + e(fmtTs(s.fecha)) + '</span>' +
                '<span class="log-sep">│</span>' +
                '<span class="log-id">#' + s.id + '</span>' +
                '<span class="log-sep">│</span>' +
                '<span class="log-arrow ' + sb.cls + '">' + sb.txt + '</span>' +
                '<span class="log-sep">│</span>' +
                '<span class="log-prio ' + pb.cls + '">' + pb.txt + '</span>' +
                '<span class="log-sep">│</span>' +
                '<span class="log-prop">' + prop + '</span>' +
                '<span class="log-sep">│</span>' +
                '<span class="log-msg">' + txt + '</span>' +
                '<span class="log-sep">│</span>' +
                procesada +
            '</div>';
        }

        function scrollToBottom() { console_.scrollTop = console_.scrollHeight; }

        function repaintAll() {
            countLabel.textContent = String(buffer.length);
            if (!buffer.length) {
                console_.innerHTML = '<div class="signals-monitor-empty">$ esperando señales…<span class="signals-monitor-caret"></span></div>';
                return;
            }
            console_.innerHTML = buffer.map(function (s) { return renderLine(s, false); }).join('');
        }

        function appendNew(newAsc) {
            var empty = console_.querySelector('.signals-monitor-empty');
            if (empty) empty.remove();

            console_.insertAdjacentHTML('beforeend',
                newAsc.map(function (s) { return renderLine(s, true); }).join('')
            );

            // Trim del DOM si el buffer ya cortó por el principio.
            var lines = console_.querySelectorAll('.log-line');
            var overflow = lines.length - buffer.length;
            for (var i = 0; i < overflow; i++) lines[i].remove();

            countLabel.textContent = String(buffer.length);
            scrollToBottom();
        }

        async function tick() {
            if (!document.body.contains(backdrop)) return;
            if (fetching || isPaused()) return;
            fetching = true;
            try {
                var data = await api('/api/senales_live.php?since_id=' + maxId + '&limit=' + MAX_ROWS);
                if (data.last_id > maxId) maxId = data.last_id;

                // senales_live.php devuelve DESC (nuevas primero); las invertimos
                // a orden cronológico ascendente para el log estilo `tail -f`.
                var incoming = (data.senales || []).slice().reverse();
                if (!incoming.length) return;

                if (firstTick) {
                    firstTick = false;
                    buffer = incoming.slice(-MAX_ROWS);
                    repaintAll();
                    scrollToBottom();
                } else {
                    buffer = buffer.concat(incoming).slice(-MAX_ROWS);
                    appendNew(incoming);
                }
            } catch (_) {
                // Silencioso: el polling se reintenta solo en el próximo tick.
            } finally {
                fetching = false;
            }
        }

        toggle.addEventListener('click', function () {
            userPaused = !userPaused;
            toggle.innerHTML = userPaused
                ? '<i class="fa-solid fa-play"></i>'
                : '<i class="fa-solid fa-pause"></i>';
            toggle.title = userPaused ? 'Reanudar' : 'Pausar';
            toggle.setAttribute('aria-label', toggle.title + ' feed');
            updateStatus();
        });
        console_.addEventListener('mouseenter', function () { hoverPaused = true;  updateStatus(); });
        console_.addEventListener('mouseleave', function () { hoverPaused = false; updateStatus(); });

        updateStatus();
        tick();
        var intervalId = setInterval(tick, TICK_MS);

        function close() {
            clearInterval(intervalId);
            backdrop.classList.remove('open');
            setTimeout(function () { backdrop.remove(); }, 200);
        }
        backdrop.addEventListener('click', function (ev) { if (ev.target === backdrop) close(); });
        backdrop.querySelectorAll('[data-act="close"]').forEach(function (b) {
            b.addEventListener('click', close);
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

    // -------- Vista: Herramientas -----------------------------------------

    async function renderConfig(view) {
        view.innerHTML =
            '<div class="page-header"><div>' +
                '<h1>Herramientas</h1>' +
                '<p>Ajustes generales y parámetros del sistema.</p>' +
            '</div></div>' +

            // Tarjetas del módulo Herramientas: mantener ordenadas
            // alfabéticamente por título. Al agregar una nueva, insertala
            // en la posición correcta — no la pegues al final.
            '<div class="tile-grid">' +
                '<button type="button" class="tile-card" id="cfgTileParametros">' +
                    '<span class="tile-icon">🧩</span>' +
                    '<span class="tile-title">Editor de parámetros</span>' +
                    '<span class="tile-desc">Variables runtime (clave / valor) que el resto del sistema lee para configurarse sin redeploy.</span>' +
                '</button>' +
                '<button type="button" class="tile-card" id="cfgTileExpDB">' +
                    '<span class="tile-icon">🗄️</span>' +
                    '<span class="tile-title">Explorador DB</span>' +
                    '<span class="tile-desc">Recorré las tablas de la base del entorno actual, ojeá su estructura y los últimos registros.</span>' +
                '</button>' +
                '<button type="button" class="tile-card" id="cfgTileS3Exp">' +
                    '<span class="tile-icon">📁</span>' +
                    '<span class="tile-title">Explorador S3</span>' +
                    '<span class="tile-desc">Navegá, subí, descargá y eliminá carpetas y archivos del bucket del entorno actual.</span>' +
                '</button>' +
                '<button type="button" class="tile-card" id="cfgTileMigrador">' +
                    '<span class="tile-icon">📜</span>' +
                    '<span class="tile-title">Migrador DB</span>' +
                    '<span class="tile-desc">Aplicá las migraciones pendientes de <code>db/migrations/</code> contra la BD del entorno actual.</span>' +
                '</button>' +
                '<button type="button" class="tile-card" id="cfgTileTareas">' +
                    '<span class="tile-icon">⏰</span>' +
                    '<span class="tile-title">Programador de tareas</span>' +
                    '<span class="tile-desc">Administrá los procesos automáticos programados que el scheduler dispara cada minuto, y revisá el historial y el log en vivo de cada ejecución.</span>' +
                '</button>' +
                '<button type="button" class="tile-card" id="cfgTileSucesos">' +
                    '<span class="tile-icon">📰</span>' +
                    '<span class="tile-title">Visor de sucesos</span>' +
                    '<span class="tile-desc">Recorré el log de actividad que los distintos módulos van registrando al trabajar.</span>' +
                '</button>' +
            '</div>' +

            modalParametrosListaHtml() +
            modalParametroFormHtml() +
            ctxMenuParametrosHtml() +
            confirmParametroHtml() +
            modalExploradorS3Html() +
            confirmDeleteS3Html() +
            ctxMenuS3Html() +
            modalVisorSucesosHtml() +
            modalSucesoDetalleHtml() +
            modalMigradorListaHtml() +
            modalMigradorPreviewHtml() +
            confirmMigradorHtml() +
            modalExploradorDBHtml() +
            modalTareasListaHtml() +
            modalTareaFormHtml() +
            modalTareasEjecucionesHtml() +
            modalTareasTerminalHtml() +
            modalCronBuilderHtml() +
            modalCronPickerHtml() +
            ctxMenuTareasHtml() +
            ctxMenuEjecucionesHtml() +
            confirmTareasHtml();

        wireConfigView();
        wireExploradorS3View();
        wireVisorSucesosView();
        wireMigradorView();
        wireExploradorDBView();
        wireTareasView();
    }

    // ---------- Editor de parámetros (skill: crear_editor_de_parametros) ----
    //
    // La API expone las columnas de la tabla `parametros` como
    //   clave       ← variable
    //   valor       ← valor
    //   descripcion ← comentario
    // (la tabla conserva su esquema histórico; el mapeo lo hace parametros.php)

    var parametrosCache          = [];
    var parametrosFiltroQ        = '';
    var parametrosCtxRegistroId  = null;
    var _parametrosSearchTimer   = null;
    var parametrosPendingDeleteId = null;

    function modalParametrosListaHtml() {
        return '<div class="modal-backdrop" id="parametrosBackdrop">' +
            '<div class="modal" style="max-width:880px">' +
                '<div class="modal-header">' +
                    '<div class="modal-title" style="display:flex;align-items:center;gap:8px">' +
                        '<span style="font-size:1.2rem">🧩</span>' +
                        '<span>Editor de parámetros</span>' +
                    '</div>' +
                    '<button class="btn-icon-sm" data-act="close" type="button" aria-label="Cerrar">&times;</button>' +
                '</div>' +
                '<div class="modal-body" style="gap:12px">' +
                    '<div class="toolbar" style="margin-bottom:0">' +
                        '<div class="toolbar-left" style="gap:8px;flex-wrap:wrap">' +
                            '<div class="search-wrap">' +
                                '<input class="search-input" type="search" id="parametrosSearch" ' +
                                    'placeholder="🔍 Buscar clave, valor, descripción…">' +
                                '<button class="search-clear" id="parametrosSearchClear" type="button" style="display:none">&times;</button>' +
                            '</div>' +
                            '<button class="btn btn-ghost btn-sm" id="parametrosBtnRefrescar" type="button" title="Refrescar">' +
                                '<i class="fa-solid fa-rotate"></i>' +
                            '</button>' +
                        '</div>' +
                        '<div class="toolbar-right">' +
                            '<button class="btn btn-primary" id="parametrosBtnNuevo" type="button">+ Nuevo parámetro</button>' +
                        '</div>' +
                    '</div>' +
                    '<div class="table-card">' +
                        '<table>' +
                            '<thead><tr>' +
                                '<th style="width:80px">Código</th>' +
                                '<th style="width:220px">Clave</th>' +
                                '<th>Valor</th>' +
                                '<th>Descripción</th>' +
                                '<th style="width:60px;text-align:center">Acciones</th>' +
                            '</tr></thead>' +
                            '<tbody id="parametrosTbody">' +
                                '<tr><td colspan="5" style="text-align:center;padding:20px"><div class="spin"></div></td></tr>' +
                            '</tbody>' +
                        '</table>' +
                    '</div>' +
                '</div>' +
                '<div class="modal-footer">' +
                    '<button type="button" class="btn btn-ghost" data-act="close">Cerrar</button>' +
                '</div>' +
            '</div>' +
        '</div>';
    }

    function modalParametroFormHtml() {
        return '<div class="modal-backdrop" id="formParametroBackdrop">' +
            '<div class="modal" style="max-width:560px">' +
                '<div class="modal-header">' +
                    '<div class="modal-title" id="formParametroTitulo" style="display:flex;align-items:center;gap:8px">' +
                        '<span style="font-size:1.2rem">🧩</span><span>Nuevo parámetro</span>' +
                    '</div>' +
                    '<button class="btn-icon-sm" data-act="close" type="button" aria-label="Cerrar">&times;</button>' +
                '</div>' +
                '<form id="formParametro" novalidate>' +
                    '<input type="hidden" id="formParametroId" value="">' +
                    '<div class="modal-body">' +
                        '<div class="form-group">' +
                            '<label for="formParametroClave">Clave</label>' +
                            '<input type="text" id="formParametroClave" ' +
                                'placeholder="ej. smtp_host, moneda_default" ' +
                                'autocomplete="off" autocapitalize="none" spellcheck="false" ' +
                                'maxlength="120" style="font-family:monospace">' +
                            '<div class="field-error" id="formParametroClaveError" style="display:none"></div>' +
                        '</div>' +
                        '<div class="form-group">' +
                            '<label for="formParametroValor">Valor</label>' +
                            '<textarea id="formParametroValor" placeholder="Valor del parámetro…" ' +
                                'rows="3" maxlength="255" style="font-family:monospace"></textarea>' +
                            '<div class="field-error" id="formParametroValorError" style="display:none"></div>' +
                        '</div>' +
                        '<div class="form-group">' +
                            '<label for="formParametroDescripcion">' +
                                'Descripción <span style="font-weight:400;color:var(--muted)">— opcional</span>' +
                            '</label>' +
                            '<input type="text" id="formParametroDescripcion" ' +
                                'placeholder="Para qué se usa este parámetro" maxlength="1024">' +
                            '<div class="field-error" id="formParametroDescripcionError" style="display:none"></div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="modal-footer">' +
                        '<button type="button" class="btn btn-ghost" data-act="close">Cancelar</button>' +
                        '<button type="submit" class="btn btn-primary" id="btnGuardarParametro">Guardar</button>' +
                    '</div>' +
                '</form>' +
            '</div>' +
        '</div>';
    }

    function ctxMenuParametrosHtml() {
        return '<div id="parametrosCtxMenu" class="ctx-menu" role="menu">' +
            '<button type="button" data-action="editar" role="menuitem">' +
                '<i class="fa-solid fa-pen"></i><span>Editar</span></button>' +
            '<button type="button" data-action="copiar-clave" role="menuitem">' +
                '<i class="fa-solid fa-copy"></i><span>Copiar clave</span></button>' +
            '<div class="ctx-menu-sep"></div>' +
            '<button type="button" data-action="eliminar" class="ctx-menu-danger" role="menuitem">' +
                '<i class="fa-solid fa-trash"></i><span>Eliminar</span></button>' +
        '</div>';
    }

    function confirmParametroHtml() {
        return '<div class="confirm-backdrop" id="parametrosConfirm"><div class="confirm-box">' +
            '<div class="confirm-title">Eliminar parámetro</div>' +
            '<div class="confirm-msg" id="parametrosConfirmMsg">Esta acción no se puede deshacer.</div>' +
            '<div class="confirm-actions">' +
                '<button class="btn btn-ghost"  data-act="cancel" type="button">Cancelar</button>' +
                '<button class="btn btn-danger" id="parametrosConfirmBtn" type="button">Eliminar</button>' +
            '</div>' +
        '</div></div>';
    }

    // ---- Listado ----

    function abrirParametros() {
        var bd = document.getElementById('parametrosBackdrop');
        if (!bd) return;
        parametrosFiltroQ = '';
        var s = document.getElementById('parametrosSearch');
        if (s) s.value = '';
        var sc = document.getElementById('parametrosSearchClear');
        if (sc) sc.style.display = 'none';
        bd.classList.add('open');
        cargarParametros();
    }

    function cerrarParametros() {
        var bd = document.getElementById('parametrosBackdrop');
        if (bd) bd.classList.remove('open');
    }

    function parametrosOnSearch(v) {
        parametrosFiltroQ = v || '';
        var sc = document.getElementById('parametrosSearchClear');
        if (sc) sc.style.display = parametrosFiltroQ ? '' : 'none';
        if (_parametrosSearchTimer) clearTimeout(_parametrosSearchTimer);
        _parametrosSearchTimer = setTimeout(cargarParametros, 250);
    }

    function parametrosLimpiarBusqueda() {
        var i = document.getElementById('parametrosSearch');
        if (i) i.value = '';
        parametrosFiltroQ = '';
        var sc = document.getElementById('parametrosSearchClear');
        if (sc) sc.style.display = 'none';
        cargarParametros();
    }

    async function cargarParametros() {
        var tbody = document.getElementById('parametrosTbody');
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px"><div class="spin"></div></td></tr>';
        var qs = new URLSearchParams();
        if (parametrosFiltroQ) qs.set('q', parametrosFiltroQ);
        qs.set('limite', '500');
        try {
            var d = await api('/api/parametros.php' + (qs.toString() ? ('?' + qs.toString()) : ''));
            parametrosCache = d.data || [];
            renderParametros(parametrosCache);
        } catch (err) {
            tbody.innerHTML = '<tr><td colspan="5" class="table-empty">✗ ' + e(err.message) + '</td></tr>';
        }
    }

    function renderParametros(rows) {
        var tbody = document.getElementById('parametrosTbody');
        if (!tbody) return;
        if (!rows || rows.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="table-empty">Sin parámetros para mostrar.</td></tr>';
            return;
        }
        tbody.innerHTML = rows.map(function (p) {
            var descr = p.descripcion == null ? '' : String(p.descripcion);
            return '<tr class="row-clickable" data-id="' + p.id + '" style="cursor:pointer">' +
                '<td class="td-id">#' + p.id + '</td>' +
                '<td style="font-family:monospace;font-weight:600">' + e(p.clave || '') + '</td>' +
                '<td style="font-family:monospace;color:var(--muted);max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" ' +
                    'title="' + e(p.valor || '') + '">' + e(p.valor || '') + '</td>' +
                '<td style="font-size:.82rem;color:var(--muted)">' + e(descr) + '</td>' +
                '<td style="text-align:center">' +
                    '<div class="actions" style="justify-content:center">' +
                        '<button class="btn-icon-sm" data-menu-parametro="' + p.id + '" ' +
                            'onclick="event.stopPropagation()" title="Más acciones">' +
                            '<i class="fa-solid fa-bars"></i></button>' +
                    '</div>' +
                '</td>' +
            '</tr>';
        }).join('');
    }

    // ---- Form ----

    function limpiarErroresFormParametro() {
        ['Clave', 'Valor', 'Descripcion'].forEach(function (f) {
            var inp = document.getElementById('formParametro' + f);
            var err = document.getElementById('formParametro' + f + 'Error');
            if (inp) inp.classList.remove('input-invalid');
            if (err) { err.style.display = 'none'; err.textContent = ''; }
        });
    }

    function mostrarErrorParametro(campo, msg) {
        var inp = document.getElementById('formParametro' + campo);
        var err = document.getElementById('formParametro' + campo + 'Error');
        if (inp) inp.classList.add('input-invalid');
        if (err) { err.textContent = msg; err.style.display = ''; }
        if (inp) inp.focus();
    }

    function abrirNuevoParametro() {
        limpiarErroresFormParametro();
        document.getElementById('formParametroId').value = '';
        document.getElementById('formParametroClave').value = '';
        document.getElementById('formParametroValor').value = '';
        document.getElementById('formParametroDescripcion').value = '';
        var tit = document.getElementById('formParametroTitulo');
        if (tit) tit.innerHTML = '<span style="font-size:1.2rem">🧩</span><span>Nuevo parámetro</span>';
        document.getElementById('formParametroBackdrop').classList.add('open');
        setTimeout(function () { document.getElementById('formParametroClave').focus(); }, 50);
    }

    function abrirEditarParametro(id) {
        var p = parametrosCache.find(function (x) { return x.id === id; });
        if (!p) return;
        limpiarErroresFormParametro();
        document.getElementById('formParametroId').value = String(p.id);
        document.getElementById('formParametroClave').value = p.clave || '';
        document.getElementById('formParametroValor').value = p.valor || '';
        document.getElementById('formParametroDescripcion').value = p.descripcion || '';
        var tit = document.getElementById('formParametroTitulo');
        if (tit) tit.innerHTML = '<span style="font-size:1.2rem">🧩</span><span>Editar parámetro <span style="color:var(--muted);font-weight:400">#' + p.id + '</span></span>';
        document.getElementById('formParametroBackdrop').classList.add('open');
        setTimeout(function () { document.getElementById('formParametroValor').focus(); }, 50);
    }

    async function guardarParametro(ev) {
        if (ev) ev.preventDefault();
        limpiarErroresFormParametro();
        var idStr       = document.getElementById('formParametroId').value;
        var clave       = document.getElementById('formParametroClave').value.trim();
        var valor       = document.getElementById('formParametroValor').value;
        var descripcion = document.getElementById('formParametroDescripcion').value.trim();

        if (!clave)                            { mostrarErrorParametro('Clave', 'La clave es obligatoria.'); return; }
        if (!/^[A-Za-z0-9_.\-]+$/.test(clave)) { mostrarErrorParametro('Clave', 'Sólo letras, números, punto, guión y guión bajo.'); return; }
        if (clave.length > 120)                { mostrarErrorParametro('Clave', 'Máximo 120 caracteres.'); return; }
        if (valor.length > 255)                { mostrarErrorParametro('Valor', 'Máximo 255 caracteres.'); return; }
        if (descripcion.length > 1024)         { mostrarErrorParametro('Descripcion', 'Máximo 1024 caracteres.'); return; }

        var btn = document.getElementById('btnGuardarParametro');
        if (btn) btn.disabled = true;
        try {
            var payload = { clave: clave, valor: valor, descripcion: descripcion };
            if (idStr) {
                payload.id = parseInt(idStr, 10);
                await api('/api/parametros.php', { method: 'PUT', body: payload });
                toast('Parámetro actualizado.');
            } else {
                await api('/api/parametros.php', { method: 'POST', body: payload });
                toast('Parámetro creado.');
            }
            document.getElementById('formParametroBackdrop').classList.remove('open');
            await cargarParametros();
        } catch (err) {
            var msg = (err && err.message) ? err.message : 'Error al guardar.';
            if (/clave/i.test(msg)) mostrarErrorParametro('Clave', msg);
            else                    toast(msg, { error: true });
        } finally {
            if (btn) btn.disabled = false;
        }
    }

    function eliminarParametro(id) {
        var p = parametrosCache.find(function (x) { return x.id === id; });
        if (!p) return;
        var msg = document.getElementById('parametrosConfirmMsg');
        if (msg) msg.innerHTML = 'Vas a eliminar el parámetro <strong>' + e(p.clave) + '</strong>. Esta acción no se puede deshacer.';
        parametrosPendingDeleteId = id;
        var box = document.getElementById('parametrosConfirm');
        if (box) box.classList.add('open');
    }

    async function confirmarEliminarParametro() {
        var id = parametrosPendingDeleteId;
        if (!id) return;
        var btn = document.getElementById('parametrosConfirmBtn');
        if (btn) btn.disabled = true;
        try {
            await api('/api/parametros.php?id=' + id, { method: 'DELETE' });
            toast('Parámetro eliminado.');
            document.getElementById('parametrosConfirm').classList.remove('open');
            parametrosPendingDeleteId = null;
            await cargarParametros();
        } catch (err) {
            toast(err.message || 'Error al eliminar.', { error: true });
        } finally {
            if (btn) btn.disabled = false;
        }
    }

    // ---- Ctx-menu parámetros ----

    function abrirMenuContextoParametros(ev, id) {
        var m = document.getElementById('parametrosCtxMenu');
        if (!m) return;
        parametrosCtxRegistroId = id;
        var x, y;
        if (ev && typeof ev.clientX === 'number' && ev.clientX > 0) {
            x = ev.clientX; y = ev.clientY;
        } else if (ev && ev.currentTarget && ev.currentTarget.getBoundingClientRect) {
            var r = ev.currentTarget.getBoundingClientRect();
            x = r.left; y = r.bottom;
        } else {
            x = 100; y = 100;
        }
        m.style.left = x + 'px';
        m.style.top  = y + 'px';
        m.classList.add('open');
        setTimeout(function () {
            var rr = m.getBoundingClientRect();
            if (rr.right  > window.innerWidth)  m.style.left = (window.innerWidth  - rr.width  - 8) + 'px';
            if (rr.bottom > window.innerHeight) m.style.top  = (window.innerHeight - rr.height - 8) + 'px';
        }, 0);
    }

    function cerrarMenuContextoParametros() {
        var m = document.getElementById('parametrosCtxMenu');
        if (m) m.classList.remove('open');
        parametrosCtxRegistroId = null;
    }

    // ---- Wire ----

    function wireConfigView() {
        var tile = document.getElementById('cfgTileParametros');
        if (tile) tile.addEventListener('click', abrirParametros);

        var listBd = document.getElementById('parametrosBackdrop');
        if (listBd) {
            listBd.addEventListener('click', function (ev) {
                if (ev.target === listBd || ev.target.closest('[data-act="close"]')) cerrarParametros();
            });
        }

        var s = document.getElementById('parametrosSearch');
        if (s) s.addEventListener('input', function () { parametrosOnSearch(s.value); });
        var sc = document.getElementById('parametrosSearchClear');
        if (sc) sc.addEventListener('click', parametrosLimpiarBusqueda);
        var btnRef = document.getElementById('parametrosBtnRefrescar');
        if (btnRef) btnRef.addEventListener('click', cargarParametros);
        var btnNue = document.getElementById('parametrosBtnNuevo');
        if (btnNue) btnNue.addEventListener('click', abrirNuevoParametro);

        var tbody = document.getElementById('parametrosTbody');
        if (tbody) {
            tbody.addEventListener('click', function (ev) {
                var btn = ev.target.closest('[data-menu-parametro]');
                if (btn) {
                    var idM = parseInt(btn.getAttribute('data-menu-parametro'), 10);
                    abrirMenuContextoParametros(ev, idM);
                    return;
                }
                var tr = ev.target.closest('tr[data-id]');
                if (tr) abrirEditarParametro(parseInt(tr.getAttribute('data-id'), 10));
            });
            tbody.addEventListener('contextmenu', function (ev) {
                var tr = ev.target.closest('tr[data-id]');
                if (!tr) return;
                ev.preventDefault();
                abrirMenuContextoParametros(ev, parseInt(tr.getAttribute('data-id'), 10));
            });
        }

        var ctx = document.getElementById('parametrosCtxMenu');
        if (ctx) {
            ctx.addEventListener('click', function (ev) {
                var btn = ev.target.closest('button[data-action]');
                if (!btn) return;
                var act = btn.getAttribute('data-action');
                var id  = parametrosCtxRegistroId;
                cerrarMenuContextoParametros();
                if (!id) return;
                if (act === 'editar')       abrirEditarParametro(id);
                else if (act === 'eliminar') eliminarParametro(id);
                else if (act === 'copiar-clave') {
                    var p = parametrosCache.find(function (x) { return x.id === id; });
                    if (p && navigator.clipboard) {
                        navigator.clipboard.writeText(p.clave).then(
                            function () { toast('Clave copiada.'); },
                            function () { toast('No se pudo copiar.', { error: true }); }
                        );
                    }
                }
            });
        }

        var formBd = document.getElementById('formParametroBackdrop');
        if (formBd) {
            formBd.addEventListener('click', function (ev) {
                if (ev.target === formBd || ev.target.closest('[data-act="close"]')) formBd.classList.remove('open');
            });
        }
        var form = document.getElementById('formParametro');
        if (form) form.addEventListener('submit', guardarParametro);

        var conf   = document.getElementById('parametrosConfirm');
        var btnDel = document.getElementById('parametrosConfirmBtn');
        if (conf) {
            conf.addEventListener('click', function (ev) {
                if (ev.target === conf || ev.target.closest('[data-act="cancel"]')) {
                    conf.classList.remove('open');
                    parametrosPendingDeleteId = null;
                }
            });
        }
        if (btnDel) btnDel.addEventListener('click', confirmarEliminarParametro);

        if (!wireConfigView._globalBound) {
            wireConfigView._globalBound = true;
            document.addEventListener('click', function (ev) {
                var m = document.getElementById('parametrosCtxMenu');
                if (m && m.classList.contains('open') && !m.contains(ev.target)) {
                    cerrarMenuContextoParametros();
                }
            }, true);
            window.addEventListener('scroll', cerrarMenuContextoParametros, true);
            window.addEventListener('resize', cerrarMenuContextoParametros);
            document.addEventListener('keydown', function (ev) {
                if (ev.key !== 'Escape') return;
                var mm = document.getElementById('parametrosCtxMenu');
                if (mm && mm.classList.contains('open')) {
                    cerrarMenuContextoParametros();
                    ev.stopImmediatePropagation();
                }
            });
        }
    }

    // -------- Vista: Explorador S3 (Herramientas) -------------------------

    var s3ExpPrefix      = '';
    var s3ExpNextToken   = null;
    var s3ExpBucket      = '';
    var s3ExpCargando    = false;
    var s3ExpCtxKey      = null;
    var s3ExpCtxIsFolder = false;
    var s3ExpCtxUrl      = '';
    var s3ExpUltimaLista = { folders: [], objects: [] };
    var s3ExpPendingDeleteKey      = null;
    var s3ExpPendingDeleteIsFolder = false;

    function modalExploradorS3Html() {
        return '<div class="modal-backdrop" id="s3ExpModalBackdrop">' +
            '<div class="modal s3-exp-modal">' +
                '<div class="modal-header">' +
                    '<div class="modal-title" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">' +
                        '<span style="font-size:1.2rem">☁️</span>' +
                        '<span>Explorador S3</span>' +
                        '<span class="badge badge-info" id="s3ExpBucket" style="font-family:monospace">—</span>' +
                    '</div>' +
                    '<button class="btn-icon-sm" data-act="close" type="button" aria-label="Cerrar">&times;</button>' +
                '</div>' +
                '<div class="modal-body" style="gap:12px">' +
                    '<div class="s3-exp-toolbar">' +
                        '<div class="s3-exp-breadcrumbs" id="s3ExpBreadcrumbs"></div>' +
                        '<div class="s3-exp-toolbar-right">' +
                            '<button class="btn-icon" type="button" title="Refrescar" id="s3ExpBtnRefrescar">' +
                                '<i class="fa-solid fa-rotate"></i>' +
                            '</button>' +
                            '<input type="file" id="s3ExpUploadInput" style="display:none">' +
                            '<button class="btn btn-secondary btn-sm" type="button" id="s3ExpBtnSubir">' +
                                '<i class="fa-solid fa-upload"></i> Subir' +
                            '</button>' +
                            '<button class="btn btn-secondary btn-sm" type="button" id="s3ExpBtnNuevaCarpeta">' +
                                '<i class="fa-solid fa-folder-plus"></i> Nueva carpeta' +
                            '</button>' +
                        '</div>' +
                    '</div>' +
                    '<div class="table-card s3-exp-table-card">' +
                        '<table>' +
                            '<thead><tr>' +
                                '<th style="width:36px"></th>' +
                                '<th>Nombre</th>' +
                                '<th style="width:120px">Tamaño</th>' +
                                '<th style="width:160px">Modificado</th>' +
                                '<th style="width:60px; text-align:center">Acciones</th>' +
                            '</tr></thead>' +
                            '<tbody id="s3ExpTbody">' +
                                '<tr><td colspan="5" style="text-align:center;padding:24px"><div class="spin"></div></td></tr>' +
                            '</tbody>' +
                        '</table>' +
                    '</div>' +
                    '<div class="s3-exp-footer-info" id="s3ExpFooterInfo"></div>' +
                    '<div style="text-align:center">' +
                        '<button class="btn btn-ghost btn-sm" id="s3ExpBtnMas" style="display:none" type="button">Cargar más</button>' +
                    '</div>' +
                '</div>' +
                '<div class="modal-footer">' +
                    '<button type="button" class="btn btn-ghost" data-act="close">Cerrar</button>' +
                '</div>' +
            '</div>' +
        '</div>';
    }

    function ctxMenuS3Html() {
        return '<div id="s3ExpCtxMenu" class="ctx-menu" role="menu">' +
            '<button type="button" data-action="abrir" role="menuitem">' +
                '<i class="fa-solid fa-up-right-from-square"></i><span>Abrir / Descargar</span>' +
            '</button>' +
            '<button type="button" data-action="copiar-url" role="menuitem">' +
                '<i class="fa-solid fa-link"></i><span>Copiar URL pública</span>' +
            '</button>' +
            '<div class="ctx-menu-sep"></div>' +
            '<button type="button" data-action="eliminar" role="menuitem" class="ctx-menu-danger">' +
                '<i class="fa-solid fa-trash"></i><span>Eliminar</span>' +
            '</button>' +
        '</div>';
    }

    function confirmDeleteS3Html() {
        return '<div class="confirm-backdrop" id="s3ExpConfirm"><div class="confirm-box">' +
            '<div class="confirm-title" id="s3ExpConfirmTitle">Eliminar</div>' +
            '<div class="confirm-msg" id="s3ExpConfirmMsg">Esta acción no se puede deshacer.</div>' +
            '<div class="confirm-actions">' +
                '<button class="btn btn-ghost"  data-act="cancel" type="button">Cancelar</button>' +
                '<button class="btn btn-danger" id="s3ExpConfirmBtn" type="button">Eliminar</button>' +
            '</div>' +
        '</div></div>';
    }

    function s3ExpEsImagen(nombre) {
        return /\.(jpe?g|png|gif|webp|bmp|svg|avif)$/i.test(nombre || '');
    }

    function s3ExpIconoArchivo(nombre) {
        var ext = String(nombre || '').toLowerCase().split('.').pop();
        var map = {
            pdf: 'fa-file-pdf',
            doc: 'fa-file-word',  docx: 'fa-file-word',
            xls: 'fa-file-excel', xlsx: 'fa-file-excel', csv: 'fa-file-csv',
            ppt: 'fa-file-powerpoint', pptx: 'fa-file-powerpoint',
            zip: 'fa-file-zipper', rar: 'fa-file-zipper', '7z': 'fa-file-zipper', tar: 'fa-file-zipper', gz: 'fa-file-zipper',
            mp3: 'fa-file-audio', wav: 'fa-file-audio', ogg: 'fa-file-audio', m4a: 'fa-file-audio',
            mp4: 'fa-file-video', mov: 'fa-file-video', avi: 'fa-file-video', mkv: 'fa-file-video', webm: 'fa-file-video',
            txt: 'fa-file-lines', md: 'fa-file-lines', log: 'fa-file-lines',
            json: 'fa-file-code', xml: 'fa-file-code', html: 'fa-file-code', css: 'fa-file-code', js: 'fa-file-code',
            jpg: 'fa-file-image', jpeg: 'fa-file-image', png: 'fa-file-image', gif: 'fa-file-image',
            webp: 'fa-file-image', bmp: 'fa-file-image', svg: 'fa-file-image', avif: 'fa-file-image'
        };
        return map[ext] || 'fa-file';
    }

    function s3ExpFormatBytes(b) {
        if (b == null) return '—';
        var n = parseInt(b, 10);
        if (!(n >= 0)) return '—';
        if (n < 1024) return n + ' B';
        if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
        if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' MB';
        return (n / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
    }

    function s3ExpFormatFecha(iso) {
        if (!iso) return '—';
        var d = new Date(iso);
        if (isNaN(d.getTime())) return '—';
        var pad = function (n) { return String(n).padStart(2, '0'); };
        return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
            ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
    }

    function s3ExpNombreRelativo(key, prefix) {
        if (prefix && key.indexOf(prefix) === 0) return key.substring(prefix.length);
        return key;
    }

    function s3ExpEscAttr(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (ch) {
            return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[ch];
        });
    }

    function abrirExploradorS3() {
        s3ExpPrefix    = '';
        s3ExpNextToken = null;
        s3ExpUltimaLista = { folders: [], objects: [] };
        var bd = document.getElementById('s3ExpModalBackdrop');
        if (!bd) return;
        bd.classList.add('open');
        s3ExpCargar(true);
    }

    function cerrarExploradorS3() {
        var bd = document.getElementById('s3ExpModalBackdrop');
        if (bd) bd.classList.remove('open');
        s3ExpCerrarCtx();
    }

    function s3ExpRecargar() {
        s3ExpNextToken = null;
        s3ExpUltimaLista = { folders: [], objects: [] };
        s3ExpCargar(true);
    }

    function s3ExpNavegar(prefix) {
        s3ExpPrefix    = prefix || '';
        s3ExpNextToken = null;
        s3ExpUltimaLista = { folders: [], objects: [] };
        s3ExpCargar(true);
    }

    async function s3ExpCargar(reiniciar) {
        if (s3ExpCargando) return;
        s3ExpCargando = true;
        var tbody     = document.getElementById('s3ExpTbody');
        var btnMas    = document.getElementById('s3ExpBtnMas');
        var info      = document.getElementById('s3ExpFooterInfo');
        var bucketEl  = document.getElementById('s3ExpBucket');

        if (reiniciar) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:24px"><div class="spin"></div></td></tr>';
            info.textContent  = '';
            if (btnMas) btnMas.style.display = 'none';
        }

        var qs = '?prefix=' + encodeURIComponent(s3ExpPrefix);
        if (!reiniciar && s3ExpNextToken) qs += '&token=' + encodeURIComponent(s3ExpNextToken);

        try {
            var data = await api('/api/herramientas_s3_list.php' + qs);
            s3ExpBucket = data.bucket || '';
            if (bucketEl) bucketEl.textContent = s3ExpBucket || '—';

            if (reiniciar) {
                s3ExpUltimaLista = { folders: data.folders || [], objects: data.objects || [] };
            } else {
                s3ExpUltimaLista.folders = s3ExpUltimaLista.folders.concat(data.folders || []);
                s3ExpUltimaLista.objects = s3ExpUltimaLista.objects.concat(data.objects || []);
            }
            s3ExpNextToken = data.next_token || null;

            s3ExpRenderBreadcrumbs(s3ExpPrefix);
            s3ExpRenderTabla(s3ExpPrefix);

            if (btnMas) {
                if (data.truncated && s3ExpNextToken) {
                    btnMas.style.display = '';
                    btnMas.disabled = false;
                    btnMas.textContent = 'Cargar más';
                } else {
                    btnMas.style.display = 'none';
                }
            }
        } catch (err) {
            tbody.innerHTML = '<tr><td colspan="5" class="s3-exp-empty">' + e(err.message) + '</td></tr>';
            info.textContent = '';
        } finally {
            s3ExpCargando = false;
        }
    }

    function s3ExpCargarMas() {
        var btnMas = document.getElementById('s3ExpBtnMas');
        if (btnMas) { btnMas.disabled = true; btnMas.textContent = 'Cargando…'; }
        s3ExpCargar(false);
    }

    function s3ExpRenderBreadcrumbs(prefix) {
        var container = document.getElementById('s3ExpBreadcrumbs');
        if (!container) return;
        var parts = (prefix || '').split('/').filter(function (s) { return s !== ''; });
        var html = '';
        if (parts.length === 0) {
            html += '<button type="button" class="s3-exp-crumb current" data-prefix="">🏠 raíz</button>';
        } else {
            html += '<button type="button" class="s3-exp-crumb" data-prefix="">🏠 raíz</button>';
            var acc = '';
            for (var i = 0; i < parts.length; i++) {
                acc += parts[i] + '/';
                var isLast = (i === parts.length - 1);
                html += '<span class="s3-exp-crumb-sep">/</span>';
                html += '<button type="button" class="s3-exp-crumb' + (isLast ? ' current' : '') + '" data-prefix="' + s3ExpEscAttr(acc) + '">' + e(parts[i]) + '</button>';
            }
        }
        container.innerHTML = html;
        container.querySelectorAll('.s3-exp-crumb').forEach(function (btn) {
            btn.addEventListener('click', function () {
                if (btn.classList.contains('current')) return;
                s3ExpNavegar(btn.getAttribute('data-prefix') || '');
            });
        });
    }

    function s3ExpRenderTabla(prefix) {
        var tbody = document.getElementById('s3ExpTbody');
        var info  = document.getElementById('s3ExpFooterInfo');
        if (!tbody) return;

        var folders = s3ExpUltimaLista.folders || [];
        var objects = s3ExpUltimaLista.objects || [];

        var rows = '';

        // Fila ".." para subir de nivel
        if (prefix && prefix !== '') {
            var parent = prefix.replace(/\/$/, '');
            var slash  = parent.lastIndexOf('/');
            var parentPrefix = slash === -1 ? '' : (parent.substring(0, slash + 1));
            rows += '<tr class="row-clickable" data-act-row="navegar" data-prefix="' + s3ExpEscAttr(parentPrefix) + '">' +
                '<td><span class="s3-exp-icon"><i class="fa-solid fa-turn-up" style="transform:rotate(-90deg)"></i></span></td>' +
                '<td><div class="s3-exp-nombre">..</div></td>' +
                '<td class="s3-exp-size">—</td>' +
                '<td class="s3-exp-date">—</td>' +
                '<td></td>' +
            '</tr>';
        }

        // Carpetas
        folders.forEach(function (f) {
            var rel = s3ExpNombreRelativo(f.key, prefix);
            rows += '<tr class="row-clickable" data-act-row="navegar" data-prefix="' + s3ExpEscAttr(f.key) + '">' +
                '<td><span class="s3-exp-icon"><i class="fa-solid fa-folder" style="color:var(--warn)"></i></span></td>' +
                '<td><div class="s3-exp-nombre">' + e(rel) + '</div></td>' +
                '<td class="s3-exp-size">—</td>' +
                '<td class="s3-exp-date">—</td>' +
                '<td style="text-align:center">' +
                    '<button class="btn-icon-sm" type="button" data-act="ctx" data-key="' + s3ExpEscAttr(f.key) + '" data-folder="1" data-url="" title="Acciones">' +
                        '<i class="fa-solid fa-bars"></i>' +
                    '</button>' +
                '</td>' +
            '</tr>';
        });

        // Archivos
        objects.forEach(function (o) {
            var rel = s3ExpNombreRelativo(o.key, prefix);
            var iconCell;
            if (s3ExpEsImagen(rel)) {
                iconCell = '<img class="s3-exp-thumb" loading="lazy" src="' + s3ExpEscAttr(o.url) + '" ' +
                    'onerror="this.outerHTML=\'<span class=\\\'s3-exp-icon\\\'><i class=\\\'fa-solid fa-file-image\\\'></i></span>\'">';
            } else {
                iconCell = '<span class="s3-exp-icon"><i class="fa-solid ' + s3ExpIconoArchivo(rel) + '"></i></span>';
            }
            rows += '<tr class="row-clickable" data-act-row="abrir" data-url="' + s3ExpEscAttr(o.url) + '" data-key="' + s3ExpEscAttr(o.key) + '">' +
                '<td>' + iconCell + '</td>' +
                '<td><div class="s3-exp-nombre">' + e(rel) + '</div></td>' +
                '<td class="s3-exp-size">' + e(s3ExpFormatBytes(o.size)) + '</td>' +
                '<td class="s3-exp-date">' + e(s3ExpFormatFecha(o.last_modified)) + '</td>' +
                '<td style="text-align:center">' +
                    '<button class="btn-icon-sm" type="button" data-act="ctx" data-key="' + s3ExpEscAttr(o.key) + '" data-folder="0" data-url="' + s3ExpEscAttr(o.url) + '" title="Acciones">' +
                        '<i class="fa-solid fa-bars"></i>' +
                    '</button>' +
                '</td>' +
            '</tr>';
        });

        if (folders.length === 0 && objects.length === 0 && !prefix) {
            rows = '<tr><td colspan="5" class="s3-exp-empty">Esta carpeta está vacía.</td></tr>';
            if (info) info.textContent = '0 elementos';
        } else if (folders.length === 0 && objects.length === 0) {
            rows += '<tr><td colspan="5" class="s3-exp-empty">Esta carpeta está vacía.</td></tr>';
        }

        tbody.innerHTML = rows;

        if (info) {
            var totalBytes = objects.reduce(function (a, o) { return a + (parseInt(o.size, 10) || 0); }, 0);
            info.innerHTML =
                '<span>' + folders.length + ' carpeta' + (folders.length === 1 ? '' : 's') +
                ' · ' + objects.length + ' archivo' + (objects.length === 1 ? '' : 's') +
                ' · ' + e(s3ExpFormatBytes(totalBytes)) + ' en esta carpeta</span>' +
                '<span>' + e(s3ExpPrefix || '/') + '</span>';
        }
    }

    function s3ExpAbrirCtx(ev, key, esCarpeta, url) {
        ev.preventDefault();
        ev.stopPropagation();
        s3ExpCtxKey      = key;
        s3ExpCtxIsFolder = !!esCarpeta;
        s3ExpCtxUrl      = url || '';

        var menu = document.getElementById('s3ExpCtxMenu');
        if (!menu) return;
        // Ocultar abrir/copiar-url para carpetas
        menu.querySelectorAll('button[data-action]').forEach(function (b) {
            var a = b.getAttribute('data-action');
            if (esCarpeta && (a === 'abrir' || a === 'copiar-url')) {
                b.style.display = 'none';
            } else {
                b.style.display = '';
            }
        });

        menu.classList.add('open');
        // Posicionar
        var x = ev.clientX || 0;
        var y = ev.clientY || 0;
        menu.style.left = '0px';
        menu.style.top  = '0px';
        var rect = menu.getBoundingClientRect();
        var vw   = window.innerWidth;
        var vh   = window.innerHeight;
        if (x + rect.width  > vw) x = Math.max(0, vw - rect.width  - 8);
        if (y + rect.height > vh) y = Math.max(0, vh - rect.height - 8);
        menu.style.left = x + 'px';
        menu.style.top  = y + 'px';
    }

    function s3ExpCerrarCtx() {
        var menu = document.getElementById('s3ExpCtxMenu');
        if (menu) menu.classList.remove('open');
    }

    function s3ExpAbrirArchivo(url) {
        if (!url) return;
        window.open(url, '_blank', 'noopener');
    }

    function s3ExpCopiarUrlPublica(url) {
        if (!url) return;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(url).then(function () {
                toast('URL copiada al portapapeles.');
            }, function () {
                window.prompt('URL del archivo:', url);
            });
        } else {
            window.prompt('URL del archivo:', url);
        }
    }

    function s3ExpEliminar(key, esCarpeta) {
        s3ExpPendingDeleteKey      = key;
        s3ExpPendingDeleteIsFolder = !!esCarpeta;

        var titleEl = document.getElementById('s3ExpConfirmTitle');
        var msgEl   = document.getElementById('s3ExpConfirmMsg');
        var conf    = document.getElementById('s3ExpConfirm');

        if (esCarpeta) {
            titleEl.textContent = 'Eliminar carpeta';
            msgEl.textContent = "Vas a eliminar la carpeta '" + key + "' y TODO su contenido de forma recursiva. Esta acción no se puede deshacer.";
        } else {
            titleEl.textContent = 'Eliminar archivo';
            msgEl.textContent = "¿Eliminar '" + key + "'? Esta acción no se puede deshacer.";
        }
        conf.classList.add('open');
    }

    async function s3ExpEjecutarEliminacion() {
        if (!s3ExpPendingDeleteKey) return;
        var btn  = document.getElementById('s3ExpConfirmBtn');
        var conf = document.getElementById('s3ExpConfirm');
        btn.disabled = true;
        try {
            await api('/api/herramientas_s3_delete.php', {
                method: 'POST',
                body: { key: s3ExpPendingDeleteKey, recursivo: s3ExpPendingDeleteIsFolder }
            });
            toast('Eliminado.');
            conf.classList.remove('open');
            s3ExpPendingDeleteKey      = null;
            s3ExpPendingDeleteIsFolder = false;
            s3ExpRecargar();
        } catch (err) {
            toast(err.message, true);
        } finally {
            btn.disabled = false;
        }
    }

    async function s3ExpSubirArchivo(fileList) {
        if (!fileList || fileList.length === 0) return;
        var file = fileList[0];
        if (file.size > 20 * 1024 * 1024) {
            toast('El archivo supera el límite de 20 MB.', true);
            return;
        }
        toast('Subiendo ' + file.name + '…');
        var fd = new FormData();
        fd.append('archivo', file);
        fd.append('prefix',  s3ExpPrefix);
        fd.append('nombre',  file.name);
        try {
            await api('/api/herramientas_s3_upload.php', {
                method: 'POST',
                body:   fd
            });
            toast('Archivo subido.');
            s3ExpRecargar();
        } catch (err) {
            toast(err.message, true);
        }
        // Permitir resubir el mismo archivo
        var input = document.getElementById('s3ExpUploadInput');
        if (input) input.value = '';
    }

    async function s3ExpCrearCarpeta() {
        var nombre = window.prompt('Nombre de la nueva carpeta:');
        if (nombre == null) return;
        nombre = String(nombre).trim();
        if (nombre === '') return;
        try {
            await api('/api/herramientas_s3_create_folder.php', {
                method: 'POST',
                body:   { prefix: s3ExpPrefix, nombre: nombre }
            });
            toast('Carpeta creada.');
            s3ExpRecargar();
        } catch (err) {
            toast(err.message, true);
        }
    }

    function wireExploradorS3View() {
        var bd       = document.getElementById('s3ExpModalBackdrop');
        var tbody    = document.getElementById('s3ExpTbody');
        var btnRef   = document.getElementById('s3ExpBtnRefrescar');
        var btnMas   = document.getElementById('s3ExpBtnMas');
        var btnSubir = document.getElementById('s3ExpBtnSubir');
        var btnNueva = document.getElementById('s3ExpBtnNuevaCarpeta');
        var input    = document.getElementById('s3ExpUploadInput');
        var menu     = document.getElementById('s3ExpCtxMenu');
        var conf     = document.getElementById('s3ExpConfirm');
        var btnDel   = document.getElementById('s3ExpConfirmBtn');

        var tile = document.getElementById('cfgTileS3Exp');
        if (tile) tile.addEventListener('click', abrirExploradorS3);

        if (bd) {
            bd.addEventListener('click', function (ev) {
                if (ev.target === bd || ev.target.closest('[data-act="close"]')) {
                    cerrarExploradorS3();
                }
            });
        }

        if (btnRef)   btnRef.addEventListener('click',   s3ExpRecargar);
        if (btnMas)   btnMas.addEventListener('click',   s3ExpCargarMas);
        if (btnNueva) btnNueva.addEventListener('click', s3ExpCrearCarpeta);
        if (btnSubir && input) {
            btnSubir.addEventListener('click', function () { input.click(); });
            input.addEventListener('change', function () { s3ExpSubirArchivo(input.files); });
        }

        if (tbody) {
            tbody.addEventListener('click', function (ev) {
                var btn = ev.target.closest('button[data-act="ctx"]');
                if (btn) {
                    s3ExpAbrirCtx(
                        ev,
                        btn.getAttribute('data-key'),
                        btn.getAttribute('data-folder') === '1',
                        btn.getAttribute('data-url') || ''
                    );
                    return;
                }
                var tr = ev.target.closest('tr[data-act-row]');
                if (!tr) return;
                var act = tr.getAttribute('data-act-row');
                if (act === 'navegar') {
                    s3ExpNavegar(tr.getAttribute('data-prefix') || '');
                } else if (act === 'abrir') {
                    s3ExpAbrirArchivo(tr.getAttribute('data-url') || '');
                }
            });
            tbody.addEventListener('contextmenu', function (ev) {
                var tr = ev.target.closest('tr[data-act-row]');
                if (!tr) return;
                var btn = tr.querySelector('button[data-act="ctx"]');
                if (!btn) return;
                s3ExpAbrirCtx(
                    ev,
                    btn.getAttribute('data-key'),
                    btn.getAttribute('data-folder') === '1',
                    btn.getAttribute('data-url') || ''
                );
            });
        }

        if (menu) {
            menu.addEventListener('click', function (ev) {
                var btn = ev.target.closest('button[data-action]');
                if (!btn) return;
                var action   = btn.getAttribute('data-action');
                var key      = s3ExpCtxKey;
                var isFolder = s3ExpCtxIsFolder;
                var url      = s3ExpCtxUrl;
                s3ExpCerrarCtx();
                if (!key) return;
                if      (action === 'abrir')      s3ExpAbrirArchivo(url);
                else if (action === 'copiar-url') s3ExpCopiarUrlPublica(url);
                else if (action === 'eliminar')   s3ExpEliminar(key, isFolder);
            });
        }

        if (conf) {
            conf.addEventListener('click', function (ev) {
                if (ev.target === conf || ev.target.closest('[data-act="cancel"]')) {
                    conf.classList.remove('open');
                    s3ExpPendingDeleteKey      = null;
                    s3ExpPendingDeleteIsFolder = false;
                }
            });
        }
        if (btnDel) btnDel.addEventListener('click', s3ExpEjecutarEliminacion);
    }

    // Listeners globales del menú contextual S3 (se montan una sola vez).
    document.addEventListener('click', function (e) {
        var menu = document.getElementById('s3ExpCtxMenu');
        if (menu && menu.classList.contains('open') && !menu.contains(e.target)) {
            s3ExpCerrarCtx();
        }
    });
    document.addEventListener('scroll', function () { s3ExpCerrarCtx(); }, true);
    window.addEventListener('resize',   function () { s3ExpCerrarCtx(); });
    document.addEventListener('keydown', function (ev) {
        if (ev.key !== 'Escape') return;
        var ctx = document.getElementById('s3ExpCtxMenu');
        if (ctx && ctx.classList.contains('open')) { s3ExpCerrarCtx(); return; }
        var bd = document.getElementById('s3ExpModalBackdrop');
        if (bd && bd.classList.contains('open')) { cerrarExploradorS3(); }
    });

    // -------- Vista: Visor de sucesos (Herramientas) ----------------------

    var sucesosCache        = [];
    var sucesosFiltroQ      = '';
    var sucesosFiltroTipo   = '';
    var _sucesosSearchTimer = null;

    var SUCESOS_TIPOS = {
        info:   { label: 'Info',   icon: 'fa-circle-info',          color: 'var(--info)'   },
        alerta: { label: 'Alerta', icon: 'fa-triangle-exclamation', color: 'var(--warn)'   },
        error:  { label: 'Error',  icon: 'fa-circle-exclamation',   color: 'var(--danger)' }
    };

    function sucesoTipoHtml(tipo) {
        var meta = SUCESOS_TIPOS[tipo] || SUCESOS_TIPOS.info;
        return '<span style="display:inline-flex;align-items:center;gap:6px">' +
                    '<i class="fa-solid ' + meta.icon + '" style="color:' + meta.color + '"></i>' +
                    '<span>' + meta.label + '</span>' +
               '</span>';
    }

    function modalVisorSucesosHtml() {
        return '<div class="modal-backdrop" id="sucesosBackdrop">' +
            '<div class="modal" style="max-width:1100px">' +
                '<div class="modal-header">' +
                    '<div class="modal-title" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">' +
                        '<span style="font-size:1.2rem">📰</span>' +
                        '<span>Visor de sucesos</span>' +
                        '<span id="sucesosResumen" class="modal-subtitle"></span>' +
                    '</div>' +
                    '<button class="btn-icon-sm" type="button" data-act="close" aria-label="Cerrar">&times;</button>' +
                '</div>' +
                '<div class="modal-body" style="gap:12px">' +
                    '<div class="toolbar" style="margin-bottom:0">' +
                        '<div class="toolbar-left" style="gap:8px;flex-wrap:wrap">' +
                            '<div class="search-wrap">' +
                                '<input class="search-input" type="search" id="sucesosSearch" placeholder="🔍 Buscar origen, detalle…">' +
                                '<button class="search-clear" id="sucesosSearchClear" type="button" style="display:none">&times;</button>' +
                            '</div>' +
                            '<div id="sucesosTipoChips" style="display:flex;gap:6px;flex-wrap:wrap">' +
                                '<button type="button" class="filter-chip active" data-val="">Todos</button>' +
                                '<button type="button" class="filter-chip" data-val="info"><i class="fa-solid fa-circle-info" style="color:var(--info)"></i> Info</button>' +
                                '<button type="button" class="filter-chip" data-val="alerta"><i class="fa-solid fa-triangle-exclamation" style="color:var(--warn)"></i> Alerta</button>' +
                                '<button type="button" class="filter-chip" data-val="error"><i class="fa-solid fa-circle-exclamation" style="color:var(--danger)"></i> Error</button>' +
                            '</div>' +
                            '<label style="display:flex;align-items:center;gap:6px;font-size:.82rem;color:var(--muted)">Desde <input type="date" id="sucesosDesde"></label>' +
                            '<label style="display:flex;align-items:center;gap:6px;font-size:.82rem;color:var(--muted)">Hasta <input type="date" id="sucesosHasta"></label>' +
                            '<label style="display:flex;align-items:center;gap:6px;font-size:.82rem;color:var(--muted)">Límite ' +
                                '<select id="sucesosLimite">' +
                                    '<option value="100">100</option>' +
                                    '<option value="200" selected>200</option>' +
                                    '<option value="500">500</option>' +
                                    '<option value="1000">1.000</option>' +
                                    '<option value="2000">2.000</option>' +
                                '</select>' +
                            '</label>' +
                            '<button class="btn btn-ghost btn-icon" type="button" id="sucesosBtnRefrescar" title="Refrescar"><i class="fa-solid fa-rotate"></i></button>' +
                        '</div>' +
                    '</div>' +
                    '<div class="table-card">' +
                        '<table>' +
                            '<thead><tr>' +
                                '<th style="width:80px">ID</th>' +
                                '<th style="width:170px">Fecha</th>' +
                                '<th style="width:180px">Origen</th>' +
                                '<th style="width:120px">Tipo</th>' +
                                '<th>Detalle</th>' +
                            '</tr></thead>' +
                            '<tbody id="sucesosTbody">' +
                                '<tr><td colspan="5" style="text-align:center;padding:20px"><div class="spin"></div></td></tr>' +
                            '</tbody>' +
                        '</table>' +
                    '</div>' +
                    '<div style="font-size:.78rem;color:var(--muted);line-height:1.5">' +
                        'Vista de solo lectura sobre la tabla <code style="font-family:monospace">sucesos_log</code>. ' +
                        'Los registros se ordenan por <strong>id descendente</strong> (más recientes primero). ' +
                        'Tocá una fila para ver el detalle completo.' +
                    '</div>' +
                '</div>' +
                '<div class="modal-footer">' +
                    '<button type="button" class="btn btn-ghost" data-act="close">Cerrar</button>' +
                '</div>' +
            '</div>' +
        '</div>';
    }

    function modalSucesoDetalleHtml() {
        return '<div class="modal-backdrop" id="sucesoDetalleBackdrop">' +
            '<div class="modal" style="max-width:780px">' +
                '<div class="modal-header">' +
                    '<div class="modal-title" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">' +
                        '<span style="font-size:1.2rem">📰</span>' +
                        '<span>Suceso</span>' +
                        '<span class="modal-subtitle">#<span id="sucesoDetalleId">—</span></span>' +
                    '</div>' +
                    '<button class="btn-icon-sm" type="button" data-act="close" aria-label="Cerrar">&times;</button>' +
                '</div>' +
                '<div class="modal-body">' +
                    '<div class="form-row">' +
                        '<div class="form-group">' +
                            '<label>Fecha</label>' +
                            '<div id="sucesoDetalleFecha" style="font-family:monospace">—</div>' +
                        '</div>' +
                        '<div class="form-group">' +
                            '<label>Tipo</label>' +
                            '<div id="sucesoDetalleTipo" style="display:flex;align-items:center;gap:6px">—</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="form-group">' +
                        '<label>Origen</label>' +
                        '<div id="sucesoDetalleOrigen" style="font-family:monospace">—</div>' +
                    '</div>' +
                    '<div class="form-group">' +
                        '<label>Detalle</label>' +
                        '<textarea id="sucesoDetalleTexto" readonly spellcheck="false" autocomplete="off" style="min-height:260px;font-family:monospace"></textarea>' +
                    '</div>' +
                '</div>' +
                '<div class="modal-footer">' +
                    '<button type="button" class="btn btn-ghost" data-act="close">Cerrar</button>' +
                '</div>' +
            '</div>' +
        '</div>';
    }

    function abrirVisorSucesos() {
        var bd = document.getElementById('sucesosBackdrop');
        if (!bd) return;
        sucesosFiltroQ    = '';
        sucesosFiltroTipo = '';
        var search = document.getElementById('sucesosSearch');
        if (search) search.value = '';
        var clear = document.getElementById('sucesosSearchClear');
        if (clear) clear.style.display = 'none';
        bd.classList.add('open');
        cargarSucesos();
    }

    function cerrarVisorSucesos() {
        var bd = document.getElementById('sucesosBackdrop');
        if (bd) bd.classList.remove('open');
    }

    function cerrarSucesoDetalle() {
        var bd = document.getElementById('sucesoDetalleBackdrop');
        if (bd) bd.classList.remove('open');
    }

    function sucesosOnSearch(v) {
        sucesosFiltroQ = v || '';
        var clear = document.getElementById('sucesosSearchClear');
        if (clear) clear.style.display = sucesosFiltroQ ? '' : 'none';
        if (_sucesosSearchTimer) clearTimeout(_sucesosSearchTimer);
        _sucesosSearchTimer = setTimeout(cargarSucesos, 250);
    }

    function sucesosLimpiarBusqueda() {
        var input = document.getElementById('sucesosSearch');
        if (input) input.value = '';
        sucesosFiltroQ = '';
        var clear = document.getElementById('sucesosSearchClear');
        if (clear) clear.style.display = 'none';
        cargarSucesos();
    }

    function setFiltroTipoSucesos(chip, valor) {
        sucesosFiltroTipo = valor || '';
        var chips = document.querySelectorAll('#sucesosTipoChips .filter-chip');
        for (var i = 0; i < chips.length; i++) {
            chips[i].classList.toggle('active', chips[i] === chip);
        }
        cargarSucesos();
    }

    async function cargarSucesos() {
        var tbody = document.getElementById('sucesosTbody');
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px"><div class="spin"></div></td></tr>';

        var desdeEl  = document.getElementById('sucesosDesde');
        var hastaEl  = document.getElementById('sucesosHasta');
        var limiteEl = document.getElementById('sucesosLimite');
        var desde  = desdeEl  ? desdeEl.value  : '';
        var hasta  = hastaEl  ? hastaEl.value  : '';
        var limite = limiteEl ? limiteEl.value : '200';

        var qs = new URLSearchParams();
        if (sucesosFiltroQ)    qs.set('q', sucesosFiltroQ);
        if (sucesosFiltroTipo) qs.set('tipo', sucesosFiltroTipo);
        if (desde)             qs.set('desde', desde);
        if (hasta)             qs.set('hasta', hasta);
        qs.set('limite', limite);

        try {
            var data = await api('/api/sucesos_log.php?' + qs.toString());
            sucesosCache = data.items || [];
            var resumen = document.getElementById('sucesosResumen');
            if (resumen && data.stats) {
                var m = data.stats.mostrados == null ? sucesosCache.length : data.stats.mostrados;
                var t = data.stats.total     == null ? m                    : data.stats.total;
                resumen.textContent = m.toLocaleString('es-AR') + ' de ' + t.toLocaleString('es-AR') + ' registros';
            }
            renderSucesos(sucesosCache);
        } catch (err) {
            tbody.innerHTML = '<tr><td colspan="5" class="table-empty">✗ ' + e(err.message) + '</td></tr>';
        }
    }

    function renderSucesos(rows) {
        var tbody = document.getElementById('sucesosTbody');
        if (!tbody) return;
        if (!rows.length) {
            tbody.innerHTML = '<tr><td colspan="5" class="table-empty">Sin sucesos para mostrar.</td></tr>';
            return;
        }
        var dashVacio = '<span style="color:var(--muted);font-style:italic">—</span>';
        tbody.innerHTML = rows.map(function (s) {
            var fecha   = e(s.fecha   || '');
            var origen  = e(s.origen  || '');
            var detalle = e(s.detalle || '');
            return '<tr class="row-clickable" data-id="' + s.id + '" style="cursor:pointer">' +
                '<td class="td-id">#' + s.id + '</td>' +
                '<td style="font-family:monospace;white-space:nowrap">' + (fecha  || dashVacio) + '</td>' +
                '<td style="font-family:monospace;font-weight:600">' + (origen || dashVacio) + '</td>' +
                '<td>' + sucesoTipoHtml(s.tipo) + '</td>' +
                '<td style="color:var(--muted);max-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="' + detalle + '">' + detalle + '</td>' +
            '</tr>';
        }).join('');
    }

    function sucesosVerDetalle(id) {
        var s = null;
        for (var i = 0; i < sucesosCache.length; i++) {
            if (sucesosCache[i].id === id) { s = sucesosCache[i]; break; }
        }
        if (!s) return;
        document.getElementById('sucesoDetalleId').textContent     = s.id;
        document.getElementById('sucesoDetalleFecha').textContent  = s.fecha  || '—';
        document.getElementById('sucesoDetalleOrigen').textContent = s.origen || '—';
        document.getElementById('sucesoDetalleTipo').innerHTML     = sucesoTipoHtml(s.tipo);
        document.getElementById('sucesoDetalleTexto').value        = s.detalle || '';
        var bd = document.getElementById('sucesoDetalleBackdrop');
        if (bd) bd.classList.add('open');
    }

    function wireVisorSucesosView() {
        var tile = document.getElementById('cfgTileSucesos');
        if (tile) tile.addEventListener('click', abrirVisorSucesos);

        var listBd = document.getElementById('sucesosBackdrop');
        if (listBd) {
            listBd.addEventListener('click', function (ev) {
                if (ev.target === listBd || ev.target.closest('[data-act="close"]')) {
                    cerrarVisorSucesos();
                }
            });
        }

        var detBd = document.getElementById('sucesoDetalleBackdrop');
        if (detBd) {
            detBd.addEventListener('click', function (ev) {
                if (ev.target === detBd || ev.target.closest('[data-act="close"]')) {
                    cerrarSucesoDetalle();
                }
            });
        }

        var searchInput = document.getElementById('sucesosSearch');
        if (searchInput) {
            searchInput.addEventListener('input', function () { sucesosOnSearch(searchInput.value); });
        }
        var searchClear = document.getElementById('sucesosSearchClear');
        if (searchClear) searchClear.addEventListener('click', sucesosLimpiarBusqueda);

        var chips = document.querySelectorAll('#sucesosTipoChips .filter-chip');
        for (var i = 0; i < chips.length; i++) {
            (function (chip) {
                chip.addEventListener('click', function () {
                    setFiltroTipoSucesos(chip, chip.getAttribute('data-val') || '');
                });
            })(chips[i]);
        }

        var desdeEl  = document.getElementById('sucesosDesde');
        var hastaEl  = document.getElementById('sucesosHasta');
        var limiteEl = document.getElementById('sucesosLimite');
        if (desdeEl)  desdeEl.addEventListener('change',  cargarSucesos);
        if (hastaEl)  hastaEl.addEventListener('change',  cargarSucesos);
        if (limiteEl) limiteEl.addEventListener('change', cargarSucesos);

        var btnRef = document.getElementById('sucesosBtnRefrescar');
        if (btnRef) btnRef.addEventListener('click', cargarSucesos);

        var tbody = document.getElementById('sucesosTbody');
        if (tbody) {
            tbody.addEventListener('click', function (ev) {
                var tr = ev.target.closest('tr[data-id]');
                if (!tr) return;
                var id = parseInt(tr.getAttribute('data-id'), 10);
                if (id) sucesosVerDetalle(id);
            });
        }

        if (!wireVisorSucesosView._escBound) {
            wireVisorSucesosView._escBound = true;
            document.addEventListener('keydown', function (ev) {
                if (ev.key !== 'Escape') return;
                var det = document.getElementById('sucesoDetalleBackdrop');
                if (det && det.classList.contains('open')) {
                    det.classList.remove('open');
                    ev.stopImmediatePropagation();
                }
            }, true);
        }
    }

    // -------- Vista: Migrador DB (Herramientas) ---------------------------

    var migracionesCache        = [];
    var migrPreviewNombreActual = '';
    var migrEnvActual           = '';
    var migrDbActual            = '';
    var _migrCargando           = false;
    var _migrAplicando          = false;
    var _migrConfirmResolve     = null;

    function modalMigradorListaHtml() {
        return '<div class="modal-backdrop" id="migracionesBackdrop">' +
            '<div class="modal" style="max-width:960px">' +
                '<div class="modal-header">' +
                    '<div class="modal-title" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">' +
                        '<span style="font-size:1.2rem">📜</span>' +
                        '<span>Migrador DB</span>' +
                        '<span class="badge badge-info" id="migrDbName" style="font-family:monospace">—</span>' +
                        '<span class="badge" id="migrEnvBadge" style="font-family:monospace">—</span>' +
                    '</div>' +
                    '<button class="btn-icon-sm" type="button" data-act="close" aria-label="Cerrar">&times;</button>' +
                '</div>' +
                '<div class="modal-body" style="gap:12px">' +
                    '<div class="toolbar" style="margin-bottom:0">' +
                        '<div class="toolbar-left" style="gap:8px;flex-wrap:wrap">' +
                            '<button class="btn btn-ghost btn-sm" type="button" title="Refrescar" id="migrBtnRefrescar">Refrescar</button>' +
                            '<span id="migrResumen" style="font-size:.82rem;color:var(--muted)"></span>' +
                        '</div>' +
                        '<div class="toolbar-right">' +
                            '<button class="btn btn-primary" id="migrBtnAplicarPendientes" type="button" disabled>Aplicar todas las pendientes</button>' +
                        '</div>' +
                    '</div>' +

                    '<div class="table-card" style="max-height:52vh;overflow-y:auto">' +
                        '<table>' +
                            '<thead>' +
                                '<tr>' +
                                    '<th style="width:110px;position:sticky;top:0;background:var(--bg);z-index:1">Estado</th>' +
                                    '<th style="position:sticky;top:0;background:var(--bg);z-index:1">Archivo</th>' +
                                    '<th style="width:90px;position:sticky;top:0;background:var(--bg);z-index:1">Tamaño</th>' +
                                    '<th style="width:110px;position:sticky;top:0;background:var(--bg);z-index:1">Hash</th>' +
                                    '<th style="width:160px;position:sticky;top:0;background:var(--bg);z-index:1">Aplicada</th>' +
                                    '<th style="width:180px;text-align:center;position:sticky;top:0;background:var(--bg);z-index:1">Acciones</th>' +
                                '</tr>' +
                            '</thead>' +
                            '<tbody id="migrTbody">' +
                                '<tr><td colspan="6" style="text-align:center;padding:20px"><div class="spin"></div></td></tr>' +
                            '</tbody>' +
                        '</table>' +
                    '</div>' +

                    '<div style="font-size:.78rem;color:var(--muted);line-height:1.5">' +
                        'Los archivos viven en <code style="font-family:monospace">db/migrations/</code> ' +
                        'y se aplican en orden alfabético. Cada migración se registra en la tabla ' +
                        '<code style="font-family:monospace">migraciones</code> de la BD del entorno actual ' +
                        'para no re-ejecutarse. <strong>El target es siempre la BD del propio panel.</strong>' +
                    '</div>' +
                '</div>' +
                '<div class="modal-footer">' +
                    '<button class="btn btn-ghost" type="button" data-act="close">Cerrar</button>' +
                '</div>' +
            '</div>' +
        '</div>';
    }

    function modalMigradorPreviewHtml() {
        return '<div class="modal-backdrop" id="migrPreviewBackdrop">' +
            '<div class="modal modal-wide">' +
                '<div class="modal-header">' +
                    '<div class="modal-title" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">' +
                        '<span style="font-size:1.2rem">📜</span>' +
                        '<span>Migración</span>' +
                        '<span class="modal-subtitle"><code id="migrPreviewNombre" style="font-family:monospace">—</code></span>' +
                    '</div>' +
                    '<button class="btn-icon-sm" type="button" data-act="close" aria-label="Cerrar">&times;</button>' +
                '</div>' +
                '<div class="modal-body">' +
                    '<div class="form-group">' +
                        '<label>Contenido SQL (solo lectura)</label>' +
                        '<textarea class="json-editor" id="migrPreviewSql" readonly spellcheck="false" autocomplete="off"></textarea>' +
                    '</div>' +
                '</div>' +
                '<div class="modal-footer">' +
                    '<button class="btn btn-ghost" type="button" data-act="close">Cerrar</button>' +
                    '<button class="btn btn-primary" id="migrPreviewBtnAplicar" type="button">Aplicar</button>' +
                '</div>' +
            '</div>' +
        '</div>';
    }

    function confirmMigradorHtml() {
        return '<div class="confirm-backdrop" id="migrConfirm"><div class="confirm-box">' +
            '<div class="confirm-title" id="migrConfirmTitle">Aplicar migración</div>' +
            '<div class="confirm-msg" id="migrConfirmMsg">Esta acción no se puede deshacer.</div>' +
            '<div class="confirm-actions">' +
                '<button class="btn btn-ghost"  type="button" data-act="cancel">Cancelar</button>' +
                '<button class="btn btn-primary" id="migrConfirmBtn" type="button">Aplicar</button>' +
            '</div>' +
        '</div></div>';
    }

    function migrConfirmar(opts) {
        opts = opts || {};
        return new Promise(function (resolve) {
            var box     = document.getElementById('migrConfirm');
            var titleEl = document.getElementById('migrConfirmTitle');
            var msgEl   = document.getElementById('migrConfirmMsg');
            var btnOk   = document.getElementById('migrConfirmBtn');
            if (!box || !titleEl || !msgEl || !btnOk) { resolve(false); return; }

            titleEl.textContent = opts.title || 'Confirmar';
            msgEl.textContent   = opts.message || '¿Continuar?';
            btnOk.textContent   = opts.confirmText || 'Aplicar';
            btnOk.classList.remove('btn-primary', 'btn-danger');
            btnOk.classList.add(opts.danger ? 'btn-danger' : 'btn-primary');

            _migrConfirmResolve = function (val) {
                box.classList.remove('open');
                _migrConfirmResolve = null;
                resolve(val);
            };
            box.classList.add('open');
        });
    }

    function migrFormatearTamanoBytes(n) {
        if (typeof n !== 'number' || isNaN(n)) return '—';
        if (n < 1024)          return n + ' B';
        if (n < 1024 * 1024)   return (n / 1024).toFixed(1) + ' KB';
        return (n / (1024 * 1024)).toFixed(1) + ' MB';
    }

    function abrirMigraciones() {
        var bd = document.getElementById('migracionesBackdrop');
        if (!bd) return;
        bd.classList.add('open');
        cargarMigraciones();
    }

    function cerrarMigraciones() {
        var bd = document.getElementById('migracionesBackdrop');
        if (bd) bd.classList.remove('open');
    }

    async function cargarMigraciones() {
        if (_migrCargando) return;
        _migrCargando = true;
        var tbody     = document.getElementById('migrTbody');
        var dbEl      = document.getElementById('migrDbName');
        var envEl     = document.getElementById('migrEnvBadge');
        var resumenEl = document.getElementById('migrResumen');
        var btnMasivo = document.getElementById('migrBtnAplicarPendientes');

        if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px"><div class="spin"></div></td></tr>';
        if (resumenEl) resumenEl.textContent = '';
        if (btnMasivo) { btnMasivo.disabled = true; btnMasivo.textContent = 'Aplicar todas las pendientes'; }

        try {
            var data = await api('/api/herramientas_migraciones_list.php');
            migracionesCache = data.items || [];
            migrDbActual  = data.database || '';
            migrEnvActual = (data.env || '').toLowerCase();

            if (dbEl)  dbEl.textContent  = migrDbActual || '—';
            if (envEl) {
                envEl.textContent = migrEnvActual || '—';
                envEl.classList.remove('badge-info', 'badge-success', 'badge-warn', 'badge-danger');
                if (migrEnvActual === 'production')       envEl.classList.add('badge-danger');
                else if (migrEnvActual === 'development') envEl.classList.add('badge-success');
                else                                      envEl.classList.add('badge-warn');
            }

            renderMigraciones(migracionesCache);
            actualizarResumenMigraciones();
        } catch (err) {
            if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--danger)">' + e(err.message || 'Error al cargar migraciones.') + '</td></tr>';
        } finally {
            _migrCargando = false;
        }
    }

    function renderMigraciones(rows) {
        var tbody = document.getElementById('migrTbody');
        if (!tbody) return;
        if (!rows || rows.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="table-empty">No hay archivos en <code>db/migrations/</code>.</td></tr>';
            return;
        }

        var pendientes = rows.filter(function (m) { return m.estado === 'pendiente'; });
        var aplicadas  = rows.filter(function (m) { return m.estado === 'aplicada'; })
                             .sort(function (a, b) { return (b.id || 0) - (a.id || 0); });
        var ordenadas  = pendientes.concat(aplicadas);

        tbody.innerHTML = ordenadas.map(function (m) {
            var badge;
            if (m.estado === 'aplicada' && m.hash_drift) {
                badge = '<span class="badge badge-warn" title="El archivo cambió después de aplicarse">⚠ drift</span>';
            } else if (m.estado === 'aplicada') {
                badge = '<span class="badge badge-success">aplicada</span>';
            } else {
                badge = '<span class="badge badge-info">pendiente</span>';
            }

            var aplicadaTxt = m.aplicada
                ? '<span style="font-family:monospace;font-size:.82rem">' + e(m.aplicada) + '</span>'
                : '<span style="color:var(--muted)">—</span>';

            var hashCorto = m.hash ? String(m.hash).slice(0, 8) : '—';
            var acciones = '<div class="actions" style="justify-content:center">' +
                '<button class="btn btn-ghost btn-sm" type="button" data-act="ver" data-nombre="' + e(m.nombre) + '">Ver SQL</button>';
            if (m.estado === 'pendiente') {
                acciones += '<button class="btn btn-primary btn-sm" type="button" data-act="aplicar" data-nombre="' + e(m.nombre) + '">Aplicar</button>';
            }
            acciones += '</div>';

            return '<tr>' +
                '<td>' + badge + '</td>' +
                '<td style="font-family:monospace;font-weight:600;word-break:break-all">' + e(m.nombre) + '</td>' +
                '<td style="font-size:.82rem;color:var(--muted)">' + migrFormatearTamanoBytes(m.tamano) + '</td>' +
                '<td style="font-family:monospace;font-size:.78rem;color:var(--muted)" title="' + e(m.hash || '') + '">' + e(hashCorto) + '</td>' +
                '<td>' + aplicadaTxt + '</td>' +
                '<td style="text-align:center">' + acciones + '</td>' +
            '</tr>';
        }).join('');
    }

    function actualizarResumenMigraciones() {
        var resumenEl = document.getElementById('migrResumen');
        var btnMasivo = document.getElementById('migrBtnAplicarPendientes');
        if (!resumenEl || !btnMasivo) return;

        var total       = migracionesCache.length;
        var aplicadas   = migracionesCache.filter(function (m) { return m.estado === 'aplicada'; }).length;
        var pendientes  = total - aplicadas;
        var conDrift    = migracionesCache.filter(function (m) { return m.hash_drift; }).length;

        var txt = total + ' archivo(s) · ' + aplicadas + ' aplicada(s) · ' + pendientes + ' pendiente(s)';
        if (conDrift > 0) txt += ' · ⚠ ' + conDrift + ' con drift de hash';
        resumenEl.textContent = txt;

        if (pendientes === 0) {
            btnMasivo.disabled    = true;
            btnMasivo.textContent = 'Sin pendientes';
        } else {
            btnMasivo.disabled    = _migrAplicando;
            btnMasivo.textContent = 'Aplicar ' + pendientes + ' pendiente(s)';
        }
    }

    async function verMigracion(nombre) {
        var bd = document.getElementById('migrPreviewBackdrop');
        var nombreEl = document.getElementById('migrPreviewNombre');
        var sqlEl    = document.getElementById('migrPreviewSql');
        var btnApl   = document.getElementById('migrPreviewBtnAplicar');
        if (!bd || !nombreEl || !sqlEl || !btnApl) return;

        migrPreviewNombreActual = nombre;
        nombreEl.textContent = nombre;
        sqlEl.value = 'Cargando…';
        btnApl.style.display = 'none';
        bd.classList.add('open');

        try {
            var data = await api('/api/herramientas_migraciones_get.php?nombre=' + encodeURIComponent(nombre));
            sqlEl.value = data.contenido || '';
            var item = migracionesCache.find(function (m) { return m.nombre === nombre; });
            btnApl.style.display = (item && item.estado === 'pendiente') ? '' : 'none';
        } catch (err) {
            sqlEl.value = 'Error: ' + (err.message || 'No se pudo leer la migración.');
        }
    }

    function migrPreviewAplicar() {
        var bd = document.getElementById('migrPreviewBackdrop');
        if (bd) bd.classList.remove('open');
        if (migrPreviewNombreActual) {
            aplicarMigracionConConfirmacion(migrPreviewNombreActual);
        }
    }

    function aplicarMigracionDesdeListado(nombre) {
        aplicarMigracionConConfirmacion(nombre);
    }

    async function aplicarMigracionConConfirmacion(nombre) {
        var esProd = migrEnvActual === 'production';
        var dbTxt  = migrDbActual || 'la base actual';
        var msg = 'Vas a aplicar «' + nombre + '» contra la base ' + dbTxt +
                  (esProd ? ' (PRODUCCIÓN)' : '') +
                  '. Las sentencias DDL no se pueden deshacer. ¿Continuar?';
        var ok = await migrConfirmar({
            title:       esProd ? '⚠ Aplicar en PRODUCCIÓN' : 'Aplicar migración',
            message:     msg,
            confirmText: esProd ? 'Aplicar en prod' : 'Aplicar',
            danger:      esProd
        });
        if (!ok) return;
        await aplicarMigracionSinConfirmar(nombre);
    }

    async function aplicarMigracionSinConfirmar(nombre) {
        if (_migrAplicando) return;
        _migrAplicando = true;
        try {
            var data = await api('/api/herramientas_migraciones_apply.php', {
                method: 'POST',
                body:   { nombre: nombre }
            });
            var ms = data && typeof data.duracion_ms === 'number' ? data.duracion_ms : null;
            toast('Aplicada «' + nombre + '»' + (ms !== null ? ' en ' + ms + ' ms.' : '.'));
            await cargarMigraciones();
        } catch (err) {
            toast(err.message || 'Error al aplicar.', { error: true, duration: 10000 });
        } finally {
            _migrAplicando = false;
        }
    }

    async function aplicarPendientesMigraciones() {
        var pendientes = migracionesCache.filter(function (m) { return m.estado === 'pendiente'; });
        if (pendientes.length === 0) return;

        var esProd = migrEnvActual === 'production';
        var dbTxt  = migrDbActual || 'la base actual';
        var msg = 'Vas a aplicar ' + pendientes.length + ' migración(es) contra la base ' + dbTxt +
                  (esProd ? ' (PRODUCCIÓN)' : '') +
                  ' en orden alfabético. Si una falla, se detiene la corrida y las anteriores quedan aplicadas. ¿Continuar?';
        var ok = await migrConfirmar({
            title:       esProd ? '⚠ Aplicar en PRODUCCIÓN' : 'Aplicar migraciones',
            message:     msg,
            confirmText: esProd ? 'Aplicar en prod' : 'Aplicar',
            danger:      esProd
        });
        if (!ok) return;

        var btn = document.getElementById('migrBtnAplicarPendientes');
        if (btn) btn.disabled = true;
        _migrAplicando = true;

        var aplicadas = 0;
        var falloCorte = false;

        for (var i = 0; i < pendientes.length; i++) {
            var nombre = pendientes[i].nombre;
            if (btn) btn.textContent = 'Aplicando ' + nombre + '…';
            try {
                await api('/api/herramientas_migraciones_apply.php', {
                    method: 'POST',
                    body:   { nombre: nombre }
                });
                aplicadas++;
            } catch (err) {
                toast('Falló «' + nombre + '»: ' + (err.message || 'error desconocido.'), { error: true, duration: 10000 });
                falloCorte = true;
                break;
            }
        }

        _migrAplicando = false;
        if (falloCorte) {
            toast('Corrida parcial: ' + aplicadas + ' de ' + pendientes.length + ' aplicadas.', { error: true, duration: 10000 });
        } else if (aplicadas > 0) {
            toast('Aplicadas ' + aplicadas + ' migración(es).');
        }
        await cargarMigraciones();
    }

    function wireMigradorView() {
        var tile = document.getElementById('cfgTileMigrador');
        if (tile) tile.addEventListener('click', abrirMigraciones);

        var listBd = document.getElementById('migracionesBackdrop');
        if (listBd) {
            listBd.addEventListener('click', function (ev) {
                if (ev.target === listBd || ev.target.closest('[data-act="close"]')) {
                    cerrarMigraciones();
                }
            });
        }

        var btnRef = document.getElementById('migrBtnRefrescar');
        if (btnRef) btnRef.addEventListener('click', cargarMigraciones);

        var btnMas = document.getElementById('migrBtnAplicarPendientes');
        if (btnMas) btnMas.addEventListener('click', aplicarPendientesMigraciones);

        var tbody = document.getElementById('migrTbody');
        if (tbody) {
            tbody.addEventListener('click', function (ev) {
                var btn = ev.target.closest('button[data-act]');
                if (!btn) return;
                var act = btn.getAttribute('data-act');
                var nombre = btn.getAttribute('data-nombre') || '';
                if (!nombre) return;
                if (act === 'ver')      verMigracion(nombre);
                if (act === 'aplicar')  aplicarMigracionDesdeListado(nombre);
            });
        }

        var prevBd = document.getElementById('migrPreviewBackdrop');
        if (prevBd) {
            prevBd.addEventListener('click', function (ev) {
                if (ev.target === prevBd || ev.target.closest('[data-act="close"]')) {
                    prevBd.classList.remove('open');
                }
            });
        }
        var btnPrevApl = document.getElementById('migrPreviewBtnAplicar');
        if (btnPrevApl) btnPrevApl.addEventListener('click', migrPreviewAplicar);

        var confBox = document.getElementById('migrConfirm');
        if (confBox) {
            confBox.addEventListener('click', function (ev) {
                var cancel = ev.target.closest('[data-act="cancel"]');
                if (cancel && _migrConfirmResolve) { _migrConfirmResolve(false); return; }
                if (ev.target === confBox && _migrConfirmResolve) { _migrConfirmResolve(false); }
            });
            var btnOk = document.getElementById('migrConfirmBtn');
            if (btnOk) btnOk.addEventListener('click', function () {
                if (_migrConfirmResolve) _migrConfirmResolve(true);
            });
        }

        if (!wireMigradorView._escBound) {
            wireMigradorView._escBound = true;
            document.addEventListener('keydown', function (ev) {
                if (ev.key !== 'Escape') return;
                var conf = document.getElementById('migrConfirm');
                if (conf && conf.classList.contains('open')) {
                    if (_migrConfirmResolve) _migrConfirmResolve(false);
                    ev.stopImmediatePropagation();
                    return;
                }
                var prev = document.getElementById('migrPreviewBackdrop');
                if (prev && prev.classList.contains('open')) {
                    prev.classList.remove('open');
                    ev.stopImmediatePropagation();
                    return;
                }
                var listado = document.getElementById('migracionesBackdrop');
                if (listado && listado.classList.contains('open')) {
                    cerrarMigraciones();
                    ev.stopImmediatePropagation();
                }
            }, true);
        }
    }

    // -------- Vista: Explorador DB (Herramientas) -------------------------

    var dbExpTablas       = [];
    var dbExpFiltro       = '';
    var dbExpTablaActual  = null;
    var dbExpDbName       = '';
    var dbExpEnv          = '';
    var dbExpCargando     = false;

    var dbExpRegistros    = [];
    var dbExpPkCols       = [];
    var dbExpAutoIncCols  = [];
    var dbExpNullableCols = [];
    var dbExpColsTabla    = [];
    var dbExpRegsTotal    = 0;
    var dbExpLimite       = 50;
    var dbExpFiltroRegs   = '';

    function modalExploradorDBHtml() {
        return '<div class="modal-backdrop" id="dbExpModalBackdrop">' +
            '<div class="modal db-exp-modal">' +
                '<div class="modal-header">' +
                    '<div class="modal-title" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">' +
                        '<span style="font-size:1.2rem">🗄️</span>' +
                        '<span>Explorador DB</span>' +
                        '<span class="badge badge-info" id="dbExpDbName" style="font-family:monospace">—</span>' +
                        '<span class="badge" id="dbExpEnvBadge" style="font-family:monospace">—</span>' +
                    '</div>' +
                    '<button class="btn-icon-sm" type="button" data-act="close" aria-label="Cerrar">&times;</button>' +
                '</div>' +
                '<div class="modal-body">' +
                    '<div class="db-exp-toolbar">' +
                        '<div class="db-exp-breadcrumbs" id="dbExpBreadcrumbs"></div>' +
                        '<div class="db-exp-toolbar-right">' +
                            '<button class="btn btn-ghost btn-icon" type="button" title="Refrescar" id="dbExpBtnRefrescar">' +
                                '<i class="fa-solid fa-rotate"></i>' +
                            '</button>' +
                            '<div class="search-wrap" id="dbExpSearchWrap" style="display:none">' +
                                '<input type="search" id="dbExpSearch" class="search-input" placeholder="Buscar tabla…">' +
                                '<button class="search-clear" type="button" id="dbExpSearchClear">&times;</button>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +

                    '<div class="db-exp-view" id="dbExpViewTables">' +
                        '<div class="table-card db-exp-table-card">' +
                            '<table>' +
                                '<thead><tr>' +
                                    '<th style="width:36px"></th>' +
                                    '<th>Tabla</th>' +
                                    '<th style="width:140px">Filas (aprox.)</th>' +
                                    '<th style="width:120px">Engine</th>' +
                                '</tr></thead>' +
                                '<tbody id="dbExpTablesTbody">' +
                                    '<tr><td colspan="4" style="text-align:center;padding:24px"><div class="spin"></div></td></tr>' +
                                '</tbody>' +
                            '</table>' +
                        '</div>' +
                        '<div class="db-exp-footer-info" id="dbExpTablesInfo"></div>' +
                    '</div>' +

                    '<div class="db-exp-view db-exp-view-detail" id="dbExpViewDetail" style="display:none">' +
                        '<div class="db-exp-tabs" role="tablist">' +
                            '<button type="button" class="db-exp-tab active" role="tab" data-tab="recs">' +
                                '<i class="fa-solid fa-table"></i> Registros' +
                                '<span class="db-exp-tab-count" id="dbExpRecsMeta"></span>' +
                            '</button>' +
                            '<button type="button" class="db-exp-tab" role="tab" data-tab="cols">' +
                                '<i class="fa-solid fa-list-ul"></i> Campos' +
                                '<span class="db-exp-tab-count" id="dbExpColsMeta"></span>' +
                            '</button>' +
                        '</div>' +

                        '<div class="db-exp-tabpanel" id="dbExpTabRecs" role="tabpanel">' +
                            '<div class="db-exp-recs-toolbar">' +
                                '<div class="db-exp-recs-toolbar-left">' +
                                    '<label class="db-exp-limite-label">Límite ' +
                                        '<select id="dbExpLimite">' +
                                            '<option value="10">10</option>' +
                                            '<option value="50" selected>50</option>' +
                                            '<option value="100">100</option>' +
                                            '<option value="200">200</option>' +
                                            '<option value="500">500</option>' +
                                        '</select>' +
                                    '</label>' +
                                '</div>' +
                                '<div class="db-exp-recs-toolbar-right">' +
                                    '<div class="search-wrap">' +
                                        '<input type="search" id="dbExpRecsSearch" class="search-input" placeholder="Buscar en los registros…">' +
                                        '<button class="search-clear" type="button" id="dbExpRecsSearchClear">&times;</button>' +
                                    '</div>' +
                                '</div>' +
                            '</div>' +
                            '<div class="table-card db-exp-table-card db-exp-recs-card db-exp-fill">' +
                                '<table id="dbExpRecsTable">' +
                                    '<thead><tr><th></th></tr></thead>' +
                                    '<tbody id="dbExpRecsTbody">' +
                                        '<tr><td style="text-align:center;padding:24px"><div class="spin"></div></td></tr>' +
                                    '</tbody>' +
                                '</table>' +
                            '</div>' +
                        '</div>' +

                        '<div class="db-exp-tabpanel" id="dbExpTabCols" role="tabpanel" hidden>' +
                            '<div class="table-card db-exp-table-card db-exp-fill">' +
                                '<table>' +
                                    '<thead><tr>' +
                                        '<th style="width:36px">#</th>' +
                                        '<th>Campo</th>' +
                                        '<th>Tipo</th>' +
                                        '<th style="width:70px">Null</th>' +
                                        '<th style="width:70px">Clave</th>' +
                                        '<th>Default</th>' +
                                        '<th>Extra</th>' +
                                    '</tr></thead>' +
                                    '<tbody id="dbExpColsTbody">' +
                                        '<tr><td colspan="7" style="text-align:center;padding:24px"><div class="spin"></div></td></tr>' +
                                    '</tbody>' +
                                '</table>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="modal-footer">' +
                    '<button class="btn btn-ghost" type="button" data-act="close">Cerrar</button>' +
                '</div>' +
            '</div>' +
        '</div>';
    }

    function abrirExploradorDB() {
        var bd = document.getElementById('dbExpModalBackdrop');
        if (!bd) return;
        dbExpTablaActual = null;
        dbExpFiltro      = '';
        dbExpFiltroRegs  = '';
        var s = document.getElementById('dbExpSearch');
        if (s) s.value = '';
        dbExpMostrarVista('tables');
        bd.classList.add('open');
        dbExpCargarTablas();
    }

    function cerrarExploradorDB() {
        var bd = document.getElementById('dbExpModalBackdrop');
        if (bd) bd.classList.remove('open');
    }

    function dbExpRecargar() {
        if (dbExpTablaActual) {
            dbExpAbrirTabla(dbExpTablaActual);
        } else {
            dbExpCargarTablas();
        }
    }

    function dbExpMostrarVista(v) {
        var tables = document.getElementById('dbExpViewTables');
        var detail = document.getElementById('dbExpViewDetail');
        var sw     = document.getElementById('dbExpSearchWrap');
        if (v === 'tables') {
            if (tables) tables.style.display = '';
            if (detail) detail.style.display = 'none';
            if (sw)     sw.style.display     = '';
        } else {
            if (tables) tables.style.display = 'none';
            if (detail) detail.style.display = '';
            if (sw)     sw.style.display     = 'none';
        }
        dbExpRenderBreadcrumbs();
    }

    function dbExpRenderBreadcrumbs() {
        var el = document.getElementById('dbExpBreadcrumbs');
        if (!el) return;
        var html = '';
        if (dbExpTablaActual) {
            html += '<button type="button" class="db-exp-crumb" id="dbExpCrumbDb">' +
                    '🗄️ ' + e(dbExpDbName || '—') + '</button>';
            html += '<span class="db-exp-crumb-sep">/</span>';
            html += '<span class="db-exp-crumb current">' + e(dbExpTablaActual) + '</span>';
        } else {
            html += '<span class="db-exp-crumb current">🗄️ ' + e(dbExpDbName || '—') + '</span>';
        }
        el.innerHTML = html;
        var back = document.getElementById('dbExpCrumbDb');
        if (back) back.addEventListener('click', dbExpVolverATablas);
    }

    function dbExpVolverATablas() {
        dbExpTablaActual = null;
        dbExpFiltroRegs  = '';
        var s = document.getElementById('dbExpRecsSearch');
        if (s) s.value = '';
        dbExpMostrarVista('tables');
        dbExpRenderTablas();
    }

    async function dbExpCargarTablas() {
        if (dbExpCargando) return;
        dbExpCargando = true;
        var tbody = document.getElementById('dbExpTablesTbody');
        var info  = document.getElementById('dbExpTablesInfo');
        if (tbody) tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:24px"><div class="spin"></div></td></tr>';
        if (info)  info.textContent = '';
        try {
            var data = await api('/api/herramientas_db_tables.php');
            dbExpTablas = data.tablas || [];
            dbExpDbName = data.database || '';
            dbExpEnv    = (data.env || '').toLowerCase();

            var dbEl = document.getElementById('dbExpDbName');
            if (dbEl) dbEl.textContent = dbExpDbName || '—';
            var envEl = document.getElementById('dbExpEnvBadge');
            if (envEl) {
                envEl.textContent = dbExpEnv || '—';
                envEl.classList.remove('badge-info', 'badge-success', 'badge-warn', 'badge-danger');
                if (dbExpEnv === 'production')       envEl.classList.add('badge-danger');
                else if (dbExpEnv === 'development') envEl.classList.add('badge-success');
                else                                 envEl.classList.add('badge-warn');
            }
            dbExpRenderBreadcrumbs();
            dbExpRenderTablas();
        } catch (err) {
            if (tbody) tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:20px;color:var(--danger)">' +
                e(err.message || 'Error al cargar tablas.') + '</td></tr>';
        } finally {
            dbExpCargando = false;
        }
    }

    function dbExpRenderTablas() {
        var tbody = document.getElementById('dbExpTablesTbody');
        var info  = document.getElementById('dbExpTablesInfo');
        if (!tbody) return;

        var q = dbExpFiltro.trim().toLowerCase();
        var rows = dbExpTablas.filter(function (t) {
            if (!q) return true;
            return (t.nombre || '').toLowerCase().indexOf(q) !== -1 ||
                   (t.comentario || '').toLowerCase().indexOf(q) !== -1;
        });

        if (rows.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="db-exp-empty">' +
                (q ? 'Sin resultados para el filtro.' : 'No hay tablas en esta base.') + '</td></tr>';
        } else {
            tbody.innerHTML = rows.map(function (t) {
                var filas = (t.filas_aprox === null || t.filas_aprox === undefined)
                    ? '—'
                    : dbExpFmtNum(t.filas_aprox);
                var coment = t.comentario ? '<div class="db-exp-coment">' + e(t.comentario) + '</div>' : '';
                return '<tr class="row-clickable" data-tabla="' + e(t.nombre) + '">' +
                    '<td><i class="fa-solid fa-table" style="color:var(--info)"></i></td>' +
                    '<td><div class="db-exp-nombre">' + e(t.nombre) + '</div>' + coment + '</td>' +
                    '<td class="db-exp-num">' + filas + '</td>' +
                    '<td class="db-exp-mono">' + e(t.engine || '—') + '</td>' +
                '</tr>';
            }).join('');
        }

        if (info) {
            var total = dbExpTablas.length;
            var txt = rows.length + ' tabla(s)';
            if (q) txt += ' (filtradas de ' + total + ')';
            info.innerHTML = '<span>' + e(txt) + '</span><span></span>';
        }
    }

    function dbExpFmtNum(n) {
        if (typeof n !== 'number') n = Number(n);
        if (isNaN(n)) return '—';
        try { return n.toLocaleString('es-AR'); }
        catch (_) { return String(n); }
    }

    function dbExpFiltrarTablas() {
        var s = document.getElementById('dbExpSearch');
        dbExpFiltro = s ? s.value : '';
        dbExpRenderTablas();
    }

    function dbExpLimpiarBuscador() {
        var s = document.getElementById('dbExpSearch');
        if (s) s.value = '';
        dbExpFiltro = '';
        dbExpRenderTablas();
    }

    async function dbExpAbrirTabla(nombre) {
        dbExpTablaActual = nombre;
        dbExpFiltroRegs  = '';
        var srch = document.getElementById('dbExpRecsSearch');
        if (srch) srch.value = '';
        dbExpMostrarVista('detail');
        dbExpCambiarTab('recs');

        var colsTbody = document.getElementById('dbExpColsTbody');
        if (colsTbody) colsTbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px"><div class="spin"></div></td></tr>';
        var recsTbody = document.getElementById('dbExpRecsTbody');
        if (recsTbody) recsTbody.innerHTML = '<tr><td style="text-align:center;padding:24px"><div class="spin"></div></td></tr>';

        var pCols = api('/api/herramientas_db_describe.php?tabla=' + encodeURIComponent(nombre))
            .then(function (data) { dbExpRenderColumnas(data.columnas || []); })
            .catch(function (err) {
                if (colsTbody) colsTbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:var(--danger)">' +
                    e(err.message || 'Error al cargar columnas.') + '</td></tr>';
            });
        var pRecs = dbExpCargarRegistros(nombre);
        await Promise.all([pCols, pRecs]);
    }

    function dbExpCambiarTab(tab) {
        var tabs = document.querySelectorAll('#dbExpViewDetail .db-exp-tab');
        tabs.forEach(function (t) {
            t.classList.toggle('active', t.getAttribute('data-tab') === tab);
        });
        var pRecs = document.getElementById('dbExpTabRecs');
        var pCols = document.getElementById('dbExpTabCols');
        if (pRecs) { if (tab === 'recs') pRecs.removeAttribute('hidden'); else pRecs.setAttribute('hidden', ''); }
        if (pCols) { if (tab === 'cols') pCols.removeAttribute('hidden'); else pCols.setAttribute('hidden', ''); }
    }

    function dbExpRenderColumnas(cols) {
        var tbody = document.getElementById('dbExpColsTbody');
        var meta  = document.getElementById('dbExpColsMeta');
        if (meta) meta.textContent = cols.length;
        if (!tbody) return;
        if (cols.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="db-exp-empty">Sin columnas.</td></tr>';
            return;
        }
        tbody.innerHTML = cols.map(function (c) {
            var nullBadge = (c.nullable === 'YES')
                ? '<span class="badge badge-warn">SÍ</span>'
                : '<span class="badge badge-muted">NO</span>';
            var claveBadge = '';
            if (c.clave === 'PRI')      claveBadge = '<span class="badge badge-warn">PK</span>';
            else if (c.clave === 'UNI') claveBadge = '<span class="badge badge-info">UQ</span>';
            else if (c.clave === 'MUL') claveBadge = '<span class="badge" style="background:rgba(139,92,246,.18);color:#c4b5fd">IDX</span>';
            var def = (c.predeterminado === null || c.predeterminado === undefined)
                ? '<span class="db-exp-null">NULL</span>'
                : '<code style="font-family:monospace">' + e(String(c.predeterminado)) + '</code>';
            var extra = c.extra
                ? '<code style="font-family:monospace">' + e(c.extra) + '</code>'
                : '';
            var coment = c.comentario ? '<div class="db-exp-coment">' + e(c.comentario) + '</div>' : '';
            return '<tr>' +
                '<td class="db-exp-num">' + e(c.posicion) + '</td>' +
                '<td><div class="db-exp-col-nombre">' + e(c.nombre) + '</div>' + coment + '</td>' +
                '<td><span class="db-exp-mono">' + e(c.tipo) + '</span></td>' +
                '<td>' + nullBadge + '</td>' +
                '<td>' + claveBadge + '</td>' +
                '<td>' + def + '</td>' +
                '<td>' + extra + '</td>' +
            '</tr>';
        }).join('');
    }

    async function dbExpCargarRegistros(nombre) {
        var tbody = document.getElementById('dbExpRecsTbody');
        var meta  = document.getElementById('dbExpRecsMeta');
        if (tbody) tbody.innerHTML = '<tr><td style="text-align:center;padding:24px"><div class="spin"></div></td></tr>';
        if (meta)  meta.textContent = '…';
        try {
            var qs = '?tabla=' + encodeURIComponent(nombre) + '&limite=' + dbExpLimite;
            var data = await api('/api/herramientas_db_records.php' + qs);
            dbExpRenderRegistros(data);
        } catch (err) {
            if (tbody) tbody.innerHTML = '<tr><td style="text-align:center;padding:20px;color:var(--danger)">' +
                e(err.message || 'Error al cargar registros.') + '</td></tr>';
            if (meta) meta.textContent = '!';
        }
    }

    function dbExpRenderRegistros(payload) {
        dbExpRegistros    = payload.registros || [];
        dbExpPkCols       = payload.pk        || [];
        dbExpAutoIncCols  = payload.auto_inc  || [];
        dbExpNullableCols = payload.nullable  || [];
        dbExpColsTabla    = payload.columnas  || [];
        dbExpRegsTotal    = payload.total || 0;

        var thead = document.querySelector('#dbExpRecsTable thead');
        if (thead) {
            thead.innerHTML = '<tr>' + dbExpColsTabla.map(function (c) {
                var esPk = dbExpPkCols.indexOf(c) !== -1;
                var icon = esPk ? ' <i class="fa-solid fa-key" style="color:var(--warn);font-size:.75rem" title="PK"></i>' : '';
                return '<th style="white-space:nowrap">' + e(c) + icon + '</th>';
            }).join('') + '</tr>';
        }
        dbExpPintarRegistros();
    }

    function dbExpPintarRegistros() {
        var tbody = document.getElementById('dbExpRecsTbody');
        var meta  = document.getElementById('dbExpRecsMeta');
        if (!tbody) return;

        var q = dbExpFiltroRegs.trim().toLowerCase();
        var filtrados = [];
        for (var i = 0; i < dbExpRegistros.length; i++) {
            var reg = dbExpRegistros[i];
            if (q) {
                var hay = false;
                for (var j = 0; j < dbExpColsTabla.length; j++) {
                    var v = reg[dbExpColsTabla[j]];
                    if (v !== null && v !== undefined && String(v).toLowerCase().indexOf(q) !== -1) {
                        hay = true; break;
                    }
                }
                if (!hay) continue;
            }
            filtrados.push({ idx: i, reg: reg });
        }

        var sinPk = dbExpPkCols.length === 0;
        var colspan = Math.max(1, dbExpColsTabla.length);

        if (dbExpRegistros.length === 0) {
            tbody.innerHTML = '<tr><td colspan="' + colspan + '" class="db-exp-empty">Esta tabla está vacía.</td></tr>';
        } else if (filtrados.length === 0) {
            tbody.innerHTML = '<tr><td colspan="' + colspan + '" class="db-exp-empty">Sin resultados para "' + e(dbExpFiltroRegs) + '".</td></tr>';
        } else {
            tbody.innerHTML = filtrados.map(function (item) {
                var reg = item.reg;
                var tds = dbExpColsTabla.map(function (col) {
                    var editable = !sinPk
                        && dbExpPkCols.indexOf(col) === -1
                        && dbExpAutoIncCols.indexOf(col) === -1;
                    var cls, title, dbl;
                    if (sinPk) {
                        cls = 'db-exp-cell-lock'; title = 'No editable: la tabla no tiene PK'; dbl = '';
                    } else if (dbExpPkCols.indexOf(col) !== -1) {
                        cls = 'db-exp-cell-lock'; title = 'No editable: PK'; dbl = '';
                    } else if (dbExpAutoIncCols.indexOf(col) !== -1) {
                        cls = 'db-exp-cell-lock'; title = 'No editable: auto_increment'; dbl = '';
                    } else {
                        cls = 'db-exp-cell-edit'; title = 'Doble click para editar';
                        dbl = ' ondblclick="dbExpEditarCelda(this)"';
                    }
                    return '<td class="' + cls + '" data-col="' + e(col) + '" title="' + e(title) + '"' + dbl + '>' +
                        dbExpFmtValor(reg[col]) + '</td>';
                }).join('');
                return '<tr data-row="' + item.idx + '">' + tds + '</tr>';
            }).join('');
        }

        if (meta) {
            var visibles = filtrados.length;
            var cargados = dbExpRegistros.length;
            var txt = visibles + '/' + dbExpRegsTotal;
            if (q && visibles !== cargados) {
                txt += ' (filtrados de ' + cargados + ')';
            }
            if (sinPk && dbExpRegistros.length > 0) {
                txt += ' · solo lectura';
            }
            meta.textContent = txt;
        }
    }

    function dbExpCambiarLimite() {
        var sel = document.getElementById('dbExpLimite');
        if (!sel) return;
        var v = parseInt(sel.value, 10);
        if (isNaN(v) || v < 1) v = 50;
        dbExpLimite = v;
        if (dbExpTablaActual) dbExpCargarRegistros(dbExpTablaActual);
    }

    function dbExpFiltrarRegistros() {
        var s = document.getElementById('dbExpRecsSearch');
        dbExpFiltroRegs = s ? s.value : '';
        dbExpPintarRegistros();
    }

    function dbExpLimpiarBuscadorRegs() {
        var s = document.getElementById('dbExpRecsSearch');
        if (s) s.value = '';
        dbExpFiltroRegs = '';
        dbExpPintarRegistros();
    }

    function dbExpFmtValor(v) {
        if (v === null || v === undefined) return '<span class="db-exp-null">NULL</span>';
        if (v === '')                       return '<span class="db-exp-null">""</span>';
        return e(String(v));
    }

    function dbExpEditarCelda(td) {
        if (!td || td.querySelector('input')) return;
        var tr = td.parentElement;
        if (!tr) return;
        var rowIdx = parseInt(tr.getAttribute('data-row'), 10);
        var col    = td.getAttribute('data-col') || '';
        var reg    = dbExpRegistros[rowIdx];
        if (!reg || !col) return;

        var valorActual = reg[col];
        var valorStr = (valorActual === null || valorActual === undefined) ? '' : String(valorActual);
        var admiteNull = dbExpNullableCols.indexOf(col) !== -1;

        td.classList.add('db-exp-cell-editing');
        var actions = '<button type="button" class="btn-icon-sm" data-act="guardar" title="Guardar">✓</button>' +
                      '<button type="button" class="btn-icon-sm" data-act="cancelar" title="Cancelar">✗</button>';
        if (admiteNull) {
            actions += '<button type="button" class="btn-icon-sm" data-act="null" title="Setear NULL">⊘</button>';
        }
        td.innerHTML = '<div class="db-exp-edit-wrap">' +
            '<input class="db-exp-edit-input" type="text" value="' + e(valorStr) + '">' +
            '<div class="db-exp-edit-actions">' + actions + '</div>' +
        '</div>';

        var input = td.querySelector('input');
        if (input) {
            input.focus();
            input.select();
        }

        function cerrar() {
            td.classList.remove('db-exp-cell-editing', 'db-exp-cell-saving');
            td.innerHTML = dbExpFmtValor(dbExpRegistros[rowIdx][col]);
        }

        async function guardar(nuevoValor) {
            var original = dbExpRegistros[rowIdx][col];
            var mismo = (nuevoValor === null && (original === null || original === undefined))
                     || (nuevoValor !== null && String(nuevoValor) === String(original));
            if (mismo) { cerrar(); return; }

            td.classList.add('db-exp-cell-saving');
            try {
                var pkPayload = {};
                for (var k = 0; k < dbExpPkCols.length; k++) {
                    var pkc = dbExpPkCols[k];
                    pkPayload[pkc] = reg[pkc];
                }
                var data = await api('/api/herramientas_db_update.php', {
                    method: 'POST',
                    body:   {
                        tabla:   dbExpTablaActual,
                        columna: col,
                        pk:      pkPayload,
                        valor:   nuevoValor
                    }
                });
                dbExpRegistros[rowIdx][col] = data.valor_guardado;
                td.classList.remove('db-exp-cell-editing', 'db-exp-cell-saving');
                td.innerHTML = dbExpFmtValor(data.valor_guardado);
                td.classList.add('db-exp-cell-ok');
                setTimeout(function () { td.classList.remove('db-exp-cell-ok'); }, 900);
            } catch (err) {
                td.classList.remove('db-exp-cell-saving');
                toast(err.message || 'Error al guardar.', { error: true });
                var inp = td.querySelector('input');
                if (inp) inp.focus();
            }
        }

        input.addEventListener('keydown', function (ev) {
            if (ev.key === 'Enter') {
                ev.preventDefault(); ev.stopPropagation();
                guardar(input.value);
            } else if (ev.key === 'Escape') {
                ev.preventDefault(); ev.stopPropagation();
                cerrar();
            }
        });
        td.querySelectorAll('button[data-act]').forEach(function (btn) {
            btn.addEventListener('click', function (ev) {
                ev.preventDefault(); ev.stopPropagation();
                var act = btn.getAttribute('data-act');
                if (act === 'guardar')  guardar(input.value);
                if (act === 'cancelar') cerrar();
                if (act === 'null')     guardar(null);
            });
        });
    }
    window.dbExpEditarCelda = dbExpEditarCelda;

    function wireExploradorDBView() {
        var tile = document.getElementById('cfgTileExpDB');
        if (tile) tile.addEventListener('click', abrirExploradorDB);

        var bd = document.getElementById('dbExpModalBackdrop');
        if (bd) {
            bd.addEventListener('click', function (ev) {
                if (ev.target === bd || ev.target.closest('[data-act="close"]')) {
                    cerrarExploradorDB();
                }
            });
        }

        var btnRef = document.getElementById('dbExpBtnRefrescar');
        if (btnRef) btnRef.addEventListener('click', dbExpRecargar);

        var search = document.getElementById('dbExpSearch');
        if (search) search.addEventListener('input', dbExpFiltrarTablas);
        var searchClear = document.getElementById('dbExpSearchClear');
        if (searchClear) searchClear.addEventListener('click', dbExpLimpiarBuscador);

        var tbody = document.getElementById('dbExpTablesTbody');
        if (tbody) {
            tbody.addEventListener('click', function (ev) {
                var tr = ev.target.closest('tr[data-tabla]');
                if (!tr) return;
                var nombre = tr.getAttribute('data-tabla');
                if (nombre) dbExpAbrirTabla(nombre);
            });
        }

        var tabsWrap = document.querySelector('#dbExpViewDetail .db-exp-tabs');
        if (tabsWrap) {
            tabsWrap.addEventListener('click', function (ev) {
                var btn = ev.target.closest('.db-exp-tab');
                if (!btn) return;
                var tab = btn.getAttribute('data-tab');
                if (tab) dbExpCambiarTab(tab);
            });
        }

        var limSel = document.getElementById('dbExpLimite');
        if (limSel) limSel.addEventListener('change', dbExpCambiarLimite);

        var recsSearch = document.getElementById('dbExpRecsSearch');
        if (recsSearch) recsSearch.addEventListener('input', dbExpFiltrarRegistros);
        var recsClear = document.getElementById('dbExpRecsSearchClear');
        if (recsClear) recsClear.addEventListener('click', dbExpLimpiarBuscadorRegs);

        if (!wireExploradorDBView._escBound) {
            wireExploradorDBView._escBound = true;
            document.addEventListener('keydown', function (ev) {
                if (ev.key !== 'Escape') return;
                var back = document.getElementById('dbExpModalBackdrop');
                if (back && back.classList.contains('open')) {
                    cerrarExploradorDB();
                    ev.stopImmediatePropagation();
                }
            }, true);
        }
    }

    // -------- Vista: Programador de tareas (Herramientas) ----------------

    var tareasCache             = [];
    var tareasFiltroQ           = '';
    var tareasFiltroActivo      = '1';
    var _tareasSearchTimer      = null;
    var tareasCtxRegistroId     = null;
    var ejecucionesTareaSel     = null;   // { id, nombre }
    var ejecucionesFiltroEstado = '';
    var ejecucionesCache        = [];
    var ejecucionesCtxRegistroId = null;
    var terminalES              = null;
    var terminalEjecucionActual = null;
    var terminalAutoscroll      = true;
    var _tareasConfirmResolve   = null;
    var cronPickerState         = null;
    var _tareasEditandoId       = 0;

    var CRON_CAMPOS = ['min', 'hour', 'dom', 'month', 'dow'];
    var CRON_CAMPO_LABEL = {
        min:   { label: 'Minuto',            rango: '(0-59)',  emoji: '⏱️' },
        hour:  { label: 'Hora',              rango: '(0-23)',  emoji: '🕐' },
        dom:   { label: 'Día del mes',       rango: '(1-31)',  emoji: '📅' },
        month: { label: 'Mes',               rango: '(1-12)',  emoji: '🗓️' },
        dow:   { label: 'Día de la semana',  rango: '(0-6)',   emoji: '🗓️' }
    };
    var CRON_PICKER_CFG = {
        min:   { min: 0, max: 59, formato: function (n) { return String(n).padStart(2, '0'); }, titulo: 'Elegir minutos' },
        hour:  { min: 0, max: 23, formato: function (n) { return String(n).padStart(2, '0'); }, titulo: 'Elegir horas' },
        dom:   { min: 1, max: 31, formato: function (n) { return String(n); },                  titulo: 'Elegir día del mes' },
        month: { min: 1, max: 12, formato: function (n) { return cronNombreMesCorto(n); },      titulo: 'Elegir mes' },
        dow:   { min: 0, max: 6,  formato: function (n) { return cronNombreDiaCorto(n); },
                 orden: [1, 2, 3, 4, 5, 6, 0],                                                  titulo: 'Elegir día de la semana' }
    };

    // ---- HTML de modales ----

    function modalTareasListaHtml() {
        return '<div class="modal-backdrop" id="tareasBackdrop">' +
            '<div class="modal" style="max-width:1080px;display:flex;flex-direction:column;max-height:90vh;overflow:hidden">' +
                '<div class="modal-header" style="flex-shrink:0">' +
                    '<div class="modal-title" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">' +
                        '<span style="font-size:1.2rem">⏰</span>' +
                        '<span>Programador de tareas</span>' +
                        '<span id="tareasResumen" class="modal-subtitle"></span>' +
                    '</div>' +
                    '<button class="btn-icon-sm" type="button" data-act="close" aria-label="Cerrar">&times;</button>' +
                '</div>' +
                '<div class="modal-body" style="gap:12px;flex:1;overflow:hidden;min-height:0;display:flex;flex-direction:column">' +
                    '<div class="toolbar" style="margin-bottom:0">' +
                        '<div class="toolbar-left" style="gap:8px;flex-wrap:wrap">' +
                            '<div class="search-wrap">' +
                                '<input class="search-input" type="search" id="tareasSearch" placeholder="🔍 Buscar nombre, script, cron…">' +
                                '<button class="search-clear" id="tareasSearchClear" type="button" style="display:none">&times;</button>' +
                            '</div>' +
                            '<div id="tareasEstadoChips" style="display:flex;gap:6px;flex-wrap:wrap">' +
                                '<button type="button" class="filter-chip" data-val="">Todas</button>' +
                                '<button type="button" class="filter-chip active" data-val="1">Activas</button>' +
                                '<button type="button" class="filter-chip" data-val="0">Inactivas</button>' +
                            '</div>' +
                            '<button class="btn btn-ghost btn-icon" type="button" id="tareasBtnRefrescar" title="Refrescar"><i class="fa-solid fa-rotate"></i></button>' +
                        '</div>' +
                        '<div class="toolbar-right">' +
                            '<button class="btn btn-primary" type="button" id="tareasBtnNueva">+ Nueva tarea</button>' +
                        '</div>' +
                    '</div>' +
                    '<div class="table-card" style="flex:1;overflow-y:auto;min-height:0">' +
                        '<table>' +
                            '<thead style="position:sticky;top:0;background:var(--bg);z-index:1"><tr>' +
                                '<th style="width:70px">Código</th>' +
                                '<th>Nombre</th>' +
                                '<th style="width:140px">Cron</th>' +
                                '<th style="width:120px">Estado</th>' +
                                '<th style="width:160px">Última corrida</th>' +
                                '<th style="width:80px">Activa</th>' +
                                '<th style="width:70px;text-align:center">Acciones</th>' +
                            '</tr></thead>' +
                            '<tbody id="tareasTbody">' +
                                '<tr><td colspan="7" style="text-align:center;padding:20px"><div class="spin"></div></td></tr>' +
                            '</tbody>' +
                        '</table>' +
                    '</div>' +
                '</div>' +
                '<div class="modal-footer" style="flex-shrink:0">' +
                    '<button type="button" class="btn btn-ghost" data-act="close">Cerrar</button>' +
                '</div>' +
            '</div>' +
        '</div>';
    }

    function modalTareaFormHtml() {
        return '<div class="modal-backdrop" id="formTareaBackdrop">' +
            '<div class="modal" style="max-width:640px">' +
                '<div class="modal-header">' +
                    '<div class="modal-title">' +
                        '<span id="formTareaTitulo">Nueva tarea</span>' +
                        '<span class="modal-subtitle" id="formTareaSub"></span>' +
                    '</div>' +
                    '<button class="btn-icon-sm" type="button" data-act="close" aria-label="Cerrar">&times;</button>' +
                '</div>' +
                '<form id="formTarea" novalidate>' +
                    '<input type="hidden" id="formTareaId" value="">' +
                    '<div class="modal-body">' +
                        '<div class="form-group"><label for="formTareaNombre">Nombre</label>' +
                            '<input id="formTareaNombre" type="text" maxlength="120" required>' +
                            '<div class="field-error" data-err="Nombre"></div>' +
                        '</div>' +
                        '<div class="form-group"><label for="formTareaDescripcion">Descripción (opcional)</label>' +
                            '<input id="formTareaDescripcion" type="text" maxlength="255">' +
                        '</div>' +
                        '<div class="form-group"><label for="formTareaScript">Script</label>' +
                            '<div style="display:flex;gap:6px">' +
                                '<select id="formTareaScript" required style="flex:1"><option value="">Cargando…</option></select>' +
                                '<button class="btn btn-ghost btn-icon" type="button" id="formTareaScriptReload" title="Re-escanear cloud/jobs/"><i class="fa-solid fa-rotate"></i></button>' +
                            '</div>' +
                            '<div class="field-error" data-err="Script"></div>' +
                        '</div>' +
                        '<div class="form-row">' +
                            '<div class="form-group"><label for="formTareaCron">Expresión cron</label>' +
                                '<div style="display:flex;gap:6px">' +
                                    '<input id="formTareaCron" type="text" style="font-family:monospace;flex:1" placeholder="*/5 * * * *" required>' +
                                    '<button class="btn btn-ghost btn-icon" type="button" id="formTareaCronBuilder" title="Abrir constructor"><i class="fa-solid fa-sliders"></i></button>' +
                                '</div>' +
                                '<div class="field-error" data-err="Cron"></div>' +
                            '</div>' +
                            '<div class="form-group"><label for="formTareaTimeout">Timeout (segundos)</label>' +
                                '<input id="formTareaTimeout" type="number" min="5" max="86400" value="300">' +
                            '</div>' +
                        '</div>' +
                        '<div class="form-row form-row-3">' +
                            '<div class="form-group"><label for="formTareaOverlap">Si ya está corriendo</label>' +
                                '<select id="formTareaOverlap">' +
                                    '<option value="skip" selected>Saltar</option>' +
                                    '<option value="allow">Ejecutar</option>' +
                                '</select>' +
                            '</div>' +
                            '<div class="form-group"><label for="formTareaRetencion">Retención de logs (días)</label>' +
                                '<input id="formTareaRetencion" type="number" min="1" max="3650" value="7">' +
                            '</div>' +
                            '<div class="form-group"><label for="formTareaActivo">Estado</label>' +
                                '<select id="formTareaActivo">' +
                                    '<option value="1" selected>Activa</option>' +
                                    '<option value="0">Inactiva</option>' +
                                '</select>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="modal-footer">' +
                        '<button type="button" class="btn btn-ghost" data-act="close">Cancelar</button>' +
                        '<button type="submit" class="btn btn-primary" id="formTareaBtnGuardar">Guardar</button>' +
                    '</div>' +
                '</form>' +
            '</div>' +
        '</div>';
    }

    function modalTareasEjecucionesHtml() {
        return '<div class="modal-backdrop" id="ejecucionesBackdrop">' +
            '<div class="modal" style="max-width:1000px;display:flex;flex-direction:column;max-height:90vh;overflow:hidden">' +
                '<div class="modal-header" style="flex-shrink:0">' +
                    '<div class="modal-title" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">' +
                        '<span style="font-size:1.2rem">📜</span>' +
                        '<span>Ejecuciones de <span id="ejecucionesTareaNombre">—</span></span>' +
                    '</div>' +
                    '<button class="btn-icon-sm" type="button" data-act="close" aria-label="Cerrar">&times;</button>' +
                '</div>' +
                '<div class="modal-body" style="gap:12px;flex:1;overflow:hidden;min-height:0;display:flex;flex-direction:column">' +
                    '<div class="toolbar" style="margin-bottom:0">' +
                        '<div class="toolbar-left" style="gap:8px;flex-wrap:wrap">' +
                            '<div id="ejecucionesEstadoChips" style="display:flex;gap:6px;flex-wrap:wrap">' +
                                '<button type="button" class="filter-chip active" data-val="">Todas</button>' +
                                '<button type="button" class="filter-chip" data-val="corriendo">Corriendo</button>' +
                                '<button type="button" class="filter-chip" data-val="ok">OK</button>' +
                                '<button type="button" class="filter-chip" data-val="error">Error</button>' +
                                '<button type="button" class="filter-chip" data-val="timeout">Timeout</button>' +
                                '<button type="button" class="filter-chip" data-val="killed">Killed</button>' +
                            '</div>' +
                            '<button class="btn btn-ghost btn-icon" type="button" id="ejecucionesBtnRefrescar" title="Refrescar"><i class="fa-solid fa-rotate"></i></button>' +
                        '</div>' +
                    '</div>' +
                    '<div class="table-card" style="flex:1;overflow-y:auto;min-height:0">' +
                        '<table>' +
                            '<thead style="position:sticky;top:0;background:var(--bg);z-index:1"><tr>' +
                                '<th style="width:70px">Código</th>' +
                                '<th style="width:160px">Inicio</th>' +
                                '<th style="width:100px">Duración</th>' +
                                '<th style="width:110px">Estado</th>' +
                                '<th style="width:110px">Disparo</th>' +
                                '<th>Mensaje</th>' +
                                '<th style="width:70px;text-align:center">Acciones</th>' +
                            '</tr></thead>' +
                            '<tbody id="ejecucionesTbody">' +
                                '<tr><td colspan="7" style="text-align:center;padding:20px"><div class="spin"></div></td></tr>' +
                            '</tbody>' +
                        '</table>' +
                    '</div>' +
                '</div>' +
                '<div class="modal-footer" style="flex-shrink:0">' +
                    '<button type="button" class="btn btn-ghost" data-act="close">Cerrar</button>' +
                '</div>' +
            '</div>' +
        '</div>';
    }

    function modalTareasTerminalHtml() {
        return '<div class="modal-backdrop" id="terminalBackdrop">' +
            '<div class="modal" style="max-width:960px">' +
                '<div class="modal-header">' +
                    '<div class="modal-title" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">' +
                        '<span style="font-size:1.2rem">🖥️</span>' +
                        '<span>Log ejecución #<span id="terminalEjecucionId">—</span></span>' +
                        '<span class="badge badge-info" id="terminalEstadoBadge">corriendo</span>' +
                    '</div>' +
                    '<button class="btn-icon-sm" type="button" data-act="close" aria-label="Cerrar">&times;</button>' +
                '</div>' +
                '<div class="modal-body">' +
                    '<pre id="terminalOutput" class="terminal-live"></pre>' +
                '</div>' +
                '<div class="modal-footer">' +
                    '<button type="button" class="btn btn-ghost btn-icon active" id="btnTerminalAutoscroll" title="Auto-scroll" style="margin-right:auto">' +
                        '<i class="fa-solid fa-angles-down"></i>' +
                    '</button>' +
                    '<button type="button" class="btn btn-danger" id="btnTerminalDetener" style="display:none">' +
                        '<i class="fa-solid fa-stop"></i> Detener' +
                    '</button>' +
                    '<button type="button" class="btn btn-ghost" data-act="close">Cerrar</button>' +
                '</div>' +
            '</div>' +
        '</div>';
    }

    function modalCronBuilderHtml() {
        var filas = CRON_CAMPOS.map(function (c) {
            var m = CRON_CAMPO_LABEL[c];
            return '<div class="form-group" style="display:grid;grid-template-columns:180px 130px 1fr 40px;gap:8px;align-items:center">' +
                '<label style="margin:0">' + m.emoji + ' ' + m.label + ' <span style="color:var(--muted);font-weight:400">' + m.rango + '</span></label>' +
                '<select data-cron-modo="' + c + '">' +
                    '<option value="star" selected>Cualquiera</option>' +
                    '<option value="exact">Exacto</option>' +
                    '<option value="step">Cada</option>' +
                    '<option value="range">Rango</option>' +
                    '<option value="list">Lista</option>' +
                '</select>' +
                '<input type="text" data-cron-valor="' + c + '" disabled placeholder="—" style="font-family:monospace">' +
                '<button type="button" class="btn btn-ghost btn-icon" data-cron-picker="' + c + '" disabled title="Elegir con botones"><i class="fa-solid fa-list-check"></i></button>' +
            '</div>';
        }).join('');

        return '<div class="modal-backdrop" id="cronBuilderBackdrop" style="z-index:160">' +
            '<div class="modal" style="max-width:640px">' +
                '<div class="modal-header">' +
                    '<div class="modal-title">' +
                        '<span style="font-size:1.2rem">🛠️</span>' +
                        '<span>Constructor de cron</span>' +
                    '</div>' +
                    '<button class="btn-icon-sm" type="button" data-act="close" aria-label="Cerrar">&times;</button>' +
                '</div>' +
                '<div class="modal-body">' +
                    filas +
                    '<div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius);padding:12px 14px;margin-top:8px">' +
                        '<div id="cronBuilderExpr" style="font-family:monospace;font-weight:700;font-size:1.05rem;color:var(--text)">* * * * *</div>' +
                        '<div id="cronBuilderDesc" style="font-size:.85rem;color:var(--muted);margin-top:4px">Cada minuto, todos los días.</div>' +
                    '</div>' +
                '</div>' +
                '<div class="modal-footer">' +
                    '<button type="button" class="btn btn-ghost" data-act="close">Cancelar</button>' +
                    '<button type="button" class="btn btn-primary" id="cronBuilderBtnAplicar">Aplicar</button>' +
                '</div>' +
            '</div>' +
        '</div>';
    }

    function modalCronPickerHtml() {
        return '<div class="modal-backdrop" id="cronPickerBackdrop" style="z-index:180">' +
            '<div class="modal" style="max-width:640px">' +
                '<div class="modal-header">' +
                    '<div class="modal-title">' +
                        '<span id="cronPickerEmoji" style="font-size:1.2rem">⏱️</span>' +
                        '<span id="cronPickerTitulo">Elegir</span>' +
                    '</div>' +
                    '<button class="btn-icon-sm" type="button" data-act="close" aria-label="Cerrar">&times;</button>' +
                '</div>' +
                '<div class="modal-body">' +
                    '<div id="cronPickerHint" style="font-size:.85rem;color:var(--muted)">—</div>' +
                    '<div id="cronPickerGrupo1" style="display:flex;gap:6px;flex-wrap:wrap"></div>' +
                    '<div id="cronPickerGrupo2Wrap" style="display:none">' +
                        '<div style="font-size:.85rem;color:var(--muted);margin-bottom:6px">Hasta</div>' +
                        '<div id="cronPickerGrupo2" style="display:flex;gap:6px;flex-wrap:wrap"></div>' +
                    '</div>' +
                '</div>' +
                '<div class="modal-footer">' +
                    '<button type="button" class="btn btn-ghost" id="cronPickerBtnLimpiar" style="margin-right:auto">Limpiar</button>' +
                    '<button type="button" class="btn btn-ghost" data-act="close">Cancelar</button>' +
                    '<button type="button" class="btn btn-primary" id="cronPickerBtnAplicar">Aplicar</button>' +
                '</div>' +
            '</div>' +
        '</div>';
    }

    function ctxMenuTareasHtml() {
        return '<div id="tareasCtxMenu" class="ctx-menu" role="menu">' +
            '<button type="button" data-action="ver-ejecuciones" role="menuitem"><i class="fa-solid fa-list"></i><span>Ver ejecuciones</span></button>' +
            '<button type="button" data-action="ejecutar-ahora" role="menuitem"><i class="fa-solid fa-play"></i><span>Ejecutar ahora</span></button>' +
            '<button type="button" data-action="toggle-activo" role="menuitem"><i class="fa-solid fa-power-off"></i><span data-label>Desactivar</span></button>' +
            '<div class="ctx-menu-sep"></div>' +
            '<button type="button" data-action="editar" role="menuitem"><i class="fa-solid fa-pen"></i><span>Editar</span></button>' +
            '<button type="button" data-action="eliminar" class="ctx-menu-danger" role="menuitem"><i class="fa-solid fa-trash"></i><span>Eliminar</span></button>' +
        '</div>';
    }

    function ctxMenuEjecucionesHtml() {
        return '<div id="ejecucionesCtxMenu" class="ctx-menu" role="menu">' +
            '<button type="button" data-action="ver-log" role="menuitem"><i class="fa-solid fa-terminal"></i><span>Ver log</span></button>' +
            '<button type="button" data-action="detener" class="ctx-menu-danger" role="menuitem"><i class="fa-solid fa-stop"></i><span>Detener</span></button>' +
        '</div>';
    }

    function confirmTareasHtml() {
        return '<div class="confirm-backdrop" id="tareasConfirm"><div class="confirm-box">' +
            '<div class="confirm-title" id="tareasConfirmTitle">Confirmar</div>' +
            '<div class="confirm-msg" id="tareasConfirmMsg">¿Continuar?</div>' +
            '<div class="confirm-actions">' +
                '<button class="btn btn-ghost" type="button" data-act="cancel">Cancelar</button>' +
                '<button class="btn btn-danger" id="tareasConfirmBtn" type="button">Eliminar</button>' +
            '</div>' +
        '</div></div>';
    }

    // ---- Helpers de estado/duración ----

    function tareaBadgeEstado(estado) {
        if (!estado) return '<span class="badge" style="background:rgba(156,160,164,.18);color:var(--muted)">sin corrida</span>';
        var map = {
            ok:        { cls: 'badge-success', txt: 'OK' },
            error:     { cls: 'badge-danger',  txt: 'Error' },
            timeout:   { cls: 'badge-warn',    txt: 'Timeout' },
            killed:    { cls: 'badge-danger',  txt: 'Killed' },
            corriendo: { cls: 'badge-info',    txt: 'Corriendo' }
        };
        var m = map[estado] || { cls: '', txt: estado };
        return '<span class="badge ' + m.cls + '">' + m.txt + '</span>';
    }

    function formatoDuracion(inicio, fin) {
        if (!inicio) return '—';
        var t0 = new Date(inicio).getTime();
        var t1 = fin ? new Date(fin).getTime() : Date.now();
        if (isNaN(t0) || isNaN(t1)) return '—';
        var s = Math.max(0, Math.floor((t1 - t0) / 1000));
        if (s < 60)    return s + 's';
        var m = Math.floor(s / 60);
        var rs = s % 60;
        if (m < 60)    return m + 'm ' + rs + 's';
        var h = Math.floor(m / 60);
        var rm = m % 60;
        return h + 'h ' + rm + 'm';
    }

    // ---- Confirm ----

    function tareasConfirmar(opts) {
        opts = opts || {};
        return new Promise(function (resolve) {
            var box = document.getElementById('tareasConfirm');
            var titleEl = document.getElementById('tareasConfirmTitle');
            var msgEl   = document.getElementById('tareasConfirmMsg');
            var btnOk   = document.getElementById('tareasConfirmBtn');
            if (!box || !titleEl || !msgEl || !btnOk) { resolve(false); return; }
            titleEl.textContent = opts.title       || 'Confirmar';
            msgEl.textContent   = opts.message     || '¿Continuar?';
            btnOk.textContent   = opts.confirmText || 'Eliminar';
            btnOk.classList.remove('btn-primary', 'btn-danger');
            btnOk.classList.add(opts.danger === false ? 'btn-primary' : 'btn-danger');
            _tareasConfirmResolve = function (v) {
                box.classList.remove('open');
                _tareasConfirmResolve = null;
                resolve(v);
            };
            box.classList.add('open');
        });
    }

    // ---- Listado de tareas ----

    function abrirTareas() {
        var bd = document.getElementById('tareasBackdrop');
        if (!bd) return;
        tareasFiltroQ      = '';
        tareasFiltroActivo = '1';
        var s = document.getElementById('tareasSearch');
        if (s) s.value = '';
        var sc = document.getElementById('tareasSearchClear');
        if (sc) sc.style.display = 'none';
        bd.classList.add('open');
        cargarTareas();
    }

    function cerrarTareas() {
        var bd = document.getElementById('tareasBackdrop');
        if (bd) bd.classList.remove('open');
    }

    function tareasOnSearch(v) {
        tareasFiltroQ = v || '';
        var sc = document.getElementById('tareasSearchClear');
        if (sc) sc.style.display = tareasFiltroQ ? '' : 'none';
        if (_tareasSearchTimer) clearTimeout(_tareasSearchTimer);
        _tareasSearchTimer = setTimeout(cargarTareas, 250);
    }

    function tareasLimpiarBusqueda() {
        var i = document.getElementById('tareasSearch');
        if (i) i.value = '';
        tareasFiltroQ = '';
        var sc = document.getElementById('tareasSearchClear');
        if (sc) sc.style.display = 'none';
        cargarTareas();
    }

    function tareasSetActivo(chip, v) {
        tareasFiltroActivo = v || '';
        var chips = document.querySelectorAll('#tareasEstadoChips .filter-chip');
        for (var i = 0; i < chips.length; i++) chips[i].classList.toggle('active', chips[i] === chip);
        cargarTareas();
    }

    async function cargarTareas() {
        var tbody = document.getElementById('tareasTbody');
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px"><div class="spin"></div></td></tr>';
        var qs = new URLSearchParams();
        if (tareasFiltroQ)      qs.set('q', tareasFiltroQ);
        if (tareasFiltroActivo !== '') qs.set('activo', tareasFiltroActivo);
        qs.set('orden', 'id');
        qs.set('dir', 'desc');
        qs.set('limite', '500');
        try {
            var data = await api('/api/tareas.php?' + qs.toString());
            tareasCache = data.items || [];
            var resumen = document.getElementById('tareasResumen');
            if (resumen && data.stats) {
                var s = data.stats;
                resumen.textContent = s.total + ' · ' + s.activas + ' activas · ' +
                    (s.corriendo || 0) + ' corriendo · ' + (s.errores || 0) + ' con error';
            }
            renderTareas(tareasCache);
        } catch (err) {
            tbody.innerHTML = '<tr><td colspan="7" class="table-empty">✗ ' + e(err.message) + '</td></tr>';
        }
    }

    function renderTareas(rows) {
        var tbody = document.getElementById('tareasTbody');
        if (!tbody) return;
        if (!rows || rows.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="table-empty">Sin tareas para mostrar.</td></tr>';
            return;
        }
        tbody.innerHTML = rows.map(function (t) {
            var estado = tareaBadgeEstado(t.ultimo_estado);
            var run    = t.ultimo_run ? '<span style="font-family:monospace;font-size:.82rem">' + e(t.ultimo_run) + '</span>' :
                                        '<span style="color:var(--muted)">—</span>';
            var toggle = '<label class="toggle-switch" onclick="event.stopPropagation()" style="justify-content:center">' +
                            '<input type="checkbox" data-toggle-activo="' + t.id + '"' + (t.activo ? ' checked' : '') + '>' +
                            '<span class="toggle-track"><span class="toggle-thumb"></span></span>' +
                         '</label>';
            return '<tr class="row-clickable" data-id="' + t.id + '" style="cursor:pointer">' +
                '<td class="td-id">#' + t.id + '</td>' +
                '<td>' +
                    '<div style="font-weight:600">' + e(t.nombre) + '</div>' +
                    (t.descripcion ? '<div style="color:var(--muted);font-size:.78rem">' + e(t.descripcion) + '</div>' : '') +
                '</td>' +
                '<td style="font-family:monospace;font-size:.82rem">' + e(t.cron_expr) + '</td>' +
                '<td>' + estado + '</td>' +
                '<td>' + run + '</td>' +
                '<td style="text-align:center">' + toggle + '</td>' +
                '<td style="text-align:center">' +
                    '<button class="btn-icon-sm" data-menu-tarea="' + t.id + '" onclick="event.stopPropagation()" title="Acciones">' +
                        '<i class="fa-solid fa-bars"></i></button>' +
                '</td>' +
            '</tr>';
        }).join('');
    }

    // ---- Form Alta/Edición ----

    function tareasLimpiarErroresForm() {
        var errs = document.querySelectorAll('#formTareaBackdrop .field-error');
        for (var i = 0; i < errs.length; i++) { errs[i].textContent = ''; errs[i].style.display = 'none'; }
        var invs = document.querySelectorAll('#formTareaBackdrop .input-invalid');
        for (var j = 0; j < invs.length; j++) invs[j].classList.remove('input-invalid');
    }

    function tareasMostrarErrorForm(campo, msg) {
        var err = document.querySelector('#formTareaBackdrop .field-error[data-err="' + campo + '"]');
        if (err) { err.textContent = msg; err.style.display = ''; }
        var map = { Nombre: 'formTareaNombre', Script: 'formTareaScript', Cron: 'formTareaCron' };
        var el = document.getElementById(map[campo]);
        if (el) el.classList.add('input-invalid');
    }

    async function cargarScriptsDisponibles(actualScript) {
        var sel = document.getElementById('formTareaScript');
        if (!sel) return;
        sel.innerHTML = '<option value="">Cargando…</option>';
        try {
            var data  = await api('/api/tareas_scripts_disponibles.php');
            var items = data.items || [];
            var html  = '<option value="">— elegí un script —</option>';
            var incluye = false;
            for (var i = 0; i < items.length; i++) {
                html += '<option value="' + e(items[i]) + '"' +
                        (items[i] === actualScript ? ' selected' : '') + '>' + e(items[i]) + '</option>';
                if (items[i] === actualScript) incluye = true;
            }
            if (actualScript && !incluye) {
                html += '<option value="' + e(actualScript) + '" selected>' + e(actualScript) +
                        ' ⚠️ (no está en cloud/jobs/)</option>';
            }
            sel.innerHTML = html;
        } catch (err) {
            sel.innerHTML = '<option value="">Error al listar scripts.</option>';
            toast(err.message || 'Error al listar scripts.', { error: true });
        }
    }

    function abrirNuevaTarea() {
        _tareasEditandoId = 0;
        tareasLimpiarErroresForm();
        document.getElementById('formTareaTitulo').textContent = 'Nueva tarea';
        document.getElementById('formTareaSub').textContent    = '';
        document.getElementById('formTareaId').value          = '';
        document.getElementById('formTareaNombre').value       = '';
        document.getElementById('formTareaDescripcion').value  = '';
        document.getElementById('formTareaCron').value         = '* * * * *';
        document.getElementById('formTareaTimeout').value      = '300';
        document.getElementById('formTareaRetencion').value    = '7';
        document.getElementById('formTareaOverlap').value      = 'skip';
        document.getElementById('formTareaActivo').value       = '1';
        cargarScriptsDisponibles('');
        var bd = document.getElementById('formTareaBackdrop');
        if (bd) bd.classList.add('open');
        setTimeout(function () { var n = document.getElementById('formTareaNombre'); if (n) n.focus(); }, 60);
    }

    function abrirEditarTarea(id) {
        var t = tareasCache.find(function (x) { return x.id === id; });
        if (!t) return;
        _tareasEditandoId = id;
        tareasLimpiarErroresForm();
        document.getElementById('formTareaTitulo').textContent = 'Editar tarea';
        document.getElementById('formTareaSub').textContent    = '#' + t.id + ' · ' + t.nombre;
        document.getElementById('formTareaId').value           = t.id;
        document.getElementById('formTareaNombre').value       = t.nombre || '';
        document.getElementById('formTareaDescripcion').value  = t.descripcion || '';
        document.getElementById('formTareaCron').value         = t.cron_expr || '';
        document.getElementById('formTareaTimeout').value      = t.timeout_seg || 300;
        document.getElementById('formTareaRetencion').value    = t.retencion_dias || 7;
        document.getElementById('formTareaOverlap').value      = t.overlap || 'skip';
        document.getElementById('formTareaActivo').value       = t.activo ? '1' : '0';
        cargarScriptsDisponibles(t.script || '');
        var bd = document.getElementById('formTareaBackdrop');
        if (bd) bd.classList.add('open');
    }

    async function guardarTarea(ev) {
        if (ev && ev.preventDefault) ev.preventDefault();
        tareasLimpiarErroresForm();
        var id       = parseInt(document.getElementById('formTareaId').value, 10) || 0;
        var nombre   = document.getElementById('formTareaNombre').value.trim();
        var descripcion = document.getElementById('formTareaDescripcion').value.trim();
        var script   = document.getElementById('formTareaScript').value;
        var cron     = document.getElementById('formTareaCron').value.trim();
        var timeout  = parseInt(document.getElementById('formTareaTimeout').value, 10) || 300;
        var retencion = parseInt(document.getElementById('formTareaRetencion').value, 10) || 7;
        var overlap  = document.getElementById('formTareaOverlap').value;
        var activo   = document.getElementById('formTareaActivo').value === '1' ? 1 : 0;

        if (!nombre) { tareasMostrarErrorForm('Nombre', 'El nombre es obligatorio.'); return; }
        if (!script) { tareasMostrarErrorForm('Script', 'Elegí un script del desplegable.'); return; }
        if (!cron)   { tareasMostrarErrorForm('Cron', 'La expresión cron es obligatoria.'); return; }
        if (cron.split(/\s+/).length !== 5) {
            tareasMostrarErrorForm('Cron', 'Deben ser exactamente 5 campos, ej: */5 * * * *.'); return;
        }

        var body = {
            nombre: nombre, descripcion: descripcion, script: script,
            cron_expr: cron, timeout_seg: timeout, retencion_dias: retencion,
            overlap: overlap, activo: activo
        };
        var btn = document.getElementById('formTareaBtnGuardar');
        if (btn) btn.disabled = true;
        try {
            if (id > 0) {
                body.id = id;
                await api('/api/tareas.php', { method: 'PUT', body: body });
                toast('Tarea actualizada.');
            } else {
                await api('/api/tareas.php', { method: 'POST', body: body });
                toast('Tarea creada.');
            }
            document.getElementById('formTareaBackdrop').classList.remove('open');
            await cargarTareas();
        } catch (err) {
            var msg = err.message || 'Error al guardar.';
            if (msg === 'nombre_duplicado' || msg.indexOf('nombre_duplicado') !== -1) {
                tareasMostrarErrorForm('Nombre', 'Ya existe una tarea con ese nombre.');
            } else {
                toast(msg, { error: true, duration: 6000 });
            }
        } finally {
            if (btn) btn.disabled = false;
        }
    }

    async function eliminarTarea(id) {
        var t = tareasCache.find(function (x) { return x.id === id; });
        if (!t) return;
        var ok = await tareasConfirmar({
            title:   'Eliminar tarea',
            message: 'Vas a borrar «' + t.nombre + '» junto con TODO su historial de ejecuciones y los archivos .log en disco. ¿Continuar?',
            confirmText: 'Eliminar',
            danger:  true
        });
        if (!ok) return;
        try {
            var d = await api('/api/tareas.php?id=' + id, { method: 'DELETE' });
            toast('Tarea eliminada (' + (d.archivos_borrados || 0) + ' log(s) borrados).');
            await cargarTareas();
        } catch (err) {
            var msg = err.message || 'Error al eliminar.';
            if (msg === 'ejecucion_en_curso' || msg.indexOf('ejecucion_en_curso') !== -1) {
                toast('La tarea tiene una ejecución en curso. Detenela primero.', { error: true, duration: 6000 });
            } else {
                toast(msg, { error: true });
            }
        }
    }

    async function toggleActivoTarea(id, activo) {
        var t = tareasCache.find(function (x) { return x.id === id; });
        if (!t) return;
        var body = {
            id: id,
            nombre: t.nombre, descripcion: t.descripcion, script: t.script,
            cron_expr: t.cron_expr, timeout_seg: t.timeout_seg,
            retencion_dias: t.retencion_dias, overlap: t.overlap,
            activo: activo ? 1 : 0
        };
        try {
            await api('/api/tareas.php', { method: 'PUT', body: body });
            t.activo = activo ? 1 : 0;
            toast(activo ? 'Tarea activada.' : 'Tarea desactivada.');
        } catch (err) {
            toast(err.message || 'Error al cambiar estado.', { error: true });
            await cargarTareas();
        }
    }

    async function ejecutarAhora(id) {
        var t = tareasCache.find(function (x) { return x.id === id; });
        if (!t) return;
        try {
            var d = await api('/api/tareas_ejecutar.php', { method: 'POST', body: { tarea_id: id } });
            toast('Ejecución #' + d.ejecucion_id + ' iniciada.');
            cargarTareas();
            abrirTerminal(d.ejecucion_id);
        } catch (err) {
            var msg = err.message || 'Error al ejecutar.';
            if (msg === 'ya_esta_corriendo' || msg.indexOf('ya_esta_corriendo') !== -1) {
                toast('La tarea ya está corriendo (overlap=skip).', { error: true, duration: 6000 });
            } else {
                toast(msg, { error: true });
            }
        }
    }

    // ---- Ctx-menu tareas ----

    function abrirMenuContextoTareas(ev, id) {
        var m = document.getElementById('tareasCtxMenu');
        if (!m) return;
        tareasCtxRegistroId = id;
        var t = tareasCache.find(function (x) { return x.id === id; });
        var lbl = m.querySelector('[data-action="toggle-activo"] [data-label]');
        if (lbl) lbl.textContent = (t && t.activo) ? 'Desactivar' : 'Activar';
        var x = ev.clientX, y = ev.clientY;
        m.style.left = x + 'px';
        m.style.top  = y + 'px';
        m.classList.add('open');
        setTimeout(function () {
            var r = m.getBoundingClientRect();
            if (r.right > window.innerWidth)  m.style.left = (window.innerWidth  - r.width  - 8) + 'px';
            if (r.bottom > window.innerHeight) m.style.top  = (window.innerHeight - r.height - 8) + 'px';
        }, 0);
    }

    function cerrarMenuContextoTareas() {
        var m = document.getElementById('tareasCtxMenu');
        if (m) m.classList.remove('open');
        tareasCtxRegistroId = null;
    }

    // ---- Ejecuciones ----

    function abrirEjecuciones(tareaId) {
        var t = tareasCache.find(function (x) { return x.id === tareaId; });
        if (!t) return;
        ejecucionesTareaSel = { id: t.id, nombre: t.nombre };
        ejecucionesFiltroEstado = '';
        var n = document.getElementById('ejecucionesTareaNombre');
        if (n) n.textContent = t.nombre;
        var chips = document.querySelectorAll('#ejecucionesEstadoChips .filter-chip');
        for (var i = 0; i < chips.length; i++) chips[i].classList.toggle('active', chips[i].getAttribute('data-val') === '');
        var bd = document.getElementById('ejecucionesBackdrop');
        if (bd) bd.classList.add('open');
        cargarEjecuciones();
    }

    function cerrarEjecuciones() {
        var bd = document.getElementById('ejecucionesBackdrop');
        if (bd) bd.classList.remove('open');
        ejecucionesTareaSel = null;
        cargarTareas();
    }

    function ejecucionesSetEstado(chip, v) {
        ejecucionesFiltroEstado = v || '';
        var chips = document.querySelectorAll('#ejecucionesEstadoChips .filter-chip');
        for (var i = 0; i < chips.length; i++) chips[i].classList.toggle('active', chips[i] === chip);
        cargarEjecuciones();
    }

    async function cargarEjecuciones() {
        if (!ejecucionesTareaSel) return;
        var tbody = document.getElementById('ejecucionesTbody');
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px"><div class="spin"></div></td></tr>';
        var qs = new URLSearchParams();
        qs.set('tarea_id', String(ejecucionesTareaSel.id));
        if (ejecucionesFiltroEstado) qs.set('estado', ejecucionesFiltroEstado);
        qs.set('limite', '200');
        try {
            var data = await api('/api/tareas_ejecuciones.php?' + qs.toString());
            ejecucionesCache = data.items || [];
            renderEjecuciones(ejecucionesCache);
        } catch (err) {
            tbody.innerHTML = '<tr><td colspan="7" class="table-empty">✗ ' + e(err.message) + '</td></tr>';
        }
    }

    function renderEjecuciones(rows) {
        var tbody = document.getElementById('ejecucionesTbody');
        if (!tbody) return;
        if (!rows || rows.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="table-empty">Sin ejecuciones para mostrar.</td></tr>';
            return;
        }
        tbody.innerHTML = rows.map(function (r) {
            var estado = tareaBadgeEstado(r.estado);
            var msg = r.mensaje ? e(r.mensaje) : '<span style="color:var(--muted)">—</span>';
            return '<tr class="row-clickable" data-eid="' + r.id + '" style="cursor:pointer">' +
                '<td class="td-id">#' + r.id + '</td>' +
                '<td style="font-family:monospace;font-size:.82rem">' + e(r.inicio || '—') + '</td>' +
                '<td>' + formatoDuracion(r.inicio, r.fin) + '</td>' +
                '<td>' + estado + '</td>' +
                '<td style="font-size:.82rem;color:var(--muted)">' + e(r.disparo || '—') + '</td>' +
                '<td style="color:var(--muted);max-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="' + e(r.mensaje || '') + '">' + msg + '</td>' +
                '<td style="text-align:center">' +
                    '<button class="btn-icon-sm" data-menu-ejecucion="' + r.id + '" onclick="event.stopPropagation()" title="Acciones">' +
                        '<i class="fa-solid fa-bars"></i></button>' +
                '</td>' +
            '</tr>';
        }).join('');
    }

    function abrirMenuContextoEjecuciones(ev, id) {
        var m = document.getElementById('ejecucionesCtxMenu');
        if (!m) return;
        ejecucionesCtxRegistroId = id;
        var r = ejecucionesCache.find(function (x) { return x.id === id; });
        var btnDet = m.querySelector('[data-action="detener"]');
        if (btnDet) btnDet.style.display = (r && r.estado === 'corriendo') ? '' : 'none';
        var x = ev.clientX, y = ev.clientY;
        m.style.left = x + 'px';
        m.style.top  = y + 'px';
        m.classList.add('open');
        setTimeout(function () {
            var rr = m.getBoundingClientRect();
            if (rr.right  > window.innerWidth)  m.style.left = (window.innerWidth  - rr.width  - 8) + 'px';
            if (rr.bottom > window.innerHeight) m.style.top  = (window.innerHeight - rr.height - 8) + 'px';
        }, 0);
    }

    function cerrarMenuContextoEjecuciones() {
        var m = document.getElementById('ejecucionesCtxMenu');
        if (m) m.classList.remove('open');
        ejecucionesCtxRegistroId = null;
    }

    async function detenerEjecucion(id) {
        var ok = await tareasConfirmar({
            title:   'Detener ejecución',
            message: 'Vas a detener la ejecución #' + id + '. El proceso recibirá SIGTERM y luego SIGKILL si no muere. ¿Continuar?',
            confirmText: 'Detener',
            danger:  true
        });
        if (!ok) return;
        try {
            var d = await api('/api/tareas_ejecuciones.php', { method: 'POST', body: { id: id, accion: 'detener' } });
            toast(d.killed ? 'Ejecución detenida.' : 'Ejecución marcada como killed (proceso ya no estaba vivo).');
            cargarEjecuciones();
            cargarTareas();
        } catch (err) {
            toast(err.message || 'Error al detener.', { error: true });
        }
    }

    async function detenerEjecucionActual() {
        if (terminalEjecucionActual) await detenerEjecucion(terminalEjecucionActual);
    }

    // ---- Terminal SSE ----

    function terminalMapearEstadoBadge(estado) {
        var el = document.getElementById('terminalEstadoBadge');
        if (!el) return;
        el.classList.remove('badge-info', 'badge-success', 'badge-danger', 'badge-warn');
        var cls = 'badge-info';
        if (estado === 'ok')        cls = 'badge-success';
        else if (estado === 'error')  cls = 'badge-danger';
        else if (estado === 'timeout') cls = 'badge-warn';
        else if (estado === 'killed')  cls = 'badge-danger';
        el.classList.add(cls);
        el.textContent = estado || '—';
    }

    function abrirTerminal(ejecucionId) {
        terminalEjecucionActual = ejecucionId;
        terminalAutoscroll = true;
        var out = document.getElementById('terminalOutput');
        if (out) out.textContent = '';
        var idEl = document.getElementById('terminalEjecucionId');
        if (idEl) idEl.textContent = String(ejecucionId);
        terminalMapearEstadoBadge('corriendo');
        var btnDet = document.getElementById('btnTerminalDetener');
        if (btnDet) btnDet.style.display = '';
        var btnAs = document.getElementById('btnTerminalAutoscroll');
        if (btnAs) btnAs.classList.add('active');
        var bd = document.getElementById('terminalBackdrop');
        if (bd) bd.classList.add('open');

        if (terminalES) { try { terminalES.close(); } catch (_) {} terminalES = null; }
        terminalES = new EventSource('/api/tareas_ejecucion_stream.php?id=' + ejecucionId);

        terminalES.onmessage = function (ev) {
            if (!out) return;
            out.textContent += ev.data + '\n';
            if (terminalAutoscroll) out.scrollTop = out.scrollHeight;
        };
        terminalES.addEventListener('end', function (ev) {
            var estado = ev.data || 'finalizado';
            terminalMapearEstadoBadge(estado);
            if (btnDet) btnDet.style.display = 'none';
            if (out) {
                out.textContent += '\n── ejecución terminada (' + estado + ') ──\n';
                if (terminalAutoscroll) out.scrollTop = out.scrollHeight;
            }
            try { terminalES.close(); } catch (_) {}
            terminalES = null;
            if (ejecucionesTareaSel && document.getElementById('ejecucionesBackdrop').classList.contains('open')) {
                cargarEjecuciones();
            }
            if (document.getElementById('tareasBackdrop').classList.contains('open')) cargarTareas();
        });
        terminalES.onerror = function () {
            if (terminalES) { try { terminalES.close(); } catch (_) {} terminalES = null; }
            terminalMapearEstadoBadge('desconectado');
            if (btnDet) btnDet.style.display = 'none';
        };
    }

    function cerrarTerminal() {
        if (terminalES) { try { terminalES.close(); } catch (_) {} terminalES = null; }
        var bd = document.getElementById('terminalBackdrop');
        if (bd) bd.classList.remove('open');
        terminalEjecucionActual = null;
        if (ejecucionesTareaSel && document.getElementById('ejecucionesBackdrop').classList.contains('open')) {
            cargarEjecuciones();
        }
        if (document.getElementById('tareasBackdrop').classList.contains('open')) cargarTareas();
    }

    function terminalToggleAutoscroll() {
        terminalAutoscroll = !terminalAutoscroll;
        var b = document.getElementById('btnTerminalAutoscroll');
        if (b) b.classList.toggle('active', terminalAutoscroll);
        toast(terminalAutoscroll ? 'Auto-scroll ON' : 'Auto-scroll OFF');
        if (terminalAutoscroll) {
            var out = document.getElementById('terminalOutput');
            if (out) out.scrollTop = out.scrollHeight;
        }
    }

    // ---- Constructor de cron ----

    function cronNombreMesCorto(n) {
        var m = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        return m[n] || String(n);
    }
    function cronNombreDiaCorto(n) {
        var d = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        return d[n] || String(n);
    }
    function cronNombreMes(n) {
        var m = ['', 'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        return m[n] || String(n);
    }
    function cronNombreDia(n) {
        var d = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
        return d[n] || String(n);
    }
    function cronPluralDia(n) {
        var s = cronNombreDia(n);
        return /s$/.test(s) ? ('los ' + s) : ('los ' + s + 's');
    }

    function abrirCronBuilder() {
        var expr = (document.getElementById('formTareaCron').value || '* * * * *').trim();
        cronBuilderPoblar(expr);
        var bd = document.getElementById('cronBuilderBackdrop');
        if (bd) bd.classList.add('open');
    }
    function cerrarCronBuilder() {
        var bd = document.getElementById('cronBuilderBackdrop');
        if (bd) bd.classList.remove('open');
    }
    function cronBuilderPoblar(expr) {
        var partes = (expr || '* * * * *').split(/\s+/);
        while (partes.length < 5) partes.push('*');
        for (var i = 0; i < 5; i++) cronBuilderPoblarCampo(CRON_CAMPOS[i], partes[i]);
        cronBuilderOnChange();
    }
    function cronBuilderPoblarCampo(campo, valor) {
        var modoSel  = document.querySelector('[data-cron-modo="' + campo + '"]');
        var input    = document.querySelector('[data-cron-valor="' + campo + '"]');
        var picker   = document.querySelector('[data-cron-picker="' + campo + '"]');
        if (!modoSel || !input) return;
        var modo = 'star', val = '';
        if (valor === '*' || valor === '') {
            modo = 'star';
        } else if (valor.indexOf('/') !== -1 && valor.split('/')[0] === '*') {
            modo = 'step'; val = valor.split('/')[1] || '';
        } else if (valor.indexOf('-') !== -1) {
            modo = 'range'; val = valor;
        } else if (valor.indexOf(',') !== -1) {
            modo = 'list'; val = valor;
        } else {
            modo = 'exact'; val = valor;
        }
        modoSel.value = modo;
        input.value   = val;
        input.disabled  = (modo === 'star');
        input.placeholder = (modo === 'step') ? 'N (cada)' :
                            (modo === 'range') ? 'N-M' :
                            (modo === 'list') ? 'N,M,O' :
                            (modo === 'exact') ? 'N' : '—';
        if (picker) picker.disabled = (modo === 'star');
    }
    function cronBuilderModoChange(campo) {
        var modoSel = document.querySelector('[data-cron-modo="' + campo + '"]');
        var input   = document.querySelector('[data-cron-valor="' + campo + '"]');
        var picker  = document.querySelector('[data-cron-picker="' + campo + '"]');
        if (!modoSel || !input) return;
        var modo = modoSel.value;
        input.value = '';
        input.disabled  = (modo === 'star');
        input.placeholder = (modo === 'step') ? 'N (cada)' :
                            (modo === 'range') ? 'N-M' :
                            (modo === 'list') ? 'N,M,O' :
                            (modo === 'exact') ? 'N' : '—';
        if (picker) picker.disabled = (modo === 'star');
        cronBuilderOnChange();
        if (modo !== 'star') setTimeout(function () { abrirCronPicker(campo); }, 0);
    }
    function cronBuilderConstruirCampo(campo) {
        var modoSel = document.querySelector('[data-cron-modo="' + campo + '"]');
        var input   = document.querySelector('[data-cron-valor="' + campo + '"]');
        if (!modoSel) return '*';
        var modo = modoSel.value;
        var v = (input && input.value || '').trim();
        if (modo === 'star' || v === '') return '*';
        if (modo === 'exact') return v;
        if (modo === 'step')  return '*/' + v;
        if (modo === 'range') return v;
        if (modo === 'list')  return v;
        return '*';
    }
    function cronBuilderConstruir() {
        return CRON_CAMPOS.map(cronBuilderConstruirCampo).join(' ');
    }
    function cronBuilderOnChange() {
        var expr = cronBuilderConstruir();
        var exprEl = document.getElementById('cronBuilderExpr');
        var descEl = document.getElementById('cronBuilderDesc');
        if (exprEl) exprEl.textContent = expr;
        if (descEl) descEl.textContent = cronDescribir(expr);
    }
    function cronBuilderAplicar() {
        var expr = cronBuilderConstruir();
        var input = document.getElementById('formTareaCron');
        if (input) {
            input.value = expr;
            input.classList.remove('input-invalid');
            var err = document.querySelector('#formTareaBackdrop .field-error[data-err="Cron"]');
            if (err) { err.textContent = ''; err.style.display = 'none'; }
        }
        cerrarCronBuilder();
    }

    function cronDescribir(expr) {
        var partes = (expr || '').split(/\s+/);
        if (partes.length !== 5) return 'Expresión inválida.';
        var m = partes[0], h = partes[1], dom = partes[2], mon = partes[3], dow = partes[4];

        function horario() {
            if (m === '*' && h === '*') return 'Cada minuto';
            if (/^\*\/(\d+)$/.test(m) && h === '*') return 'Cada ' + m.split('/')[1] + ' minutos';
            if (m === '0' && h === '*')  return 'Al minuto 0 de cada hora';
            if (m === '0' && /^\*\/(\d+)$/.test(h)) return 'Cada ' + h.split('/')[1] + ' horas en punto';
            if (/^\d+$/.test(m) && /^\d+$/.test(h)) {
                return 'A las ' + String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
            }
            return 'según patrón ' + m + ' ' + h;
        }
        function describirDow() {
            if (dow === '*') return null;
            if (/^\d+$/.test(dow)) return cronPluralDia(parseInt(dow, 10));
            if (/^(\d+),(\d+)$/.test(dow)) {
                var pp = dow.split(',').map(function (x) { return cronPluralDia(parseInt(x, 10)); });
                return pp.slice(0, -1).join(', ') + ' y ' + pp[pp.length - 1];
            }
            if (/^(\d+)-(\d+)$/.test(dow)) {
                var ab = dow.split('-'); return 'de ' + cronNombreDia(parseInt(ab[0], 10)) + ' a ' + cronNombreDia(parseInt(ab[1], 10));
            }
            return 'según DOW=' + dow;
        }
        var trozos = [horario()];
        if (dom !== '*') trozos.push('el día ' + dom + ' del mes');
        if (mon !== '*' && /^\d+$/.test(mon)) trozos.push('en ' + cronNombreMes(parseInt(mon, 10)));
        else if (mon !== '*') trozos.push('en meses ' + mon);
        var d = describirDow();
        if (d) trozos.push(d);
        else if (dom === '*' && mon === '*') trozos.push('todos los días');
        var s = trozos.join(', ');
        return s.charAt(0).toUpperCase() + s.slice(1) + '.';
    }

    // ---- Picker de valores ----

    function cronPickerRango(modo, cfg) {
        var arr = [];
        if (modo === 'step') {
            for (var i = 1; i <= cfg.max; i++) arr.push(i);
            return arr;
        }
        if (cfg.orden) return cfg.orden.slice();
        for (var j = cfg.min; j <= cfg.max; j++) arr.push(j);
        return arr;
    }
    function cronPickerBoton(n, activo, label, grupo) {
        return '<button type="button" class="filter-chip cron-picker-btn' + (activo ? ' active' : '') +
               '" data-picker-val="' + n + '" data-picker-grupo="' + grupo + '">' + e(label) + '</button>';
    }
    function abrirCronPicker(campo) {
        var modoSel = document.querySelector('[data-cron-modo="' + campo + '"]');
        var input   = document.querySelector('[data-cron-valor="' + campo + '"]');
        if (!modoSel || !input) return;
        var modo = modoSel.value;
        if (modo === 'star') { toast('Modo "Cualquiera" no requiere valor.'); return; }
        var cfg = CRON_PICKER_CFG[campo];
        cronPickerState = {
            campo: campo, modo: modo, cfg: cfg,
            valor1: null, valor2: null, seleccionados: []
        };
        cronPickerPreCargar(input.value.trim());
        var meta = CRON_CAMPO_LABEL[campo];
        document.getElementById('cronPickerEmoji').textContent  = meta.emoji;
        document.getElementById('cronPickerTitulo').textContent = cfg.titulo;
        var hint = 'Modo: ' + (modo === 'exact' ? 'Elegí un único valor.' :
                                modo === 'step'  ? 'Elegí el paso N (cada N unidades).' :
                                modo === 'range' ? 'Elegí Desde y Hasta.' :
                                'Elegí uno o más valores.');
        document.getElementById('cronPickerHint').textContent = hint;
        document.getElementById('cronPickerGrupo2Wrap').style.display = (modo === 'range') ? '' : 'none';
        cronPickerRender();
        var bd = document.getElementById('cronPickerBackdrop');
        if (bd) bd.classList.add('open');
    }
    function cerrarCronPicker() {
        var bd = document.getElementById('cronPickerBackdrop');
        if (bd) bd.classList.remove('open');
        cronPickerState = null;
    }
    function cronPickerPreCargar(actual) {
        if (!cronPickerState || !actual) return;
        var modo = cronPickerState.modo;
        if (modo === 'exact' || modo === 'step') {
            var n = parseInt(actual, 10);
            if (!isNaN(n)) cronPickerState.valor1 = n;
        } else if (modo === 'range') {
            var m = actual.match(/^(\d+)-(\d+)$/);
            if (m) { cronPickerState.valor1 = parseInt(m[1], 10); cronPickerState.valor2 = parseInt(m[2], 10); }
        } else if (modo === 'list') {
            cronPickerState.seleccionados = actual.split(',').map(function (s) { return parseInt(s.trim(), 10); })
                .filter(function (x) { return !isNaN(x); }).sort(function (a, b) { return a - b; });
        }
    }
    function cronPickerRender() {
        if (!cronPickerState) return;
        var st = cronPickerState;
        var arr = cronPickerRango(st.modo, st.cfg);
        var g1 = document.getElementById('cronPickerGrupo1');
        var g2 = document.getElementById('cronPickerGrupo2');
        var esStep = (st.modo === 'step');
        g1.innerHTML = arr.map(function (n) {
            var label = esStep ? String(n) : st.cfg.formato(n);
            var activo = (st.modo === 'exact' || st.modo === 'step') ? (st.valor1 === n) :
                         (st.modo === 'range') ? (st.valor1 === n) :
                         (st.seleccionados.indexOf(n) !== -1);
            return cronPickerBoton(n, activo, label, 1);
        }).join('');
        if (st.modo === 'range') {
            g2.innerHTML = arr.map(function (n) {
                return cronPickerBoton(n, st.valor2 === n, st.cfg.formato(n), 2);
            }).join('');
        }
    }
    function cronPickerSeleccionar(n, grupo) {
        var st = cronPickerState;
        if (!st) return;
        if (st.modo === 'exact' || st.modo === 'step') {
            st.valor1 = (st.valor1 === n) ? null : n;
        } else if (st.modo === 'range') {
            if (grupo === 1) st.valor1 = (st.valor1 === n) ? null : n;
            else             st.valor2 = (st.valor2 === n) ? null : n;
        } else if (st.modo === 'list') {
            var i = st.seleccionados.indexOf(n);
            if (i !== -1) st.seleccionados.splice(i, 1);
            else          st.seleccionados.push(n);
            st.seleccionados.sort(function (a, b) { return a - b; });
        }
        cronPickerRender();
    }
    function cronPickerLimpiar() {
        if (!cronPickerState) return;
        cronPickerState.valor1 = null;
        cronPickerState.valor2 = null;
        cronPickerState.seleccionados = [];
        cronPickerRender();
    }
    function cronPickerAplicar() {
        var st = cronPickerState;
        if (!st) return;
        var v = '';
        if (st.modo === 'exact') {
            if (st.valor1 === null) { toast('Elegí un valor.', { error: true }); return; }
            v = String(st.valor1);
        } else if (st.modo === 'step') {
            if (st.valor1 === null) { toast('Elegí el paso.', { error: true }); return; }
            v = String(st.valor1);
        } else if (st.modo === 'range') {
            if (st.valor1 === null || st.valor2 === null) { toast('Elegí Desde y Hasta.', { error: true }); return; }
            if (st.valor1 > st.valor2) { toast('Desde debe ser ≤ Hasta.', { error: true }); return; }
            v = st.valor1 + '-' + st.valor2;
        } else if (st.modo === 'list') {
            if (!st.seleccionados.length) { toast('Elegí al menos un valor.', { error: true }); return; }
            v = st.seleccionados.join(',');
        }
        var input = document.querySelector('[data-cron-valor="' + st.campo + '"]');
        if (input) input.value = v;
        cerrarCronPicker();
        cronBuilderOnChange();
    }

    // ---- Wire principal ----

    function wireTareasView() {
        var tile = document.getElementById('cfgTileTareas');
        if (tile) tile.addEventListener('click', abrirTareas);

        // Modal listado tareas
        var listBd = document.getElementById('tareasBackdrop');
        if (listBd) {
            listBd.addEventListener('click', function (ev) {
                if (ev.target === listBd || ev.target.closest('[data-act="close"]')) cerrarTareas();
            });
        }

        var s = document.getElementById('tareasSearch');
        if (s) s.addEventListener('input', function () { tareasOnSearch(s.value); });
        var sc = document.getElementById('tareasSearchClear');
        if (sc) sc.addEventListener('click', tareasLimpiarBusqueda);

        var chips = document.querySelectorAll('#tareasEstadoChips .filter-chip');
        for (var i = 0; i < chips.length; i++) {
            (function (chip) {
                chip.addEventListener('click', function () { tareasSetActivo(chip, chip.getAttribute('data-val') || ''); });
            })(chips[i]);
        }
        var btnRef = document.getElementById('tareasBtnRefrescar');
        if (btnRef) btnRef.addEventListener('click', cargarTareas);
        var btnNue = document.getElementById('tareasBtnNueva');
        if (btnNue) btnNue.addEventListener('click', abrirNuevaTarea);

        var tbody = document.getElementById('tareasTbody');
        if (tbody) {
            tbody.addEventListener('click', function (ev) {
                var chk = ev.target.closest('input[data-toggle-activo]');
                if (chk) {
                    var idT = parseInt(chk.getAttribute('data-toggle-activo'), 10);
                    toggleActivoTarea(idT, chk.checked);
                    return;
                }
                var btn = ev.target.closest('[data-menu-tarea]');
                if (btn) {
                    var idM = parseInt(btn.getAttribute('data-menu-tarea'), 10);
                    abrirMenuContextoTareas(ev, idM);
                    return;
                }
                var tr = ev.target.closest('tr[data-id]');
                if (tr) abrirEjecuciones(parseInt(tr.getAttribute('data-id'), 10));
            });
            tbody.addEventListener('contextmenu', function (ev) {
                var tr = ev.target.closest('tr[data-id]');
                if (!tr) return;
                ev.preventDefault();
                abrirMenuContextoTareas(ev, parseInt(tr.getAttribute('data-id'), 10));
            });
        }

        // Ctx menu tareas
        var ctxT = document.getElementById('tareasCtxMenu');
        if (ctxT) {
            ctxT.addEventListener('click', function (ev) {
                var btn = ev.target.closest('button[data-action]');
                if (!btn) return;
                var act = btn.getAttribute('data-action');
                var id  = tareasCtxRegistroId;
                cerrarMenuContextoTareas();
                if (!id) return;
                if (act === 'ver-ejecuciones') abrirEjecuciones(id);
                else if (act === 'ejecutar-ahora') ejecutarAhora(id);
                else if (act === 'toggle-activo') {
                    var t = tareasCache.find(function (x) { return x.id === id; });
                    if (t) toggleActivoTarea(id, !t.activo);
                    cargarTareas();
                }
                else if (act === 'editar') abrirEditarTarea(id);
                else if (act === 'eliminar') eliminarTarea(id);
            });
        }

        // Form
        var formBd = document.getElementById('formTareaBackdrop');
        if (formBd) {
            formBd.addEventListener('click', function (ev) {
                if (ev.target === formBd || ev.target.closest('[data-act="close"]')) formBd.classList.remove('open');
            });
        }
        var form = document.getElementById('formTarea');
        if (form) form.addEventListener('submit', guardarTarea);
        var btnRel = document.getElementById('formTareaScriptReload');
        if (btnRel) btnRel.addEventListener('click', function () {
            var actual = document.getElementById('formTareaScript').value;
            cargarScriptsDisponibles(actual);
        });
        var btnCron = document.getElementById('formTareaCronBuilder');
        if (btnCron) btnCron.addEventListener('click', abrirCronBuilder);

        // Ejecuciones
        var ejBd = document.getElementById('ejecucionesBackdrop');
        if (ejBd) {
            ejBd.addEventListener('click', function (ev) {
                if (ev.target === ejBd || ev.target.closest('[data-act="close"]')) cerrarEjecuciones();
            });
        }
        var ejChips = document.querySelectorAll('#ejecucionesEstadoChips .filter-chip');
        for (var j = 0; j < ejChips.length; j++) {
            (function (chip) {
                chip.addEventListener('click', function () { ejecucionesSetEstado(chip, chip.getAttribute('data-val') || ''); });
            })(ejChips[j]);
        }
        var btnRefEj = document.getElementById('ejecucionesBtnRefrescar');
        if (btnRefEj) btnRefEj.addEventListener('click', cargarEjecuciones);

        var ejTbody = document.getElementById('ejecucionesTbody');
        if (ejTbody) {
            ejTbody.addEventListener('click', function (ev) {
                var btn = ev.target.closest('[data-menu-ejecucion]');
                if (btn) {
                    var idM = parseInt(btn.getAttribute('data-menu-ejecucion'), 10);
                    abrirMenuContextoEjecuciones(ev, idM);
                    return;
                }
                var tr = ev.target.closest('tr[data-eid]');
                if (tr) abrirTerminal(parseInt(tr.getAttribute('data-eid'), 10));
            });
            ejTbody.addEventListener('contextmenu', function (ev) {
                var tr = ev.target.closest('tr[data-eid]');
                if (!tr) return;
                ev.preventDefault();
                abrirMenuContextoEjecuciones(ev, parseInt(tr.getAttribute('data-eid'), 10));
            });
        }

        // Ctx menu ejecuciones
        var ctxE = document.getElementById('ejecucionesCtxMenu');
        if (ctxE) {
            ctxE.addEventListener('click', function (ev) {
                var btn = ev.target.closest('button[data-action]');
                if (!btn) return;
                var act = btn.getAttribute('data-action');
                var id  = ejecucionesCtxRegistroId;
                cerrarMenuContextoEjecuciones();
                if (!id) return;
                if (act === 'ver-log')  abrirTerminal(id);
                else if (act === 'detener') detenerEjecucion(id);
            });
        }

        // Terminal
        var termBd = document.getElementById('terminalBackdrop');
        if (termBd) {
            termBd.addEventListener('click', function (ev) {
                if (ev.target === termBd || ev.target.closest('[data-act="close"]')) cerrarTerminal();
            });
        }
        var btnAs  = document.getElementById('btnTerminalAutoscroll');
        if (btnAs)  btnAs.addEventListener('click', terminalToggleAutoscroll);
        var btnDet = document.getElementById('btnTerminalDetener');
        if (btnDet) btnDet.addEventListener('click', detenerEjecucionActual);

        // Cron builder
        var cbBd = document.getElementById('cronBuilderBackdrop');
        if (cbBd) {
            cbBd.addEventListener('click', function (ev) {
                if (ev.target === cbBd || ev.target.closest('[data-act="close"]')) cerrarCronBuilder();
            });
            cbBd.addEventListener('change', function (ev) {
                var sel = ev.target.closest('[data-cron-modo]');
                if (sel) cronBuilderModoChange(sel.getAttribute('data-cron-modo'));
                var inp = ev.target.closest('[data-cron-valor]');
                if (inp) cronBuilderOnChange();
            });
            cbBd.addEventListener('input', function (ev) {
                var inp = ev.target.closest('[data-cron-valor]');
                if (inp) cronBuilderOnChange();
            });
            cbBd.addEventListener('click', function (ev) {
                var picker = ev.target.closest('[data-cron-picker]');
                if (picker && !picker.disabled) {
                    ev.preventDefault();
                    abrirCronPicker(picker.getAttribute('data-cron-picker'));
                    return;
                }
                var inp = ev.target.closest('[data-cron-valor]');
                if (inp && !inp.disabled) {
                    var campo = inp.getAttribute('data-cron-valor');
                    abrirCronPicker(campo);
                }
            });
        }
        var btnApl = document.getElementById('cronBuilderBtnAplicar');
        if (btnApl) btnApl.addEventListener('click', cronBuilderAplicar);

        // Cron picker
        var pkBd = document.getElementById('cronPickerBackdrop');
        if (pkBd) {
            pkBd.addEventListener('click', function (ev) {
                if (ev.target === pkBd || ev.target.closest('[data-act="close"]')) cerrarCronPicker();
                var b = ev.target.closest('[data-picker-val]');
                if (b) {
                    var n = parseInt(b.getAttribute('data-picker-val'), 10);
                    var g = parseInt(b.getAttribute('data-picker-grupo'), 10) || 1;
                    cronPickerSeleccionar(n, g);
                }
            });
        }
        var btnPkLim = document.getElementById('cronPickerBtnLimpiar');
        if (btnPkLim) btnPkLim.addEventListener('click', cronPickerLimpiar);
        var btnPkApl = document.getElementById('cronPickerBtnAplicar');
        if (btnPkApl) btnPkApl.addEventListener('click', cronPickerAplicar);

        // Confirm
        var conf = document.getElementById('tareasConfirm');
        if (conf) {
            conf.addEventListener('click', function (ev) {
                var cancel = ev.target.closest('[data-act="cancel"]');
                if (cancel && _tareasConfirmResolve) { _tareasConfirmResolve(false); return; }
                if (ev.target === conf && _tareasConfirmResolve) _tareasConfirmResolve(false);
            });
            var btnOk = document.getElementById('tareasConfirmBtn');
            if (btnOk) btnOk.addEventListener('click', function () { if (_tareasConfirmResolve) _tareasConfirmResolve(true); });
        }

        // Cerrar ctx-menus al clickear fuera
        if (!wireTareasView._globalBound) {
            wireTareasView._globalBound = true;
            document.addEventListener('click', function (ev) {
                var ctxT2 = document.getElementById('tareasCtxMenu');
                var ctxE2 = document.getElementById('ejecucionesCtxMenu');
                if (ctxT2 && ctxT2.classList.contains('open') && !ctxT2.contains(ev.target)) cerrarMenuContextoTareas();
                if (ctxE2 && ctxE2.classList.contains('open') && !ctxE2.contains(ev.target)) cerrarMenuContextoEjecuciones();
            }, true);
            window.addEventListener('scroll', function () {
                cerrarMenuContextoTareas(); cerrarMenuContextoEjecuciones();
            }, true);
            window.addEventListener('resize', function () {
                cerrarMenuContextoTareas(); cerrarMenuContextoEjecuciones();
            });

            document.addEventListener('keydown', function (ev) {
                if (ev.key !== 'Escape') return;
                var pk = document.getElementById('cronPickerBackdrop');
                if (pk && pk.classList.contains('open')) { cerrarCronPicker(); ev.stopImmediatePropagation(); return; }
                var cb = document.getElementById('cronBuilderBackdrop');
                if (cb && cb.classList.contains('open')) { cerrarCronBuilder(); ev.stopImmediatePropagation(); return; }
                var ct = document.getElementById('tareasCtxMenu');
                if (ct && ct.classList.contains('open')) { cerrarMenuContextoTareas(); ev.stopImmediatePropagation(); return; }
                var ce = document.getElementById('ejecucionesCtxMenu');
                if (ce && ce.classList.contains('open')) { cerrarMenuContextoEjecuciones(); ev.stopImmediatePropagation(); return; }
                var term = document.getElementById('terminalBackdrop');
                if (term && term.classList.contains('open')) { cerrarTerminal(); ev.stopImmediatePropagation(); return; }
                var fbd = document.getElementById('formTareaBackdrop');
                if (fbd && fbd.classList.contains('open')) { fbd.classList.remove('open'); ev.stopImmediatePropagation(); return; }
                var conf2 = document.getElementById('tareasConfirm');
                if (conf2 && conf2.classList.contains('open')) {
                    if (_tareasConfirmResolve) _tareasConfirmResolve(false);
                    ev.stopImmediatePropagation();
                    return;
                }
                var eb = document.getElementById('ejecucionesBackdrop');
                if (eb && eb.classList.contains('open')) { cerrarEjecuciones(); ev.stopImmediatePropagation(); return; }
                var tb = document.getElementById('tareasBackdrop');
                if (tb && tb.classList.contains('open')) { cerrarTareas(); ev.stopImmediatePropagation(); return; }
            }, true);
        }
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
