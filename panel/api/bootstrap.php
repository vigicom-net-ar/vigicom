<?php
/**
 * Arranque común de todos los endpoints de panel/api.
 *
 * Carga (en orden):
 *   1. Secretos compartidos del repo (.env -> constantes DB_*, APP_KEY_PANEL, APP_ENV).
 *   2. Conexión PDO + getConfigValue.
 *   3. Guard de autenticación (JWT cookie panel).
 *
 * Endpoints protegidos llaman requireAuth() después de incluir esto.
 * Endpoints públicos (login) NO llaman requireAuth.
 */

require_once dirname(__DIR__, 2) . '/env.php';
require_once __DIR__ . '/config/db.php';
require_once dirname(__DIR__) . '/lib/auth_check.php';

if (APP_ENV !== 'production') {
    ini_set('display_errors', '1');
    error_reporting(E_ALL);
} else {
    ini_set('display_errors', '0');
    error_reporting(0);
}
