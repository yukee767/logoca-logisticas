# LogoCá — dev.ps1 (Windows)
# Sobe todos os serviços para desenvolvimento local
Write-Host "== LogoCá Logísticas — Dev ==" -ForegroundColor Cyan
Write-Host "Contato: logocalogisticas@contato.com" -ForegroundColor DarkGray
if (-not (Test-Path ".env")) { Copy-Item ".env.example" ".env"; Write-Host "Criado .env a partir de .env.example" -ForegroundColor Yellow }
Write-Host "Subindo infra via docker compose..." -ForegroundColor Green
docker compose up -d postgres redis rabbitmq zookeeper kafka ignite
Write-Host "Aguardando healthchecks (30s)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30
docker compose ps
Write-Host "Infra pronta. Para subir backends/frontends:" -ForegroundColor Green
Write-Host "  cd backend-nest && npm run start:dev    # :3000"
Write-Host "  cd backend-fastapi && uvicorn app.main:app --reload --port 8000  # :8000"
Write-Host "  cd backend-django && python manage.py runserver 8001  # :8001"
Write-Host "  cd frontend-angular && npm start        # :4200"
Write-Host "  cd frontend-next && npm run dev         # :3001"
