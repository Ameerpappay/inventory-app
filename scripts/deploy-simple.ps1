# Alternative Simple Deployment for Windows Azure VM
# This version uses minimal IIS features and focuses on basic functionality

param(
    [string]$Domain = $null,
    [string]$GitRepo = "https://github.com/Ameerpappay/inventory-app.git"
)

Write-Host "🚀 Simple Deployment for Windows Azure VM..." -ForegroundColor Green

# Get VM's public IP if domain not provided
if (-not $Domain) {
    try {
        $PublicIP = (Invoke-WebRequest -Uri "http://ipinfo.io/ip" -UseBasicParsing).Content.Trim()
        $Domain = $PublicIP
        Write-Host "Using VM Public IP: $Domain" -ForegroundColor Yellow
    } catch {
        Write-Host "❌ Could not get public IP. Please provide domain manually." -ForegroundColor Red
        exit 1
    }
}

# Set application directory
$APP_DIR = "C:\InventoryApp"

# Clone or update repository
Write-Host "📦 Setting up repository..." -ForegroundColor Yellow
if (Test-Path $APP_DIR) {
    Write-Host "Repository exists, pulling latest changes..."
    Set-Location $APP_DIR
    git pull origin master
} else {
    git clone $GitRepo $APP_DIR
    Set-Location $APP_DIR
}

# Setup Backend
Write-Host "📦 Setting up backend..." -ForegroundColor Yellow
Set-Location "$APP_DIR\backend"

# Install backend dependencies
npm install

# Prompt for environment variables
Write-Host "🔧 Configuring environment variables..." -ForegroundColor Yellow
$DbPassword = Read-Host "Enter database password for inventory_user" -AsSecureString
$DbPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($DbPassword))

$JwtSecret = Read-Host "Enter a secure JWT secret (minimum 64 characters)"
if ($JwtSecret.Length -lt 64) {
    Write-Host "⚠️ JWT secret should be at least 64 characters for security!" -ForegroundColor Yellow
    $JwtSecret = -join ((1..64) | ForEach {Get-Random -input ([char[]]([char]'a'..[char]'z') + [char[]]([char]'A'..[char]'Z') + [char[]]([char]'0'..[char]'9'))})
    Write-Host "Generated random JWT secret: $JwtSecret" -ForegroundColor Green
}

# Create .env.production file
$EnvContent = @"
NODE_ENV=production
PORT=3001
DATABASE_URL="postgresql://inventory_user:$DbPasswordPlain@localhost:5432/inventory_app_prod?schema=public"
JWT_SECRET=$JwtSecret
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://$Domain
DEBUG=false
"@

$EnvContent | Out-File -FilePath ".env.production" -Encoding UTF8

# Generate Prisma client and run migrations
Write-Host "🔧 Setting up database..." -ForegroundColor Yellow
npm run db:generate
npm run db:migrate:prod

# Build backend
Write-Host "🔨 Building backend..." -ForegroundColor Yellow
npm run build

# Setup Frontend
Write-Host "📦 Setting up frontend..." -ForegroundColor Yellow
Set-Location "$APP_DIR\frontend"

# Install frontend dependencies
npm install

# Create frontend .env.production
$FrontendEnvContent = @"
VITE_API_URL=http://$Domain:3001/api
VITE_NODE_ENV=production
VITE_APP_NAME=Inventory App
VITE_DEBUG=false
"@

$FrontendEnvContent | Out-File -FilePath ".env.production" -Encoding UTF8

# Build frontend
Write-Host "🔨 Building frontend..." -ForegroundColor Yellow
npm run build

# Simple IIS setup - just copy files to wwwroot
Write-Host "🌐 Setting up web server..." -ForegroundColor Yellow

# Create simple wwwroot directory
$WwwRoot = "C:\inetpub\wwwroot"
if (-not (Test-Path $WwwRoot)) {
    New-Item -ItemType Directory -Path $WwwRoot -Force
}

# Copy frontend files
Copy-Item "$APP_DIR\frontend\dist\*" $WwwRoot -Recurse -Force

# Create simple web.config (without URL rewrite dependencies)
$SimpleWebConfig = @"
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <defaultDocument>
      <files>
        <clear />
        <add value="index.html" />
      </files>
    </defaultDocument>
    <staticContent>
      <mimeMap fileExtension=".json" mimeType="application/json" />
      <mimeMap fileExtension=".js" mimeType="application/javascript" />
    </staticContent>
  </system.webServer>
</configuration>
"@

$SimpleWebConfig | Out-File -FilePath "$WwwRoot\web.config" -Encoding UTF8

# Start backend with PM2
Write-Host "🚀 Starting backend..." -ForegroundColor Yellow
Set-Location "$APP_DIR\backend"

# Create simple PM2 start command
pm2 delete inventory-app-backend -s 2>$null
pm2 start dist/src/index.js --name "inventory-app-backend"
pm2 save

# Start a simple frontend server as backup (in case IIS has issues)
Write-Host "🌐 Starting frontend server..." -ForegroundColor Yellow
Set-Location "$APP_DIR\frontend"
pm2 delete inventory-app-frontend -s 2>$null
pm2 serve dist 8080 --name "inventory-app-frontend" --spa

Write-Host "✅ Simple deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "🎉 Your application is accessible at:" -ForegroundColor Green
Write-Host "Backend API: http://$Domain:3001/api" -ForegroundColor Cyan
Write-Host "Health Check: http://$Domain:3001/api/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "Frontend options:" -ForegroundColor Yellow
Write-Host "IIS (if working): http://$Domain" -ForegroundColor Cyan
Write-Host "PM2 serve: http://$Domain:8080" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Management Commands:" -ForegroundColor Yellow
Write-Host "Check status: pm2 status"
Write-Host "View logs: pm2 logs"
Write-Host "Restart backend: pm2 restart inventory-app-backend"
Write-Host "Restart frontend: pm2 restart inventory-app-frontend"

# Clear sensitive variables
$DbPasswordPlain = $null
Remove-Variable DbPasswordPlain, DbPassword -ErrorAction SilentlyContinue
