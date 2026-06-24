FROM php:8.2-apache

# Extensiones requeridas por las apps PHP
RUN docker-php-ext-install pdo pdo_mysql mysqli \
 && a2enmod rewrite headers expires

# Permitir que los .htaccess de cada app tomen efecto
RUN sed -i 's|AllowOverride None|AllowOverride All|g' /etc/apache2/apache2.conf

# Apache escucha en 5 puertos (uno por vhost). El default ports.conf (que
# escucha solo 80) se reemplaza, y el 000-default.conf se deshabilita porque
# cloud pasa a tener su propio vhost explicito en vhosts.conf.
COPY ports.conf /etc/apache2/ports.conf
COPY vhosts.conf /etc/apache2/sites-available/010-vigicom-vhosts.conf
RUN a2dissite 000-default && a2ensite 010-vigicom-vhosts

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
