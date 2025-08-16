import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();

// Types for request validation
interface CreateSupplierRequest {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  contactPerson?: string;
  website?: string;
  notes?: string;
  isActive?: boolean;
}

// Validation function
const validateSupplierData = (data: any): data is CreateSupplierRequest => {
  return data && typeof data.name === "string" && data.name.trim().length > 0;
};

// Get all suppliers
router.get("/", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;

    const suppliers = await prisma.supplier.findMany({
      where: { userId },
      orderBy: { name: "asc" },
    });

    res.json({
      success: true,
      data: suppliers,
      total: suppliers.length,
    });
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch suppliers",
    });
  }
});

// Get active suppliers only
router.get("/active", auth, async (req, res) => {
  try {
    const userId = req.user?.id;

    const suppliers = await prisma.supplier.findMany({
      where: {
        userId,
        isActive: true,
      },
      orderBy: { name: "asc" },
    });

    res.json({
      success: true,
      data: suppliers,
      total: suppliers.length,
    });
  } catch (error) {
    console.error("Error fetching active suppliers:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch active suppliers",
    });
  }
});

// Get supplier by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const supplier = await prisma.supplier.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        inventory: {
          select: {
            id: true,
            productName: true,
            sku: true,
            quantity: true,
          },
        },
        purchaseOrders: {
          select: {
            id: true,
            poNumber: true,
            totalAmount: true,
            status: true,
            orderDate: true,
          },
          orderBy: { orderDate: "desc" },
          take: 5,
        },
      },
    });

    if (!supplier) {
      return res.status(404).json({
        success: false,
        error: "Supplier not found",
      });
    }

    res.json({
      success: true,
      data: supplier,
    });
  } catch (error) {
    console.error("Error fetching supplier:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch supplier",
    });
  }
});

// Create new supplier
router.post("/", auth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const validatedData = createSupplierSchema.parse(req.body);

    // Check if supplier name already exists for this user
    const existingSupplier = await prisma.supplier.findFirst({
      where: {
        name: validatedData.name,
        userId,
      },
    });

    if (existingSupplier) {
      return res.status(400).json({
        success: false,
        error: "Supplier with this name already exists",
      });
    }

    const supplier = await prisma.supplier.create({
      data: {
        ...validatedData,
        userId,
      },
    });

    res.status(201).json({
      success: true,
      data: supplier,
      message: "Supplier created successfully",
    });
  } catch (error) {
    console.error("Error creating supplier:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to create supplier",
    });
  }
});

// Update supplier
router.put("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const validatedData = updateSupplierSchema.parse(req.body);

    // Check if supplier exists and belongs to user
    const existingSupplier = await prisma.supplier.findFirst({
      where: { id, userId },
    });

    if (!existingSupplier) {
      return res.status(404).json({
        success: false,
        error: "Supplier not found",
      });
    }

    // Check if updating name and name conflicts with another supplier
    if (validatedData.name && validatedData.name !== existingSupplier.name) {
      const nameConflict = await prisma.supplier.findFirst({
        where: {
          name: validatedData.name,
          userId,
          NOT: { id },
        },
      });

      if (nameConflict) {
        return res.status(400).json({
          success: false,
          error: "Supplier with this name already exists",
        });
      }
    }

    const supplier = await prisma.supplier.update({
      where: { id },
      data: validatedData,
    });

    res.json({
      success: true,
      data: supplier,
      message: "Supplier updated successfully",
    });
  } catch (error) {
    console.error("Error updating supplier:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to update supplier",
    });
  }
});

// Delete supplier
router.delete("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // Check if supplier exists and belongs to user
    const existingSupplier = await prisma.supplier.findFirst({
      where: { id, userId },
    });

    if (!existingSupplier) {
      return res.status(404).json({
        success: false,
        error: "Supplier not found",
      });
    }

    // Check if supplier is being used by inventory items or purchase orders
    const inventoryCount = await prisma.inventory.count({
      where: { supplierId: id },
    });

    const purchaseOrderCount = await prisma.purchaseOrder.count({
      where: { supplierId: id },
    });

    if (inventoryCount > 0 || purchaseOrderCount > 0) {
      // Instead of deleting, mark as inactive
      await prisma.supplier.update({
        where: { id },
        data: { isActive: false },
      });

      return res.json({
        success: true,
        message: "Supplier marked as inactive due to existing references",
      });
    }

    // Safe to delete
    await prisma.supplier.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: "Supplier deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting supplier:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete supplier",
    });
  }
});

// Toggle supplier status (active/inactive)
router.patch("/:id/toggle-status", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const supplier = await prisma.supplier.findFirst({
      where: { id, userId },
    });

    if (!supplier) {
      return res.status(404).json({
        success: false,
        error: "Supplier not found",
      });
    }

    const updatedSupplier = await prisma.supplier.update({
      where: { id },
      data: { isActive: !supplier.isActive },
    });

    res.json({
      success: true,
      data: updatedSupplier,
      message: `Supplier ${
        updatedSupplier.isActive ? "activated" : "deactivated"
      } successfully`,
    });
  } catch (error) {
    console.error("Error toggling supplier status:", error);
    res.status(500).json({
      success: false,
      error: "Failed to toggle supplier status",
    });
  }
});

export default router;
