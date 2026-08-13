<?php
/**
 * Arranque común de todos los endpoints de cloud/api.
 *
 * Carga (en orden):
 *   1. Secretos compartidos del repo (.env -> constantes DB_*, APP_KEY_CLOUD, APP_ENV).
 *   2. Conexión PDO + getConfigValue.
 *   3. Guard de autenticación (JWT cookie).
 *
 * Endpoints protegidos llaman requireAuth() después de incluir esto.
 * Endpoints públicos (login, version) NO llaman requireAuth.
 */

require_once dirname(__DIR__, 2) . '/env.php';
require_once __DIR__ . '/config/db.php';
require_once dirname(__DIR__) . '/lib/auth_check.php';
require_once dirname(__DIR__) . '/lib/sucesos.php';

// Autoload de dependencias PHP declaradas en cloud/composer.json. El vendor/
// lo instala el entrypoint del contenedor la primera vez. Si no existe todavía
// (por ejemplo primer arranque antes de que composer install termine), no se
// carga y los endpoints que dependan de librerías composer fallarán con
// un mensaje claro cuando intenten usarlas.
$vendorAutoload = dirname(__DIR__) . '/vendor/autoload.php';
if (is_file($vendorAutoload)) {
    require_once $vendorAutoload;
}

// error_reporting queda siempre en E_ALL para que el capturador reciba
// todos los eventos; el display_errors se apaga en producción.
error_reporting(E_ALL);
ini_set('display_errors', APP_ENV !== 'production' ? '1' : '0');

instalarCapturadorDeErrores();
