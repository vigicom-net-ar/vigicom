-- Crea la tabla `transceptores` para administrar los brokers MQTT que
-- se usan para la comunicación de las alarmas.
--
-- Un solo transceptor puede estar marcado como `predeterminado = 'S'`
-- por vez; el resto se aplica desde la API al guardar (el módulo apaga
-- automáticamente el flag en los otros registros).
--
-- Cada broker expone dos canales con credenciales independientes:
--   Administración → panel web del broker (por ejemplo 15672 en RabbitMQ
--                    o 18083 en EMQX). Se usa desde el menú contextual
--                    para abrir la consola en una nueva pestaña.
--   Transmisión    → puerto MQTT propiamente dicho (típicamente 1883
--                    o 8883) que las alarmas usan para reportarse.

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
