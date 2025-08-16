#!/bin/bash

# Azure VM Setup Script
# Run this script on your Azure VM to install all prerequisites

echo "🚀 Setting up Azure VM for Inventory App deployment..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
echo "🗄️  Installing PostgreSQL..."
sudo apt install postgresql postgresql-contrib -y

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Install PM2
echo "🔧 Installing PM2..."
sudo npm install -g pm2

# Install Nginx
echo "🌐 Installing Nginx..."
sudo apt install nginx -y

# Configure firewall
echo "🔒 Configuring firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# Install Git (if not already installed)
echo "📦 Installing Git..."
sudo apt install git -y

echo "✅ Azure VM setup complete!"
echo ""
echo "Next steps:"
echo "1. Create PostgreSQL database and user"
echo "2. Clone your repository"
echo "3. Run the deployment script"
