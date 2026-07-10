<?php
/**
 * Helpers compartidos por los endpoints del Migrador DB.
 *
 * El migrador vive en el módulo Herramientas del panel cloud y aplica
 * archivos `.sql` del directorio `db/migrations/` (a nivel repositorio,
 * ya que el esquema es compartido por todos los componentes de Vigicom)
 * contra la BD del entorno actual, registrando cada corrida en la tabla
 * `migraciones` para no re-ejecutarla.
 */

/**
 * Ruta absoluta del directorio de archivos `.sql` que aplica el migrador.
 * Es `db/migrations/` en la raíz del repo — el esquema y las migraciones
 * son compartidos entre cloud/, app de usuarios y firmware.
 */
function migracionesDir(): string
{
    // __DIR__ = cloud/lib  →  dirname(__DIR__, 2) = raíz del repo
    return dirname(__DIR__, 2) . '/db/migrations';
}

/**
 * Valida que $nombre sea un basename plano de un archivo `.sql`.
 * Bloquea path traversal (`..`), separadores de directorio, nombres vacíos
 * y archivos que no sean `.sql`.
 */
function nombreMigracionValido(string $nombre): bool
{
    if ($nombre === '' || strlen($nombre) > 255) {
        return false;
    }
    if (basename($nombre) !== $nombre) {
        return false;
    }
    return (bool) preg_match('/^[A-Za-z0-9._\-]+\.sql$/', $nombre);
}

/**
 * Crea la tabla `migraciones` si no existe. Idempotente — se llama desde
 * `list` y `apply` para que el migrador funcione contra bases pre-existentes
 * que aún no hayan cargado el `schema.sql`.
 */
function asegurarTablaMigraciones(PDO $pdo): void
{
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS `migraciones` (
            `id`       INT(11)      NOT NULL AUTO_INCREMENT,
            `nombre`   VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
            `hash`     VARCHAR(64)  CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
            `aplicada` DATETIME(0)  NULL DEFAULT NULL,
            PRIMARY KEY (`id`) USING BTREE
        ) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic"
    );
}
