#!/bin/bash

# Database Setup Script for Azure VM
# Run this script after setting up the VM

echo "🗄️  Setting up PostgreSQL database..."

# Prompt for database password
read -s -p "Enter password for inventory_user: " DB_PASSWORD
echo ""

# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE inventory_app_prod;
CREATE USER inventory_user WITH PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE inventory_app_prod TO inventory_user;
ALTER USER inventory_user CREATEDB;
\q
EOF

echo "✅ Database setup complete!"
echo "Database: inventory_app_prod"
echo "User: inventory_user"
echo "Password: [hidden]"
echo ""
echo "Connection string format:"
echo "postgresql://inventory_user:$DB_PASSWORD@localhost:5432/inventory_app_prod"
