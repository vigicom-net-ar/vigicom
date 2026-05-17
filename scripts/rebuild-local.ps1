<#
.SYNOPSIS
    Reconstruye el entorno local de Vigicom en Docker.

.DESCRIPTION
    Idempotente: si el stack ya existe lo tira abajo y lo vuelve a levantar.
    Cada corrida deja el mismo estado final (DB recreada + admin listo),
    salvo que se pase -KeepData para preservar el volumen de MySQL.

    Servicios:
      - vigicom-db    MySQL 8 en 127.0.0.1:3310
      - vigicom-cloud PHP 8.2 + Apache en http://localhost:8090
      - vigicom-pma   phpMyAdmin en http://localhost:8091

.PARAMETER KeepData
    No borrar el volumen de MySQL. Util para no perder datos entre corridas.

.PARAMETER NoInstall
    No invocar install.php (saltar la creacion de tablas/admin).

.PARAMETER NoBuild
    Saltar el `docker compose build`. Mas rapido si no cambio el Dockerfile.

.EXAMPLE
    pwsh scripts/rebuild-local.ps1
    pwsh scripts/rebuild-local.ps1 -KeepData
#>

[CmdletBinding()]
param(
    [switch]$KeepData,
    [switch]$NoInstall,
    [switch]$NoBuild
)

$ErrorActionPreference = 'Stop'

# Siempre operar desde la raiz del repo, sin importar desde donde se invoque
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
Set-Location $repoRoot

$project = 'vigicom'
$webUrl  = 'http://localhost:8090'
$pmaUrl  = 'http://localhost:8091'
$dbHostPort = 3310

function Step($msg) { Write-Host "==> $msg" -ForegroundColor Cyan }
function Ok($msg)   { Write-Host "    $msg" -ForegroundColor Green }
function Warn($msg) { Write-Host "    $msg" -ForegroundColor Yellow }

# --- 1. Verificar Docker -----------------------------------------------------
Step "Verificando Docker"
try {
    $null = docker info --format '{{.ServerVersion}}' 2>$null
    if ($LASTEXITCODE -ne 0) { throw }
} catch {
    Write-Error "Docker no responde. Inicia Docker Desktop y volve a correr."
    exit 1
}
Ok "Docker corriendo"

# --- 2. Tirar abajo lo previo (idempotencia) ---------------------------------
Step "Tirando abajo containers previos"
$downArgs = @('compose', '-p', $project, 'down', '--remove-orphans')
if (-not $KeepData) { $downArgs += '-v' }
docker @downArgs
if ($LASTEXITCODE -ne 0) { Write-Error "docker compose down fallo"; exit 1 }
Ok ("Stack anterior eliminado" + $(if ($KeepData) { " (datos preservados)" } else { " (datos borrados)" }))

# --- 3. Build ----------------------------------------------------------------
if (-not $NoBuild) {
    Step "Construyendo imagenes"
    docker compose -p $project build
    if ($LASTEXITCODE -ne 0) { Write-Error "docker compose build fallo"; exit 1 }
    Ok "Imagenes listas"
}

# --- 4. Up -------------------------------------------------------------------
Step "Levantando stack"
docker compose -p $project up -d
if ($LASTEXITCODE -ne 0) { Write-Error "docker compose up fallo"; exit 1 }
Ok "Containers arriba"

# --- 5. Esperar a MySQL (depends_on:healthy ya espera, pero confirmamos) -----
Step "Esperando a MySQL"
$ok = $false
for ($i = 1; $i -le 40; $i++) {
    $status = docker inspect --format '{{.State.Health.Status}}' vigicom-db 2>$null
    if ($status -eq 'healthy') { $ok = $true; break }
    Start-Sleep -Seconds 2
}
if (-not $ok) { Write-Error "MySQL no llego a healthy en 80s"; exit 1 }
Ok "MySQL healthy"

# --- 6. Install (idempotente: INSERT...ON DUPLICATE KEY) ---------------------
if (-not $NoInstall) {
    Step "Ejecutando install.php"
    # darle a Apache un par de segundos para terminar de arrancar
    Start-Sleep -Seconds 2
    $installOk = $false
    for ($i = 1; $i -le 10; $i++) {
        try {
            $resp = Invoke-WebRequest -Uri "$webUrl/install.php" -UseBasicParsing -TimeoutSec 15
            if ($resp.StatusCode -eq 200) { $installOk = $true; break }
        } catch {
            Start-Sleep -Seconds 2
        }
    }
    if ($installOk) {
        Ok "install.php aplicado (tablas + admin)"
    } else {
        Warn "install.php no respondio - corrre manualmente: $webUrl/install.php"
    }
}

# --- 7. Resumen --------------------------------------------------------------
Write-Host ""
Write-Host "Entorno listo" -ForegroundColor Green
Write-Host ("  Cloud         {0}" -f $webUrl)        -ForegroundColor Magenta
Write-Host ("  phpMyAdmin    {0}" -f $pmaUrl)        -ForegroundColor Magenta
Write-Host ("  MySQL         127.0.0.1:{0} (root / root)" -f $dbHostPort) -ForegroundColor Magenta
Write-Host  "  Login app     admin@vigicom.net.ar / admin123" -ForegroundColor Magenta
Write-Host ""
Write-Host "Logs en vivo:  docker compose -p $project logs -f cloud" -ForegroundColor DarkGray
Write-Host "Parar todo:    docker compose -p $project down"          -ForegroundColor DarkGray
