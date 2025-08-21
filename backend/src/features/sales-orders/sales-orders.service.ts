import { prisma } from "../../index";
import { SalesOrder, SalesOrderItem } from "../../shared/types";

enum SalesOrderStatus {
  PENDING = 0,
  PROCESSING = 1,
  SHIPPED = 2,
  DELIVERED = 3,
  CANCELLED = 4,
}

interface CreateSalesOrderData extends Omit<SalesOrder, "id" | "createdAt"> {
  items?: Array<{
    inventoryId: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
}

export class SalesOrderService {
  static async getAllOrders(userId: string) {
    const orders = await prisma.salesOrder.findMany({
      where: { userId },
      include: {
        // @ts-ignore - Temporary ignore until Prisma client is properly regenerated
        items: {
          include: {
            inventory: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Convert Decimal values to numbers
    return orders.map((order: any) => ({
      ...order,
      status: SalesOrderStatus[order.status as number],
      totalAmount: Number(order.totalAmount),
      items:
        order.items?.map((item: any) => ({
          ...item,
          unitPrice: Number(item.unitPrice),
          totalPrice: Number(item.totalPrice),
        })) || [],
    }));
  }

  static async getOrderById(id: string, userId: string) {
    const order = await prisma.salesOrder.findFirst({
      where: { id, userId },
      include: {
        // @ts-ignore - Temporary ignore until Prisma client is properly regenerated
        items: {
          include: {
            inventory: true,
          },
        },
      },
    });

    if (!order) return null;

    // Convert Decimal values to numbers
    return {
      ...order,
      status: SalesOrderStatus[order.status as number],
      totalAmount: Number(order.totalAmount),
      // @ts-ignore - Temporary ignore until Prisma client is properly regenerated
      items:
        order.items?.map((item: any) => ({
          ...item,
          unitPrice: Number(item.unitPrice),
          totalPrice: Number(item.totalPrice),
        })) || [],
    };
  }

  static async createOrder(data: CreateSalesOrderData) {
    // Check if order number already exists
    const existingOrder = await prisma.salesOrder.findUnique({
      where: { orderNumber: data.orderNumber },
    });

    if (existingOrder) {
      throw new Error("Order number already exists");
    }

    const { items, ...orderData } = data;

    return await prisma.salesOrder.create({
      data: {
        ...orderData,
        orderDate: orderData.orderDate || new Date(),
        // @ts-ignore - Temporary ignore until Prisma client is properly regenerated
        items: items
          ? {
              create: items.map((item) => ({
                inventoryId: item.inventoryId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
              })),
            }
          : undefined,
      },
      include: {
        // @ts-ignore - Temporary ignore until Prisma client is properly regenerated
        items: {
          include: {
            inventory: true,
          },
        },
      },
    });
  }

  static async updateOrder(
    id: string,
    userId: string,
    data: Partial<CreateSalesOrderData>
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

    const { items, ...orderData } = data;

    return await prisma.salesOrder.update({
      where: { id },
      data: {
        ...orderData,
        orderDate: orderData.orderDate
          ? new Date(orderData.orderDate)
          : undefined,
        // @ts-ignore - Temporary ignore until Prisma client is properly regenerated
        items: items
          ? {
              deleteMany: {},
              create: items.map((item) => ({
                inventoryId: item.inventoryId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
              })),
            }
          : undefined,
      },
      include: {
        // @ts-ignore - Temporary ignore until Prisma client is properly regenerated
        items: {
          include: {
            inventory: true,
          },
        },
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
      status: SalesOrderStatus[order.status as number],
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
      status: SalesOrderStatus[order.status as number],
      totalAmount: Number(order.totalAmount),
    }));
  }
}
