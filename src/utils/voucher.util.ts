import { v4 as uuidv4 } from 'uuid';

/**
 * Generate unique voucher code
 * Format: XXXX-XXXX-XXXX (12 characters without dashes)
 */
export const generateVoucherCode = (): string => {
  const uuid = uuidv4().replace(/-/g, '').toUpperCase();
  return uuid.substring(0, 12);
};

/**
 * Generate voucher expiry date
 * Default: 30 days from now
 */
export const generateVoucherExpiry = (daysFromNow: number = 30): Date => {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + daysFromNow);
  return expiryDate;
};

/**
 * Validate voucher code format
 */
export const isValidVoucherCode = (code: string): boolean => {
  const regex = /^[A-Z0-9]{12}$/;
  return regex.test(code);
};

export default {
  generateVoucherCode,
  generateVoucherExpiry,
  isValidVoucherCode,
};
