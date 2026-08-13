-- Agrega los topics MQTT a la tabla `transceptores`.
--
-- Cada transceptor (broker) tiene dos topics asociados al canal de transmisión:
--   transmision_entrada → topic al que se suscribe la plataforma para
--                         recibir mensajes de las alarmas.
--   transmision_salida  → topic al que la plataforma publica mensajes
--                         dirigidos a las alarmas.
--
-- Ambos son opcionales (NULL) para no romper registros previos y se pueden
-- editar desde el modal de Alta/Edición del módulo Transceptores.

ALTER TABLE `transceptores`
    ADD COLUMN `transmision_entrada` VARCHAR(255)
        CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci
        NULL DEFAULT NULL
        AFTER `transmision_contrasena`,
    ADD COLUMN `transmision_salida` VARCHAR(255)
        CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci
        NULL DEFAULT NULL
        AFTER `transmision_entrada`;
