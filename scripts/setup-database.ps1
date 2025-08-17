# Database Setup Script for Windows
# Run this after setup-azure-vm.ps1

Write-Host "🗄️ Setting up PostgreSQL database for Inventory App..." -ForegroundColor Green

# Database configuration
$DB_NAME = "inventory_app_prod"
$DB_USER = "inventory_user"

# Prompt for secure password
$SecurePassword = Read-Host "Enter a secure password for database user ($DB_USER)" -AsSecureString
$PlainPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecurePassword))

# Set PostgreSQL environment variables
$env:PGPASSWORD = "PostgresAdmin123!"  # Default postgres password from setup

Write-Host "Creating database and user..." -ForegroundColor Yellow

# Create SQL commands
$SqlCommands = @"
CREATE DATABASE $DB_NAME;
CREATE USER $DB_USER WITH PASSWORD '$PlainPassword';
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
ALTER USER $DB_USER CREATEDB;
"@

# Execute SQL commands
$SqlCommands | & "C:\Program Files\PostgreSQL\*\bin\psql.exe" -U postgres -h localhost

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database setup complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Database Details:" -ForegroundColor Yellow
    Write-Host "Database Name: $DB_NAME"
    Write-Host "Database User: $DB_USER"
    Write-Host "Connection String: postgresql://$DB_USER`:$PlainPassword@localhost:5432/$DB_NAME"
    Write-Host ""
    Write-Host "⚠️ Save these credentials - you'll need them for .env.production" -ForegroundColor Red
} else {
    Write-Host "❌ Database setup failed!" -ForegroundColor Red
    Write-Host "Please check that PostgreSQL is running and try again."
}

# Clear password from memory
$PlainPassword = $null
$SecurePassword = $null
Remove-Variable SecurePassword, PlainPassword -ErrorAction SilentlyContinue
