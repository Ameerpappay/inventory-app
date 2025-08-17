# Quick Start Script for Windows Azure VM
# This script runs all deployment steps in sequence

Write-Host "🚀 Quick Start: Deploying Inventory App on Windows Azure VM" -ForegroundColor Green
Write-Host "This will install all prerequisites and deploy your application" -ForegroundColor Yellow
Write-Host ""

# Check if running as Administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "❌ This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

$confirmation = Read-Host "Do you want to continue with the full deployment? (y/N)"
if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
    Write-Host "Deployment cancelled." -ForegroundColor Yellow
    exit 0
}

try {
    # Step 1: VM Setup
    Write-Host "`n=== STEP 1: Setting up VM ===" -ForegroundColor Magenta
    & "$PSScriptRoot\setup-azure-vm.ps1"
    if ($LASTEXITCODE -ne 0) { throw "VM setup failed" }
    
    Write-Host "`n⚠️ VM setup complete. If .NET Framework was installed, a restart is recommended." -ForegroundColor Yellow
    $restart = Read-Host "Do you want to restart now? (y/N)"
    if ($restart -eq 'y' -or $restart -eq 'Y') {
        Write-Host "Restarting system..." -ForegroundColor Yellow
        Restart-Computer -Force
        exit 0
    }
    
    Write-Host "`n=== STEP 2: Setting up Database ===" -ForegroundColor Magenta
    & "$PSScriptRoot\setup-database.ps1"
    if ($LASTEXITCODE -ne 0) { throw "Database setup failed" }
    
    Write-Host "`n=== STEP 3: Deploying Application ===" -ForegroundColor Magenta
    Write-Host "Choose deployment method:" -ForegroundColor Yellow
    Write-Host "1. Full deployment with IIS (recommended if no errors above)"
    Write-Host "2. Simple deployment (if .NET Framework issues occurred)"
    $choice = Read-Host "Enter choice (1 or 2)"
    
    if ($choice -eq "2") {
        & "$PSScriptRoot\deploy-simple.ps1"
    } else {
        & "$PSScriptRoot\deploy-app.ps1"
    }
    
    if ($LASTEXITCODE -ne 0) { throw "Application deployment failed" }
    
    Write-Host "`n🎉 DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
    Write-Host "Your Inventory App is now running on this Windows Azure VM" -ForegroundColor Green
    
} catch {
    Write-Host "`n❌ DEPLOYMENT FAILED: $_" -ForegroundColor Red
    Write-Host "Please check the error messages above and try running the individual scripts manually." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "If you're having .NET Framework issues, try:" -ForegroundColor Yellow
    Write-Host "1. Run setup-database.ps1"
    Write-Host "2. Run deploy-simple.ps1 (this avoids complex IIS features)"
    exit 1
}
