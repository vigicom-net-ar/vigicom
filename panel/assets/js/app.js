/**
 * SPA mínima de Vigicom Panel.
 *
 * El shell (index.php) renderiza sidebar + topbar y delega el contenido
 * de #view a este archivo. Por ahora hay una sola vista: Dashboard.
 * Mantenemos el hash routing y el wrapper api() para que sumar nuevas
 * vistas en el futuro siga el mismo patrón que cloud/.
 */

(function () {
    'use strict';

    var ME           = (window.__VIGICOM__ || {}).user || {};
    var view         = document.getElementById('view');
    var topbarTitle  = document.getElementById('topbarTitle');
    var sidebarEl    = document.getElementById('sidebar');
    var overlayEl    = document.getElementById('sidebarOverlay');
    var hamburgerEl  = document.getElementById('hamburger');
    var userToggle   = document.getElementById('userToggle');
    var userDropdown = document.getElementById('userDropdown');
    var toastEl      = document.getElementById('toast');

    var routes = {
        '/dashboard': { title: 'Dashboard', render: renderDashboard }
    };

    function currentRoute() {
        var h = location.hash.replace(/^#/, '');
        return routes[h] ? h : '/dashboard';
    }

    function showSpinner() {
        view.innerHTML = '<div style="display:flex;justify-content:center;padding:48px"><div class="spin"></div></div>';
    }

    function showError(msg) {
        view.innerHTML = '<div class="alert alert-error">' + esc(msg) + '</div>';
    }

    async function navigate() {
        var hash  = currentRoute();
        var route = routes[hash];
        document.title = route.title + ' · Vigicom Panel';
        topbarTitle.textContent = route.title;
        sidebarEl.classList.remove('open');
        overlayEl.classList.remove('active');
        showSpinner();
        try {
            await route.render(view);
        } catch (err) {
            showError(err && err.message ? err.message : String(err));
        }
    }

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

    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (ch) {
            return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[ch];
        });
    }

    var toastTimer = null;
    function toast(msg, isError) {
        toastEl.textContent = msg;
        toastEl.classList.toggle('error', !!isError);
        toastEl.classList.add('show');
        if (toastTimer) clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 2800);
    }

    async function renderDashboard(view) {
        var saludo = (ME.nombre || 'Usuario').split(' ')[0];
        view.innerHTML =
            '<div class="page-header"><div>' +
                '<h1>Buen día, ' + esc(saludo) + '</h1>' +
                '<p>Bienvenido al panel de control de Vigicom.</p>' +
            '</div></div>' +

            '<div class="alert alert-info">' +
                'Esta es la pantalla inicial del panel. Pronto se sumarán los indicadores y accesos directos.' +
            '</div>';
    }

    // -------- Sidebar / topbar wiring -------------------------------------

    if (hamburgerEl) {
        hamburgerEl.addEventListener('click', function () {
            sidebarEl.classList.add('open');
            overlayEl.classList.add('active');
        });
    }
    if (overlayEl) {
        overlayEl.addEventListener('click', function () {
            sidebarEl.classList.remove('open');
            overlayEl.classList.remove('active');
        });
    }

    if (userToggle) {
        userToggle.addEventListener('click', function (ev) {
            ev.stopPropagation();
            userDropdown.classList.toggle('open');
        });
        document.addEventListener('click', function (ev) {
            if (!userDropdown.contains(ev.target) && ev.target !== userToggle) {
                userDropdown.classList.remove('open');
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
