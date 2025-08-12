#!/bin/bash

# Inventory App Backend Setup Script
echo "🚀 Setting up Inventory App Backend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v18 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js v18 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check if PostgreSQL is running
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL CLI not found. Make sure PostgreSQL is installed and running."
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your database URL and JWT secret before proceeding"
    echo "   Example: DATABASE_URL=\"postgresql://username:password@localhost:5432/inventory-app\""
    read -p "Press Enter after updating .env file to continue..."
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npm run db:generate

if [ $? -ne 0 ]; then
    echo "❌ Failed to generate Prisma client"
    exit 1
fi

echo "✅ Prisma client generated"

# Push database schema
echo "🗄️  Setting up database schema..."
npm run db:push

if [ $? -ne 0 ]; then
    echo "❌ Failed to setup database schema"
    echo "   Make sure your DATABASE_URL is correct and PostgreSQL is running"
    exit 1
fi

echo "✅ Database schema created"

# Seed database
echo "🌱 Seeding database with sample data..."
npm run db:seed

if [ $? -ne 0 ]; then
    echo "❌ Failed to seed database"
    echo "   Database schema is setup but seeding failed"
else
    echo "✅ Database seeded with sample data"
fi

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Sample user credentials:"
echo "   Email: admin@example.com"
echo "   Password: password123"
echo ""
echo "🚀 To start the development server, run:"
echo "   npm run dev"
echo ""
echo "🌐 Server will be available at: http://localhost:3001"
echo "📚 Health check: http://localhost:3001/health"
echo "🗄️  Database GUI: npm run db:studio"
