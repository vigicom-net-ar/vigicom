-- Visor de sucesos: tabla de log de actividad que escriben los módulos.
--
-- No se llama `sucesos` porque ese nombre ya lo usa una tabla del dominio
-- (tracker de incidentes/casos, 1M+ filas). El visor de Herramientas lee
-- exclusivamente esta tabla.

CREATE TABLE IF NOT EXISTS `sucesos_log` (
  `id`      int(0)       NOT NULL AUTO_INCREMENT,
  `fecha`   datetime(0)  NULL DEFAULT NULL,
  `origen`  varchar(50)  CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `tipo`    varchar(20)  CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'info',
  `detalle` text         CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;
