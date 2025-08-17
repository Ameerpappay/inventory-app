# Application Deployment Script for Windows
# Run this script to deploy your Inventory App

param(
    [string]$Domain = $null,
    [string]$GitRepo = "https://github.com/Ameerpappay/inventory-app.git"
)

Write-Host "🚀 Deploying Inventory App to Windows Azure VM..." -ForegroundColor Green

# Function to check if a command exists
function Test-CommandExists {
    param($Command)
    try {
        if (Get-Command $Command -ErrorAction Stop) { return $true }
    } catch {
        return $false
    }
}

# Function to install Chocolatey if not present
function Install-Chocolatey {
    if (-not (Test-CommandExists "choco")) {
        Write-Host "📦 Installing Chocolatey..." -ForegroundColor Yellow
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
        refreshenv
        Write-Host "✅ Chocolatey installed successfully!" -ForegroundColor Green
    } else {
        Write-Host "✅ Chocolatey is already installed" -ForegroundColor Green
    }
}

# Check and install prerequisites
Write-Host "🔍 Checking prerequisites..." -ForegroundColor Yellow

# Install Chocolatey first
Install-Chocolatey

# Check Node.js
if (-not (Test-CommandExists "node")) {
    Write-Host "📦 Installing Node.js..." -ForegroundColor Yellow
    choco install nodejs -y
    refreshenv
    Write-Host "✅ Node.js installed successfully!" -ForegroundColor Green
} else {
    $nodeVersion = node --version
    Write-Host "✅ Node.js is already installed: $nodeVersion" -ForegroundColor Green
}

# Check NPM (should come with Node.js)
if (-not (Test-CommandExists "npm")) {
    Write-Host "❌ NPM not found. Reinstalling Node.js..." -ForegroundColor Red
    choco install nodejs -y --force
    refreshenv
} else {
    $npmVersion = npm --version
    Write-Host "✅ NPM is available: $npmVersion" -ForegroundColor Green
}

# Check Git
if (-not (Test-CommandExists "git")) {
    Write-Host "📦 Installing Git..." -ForegroundColor Yellow
    choco install git -y
    refreshenv
    Write-Host "✅ Git installed successfully!" -ForegroundColor Green
} else {
    $gitVersion = git --version
    Write-Host "✅ Git is already installed: $gitVersion" -ForegroundColor Green
}

# Check PM2
if (-not (Test-CommandExists "pm2")) {
    Write-Host "📦 Installing PM2..." -ForegroundColor Yellow
    npm install -g pm2
    npm install -g pm2-windows-startup
    pm2-startup install
    Write-Host "✅ PM2 installed successfully!" -ForegroundColor Green
} else {
    Write-Host "✅ PM2 is already installed" -ForegroundColor Green
}

# Check PostgreSQL
$pgVersion = $null
try {
    $pgVersion = & "C:\Program Files\PostgreSQL\*\bin\psql.exe" --version 2>$null
} catch {
    # Try alternative paths
    try {
        $pgVersion = psql --version 2>$null
    } catch {
        $pgVersion = $null
    }
}

if (-not $pgVersion) {
    Write-Host "📦 Installing PostgreSQL..." -ForegroundColor Yellow
    choco install postgresql -y --params '/Password:PostgresAdmin123!'
    refreshenv
    Start-Service postgresql* -ErrorAction SilentlyContinue
    Set-Service postgresql* -StartupType Automatic -ErrorAction SilentlyContinue
    Write-Host "✅ PostgreSQL installed successfully!" -ForegroundColor Green
    Write-Host "🔐 Default PostgreSQL password: PostgresAdmin123!" -ForegroundColor Red
} else {
    Write-Host "✅ PostgreSQL is already installed: $pgVersion" -ForegroundColor Green
}

# Check IIS (no .NET Framework check or install)
$iisFeature = Get-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole -ErrorAction SilentlyContinue
if (-not $iisFeature -or $iisFeature.State -ne "Enabled") {
    Write-Host "📦 Enabling IIS..." -ForegroundColor Yellow
    try {
        Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole, IIS-WebServer, IIS-CommonHttpFeatures, IIS-ManagementConsole -All -NoRestart
        Write-Host "✅ IIS enabled successfully!" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ Could not enable IIS. Will use alternative serving method." -ForegroundColor Yellow
    }
} else {
    Write-Host "✅ IIS is already enabled" -ForegroundColor Green
}

Write-Host "✅ All prerequisites checked and installed!" -ForegroundColor Green

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
$APP_DIR = "C:\inetpub\inventory-app"

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

# Create PM2 ecosystem file
$EcosystemContent = @"
module.exports = {
  apps: [{
    name: 'inventory-app-backend',
    script: 'dist/src/index.js',
    cwd: '$($APP_DIR -replace '\\', '\\' )\backend',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
  }]
};
"@

$EcosystemContent | Out-File -FilePath "ecosystem.config.js" -Encoding UTF8

# Create logs directory
if (-not (Test-Path "logs")) {
    New-Item -ItemType Directory -Name "logs"
}

# Start backend with PM2
Write-Host "🚀 Starting backend..." -ForegroundColor Yellow
pm2 delete inventory-app-backend -s 2>$null
pm2 start ecosystem.config.js
pm2 save

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

# Setup IIS Website
Write-Host "🌐 Setting up web server..." -ForegroundColor Yellow

try {
    # Import WebAdministration module
    Import-Module WebAdministration -ErrorAction Stop

    # Remove default website
    Remove-WebSite -Name "Default Web Site" -ErrorAction SilentlyContinue

    # Create application pool
    $PoolName = "InventoryAppPool"
    if (Get-IISAppPool -Name $PoolName -ErrorAction SilentlyContinue) {
        Remove-WebAppPool -Name $PoolName
    }
    New-WebAppPool -Name $PoolName
    Set-ItemProperty -Path "IIS:\AppPools\$PoolName" -Name processModel.identityType -Value ApplicationPoolIdentity

    # Copy frontend build to wwwroot
    $WwwRoot = "C:\inetpub\wwwroot\inventory-app"
    if (Test-Path $WwwRoot) {
        Remove-Item $WwwRoot -Recurse -Force
    }
    Copy-Item "$APP_DIR\frontend\dist" $WwwRoot -Recurse

    # Create simple web.config (without advanced rewrite rules that might not work)
    $WebConfigContent = @"
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

    $WebConfigContent | Out-File -FilePath "$WwwRoot\web.config" -Encoding UTF8

    # Create IIS website
    New-WebSite -Name "InventoryApp" -ApplicationPool $PoolName -PhysicalPath $WwwRoot -Port 80

    Write-Host "✅ IIS website configured successfully!" -ForegroundColor Green
    $IISWorking = $true
    
} catch {
    Write-Host "⚠️ IIS setup failed: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "Setting up alternative frontend server with PM2..." -ForegroundColor Yellow
    $IISWorking = $false
}

# Setup PM2 frontend server as backup or primary method
if (-not $IISWorking) {
    Write-Host "🌐 Starting frontend with PM2..." -ForegroundColor Yellow
    Set-Location "$APP_DIR\frontend"
    pm2 delete inventory-app-frontend -s 2>$null
    pm2 serve dist 80 --name "inventory-app-frontend" --spa
    Write-Host "✅ Frontend server started with PM2!" -ForegroundColor Green
}

Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "🎉 Your application is now accessible at:" -ForegroundColor Green

if ($IISWorking) {
    Write-Host "Frontend (IIS): http://$Domain" -ForegroundColor Cyan
} else {
    Write-Host "Frontend (PM2): http://$Domain" -ForegroundColor Cyan
}

Write-Host "Backend API: http://$Domain:3001/api" -ForegroundColor Cyan
Write-Host "Health Check: http://$Domain:3001/api/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Management Commands:" -ForegroundColor Yellow
Write-Host "Check backend status: pm2 status"
Write-Host "View backend logs: pm2 logs inventory-app-backend"
Write-Host "Restart backend: pm2 restart inventory-app-backend"

if (-not $IISWorking) {
    Write-Host "View frontend logs: pm2 logs inventory-app-frontend" -ForegroundColor Yellow
    Write-Host "Restart frontend: pm2 restart inventory-app-frontend" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🔐 Security Notes:" -ForegroundColor Red
Write-Host "• Change the default PostgreSQL password!"
Write-Host "• Consider setting up HTTPS for production use"
Write-Host "• Update Windows and keep software current"
Write-Host ""

if (-not $IISWorking) {
    Write-Host "📝 Note: Using PM2 to serve frontend since IIS had configuration issues." -ForegroundColor Yellow
    Write-Host "This is perfectly fine for production use." -ForegroundColor Yellow
}

# Clear sensitive variables
$DbPasswordPlain = $null
Remove-Variable DbPasswordPlain, DbPassword -ErrorAction SilentlyContinue
