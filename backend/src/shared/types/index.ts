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
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  supplierId?: string;
}

export interface SalesOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  status: number;
  orderDate: Date;
  createdAt: Date;
  userId: string;
  notes?: string;
}

export interface SalesOrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  createdAt: Date;
  salesOrderId: string;
  inventoryId: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierName: string;
  supplierEmail: string;
  totalAmount: number;
  status: number;
  orderDate: Date;
  expectedDelivery: Date;
  createdAt: Date;
  userId: string;
  supplierId?: string;
  notes?: string;
}

export interface PurchaseOrderItem {
  id: string;
  quantity: number;
  costPerUnit: number;
  totalCost: number;
  createdAt: Date;
  purchaseOrderId: string;
  inventoryId: string;
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
