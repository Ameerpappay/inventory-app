import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function createTestSuppliers() {
  console.log("🌱 Creating test suppliers...");

  // Get the first user to associate suppliers with
  const users = await prisma.user.findMany();
  if (users.length === 0) {
    console.log("❌ No users found. Please run the main seed script first.");
    return;
  }

  const user = users[0];

  const suppliers = [
    {
      name: "ABC Electronics Co",
      email: "orders@abcelectronics.com",
      phone: "+1-555-0100",
      address: "123 Electronics Blvd",
      city: "Silicon Valley",
      state: "CA",
      zipCode: "94025",
      contactPerson: "John Smith",
      website: "https://abcelectronics.com",
      notes: "Primary supplier for electronic components",
      isActive: true,
      userId: user.id,
    },
    {
      name: "Global Hardware Supply",
      email: "purchasing@globalhardware.com",
      phone: "+1-555-0200",
      address: "456 Industrial Ave",
      city: "Industrial City",
      state: "TX",
      zipCode: "75001",
      contactPerson: "Sarah Johnson",
      website: "https://globalhardware.com",
      notes: "Reliable hardware and tool supplier",
      isActive: true,
      userId: user.id,
    },
    {
      name: "TechParts Direct",
      email: "sales@techpartsdirect.com",
      phone: "+1-555-0300",
      address: "789 Tech Park Dr",
      city: "Austin",
      state: "TX",
      zipCode: "78701",
      contactPerson: "Mike Chen",
      website: "https://techpartsdirect.com",
      notes: "Specialized in computer components",
      isActive: true,
      userId: user.id,
    },
  ];

  for (const supplier of suppliers) {
    // Check if supplier already exists
    const existingSupplier = await prisma.supplier.findFirst({
      where: {
        name: supplier.name,
        userId: user.id,
      },
    });

    if (!existingSupplier) {
      const created = await prisma.supplier.create({
        data: supplier,
      });
      console.log(`✅ Created supplier: ${created.name}`);
    } else {
      console.log(`⚠️ Supplier already exists: ${supplier.name}`);
    }
  }

  console.log("🎉 Test suppliers created successfully!");
}

createTestSuppliers()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
