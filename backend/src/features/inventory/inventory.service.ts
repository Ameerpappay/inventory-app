import { prisma } from "../../index";
import { InventoryItem } from "../../shared/types";

export class InventoryService {
  static async getAllItems(userId: string) {
    const items = await prisma.inventory.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    // Convert Decimal values to numbers
    return items.map((item: any) => ({
      ...item,
      unitPrice: Number(item.unitPrice),
    }));
  }

  static async getItemById(id: string, userId: string) {
    const item = await prisma.inventory.findFirst({
      where: { id, userId },
    });

    if (!item) return null;

    // Convert Decimal values to numbers
    return {
      ...item,
      unitPrice: Number(item.unitPrice),
    };
  }

  static async createItem(
    data: Omit<InventoryItem, "id" | "createdAt" | "updatedAt">
  ) {
    // Check if SKU already exists
    const existingSku = await prisma.inventory.findUnique({
      where: { sku: data.sku },
    });

    if (existingSku) {
      throw new Error("SKU already exists");
    }

    return await prisma.inventory.create({
      data,
    });
  }

  static async updateItem(
    id: string,
    userId: string,
    data: Partial<
      Omit<InventoryItem, "id" | "userId" | "createdAt" | "updatedAt">
    >
  ) {
    // Check if item exists and belongs to user
    const existingItem = await prisma.inventory.findFirst({
      where: { id, userId },
    });

    if (!existingItem) {
      throw new Error("Inventory item not found");
    }

    // Check if new SKU conflicts (if SKU is being updated)
    if (data.sku && data.sku !== existingItem.sku) {
      const skuConflict = await prisma.inventory.findUnique({
        where: { sku: data.sku },
      });

      if (skuConflict) {
        throw new Error("SKU already exists");
      }
    }

    return await prisma.inventory.update({
      where: { id },
      data,
    });
  }

  static async deleteItem(id: string, userId: string) {
    // Check if item exists and belongs to user
    const existingItem = await prisma.inventory.findFirst({
      where: { id, userId },
    });

    if (!existingItem) {
      throw new Error("Inventory item not found");
    }

    return await prisma.inventory.delete({
      where: { id },
    });
  }

  static async getLowStockItems(userId: string) {
    const items = await prisma.inventory.findMany({
      where: {
        userId,
        quantity: {
          lte: prisma.inventory.fields.reorderLevel,
        },
      },
      orderBy: { quantity: "asc" },
    });

    // Convert Decimal values to numbers
    return items.map((item: any) => ({
      ...item,
      unitPrice: Number(item.unitPrice),
    }));
  }

  static async getItemsByCategory(userId: string, category: string) {
    const items = await prisma.inventory.findMany({
      where: { userId, category },
      orderBy: { createdAt: "desc" },
    });

    // Convert Decimal values to numbers
    return items.map((item: any) => ({
      ...item,
      unitPrice: Number(item.unitPrice),
    }));
  }
}
