import { ApiResponse } from "./api";

// Base service class that provides common patterns
export abstract class BaseService<T> {
  protected abstract entityName: string;

  // Helper method to handle API responses and extract data
  protected handleResponse<TData>(response: ApiResponse<TData>): TData {
    if (!response.success) {
      throw new ServiceError(
        response.error || `Failed to ${this.entityName} operation`,
        500
      );
    }

    if (response.data === undefined) {
      throw new ServiceError(
        `No data returned from ${this.entityName} operation`,
        500
      );
    }

    return response.data;
  }

  // Helper method to handle async API calls with error handling
  protected async handleApiCall<TData>(
    apiCall: () => Promise<ApiResponse<TData>>,
    operation: string = "operation"
  ): Promise<TData> {
    try {
      const response = await apiCall();
      return this.handleResponse(response);
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }

      throw new ServiceError(
        `${this.entityName} ${operation} failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        500,
        error
      );
    }
  }
}

// Generic error handling for services
export class ServiceError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public originalError?: any
  ) {
    super(message);
    this.name = "ServiceError";
  }
}

export default BaseService;
