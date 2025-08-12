export interface User {
  id: string;
  email: string;
  name?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryItem {
  id: string;
  productName: string;
  sku: string;
  category: string;
  quantity: number;
  unitPrice: number;
  reorderLevel: number;
  supplier: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SalesOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  status: "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  orderDate: Date;
  createdAt: Date;
  userId: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierName: string;
  supplierEmail: string;
  totalAmount: number;
  status: "PENDING" | "APPROVED" | "RECEIVED" | "CANCELLED";
  orderDate: Date;
  expectedDelivery: Date;
  createdAt: Date;
  userId: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  total?: number;
}

export interface ValidationError {
  field: string;
  message: string;
}
