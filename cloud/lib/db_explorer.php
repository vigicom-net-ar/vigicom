<?php
/**
 * Helpers compartidos del Explorador DB (Herramientas).
 *
 * Todos los endpoints (list/describe/records/update) reutilizan estas
 * funciones para validar identificadores contra INFORMATION_SCHEMA
 * antes de meterlos en SQL.
 */

/**
 * Devuelve el nombre de la base activa (SELECT DATABASE()).
 */
function dbexpDatabaseActual(PDO $pdo): string
{
    return (string) $pdo->query('SELECT DATABASE()')->fetchColumn();
}

/**
 * Backtick-cita un identificador (tabla o columna) para MySQL,
 * doblando cualquier ` interno. NO valida — sólo escapa.
 */
function dbexpQuoteIdent(string $ident): string
{
    return '`' . str_replace('`', '``', $ident) . '`';
}

/**
 * Valida que la tabla exista en la base activa como BASE TABLE.
 * Devuelve el nombre canónico (tal como está en INFORMATION_SCHEMA),
 * o null si no existe.
 */
function dbexpResolverTabla(PDO $pdo, string $tabla): ?string
{
    $db = dbexpDatabaseActual($pdo);
    $stmt = $pdo->prepare(
        'SELECT TABLE_NAME
           FROM INFORMATION_SCHEMA.TABLES
          WHERE TABLE_SCHEMA = :db
            AND TABLE_TYPE   = ' . "'BASE TABLE'" . '
            AND TABLE_NAME   = :tabla
          LIMIT 1'
    );
    $stmt->execute([':db' => $db, ':tabla' => $tabla]);
    $r = $stmt->fetchColumn();
    return $r === false ? null : (string) $r;
}

/**
 * Valida que la columna exista en la tabla dada.
 * Devuelve el nombre canónico de la columna, o null si no existe.
 */
function dbexpResolverColumna(PDO $pdo, string $tabla, string $columna): ?string
{
    $db = dbexpDatabaseActual($pdo);
    $stmt = $pdo->prepare(
        'SELECT COLUMN_NAME
           FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_SCHEMA = :db
            AND TABLE_NAME   = :tabla
            AND COLUMN_NAME  = :columna
          LIMIT 1'
    );
    $stmt->execute([':db' => $db, ':tabla' => $tabla, ':columna' => $columna]);
    $r = $stmt->fetchColumn();
    return $r === false ? null : (string) $r;
}

/**
 * Metadata completa de columnas de una tabla (orden por posición).
 *
 * Devuelve un array de arrays con:
 *   nombre, tipo (COLUMN_TYPE crudo), nullable ('YES'|'NO'),
 *   clave ('PRI'|'UNI'|'MUL'|''), predeterminado, extra, comentario, posicion.
 */
function dbexpColumnasDeTabla(PDO $pdo, string $tabla): array
{
    $db = dbexpDatabaseActual($pdo);
    $stmt = $pdo->prepare(
        'SELECT
            ORDINAL_POSITION  AS posicion,
            COLUMN_NAME       AS nombre,
            COLUMN_TYPE       AS tipo,
            IS_NULLABLE       AS nullable,
            COLUMN_KEY        AS clave,
            COLUMN_DEFAULT    AS predeterminado,
            EXTRA             AS extra,
            COLUMN_COMMENT    AS comentario
          FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = :db
           AND TABLE_NAME   = :tabla
         ORDER BY ORDINAL_POSITION'
    );
    $stmt->execute([':db' => $db, ':tabla' => $tabla]);
    return $stmt->fetchAll();
}

/**
 * Trunca strings de más de 500 caracteres, marcando el corte.
 * Sólo toca strings — números, null, bool pasan tal cual.
 */
function dbexpTruncarValor($v)
{
    if (!is_string($v)) return $v;
    if (mb_strlen($v, 'UTF-8') <= 500) return $v;
    return mb_substr($v, 0, 500, 'UTF-8') . '… (truncado)';
}
