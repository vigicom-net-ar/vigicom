-- Programador de tareas: catálogo de tareas automáticas + historial de ejecuciones.
--
-- El scheduler (cloud/jobs/_scheduler.php) es invocado por cron cada minuto,
-- lee `tareas` para decidir qué disparar y registra cada corrida en
-- `tareas_ejecuciones` (con su archivo .log en disco).

CREATE TABLE IF NOT EXISTS `tareas` (
  `id`                 INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nombre`             VARCHAR(120) NOT NULL,
  `descripcion`        VARCHAR(255) NULL DEFAULT NULL,
  `script`             VARCHAR(255) NOT NULL,
  `cron_expr`          VARCHAR(80)  NOT NULL,
  `activo`             TINYINT(1)   NOT NULL DEFAULT 1,
  `overlap`            ENUM('skip','allow') NOT NULL DEFAULT 'skip',
  `timeout_seg`        INT UNSIGNED NOT NULL DEFAULT 300,
  `retencion_dias`     INT UNSIGNED NOT NULL DEFAULT 7,
  `ultimo_run`         DATETIME     NULL DEFAULT NULL,
  `ultimo_estado`      ENUM('ok','error','timeout','killed','corriendo') NULL DEFAULT NULL,
  `ultimo_error`       TEXT         NULL,
  `fecha_creacion`     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_modificacion` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uq_tareas_nombre` (`nombre`),
  KEY `idx_tareas_activo_ultimo_run` (`activo`, `ultimo_run`)
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

CREATE TABLE IF NOT EXISTS `tareas_ejecuciones` (
  `id`        INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `tarea_id`  INT UNSIGNED NOT NULL,
  `pid`       INT UNSIGNED NULL DEFAULT NULL,
  `inicio`    DATETIME     NOT NULL,
  `fin`       DATETIME     NULL DEFAULT NULL,
  `estado`    ENUM('corriendo','ok','error','timeout','killed') NOT NULL DEFAULT 'corriendo',
  `exit_code` INT          NULL DEFAULT NULL,
  `mensaje`   TEXT         NULL,
  `log_path`  VARCHAR(255) NULL DEFAULT NULL,
  `disparo`   ENUM('scheduler','manual') NOT NULL DEFAULT 'scheduler',
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_tareas_ej_tarea_id` (`tarea_id`, `id`),
  KEY `idx_tareas_ej_estado` (`estado`),
  KEY `idx_tareas_ej_inicio` (`inicio`)
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;
