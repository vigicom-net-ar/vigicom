<?php
/**
 * Configuracion general de Vigicom Cloud
 */

// Entorno: 'dev' o 'prod'
define('APP_ENV', getenv('APP_ENV') ?: 'dev');

// URL base de la app
define('APP_URL', getenv('APP_URL') ?: 'https://cloud.vigicom.net.ar');

// Nombre visible
define('APP_NAME', 'Vigicom Cloud');

// Zona horaria
date_default_timezone_set('America/Argentina/Buenos_Aires');

// Errores: visibles solo en dev
if (APP_ENV === 'dev') {
    ini_set('display_errors', '1');
    error_reporting(E_ALL);
} else {
    ini_set('display_errors', '0');
    error_reporting(0);
}

// Base de datos (override por variables de entorno en produccion)
define('DB_HOST', getenv('DB_HOST') ?: '127.0.0.1');
define('DB_PORT', getenv('DB_PORT') ?: '3306');
define('DB_NAME', getenv('DB_NAME') ?: 'vigicom-dev');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '');

// Iniciar sesion una sola vez
if (session_status() === PHP_SESSION_NONE) {
    session_name('vgc_cloud');
    session_set_cookie_params([
        'lifetime' => 0,
        'path'     => '/',
        'secure'   => APP_ENV === 'prod',
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();
}
