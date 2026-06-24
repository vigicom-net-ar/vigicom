#!/bin/bash
# ============================================================
# instalar.sh - Rebuild idempotente del stack local Docker (Vigicom).
#
# Que hace:
#   - Verifica que Docker este disponible.
#   - Verifica que el contenedor compartido `herramientas-mysql` este corriendo
#     (la DB no vive en este stack; viene del stack `herramientas`).
#   - Tira abajo el stack previo y lo recrea (down + up -d --build).
#   - Espera a que la app responda en HTTP.
#   - Invoca install.php para crear tablas y usuario admin.
#
# Flags:
#   --no-install   No invoca install.php al final.
#   --no-build     Saltea el build (mas rapido si no cambio el Dockerfile).
#
# Servicios:
#   - vigicom-apache  PHP 8.2 + Apache en http://localhost:8090
#   - vigicom-emqx    EMQX broker MQTT
#
# DB:
#   - `herramientas-mysql` (stack `herramientas`), accedido por los
#     contenedores via host.docker.internal:3306, base `vigicom_dev`.
#
# Uso:
#   bash ./scripts/instalar.sh
# ============================================================

set -e

# --- Repo root --------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

PROJECT="vigicom"
APP_PORT=8090
WEB_URL="http://localhost:${APP_PORT}"

# --- Flags ------------------------------------------------------------------
NO_INSTALL=false
NO_BUILD=false
for arg in "$@"; do
    case "$arg" in
        --no-install) NO_INSTALL=true ;;
        --no-build)   NO_BUILD=true ;;
        -h|--help)
            sed -n '2,26p' "$0"
            exit 0
            ;;
        *)
            echo "Flag desconocido: $arg" >&2
            exit 2
            ;;
    esac
done

# --- Colores ----------------------------------------------------------------
RED='\033[1;31m'
GREEN='\033[1;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""
echo -e "${RED}==> Vigicom :: instalar (rebuild local)${NC}"
echo "    repo: $REPO_ROOT"
echo ""

# --- Pre-flight: docker -----------------------------------------------------
if ! docker version --format '{{.Server.Version}}' > /dev/null 2>&1; then
    echo -e "${RED}ERROR: Docker no esta corriendo o no es accesible. Inicia Docker Desktop e intenta de nuevo.${NC}"
    exit 1
fi

# --- Pre-flight: DB compartida ----------------------------------------------
# La base MySQL no la levanta este compose; viene del stack `herramientas`
# (contenedor `herramientas-mysql`). Si no esta corriendo, la app no va a
# levantar bien, asi que avisamos temprano.
if ! docker ps --format '{{.Names}}' | grep -qx "herramientas-mysql"; then
    echo -e "${YELLOW}AVISO: el contenedor 'herramientas-mysql' no esta corriendo.${NC}"
    echo -e "${YELLOW}       Levantalo desde el stack 'herramientas' antes de continuar,${NC}"
    echo -e "${YELLOW}       o la app no va a poder conectarse a la DB.${NC}"
fi

# --- Limpiar contenedores previos -------------------------------------------
# El orden importa:
#   1) `docker compose down` SIEMPRE primero (remueve contenedores con label
#      compose). No usamos -v: el unico volumen que sobrevive es el de EMQX,
#      que queremos preservar entre rebuilds.
#   2) `docker rm -f` como fallback por si quedaron contenedores con esos
#      nombres pero sin label de compose.
echo -e "${RED}==> Limpiando contenedores previos...${NC}"

docker compose -p "$PROJECT" down --remove-orphans > /dev/null 2>&1 || true

existing=$(docker ps -a --format '{{.Names}}')
for name in vigicom-apache vigicom-emqx vigicom-cloud; do
    if echo "$existing" | grep -qx "$name"; then
        echo "    removiendo $name (huerfano sin label compose)"
        docker rm -f "$name" > /dev/null
    fi
done

# --- Build & up -------------------------------------------------------------
echo ""
if $NO_BUILD; then
    echo -e "${RED}==> docker compose up -d (sin build)${NC}"
    up_ok=true
    docker compose -p "$PROJECT" up -d || up_ok=false
else
    echo -e "${RED}==> docker compose up -d --build${NC}"
    up_ok=true
    docker compose -p "$PROJECT" up -d --build || up_ok=false
fi

if ! $up_ok; then
    echo ""
    echo -e "${RED}ERROR: docker compose fallo.${NC}"
    echo -e "${YELLOW}--- docker ps -a (vigicom) ---${NC}"
    docker ps -a --filter "name=vigicom" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    echo ""
    echo -e "${YELLOW}--- docker logs vigicom-apache (ultimas 50 lineas) ---${NC}"
    docker logs --tail 50 vigicom-apache 2>&1 || true
    exit 1
fi

# --- Esperar que la app responda --------------------------------------------
echo ""
echo -e "${RED}==> Esperando a que la app responda en ${WEB_URL} ...${NC}"
sleep 2
app_ok=false
deadline=$(( $(date +%s) + 60 ))
while [ "$(date +%s)" -lt "$deadline" ]; do
    code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 2 "${WEB_URL}/" 2>/dev/null || echo "000")
    if [ "$code" = "200" ]; then
        app_ok=true
        break
    fi
    sleep 1
done

# --- install.php (idempotente: INSERT ... ON DUPLICATE KEY) -----------------
# El install.php de vigicom crea tablas y el usuario admin. Es la fuente de
# verdad del bootstrap inicial; chequea existencia antes de crear, asi que
# reaplicarlo es no-op. La DB (`vigicom_dev` en `herramientas-mysql`) debe
# existir previamente -- la crea el stack `herramientas`.
if ! $NO_INSTALL; then
    echo ""
    echo -e "${RED}==> Ejecutando install.php (tablas + admin)${NC}"
    install_ok=false
    for i in $(seq 1 10); do
        code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 "${WEB_URL}/install.php" 2>/dev/null || echo "000")
        if [ "$code" = "200" ]; then
            install_ok=true
            break
        fi
        sleep 2
    done
    if $install_ok; then
        echo "    OK -- install.php aplicado"
    else
        echo -e "${YELLOW}    AVISO: install.php no respondio -- corre manualmente: ${WEB_URL}/install.php${NC}"
    fi
fi

# --- Sembrar usuario MQTT en EMQX (idempotente, via API) --------------------
# EMQX expone su dashboard API en localhost:18083 (mapeado por compose).
# El seeder hace POST -> si 409, PUT, asi que se puede reaplicar siempre.
echo ""
echo -e "${RED}==> Sembrando usuario MQTT en EMQX${NC}"
if bash "$REPO_ROOT/scripts/lib/emqx_seed.sh" "$REPO_ROOT/.env.development"; then
    :
else
    echo -e "${YELLOW}    AVISO: el seeder de EMQX fallo -- revisa logs con: docker logs vigicom-emqx${NC}"
fi

# --- Resumen ----------------------------------------------------------------
echo ""
if $app_ok; then
    echo -e "${GREEN}==> Listo.${NC}"
else
    echo -e "${YELLOW}==> Stack arriba, pero la app aun no responde. Revisa logs con: docker logs vigicom-apache${NC}"
fi

echo ""
echo -e "${GREEN}  Cloud         ${WEB_URL}${NC}"
echo "  MySQL         herramientas-mysql  (host.docker.internal:3306 / user: root / pass: root / db: vigicom_dev)"
echo "  Login app     admin@vigicom.net.ar / admin123"
echo ""
echo "  Logs    : docker compose -p ${PROJECT} logs -f cloud"
echo "  Down    : docker compose -p ${PROJECT} down"
echo ""
