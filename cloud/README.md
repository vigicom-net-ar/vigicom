# Vigicom Cloud

Panel de administración principal de Vigicom. Servido desde `cloud.vigicom.net.ar`.

Para detalles de stack y arquitectura ver [STACK.md](STACK.md); para el sistema de diseño visual ver [DESIGN.md](DESIGN.md).

## Stack (resumen)

- PHP 8.2 sin Composer (archivos sueltos, `require_once` explícito).
- MySQL 8.0 / MariaDB.
- HTML + CSS + JS vanilla. Un único `assets/css/app.css` y un único `assets/js/app.js`.
- Sin build step, sin npm, sin frameworks.
- Auth: JWT HS256 firmado con `APP_KEY_CLOUD`, cookie `vigicom_token` (HttpOnly).

## Estructura

```
cloud/
├── index.php             shell SPA (layout + #view + carga app.js)
├── login.php             pantalla de login (única vista server-rendered, fuera del SPA)
├── logout.php            limpia cookie JWT y vuelve a login
├── install.php           setup inicial — BORRAR después de instalar
├── version.txt           se genera en cada deploy
├── api/
│   ├── bootstrap.php     arranque común (secrets + db + auth_check)
│   ├── config/db.php     conexión PDO + getConfigValue()
│   ├── login.php         POST: emite JWT
│   ├── logout.php        POST: limpia JWT
│   ├── me.php            GET: usuario autenticado
│   ├── version.php       GET: versión del deploy
│   ├── dashboard.php     GET: KPIs + alarmas + disparos
│   └── usuarios.php      REST CRUD admin-only
├── lib/
│   ├── auth_check.php    requireAuth() + json_ok()/json_error()
│   ├── jwt.php           HS256 sign/verify minimalista
│   └── crypto.php        cifrado legacy de contraseñas (compatibilidad)
└── assets/
    ├── css/app.css       todos los estilos (ver DESIGN.md)
    ├── js/app.js         router SPA + vistas
    └── img/
```

El esquema de base de datos vive a nivel repo en [../db/schema.sql](../db/schema.sql) porque es compartido por cloud, app y firmware. `install.php` lo lee desde ahí.

## SPA + endpoints

`index.php` es el shell: renderiza una sola vez el layout y delega el contenido de `#view` a `assets/js/app.js`. La navegación es por hash (`#/dashboard`, `#/usuarios`, ...) y cada ruta dispara un `fetch('/api/<recurso>.php')` que devuelve JSON con la forma `{ok: true, data: …}` / `{ok: false, error: '…'}`.

Las URLs server-side son tres y nada más:

| Ruta              | Para qué                                                       |
|-------------------|----------------------------------------------------------------|
| `/`               | Shell SPA. Cualquier ruta interna vive en el `location.hash`.  |
| `/login.php`      | Página de login (a la que `requireAuth()` redirige sin JWT).   |
| `/logout.php`     | Limpia la cookie y vuelve al login.                            |

Todo lo demás pasa por `/api/*.php`.

## Setup en local

1. Crear la base:
   ```sql
   CREATE DATABASE vigicom_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
2. Variables de entorno en `.env.development` (en la raíz del repo): `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS`, `DB_CHARSET`, `APP_KEY_CLOUD`.
3. Levantar el contenedor Docker (puerto 8086) o apuntar un vhost local al directorio `cloud/`.
4. Abrir `http://localhost:8086/install.php` para aplicar el esquema y crear el admin inicial.
5. **Borrar `install.php`.**
6. Login:
   - email: `admin@vigicom.net.ar`
   - pass:  `admin123` (cambiala desde el primer login)

## Convenciones

- Todo endpoint protegido empieza con `requireAuth()` (ver `lib/auth_check.php`).
- Todas las queries van parametrizadas con PDO.
- Salida de cualquier endpoint: `json_ok($data)` o `json_error($msg, $status)`.
- En el SPA, el `fetch` siempre va con `credentials: 'same-origin'` para que la cookie JWT viaje. Si la respuesta es 401, `app.js` redirige a `/login.php`.
