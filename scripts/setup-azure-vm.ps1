# Windows Azure VM Setup Script
# Run this PowerShell script as Administrator on your Azure VM

Write-Host "🚀 Setting up Windows Azure VM for Inventory App deployment..." -ForegroundColor Green

# Check if running as Administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "❌ This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

# Enable TLS 1.2 for downloads
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

# Install Chocolatey (Package Manager for Windows)
Write-Host "📦 Installing Chocolatey..." -ForegroundColor Yellow
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Refresh environment variables
refreshenv

# Install Node.js
Write-Host "📦 Installing Node.js..." -ForegroundColor Yellow
choco install nodejs -y

# Install Git
Write-Host "📦 Installing Git..." -ForegroundColor Yellow
choco install git -y

# Install PostgreSQL
Write-Host "🗄️ Installing PostgreSQL..." -ForegroundColor Yellow
choco install postgresql -y --params '/Password:PostgresAdmin123!'

# Refresh environment variables again
refreshenv

# Start PostgreSQL service
Write-Host "🔧 Starting PostgreSQL service..." -ForegroundColor Yellow
Start-Service postgresql*
Set-Service postgresql* -StartupType Automatic

# Install PM2 globally
Write-Host "🔧 Installing PM2..." -ForegroundColor Yellow
npm install -g pm2
npm install -g pm2-windows-startup
pm2-startup install

# Configure Windows Firewall
Write-Host "🔒 Configuring Windows Firewall..." -ForegroundColor Yellow
New-NetFirewallRule -DisplayName "Allow HTTP Port 80" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow
New-NetFirewallRule -DisplayName "Allow HTTPS Port 443" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow
New-NetFirewallRule -DisplayName "Allow Backend Port 3001" -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow

# Enable IIS with compatibility check
Write-Host "🌐 Enabling IIS..." -ForegroundColor Yellow

# Check Windows version and available features
$WindowsVersion = Get-WmiObject -Class Win32_OperatingSystem | Select-Object -ExpandProperty Version
Write-Host "Windows Version: $WindowsVersion" -ForegroundColor Cyan

# Install .NET Framework 4.8 if not present
Write-Host "📦 Checking .NET Framework..." -ForegroundColor Yellow
$DotNetVersion = Get-ItemProperty "HKLM:SOFTWARE\Microsoft\NET Framework Setup\NDP\v4\Full\" -Name Release -ErrorAction SilentlyContinue
if (-not $DotNetVersion -or $DotNetVersion.Release -lt 528040) {
    Write-Host "Installing .NET Framework 4.8..." -ForegroundColor Yellow
    choco install dotnetfx -y
    Write-Host "⚠️ .NET Framework installed. A restart may be required." -ForegroundColor Yellow
}

# Try to enable IIS features step by step
try {
    # Basic IIS features first
    Write-Host "Enabling basic IIS features..." -ForegroundColor Yellow
    Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole, IIS-WebServer, IIS-CommonHttpFeatures, IIS-HttpErrors, IIS-HttpRedirect -All -NoRestart
    
    # Application development features
    Write-Host "Enabling IIS application development features..." -ForegroundColor Yellow
    Enable-WindowsOptionalFeature -Online -FeatureName IIS-ApplicationDevelopment, IIS-ISAPIExtensions, IIS-ISAPIFilter -All -NoRestart
    
    # Management console
    Write-Host "Enabling IIS management console..." -ForegroundColor Yellow
    Enable-WindowsOptionalFeature -Online -FeatureName IIS-ManagementConsole -All -NoRestart
    
    # Try .NET features (these might fail on older Windows versions)
    Write-Host "Attempting to enable .NET features for IIS..." -ForegroundColor Yellow
    try {
        Enable-WindowsOptionalFeature -Online -FeatureName IIS-NetFxExtensibility45, IIS-ASPNET45 -All -NoRestart -ErrorAction Stop
    } catch {
        Write-Host "⚠️ Some .NET features for IIS couldn't be enabled. This is normal for some Windows versions." -ForegroundColor Yellow
        Write-Host "IIS will still work for serving static files." -ForegroundColor Yellow
    }
    
    # Alternative: Try .NET 4.x features
    try {
        Enable-WindowsOptionalFeature -Online -FeatureName IIS-NetFxExtensibility, IIS-ASPNET -All -NoRestart -ErrorAction Stop
    } catch {
        Write-Host "⚠️ Legacy .NET features also not available. Using basic IIS configuration." -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "⚠️ Some IIS features couldn't be enabled: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "IIS basic functionality should still work." -ForegroundColor Yellow
}

Write-Host "✅ Windows Azure VM setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Restart your VM to ensure all services start properly"
Write-Host "2. Run setup-database.ps1 to configure PostgreSQL"
Write-Host "3. Run deploy-app.ps1 to deploy your application"
Write-Host ""
Write-Host "Default PostgreSQL password: PostgresAdmin123!" -ForegroundColor Red
Write-Host "⚠️ Remember to change this password for production!" -ForegroundColor Red
