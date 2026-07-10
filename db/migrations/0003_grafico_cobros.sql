-- Caché mensual de cobros para el Analizador (módulo Contable).
--
-- Se puebla desde cloud/api/analizador_refrescar.php sumando los recibos
-- emitidos (tipo='RX') en `comprobantes`. Los meses históricos no cambian
-- una vez cerrados; el mes en curso se sobrescribe en cada refresco manual
-- (UPSERT por `mes`).

CREATE TABLE IF NOT EXISTS `grafico_cobros` (
  `id`          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `mes`         VARCHAR(7)    NOT NULL,
  `monto`       DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `cantidad`    INT UNSIGNED  NOT NULL DEFAULT 0,
  `actualizado` DATETIME      NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uq_grafico_cobros_mes` (`mes`)
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci
  COMMENT = 'Cache mensual de cobros (recibos RX) para el Analizador'
  ROW_FORMAT = Dynamic;
