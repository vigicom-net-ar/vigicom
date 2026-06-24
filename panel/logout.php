<?php
/**
 * Logout — pensado para el link "Cerrar sesión" del dropdown del topbar.
 * Limpia el JWT cookie y redirige al login.
 */

require_once __DIR__ . '/api/bootstrap.php';
jwt_cookie_clear();
header('Location: /login.php');
exit;
