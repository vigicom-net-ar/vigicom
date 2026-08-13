FROM php:8.2-apache

# Extensiones requeridas por las apps PHP.
# pcntl + posix son para el Programador de tareas (cloud/jobs):
#   - pcntl: handler de SIGTERM en _bootstrap.php para cerrar la fila de
#     tareas_ejecuciones al instante cuando `timeout` dispara.
#   - posix: posix_kill() para el botón "Detener" y el watchdog.
# sockets: usado por php-mqtt/client (cliente MQTT del helper cloud/lib/mqtt.php).
RUN docker-php-ext-install pdo pdo_mysql mysqli pcntl sockets \
 && a2enmod rewrite headers expires

# Composer (para instalar dependencias PHP declaradas en cloud/composer.json)
# y git + unzip que composer necesita para bajar paquetes.
RUN apt-get update \
 && apt-get install -y --no-install-recommends git unzip \
 && rm -rf /var/lib/apt/lists/*
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Directorio de logs por-ejecución del Programador de tareas.
# Lo escriben dos usuarios: www-data (endpoint "Ejecutar ahora") y el
# usuario del scheduler (docker exec desde el crontab del host).
RUN mkdir -p /var/log/vigicom/cloud/ejecuciones \
 && chown -R www-data:www-data /var/log/vigicom \
 && chmod -R 755 /var/log/vigicom

# Permitir que los .htaccess de cada app tomen efecto
RUN sed -i 's|AllowOverride None|AllowOverride All|g' /etc/apache2/apache2.conf

# Apache escucha en 5 puertos (uno por vhost). El default ports.conf (que
# escucha solo 80) se reemplaza, y el 000-default.conf se deshabilita porque
# cloud pasa a tener su propio vhost explicito en vhosts.conf.
COPY ports.conf /etc/apache2/ports.conf
COPY vhosts.conf /etc/apache2/sites-available/010-vigicom-vhosts.conf
RUN a2dissite 000-default && a2ensite 010-vigicom-vhosts

# Entrypoint: instala dependencias composer de cloud/ si falta vendor/ y
# después arranca apache2-foreground (el CMD por defecto de php:8.2-apache).
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["apache2-foreground"]

# php.ini para desarrollo (errores visibles, sin opcache de archivos)
RUN { \
        echo "display_errors=On"; \
        echo "display_startup_errors=On"; \
        echo "error_reporting=E_ALL"; \
        echo "log_errors=On"; \
        echo "opcache.enable=0"; \
        echo "date.timezone=America/Argentina/Buenos_Aires"; \
    } > /usr/local/etc/php/conf.d/zz-dev.ini

WORKDIR /var/www
