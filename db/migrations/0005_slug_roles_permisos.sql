-- Agrega el campo `slug` a los catálogos de seguridad `roles` y `permisos`.
--
-- El slug es un identificador machine-readable (kebab/snake case) que la
-- app usa para referirse a un rol o permiso desde código sin depender del
-- id numérico. Se define como VARCHAR(64) UNIQUE NULL: existentes quedan
-- en NULL hasta que se les asigne desde el ABM, pero cuando tiene valor
-- no puede repetirse.

ALTER TABLE `permisos`
    ADD COLUMN `slug` VARCHAR(64)
        CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci
        NULL DEFAULT NULL
        AFTER `nombre`,
    ADD UNIQUE INDEX `uk_permisos_slug` (`slug`) USING BTREE;

ALTER TABLE `roles`
    ADD COLUMN `slug` VARCHAR(64)
        CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci
        NULL DEFAULT NULL
        AFTER `nombre`,
    ADD UNIQUE INDEX `uk_roles_slug` (`slug`) USING BTREE;
