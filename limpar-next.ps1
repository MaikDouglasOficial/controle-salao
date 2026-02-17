# Remove a pasta .next para corrigir erro EINVAL readlink (Windows/OneDrive)
# Execute: .\limpar-next.ps1   (com o terminal NA PASTA do projeto)
# Depois: npm run dev

$nextPath = Join-Path $PSScriptRoot ".next"
if (Test-Path $nextPath) {
    Remove-Item -Path $nextPath -Recurse -Force -ErrorAction Stop
    Write-Host "Pasta .next removida. Rode: npm run dev" -ForegroundColor Green
} else {
    Write-Host "Pasta .next nao existe. Rode: npm run dev" -ForegroundColor Yellow
}
