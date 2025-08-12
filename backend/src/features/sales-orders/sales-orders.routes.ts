import express from "express";
import { body } from "express-validator";
import { authenticateToken } from "../../shared/middleware/auth";
import { SalesOrderController } from "./sales-orders.controller";

const router = express.Router();

// Get all sales orders for authenticated user
router.get("/", authenticateToken, SalesOrderController.getAllOrders);

// Get single sales order
router.get("/:id", authenticateToken, SalesOrderController.getOrderById);

// Create new sales order
router.post(
  "/",
  [
    authenticateToken,
    body("orderNumber").trim().isLength({ min: 1 }),
    body("customerName").trim().isLength({ min: 1 }),
    body("customerEmail").isEmail().normalizeEmail(),
    body("totalAmount").isDecimal({ decimal_digits: "0,2" }),
    body("status")
      .optional()
      .isIn(["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]),
    body("orderDate").optional().isISO8601(),
  ],
  SalesOrderController.createOrder
);

// Update sales order
router.put(
  "/:id",
  [
    authenticateToken,
    body("orderNumber").optional().trim().isLength({ min: 1 }),
    body("customerName").optional().trim().isLength({ min: 1 }),
    body("customerEmail").optional().isEmail().normalizeEmail(),
    body("totalAmount").optional().isDecimal({ decimal_digits: "0,2" }),
    body("status")
      .optional()
      .isIn(["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]),
    body("orderDate").optional().isISO8601(),
  ],
  SalesOrderController.updateOrder
);

// Delete sales order
router.delete("/:id", authenticateToken, SalesOrderController.deleteOrder);

// Get sales orders by status
router.get(
  "/status/:status",
  authenticateToken,
  SalesOrderController.getOrdersByStatus
);

export default router;
