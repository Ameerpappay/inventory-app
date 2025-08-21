#!/bin/bash

# Deployment Script for Azure VM
# Run this script to deploy your inventory app

echo "🚀 Deploying Inventory App to Azure VM..."

# Set variables
REPO_URL="https://github.com/Ameerpappay/inventory-app.git"
APP_DIR="/home/$(whoami)/inventory-app"
DOMAIN="your-domain.com"  # Replace with your actual domain

# Clone repository
echo "📦 Cloning repository..."
if [ -d "$APP_DIR" ]; then
    echo "Directory exists, pulling latest changes..."
    cd $APP_DIR
    git pull origin master
else
    git clone $REPO_URL $APP_DIR
    cd $APP_DIR
fi

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install

# Build backend
echo "🔨 Building backend..."
npm run build

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install

# Build frontend
echo "🔨 Building frontend..."
npm run build

# Copy frontend build to nginx
echo "🌐 Setting up Nginx..."
sudo cp -r dist/* /var/www/html/

# Create nginx config
sudo tee /etc/nginx/sites-available/inventory-app << EOF
server {
    listen 80;
    server_name $DOMAIN;

    # Frontend
    location / {
        root /var/www/html;
        try_files \$uri \$uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/inventory-app /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and restart nginx
sudo nginx -t
sudo systemctl restart nginx

# Setup PM2 for backend
echo "🔧 Setting up PM2..."
cd $APP_DIR/backend

# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'inventory-app-backend',
    script: 'dist/src/index.js',
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
    log_file: './logs/combined.outerr.log',
  }]
};
EOF

# Create logs directory
mkdir -p logs

# Start application with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo "✅ Deployment complete!"
echo ""
echo "Your app should be running at:"
echo "Frontend: http://$DOMAIN"
echo "Backend API: http://$DOMAIN/api"
echo ""
echo "To check backend status:"
echo "pm2 status"
echo "pm2 logs inventory-app-backend"
