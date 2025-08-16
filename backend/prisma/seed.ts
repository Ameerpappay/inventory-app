import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // Create sample users
  const hashedPassword = await bcrypt.hash("password123", 10);

  const user1 = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      password: hashedPassword,
      name: "Admin User",
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: "manager@example.com" },
    update: {},
    create: {
      email: "manager@example.com",
      password: hashedPassword,
      name: "Manager User",
    },
  });

  console.log("✅ Users created");

  // Create sample inventory items
  const inventoryItems = [
    {
      productName: "Widget A",
      sku: "WID-001",
      category: "Electronics",
      quantity: 100,
      unitPrice: 29.99,
      reorderLevel: 20,
      userId: user1.id,
    },
    {
      productName: "Gadget B",
      sku: "GAD-002",
      category: "Electronics",
      quantity: 50,
      unitPrice: 49.99,
      reorderLevel: 15,
      userId: user1.id,
    },
    {
      productName: "Tool C",
      sku: "TOO-003",
      category: "Hardware",
      quantity: 75,
      unitPrice: 19.99,
      reorderLevel: 25,
      userId: user1.id,
    },
    {
      productName: "Component D",
      sku: "COM-004",
      category: "Electronics",
      quantity: 200,
      unitPrice: 5.99,
      reorderLevel: 50,
      userId: user2.id,
    },
    {
      productName: "Material E",
      sku: "MAT-005",
      category: "Raw Materials",
      quantity: 300,
      unitPrice: 12.5,
      reorderLevel: 100,
      userId: user2.id,
    },
  ];

  for (const item of inventoryItems) {
    await prisma.inventory.upsert({
      where: { sku: item.sku },
      update: {},
      create: item,
    });
  }

  console.log("✅ Inventory items created");

  // Create sample sales orders
  const salesOrders = [
    {
      orderNumber: "SO-2025-001",
      customerName: "John Doe",
      customerEmail: "john@example.com",
      totalAmount: 159.97,
      status: "PENDING" as const,
      userId: user1.id,
    },
    {
      orderNumber: "SO-2025-002",
      customerName: "Jane Smith",
      customerEmail: "jane@example.com",
      totalAmount: 89.98,
      status: "PROCESSING" as const,
      userId: user1.id,
    },
    {
      orderNumber: "SO-2025-003",
      customerName: "Bob Johnson",
      customerEmail: "bob@example.com",
      totalAmount: 299.99,
      status: "SHIPPED" as const,
      userId: user2.id,
    },
  ];

  for (const order of salesOrders) {
    await prisma.salesOrder.upsert({
      where: { orderNumber: order.orderNumber },
      update: {},
      create: order,
    });
  }

  console.log("✅ Sales orders created");

  // Create sample purchase orders
  const purchaseOrders = [
    {
      poNumber: "PO-2025-001",
      supplierName: "Supplier ABC",
      supplierEmail: "orders@supplierabc.com",
      totalAmount: 2999.5,
      status: "PENDING" as const,
      expectedDelivery: new Date("2025-08-25"),
      userId: user1.id,
    },
    {
      poNumber: "PO-2025-002",
      supplierName: "Supplier XYZ",
      supplierEmail: "orders@supplierxyz.com",
      totalAmount: 1499.75,
      status: "APPROVED" as const,
      expectedDelivery: new Date("2025-08-20"),
      userId: user1.id,
    },
    {
      poNumber: "PO-2025-003",
      supplierName: "Component Corp",
      supplierEmail: "sales@componentcorp.com",
      totalAmount: 899.25,
      status: "RECEIVED" as const,
      expectedDelivery: new Date("2025-08-15"),
      userId: user2.id,
    },
  ];

  for (const order of purchaseOrders) {
    await prisma.purchaseOrder.upsert({
      where: { poNumber: order.poNumber },
      update: {},
      create: order,
    });
  }

  console.log("✅ Purchase orders created");

  console.log("🎉 Database seeding completed successfully!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Error during seeding:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
