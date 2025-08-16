#!/bin/bash

# Production Deployment Script
# Run this script on your Azure VM after cloning the repository

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Inventory App deployment...${NC}"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Not in the project root directory${NC}"
    echo "Please run this script from the inventory-app directory"
    exit 1
fi

# Prompt for environment variables
echo -e "${YELLOW}📝 Setting up environment variables...${NC}"
read -p "Enter your VM's public IP: " VM_IP
read -s -p "Enter database password: " DB_PASSWORD
echo ""
read -s -p "Enter JWT secret (64+ characters): " JWT_SECRET
echo ""

# Deploy Backend
echo -e "${GREEN}🔧 Deploying backend...${NC}"
cd backend

# Create production environment file
cat > .env.production << EOF
NODE_ENV=production
PORT=3001
DATABASE_URL="postgresql://inventory_user:$DB_PASSWORD@localhost:5432/inventory_app_prod?schema=public"
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://$VM_IP
DEBUG=false
EOF

echo "✅ Created backend .env.production"

# Install dependencies and build
npm install
npm run db:generate
npm run build

# Stop existing PM2 process if running
pm2 delete inventory-backend 2>/dev/null || true

# Start with PM2
pm2 start dist/src/index.js --name "inventory-backend"
pm2 save

echo "✅ Backend deployed and running"

# Deploy Frontend
echo -e "${GREEN}🎨 Deploying frontend...${NC}"
cd ../frontend

# Create production environment file
cat > .env.production << EOF
VITE_API_URL=http://$VM_IP:3001/api
VITE_NODE_ENV=production
VITE_APP_NAME=Inventory App
VITE_DEBUG=false
EOF

echo "✅ Created frontend .env.production"

# Install dependencies and build
npm install
npm run build

echo "✅ Frontend built successfully"

# Configure Nginx
echo -e "${GREEN}🌐 Configuring Nginx...${NC}"
sudo tee /etc/nginx/sites-available/inventory-app > /dev/null << EOF
server {
    listen 80;
    server_name $VM_IP;

    # Frontend (React app)
    location / {
        root $(pwd)/dist;
        index index.html;
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

# Enable the site
sudo ln -sf /etc/nginx/sites-available/inventory-app /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and restart nginx
sudo nginx -t
if [ $? -eq 0 ]; then
    sudo systemctl restart nginx
    echo "✅ Nginx configured and restarted"
else
    echo -e "${RED}❌ Nginx configuration error${NC}"
    exit 1
fi

# Run database migrations
echo -e "${GREEN}🗄️  Running database migrations...${NC}"
cd ../backend
npm run db:migrate:prod

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo -e "${YELLOW}🌐 Your application is now available at:${NC}"
echo "Frontend: http://$VM_IP"
echo "Backend API: http://$VM_IP/api"
echo "Health Check: http://$VM_IP/api/health"
echo ""
echo -e "${YELLOW}📊 Useful commands:${NC}"
echo "pm2 status                 # Check backend status"
echo "pm2 logs inventory-backend # View backend logs"
echo "sudo systemctl status nginx # Check nginx status"
