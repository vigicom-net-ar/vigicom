<?php
require_once __DIR__ . '/includes/auth.php';
requerir_login();
require_once __DIR__ . '/config/database.php';

$pagina_actual = 'dashboard';
$titulo        = 'Dashboard';

$pdo = db();

// Una alarma se considera online si reporto latido en los ultimos 10 minutos.
$ALARMA_ONLINE_INTERVAL = '10 MINUTE';

$kpis = [
    'comunidades'      => (int) $pdo->query("SELECT COUNT(*) FROM comunidades")->fetchColumn(),
    'alarmas_on'       => (int) $pdo->query(
        "SELECT COUNT(*) FROM alarmas WHERE latido >= NOW() - INTERVAL {$ALARMA_ONLINE_INTERVAL}"
    )->fetchColumn(),
    'alarmas_tot'      => (int) $pdo->query("SELECT COUNT(*) FROM alarmas")->fetchColumn(),
    'disparos_abiertos'=> (int) $pdo->query("SELECT COUNT(*) FROM disparos WHERE cerrado IS NULL")->fetchColumn(),
    'disparos_24h'     => (int) $pdo->query("SELECT COUNT(*) FROM disparos WHERE fecha >= NOW() - INTERVAL 1 DAY")->fetchColumn(),
];

$disparos = $pdo->query("
    SELECT d.fecha, d.modo, d.resultado, d.estado, d.comentario,
           c.nombre AS comunidad
    FROM disparos d
    LEFT JOIN comunidades c ON c.id = d.comunidad
    ORDER BY d.fecha DESC
    LIMIT 8
")->fetchAll();

$alarmas = $pdo->query("
    SELECT a.nombre, a.domicilio, a.latido, a.estado,
           c.nombre AS comunidad
    FROM alarmas a
    LEFT JOIN comunidades c ON c.id = a.comunidad
    ORDER BY a.latido DESC
    LIMIT 6
")->fetchAll();

function badge_alarma_online(?string $latido, string $intervalo = '10 MINUTE'): string
{
    if (!$latido) return '<span class="badge badge-muted">Sin datos</span>';
    [$cant, $unidad] = explode(' ', $intervalo, 2);
    $segundos = (int) $cant * ($unidad === 'MINUTE' ? 60 : ($unidad === 'HOUR' ? 3600 : 1));
    $online   = (time() - strtotime($latido)) <= $segundos;
    return $online
        ? '<span class="badge badge-success">Online</span>'
        : '<span class="badge badge-danger">Offline</span>';
}

function badge_disparo(?string $resultado, ?string $estado, ?string $cerrado = null): string
{
    if ($cerrado === null && $estado === null && $resultado === null) {
        return '<span class="badge badge-warn">Pendiente</span>';
    }
    $txt = $resultado !== null && $resultado !== ''
        ? $resultado
        : ($estado !== null && $estado !== '' ? $estado : 'Pendiente');
    return '<span class="badge badge-info">' . htmlspecialchars($txt) . '</span>';
}

function tiempo_atras(?string $datetime): string
{
    if (!$datetime) return 'sin datos';
    $diff = time() - strtotime($datetime);
    if ($diff < 60)    return 'hace ' . $diff . 's';
    if ($diff < 3600)  return 'hace ' . floor($diff / 60) . ' min';
    if ($diff < 86400) return 'hace ' . floor($diff / 3600) . ' h';
    return 'hace ' . floor($diff / 86400) . ' d';
}

require __DIR__ . '/includes/layout_top.php';
?>

<div class="page-header">
    <div>
        <h1>Buen día, <?php echo e(explode(' ', $user['nombre'] ?? 'Usuario')[0]); ?></h1>
        <p>Resumen de actividad de la plataforma de alarmas comunitarias.</p>
    </div>
    <div class="page-actions">
        <button class="btn btn-ghost btn-sm" type="button">Exportar</button>
        <button class="btn btn-primary btn-sm" type="button">+ Nueva comunidad</button>
    </div>
</div>

<div class="stats-bar">
    <div class="stat-card">
        <span class="stat-label">Comunidades</span>
        <span class="stat-value orange"><?php echo $kpis['comunidades']; ?></span>
        <span class="text-muted text-sm">Total registradas</span>
    </div>

    <div class="stat-card">
        <span class="stat-label">Alarmas online</span>
        <span class="stat-value green">
            <?php echo $kpis['alarmas_on']; ?>
            <span class="text-muted" style="font-size:.9rem; font-weight:500;">/ <?php echo $kpis['alarmas_tot']; ?></span>
        </span>
        <span class="text-muted text-sm">Latido en los últimos 10 min</span>
    </div>

    <div class="stat-card">
        <span class="stat-label">Disparos abiertos</span>
        <span class="stat-value red"><?php echo $kpis['disparos_abiertos']; ?></span>
        <span class="text-muted text-sm">Sin cierre registrado</span>
    </div>

    <div class="stat-card">
        <span class="stat-label">Disparos 24 hs</span>
        <span class="stat-value orange"><?php echo $kpis['disparos_24h']; ?></span>
        <span class="text-muted text-sm">Total registrados hoy</span>
    </div>
</div>

<div class="dash-grid">
    <div class="table-card">
        <div class="dash-table-header">
            <div>
                <div>Alarmas recientes</div>
                <div class="text-muted text-sm" style="font-weight:400;">Actividad de la flota</div>
            </div>
            <a class="dash-ver-mas" href="/pages/alarmas.php">Ver todas</a>
        </div>
        <table>
            <thead>
                <tr>
                    <th>Alarma</th>
                    <th>Comunidad</th>
                    <th>Estado</th>
                    <th>Último latido</th>
                </tr>
            </thead>
            <tbody>
            <?php if (!$alarmas): ?>
                <tr><td colspan="4" class="table-empty">Sin alarmas cargadas.</td></tr>
            <?php else: foreach ($alarmas as $a): ?>
                <tr>
                    <td>
                        <div class="td-nombre"><?php echo e($a['nombre'] ?? '—'); ?></div>
                        <div class="td-id"><?php echo e($a['domicilio'] ?? ''); ?></div>
                    </td>
                    <td><?php echo e($a['comunidad'] ?? '—'); ?></td>
                    <td><?php echo badge_alarma_online($a['latido'], $ALARMA_ONLINE_INTERVAL); ?></td>
                    <td class="text-muted"><?php echo e(tiempo_atras($a['latido'])); ?></td>
                </tr>
            <?php endforeach; endif; ?>
            </tbody>
        </table>
    </div>

    <div class="table-card">
        <div class="dash-table-header">
            <div>
                <div>Últimos disparos</div>
                <div class="text-muted text-sm" style="font-weight:400;">Eventos de alarma del sistema</div>
            </div>
            <a class="dash-ver-mas" href="/pages/disparos.php">Ver todos</a>
        </div>
        <table>
            <thead>
                <tr>
                    <th>Evento</th>
                    <th>Comunidad</th>
                    <th>Estado</th>
                    <th>Cuándo</th>
                </tr>
            </thead>
            <tbody>
            <?php if (!$disparos): ?>
                <tr><td colspan="4" class="table-empty">Sin disparos registrados.</td></tr>
            <?php else: foreach ($disparos as $ev): ?>
                <tr>
                    <td>
                        <div class="td-nombre"><?php echo e($ev['modo'] ?? 'Disparo'); ?></div>
                        <?php if (!empty($ev['comentario'])): ?>
                            <div class="td-id"><?php echo e($ev['comentario']); ?></div>
                        <?php endif; ?>
                    </td>
                    <td><?php echo e($ev['comunidad'] ?? '—'); ?></td>
                    <td><?php echo badge_disparo($ev['resultado'] ?? null, $ev['estado'] ?? null); ?></td>
                    <td class="text-muted"><?php echo e(tiempo_atras($ev['fecha'])); ?></td>
                </tr>
            <?php endforeach; endif; ?>
            </tbody>
        </table>
    </div>
</div>

<?php require __DIR__ . '/includes/layout_bottom.php'; ?>
