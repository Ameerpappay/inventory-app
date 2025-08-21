import { Request, Response } from "express";
import { validationResult } from "express-validator";
import { PurchaseOrderService } from "./purchase-orders.service";
import {
  formatApiResponse,
  formatErrorResponse,
} from "../../shared/utils/helpers";
import { AuthRequest } from "../../shared/middleware/auth";
import { PurchaseOrderStatus } from "./purchase-order-status";

export class PurchaseOrderController {
  static async getAllOrders(req: AuthRequest, res: Response) {
    try {
      const orders = await PurchaseOrderService.getAllOrders(req.user!.id);
      res.json(formatApiResponse(true, orders, undefined, orders.length));
    } catch (error) {
      console.error("Get purchase orders error:", error);
      res
        .status(500)
        .json(formatErrorResponse("Failed to fetch purchase orders"));
    }
  }

  static async getOrderById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const order = await PurchaseOrderService.getOrderById(id, req.user!.id);

      if (!order) {
        return res
          .status(404)
          .json(formatErrorResponse("Purchase order not found"));
      }

      res.json(formatApiResponse(true, order));
    } catch (error) {
      console.error("Get purchase order error:", error);
      res
        .status(500)
        .json(formatErrorResponse("Failed to fetch purchase order"));
    }
  }

  static async createOrder(req: AuthRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        poNumber,
        supplierName,
        supplierEmail,
        totalAmount,
        orderDate,
        expectedDelivery,
        supplierId,
        notes,
        items,
      } = req.body;

      console.log("📦 Received purchase order data:", {
        poNumber,
        supplierName,
        supplierEmail,
        totalAmount,
        orderDate,
        expectedDelivery,
        supplierId,
        notes,
        itemsCount: items ? items.length : 0,
      });

      const order = await PurchaseOrderService.createOrder({
        poNumber,
        supplierName,
        supplierEmail,
        totalAmount: parseFloat(totalAmount),
        status: PurchaseOrderStatus.PENDING,
        orderDate: orderDate ? new Date(orderDate) : new Date(),
        expectedDelivery: new Date(expectedDelivery),
        userId: req.user!.id,
        supplierId,
        notes,
        items,
      });

      res
        .status(201)
        .json(
          formatApiResponse(true, order, "Purchase order created successfully")
        );
    } catch (error) {
      console.error("Create purchase order error:", error);
      if (
        error instanceof Error &&
        error.message === "PO number already exists"
      ) {
        return res.status(400).json(formatErrorResponse(error.message));
      }
      res
        .status(500)
        .json(formatErrorResponse("Failed to create purchase order"));
    }
  }

  static async updateOrder(req: AuthRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const updateData = {
        ...req.body,
        totalAmount: req.body.totalAmount
          ? parseFloat(req.body.totalAmount)
          : undefined,
        orderDate: req.body.orderDate
          ? new Date(req.body.orderDate)
          : undefined,
        expectedDelivery: req.body.expectedDelivery
          ? new Date(req.body.expectedDelivery)
          : undefined,
      };

      const updatedOrder = await PurchaseOrderService.updateOrder(
        id,
        req.user!.id,
        updateData
      );

      res.json(
        formatApiResponse(
          true,
          updatedOrder,
          "Purchase order updated successfully"
        )
      );
    } catch (error) {
      console.error("Update purchase order error:", error);
      if (error instanceof Error) {
        if (error.message === "Purchase order not found") {
          return res.status(404).json(formatErrorResponse(error.message));
        }
        if (error.message === "PO number already exists") {
          return res.status(400).json(formatErrorResponse(error.message));
        }
      }
      res
        .status(500)
        .json(formatErrorResponse("Failed to update purchase order"));
    }
  }

  static async deleteOrder(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      await PurchaseOrderService.deleteOrder(id, req.user!.id);

      res.json(
        formatApiResponse(
          true,
          undefined,
          "Purchase order deleted successfully"
        )
      );
    } catch (error) {
      console.error("Delete purchase order error:", error);
      if (
        error instanceof Error &&
        error.message === "Purchase order not found"
      ) {
        return res.status(404).json(formatErrorResponse(error.message));
      }
      res
        .status(500)
        .json(formatErrorResponse("Failed to delete purchase order"));
    }
  }

  static async getOrdersByStatus(req: AuthRequest, res: Response) {
    try {
      const { status } = req.params;
      const validStatuses = ["PENDING", "APPROVED", "RECEIVED", "CANCELLED"];

      if (!validStatuses.includes(status.toUpperCase())) {
        return res.status(400).json(formatErrorResponse("Invalid status"));
      }

      const orders = await PurchaseOrderService.getOrdersByStatus(
        req.user!.id,
        status.toUpperCase() as any
      );

      res.json(formatApiResponse(true, orders, undefined, orders.length));
    } catch (error) {
      console.error("Get purchase orders by status error:", error);
      res
        .status(500)
        .json(formatErrorResponse("Failed to fetch purchase orders"));
    }
  }

  static async getOverdueDeliveries(req: AuthRequest, res: Response) {
    try {
      const orders = await PurchaseOrderService.getOverdueDeliveries(
        req.user!.id
      );
      res.json(formatApiResponse(true, orders, undefined, orders.length));
    } catch (error) {
      console.error("Get overdue deliveries error:", error);
      res
        .status(500)
        .json(formatErrorResponse("Failed to fetch overdue deliveries"));
    }
  }
}
