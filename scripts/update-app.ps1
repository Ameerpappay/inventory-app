# Maintenance Scripts for Windows Azure VM

# Update Application
Write-Host "🔄 Updating Inventory App..." -ForegroundColor Green

$APP_DIR = "C:\inetpub\inventory-app"

if (-not (Test-Path $APP_DIR)) {
    Write-Host "❌ Application directory not found: $APP_DIR" -ForegroundColor Red
    exit 1
}

Set-Location $APP_DIR

# Pull latest changes
Write-Host "📦 Pulling latest changes from Git..." -ForegroundColor Yellow
git pull origin master

# Update backend
Write-Host "🔧 Updating backend..." -ForegroundColor Yellow
Set-Location "$APP_DIR\backend"
npm install
npm run build

# Update frontend
Write-Host "🎨 Updating frontend..." -ForegroundColor Yellow
Set-Location "$APP_DIR\frontend"
npm install
npm run build

# Copy new frontend build
$WwwRoot = "C:\inetpub\wwwroot\inventory-app"
Remove-Item $WwwRoot -Recurse -Force
Copy-Item "$APP_DIR\frontend\dist" $WwwRoot -Recurse

# Restart backend
Write-Host "🔄 Restarting backend..." -ForegroundColor Yellow
pm2 restart inventory-app-backend

Write-Host "✅ Application updated successfully!" -ForegroundColor Green

# ---

Write-Host "`n📊 Application Status:" -ForegroundColor Yellow
pm2 status

Write-Host "`n🌐 IIS Status:" -ForegroundColor Yellow
Get-WebSite -Name "InventoryApp"
