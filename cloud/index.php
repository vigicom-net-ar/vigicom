<?php
/**
 * Shell de la SPA de cloud.
 *
 *  - Verifica JWT al cargar: si no hay sesión válida, redirige a /login.php.
 *  - Renderiza el layout (sidebar + topbar + #view) UNA sola vez.
 *  - Toda la navegación posterior la maneja assets/js/app.js con hash routing.
 */

require_once __DIR__ . '/api/bootstrap.php';
$user = requireAuth(); // si no hay token: redirect a /login.php (HTML) o 401 JSON

$version = is_readable(__DIR__ . '/version.txt')
    ? trim((string) file_get_contents(__DIR__ . '/version.txt'))
    : '0.0.dev';
$cssBust = $version === '0.0.dev' ? (string) time() : $version;
?>
<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Vigicom Cloud</title>
    <link rel="stylesheet" href="/assets/css/app.css?v=<?php echo e($cssBust); ?>">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
</head>
<body>
<div class="sidebar-overlay" id="sidebarOverlay"></div>
<div class="layout">
    <aside class="sidebar" id="sidebar">
        <div class="sidebar-logo">
            <img class="sidebar-logo-mark" src="/assets/img/reactor_white.png" alt="Vigicom">
        </div>

        <nav class="sidebar-nav" id="sidebarNav">
            <div class="nav-group-wrap" data-group="inicio">
                <button type="button" class="nav-item nav-group-toggle">
                    <span class="nav-icon">🏁</span>
                    <span class="nav-group-label">Inicio</span>
                    <span class="nav-group-arrow">+</span>
                </button>
                <div class="nav-sub">
                    <a class="nav-item nav-sub-item" href="#/dashboard" data-route="/dashboard">
                        <span class="nav-icon">📊</span><span>Dashboard</span>
                    </a>
                </div>
            </div>

            <div class="nav-group-wrap" data-group="guardia">
                <button type="button" class="nav-item nav-group-toggle">
                    <span class="nav-icon">🛡️</span>
                    <span class="nav-group-label">Guardia</span>
                    <span class="nav-group-arrow">+</span>
                </button>
                <div class="nav-sub">
                    <a class="nav-item nav-sub-item" href="#/disparos" data-route="/disparos">
                        <span class="nav-icon">🚨</span><span>Disparos</span>
                    </a>
                </div>
            </div>

            <div class="nav-group-wrap" data-group="inventario">
                <button type="button" class="nav-item nav-group-toggle">
                    <span class="nav-icon">📦</span>
                    <span class="nav-group-label">Inventario</span>
                    <span class="nav-group-arrow">+</span>
                </button>
                <div class="nav-sub">
                    <a class="nav-item nav-sub-item" href="#/comunidades" data-route="/comunidades">
                        <span class="nav-icon">🏘️</span><span>Comunidades</span>
                    </a>
                    <a class="nav-item nav-sub-item" href="#/casas" data-route="/casas">
                        <span class="nav-icon">🏠</span><span>Casas</span>
                    </a>
                    <a class="nav-item nav-sub-item" href="#/alarmas" data-route="/alarmas">
                        <span class="nav-icon">🚨</span><span>Alarmas</span>
                    </a>
                    <a class="nav-item nav-sub-item" href="#/equipos" data-route="/equipos">
                        <span class="nav-icon">🛰️</span><span>Equipos</span>
                    </a>
                </div>
            </div>

            <div class="nav-group-wrap" data-group="ventas">
                <button type="button" class="nav-item nav-group-toggle">
                    <span class="nav-icon">💰</span>
                    <span class="nav-group-label">Ventas</span>
                    <span class="nav-group-arrow">+</span>
                </button>
                <div class="nav-sub">
                    <a class="nav-item nav-sub-item" href="#/clientes" data-route="/clientes">
                        <span class="nav-icon">👥</span><span>Clientes</span>
                    </a>
                </div>
            </div>

            <div class="nav-group-wrap" data-group="registros">
                <button type="button" class="nav-item nav-group-toggle">
                    <span class="nav-icon">📝</span>
                    <span class="nav-group-label">Registros</span>
                    <span class="nav-group-arrow">+</span>
                </button>
                <div class="nav-sub">
                    <a class="nav-item nav-sub-item" href="#/eventos" data-route="/eventos">
                        <span class="nav-icon">🔔</span><span>Eventos</span>
                    </a>
                    <a class="nav-item nav-sub-item" href="#/senales" data-route="/senales">
                        <span class="nav-icon">📡</span><span>Señales</span>
                    </a>
                    <a class="nav-item nav-sub-item" href="#/reportes" data-route="/reportes">
                        <span class="nav-icon">📋</span><span>Reportes</span>
                    </a>
                </div>
            </div>

            <div class="nav-group-wrap" data-group="seguridad">
                <button type="button" class="nav-item nav-group-toggle">
                    <span class="nav-icon">🔒</span>
                    <span class="nav-group-label">Seguridad</span>
                    <span class="nav-group-arrow">+</span>
                </button>
                <div class="nav-sub">
                    <a class="nav-item nav-sub-item" href="#/usuarios" data-route="/usuarios">
                        <span class="nav-icon">👤</span><span>Usuarios</span>
                    </a>
                    <a class="nav-item nav-sub-item" href="#/roles" data-route="/roles">
                        <span class="nav-icon">🛡️</span><span>Roles</span>
                    </a>
                </div>
            </div>

            <div class="nav-group-wrap" data-group="administracion">
                <button type="button" class="nav-item nav-group-toggle">
                    <span class="nav-icon">🛠️</span>
                    <span class="nav-group-label">Administración</span>
                    <span class="nav-group-arrow">+</span>
                </button>
                <div class="nav-sub">
                    <a class="nav-item nav-sub-item" href="#/config" data-route="/config">
                        <span class="nav-icon">⚙️</span><span>Herramientas</span>
                    </a>
                </div>
            </div>
        </nav>

        <div class="sidebar-footer">v<?php echo e($version); ?> &middot; Vigicom Cloud</div>
    </aside>

    <div class="main">
        <header class="topbar">
            <button class="hamburger" id="hamburger" type="button" aria-label="Menu">☰</button>
            <div class="topbar-title" id="topbarTitle">Dashboard</div>
            <div class="topbar-user">
                <button class="topbar-username" id="userToggle" type="button">
                    <span><?php echo e($user['nombre'] ?? 'Usuario'); ?></span>
                    <span aria-hidden="true">▾</span>
                </button>
                <div class="user-dropdown" id="userDropdown">
                    <a href="/logout.php">Cerrar sesión</a>
                </div>
            </div>
        </header>

        <section class="content" id="view">
            <div style="display:flex;justify-content:center;padding:48px"><div class="spin"></div></div>
        </section>
    </div>
</div>

<div id="toast" class="toast"></div>

<script>
window.__VIGICOM__ = {
    user: <?php echo json_encode([
        'id'     => $user['sub']    ?? null,
        'nombre' => $user['nombre'] ?? '',
        'correo' => $user['correo'] ?? '',
        'roles'  => $user['roles']  ?? '',
    ], JSON_UNESCAPED_UNICODE); ?>,
    version: <?php echo json_encode($version); ?>
};
</script>
<script src="/assets/js/app.js?v=<?php echo e($cssBust); ?>"></script>
</body>
</html>
