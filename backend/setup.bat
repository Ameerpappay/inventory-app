@echo off
REM Inventory App Backend Setup Script for Windows
echo 🚀 Setting up Inventory App Backend...

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js v18 or higher.
    pause
    exit /b 1
)

echo ✅ Node.js detected: 
node --version

REM Install dependencies
echo 📦 Installing dependencies...
npm install
if errorlevel 1 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo ✅ Dependencies installed successfully

REM Check if .env file exists
if not exist .env (
    echo 📝 Creating .env file from template...
    copy .env.example .env
    echo ⚠️  Please edit .env file with your database URL and JWT secret before proceeding
    echo    Example: DATABASE_URL="postgresql://username:password@localhost:5432/inventory-app"
    pause
)

REM Generate Prisma client
echo 🔧 Generating Prisma client...
npm run db:generate
if errorlevel 1 (
    echo ❌ Failed to generate Prisma client
    pause
    exit /b 1
)

echo ✅ Prisma client generated

REM Push database schema
echo 🗄️  Setting up database schema...
npm run db:push
if errorlevel 1 (
    echo ❌ Failed to setup database schema
    echo    Make sure your DATABASE_URL is correct and PostgreSQL is running
    pause
    exit /b 1
)

echo ✅ Database schema created

REM Seed database
echo 🌱 Seeding database with sample data...
npm run db:seed
if errorlevel 1 (
    echo ❌ Failed to seed database
    echo    Database schema is setup but seeding failed
) else (
    echo ✅ Database seeded with sample data
)

echo.
echo 🎉 Setup completed successfully!
echo.
echo 📋 Sample user credentials:
echo    Email: admin@example.com
echo    Password: password123
echo.
echo 🚀 To start the development server, run:
echo    npm run dev
echo.
echo 🌐 Server will be available at: http://localhost:3001
echo 📚 Health check: http://localhost:3001/health
echo 🗄️  Database GUI: npm run db:studio
echo.
pause
