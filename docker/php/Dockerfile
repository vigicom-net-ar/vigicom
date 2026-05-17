FROM php:8.2-apache

# Extensiones requeridas por las apps PHP
RUN docker-php-ext-install pdo pdo_mysql mysqli \
 && a2enmod rewrite headers expires

# Permitir que los .htaccess de cada app tomen efecto
RUN sed -i 's|AllowOverride None|AllowOverride All|g' /etc/apache2/apache2.conf

# php.ini para desarrollo (errores visibles, sin opcache de archivos)
RUN { \
        echo "display_errors=On"; \
        echo "display_startup_errors=On"; \
        echo "error_reporting=E_ALL"; \
        echo "log_errors=On"; \
        echo "opcache.enable=0"; \
        echo "date.timezone=America/Argentina/Buenos_Aires"; \
    } > /usr/local/etc/php/conf.d/zz-dev.ini

WORKDIR /var/www/html
