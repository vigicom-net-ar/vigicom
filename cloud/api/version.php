<?php
require_once __DIR__ . '/bootstrap.php';

$file = dirname(__DIR__) . '/version.txt';
$v    = is_readable($file) ? trim((string) file_get_contents($file)) : '0.0.dev';
json_ok(['version' => $v]);
