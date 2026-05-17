<?php
require_once __DIR__ . '/includes/auth.php';
requerir_login();
require_once __DIR__ . '/config/database.php';

$pagina_actual = 'dashboard';
$titulo        = 'Dashboard';

$pdo = db();

// KPIs
$kpis = [
    'clientes_activos'  => (int) $pdo->query("SELECT COUNT(*) FROM clientes WHERE estado = 'activo'")->fetchColumn(),
    'dispositivos_on'   => (int) $pdo->query("SELECT COUNT(*) FROM dispositivos WHERE estado = 'online'")->fetchColumn(),
    'dispositivos_tot'  => (int) $pdo->query("SELECT COUNT(*) FROM dispositivos")->fetchColumn(),
    'eventos_criticos'  => (int) $pdo->query("SELECT COUNT(*) FROM eventos WHERE severidad = 'critico' AND atendido = 0")->fetchColumn(),
    'eventos_24h'       => (int) $pdo->query("SELECT COUNT(*) FROM eventos WHERE creado_en >= NOW() - INTERVAL 1 DAY")->fetchColumn(),
];

// Ultimos eventos
$eventos = $pdo->query("
    SELECT e.tipo, e.severidad, e.mensaje, e.creado_en,
           d.identificador AS dispositivo,
           c.razon_social  AS cliente
    FROM eventos e
    LEFT JOIN dispositivos d ON d.id = e.dispositivo_id
    LEFT JOIN clientes c     ON c.id = e.cliente_id
    ORDER BY e.creado_en DESC
    LIMIT 8
")->fetchAll();

// Dispositivos recientes
$dispositivos = $pdo->query("
    SELECT d.identificador, d.descripcion, d.estado, d.ultimo_reporte,
           c.razon_social AS cliente
    FROM dispositivos d
    LEFT JOIN clientes c ON c.id = d.cliente_id
    ORDER BY d.ultimo_reporte DESC
    LIMIT 6
")->fetchAll();

function badge_severidad(string $sev): string
{
    $map = [
        'info'    => ['badge--info',    'Info'],
        'aviso'   => ['badge--warning', 'Aviso'],
        'alerta'  => ['badge--warning', 'Alerta'],
        'critico' => ['badge--danger',  'Critico'],
    ];
    [$cls, $txt] = $map[$sev] ?? ['badge--muted', ucfirst($sev)];
    return '<span class="badge ' . $cls . '">' . $txt . '</span>';
}

function badge_estado(string $estado): string
{
    $map = [
        'online'        => ['badge--success', 'Online'],
        'offline'       => ['badge--danger',  'Offline'],
        'mantenimiento' => ['badge--warning', 'Mantenimiento'],
    ];
    [$cls, $txt] = $map[$estado] ?? ['badge--muted', ucfirst($estado)];
    return '<span class="badge ' . $cls . '">' . $txt . '</span>';
}

function dot_severidad(string $sev): string
{
    $map = [
        'info'    => 'activity__dot--info',
        'aviso'   => 'activity__dot--warning',
        'alerta'  => 'activity__dot--warning',
        'critico' => 'activity__dot--danger',
    ];
    return $map[$sev] ?? 'activity__dot--info';
}

function tiempo_atras(?string $datetime): string
{
    if (!$datetime) return 'sin datos';
    $diff = time() - strtotime($datetime);
    if ($diff < 60)      return 'hace ' . $diff . 's';
    if ($diff < 3600)    return 'hace ' . floor($diff / 60) . ' min';
    if ($diff < 86400)   return 'hace ' . floor($diff / 3600) . ' h';
    return 'hace ' . floor($diff / 86400) . ' d';
}

require __DIR__ . '/includes/layout_top.php';
?>

<div class="page-header">
    <div>
        <h1>Buen dia, <?php echo e(explode(' ', $user['nombre'])[0]); ?></h1>
        <p>Resumen de actividad en tiempo real de la plataforma.</p>
    </div>
    <div class="flex items-center gap-2">
        <button class="btn btn--outline btn--sm" type="button">Exportar</button>
        <button class="btn btn--primary btn--sm" type="button">+ Nuevo cliente</button>
    </div>
</div>

<div class="grid grid--kpi">
    <div class="card kpi">
        <div class="kpi__icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
        </div>
        <div class="kpi__label">Clientes activos</div>
        <div class="kpi__value"><?php echo $kpis['clientes_activos']; ?></div>
        <div class="kpi__hint">Sobre el total de cuentas</div>
    </div>

    <div class="card kpi">
        <div class="kpi__icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>
        </div>
        <div class="kpi__label">Dispositivos online</div>
        <div class="kpi__value"><?php echo $kpis['dispositivos_on']; ?> <span class="text-muted" style="font-size:14px; font-weight:500;">/ <?php echo $kpis['dispositivos_tot']; ?></span></div>
        <div class="kpi__hint">Reportando en los ultimos minutos</div>
    </div>

    <div class="card kpi">
        <div class="kpi__icon" style="background:hsl(0 75% 95%); color:hsl(0 70% 40%);">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
        <div class="kpi__label">Eventos criticos</div>
        <div class="kpi__value"><?php echo $kpis['eventos_criticos']; ?></div>
        <div class="kpi__hint">Pendientes de atender</div>
    </div>

    <div class="card kpi">
        <div class="kpi__icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 17 9 11 13 15 21 7"/><polyline points="14 7 21 7 21 14"/></svg>
        </div>
        <div class="kpi__label">Eventos 24 hs</div>
        <div class="kpi__value"><?php echo $kpis['eventos_24h']; ?></div>
        <div class="kpi__hint">Total registrados hoy</div>
    </div>
</div>

<div class="grid grid--two">
    <div class="card">
        <div class="card__header">
            <div>
                <div class="card__title">Dispositivos recientes</div>
                <div class="card__sub">Actividad de la flota</div>
            </div>
            <a class="btn btn--ghost btn--sm" href="/pages/dispositivos.php">Ver todos</a>
        </div>
        <div style="overflow-x:auto;">
            <table class="table">
                <thead>
                    <tr>
                        <th>Identificador</th>
                        <th>Cliente</th>
                        <th>Estado</th>
                        <th>Ultimo reporte</th>
                    </tr>
                </thead>
                <tbody>
                <?php if (!$dispositivos): ?>
                    <tr><td colspan="4" class="text-muted" style="text-align:center; padding:1.5rem;">Sin dispositivos cargados.</td></tr>
                <?php else: foreach ($dispositivos as $d): ?>
                    <tr>
                        <td>
                            <div style="font-weight:600;"><?php echo e($d['identificador']); ?></div>
                            <div class="text-muted text-sm"><?php echo e($d['descripcion']); ?></div>
                        </td>
                        <td><?php echo e($d['cliente'] ?? '—'); ?></td>
                        <td><?php echo badge_estado($d['estado']); ?></td>
                        <td class="text-muted"><?php echo e(tiempo_atras($d['ultimo_reporte'])); ?></td>
                    </tr>
                <?php endforeach; endif; ?>
                </tbody>
            </table>
        </div>
    </div>

    <div class="card">
        <div class="card__header">
            <div>
                <div class="card__title">Ultimos eventos</div>
                <div class="card__sub">Alertas y avisos del sistema</div>
            </div>
            <a class="btn btn--ghost btn--sm" href="/pages/eventos.php">Ver todos</a>
        </div>
        <div class="activity">
            <?php if (!$eventos): ?>
                <div class="activity__item text-muted">Sin eventos registrados.</div>
            <?php else: foreach ($eventos as $ev): ?>
                <div class="activity__item">
                    <span class="activity__dot <?php echo dot_severidad($ev['severidad']); ?>"></span>
                    <div class="activity__text">
                        <div class="flex items-center gap-2">
                            <?php echo badge_severidad($ev['severidad']); ?>
                            <strong><?php echo e($ev['tipo']); ?></strong>
                            <?php if (!empty($ev['dispositivo'])): ?>
                                <span class="text-muted text-sm">&middot; <?php echo e($ev['dispositivo']); ?></span>
                            <?php endif; ?>
                        </div>
                        <div class="mt-1"><?php echo e($ev['mensaje']); ?></div>
                        <div class="activity__meta">
                            <?php echo e($ev['cliente'] ?? 'Sin cliente'); ?> &middot; <?php echo e(tiempo_atras($ev['creado_en'])); ?>
                        </div>
                    </div>
                </div>
            <?php endforeach; endif; ?>
        </div>
    </div>
</div>

<?php require __DIR__ . '/includes/layout_bottom.php'; ?>
