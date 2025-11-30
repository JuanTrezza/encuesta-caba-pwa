# Script para Limpiar API Keys del Historial de Git
# ADVERTENCIA: Esto reescribirá TODO el historial del repositorio

# PASOS PREVIOS:
# 1. Asegúrate de tener un backup del repositorio
# 2. Notifica a todos los colaboradores (si hay)
# 3. Este proceso es IRREVERSIBLE

# Método usando git filter-repo (recomendado)

## INSTALACIÓN:
# pip install git-filter-repo

## EJECUCIÓN:

# 1. Crear archivo con las keys a eliminar
@"
TU_API_KEY_ANTIGUA_1_AQUI
TU_API_KEY_ANTIGUA_2_AQUI
"@ | Out-File -FilePath "secrets-to-remove.txt" -Encoding UTF8

Write-Host "Archivo secrets-to-remove.txt creado" -ForegroundColor Green

# 2. Hacer backup del repositorio
Write-Host "`nCreando backup..." -ForegroundColor Yellow
git clone --mirror . ../encuesta-caba-pwa-backup.git
Write-Host "Backup creado en ../encuesta-caba-pwa-backup.git" -ForegroundColor Green

# 3. Limpiar el historial
Write-Host "`n⚠️  ADVERTENCIA: Vas a reescribir el historial de Git" -ForegroundColor Red
Write-Host "Presiona Ctrl+C para cancelar, o Enter para continuar..." -ForegroundColor Yellow
Read-Host

Write-Host "`nLimpiando historial..." -ForegroundColor Yellow

# Opción A: Usando git filter-repo (si está instalado)
try {
    git filter-repo --replace-text secrets-to-remove.txt --force
    Write-Host "✅ Historial limpiado con git filter-repo" -ForegroundColor Green
} catch {
    Write-Host "❌ git filter-repo no está instalado. Instalando..." -ForegroundColor Yellow
    pip install git-filter-repo
    
    # Intentar de nuevo
    git filter-repo --replace-text secrets-to-remove.txt --force
}

# 4. Limpiar referencias y garbage collection
Write-Host "`nLimpiando referencias..." -ForegroundColor Yellow
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 5. Forzar push a GitHub
Write-Host "`n⚠️  Vas a forzar push a GitHub (esto sobrescribirá el repositorio remoto)" -ForegroundColor Red
Write-Host "Presiona Ctrl+C para cancelar, o Enter para continuar..." -ForegroundColor Yellow
Read-Host

Write-Host "`nSubiendo cambios a GitHub..." -ForegroundColor Yellow
git push origin --force --all
git push origin --force --tags

Write-Host "`n✅ COMPLETADO" -ForegroundColor Green
Write-Host @"

Pasos siguientes:
1. Ve a GitHub Security Alerts y cierra las alertas como 'Revoked'
2. Rota TODAS las API keys en Google Cloud Console
3. Actualiza config.js y sw-config.js con las nuevas keys
4. Notifica a colaboradores que hagan: git pull --rebase

"@ -ForegroundColor Cyan

# Limpiar archivo temporal
Remove-Item secrets-to-remove.txt
