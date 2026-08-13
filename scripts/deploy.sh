#!/bin/bash
# ============================================================
# deploy.sh - Sincroniza la app al servidor vigicom
# Host objetivo:  frankfurt.vigicom.net.ar
# URL servida:    https://cloud.vigicom.net.ar
#
# Uso:
#   bash deploy.sh           # solo sube los cambios (no recrea contenedor)
#   bash deploy.sh --rebuild # reconstruye la imagen Docker y recrea el
#                            # contenedor (necesario si cambio
#                            # docker/php/Dockerfile o .env.production)
# ============================================================

set -e

HOST="frankfurt.vigicom.net.ar"
USER="ec2-user"
KEY="/c/Users/Javier/OneDrive/Temp/Llaves/vigicom/vigicom.pem"
BASE_LOCAL="$(cd "$(dirname "$0")/.." && pwd)"
BASE_REMOTE="/opt/app/vigicom"
COMPOSE_FILE="docker-compose.prod.yml"   # generado por aprovisionar_server.sh

REBUILD=false
if [ "$1" == "--rebuild" ]; then
    REBUILD=true
fi

VERSION="1.0.$(date +%s)"

echo ""
echo "================================================"
echo "  Deploy vigicom -- version: $VERSION"
echo "  Host: $HOST"
echo "================================================"
echo ""

# ---- 1. version.txt en cloud/ ----
echo "$VERSION" > "$BASE_LOCAL/cloud/version.txt"
echo "  version.txt actualizado en cloud/"
echo ""

# ---- 2. Verificar artefactos requeridos ----
for f in .env.production env.php docker/php/Dockerfile cloud; do
    if [ ! -e "$BASE_LOCAL/$f" ]; then
        echo "ERROR: falta $BASE_LOCAL/$f"
        exit 1
    fi
done

# ---- 3. Subir cloud/, docker/, db/, api/, robot/, app/, www/, panel/, .env.production ----
# NO subimos docker-compose.yml: en el servidor vive docker-compose.prod.yml,
# generado por aprovisionar_server.sh (sin servicio db).
# .env.production se sube en cada deploy para mantener prod en sync.
# db/, api/, robot/, app/, www/, panel/ se incluyen si existen (componentes
# hermanos del repo). Cada uno es el docroot del vhost homonimo en
# vigicom-apache.
echo "  Subiendo cloud/, docker/, db/, api/, robot/, app/, www/, panel/ y .env.production (mirror con --delete)..."
cd "$BASE_LOCAL"

EXTRA_DIRS=""
for d in db api robot app www panel motor; do
    if [ -d "$BASE_LOCAL/$d" ]; then
        EXTRA_DIRS="$EXTRA_DIRS $d"
    fi
done

# Sync con borrado: si un archivo (o carpeta) no esta en local, tampoco
# debe quedar en el server. `tar -xzf` solo extrae encima (aditivo), por
# eso el flujo es:
#   (1) tar local -> stdin del ssh
#   (2) en remoto: extraer a un staging temporal
#   (3) en remoto: rsync -a --delete de staging hacia BASE_REMOTE por
#       carpeta (acota el alcance, evita tocar otras carpetas del server)
#   (4) en remoto: limpiar staging
# rsync vive en el server (Amazon Linux lo trae por default); no hace
# falta tenerlo instalado en local.
STAGING="/tmp/vigicom-deploy-$(date +%s)"

tar \
    --exclude='./cloud/.git' \
    --exclude='./cloud/node_modules' \
    --exclude='./cloud/vendor' \
    --exclude='*.log' \
    --exclude='*.pem' \
    --exclude='*.key' \
    -czf - cloud docker $EXTRA_DIRS env.php .env.production | \
ssh -i "$KEY" -o StrictHostKeyChecking=no \
    "$USER@$HOST" "
        set -e
        mkdir -p '$STAGING'
        tar -xzf - -C '$STAGING/'
        for dir in cloud docker $EXTRA_DIRS; do
            if [ -d \"$STAGING/\$dir\" ]; then
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

# ---- 4. Rebuild (opcional) ----
# Sin --rebuild solo se suben los cambios: el codigo esta bind-monteado, asi
# que los cambios en cloud/, api/, app/, etc. quedan visibles en el acto sin
# necesidad de tocar el contenedor.
# Con --rebuild se reconstruye la imagen y se recrea el contenedor. Ojo:
# Docker bind-montea .env.production por inodo, asi que si cambio ese archivo
# hay que correr --rebuild para que el contenedor lo vea.
if [ "$REBUILD" = true ]; then
    echo "  Reconstruyendo imagen Docker y recreando contenedor..."
    ssh -i "$KEY" -o StrictHostKeyChecking=no "$USER@$HOST" \
        "cd '$BASE_REMOTE' && docker compose -f $COMPOSE_FILE build && docker compose -f $COMPOSE_FILE up -d --force-recreate"
    echo "  OK -- imagen reconstruida y contenedor levantado"
else
    echo "  Sin --rebuild: solo se subieron los cambios (contenedor intacto)."
fi
echo ""

# ---- 5. Schema / install ----
# El schema vive en db/schema.sql (fuente de verdad, declarado en CLAUDE.md raiz).
# En prod la BD es AWS RDS, asi que se aplica manualmente desde un host con
# acceso al RDS, por ejemplo:
#   mysql -h <RDS_HOST> -u <USER> -p<PASS> vigicom < db/schema.sql
# Alternativa: invocar https://cloud.vigicom.net.ar/install.php una vez que
# el deploy este arriba (idempotente: crea solo lo que falte).
echo "  Schema: aplicar db/schema.sql manualmente contra RDS, o invocar /install.php."
echo ""

echo "================================================"
echo "  Deploy completo -- https://cloud.vigicom.net.ar"
echo "================================================"
echo ""
