# PowerShell function para automatizar git commits
# Agregar esta función al perfil de PowerShell o ejecutar antes de usarla

function Git-Update {
    param(
        [Parameter(Mandatory=$true)]
        [string]$Message
    )
    
    Write-Host "🔄 Agregando cambios a Git..." -ForegroundColor Cyan
    git add .
    
    Write-Host "💾 Creando commit: $Message" -ForegroundColor Yellow
    git commit -m $Message
    
    Write-Host "⬆️ Subiendo a GitHub..." -ForegroundColor Green
    git push origin main
    
    Write-Host "✅ Cambios actualizados en GitHub!" -ForegroundColor Green
    Write-Host "📍 Repositorio: https://github.com/juanpyto22/Busfare-Tokens" -ForegroundColor Blue
}

# Ejemplos de uso:
# Git-Update "Arreglar sistema de registro"
# Git-Update "Cambiar tokens iniciales a 1"
# Git-Update "Agregar nueva funcionalidad"