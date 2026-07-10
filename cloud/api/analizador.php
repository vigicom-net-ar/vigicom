<?php
/**
 * Endpoint del Analizador: estadísticas comerciales del negocio.
 *
 * Devuelve KPIs de facturación, evolución mensual, top de clientes y
 * comprobantes recientes. Trabaja sobre las tablas `comprobantes` y
 * `clientes` del esquema compartido (ver db/schema.sql).
 */

require_once __DIR__ . '/bootstrap.php';
requireAuth();

$pdo = db();

$kpis = [
    'facturado_30d' => (float) $pdo->query(
        "SELECT COALESCE(SUM(total), 0)
           FROM comprobantes
          WHERE emision >= CURDATE() - INTERVAL 30 DAY"
    )->fetchColumn(),

    'comprobantes_30d' => (int) $pdo->query(
        "SELECT COUNT(*)
           FROM comprobantes
          WHERE emision >= CURDATE() - INTERVAL 30 DAY"
    )->fetchColumn(),

    'facturado_anio' => (float) $pdo->query(
        "SELECT COALESCE(SUM(total), 0)
           FROM comprobantes
          WHERE YEAR(emision) = YEAR(CURDATE())"
    )->fetchColumn(),

    'comprobantes_anio' => (int) $pdo->query(
        "SELECT COUNT(*)
           FROM comprobantes
          WHERE YEAR(emision) = YEAR(CURDATE())"
    )->fetchColumn(),

    'clientes_activos' => (int) $pdo->query(
        "SELECT COUNT(*) FROM clientes WHERE situacion = 1"
    )->fetchColumn(),

    'clientes_con_deuda' => (int) $pdo->query(
        "SELECT COUNT(*) FROM clientes WHERE pendientes > 0"
    )->fetchColumn(),
];

$kpis['ticket_promedio_30d'] = $kpis['comprobantes_30d'] > 0
    ? round($kpis['facturado_30d'] / $kpis['comprobantes_30d'], 2)
    : 0;

// Cobros y pagos mensuales: se leen de las cachés `grafico_cobros` /
// `grafico_pagos` (pobladas por analizador_refrescar_cobros.php y
// analizador_refrescar_pagos.php). Los meses históricos no cambian; el
// mes en curso se refresca cuando el usuario presiona "Refrescar".
$cobrosPorMes = $pdo->query("
    SELECT mes,
           cantidad,
           monto AS total
      FROM grafico_cobros
     ORDER BY mes DESC
     LIMIT 12
")->fetchAll();

$cobrosActualizado = $pdo->query(
    "SELECT MAX(actualizado) FROM grafico_cobros"
)->fetchColumn();

$pagosPorMes = $pdo->query("
    SELECT mes,
           cantidad,
           monto AS total
      FROM grafico_pagos
     ORDER BY mes DESC
     LIMIT 12
")->fetchAll();

$pagosActualizado = $pdo->query(
    "SELECT MAX(actualizado) FROM grafico_pagos"
)->fetchColumn();

$topClientes = $pdo->query("
    SELECT c.id,
           COALESCE(c.nombre, c.razon)  AS nombre,
           COUNT(cp.id)                 AS cantidad,
           COALESCE(SUM(cp.total), 0)   AS total
      FROM comprobantes cp
      JOIN clientes c ON c.id = cp.contraparte
     WHERE YEAR(cp.emision) = YEAR(CURDATE())
     GROUP BY c.id, nombre
     ORDER BY total DESC
     LIMIT 10
")->fetchAll();

$recientes = $pdo->query("
    SELECT cp.emision,
           cp.tipo,
           cp.total,
           COALESCE(cp.razon, c.nombre) AS razon
      FROM comprobantes cp
      LEFT JOIN clientes c ON c.id = cp.contraparte
     WHERE cp.emision IS NOT NULL
     ORDER BY cp.emision DESC, cp.id DESC
     LIMIT 10
")->fetchAll();

json_ok([
    'kpis'                    => $kpis,
    'cobros_por_mes'          => $cobrosPorMes,
    'cobros_actualizado'      => $cobrosActualizado,
    'pagos_por_mes'           => $pagosPorMes,
    'pagos_actualizado'       => $pagosActualizado,
    'top_clientes'            => $topClientes,
    'comprobantes_recientes'  => $recientes,
    'now'                     => date('c'),
]);
