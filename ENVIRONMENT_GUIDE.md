# Environment Management Guide

This guide explains how to use environment-specific configuration files in this Inventory App.

## Environment Files Structure

```
backend/
├── .env.development    # Development environment
├── .env.production     # Production environment (never commit)
└── .env.local          # Local overrides (never commit)

frontend/
├── .env.development   # Development environment
├── .env.production    # Production environment (never commit)
└── .env.local         # Local overrides (never commit)
```

## How It Works

### Backend (Node.js/Express)

The backend uses the standard `dotenv` library with a simple environment loader:

- Loads `.env.development` for development
- Loads `.env.production` for production
- Loads `.env.local` for personal overrides (highest priority)

### Frontend (Vite/React)

Vite automatically loads environment files based on the `--mode` flag:

- `vite --mode development` loads `.env.development`
- `vite build --mode production` loads `.env.production`

## Development Workflow

### Local Development

```bash
# Backend
cd backend
npm run dev                    # Uses .env.development

# Frontend
cd frontend
npm run dev                    # Uses .env.development
```

### Production Deployment

```bash
# Backend
cd backend
npm run build                 # Build TypeScript
npm run start                 # Uses .env.production

# Frontend
cd frontend
npm run build                 # Uses .env.production
npm run preview               # Preview production build
```

## Environment Variables Reference

### Backend Variables

| Variable         | Development           | Production         | Description         |
| ---------------- | --------------------- | ------------------ | ------------------- |
| `NODE_ENV`       | development           | production         | Runtime environment |
| `PORT`           | 3001                  | 3001               | Server port         |
| `DATABASE_URL`   | Local PostgreSQL      | Production DB      | Database connection |
| `JWT_SECRET`     | Dev secret            | Secure secret      | JWT signing key     |
| `FRONTEND_URL`   | http://localhost:5173 | https://domain.com | CORS origin         |
| `JWT_EXPIRES_IN` | 7d                    | 7d                 | JWT expiration      |
| `DEBUG`          | true                  | false              | Debug logging       |

### Frontend Variables

| Variable        | Development               | Production                 | Description      |
| --------------- | ------------------------- | -------------------------- | ---------------- |
| `VITE_API_URL`  | http://localhost:3001/api | https://api.domain.com/api | Backend API URL  |
| `VITE_NODE_ENV` | development               | production                 | App environment  |
| `VITE_APP_NAME` | Inventory App (Dev)       | Inventory App              | App display name |
| `VITE_DEBUG`    | true                      | false                      | Debug mode       |

## Security Best Practices

### ✅ DO:

- Use strong, unique secrets for each environment
- Use environment-specific database credentials
- Enable SSL/TLS in staging and production
- Validate environment variables on startup
- Use secrets management in production (AWS Secrets Manager, Azure Key Vault, etc.)

### ❌ DON'T:

- Commit `.env.production` or `.env.local` files
- Use development secrets in production
- Share environment files via email/chat
- Use weak or predictable JWT secrets
- Expose sensitive data in frontend environment variables

## Database Management Per Environment

### Development

```bash
cd backend
npm run db:migrate            # Run migrations
npm run db:seed               # Seed with sample data
```

### Staging

```bash
cd backend
npm run db:migrate:staging    # Deploy migrations to staging
npm run db:seed:staging       # Seed staging data
```

### Production

```bash
cd backend
npm run db:migrate:prod       # Deploy migrations to production
npm run db:seed:prod          # Seed production data (be careful!)
```

## Deployment Checklist

### Before Production Deployment:

- [ ] Update `.env.production` with real production values
- [ ] Generate strong JWT secret (minimum 64 characters)
- [ ] Configure production database with SSL
- [ ] Set up proper CORS origins
- [ ] Enable logging and monitoring
- [ ] Test all environment configurations
- [ ] Verify `.env.production` is in `.gitignore`
- [ ] Set up backup and recovery procedures

### Environment Validation

Both backend and frontend include environment validation:

- Backend: Validates required variables on startup
- Frontend: Validates configuration before app initialization
- Helpful error messages for missing or invalid configuration

## Troubleshooting

### Common Issues:

1. **Variables not loading**: Check file naming (`.env.development` not `.env.dev`)
2. **Frontend variables undefined**: Ensure variables start with `VITE_`
3. **Backend validation fails**: Check all required variables are set
4. **Wrong environment loaded**: Verify `NODE_ENV` or `--mode` flag

### Debug Commands:

```bash
# Check which environment file is loaded
npm run dev    # Backend shows loaded config file
npm run dev    # Frontend logs environment config in console

# Verify environment variables
node -e "console.log(process.env.NODE_ENV)"           # Backend
node -e "console.log(process.env.DATABASE_URL)"       # Backend
```

## Local Overrides (.env.local)

Create `.env.local` files for personal development overrides:

```bash
# backend/.env.local
DATABASE_URL="postgresql://myuser:mypass@localhost:5432/my_local_db"
JWT_SECRET=my_personal_dev_secret

# frontend/.env.local
VITE_API_URL=http://localhost:3002/api
VITE_DEBUG=true
```

These files are ignored by git and take highest priority.
