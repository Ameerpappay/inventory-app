/**
 * Simple environment configuration for the frontend
 */

export const env = {
  // API Configuration
  API_URL: import.meta.env.VITE_API_URL || "http://localhost:3001/api",

  // Environment info
  NODE_ENV: import.meta.env.VITE_NODE_ENV || "development",
  APP_NAME: import.meta.env.VITE_APP_NAME || "Inventory App",
  DEBUG: import.meta.env.VITE_DEBUG === "true",

  // Helper properties
  get isDevelopment() {
    return this.NODE_ENV === "development";
  },

  get isProduction() {
    return this.NODE_ENV === "production";
  },
} as const;
