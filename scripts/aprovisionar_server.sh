#!/bin/bash
# ============================================================
# aprovisionar_server.sh - Setup interno del server vigicom.
#
# Este script NO se corre a mano: lo invoca scripts/aprovisionar.sh
# despues de transferir los archivos del proyecto via SSH. Si necesitas
# re-correr el setup en el server (idempotente), podes ejecutarlo
# directamente:
#   bash /opt/app/vigicom/scripts/aprovisionar_server.sh
#
# Sistema esperado: Amazon Linux 2023.
#
# Variables que recibe (opcionales, con default):
#   DOMAIN          - default cloud.vigicom.net.ar
#   CERTBOT_EMAIL   - default javieralvarez@databox.net.ar
# ============================================================

set -eo pipefail

APP_DIR="/opt/app/vigicom"

# Un puerto por vhost. Mismo numero adentro y afuera del contenedor (compose
# los mapea 1:1) y mismo numero en dev y en prod. Coordinado con
# docker/php/ports.conf y docker/php/vhosts.conf.
CLOUD_PORT_HOST=8090
API_PORT_HOST=8104
ROBOT_PORT_HOST=8105
WWW_PORT_HOST=8106
APP_PORT_HOST=8107
PANEL_PORT_HOST=8108

DOMAIN="${DOMAIN:-cloud.vigicom.net.ar}"
API_DOMAIN="${API_DOMAIN:-api.vigicom.net.ar}"
ROBOT_DOMAIN="${ROBOT_DOMAIN:-robot.vigicom.net.ar}"
WWW_DOMAIN="${WWW_DOMAIN:-www.vigicom.net.ar}"
APP_DOMAIN="${APP_DOMAIN:-app.vigicom.net.ar}"
PANEL_DOMAIN="${PANEL_DOMAIN:-panel.vigicom.net.ar}"
CERTBOT_EMAIL="${CERTBOT_EMAIL:-javieralvarez@databox.net.ar}"
COMPOSE_FILE="docker-compose.prod.yml"

# Dominios que SI piden cert SSL en este server. api, www y app estan en otra
# infra de prod por ahora; cuando se migren se agregan a esta lista.
SSL_DOMAINS=("$DOMAIN" "$ROBOT_DOMAIN" "$PANEL_DOMAIN")

echo ""
echo "============================================================"
echo "  Setup remoto vigicom (Amazon Linux 2023)"
echo "  Dominio cloud: ${DOMAIN}"
echo "  Dominio api:   ${API_DOMAIN}    (sin SSL: ya esta en otra infra)"
echo "  Dominio robot: ${ROBOT_DOMAIN}"
echo "  Dominio www:   ${WWW_DOMAIN}    (sin SSL: ya esta en otra infra)"
echo "  Dominio app:   ${APP_DOMAIN}    (sin SSL: ya esta en otra infra)"
echo "  Dominio panel: ${PANEL_DOMAIN}"
echo "  App dir:       ${APP_DIR}"
echo "============================================================"
echo ""

# ---- 1. Actualizar sistema ----
echo "[ 1/9 ] Actualizando sistema..."
sudo dnf update -y -q
echo "        OK"

# ---- 2. Instalar Docker, Git, Nginx, bind-utils, python3 ----
echo "[ 2/9 ] Instalando Docker, Nginx, bind-utils, python3..."
sudo dnf install -y -q docker git nginx bind-utils python3 python3-pip augeas-libs
sudo systemctl enable docker nginx
sudo systemctl start docker
sudo usermod -aG docker ec2-user
echo "        OK -- $(sudo docker --version)"

# ---- 3. Instalar Docker Compose v2 + buildx ----
echo "[ 3/9 ] Instalando Docker Compose y buildx..."
sudo mkdir -p /usr/local/lib/docker/cli-plugins

COMPOSE_VERSION="v2.32.4"
sudo curl -fsSL \
    "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-linux-x86_64" \
    -o /usr/local/lib/docker/cli-plugins/docker-compose
sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

BUILDX_VERSION="v0.20.0"
sudo curl -fsSL \
    "https://github.com/docker/buildx/releases/download/${BUILDX_VERSION}/buildx-${BUILDX_VERSION}.linux-amd64" \
    -o /usr/local/lib/docker/cli-plugins/docker-buildx
sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-buildx

echo "        OK -- Compose $(sudo docker compose version --short) / buildx $(sudo docker buildx version | awk '{print $2}')"

# ---- 4. Verificar artefactos transferidos ----
echo "[ 4/9 ] Verificando archivos del proyecto..."
for f in cloud docker/php/Dockerfile env.php .env.production; do
    if [ ! -e "$APP_DIR/$f" ]; then
        echo "        ERROR: falta $APP_DIR/$f"
        echo "        Re-correr scripts/aprovisionar.sh desde la maquina local."
        exit 1
    fi
done
# Override de compose es solo para dev local: si llego, lo borramos.
rm -f "$APP_DIR/docker-compose.override.yml"
echo "        OK"

# ---- 5. Generar docker-compose.prod.yml ----
# Difiere del docker-compose.yml del repo:
#   - No incluye el servicio db (en prod la BD es AWS RDS).
#   - Bind solo a 127.0.0.1 (Nginx hace el frente publico).
#
# Mounts: cloud/, api/, db/ (si existen) y .env.production -- mismos paths
# que /var/www/* en dev, asi el codigo PHP no necesita conocer dev vs prod.
echo "[ 5/9 ] Generando $COMPOSE_FILE..."

EXTRA_MOUNTS=""
for d in api robot www app panel db; do
    if [ -d "$APP_DIR/$d" ]; then
        EXTRA_MOUNTS="${EXTRA_MOUNTS}      - ./${d}:/var/www/${d}"$'\n'
    fi
done

cat > "$APP_DIR/$COMPOSE_FILE" << EOF
# Generado por scripts/aprovisionar_server.sh - no editar a mano.
# Produccion: sin servicio db (BD en AWS RDS, ver .env.production).
name: vigicom

services:
  cloud:
    container_name: vigicom-apache
    build:
      context: ./docker/php
      dockerfile: Dockerfile
    ports:
      - "127.0.0.1:${CLOUD_PORT_HOST}:${CLOUD_PORT_HOST}"
      - "127.0.0.1:${API_PORT_HOST}:${API_PORT_HOST}"
      - "127.0.0.1:${ROBOT_PORT_HOST}:${ROBOT_PORT_HOST}"
      - "127.0.0.1:${WWW_PORT_HOST}:${WWW_PORT_HOST}"
      - "127.0.0.1:${APP_PORT_HOST}:${APP_PORT_HOST}"
      - "127.0.0.1:${PANEL_PORT_HOST}:${PANEL_PORT_HOST}"
    volumes:
      - ./cloud:/var/www/cloud
${EXTRA_MOUNTS}      - ./env.php:/var/www/env.php
      - ./.env.production:/var/www/.env.production
    env_file:
      - .env.production
    restart: unless-stopped

  emqx:
    container_name: vigicom-emqx
    image: emqx/emqx:5.8
    ports:
      - "16273:1883"     # MQTT publico (abierto en security group)
      - "18083:18083"    # dashboard (filtrado por IP en security group)
    env_file:
      - .env.production
    environment:
      EMQX_ALLOW_ANONYMOUS: "false"
      EMQX_AUTHENTICATION__1__MECHANISM: password_based
      EMQX_AUTHENTICATION__1__BACKEND: built_in_database
      EMQX_AUTHENTICATION__1__USER_ID_TYPE: username
    volumes:
      - vigicom_emqx_data:/opt/emqx/data
      - ./docker/emqx/init.sh:/init.sh:ro
    entrypoint: ["/init.sh"]
    command: ["/opt/emqx/bin/emqx", "foreground"]
    restart: unless-stopped

volumes:
  vigicom_emqx_data:
EOF
echo "        OK"

# ---- 6. Configurar Nginx ----
# Cinco server blocks: cada subdominio proxea al puerto local que escucha el
# vhost de Apache correspondiente. El Host header se preserva por costumbre
# (Apache no lo necesita porque la routing interna es por puerto, no por
# ServerName).
echo "[ 6/9 ] Configurando Nginx como reverse proxy..."
sudo tee /etc/nginx/conf.d/vigicom.conf > /dev/null << NGX
# Reverse proxy vigicom -- generado por aprovisionar_server.sh
server {
    listen 80;
    server_name ${DOMAIN};
    location / {
        proxy_pass         http://127.0.0.1:${CLOUD_PORT_HOST};
        proxy_set_header   Host \$host;
        proxy_set_header   X-Real-IP \$remote_addr;
        proxy_set_header   X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
        client_max_body_size 50M;
        proxy_read_timeout 120s;
    }
}

server {
    listen 80;
    server_name ${API_DOMAIN};
    location / {
        proxy_pass         http://127.0.0.1:${API_PORT_HOST};
        proxy_set_header   Host \$host;
        proxy_set_header   X-Real-IP \$remote_addr;
        proxy_set_header   X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
        client_max_body_size 50M;
        proxy_read_timeout 120s;
    }
}

server {
    listen 80;
    server_name ${ROBOT_DOMAIN};
    location / {
        proxy_pass         http://127.0.0.1:${ROBOT_PORT_HOST};
        proxy_set_header   Host \$host;
        proxy_set_header   X-Real-IP \$remote_addr;
        proxy_set_header   X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
        client_max_body_size 50M;
        proxy_read_timeout 120s;
    }
}

server {
    listen 80;
    server_name ${WWW_DOMAIN};
    location / {
        proxy_pass         http://127.0.0.1:${WWW_PORT_HOST};
        proxy_set_header   Host \$host;
        proxy_set_header   X-Real-IP \$remote_addr;
        proxy_set_header   X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
        client_max_body_size 50M;
        proxy_read_timeout 120s;
    }
}

server {
    listen 80;
    server_name ${APP_DOMAIN};
    location / {
        proxy_pass         http://127.0.0.1:${APP_PORT_HOST};
        proxy_set_header   Host \$host;
        proxy_set_header   X-Real-IP \$remote_addr;
        proxy_set_header   X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
        client_max_body_size 50M;
        proxy_read_timeout 120s;
    }
}

server {
    listen 80;
    server_name ${PANEL_DOMAIN};
    location / {
        proxy_pass         http://127.0.0.1:${PANEL_PORT_HOST};
        proxy_set_header   Host \$host;
        proxy_set_header   X-Real-IP \$remote_addr;
        proxy_set_header   X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
        client_max_body_size 50M;
        proxy_read_timeout 120s;
    }
}
NGX

# Limpieza: confs default de nginx que podrian competir con vigicom.conf.
sudo rm -f /etc/nginx/conf.d/default.conf
sudo nginx -t
sudo systemctl restart nginx
echo "        OK"

# ---- 7. Construir imagen y levantar contenedor ----
echo "[ 7/9 ] Construyendo imagen Docker y levantando contenedor..."
cd "$APP_DIR"
sudo docker compose -f "$COMPOSE_FILE" build
sudo docker compose -f "$COMPOSE_FILE" up -d --force-recreate
sleep 3
sudo docker compose -f "$COMPOSE_FILE" ps
echo "        OK"

# ---- 8. Sembrar usuario MQTT en EMQX (idempotente, via API) ----
# El seeder espera a que el dashboard responda, hace login y upsertea el
# usuario MQTT_USER:MQTT_PASS leidos de .env.production.
# Reaplicable cuantas veces quieras: POST -> si 409, PUT.
echo "[ 8/9 ] Sembrando usuario MQTT en EMQX..."
if bash "$APP_DIR/scripts/lib/emqx_seed.sh" "$APP_DIR/.env.production"; then
    echo "        OK"
else
    echo "        AVISO: el seeder de EMQX fallo -- revisar: sudo docker logs vigicom-emqx"
fi

# ---- 9. Emitir/reinstalar certificados SSL ----
# El paso 6 regenera vigicom.conf con solo "listen 80", asi que cada corrida
# rompe las modificaciones que certbot habia hecho antes (listen 443, ssl,
# redirect). Por eso aca llamamos certbot --nginx con --reinstall por cada
# dominio: si el cert existe lo reinstala (reaplica nginx), si no existe lo
# emite y lo instala. Si DNS no apunta o falla la validacion HTTP-01,
# certbot reporta el error pero seguimos con el resto -- no aborta el script.
echo "[ 9/9 ] Configurando SSL via certbot..."

if [ ! -x /opt/certbot/bin/certbot ]; then
    echo "        Instalando certbot en /opt/certbot..."
    sudo python3 -m venv /opt/certbot
    sudo /opt/certbot/bin/pip install --quiet --upgrade pip
    sudo /opt/certbot/bin/pip install --quiet certbot certbot-nginx
    sudo ln -sf /opt/certbot/bin/certbot /usr/bin/certbot
fi
echo "        certbot $(/usr/bin/certbot --version 2>&1 | awk '{print $2}')"

for d in "${SSL_DOMAINS[@]}"; do
    echo "        --- $d ---"
    if sudo certbot --nginx \
            --non-interactive \
            --agree-tos \
            --email "$CERTBOT_EMAIL" \
            --redirect \
            --reinstall \
            -d "$d" 2>&1 | tail -5; then
        echo "        OK -- $d"
    else
        echo "        AVISO: certbot fallo para $d (DNS, rate limit, validacion). Revisar /var/log/letsencrypt/letsencrypt.log"
    fi
done

if [ ! -f /etc/cron.d/certbot ]; then
    echo "0 0,12 * * * root /opt/certbot/bin/python -c 'import random; import time; time.sleep(random.random() * 3600)' && /usr/bin/certbot renew -q" \
        | sudo tee /etc/cron.d/certbot > /dev/null
    echo "        Cron de renovacion creado en /etc/cron.d/certbot"
fi

echo ""
echo "============================================================"
echo "  Setup remoto completo."
echo ""
echo "  Cloud:      https://${DOMAIN}/    -> 127.0.0.1:${CLOUD_PORT_HOST}"
echo "  Robot:      https://${ROBOT_DOMAIN}/  -> 127.0.0.1:${ROBOT_PORT_HOST}"
echo "  Panel:      https://${PANEL_DOMAIN}/  -> 127.0.0.1:${PANEL_PORT_HOST}"
echo "  Api:        http://${API_DOMAIN}/     -> 127.0.0.1:${API_PORT_HOST}   (sin SSL: ya esta en otra infra)"
echo "  Www:        http://${WWW_DOMAIN}/     -> 127.0.0.1:${WWW_PORT_HOST}   (sin SSL: ya esta en otra infra)"
echo "  App:        http://${APP_DOMAIN}/     -> 127.0.0.1:${APP_PORT_HOST}   (sin SSL: ya esta en otra infra)"
echo ""
echo "  Repo:       $APP_DIR"
echo "  Compose:    docker compose -f $APP_DIR/$COMPOSE_FILE <cmd>"
echo "  Logs:       sudo docker logs -f vigicom-apache"
echo "  Restart:    cd $APP_DIR && sudo docker compose -f $COMPOSE_FILE restart"
echo "  Ver SSL:    sudo certbot certificates"
echo "============================================================"
echo ""
