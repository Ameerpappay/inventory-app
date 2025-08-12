import express from "express";
import { body } from "express-validator";
import { authenticateToken } from "../../shared/middleware/auth";
import { PurchaseOrderController } from "./purchase-orders.controller";

const router = express.Router();

// Get all purchase orders for authenticated user
router.get("/", authenticateToken, PurchaseOrderController.getAllOrders);

// Get single purchase order
router.get("/:id", authenticateToken, PurchaseOrderController.getOrderById);

// Create new purchase order
router.post(
  "/",
  [
    authenticateToken,
    body("poNumber").trim().isLength({ min: 1 }),
    body("supplierName").trim().isLength({ min: 1 }),
    body("supplierEmail").isEmail().normalizeEmail(),
    body("totalAmount").isDecimal({ decimal_digits: "0,2" }),
    body("status")
      .optional()
      .isIn(["PENDING", "APPROVED", "RECEIVED", "CANCELLED"]),
    body("orderDate").optional().isISO8601(),
    body("expectedDelivery").isISO8601(),
  ],
  PurchaseOrderController.createOrder
);

// Update purchase order
router.put(
  "/:id",
  [
    authenticateToken,
    body("poNumber").optional().trim().isLength({ min: 1 }),
    body("supplierName").optional().trim().isLength({ min: 1 }),
    body("supplierEmail").optional().isEmail().normalizeEmail(),
    body("totalAmount").optional().isDecimal({ decimal_digits: "0,2" }),
    body("status")
      .optional()
      .isIn(["PENDING", "APPROVED", "RECEIVED", "CANCELLED"]),
    body("orderDate").optional().isISO8601(),
    body("expectedDelivery").optional().isISO8601(),
  ],
  PurchaseOrderController.updateOrder
);

// Delete purchase order
router.delete("/:id", authenticateToken, PurchaseOrderController.deleteOrder);

// Get purchase orders by status
router.get(
  "/status/:status",
  authenticateToken,
  PurchaseOrderController.getOrdersByStatus
);

// Get overdue deliveries
router.get(
  "/alerts/overdue",
  authenticateToken,
  PurchaseOrderController.getOverdueDeliveries
);

export default router;
