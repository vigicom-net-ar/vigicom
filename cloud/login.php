<?php
require_once __DIR__ . '/includes/auth.php';

if (usuario_actual()) {
    header('Location: /dashboard.php');
    exit;
}

$error = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!csrf_validar($_POST['csrf'] ?? null)) {
        $error = 'Token de seguridad invalido. Refresca e intenta de nuevo.';
    } else {
        $email = trim((string) ($_POST['email'] ?? ''));
        $pass  = (string) ($_POST['password'] ?? '');

        if ($email === '' || $pass === '') {
            $error = 'Ingresa email y contrasena.';
        } elseif (intentar_login($email, $pass)) {
            header('Location: /dashboard.php');
            exit;
        } else {
            $error = 'Credenciales invalidas.';
        }
    }
}

$token = csrf_token();
?>
<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Ingresar &middot; <?php echo e(APP_NAME); ?></title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/assets/css/app.css">
</head>
<body>
<div class="login-shell">
    <div class="login-card">
        <div class="flex items-center gap-3" style="margin-bottom: 1.25rem;">
            <div class="sidebar__brand-logo">V</div>
            <div>
                <div style="font-weight:700;">Vigicom <span style="color: hsl(var(--primary));">Cloud</span></div>
                <div class="text-muted text-sm">Panel de administracion</div>
            </div>
        </div>

        <h1>Iniciar sesion</h1>
        <p>Ingresa con tu cuenta corporativa.</p>

        <?php if ($error): ?>
            <div class="alert alert--error"><?php echo e($error); ?></div>
        <?php endif; ?>

        <form method="post" action="/login.php" autocomplete="on" novalidate>
            <input type="hidden" name="csrf" value="<?php echo e($token); ?>">

            <div class="form-group" style="margin-bottom: 0.875rem;">
                <label for="email">Email</label>
                <input class="input" type="email" id="email" name="email" required autofocus
                       value="<?php echo e($_POST['email'] ?? ''); ?>">
            </div>

            <div class="form-group" style="margin-bottom: 1.25rem;">
                <label for="password">Contrasena</label>
                <input class="input" type="password" id="password" name="password" required>
            </div>

            <button class="btn btn--primary" type="submit">Ingresar</button>
        </form>

        <div class="text-muted text-sm" style="margin-top: 1.25rem; text-align:center;">
            &copy; <?php echo date('Y'); ?> Vigicom &middot; cloud.vigicom.net.ar
        </div>
    </div>
</div>
</body>
</html>
