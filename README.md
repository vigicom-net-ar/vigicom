# Vigicom

Plataforma de control de alarmas comunitarias. Desde aquí se administran todas las alarmas instaladas en la ciudad y los usuarios que tienen acceso al sistema.

El proyecto incluye además una aplicación desde la cual los usuarios pueden ingresar para controlar el sistema.

## Componentes

- **[cloud/](cloud/)** — Panel de administración central (`cloud.vigicom.net.ar`). Gestión de alarmas, dispositivos, clientes y usuarios del sistema. Ver [cloud/README.md](cloud/README.md) para detalles.
- **App de usuarios** — Aplicación de acceso para los usuarios finales que operan y controlan sus alarmas.

## Stack

- PHP 8.1+ (server-rendered, sin build step)
- MySQL 8.0 / MariaDB
- Docker Compose para entorno local

## Entorno local

```bash
docker compose up -d
```

Servicios expuestos:

- Panel cloud: http://localhost:8090
- MySQL: `localhost:3310` (user `root`, pass `root`, db `vigicom_dev`)

Luego abrir http://localhost:8090/install.php una sola vez para crear las tablas y el usuario admin inicial, y **borrar `install.php`** después.
