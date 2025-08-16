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
router.get("/active", authenticateToken, async (req: AuthRequest, res) => {
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

// Create new supplier
router.post("/", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;

    if (!validateSupplierData(req.body)) {
      return res.status(400).json({
        success: false,
        error: "Invalid supplier data. Name is required.",
      });
    }

    const validatedData = req.body as CreateSupplierRequest;

    // Check if supplier name already exists for this user
    const existingSupplier = await prisma.supplier.findFirst({
      where: {
        name: validatedData.name,
        userId: userId!,
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
        userId: userId!,
        isActive: validatedData.isActive ?? true,
      },
    });

    res.status(201).json({
      success: true,
      data: supplier,
      message: "Supplier created successfully",
    });
  } catch (error) {
    console.error("Error creating supplier:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create supplier",
    });
  }
});

export default router;
