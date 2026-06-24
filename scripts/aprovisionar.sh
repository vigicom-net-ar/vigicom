#!/bin/bash
# ============================================================
# aprovisionar.sh - Aprovisionamiento del servidor vigicom.
#
# Corre desde la maquina local (Git Bash en Windows). Sincroniza
# por SSH los archivos del proyecto al servidor y ejecuta alli
# aprovisionar_server.sh, que instala Docker/Nginx/certbot,
# configura el reverse proxy y levanta la app.
#
# Sync con borrado (mirror): si un archivo o carpeta no esta en
# local, tampoco queda en el server. Mismo patron que deploy.sh
# (tar local -> staging remoto -> rsync --delete).
#
# Pensado para una instalacion limpia, pero es idempotente: se
# puede volver a correr sobre un server ya instalado.
#
# Uso:
#   bash scripts/aprovisionar.sh
# ============================================================

set -e

HOST="frankfurt.vigicom.net.ar"
USER="ec2-user"
KEY="/c/Users/Javier/OneDrive/Temp/Llaves/vigicom/vigicom.pem"
BASE_LOCAL="$(cd "$(dirname "$0")/.." && pwd)"
BASE_REMOTE="/opt/app/vigicom"
DOMAIN="cloud.vigicom.net.ar"
API_DOMAIN="api.vigicom.net.ar"
ROBOT_DOMAIN="robot.vigicom.net.ar"
WWW_DOMAIN="www.vigicom.net.ar"
APP_DOMAIN="app.vigicom.net.ar"
PANEL_DOMAIN="panel.vigicom.net.ar"
CERTBOT_EMAIL="${CERTBOT_EMAIL:-javieralvarez@databox.net.ar}"

echo ""
echo "============================================================"
echo "  Aprovisionamiento servidor vigicom"
echo "  Host:   $HOST"
echo "  Dest:   $BASE_REMOTE"
echo "  Cloud:  https://${DOMAIN}/"
echo "  Api:    http://${API_DOMAIN}/    (sin SSL: ya esta en otra infra de prod)"
echo "  Robot:  https://${ROBOT_DOMAIN}/"
echo "  Www:    http://${WWW_DOMAIN}/    (sin SSL: ya esta en otra infra de prod)"
echo "  App:    http://${APP_DOMAIN}/    (sin SSL: ya esta en otra infra de prod)"
echo "  Panel:  https://${PANEL_DOMAIN}/"
echo "============================================================"
echo ""

# ---- 1. Validar artefactos locales ----
for f in .env.production env.php docker/php/Dockerfile cloud scripts/aprovisionar_server.sh; do
    if [ ! -e "$BASE_LOCAL/$f" ]; then
        echo "ERROR: falta $BASE_LOCAL/$f"
        exit 1
    fi
done

if [ ! -f "$KEY" ]; then
    echo "ERROR: no se encuentra la llave SSH en $KEY"
    exit 1
fi

# ---- 2. Asegurar destino remoto ----
echo "  Preparando $BASE_REMOTE en el servidor..."
ssh -i "$KEY" -o StrictHostKeyChecking=no "$USER@$HOST" \
    "sudo mkdir -p '$BASE_REMOTE' && sudo chown -R $USER:$USER /opt/app"
echo "  OK"
echo ""

# ---- 3. Sincronizar archivos (mirror con --delete) ----
# Se incluye scripts/ para que aprovisionar_server.sh quede disponible en el
# server. .env.production tambien (esta en .gitignore, no llega por otra via).
# db/ es la fuente de verdad del schema (declarado en CLAUDE.md raiz).
# api/, app/, www/ son componentes hermanos: se incluyen si existen para
# que el server quede listo cuando cada uno entre en produccion.
#
# Flujo (mismo patron que deploy.sh):
#   (1) tar local -> stdin del ssh (rsync no esta en Git Bash local)
#   (2) en remoto: extraer a un staging temporal
#   (3) en remoto: rsync -a --delete de staging hacia BASE_REMOTE por
#       carpeta (acota el alcance, evita tocar otras carpetas del server)
#   (4) en remoto: limpiar staging
# rsync vive en el server (Amazon Linux lo trae por default).
echo "  Sincronizando cloud/, docker/, db/, api/, robot/, app/, www/, panel/, scripts/, .env.production (mirror con --delete)..."
cd "$BASE_LOCAL"

EXTRA_DIRS=""
for d in db api robot app www panel; do
    if [ -d "$BASE_LOCAL/$d" ]; then
        EXTRA_DIRS="$EXTRA_DIRS $d"
    fi
done

STAGING="/tmp/vigicom-aprovisionar-$(date +%s)"

tar \
    --exclude='./cloud/.git' \
    --exclude='./cloud/node_modules' \
    --exclude='./cloud/vendor' \
    --exclude='*.log' \
    --exclude='*.pem' \
    --exclude='*.key' \
    -czf - cloud docker $EXTRA_DIRS scripts env.php .env.production | \
ssh -i "$KEY" -o StrictHostKeyChecking=no \
    "$USER@$HOST" "
        set -e
        mkdir -p '$STAGING'
        tar -xzf - -C '$STAGING/'
        for dir in cloud docker scripts $EXTRA_DIRS; do
            if [ -d \"$STAGING/\$dir\" ]; then
                mkdir -p \"$BASE_REMOTE/\$dir\"
                rsync -a --delete \"$STAGING/\$dir/\" \"$BASE_REMOTE/\$dir/\"
            fi
        done
        if [ -f '$STAGING/env.php' ]; then
            cp -f '$STAGING/env.php' '$BASE_REMOTE/env.php'
        fi
        if [ -f '$STAGING/.env.production' ]; then
            cp -f '$STAGING/.env.production' '$BASE_REMOTE/.env.production'
        fi
        rm -rf '$STAGING'
    "
echo "  OK"
echo ""

# ---- 4. Ejecutar setup remoto ----
# -t fuerza pseudo-terminal: el server puede pedir password de sudo si
# la cuenta no esta en sudoers NOPASSWD (en ec2-user de AMZ Linux 2023
# suele estar sin password, pero no asumimos).
echo "  Ejecutando setup en el server..."
echo ""
ssh -i "$KEY" -o StrictHostKeyChecking=no -t \
    "$USER@$HOST" \
    "DOMAIN='$DOMAIN' API_DOMAIN='$API_DOMAIN' ROBOT_DOMAIN='$ROBOT_DOMAIN' WWW_DOMAIN='$WWW_DOMAIN' APP_DOMAIN='$APP_DOMAIN' PANEL_DOMAIN='$PANEL_DOMAIN' CERTBOT_EMAIL='$CERTBOT_EMAIL' bash '$BASE_REMOTE/scripts/aprovisionar_server.sh'"

echo ""
echo "============================================================"
echo "  Aprovisionamiento completo:"
echo "    Cloud: https://${DOMAIN}/"
echo "    Api:   http://${API_DOMAIN}/    (SSL pendiente, ya esta en otra infra)"
echo "    Robot: https://${ROBOT_DOMAIN}/"
echo "    Www:   http://${WWW_DOMAIN}/    (SSL pendiente, ya esta en otra infra)"
echo "    App:   http://${APP_DOMAIN}/    (SSL pendiente, ya esta en otra infra)"
echo "    Panel: https://${PANEL_DOMAIN}/"
echo "============================================================"
echo ""
