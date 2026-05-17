<?php
require_once __DIR__ . '/auth.php';
requerir_login();

$user          = usuario_actual();
$pagina_actual = $pagina_actual ?? 'dashboard';
$titulo        = $titulo        ?? 'Dashboard';

function nav_item(string $key, string $actual, string $href, string $label, string $icon): string
{
    $active = $key === $actual ? ' active' : '';
    return '<a class="nav-item' . $active . '" href="' . $href . '">'
         . '<span class="nav-icon">' . $icon . '</span>'
         . '<span>' . $label . '</span></a>';
}
?>
<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title><?php echo e($titulo); ?> &middot; <?php echo e(APP_NAME); ?></title>
    <link rel="stylesheet" href="/assets/css/app.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
</head>
<body>
<div class="sidebar-overlay" id="sidebarOverlay"></div>
<div class="layout">
    <aside class="sidebar" id="sidebar">
        <div class="sidebar-logo">
            <img class="sidebar-logo-mark" src="/assets/img/reactor_white.png" alt="Vigicom">
        </div>

        <nav class="sidebar-nav">
            <?php
            echo nav_item('dashboard',    $pagina_actual, '/dashboard.php',          'Dashboard',    '📊');
            echo nav_item('clientes',     $pagina_actual, '/pages/clientes.php',     'Clientes',     '👥');
            echo nav_item('dispositivos', $pagina_actual, '/pages/dispositivos.php', 'Dispositivos', '🛰️');
            echo nav_item('eventos',      $pagina_actual, '/pages/eventos.php',      'Eventos',      '🔔');
            echo nav_item('reportes',     $pagina_actual, '/pages/reportes.php',     'Reportes',     '📋');
            echo nav_item('usuarios',     $pagina_actual, '/pages/usuarios.php',     'Usuarios',     '👤');
            echo nav_item('config',       $pagina_actual, '/pages/config.php',       'Configuración','⚙️');
            ?>
        </nav>

        <div class="sidebar-footer">
            v1.0 &middot; <?php echo e(APP_NAME); ?>
        </div>
    </aside>

    <div class="main">
        <header class="topbar">
            <button class="hamburger" id="hamburger" type="button" aria-label="Menu">☰</button>
            <div class="topbar-title"><?php echo e($titulo); ?></div>
            <div class="topbar-user" id="topbarUser">
                <button class="topbar-username" id="userToggle" type="button">
                    <span><?php echo e($user['nombre']); ?></span>
                    <span aria-hidden="true">▾</span>
                </button>
                <div class="user-dropdown" id="userDropdown">
                    <a href="/logout.php">Cerrar sesión</a>
                </div>
            </div>
        </header>

        <section class="content">
