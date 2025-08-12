import { prisma } from "../../index";
import { SalesOrder } from "../../shared/types";

type SalesOrderStatus =
  | "PENDING"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export class SalesOrderService {
  static async getAllOrders(userId: string) {
    const orders = await prisma.salesOrder.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    
    // Convert Decimal values to numbers
    return orders.map((order: any) => ({
      ...order,
      totalAmount: Number(order.totalAmount),
    }));
  }

  static async getOrderById(id: string, userId: string) {
    const order = await prisma.salesOrder.findFirst({
      where: { id, userId },
    });

    if (!order) return null;

    // Convert Decimal values to numbers
    return {
      ...order,
      totalAmount: Number(order.totalAmount),
    };
  }

  static async createOrder(data: Omit<SalesOrder, "id" | "createdAt">) {
    // Check if order number already exists
    const existingOrder = await prisma.salesOrder.findUnique({
      where: { orderNumber: data.orderNumber },
    });

    if (existingOrder) {
      throw new Error("Order number already exists");
    }

    return await prisma.salesOrder.create({
      data: {
        ...data,
        orderDate: data.orderDate || new Date(),
      },
    });
  }

  static async updateOrder(
    id: string,
    userId: string,
    data: Partial<Omit<SalesOrder, "id" | "userId" | "createdAt">>
  ) {
    // Check if order exists and belongs to user
    const existingOrder = await prisma.salesOrder.findFirst({
      where: { id, userId },
    });

    if (!existingOrder) {
      throw new Error("Sales order not found");
    }

    // Check if new order number conflicts (if order number is being updated)
    if (data.orderNumber && data.orderNumber !== existingOrder.orderNumber) {
      const orderConflict = await prisma.salesOrder.findUnique({
        where: { orderNumber: data.orderNumber },
      });

      if (orderConflict) {
        throw new Error("Order number already exists");
      }
    }

    return await prisma.salesOrder.update({
      where: { id },
      data: {
        ...data,
        orderDate: data.orderDate ? new Date(data.orderDate) : undefined,
      },
    });
  }

  static async deleteOrder(id: string, userId: string) {
    // Check if order exists and belongs to user
    const existingOrder = await prisma.salesOrder.findFirst({
      where: { id, userId },
    });

    if (!existingOrder) {
      throw new Error("Sales order not found");
    }

    return await prisma.salesOrder.delete({
      where: { id },
    });
  }

  static async getOrdersByStatus(userId: string, status: SalesOrderStatus) {
    const orders = await prisma.salesOrder.findMany({
      where: { userId, status },
      orderBy: { createdAt: "desc" },
    });

    // Convert Decimal values to numbers
    return orders.map((order: any) => ({
      ...order,
      totalAmount: Number(order.totalAmount),
    }));
  }

  static async getOrdersInDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ) {
    const orders = await prisma.salesOrder.findMany({
      where: {
        userId,
        orderDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { orderDate: "desc" },
    });

    // Convert Decimal values to numbers
    return orders.map((order: any) => ({
      ...order,
      totalAmount: Number(order.totalAmount),
    }));
  }
}
