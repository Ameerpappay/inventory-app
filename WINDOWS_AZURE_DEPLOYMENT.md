# Windows Azure VM Deployment Guide

For deploying to a Windows Azure VM instead of Linux.

## Prerequisites

1. **Windows Server 2019/2022 Azure VM**
2. **Remote Desktop** access to your VM
3. **PowerShell** (comes with Windows)

## Installation Steps

### Step 1: Connect via Remote Desktop

Use Remote Desktop Connection to connect to your Windows Azure VM.

### Step 2: Install Prerequisites

#### Install Node.js

1. Download Node.js LTS from https://nodejs.org/
2. Run the installer and follow the wizard
3. Verify installation:
   ```powershell
   node --version
   npm --version
   ```

#### Install PostgreSQL

1. Download PostgreSQL from https://www.postgresql.org/download/windows/
2. Run installer and remember the password you set
3. Add PostgreSQL to system PATH

#### Install Git

1. Download Git from https://git-scm.com/download/win
2. Install with default settings

### Step 3: Setup Database

Open PowerShell as Administrator:

```powershell
# Connect to PostgreSQL
psql -U postgres

# In PostgreSQL shell:
CREATE DATABASE inventory_app_prod;
CREATE USER inventory_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE inventory_app_prod TO inventory_user;
\q
```

### Step 4: Deploy Application

```powershell
# Clone repository
git clone https://github.com/Ameerpappay/inventory-app.git
cd inventory-app

# Setup backend
cd backend
npm install

# Create .env.production file
New-Item -Path ".env.production" -ItemType File
# Edit with notepad and add:
```

**.env.production content:**

```env
NODE_ENV=production
PORT=3001
DATABASE_URL="postgresql://inventory_user:your_password@localhost:5432/inventory_app_prod?schema=public"
JWT_SECRET=your_super_secure_jwt_secret_64_chars_min_for_production_2025
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://your-vm-public-ip
DEBUG=false
```

```powershell
# Generate Prisma client and run migrations
npm run db:generate
npm run db:migrate:prod

# Build backend
npm run build

# Install PM2 globally
npm install -g pm2

# Start backend with PM2
pm2 start dist/src/index.js --name "inventory-backend"
pm2 save
pm2 startup
```

### Step 5: Setup Frontend

```powershell
# Setup frontend
cd ..\frontend
npm install

# Create .env.production
New-Item -Path ".env.production" -ItemType File
# Add content:
```

**.env.production content:**

```env
VITE_API_URL=http://your-vm-public-ip:3001/api
VITE_NODE_ENV=production
VITE_APP_NAME=Inventory App
VITE_DEBUG=false
```

```powershell
# Build frontend
npm run build
```

### Step 6: Setup IIS (Alternative to Nginx)

1. **Enable IIS**:

   - Open "Turn Windows features on or off"
   - Enable "Internet Information Services"
   - Enable "IIS Management Console"

2. **Configure IIS**:

   - Open IIS Manager
   - Create new site pointing to `frontend/dist` folder
   - Set port to 80

3. **Install IIS URL Rewrite** (for SPA routing):
   - Download from Microsoft
   - Create web.config in dist folder:

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="React Routes" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="/" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
```

### Step 7: Configure Firewall

```powershell
# Open Windows Firewall
# Allow inbound connections on ports 80, 3001, 3389 (RDP)
New-NetFirewallRule -DisplayName "Allow HTTP" -Direction Inbound -Protocol TCP -LocalPort 80
New-NetFirewallRule -DisplayName "Allow Backend" -Direction Inbound -Protocol TCP -LocalPort 3001
```

## Accessing Your App

- **Frontend**: `http://your-vm-public-ip`
- **Backend**: `http://your-vm-public-ip:3001`
- **Health Check**: `http://your-vm-public-ip:3001/api/health`

## Alternative: Use IIS with Reverse Proxy

Install Application Request Routing (ARR) for IIS to proxy API requests to your Node.js backend.
