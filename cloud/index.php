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
    <link rel="stylesheet" href="/assets/css/style.css?v=<?php echo e($cssBust); ?>">
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
            <a class="nav-item" href="#/dashboard"    data-route="/dashboard">
                <span class="nav-icon">📊</span><span>Dashboard</span>
            </a>
            <a class="nav-item" href="#/clientes"     data-route="/clientes">
                <span class="nav-icon">👥</span><span>Clientes</span>
            </a>
            <a class="nav-item" href="#/dispositivos" data-route="/dispositivos">
                <span class="nav-icon">🛰️</span><span>Dispositivos</span>
            </a>
            <a class="nav-item" href="#/eventos"      data-route="/eventos">
                <span class="nav-icon">🔔</span><span>Eventos</span>
            </a>
            <a class="nav-item" href="#/reportes"     data-route="/reportes">
                <span class="nav-icon">📋</span><span>Reportes</span>
            </a>
            <a class="nav-item" href="#/usuarios"     data-route="/usuarios">
                <span class="nav-icon">👤</span><span>Usuarios</span>
            </a>
            <a class="nav-item" href="#/config"       data-route="/config">
                <span class="nav-icon">⚙️</span><span>Configuración</span>
            </a>
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
