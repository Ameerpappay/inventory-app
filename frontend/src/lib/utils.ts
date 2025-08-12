// Utility functions for the frontend application

/**
 * Safely format a number to a fixed decimal places
 * Handles cases where the value might be a string, null, or undefined
 */
export function formatCurrency(value: any, decimals: number = 2): string {
  const numValue = Number(value || 0);
  if (isNaN(numValue)) {
    return "0.00";
  }
  return numValue.toFixed(decimals);
}

/**
 * Format a number as currency with dollar sign
 */
export function formatPrice(value: any): string {
  return `$${formatCurrency(value, 2)}`;
}

/**
 * Safely convert any value to a number
 */
export function toNumber(value: any): number {
  const numValue = Number(value || 0);
  return isNaN(numValue) ? 0 : numValue;
}

/**
 * Format a number as percentage
 */
export function formatPercentage(value: any, decimals: number = 0): string {
  const numValue = Number(value || 0);
  if (isNaN(numValue)) {
    return "0%";
  }
  return `${(numValue * 100).toFixed(decimals)}%`;
}
