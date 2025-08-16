import { Request, Response } from "express";
import { validationResult } from "express-validator";
import { SalesOrderService } from "./sales-orders.service";
import {
  formatApiResponse,
  formatErrorResponse,
} from "../../shared/utils/helpers";
import { AuthRequest } from "../../shared/middleware/auth";

export class SalesOrderController {
  static async getAllOrders(req: AuthRequest, res: Response) {
    try {
      const orders = await SalesOrderService.getAllOrders(req.user!.id);
      res.json(formatApiResponse(true, orders, undefined, orders.length));
    } catch (error) {
      console.error("Get sales orders error:", error);
      res.status(500).json(formatErrorResponse("Failed to fetch sales orders"));
    }
  }

  static async getOrderById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const order = await SalesOrderService.getOrderById(id, req.user!.id);

      if (!order) {
        return res
          .status(404)
          .json(formatErrorResponse("Sales order not found"));
      }

      console.log("Fetched sales order for edit:", {
        id: order.id,
        orderNumber: order.orderNumber,
        itemsCount: order.items?.length || 0,
        items: order.items?.map((item: any) => ({
          id: item.id,
          quantity: item.quantity,
          productName: item.inventory?.productName,
        })),
      });

      res.json(formatApiResponse(true, order));
    } catch (error) {
      console.error("Get sales order error:", error);
      res.status(500).json(formatErrorResponse("Failed to fetch sales order"));
    }
  }

  static async createOrder(req: AuthRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        orderNumber,
        customerName,
        customerEmail,
        totalAmount,
        status = "PENDING",
        orderDate,
        items,
        notes,
      } = req.body;

      console.log("Creating sales order with data:", {
        orderNumber,
        customerName,
        customerEmail,
        totalAmount,
        status,
        orderDate,
        items: items?.length || 0,
        notes,
        userId: req.user!.id,
      });

      const order = await SalesOrderService.createOrder({
        orderNumber,
        customerName,
        customerEmail,
        totalAmount: parseFloat(totalAmount),
        status,
        orderDate: orderDate ? new Date(orderDate) : new Date(),
        userId: req.user!.id,
        notes,
        items: items || [],
      });

      res
        .status(201)
        .json(
          formatApiResponse(true, order, "Sales order created successfully")
        );
    } catch (error) {
      console.error("Create sales order error:", error);
      if (
        error instanceof Error &&
        error.message === "Order number already exists"
      ) {
        return res.status(400).json(formatErrorResponse(error.message));
      }
      res.status(500).json(formatErrorResponse("Failed to create sales order"));
    }
  }

  static async updateOrder(req: AuthRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const {
        orderNumber,
        customerName,
        customerEmail,
        totalAmount,
        status,
        orderDate,
        items,
        notes,
      } = req.body;

      console.log("Updating sales order with data:", {
        id,
        orderNumber,
        customerName,
        customerEmail,
        totalAmount,
        status,
        orderDate,
        items: items?.length || 0,
        notes,
        userId: req.user!.id,
      });

      const updateData = {
        orderNumber,
        customerName,
        customerEmail,
        totalAmount: totalAmount ? parseFloat(totalAmount) : undefined,
        status,
        orderDate: orderDate ? new Date(orderDate) : undefined,
        notes,
        items: items || [],
      };

      const updatedOrder = await SalesOrderService.updateOrder(
        id,
        req.user!.id,
        updateData
      );

      res.json(
        formatApiResponse(
          true,
          updatedOrder,
          "Sales order updated successfully"
        )
      );
    } catch (error) {
      console.error("Update sales order error:", error);
      if (error instanceof Error) {
        if (error.message === "Sales order not found") {
          return res.status(404).json(formatErrorResponse(error.message));
        }
        if (error.message === "Order number already exists") {
          return res.status(400).json(formatErrorResponse(error.message));
        }
      }
      res.status(500).json(formatErrorResponse("Failed to update sales order"));
    }
  }

  static async deleteOrder(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      await SalesOrderService.deleteOrder(id, req.user!.id);

      res.json(
        formatApiResponse(true, undefined, "Sales order deleted successfully")
      );
    } catch (error) {
      console.error("Delete sales order error:", error);
      if (error instanceof Error && error.message === "Sales order not found") {
        return res.status(404).json(formatErrorResponse(error.message));
      }
      res.status(500).json(formatErrorResponse("Failed to delete sales order"));
    }
  }

  static async getOrdersByStatus(req: AuthRequest, res: Response) {
    try {
      const { status } = req.params;
      const validStatuses = [
        "PENDING",
        "PROCESSING",
        "SHIPPED",
        "DELIVERED",
        "CANCELLED",
      ];

      if (!validStatuses.includes(status.toUpperCase())) {
        return res.status(400).json(formatErrorResponse("Invalid status"));
      }

      const orders = await SalesOrderService.getOrdersByStatus(
        req.user!.id,
        status.toUpperCase() as any
      );

      res.json(formatApiResponse(true, orders, undefined, orders.length));
    } catch (error) {
      console.error("Get sales orders by status error:", error);
      res.status(500).json(formatErrorResponse("Failed to fetch sales orders"));
    }
  }
}
