# Azure VM Deployment Guide

## Prerequisites on Azure VM

### 1. Connect to Your Azure VM

```bash
# SSH into your Azure VM (replace with your VM's public IP)
ssh azureuser@<your-vm-public-ip>
```

### 2. Install Required Software

#### Install Node.js and npm

```bash
# Update package manager
sudo apt update

# Install Node.js (LTS version)
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

#### Install PostgreSQL

```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql
```

In PostgreSQL shell:

```sql
CREATE DATABASE inventory_app_prod;
CREATE USER inventory_user WITH PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE inventory_app_prod TO inventory_user;
\q
```

#### Install PM2 (Process Manager)

```bash
sudo npm install -g pm2
```

#### Install Nginx (Web Server)

```bash
sudo apt install nginx
```

### 3. Configure Firewall

```bash
# Allow HTTP, HTTPS, and SSH
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## Deployment Steps

### Step 1: Upload Your Code

#### Option A: Using Git (Recommended)

```bash
# On your Azure VM
git clone https://github.com/Ameerpappay/inventory-app.git
cd inventory-app
```

#### Option B: Using SCP

```bash
# From your local machine
scp -r d:\InventoryApp azureuser@<vm-ip>:~/inventory-app
```

### Step 2: Set Up Backend

```bash
cd inventory-app/backend

# Install dependencies
npm install

# Create production environment file
nano .env.production
```

Add to `.env.production`:

```env
NODE_ENV=production
PORT=3001
DATABASE_URL="postgresql://inventory_user:your_secure_password_here@localhost:5432/inventory_app_prod?schema=public"
JWT_SECRET=your_super_secure_64_character_jwt_secret_for_production_2025_random
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://<your-vm-public-ip>
DEBUG=false
```

```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate:prod

# Build the application
npm run build

# Start with PM2
pm2 start dist/src/index.js --name "inventory-backend"
pm2 save
pm2 startup
```

### Step 3: Set Up Frontend

```bash
cd ../frontend

# Install dependencies
npm install

# Create production environment file
nano .env.production
```

Add to `.env.production`:

```env
VITE_API_URL=http://<your-vm-public-ip>:3001/api
VITE_NODE_ENV=production
VITE_APP_NAME=Inventory App
VITE_DEBUG=false
```

```bash
# Build for production
npm run build
```

### Step 4: Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/inventory-app
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name <your-vm-public-ip>;

    # Frontend (React app)
    location / {
        root /home/azureuser/inventory-app/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/inventory-app /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

### Step 5: Set Up SSL (Optional but Recommended)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo crontab -e
# Add this line:
# 0 12 * * * /usr/bin/certbot renew --quiet
```

## Monitoring and Maintenance

### PM2 Commands

```bash
pm2 status                 # Check status
pm2 logs inventory-backend # View logs
pm2 restart inventory-backend # Restart app
pm2 stop inventory-backend    # Stop app
```

### Database Backup

```bash
# Create backup script
nano ~/backup-db.sh
```

Add to backup script:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/azureuser/backups"
mkdir -p $BACKUP_DIR

pg_dump -h localhost -U inventory_user inventory_app_prod > $BACKUP_DIR/inventory_backup_$DATE.sql
echo "Backup created: $BACKUP_DIR/inventory_backup_$DATE.sql"
```

```bash
chmod +x ~/backup-db.sh

# Set up daily backup cron job
crontab -e
# Add: 0 2 * * * /home/azureuser/backup-db.sh
```

## Security Considerations

### 1. Environment Variables

- Never commit `.env.production` to git
- Use strong, unique passwords
- Generate a secure JWT secret (64+ characters)

### 2. Database Security

```bash
# Edit PostgreSQL config
sudo nano /etc/postgresql/*/main/postgresql.conf
# Ensure: listen_addresses = 'localhost'

sudo nano /etc/postgresql/*/main/pg_hba.conf
# Use md5 authentication for local connections
```

### 3. Regular Updates

```bash
# Update system packages
sudo apt update && sudo apt upgrade

# Update Node.js dependencies
npm audit fix
```

## Troubleshooting

### Check Services Status

```bash
sudo systemctl status nginx
sudo systemctl status postgresql
pm2 status
```

### View Logs

```bash
pm2 logs inventory-backend
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Common Issues

1. **Port 3001 blocked**: Check firewall rules
2. **Database connection fails**: Verify PostgreSQL is running and credentials are correct
3. **Frontend not loading**: Check nginx configuration and file permissions
4. **API calls failing**: Verify CORS settings and API URL in frontend

## Access Your Application

Once deployed, access your app at:

- **Frontend**: `http://<your-vm-public-ip>`
- **Backend API**: `http://<your-vm-public-ip>/api`
- **Health Check**: `http://<your-vm-public-ip>/api/health`

For HTTPS (if SSL configured):

- **Frontend**: `https://yourdomain.com`
- **Backend API**: `https://yourdomain.com/api`
