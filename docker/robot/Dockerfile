FROM php:8.2-apache-bookworm

# OS: cron + supervisor + python (motor) + curl (cronjobs que llamen al cloud
# por HTTP, healthchecks, etc).
RUN apt-get update && apt-get install -y --no-install-recommends \
        cron \
        supervisor \
        python3 \
        python3-pip \
        curl \
        ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Mismas extensiones PHP que el contenedor cloud, para que los scripts de
# cronjobs tengan acceso a MySQL con el mismo runtime.
RUN docker-php-ext-install pdo pdo_mysql mysqli \
 && a2enmod rewrite headers expires

# Permitir que cronjobs/.htaccess (si existe) tome efecto (mismo patron que cloud).
RUN sed -i 's|AllowOverride None|AllowOverride All|g' /etc/apache2/apache2.conf

# DocumentRoot apunta a cronjobs/ para que un GET HTTP al puerto 80 del
# contenedor (mapeado al 8091 del host) ejecute robot.php?mod=... directo:
#   http://localhost:8091/robot.php?mod=alarmas_online
RUN sed -ri -e 's!/var/www/html!/var/www/robot/cronjobs!g' \
        /etc/apache2/sites-available/000-default.conf

# php.ini con la misma zona horaria que cloud.
RUN { \
        echo "date.timezone=America/Argentina/Buenos_Aires"; \
        echo "log_errors=On"; \
        echo "error_reporting=E_ALL"; \
    } > /usr/local/etc/php/conf.d/zz-robot.ini

# Dependencias Python del motor. Si agregas/cambias paquetes, rebuild:
#   docker compose up -d --build robot
COPY requirements.txt /tmp/requirements.txt
RUN pip3 install --no-cache-dir --break-system-packages -r /tmp/requirements.txt

# Supervisord administra los tres procesos del contenedor (apache + cron + motor).
COPY supervisord.conf /etc/supervisor/conf.d/vigicom-robot.conf

# Crontab del contenedor. El daemon lee automaticamente todo lo que este
# en /etc/cron.d/. El nombre del archivo solo admite letras, digitos, "_" y "-".
COPY crontab /etc/cron.d/vigicom-robot
RUN chmod 0644 /etc/cron.d/vigicom-robot

WORKDIR /var/www

# Override del CMD del base (apache2-foreground): supervisord arranca apache
# como uno mas de los tres programas.
CMD ["/usr/bin/supervisord", "-n"]
