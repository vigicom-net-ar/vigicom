-- Caché mensual de pagos para el Analizador (módulo Contable).
--
-- Se puebla desde cloud/api/analizador_refrescar_pagos.php sumando los
-- movimientos con `monto < 0` en `cuentasmovimientos` cuya `cuenta`
-- pertenezca (recursivamente vía `padre`) a las categorías Cajas (0.1.01)
-- o Bancos (0.1.03). Los históricos no cambian; el mes en curso se
-- sobrescribe en cada refresco manual (UPSERT por `mes`).

CREATE TABLE IF NOT EXISTS `grafico_pagos` (
  `id`          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `mes`         VARCHAR(7)    NOT NULL,
  `monto`       DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `cantidad`    INT UNSIGNED  NOT NULL DEFAULT 0,
  `actualizado` DATETIME      NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uq_grafico_pagos_mes` (`mes`)
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci
  COMMENT = 'Cache mensual de pagos (Cajas 0.1.01 / Bancos 0.1.03) para el Analizador'
  ROW_FORMAT = Dynamic;
