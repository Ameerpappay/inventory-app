import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken, AuthRequest } from "../shared/middleware/auth";

const router = Router();
const prisma = new PrismaClient();

// Types for request validation
interface CreateCustomerRequest {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  contactPerson?: string;
  companyType?: string;
  notes?: string;
  isActive?: boolean;
}

interface UpdateCustomerRequest extends Partial<CreateCustomerRequest> {}

// Validation function
const validateCustomerData = (data: any): data is CreateCustomerRequest => {
  return data && typeof data.name === "string" && data.name.trim().length > 0;
};

// Get all customers
router.get("/", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;

    const customers = await prisma.customer.findMany({
      where: { userId },
      orderBy: { name: "asc" },
    });

    res.json({
      success: true,
      data: customers,
      total: customers.length,
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch customers",
    });
  }
});

// Get active customers only
router.get("/active", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;

    const customers = await prisma.customer.findMany({
      where: {
        userId,
        isActive: true,
      },
      orderBy: { name: "asc" },
    });

    res.json({
      success: true,
      data: customers,
      total: customers.length,
    });
  } catch (error) {
    console.error("Error fetching active customers:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch active customers",
    });
  }
});

// Get single customer by ID
router.get("/:id", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const customer = await prisma.customer.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: "Customer not found",
      });
    }

    res.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    console.error("Error fetching customer:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch customer",
    });
  }
});

// Search customers
router.get(
  "/search/:term",
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.id;
      const { term } = req.params;

      const customers = await prisma.customer.findMany({
        where: {
          userId,
          AND: [
            {
              OR: [
                { name: { contains: term, mode: "insensitive" } },
                { email: { contains: term, mode: "insensitive" } },
                { contactPerson: { contains: term, mode: "insensitive" } },
                { phone: { contains: term } },
              ],
            },
          ],
        },
        orderBy: { name: "asc" },
        take: 10, // Limit results for search
      });

      res.json({
        success: true,
        data: customers,
        total: customers.length,
      });
    } catch (error) {
      console.error("Error searching customers:", error);
      res.status(500).json({
        success: false,
        error: "Failed to search customers",
      });
    }
  }
);

// Create new customer
router.post("/", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;

    if (!validateCustomerData(req.body)) {
      return res.status(400).json({
        success: false,
        error: "Invalid customer data. Name is required.",
      });
    }

    const validatedData = req.body as CreateCustomerRequest;

    // Check if customer name already exists for this user
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        name: validatedData.name,
        userId: userId!,
      },
    });

    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        error: "Customer with this name already exists",
      });
    }

    const customer = await prisma.customer.create({
      data: {
        ...validatedData,
        userId: userId!,
        isActive: validatedData.isActive ?? true,
      },
    });

    res.status(201).json({
      success: true,
      data: customer,
      message: "Customer created successfully",
    });
  } catch (error) {
    console.error("Error creating customer:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create customer",
    });
  }
});

// Update customer
router.put("/:id", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const updateData = req.body as UpdateCustomerRequest;

    // Check if customer exists and belongs to user
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingCustomer) {
      return res.status(404).json({
        success: false,
        error: "Customer not found",
      });
    }

    // If updating name, check for duplicates
    if (updateData.name && updateData.name !== existingCustomer.name) {
      const duplicateCustomer = await prisma.customer.findFirst({
        where: {
          name: updateData.name,
          userId: userId!,
          NOT: { id },
        },
      });

      if (duplicateCustomer) {
        return res.status(400).json({
          success: false,
          error: "Customer with this name already exists",
        });
      }
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: updateData,
    });

    res.json({
      success: true,
      data: customer,
      message: "Customer updated successfully",
    });
  } catch (error) {
    console.error("Error updating customer:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update customer",
    });
  }
});

// Update customer status
router.patch(
  "/:id/status",
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      const { isActive } = req.body;

      if (typeof isActive !== "boolean") {
        return res.status(400).json({
          success: false,
          error: "isActive must be a boolean value",
        });
      }

      // Check if customer exists and belongs to user
      const existingCustomer = await prisma.customer.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!existingCustomer) {
        return res.status(404).json({
          success: false,
          error: "Customer not found",
        });
      }

      const customer = await prisma.customer.update({
        where: { id },
        data: { isActive },
      });

      res.json({
        success: true,
        data: customer,
        message: `Customer ${
          isActive ? "activated" : "deactivated"
        } successfully`,
      });
    } catch (error) {
      console.error("Error updating customer status:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update customer status",
      });
    }
  }
);

// Delete customer
router.delete("/:id", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    // Check if customer exists and belongs to user
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingCustomer) {
      return res.status(404).json({
        success: false,
        error: "Customer not found",
      });
    }

    // Check if customer has any sales orders
    const salesOrderCount = await prisma.salesOrder.count({
      where: { customerId: id },
    });

    if (salesOrderCount > 0) {
      return res.status(400).json({
        success: false,
        error:
          "Cannot delete customer with existing sales orders. Deactivate instead.",
      });
    }

    await prisma.customer.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: "Customer deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting customer:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete customer",
    });
  }
});

export { router as customerRoutes };
