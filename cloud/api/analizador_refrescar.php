<?php
/**
 * Refresca la caché `grafico_cobros` a partir de los recibos (tipo='RX')
 * emitidos en los últimos 12 meses. Se dispara desde el botón "Refrescar"
 * del Analizador.
 *
 * Los históricos no cambian, pero el mes en curso sí, así que se recalcula
 * la ventana completa de 12 meses en cada corrida (upsert por mes).
 */

require_once __DIR__ . '/bootstrap.php';
requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('Método no permitido.', 405);
}

$pdo = db();

$rows = $pdo->query("
    SELECT DATE_FORMAT(emision, '%Y-%m') AS mes,
           COUNT(*)                       AS cantidad,
           COALESCE(SUM(total), 0)        AS monto
      FROM comprobantes
     WHERE tipo = 'RX'
       AND emision IS NOT NULL
       AND emision >= DATE_FORMAT(CURDATE() - INTERVAL 11 MONTH, '%Y-%m-01')
     GROUP BY mes
")->fetchAll();

$byMes = [];
foreach ($rows as $r) {
    $byMes[$r['mes']] = $r;
}

// Genera los 12 meses de la ventana para que aparezcan también los meses sin cobros.
$meses = [];
for ($i = 11; $i >= 0; $i--) {
    $meses[] = date('Y-m', strtotime("first day of -{$i} months"));
}

$upsert = $pdo->prepare("
    INSERT INTO grafico_cobros (mes, monto, cantidad, actualizado)
    VALUES (:mes, :monto, :cantidad, NOW())
    ON DUPLICATE KEY UPDATE
        monto       = VALUES(monto),
        cantidad    = VALUES(cantidad),
        actualizado = VALUES(actualizado)
");

$pdo->beginTransaction();
try {
    foreach ($meses as $mes) {
        $row = $byMes[$mes] ?? ['cantidad' => 0, 'monto' => 0];
        $upsert->execute([
            ':mes'      => $mes,
            ':monto'    => $row['monto'],
            ':cantidad' => $row['cantidad'],
        ]);
    }
    $pdo->commit();
} catch (\Throwable $ex) {
    $pdo->rollBack();
    json_error('No se pudo actualizar la caché: ' . $ex->getMessage(), 500);
}

json_ok([
    'meses_actualizados' => count($meses),
    'actualizado'        => date('c'),
]);
