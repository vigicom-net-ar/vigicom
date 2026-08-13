#!/bin/bash
set -e

# Instala dependencias PHP declaradas en cloud/composer.json cuando falta
# vendor/. Se ejecuta cada vez que el contenedor arranca; si vendor/ ya
# existe (bind-mount desde el host) no hace nada, así el arranque es
# instantáneo. Correr `composer install` acá evita pedirle al desarrollador
# que tenga composer instalado en la máquina host.

if [ -f /var/www/cloud/composer.json ] && [ ! -d /var/www/cloud/vendor ]; then
    echo "[entrypoint] instalando dependencias de cloud/composer.json…"
    cd /var/www/cloud
    composer install --no-dev --optimize-autoloader --no-interaction --no-progress
fi

# Handoff al CMD original (apache2-foreground)
exec "$@"
