<?php
/**
 * Refresca la caché `grafico_pagos` a partir de los movimientos con
 * `monto < 0` (salidas) en `cuentasmovimientos` cuyas cuentas cuelguen
 * de las categorías Cajas (`cuentas.tipo = '0.1.01'`) o Bancos
 * (`cuentas.tipo = '0.1.03'`) — recorrido recursivo por `padre`.
 *
 * Se dispara desde el botón "Refrescar" de la tarjeta Pagos por mes del
 * Analizador. Los históricos no cambian, pero el mes en curso sí, así
 * que se recalcula la ventana completa de 12 meses (upsert por mes).
 */

require_once __DIR__ . '/bootstrap.php';
requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('Método no permitido.', 405);
}

$pdo = db();

$rows = $pdo->query("
    WITH RECURSIVE cuentas_pagos AS (
        SELECT id
          FROM cuentas
         WHERE tipo IN ('0.1.01', '0.1.03')
        UNION ALL
        SELECT c.id
          FROM cuentas c
          JOIN cuentas_pagos p ON c.padre = p.id
    )
    SELECT DATE_FORMAT(m.fecha, '%Y-%m') AS mes,
           COUNT(*)                       AS cantidad,
           COALESCE(SUM(ABS(m.monto)), 0) AS monto
      FROM cuentasmovimientos m
     WHERE m.cuenta IN (SELECT id FROM cuentas_pagos)
       AND m.monto < 0
       AND m.fecha IS NOT NULL
       AND m.fecha >= DATE_FORMAT(CURDATE() - INTERVAL 11 MONTH, '%Y-%m-01')
     GROUP BY mes
")->fetchAll();

$byMes = [];
foreach ($rows as $r) {
    $byMes[$r['mes']] = $r;
}

// Genera los 12 meses de la ventana para que aparezcan también los meses sin pagos.
$meses = [];
for ($i = 11; $i >= 0; $i--) {
    $meses[] = date('Y-m', strtotime("first day of -{$i} months"));
}

$upsert = $pdo->prepare("
    INSERT INTO grafico_pagos (mes, monto, cantidad, actualizado)
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
