# Inventory App Backend

A Node.js backend API for the Inventory Management Application built with Express.js, Prisma ORM, and PostgreSQL.

## Features

- **User Authentication** (JWT-based)
- **Inventory Management** (CRUD operations)
- **Sales Orders Management**
- **Purchase Orders Management**
- **RESTful API** with proper validation
- **Database Migrations** with Prisma
- **Type-safe** with TypeScript
- **Feature-based Architecture** for better organization
- **Clean Architecture** with separation of concerns

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Prisma** - ORM and database toolkit
- **PostgreSQL** - Database
- **TypeScript** - Type safety
- **JWT** - Authentication
- **bcryptjs** - Password hashing

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn package manager

## Installation

1. **Clone and navigate to backend directory:**

   ```bash
   cd backend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Environment setup:**

   ```bash
   cp .env.example .env
   ```

   Then edit `.env` with your database URL and JWT secret.

4. **Database setup:**

   ```bash
   # Generate Prisma client
   npm run db:generate

   # Push schema to database (creates tables)
   npm run db:push

   # Optional: Run migrations (alternative to push)
   npm run db:migrate

   # Seed database with sample data
   npm run db:seed
   ```

5. **Start development server:**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:3001`

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Inventory

- `GET /api/inventory` - Get all inventory items
- `GET /api/inventory/:id` - Get single inventory item
- `POST /api/inventory` - Create new inventory item
- `PUT /api/inventory/:id` - Update inventory item
- `DELETE /api/inventory/:id` - Delete inventory item
- `GET /api/inventory/alerts/low-stock` - Get low stock items

### Sales Orders

- `GET /api/sales-orders` - Get all sales orders
- `GET /api/sales-orders/:id` - Get single sales order
- `POST /api/sales-orders` - Create new sales order
- `PUT /api/sales-orders/:id` - Update sales order
- `DELETE /api/sales-orders/:id` - Delete sales order
- `GET /api/sales-orders/status/:status` - Get orders by status

### Purchase Orders

- `GET /api/purchase-orders` - Get all purchase orders
- `GET /api/purchase-orders/:id` - Get single purchase order
- `POST /api/purchase-orders` - Create new purchase order
- `PUT /api/purchase-orders/:id` - Update purchase order
- `DELETE /api/purchase-orders/:id` - Delete purchase order
- `GET /api/purchase-orders/status/:status` - Get orders by status

## Database Schema

### Users

- `id` (String, Primary Key)
- `email` (String, Unique)
- `password` (String, Hashed)
- `name` (String, Optional)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### Inventory

- `id` (String, Primary Key)
- `productName` (String)
- `sku` (String, Unique)
- `category` (String)
- `quantity` (Integer)
- `unitPrice` (Decimal)
- `reorderLevel` (Integer)
- `supplier` (String)
- `userId` (String, Foreign Key)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### Sales Orders

- `id` (String, Primary Key)
- `orderNumber` (String, Unique)
- `customerName` (String)
- `customerEmail` (String)
- `totalAmount` (Decimal)
- `status` (Enum: PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED)
- `orderDate` (Date)
- `userId` (String, Foreign Key)
- `createdAt` (DateTime)

### Purchase Orders

- `id` (String, Primary Key)
- `poNumber` (String, Unique)
- `supplierName` (String)
- `supplierEmail` (String)
- `totalAmount` (Decimal)
- `status` (Enum: PENDING, APPROVED, RECEIVED, CANCELLED)
- `orderDate` (Date)
- `expectedDelivery` (Date)
- `userId` (String, Foreign Key)
- `createdAt` (DateTime)

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio (database GUI)
- `npm run db:seed` - Seed database with sample data

## Environment Variables

```env
NODE_ENV=development
PORT=3001
DATABASE_URL="postgresql://username:password@localhost:5432/inventory-app?schema=public"
JWT_SECRET=your_super_secure_jwt_secret_key_here_min_32_chars
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

## Authentication

All API endpoints except `/api/auth/register` and `/api/auth/login` require authentication.

Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Error Handling

The API returns consistent error responses:

```json
{
  "error": "Error message",
  "message": "Detailed error description"
}
```

## Project Structure

```
src/
├── features/                # Feature-based modules
│   ├── auth/               # Authentication feature
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.routes.ts
│   │   └── index.ts
│   ├── inventory/          # Inventory management feature
│   │   ├── inventory.controller.ts
│   │   ├── inventory.service.ts
│   │   ├── inventory.routes.ts
│   │   └── index.ts
│   ├── sales-orders/       # Sales orders feature
│   │   ├── sales-orders.controller.ts
│   │   ├── sales-orders.service.ts
│   │   ├── sales-orders.routes.ts
│   │   └── index.ts
│   ├── purchase-orders/    # Purchase orders feature
│   │   ├── purchase-orders.controller.ts
│   │   ├── purchase-orders.service.ts
│   │   ├── purchase-orders.routes.ts
│   │   └── index.ts
│   └── index.ts           # Features barrel export
├── shared/                 # Shared utilities and types
│   ├── middleware/        # Middleware functions
│   │   └── auth.ts
│   ├── types/            # TypeScript type definitions
│   │   └── index.ts
│   ├── utils/            # Helper utilities
│   │   └── helpers.ts
│   └── index.ts          # Shared barrel export
├── index.ts              # Main application entry point
prisma/
├── schema.prisma         # Database schema
└── seed.ts              # Database seeding script
```

## Development

1. **Database changes:** Modify `prisma/schema.prisma`, then run:

   ```bash
   npm run db:push
   ```

2. **Add new features:** Create a new folder in `src/features/` with:

   - `feature.controller.ts` - Request handlers
   - `feature.service.ts` - Business logic
   - `feature.routes.ts` - Route definitions
   - `index.ts` - Feature exports

3. **Database GUI:** Use Prisma Studio:
   ```bash
   npm run db:studio
   ```

## Production Deployment

1. Build the application:

   ```bash
   npm run build
   ```

2. Set production environment variables

3. Run database migrations:

   ```bash
   npm run db:migrate
   ```

4. Start the server:
   ```bash
   npm start
   ```

## License

MIT
