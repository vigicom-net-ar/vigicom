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
APP_PORT_HOST=8090
ROBOT_PORT_HOST=8091
DOMAIN="${DOMAIN:-cloud.vigicom.net.ar}"
ROBOT_DOMAIN="${ROBOT_DOMAIN:-robot.vigicom.net.ar}"
CERTBOT_EMAIL="${CERTBOT_EMAIL:-javieralvarez@databox.net.ar}"
COMPOSE_FILE="docker-compose.prod.yml"

echo ""
echo "============================================================"
echo "  Setup remoto vigicom (Amazon Linux 2023)"
echo "  Dominio cloud: ${DOMAIN}"
echo "  Dominio robot: ${ROBOT_DOMAIN}"
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
for f in cloud docker/php/Dockerfile docker/robot/Dockerfile .env.production; do
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
ROBOT_EXTRA_MOUNTS=""
for d in api db; do
    if [ -d "$APP_DIR/$d" ]; then
        EXTRA_MOUNTS="${EXTRA_MOUNTS}      - ./${d}:/var/www/${d}"$'\n'
        ROBOT_EXTRA_MOUNTS="${ROBOT_EXTRA_MOUNTS}      - ./${d}:/var/www/${d}"$'\n'
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
      - "127.0.0.1:${APP_PORT_HOST}:80"
    volumes:
      - ./cloud:/var/www/html
${EXTRA_MOUNTS}      - ./.env.production:/var/www/.env.production
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

  # Worker del backend: apache (cronjobs HTTP) + cron + motor (daemon Python)
  # via supervisord. La BD viene de .env.production (RDS), por eso no tiene
  # depends_on de db (en prod no hay servicio db).
  # Puerto 8091 bindeado solo a 127.0.0.1: Nginx proxea desde afuera (igual
  # patron que cloud:8090).
  robot:
    container_name: vigicom-robot
    build:
      context: ./docker/robot
      dockerfile: Dockerfile
    depends_on:
      - emqx
    ports:
      - "127.0.0.1:8091:80"
    volumes:
      - ./robot:/var/www/robot
${ROBOT_EXTRA_MOUNTS}      - ./.env.production:/var/www/.env.production
    env_file:
      - .env.production
    environment:
      MQTT_HOST: emqx
      MQTT_PORT: "1883"
    restart: unless-stopped

volumes:
  vigicom_emqx_data:
EOF
echo "        OK"

# ---- 6. Configurar Nginx ----
# Dos server blocks:
#   - DOMAIN (cloud)       -> 127.0.0.1:APP_PORT_HOST (vigicom-apache)
#   - ROBOT_DOMAIN (robot) -> 127.0.0.1:ROBOT_PORT_HOST (vigicom-robot)
echo "[ 6/9 ] Configurando Nginx como reverse proxy..."
sudo tee /etc/nginx/conf.d/vigicom.conf > /dev/null << NGX
# Reverse proxy vigicom -- generado por aprovisionar_server.sh
server {
    listen 80;
    server_name ${DOMAIN};
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
    server_name ${ROBOT_DOMAIN};
    location / {
        proxy_pass         http://127.0.0.1:${ROBOT_PORT_HOST};
        proxy_set_header   Host \$host;
        proxy_set_header   X-Real-IP \$remote_addr;
        proxy_set_header   X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
        client_max_body_size 50M;
        # Algunos cronjobs son largos: dar margen amplio.
        proxy_read_timeout 600s;
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

# ---- 9. Emitir certificado SSL ----
echo "[ 9/9 ] Verificando DNS para SSL..."

IMDS_TOKEN=$(curl -s -X PUT "http://169.254.169.254/latest/api/token" \
    -H "X-aws-ec2-metadata-token-ttl-seconds: 60" --max-time 3 || echo "")
PUBLIC_IP=$(curl -s -H "X-aws-ec2-metadata-token: $IMDS_TOKEN" \
    --max-time 3 http://169.254.169.254/latest/meta-data/public-ipv4 || echo "")

if [ -z "$PUBLIC_IP" ]; then
    echo "        AVISO: no se pudo detectar la IP publica -- saltando SSL."
else
    echo "        IP publica del servidor: $PUBLIC_IP"

    # Chequear DNS de cada dominio y armar la lista de -d para certbot solo
    # con los que ya apuntan al server. Si alguno no resuelve, se avisa pero
    # no se aborta: los que si resuelven igual obtienen su cert.
    CERT_DOMAINS=""
    for d in "$DOMAIN" "$ROBOT_DOMAIN"; do
        RESOLVED=$(dig +short A "$d" @8.8.8.8 | tail -n1)
        if [ "$RESOLVED" = "$PUBLIC_IP" ]; then
            CERT_DOMAINS="$CERT_DOMAINS -d $d"
            echo "        DNS OK: $d -> $RESOLVED"
        else
            echo "        DNS aun no apunta al servidor:"
            echo "          $d -> ${RESOLVED:-(no resuelve)} (esperado $PUBLIC_IP)"
        fi
    done

    if [ -z "$CERT_DOMAINS" ]; then
        echo ""
        echo "        Ningun dominio resuelve al server -- configurar DNS y volver"
        echo "        a correr este script para SSL."
    else
        echo "        Verificando certbot..."

        if [ ! -x /opt/certbot/bin/certbot ]; then
            echo "        Instalando certbot en /opt/certbot..."
            sudo python3 -m venv /opt/certbot
            sudo /opt/certbot/bin/pip install --quiet --upgrade pip
            sudo /opt/certbot/bin/pip install --quiet certbot certbot-nginx
            sudo ln -sf /opt/certbot/bin/certbot /usr/bin/certbot
        fi
        echo "        certbot $(/usr/bin/certbot --version 2>&1 | awk '{print $2}')"

        echo "        Emitiendo/verificando certificado(s) para:$CERT_DOMAINS"
        if sudo certbot --nginx \
                --non-interactive \
                --agree-tos \
                --email "$CERTBOT_EMAIL" \
                --redirect \
                --keep-until-expiring \
                $CERT_DOMAINS; then
            echo "        OK -- SSL configurado."
        else
            echo "        AVISO: certbot fallo. Revisar /var/log/letsencrypt/letsencrypt.log"
        fi

        if [ ! -f /etc/cron.d/certbot ]; then
            echo "0 0,12 * * * root /opt/certbot/bin/python -c 'import random; import time; time.sleep(random.random() * 3600)' && /usr/bin/certbot renew -q" \
                | sudo tee /etc/cron.d/certbot > /dev/null
            echo "        Cron de renovacion creado en /etc/cron.d/certbot"
        fi
    fi
fi

echo ""
echo "============================================================"
echo "  Setup remoto completo."
echo ""
echo "  App:        https://${DOMAIN}/         (proxy a 127.0.0.1:${APP_PORT_HOST})"
echo "  Robot:      https://${ROBOT_DOMAIN}/   (proxy a 127.0.0.1:${ROBOT_PORT_HOST})"
echo "  Repo:       $APP_DIR"
echo "  Compose:    docker compose -f $APP_DIR/$COMPOSE_FILE <cmd>"
echo "  Logs cloud: sudo docker logs -f vigicom-apache"
echo "  Logs robot: sudo docker logs -f vigicom-robot"
echo "  Restart:    cd $APP_DIR && sudo docker compose -f $COMPOSE_FILE restart"
echo "  Ver SSL:    sudo certbot certificates"
echo "============================================================"
echo ""
