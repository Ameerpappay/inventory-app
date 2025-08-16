import BaseService, { ServiceError } from "./BaseService";
import { TokenManager } from "./api";

// Customer interface
export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  contactPerson?: string;
  companyType?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Types for customer operations
export interface CreateCustomerData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  contactPerson?: string;
  companyType?: string;
  notes?: string;
  isActive?: boolean;
}

export interface UpdateCustomerData extends Partial<CreateCustomerData> {}

// API response types
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  total?: number;
}

export class CustomerService extends BaseService<Customer> {
  protected entityName = "Customer";
  private baseUrl = "/api/customers";

  // Make API requests
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    // Get auth token from TokenManager
    const token = TokenManager.getToken();

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ServiceError(
        errorData.error || `HTTP ${response.status}: ${response.statusText}`,
        response.status
      );
    }

    return response.json();
  }

  // Get all customers
  async getAll(): Promise<Customer[]> {
    return this.handleApiCall(async () => {
      const response = await this.makeRequest<ApiResponse<Customer[]>>("");
      return response;
    }, "fetch all");
  }

  // Get active customers only
  async getActive(): Promise<Customer[]> {
    return this.handleApiCall(async () => {
      const response = await this.makeRequest<ApiResponse<Customer[]>>(
        "/active"
      );
      return response;
    }, "fetch active");
  }

  // Get customer by ID
  async getById(id: string): Promise<Customer> {
    return this.handleApiCall(async () => {
      const response = await this.makeRequest<ApiResponse<Customer>>(`/${id}`);
      return response;
    }, `fetch by ID ${id}`);
  }

  // Search customers
  async search(term: string): Promise<Customer[]> {
    if (!term || term.trim().length === 0) {
      return [];
    }

    return this.handleApiCall(async () => {
      const response = await this.makeRequest<ApiResponse<Customer[]>>(
        `/search/${encodeURIComponent(term.trim())}`
      );
      return response;
    }, `search for "${term}"`);
  }

  // Create new customer
  async create(data: CreateCustomerData): Promise<Customer> {
    if (!data.name || data.name.trim().length === 0) {
      throw new ServiceError("Customer name is required", 400);
    }

    // Ensure isActive has a default value
    const customerData = {
      ...data,
      isActive: data.isActive ?? true,
    };

    return this.handleApiCall(async () => {
      const response = await this.makeRequest<ApiResponse<Customer>>("", {
        method: "POST",
        body: JSON.stringify(customerData),
      });
      return response;
    }, "create");
  }

  // Update existing customer
  async update(id: string, data: UpdateCustomerData): Promise<Customer> {
    if (!id) {
      throw new ServiceError("Customer ID is required", 400);
    }

    return this.handleApiCall(async () => {
      const response = await this.makeRequest<ApiResponse<Customer>>(`/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      return response;
    }, `update ${id}`);
  }

  // Update customer status
  async updateStatus(id: string, isActive: boolean): Promise<Customer> {
    if (!id) {
      throw new ServiceError("Customer ID is required", 400);
    }

    return this.handleApiCall(async () => {
      const response = await this.makeRequest<ApiResponse<Customer>>(
        `/${id}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ isActive }),
        }
      );
      return response;
    }, `update status ${id}`);
  }

  // Delete customer
  async delete(id: string): Promise<void> {
    if (!id) {
      throw new ServiceError("Customer ID is required", 400);
    }

    return this.handleApiCall(async () => {
      const response = await this.makeRequest<ApiResponse<void>>(`/${id}`, {
        method: "DELETE",
      });
      return response;
    }, `delete ${id}`);
  }

  // Helper method to validate customer data
  validateCustomerData(data: CreateCustomerData): string[] {
    const errors: string[] = [];

    if (!data.name || data.name.trim().length === 0) {
      errors.push("Customer name is required");
    }

    if (data.email && !this.isValidEmail(data.email)) {
      errors.push("Please enter a valid email address");
    }

    if (data.phone && !this.isValidPhone(data.phone)) {
      errors.push("Please enter a valid phone number");
    }

    return errors;
  }

  // Helper method to validate email format
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Helper method to validate phone format
  private isValidPhone(phone: string): boolean {
    // Allow various phone formats
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    const cleanedPhone = phone.replace(/[\s\-\(\)]/g, "");
    return phoneRegex.test(cleanedPhone);
  }

  // Get customers with statistics
  async getWithStats(): Promise<Customer[]> {
    const customers = await this.getAll();
    // You can add logic here to fetch additional stats for each customer
    // such as total sales orders, order history, etc.
    return customers;
  }

  // Search customers by name, email, or contact person
  async searchByTerm(query: string): Promise<Customer[]> {
    if (!query || query.trim().length === 0) {
      return await this.getAll();
    }

    // Use the backend search endpoint for better performance
    return this.search(query);
  }

  // Filter customers by status
  async filterByStatus(isActive: boolean): Promise<Customer[]> {
    const allCustomers = await this.getAll();
    return allCustomers.filter((customer) => customer.isActive === isActive);
  }

  // Get customer summary statistics
  async getStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
  }> {
    const customers = await this.getAll();
    return {
      total: customers.length,
      active: customers.filter((c) => c.isActive).length,
      inactive: customers.filter((c) => !c.isActive).length,
    };
  }
}

// Create and export a singleton instance
export const customerService = new CustomerService();

export default customerService;
