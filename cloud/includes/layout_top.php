<?php
require_once __DIR__ . '/auth.php';
requerir_login();

$user = usuario_actual();
$pagina_actual = $pagina_actual ?? 'dashboard';
$titulo        = $titulo        ?? 'Dashboard';

function nav_item(string $key, string $actual, string $href, string $label, string $svg): string
{
    $active = $key === $actual ? ' is-active' : '';
    return '<a class="sidebar__link' . $active . '" href="' . $href . '">'
         . '<span class="icon">' . $svg . '</span>'
         . '<span>' . $label . '</span></a>';
}

$inicial = strtoupper(mb_substr($user['nombre'] ?? 'U', 0, 1));

$icon_dashboard = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>';
$icon_clientes  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>';
$icon_disp      = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>';
$icon_eventos   = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
$icon_reportes  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/></svg>';
$icon_usuarios  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
$icon_config    = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>';
$icon_logout    = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>';
?>
<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title><?php echo e($titulo); ?> &middot; <?php echo e(APP_NAME); ?></title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/assets/css/app.css">
</head>
<body>
<div class="app-shell">
    <aside class="sidebar">
        <div class="sidebar__brand">
            <div class="sidebar__brand-logo">V</div>
            <div class="sidebar__brand-text">
                <span class="sidebar__brand-name">Vigicom</span>
                <span class="sidebar__brand-sub">Cloud</span>
            </div>
        </div>

        <div class="sidebar__section">General</div>
        <nav class="sidebar__nav">
            <?php
            echo nav_item('dashboard',  $pagina_actual, '/dashboard.php',           'Dashboard',   $icon_dashboard);
            echo nav_item('clientes',   $pagina_actual, '/pages/clientes.php',      'Clientes',    $icon_clientes);
            echo nav_item('dispositivos',$pagina_actual,'/pages/dispositivos.php',  'Dispositivos',$icon_disp);
            echo nav_item('eventos',    $pagina_actual, '/pages/eventos.php',       'Eventos',     $icon_eventos);
            echo nav_item('reportes',   $pagina_actual, '/pages/reportes.php',      'Reportes',    $icon_reportes);
            ?>
        </nav>

        <div class="sidebar__section">Administracion</div>
        <nav class="sidebar__nav">
            <?php
            echo nav_item('usuarios',  $pagina_actual, '/pages/usuarios.php',  'Usuarios',     $icon_usuarios);
            echo nav_item('config',    $pagina_actual, '/pages/config.php',    'Configuracion',$icon_config);
            ?>
        </nav>

        <div class="sidebar__footer">
            <div class="avatar"><?php echo e($inicial); ?></div>
            <div style="min-width:0">
                <div style="font-weight:600; font-size:13px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                    <?php echo e($user['nombre']); ?>
                </div>
                <div class="text-muted text-sm" style="text-transform:capitalize;"><?php echo e($user['rol']); ?></div>
            </div>
            <a class="btn btn--ghost btn--sm" href="/logout.php" title="Cerrar sesion" style="margin-left:auto;">
                <span class="icon" style="width:16px;height:16px;display:inline-flex"><?php echo $icon_logout; ?></span>
            </a>
        </div>
    </aside>

    <main class="main">
        <header class="topbar">
            <div class="topbar__title"><?php echo e(APP_NAME); ?> &middot; <?php echo e($titulo); ?></div>
            <div class="topbar__actions">
                <span class="badge badge--primary">Online</span>
            </div>
        </header>

        <section class="content">
