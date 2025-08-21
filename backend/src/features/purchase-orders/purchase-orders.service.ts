import { prisma } from "../../index";
import { PurchaseOrder } from "../../shared/types";
import { PurchaseOrderStatus } from "./purchase-order-status";

export class PurchaseOrderService {
  static async getAllOrders(userId: string) {
    const orders = await prisma.purchaseOrder.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    // Convert Decimal values to numbers
    return orders.map((order: any) => ({
      ...order,
      status: PurchaseOrderStatus[order.status as number],
      totalAmount: Number(order.totalAmount),
    }));
  }

  static async getOrderById(id: string, userId: string) {
    const order = await prisma.purchaseOrder.findFirst({
      where: { id, userId },
      include: {
        items: {
          include: {
            inventory: true,
          },
        },
        supplier: true,
      },
    });

    if (!order) return null;

    // Convert Decimal values to numbers
    return {
      ...order,
      totalAmount: Number(order.totalAmount),
      status: PurchaseOrderStatus[order.status as number],
      items: order.items.map((item) => ({
        ...item,
        costPerUnit: Number(item.costPerUnit),
        totalCost: Number(item.totalCost),
        inventory: {
          ...item.inventory,
          unitPrice: Number(item.inventory.unitPrice),
        },
      })),
    };
  }

  static async createOrder(
    data: Omit<PurchaseOrder, "id" | "createdAt"> & { items?: any[] }
  ) {
    // Check if PO number already exists
    const existingPO = await prisma.purchaseOrder.findUnique({
      where: { poNumber: data.poNumber },
    });

    if (existingPO) {
      throw new Error("PO number already exists");
    }

    // Extract items from data
    const { items, ...orderData } = data;

    const order = await prisma.purchaseOrder.create({
      data: {
        ...orderData,
        orderDate: orderData.orderDate || new Date(),
        expectedDelivery: new Date(orderData.expectedDelivery),
        // Create items if provided
        ...(items &&
          items.length > 0 && {
            items: {
              create: items.map((item: any) => ({
                inventoryId: item.product.id,
                quantity: item.quantity,
                costPerUnit: item.cost_per_unit,
                totalCost: item.total,
              })),
            },
          }),
      },
      include: {
        items: {
          include: {
            inventory: true,
          },
        },
      },
    });

    return {
      ...order,
      totalAmount: Number(order.totalAmount),
      items: order.items.map((item: any) => ({
        ...item,
        costPerUnit: Number(item.costPerUnit),
        totalCost: Number(item.totalCost),
        inventory: {
          ...item.inventory,
          unitPrice: Number(item.inventory.unitPrice),
        },
      })),
    };
  }

  static async updateOrder(
    id: string,
    userId: string,
    data: Partial<Omit<PurchaseOrder, "id" | "userId" | "createdAt">>
  ) {
    // Check if order exists and belongs to user
    const existingOrder = await prisma.purchaseOrder.findFirst({
      where: { id, userId },
    });

    if (!existingOrder) {
      throw new Error("Purchase order not found");
    }

    // Check if new PO number conflicts (if PO number is being updated)
    if (data.poNumber && data.poNumber !== existingOrder.poNumber) {
      const poConflict = await prisma.purchaseOrder.findUnique({
        where: { poNumber: data.poNumber },
      });

      if (poConflict) {
        throw new Error("PO number already exists");
      }
    }

    return await prisma.purchaseOrder.update({
      where: { id },
      data: {
        ...data,
        orderDate: data.orderDate ? new Date(data.orderDate) : undefined,
        expectedDelivery: data.expectedDelivery
          ? new Date(data.expectedDelivery)
          : undefined,
      },
    });
  }

  static async deleteOrder(id: string, userId: string) {
    // Check if order exists and belongs to user
    const existingOrder = await prisma.purchaseOrder.findFirst({
      where: { id, userId },
    });

    if (!existingOrder) {
      throw new Error("Purchase order not found");
    }

    return await prisma.purchaseOrder.delete({
      where: { id },
    });
  }

  static async getOrdersByStatus(userId: string, status: PurchaseOrderStatus) {
    const orders = await prisma.purchaseOrder.findMany({
      where: { userId, status },
      orderBy: { createdAt: "desc" },
    });

    // Convert Decimal values to numbers
    return orders.map((order: any) => ({
      ...order,
      status: PurchaseOrderStatus[order.status as number],
      totalAmount: Number(order.totalAmount),
    }));
  }

  static async getOrdersInDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ) {
    const orders = await prisma.purchaseOrder.findMany({
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
      status: PurchaseOrderStatus[order.status as number],
      totalAmount: Number(order.totalAmount),
    }));
  }

  static async getOverdueDeliveries(userId: string) {
    const orders = await prisma.purchaseOrder.findMany({
      where: {
        userId,
        status: { not: PurchaseOrderStatus.RECEIVED },
        expectedDelivery: {
          lt: new Date(),
        },
      },
      orderBy: { expectedDelivery: "asc" },
    });

    // Convert Decimal values to numbers
    return orders.map((order: any) => ({
      ...order,
      status: PurchaseOrderStatus[order.status as number],
      totalAmount: Number(order.totalAmount),
    }));
  }
}
