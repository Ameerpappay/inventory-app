import { Request, Response } from "express";
import { validationResult } from "express-validator";
import { InventoryService } from "./inventory.service";
import {
  formatApiResponse,
  formatErrorResponse,
} from "../../shared/utils/helpers";
import { AuthRequest } from "../../shared/middleware/auth";

export class InventoryController {
  static async getAllItems(req: AuthRequest, res: Response) {
    try {
      const items = await InventoryService.getAllItems(req.user!.id);
      res.json(formatApiResponse(true, items, undefined, items.length));
    } catch (error) {
      console.error("Get inventory error:", error);
      res
        .status(500)
        .json(formatErrorResponse("Failed to fetch inventory items"));
    }
  }

  static async getItemById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const item = await InventoryService.getItemById(id, req.user!.id);

      if (!item) {
        return res
          .status(404)
          .json(formatErrorResponse("Inventory item not found"));
      }

      res.json(formatApiResponse(true, item));
    } catch (error) {
      console.error("Get inventory item error:", error);
      res
        .status(500)
        .json(formatErrorResponse("Failed to fetch inventory item"));
    }
  }

  static async createItem(req: AuthRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        productName,
        sku,
        category = "Other",
        quantity,
        unitPrice,
        reorderLevel,
        supplier = "",
      } = req.body;

      const item = await InventoryService.createItem({
        productName,
        sku,
        category,
        quantity: parseInt(quantity),
        unitPrice: parseFloat(unitPrice),
        reorderLevel: parseInt(reorderLevel),
        supplier,
        userId: req.user!.id,
      });

      res
        .status(201)
        .json(
          formatApiResponse(true, item, "Inventory item created successfully")
        );
    } catch (error) {
      console.error("Create inventory error:", error);
      if (error instanceof Error && error.message === "SKU already exists") {
        return res.status(400).json(formatErrorResponse(error.message));
      }
      res
        .status(500)
        .json(formatErrorResponse("Failed to create inventory item"));
    }
  }

  static async updateItem(req: AuthRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const updateData = {
        ...req.body,
        quantity: req.body.quantity ? parseInt(req.body.quantity) : undefined,
        unitPrice: req.body.unitPrice
          ? parseFloat(req.body.unitPrice)
          : undefined,
        reorderLevel: req.body.reorderLevel
          ? parseInt(req.body.reorderLevel)
          : undefined,
      };

      const updatedItem = await InventoryService.updateItem(
        id,
        req.user!.id,
        updateData
      );

      res.json(
        formatApiResponse(
          true,
          updatedItem,
          "Inventory item updated successfully"
        )
      );
    } catch (error) {
      console.error("Update inventory error:", error);
      if (error instanceof Error) {
        if (error.message === "Inventory item not found") {
          return res.status(404).json(formatErrorResponse(error.message));
        }
        if (error.message === "SKU already exists") {
          return res.status(400).json(formatErrorResponse(error.message));
        }
      }
      res
        .status(500)
        .json(formatErrorResponse("Failed to update inventory item"));
    }
  }

  static async deleteItem(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      await InventoryService.deleteItem(id, req.user!.id);

      res.json(
        formatApiResponse(
          true,
          undefined,
          "Inventory item deleted successfully"
        )
      );
    } catch (error) {
      console.error("Delete inventory error:", error);
      if (
        error instanceof Error &&
        error.message === "Inventory item not found"
      ) {
        return res.status(404).json(formatErrorResponse(error.message));
      }
      res
        .status(500)
        .json(formatErrorResponse("Failed to delete inventory item"));
    }
  }

  static async getLowStockItems(req: AuthRequest, res: Response) {
    try {
      const lowStockItems = await InventoryService.getLowStockItems(
        req.user!.id
      );
      res.json(
        formatApiResponse(true, lowStockItems, undefined, lowStockItems.length)
      );
    } catch (error) {
      console.error("Get low stock error:", error);
      res
        .status(500)
        .json(formatErrorResponse("Failed to fetch low stock items"));
    }
  }

  static async getItemsByCategory(req: AuthRequest, res: Response) {
    try {
      const { category } = req.params;
      const items = await InventoryService.getItemsByCategory(
        req.user!.id,
        category
      );
      res.json(formatApiResponse(true, items, undefined, items.length));
    } catch (error) {
      console.error("Get items by category error:", error);
      res
        .status(500)
        .json(formatErrorResponse("Failed to fetch items by category"));
    }
  }
}
