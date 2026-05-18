<?php
/**
 * Página de login (HTML).
 *
 * Es la única pantalla "tradicional" del lado server fuera del SPA shell.
 * Se mantiene como página separada porque requireAuth() redirige acá cuando
 * no hay JWT y el request pide HTML (ver lib/auth_check.php).
 *
 * El submit hace POST a /api/login.php por fetch; si responde ok, recarga / .
 */

require_once __DIR__ . '/api/bootstrap.php';

// Si ya hay sesión válida, ir directo al SPA.
if (authUser() !== null) {
    header('Location: /');
    exit;
}

$version = is_readable(__DIR__ . '/version.txt')
    ? trim((string) file_get_contents(__DIR__ . '/version.txt'))
    : '0.0.dev';
$cssBust = $version === '0.0.dev' ? (string) time() : $version;
?>
<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Ingresar &middot; Vigicom Cloud</title>
    <link rel="stylesheet" href="/assets/css/app.css?v=<?php echo e($cssBust); ?>">
</head>
<body>
<div class="login-shell">
    <div class="login-card">
        <div class="login-brand">
            <img src="/assets/img/reactor_white.png" alt="Vigicom">
            <div>
                <div class="login-brand-title">Vigicom Cloud</div>
                <div class="login-brand-sub">Panel de administración</div>
            </div>
        </div>

        <h1>Iniciar sesión</h1>
        <p class="lead">Ingresá con tu cuenta corporativa.</p>

        <div class="alert alert-error" id="loginError" style="display:none;"></div>

        <form id="loginForm" autocomplete="on" novalidate>
            <div class="form-group" style="margin-bottom: 14px;">
                <label for="email">Email</label>
                <input type="email" id="email" name="email" required autofocus>
            </div>

            <div class="form-group" style="margin-bottom: 20px;">
                <label for="password">Contraseña</label>
                <input type="password" id="password" name="password" required>
            </div>

            <button class="btn btn-primary" type="submit" id="loginBtn">Ingresar</button>
        </form>

        <div class="login-foot">
            &copy; <?php echo date('Y'); ?> Vigicom &middot; cloud.vigicom.net.ar
        </div>
    </div>
</div>

<script>
(function () {
    var form = document.getElementById('loginForm');
    var err  = document.getElementById('loginError');
    var btn  = document.getElementById('loginBtn');

    function showError(msg) {
        err.textContent = msg;
        err.style.display = 'block';
    }
    function hideError() {
        err.style.display = 'none';
    }

    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        hideError();
        btn.disabled = true;
        btn.textContent = 'Ingresando…';

        var payload = {
            email:    document.getElementById('email').value.trim(),
            password: document.getElementById('password').value
        };

        try {
            var res = await fetch('/api/login.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify(payload),
                credentials: 'same-origin'
            });
            var body = await res.json().catch(function () { return { ok: false, error: 'Respuesta inválida.' }; });
            if (!res.ok || !body.ok) {
                showError(body.error || 'No se pudo iniciar sesión.');
                btn.disabled = false;
                btn.textContent = 'Ingresar';
                return;
            }
            window.location.href = '/';
        } catch (e) {
            showError('Error de red. Reintentá.');
            btn.disabled = false;
            btn.textContent = 'Ingresar';
        }
    });
})();
</script>
</body>
</html>
