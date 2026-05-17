<?php
/**
 * Instalador / setup inicial.
 *
 * Ejecuta el esquema (sql/schema.sql) y crea el usuario admin con un hash real.
 * Despues de usar, BORRAR este archivo o restringir su acceso.
 */

require_once __DIR__ . '/config/database.php';

$pasos = [];

try {
    $pdo = db();

    // 1. Ejecutar schema.sql
    $sql = file_get_contents(__DIR__ . '/sql/schema.sql');
    // Quitamos el CREATE DATABASE / USE -- asumimos que ya estamos conectados a la BD correcta
    $sql = preg_replace('/CREATE DATABASE[^;]+;/i', '', $sql);
    $sql = preg_replace('/USE[^;]+;/i', '', $sql);

    foreach (array_filter(array_map('trim', explode(';', $sql))) as $stmt) {
        if ($stmt === '') continue;
        $pdo->exec($stmt);
    }
    $pasos[] = 'Esquema aplicado.';

    // 2. Crear / actualizar admin con hash real
    $email = 'admin@vigicom.net.ar';
    $pass  = 'admin123'; // CAMBIAR despues del primer login
    $hash  = password_hash($pass, PASSWORD_BCRYPT);

    $up = $pdo->prepare(
        "INSERT INTO usuarios (nombre, email, password_hash, rol)
         VALUES ('Administrador', :email, :hash, 'admin')
         ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), activo = 1"
    );
    $up->execute([':email' => $email, ':hash' => $hash]);
    $pasos[] = "Admin listo: {$email} / {$pass}";

} catch (Throwable $e) {
    http_response_code(500);
    echo '<pre style="font-family:monospace;color:#b00020;">Error: ' . htmlspecialchars($e->getMessage()) . '</pre>';
    exit;
}
?>
<!doctype html>
<html lang="es"><head><meta charset="utf-8"><title>Instalacion - Vigicom Cloud</title>
<link rel="stylesheet" href="/assets/css/app.css"></head>
<body style="padding:2rem; max-width:640px; margin:0 auto;">
    <div class="card" style="padding: 1.5rem;">
        <h1 style="margin-top:0;">Instalacion completada</h1>
        <ul>
            <?php foreach ($pasos as $p): ?>
                <li><?php echo htmlspecialchars($p); ?></li>
            <?php endforeach; ?>
        </ul>
        <div class="alert alert--error" style="background:hsl(38 92% 94%); color:hsl(38 80% 32%); border-color:hsl(38 80% 80%);">
            <strong>IMPORTANTE:</strong> borra <code>install.php</code> del servidor y cambia la contrasena del admin.
        </div>
        <a class="btn btn--primary" href="/login.php">Ir al login</a>
    </div>
</body></html>
