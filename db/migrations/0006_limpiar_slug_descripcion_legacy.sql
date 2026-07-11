-- Limpia `slug` y `descripcion` de todas las filas existentes de
-- `roles` y `permisos`.
--
-- Contexto:
--   Los registros actuales de `roles` y `permisos` son los que consume
--   la UI de administración legacy. El proyecto `cloud/` inaugura un
--   nuevo set de roles/permisos que se van a crear desde su ABM y que
--   *sí* van a tener `slug` (identificador machine-readable) y
--   `descripcion` cargados.
--
--   Para poder distinguir a simple vista los registros viejos (legacy,
--   sin slug/descripcion) de los nuevos (cloud, con ambos cargados),
--   esta migración vacía los dos campos en todo lo preexistente. El
--   nombre y el resto de columnas quedan intactos: los legacy siguen
--   funcionando en su UI.
--
--   El campo `slug` ya arranca en NULL en todas las filas por la
--   migración 0005, así que el UPDATE del slug es un no-op preventivo
--   (por si algún entorno ya empezó a asignar slugs manualmente antes
--   de correr esta migración).
--
-- Operación destructiva a nivel de datos: no borra filas, sólo vacía
-- dos columnas. El migrador registra el hash del archivo, así que no
-- se vuelve a ejecutar.

UPDATE `permisos`
   SET `slug`        = NULL,
       `descripcion` = NULL;

UPDATE `roles`
   SET `slug`        = NULL,
       `descripcion` = NULL;
