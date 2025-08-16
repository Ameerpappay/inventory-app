// API configuration
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001/api";

// Types
export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  total?: number;
}

export interface LoginResponse {
  user: User;
  token: string;
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
  createdAt: string;
  updatedAt: string;
  supplierId?: string;
  supplier?: Supplier; // Optional populated supplier data
}

export interface SalesOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  status: "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  orderDate: string;
  createdAt: string;
  userId: string;
  notes?: string;
  items?: SalesOrderItem[];
}

export interface SalesOrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  inventory: InventoryItem;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierName: string;
  supplierEmail: string;
  totalAmount: number;
  status: "PENDING" | "APPROVED" | "RECEIVED" | "CANCELLED";
  orderDate: string;
  expectedDelivery: string;
  createdAt: string;
  userId: string;
  supplierId?: string;
  notes?: string;
  items?: PurchaseOrderItem[];
}

export interface PurchaseOrderItem {
  id: string;
  quantity: number;
  costPerUnit: number;
  totalCost: number;
  inventory: InventoryItem;
}

export interface Supplier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  contactPerson?: string;
  website?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

// Token management
class TokenManager {
  private static readonly TOKEN_KEY = "inventory_app_token";

  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  static removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }
}

// API Client class
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const token = TokenManager.getToken();

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || "Request failed");
      }

      return data;
    } catch (error) {
      console.error("API Request Error:", error);
      throw error;
    }
  }

  // Auth endpoints
  async login(
    email: string,
    password: string
  ): Promise<ApiResponse<LoginResponse>> {
    return this.request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  async register(
    email: string,
    password: string,
    name?: string
  ): Promise<ApiResponse<LoginResponse>> {
    return this.request<LoginResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    });
  }

  // Inventory endpoints
  async getInventory(): Promise<ApiResponse<InventoryItem[]>> {
    return this.request<InventoryItem[]>("/inventory");
  }

  async getInventoryItem(id: string): Promise<ApiResponse<InventoryItem>> {
    return this.request<InventoryItem>(`/inventory/${id}`);
  }

  async createInventoryItem(
    item: Omit<InventoryItem, "id" | "userId" | "createdAt" | "updatedAt">
  ): Promise<ApiResponse<InventoryItem>> {
    return this.request<InventoryItem>("/inventory", {
      method: "POST",
      body: JSON.stringify(item),
    });
  }

  async updateInventoryItem(
    id: string,
    item: Partial<
      Omit<InventoryItem, "id" | "userId" | "createdAt" | "updatedAt">
    >
  ): Promise<ApiResponse<InventoryItem>> {
    return this.request<InventoryItem>(`/inventory/${id}`, {
      method: "PUT",
      body: JSON.stringify(item),
    });
  }

  async deleteInventoryItem(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/inventory/${id}`, {
      method: "DELETE",
    });
  }

  async getLowStockItems(): Promise<ApiResponse<InventoryItem[]>> {
    return this.request<InventoryItem[]>("/inventory/alerts/low-stock");
  }

  // Sales Orders endpoints
  async getSalesOrders(): Promise<ApiResponse<SalesOrder[]>> {
    return this.request<SalesOrder[]>("/sales-orders");
  }

  async getSalesOrder(id: string): Promise<ApiResponse<SalesOrder>> {
    return this.request<SalesOrder>(`/sales-orders/${id}`);
  }

  async createSalesOrder(
    order: Omit<SalesOrder, "id" | "userId" | "createdAt"> & {
      items?: Array<{
        inventoryId: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
      }>;
    }
  ): Promise<ApiResponse<SalesOrder>> {
    return this.request<SalesOrder>("/sales-orders", {
      method: "POST",
      body: JSON.stringify(order),
    });
  }

  async updateSalesOrder(
    id: string,
    order: Partial<Omit<SalesOrder, "id" | "userId" | "createdAt">> & {
      items?: Array<{
        inventoryId: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
      }>;
    }
  ): Promise<ApiResponse<SalesOrder>> {
    return this.request<SalesOrder>(`/sales-orders/${id}`, {
      method: "PUT",
      body: JSON.stringify(order),
    });
  }

  async deleteSalesOrder(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/sales-orders/${id}`, {
      method: "DELETE",
    });
  }

  async getSalesOrdersByStatus(
    status: string
  ): Promise<ApiResponse<SalesOrder[]>> {
    return this.request<SalesOrder[]>(`/sales-orders/status/${status}`);
  }

  // Purchase Orders endpoints
  async getPurchaseOrders(): Promise<ApiResponse<PurchaseOrder[]>> {
    return this.request<PurchaseOrder[]>("/purchase-orders");
  }

  async getPurchaseOrder(id: string): Promise<ApiResponse<PurchaseOrder>> {
    return this.request<PurchaseOrder>(`/purchase-orders/${id}`);
  }

  async createPurchaseOrder(
    order: Omit<PurchaseOrder, "id" | "userId" | "createdAt">
  ): Promise<ApiResponse<PurchaseOrder>> {
    return this.request<PurchaseOrder>("/purchase-orders", {
      method: "POST",
      body: JSON.stringify(order),
    });
  }

  async updatePurchaseOrder(
    id: string,
    order: Partial<Omit<PurchaseOrder, "id" | "userId" | "createdAt">>
  ): Promise<ApiResponse<PurchaseOrder>> {
    return this.request<PurchaseOrder>(`/purchase-orders/${id}`, {
      method: "PUT",
      body: JSON.stringify(order),
    });
  }

  async deletePurchaseOrder(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/purchase-orders/${id}`, {
      method: "DELETE",
    });
  }

  async getPurchaseOrdersByStatus(
    status: string
  ): Promise<ApiResponse<PurchaseOrder[]>> {
    return this.request<PurchaseOrder[]>(`/purchase-orders/status/${status}`);
  }

  async getOverduePurchaseOrders(): Promise<ApiResponse<PurchaseOrder[]>> {
    return this.request<PurchaseOrder[]>("/purchase-orders/alerts/overdue");
  }

  // Suppliers endpoints
  async getSuppliers(): Promise<ApiResponse<Supplier[]>> {
    return this.request<Supplier[]>("/suppliers");
  }

  async getActiveSuppliers(): Promise<ApiResponse<Supplier[]>> {
    return this.request<Supplier[]>("/suppliers/active");
  }

  async getSupplier(id: string): Promise<ApiResponse<Supplier>> {
    return this.request<Supplier>(`/suppliers/${id}`);
  }

  async createSupplier(
    supplier: Omit<Supplier, "id" | "userId" | "createdAt" | "updatedAt">
  ): Promise<ApiResponse<Supplier>> {
    return this.request<Supplier>("/suppliers", {
      method: "POST",
      body: JSON.stringify(supplier),
    });
  }

  async updateSupplier(
    id: string,
    supplier: Partial<
      Omit<Supplier, "id" | "userId" | "createdAt" | "updatedAt">
    >
  ): Promise<ApiResponse<Supplier>> {
    return this.request<Supplier>(`/suppliers/${id}`, {
      method: "PUT",
      body: JSON.stringify(supplier),
    });
  }

  async deleteSupplier(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/suppliers/${id}`, {
      method: "DELETE",
    });
  }

  async toggleSupplierStatus(id: string): Promise<ApiResponse<Supplier>> {
    return this.request<Supplier>(`/suppliers/${id}/toggle-status`, {
      method: "PATCH",
    });
  }
}

// Create and export the API client instance
export const apiClient = new ApiClient(API_BASE_URL);
export { TokenManager };
