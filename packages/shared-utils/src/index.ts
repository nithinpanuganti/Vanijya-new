/**
 * Vanijya Shared Utilities
 * Smart India Hackathon (SIH) Problem Statement 26132
 */

export * from './locations';

/**
 * Formats a numeric value as Indian Rupee (INR) currency.
 * Example: 25000 -> ₹25,000
 */
export function formatINR(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '₹0';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formats an ISO date string or Date object into Indian readable format.
 * Example: 2024-10-15 -> 15 Oct 2024
 */
export function formatDate(date: string | Date): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

/**
 * Formats crop quantity with standard units (Quintal, Kg, Tonne).
 * Example: (50, 'QUINTAL') -> "50 Quintal"
 */
export function formatCropQuantity(quantity: number, unit: string = 'Quintal'): string {
  if (quantity === null || quantity === undefined) return `0 ${unit}`;
  return `${quantity.toLocaleString('en-IN')} ${unit}`;
}

/**
 * Calculates total transaction value (Agreed Price * Quantity).
 */
export function calculateTotal(price: number, quantity: number): number {
  if (!price || !quantity || price < 0 || quantity < 0) return 0;
  return Math.round(price * quantity * 100) / 100;
}
