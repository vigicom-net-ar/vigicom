<?php
/**
 * Instalador / setup inicial.
 *
 * Ejecuta el esquema (../db/schema.sql, compartido por todo el repo) y crea el
 * usuario admin con contrasena cifrada por el metodo custom (cripto_encriptar).
 * Despues de usar, BORRAR este archivo o restringir su acceso.
 */

require_once __DIR__ . '/api/bootstrap.php';
require_once __DIR__ . '/lib/crypto.php';

$pasos = [];

try {
    $pdo = db();

    $sql = file_get_contents(dirname(__DIR__) . '/db/schema.sql');
    $sql = preg_replace('/CREATE DATABASE[^;]+;/i', '', $sql);
    $sql = preg_replace('/USE[^;]+;/i', '', $sql);

    foreach (array_filter(array_map('trim', explode(';', $sql))) as $stmt) {
        if ($stmt === '') continue;
        $pdo->exec($stmt);
    }
    $pasos[] = 'Esquema aplicado.';

    $correo = 'admin@vigicom.net.ar';
    $pass   = 'admin123';
    $cifr   = cripto_encriptar($pass);

    $existe = $pdo->prepare('SELECT id FROM usuarios WHERE correo = :correo LIMIT 1');
    $existe->execute([':correo' => $correo]);
    $id = $existe->fetchColumn();

    if ($id) {
        $up = $pdo->prepare(
            'UPDATE usuarios
                SET contrasena = :contrasena, estado = 1, roles = :roles, nombre = :nombre
              WHERE id = :id'
        );
        $up->execute([
            ':contrasena' => $cifr,
            ':roles'      => 'admin',
            ':nombre'     => 'Administrador',
            ':id'         => $id,
        ]);
    } else {
        $up = $pdo->prepare(
            'INSERT INTO usuarios (nombre, correo, contrasena, roles, estado, registrado)
             VALUES (:nombre, :correo, :contrasena, :roles, 1, NOW())'
        );
        $up->execute([
            ':nombre'     => 'Administrador',
            ':correo'     => $correo,
            ':contrasena' => $cifr,
            ':roles'      => 'admin',
        ]);
    }
    $pasos[] = "Admin listo: {$correo} / {$pass}";

} catch (Throwable $e) {
    http_response_code(500);
    $err = htmlspecialchars($e->getMessage());
    ?>
    <!doctype html><html lang="es"><head><meta charset="utf-8">
    <title>Error de instalación &middot; Vigicom Cloud</title>
    <link rel="stylesheet" href="/assets/css/app.css"></head>
    <body><div class="login-shell"><div class="login-card">
        <h1>Error de instalación</h1>
        <div class="alert alert-error" style="white-space:pre-wrap; font-family:monospace; font-size:.78rem;"><?php echo $err; ?></div>
        <a class="btn btn-secondary" href="/install.php">Reintentar</a>
    </div></div></body></html>
    <?php
    exit;
}
?>
<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Instalación &middot; Vigicom Cloud</title>
    <link rel="stylesheet" href="/assets/css/app.css">
</head>
<body>
<div class="login-shell">
    <div class="login-card">
        <h1>Instalación completada</h1>
        <p class="lead">Los siguientes pasos se ejecutaron correctamente.</p>

        <dl class="data-list" style="margin-bottom: 16px;">
            <?php foreach ($pasos as $p): ?>
                <div class="data-row">
                    <dd class="data-value"><?php echo htmlspecialchars($p); ?></dd>
                </div>
            <?php endforeach; ?>
        </dl>

        <div class="alert alert-warn">
            <strong>Importante:</strong> borrá <code>install.php</code> del servidor y cambiá la contraseña del admin después del primer login.
        </div>

        <a class="btn btn-primary" href="/login.php" style="width:100%; justify-content:center; padding:10px 16px;">Ir al login</a>
    </div>
</div>
</body>
</html>
