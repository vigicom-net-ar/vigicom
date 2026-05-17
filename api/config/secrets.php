<?php
/**
 * Loader compartido de secretos.
 *
 * Por convención del proyecto (ver STACK.md de cada app):
 *  - APP_ENV determina qué .env cargar:
 *      development -> <repo>/.env.development
 *      production  -> <repo>/.env.production
 *  - Aliases legados aceptados: dev -> development, prod -> production.
 *  - Las variables que ya vienen seteadas en el entorno (docker-compose,
 *    Apache SetEnv, etc.) tienen prioridad sobre el .env file.
 *  - Define constantes globales: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS,
 *    DB_CHARSET, APP_ENV, APP_KEY (clave para firmar JWT).
 *
 * Este archivo lo consume cualquier app del repo (cloud, app, firmware-side
 * php, etc.) vía require_once. No lee variables por su cuenta cada app.
 */

if (defined('SECRETS_LOADED')) {
    return;
}
define('SECRETS_LOADED', true);

$envRaw = getenv('APP_ENV');
$envMap = ['dev' => 'development', 'prod' => 'production'];
$env    = $envMap[$envRaw] ?? ($envRaw ?: 'development');

$repoRoot = dirname(__DIR__, 2);
$envFile  = $repoRoot . '/.env.' . $env;

if (is_readable($envFile)) {
    foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#')) {
            continue;
        }
        [$k, $v] = array_pad(explode('=', $line, 2), 2, '');
        $k = trim($k);
        $v = trim($v);
        if ($k === '' || getenv($k) !== false) {
            continue;
        }
        if (strlen($v) >= 2 && (($v[0] === '"' && $v[-1] === '"') || ($v[0] === "'" && $v[-1] === "'"))) {
            $v = substr($v, 1, -1);
        }
        putenv("$k=$v");
        $_ENV[$k]    = $v;
        $_SERVER[$k] = $v;
    }
}

function _secret(string $key, string $default = ''): string
{
    $v = getenv($key);
    return $v === false || $v === '' ? $default : $v;
}

define('APP_ENV',     $env);
define('DB_HOST',     _secret('DB_HOST', '127.0.0.1'));
define('DB_PORT',     _secret('DB_PORT', '3306'));
define('DB_NAME',     _secret('DB_NAME', 'vigicom-dev'));
define('DB_USER',     _secret('DB_USER', 'root'));
define('DB_PASS',     _secret('DB_PASS', ''));
define('DB_CHARSET',  _secret('DB_CHARSET', 'utf8mb4'));

// APP_KEY firma los JWT. En producción se setea por .env.production.
// En desarrollo cae a una clave fija (suficiente para entorno local).
define('APP_KEY', _secret('APP_KEY', 'dev-only-key-change-in-prod-' . substr(md5($repoRoot), 0, 16)));
