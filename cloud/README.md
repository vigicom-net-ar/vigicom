# Vigicom Cloud

Panel de administracion principal de Vigicom. Servido desde `cloud.vigicom.net.ar`.

## Stack

- PHP 8.1+ (server-rendered)
- MySQL 5.7+ / MariaDB
- HTML + CSS propio inspirado en shadcn/ui (tema morado)
- Sin build step / sin dependencias npm

## Estructura

```
cloud/
├── index.php             redirige a login o dashboard
├── login.php             autenticacion
├── logout.php
├── dashboard.php         dashboard principal (KPIs + actividad)
├── install.php           setup inicial - BORRAR despues de instalar
├── .htaccess             rewrite + headers de seguridad
├── config/
│   ├── config.php        constantes (env, DB, sesiones)
│   └── database.php      conexion PDO singleton
├── includes/
│   ├── auth.php          login, sesiones, CSRF, helper e()
│   ├── layout_top.php    sidebar + topbar
│   └── layout_bottom.php cierre
├── assets/
│   ├── css/app.css       estilos
│   └── js/               (vacio por ahora)
├── pages/                paginas internas (clientes, dispositivos, etc.)
├── api/                  endpoints JSON (vacio)
└── sql/
    └── schema.sql        esquema + datos demo
```

## Setup en local (XAMPP / WAMP)

1. Crea la base de datos (el guion obliga a entrecomillar con backticks):
   ```sql
   CREATE DATABASE `vigicom-dev` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
2. Apunta el DocumentRoot del vhost a la carpeta `cloud/` (no a la raiz del repo).
3. Ajusta credenciales de MySQL en `config/config.php` (o variables de entorno `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`).
4. Abre `http://cloud.local/install.php` para crear las tablas + el admin.
5. **Borra `install.php`**.
6. Ingresa con:
   - email: `admin@vigicom.net.ar`
   - pass:  `admin123` (cambiala desde el primer login)

## Despliegue en `cloud.vigicom.net.ar`

- Subir solo el contenido de `cloud/` al DocumentRoot del subdominio.
- Crear DB, ejecutar `install.php` una vez, borrarlo.
- En `config/config.php` (o variables de entorno del hosting) definir `APP_ENV=prod`.
- Descomentar el bloque de forzado HTTPS en `.htaccess`.

## Convenciones

- Todo output de variables va por `e()` (htmlspecialchars).
- Toda query parametrizada con PDO.
- Sesion configurada con `httponly`, `samesite=Lax`, `secure` en prod.
- CSRF token en todos los forms.
