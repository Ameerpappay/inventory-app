import { apiClient, Supplier } from "./api";
import BaseService, { ServiceError } from "./BaseService";

// Types for supplier operations
export interface CreateSupplierData {
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
  isActive?: boolean;
}

export interface UpdateSupplierData extends Partial<CreateSupplierData> {}

export class SupplierService extends BaseService<Supplier> {
  protected entityName = "Supplier";

  // Get all suppliers
  async getAll(): Promise<Supplier[]> {
    return this.handleApiCall(() => apiClient.getSuppliers(), "fetch all");
  }

  // Get active suppliers only
  async getActive(): Promise<Supplier[]> {
    return this.handleApiCall(
      () => apiClient.getActiveSuppliers(),
      "fetch active"
    );
  }

  // Get supplier by ID
  async getById(id: string): Promise<Supplier> {
    return this.handleApiCall(
      () => apiClient.getSupplier(id),
      `fetch by ID ${id}`
    );
  }

  // Create new supplier
  async create(data: CreateSupplierData): Promise<Supplier> {
    if (!data.name || data.name.trim().length === 0) {
      throw new ServiceError("Supplier name is required", 400);
    }

    // Ensure isActive has a default value
    const supplierData = {
      ...data,
      isActive: data.isActive ?? true,
    };

    return this.handleApiCall(
      () => apiClient.createSupplier(supplierData),
      "create"
    );
  }

  // Update existing supplier
  async update(id: string, data: UpdateSupplierData): Promise<Supplier> {
    if (!id) {
      throw new ServiceError("Supplier ID is required", 400);
    }

    return this.handleApiCall(
      () => apiClient.updateSupplier(id, data),
      `update ${id}`
    );
  }

  // Delete supplier
  async delete(id: string): Promise<void> {
    if (!id) {
      throw new ServiceError("Supplier ID is required", 400);
    }

    return this.handleApiCall(
      () => apiClient.deleteSupplier(id),
      `delete ${id}`
    );
  }

  // Toggle supplier status (active/inactive)
  async toggleStatus(id: string): Promise<Supplier> {
    if (!id) {
      throw new ServiceError("Supplier ID is required", 400);
    }

    return this.handleApiCall(
      () => apiClient.toggleSupplierStatus(id),
      `toggle status ${id}`
    );
  }

  // Helper method to validate supplier data
  validateSupplierData(data: CreateSupplierData): string[] {
    const errors: string[] = [];

    if (!data.name || data.name.trim().length === 0) {
      errors.push("Supplier name is required");
    }

    if (data.email && !this.isValidEmail(data.email)) {
      errors.push("Please enter a valid email address");
    }

    if (data.website && !this.isValidUrl(data.website)) {
      errors.push("Please enter a valid website URL");
    }

    return errors;
  }

  // Helper method to validate email format
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Helper method to validate URL format
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Get suppliers with statistics
  async getWithStats(): Promise<Supplier[]> {
    const suppliers = await this.getAll();
    // You can add logic here to fetch additional stats for each supplier
    // such as total inventory items, purchase orders, etc.
    return suppliers;
  }

  // Search suppliers by name
  async searchByName(query: string): Promise<Supplier[]> {
    const suppliers = await this.getAll();

    if (!query || query.trim().length === 0) {
      return suppliers;
    }

    const searchTerm = query.toLowerCase().trim();

    return suppliers.filter(
      (supplier) =>
        supplier.name.toLowerCase().includes(searchTerm) ||
        (supplier.contactPerson &&
          supplier.contactPerson.toLowerCase().includes(searchTerm))
    );
  }
}

// Create and export a singleton instance
export const supplierService = new SupplierService();

export default supplierService;
