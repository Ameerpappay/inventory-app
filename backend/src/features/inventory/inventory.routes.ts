import express from "express";
import { body } from "express-validator";
import { authenticateToken } from "../../shared/middleware/auth";
import { InventoryController } from "./inventory.controller";

const router = express.Router();

// Get all inventory items for authenticated user
router.get("/", authenticateToken, InventoryController.getAllItems);

// Get single inventory item
router.get("/:id", authenticateToken, InventoryController.getItemById);

// Create new inventory item
router.post(
  "/",
  [
    authenticateToken,
    body("productName").trim().isLength({ min: 1 }),
    body("sku").trim().isLength({ min: 1 }),
    body("category").optional().trim(),
    body("quantity").isInt({ min: 0 }),
    body("unitPrice").isDecimal({ decimal_digits: "0,2" }),
    body("reorderLevel").isInt({ min: 0 }),
    body("supplier").optional().trim(),
  ],
  InventoryController.createItem
);

// Update inventory item
router.put(
  "/:id",
  [
    authenticateToken,
    body("productName").optional().trim().isLength({ min: 1 }),
    body("sku").optional().trim().isLength({ min: 1 }),
    body("category").optional().trim(),
    body("quantity").optional().isInt({ min: 0 }),
    body("unitPrice").optional().isDecimal({ decimal_digits: "0,2" }),
    body("reorderLevel").optional().isInt({ min: 0 }),
    body("supplier").optional().trim(),
  ],
  InventoryController.updateItem
);

// Delete inventory item
router.delete("/:id", authenticateToken, InventoryController.deleteItem);

// Get low stock items
router.get(
  "/alerts/low-stock",
  authenticateToken,
  InventoryController.getLowStockItems
);

// Get items by category
router.get(
  "/category/:category",
  authenticateToken,
  InventoryController.getItemsByCategory
);

export default router;
