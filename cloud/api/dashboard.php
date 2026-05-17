<?php
require_once __DIR__ . '/bootstrap.php';
requireAuth();

$pdo = db();

// Una alarma se considera online si reportó latido en los últimos 10 minutos.
$ALARMA_ONLINE_INTERVAL = '10 MINUTE';

$kpis = [
    'comunidades'       => (int) $pdo->query("SELECT COUNT(*) FROM comunidades")->fetchColumn(),
    'alarmas_online'    => (int) $pdo->query(
        "SELECT COUNT(*) FROM alarmas WHERE latido >= NOW() - INTERVAL {$ALARMA_ONLINE_INTERVAL}"
    )->fetchColumn(),
    'alarmas_total'     => (int) $pdo->query("SELECT COUNT(*) FROM alarmas")->fetchColumn(),
    'disparos_abiertos' => (int) $pdo->query("SELECT COUNT(*) FROM disparos WHERE cerrado IS NULL")->fetchColumn(),
    'disparos_24h'      => (int) $pdo->query("SELECT COUNT(*) FROM disparos WHERE fecha >= NOW() - INTERVAL 1 DAY")->fetchColumn(),
];

$disparos = $pdo->query("
    SELECT d.fecha, d.modo, d.resultado, d.estado, d.comentario, d.cerrado,
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

json_ok([
    'kpis'     => $kpis,
    'alarmas'  => $alarmas,
    'disparos' => $disparos,
    'now'      => date('c'),
    'online_interval_seconds' => 10 * 60,
]);
