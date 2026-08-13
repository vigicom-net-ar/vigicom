-- Rehace la tabla `transceptores` con el esquema definitivo del módulo.
--
-- La 0007 original creó la tabla con `puerto_comunicacion`, `puerto_administracion`,
-- `usuario`, `clave` y `comentarios`. Después ese esquema evolucionó para separar
-- credenciales de administración y de transmisión, con lo cual editar 0007 en
-- el lugar habría dejado drift permanente. En vez de eso, esta migración simplemente
-- descarta la tabla y la recrea con la forma final:
--
--   Administración (panel web del broker — RabbitMQ 15672, EMQX 18083…):
--     administracion_puerto, administracion_usuario, administracion_contrasena
--   Transmisión (puerto MQTT que usan las alarmas):
--     transmision_puerto, transmision_usuario, transmision_contrasena
--
-- La regla de "sólo un `predeterminado = 'S'` a la vez" la sigue aplicando la API
-- al guardar (transceptores.php).
--
-- ATENCIÓN: es destructivo — pierde cualquier fila cargada en `transceptores`.
-- Se usa acá porque el módulo es nuevo y en dev/prod todavía no hay datos reales.

DROP TABLE IF EXISTS `transceptores`;
CREATE TABLE `transceptores` (
    `id`                        INT NOT NULL AUTO_INCREMENT,
    `nombre`                    VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
    `host`                      VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
    `administracion_puerto`     INT NULL DEFAULT NULL,
    `administracion_usuario`    VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
    `administracion_contrasena` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
    `transmision_puerto`        INT NULL DEFAULT NULL,
    `transmision_usuario`       VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
    `transmision_contrasena`    VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
    `predeterminado`            VARCHAR(1)   CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT 'N',
    `habilitado`                VARCHAR(1)   CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT 'S',
    PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB
  AUTO_INCREMENT = 1
  CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_general_ci
  ROW_FORMAT = Dynamic;
