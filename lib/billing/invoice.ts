import type { InvoiceDetails, InvoiceLineItem } from '@/types/checkout';

/**
 * Generate invoice number based on payment ID and date
 * Format: INV-YYYYMMDD-XXXXX
 */
export function generateInvoiceNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  
  return `INV-${year}${month}${day}-${random}`;
}

/**
 * Generate full invoice details from payment data
 */
export function generateInvoice(params: {
  payment: {
    id: string;
    invoiceNumber: string | null;
    amountUsdc: number;
    description: string | null;
    taxAmount: number | null;
    taxRate: number | null;
    taxCountry: string | null;
    customerWallet: string | null;
    txSignature: string | null;
    createdAt: Date;
    completedAt: Date | null;
    status: string;
  };
  merchant: {
    businessName: string;
    email: string;
    country: string;
  };
  taxName?: string;
}): InvoiceDetails {
  const { payment, merchant, taxName = 'Tax' } = params;
  
  const subtotal = Number(payment.amountUsdc);
  const taxAmount = Number(payment.taxAmount || 0);
  const taxRate = Number(payment.taxRate || 0);
  const total = subtotal + taxAmount;
  
  // Create line item
  const lineItems: InvoiceLineItem[] = [
    {
      description: payment.description || 'Payment',
      quantity: 1,
      unitPrice: subtotal,
      amount: subtotal,
    },
  ];
  
  return {
    invoiceNumber: payment.invoiceNumber || generateInvoiceNumber(),
    date: payment.createdAt.toISOString(),
    paidDate: payment.completedAt?.toISOString() || null,
    status: payment.status,
    
    merchant: {
      name: merchant.businessName,
      country: merchant.country,
      email: merchant.email,
    },
    
    customer: {
      wallet: payment.customerWallet || 'Not provided',
      country: payment.taxCountry || 'Unknown',
    },
    
    lineItems,
    
    subtotal,
    taxAmount,
    taxRate,
    taxName,
    taxCountry: payment.taxCountry || 'N/A',
    total,
    
    paymentMethod: 'USDC on Solana',
    transactionSignature: payment.txSignature,
    
    platformName: 'SolaPay',
    platformWallet: process.env.PLATFORM_WALLET_ADDRESS || 'N/A',
  };
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  }).format(amount);
}

/**
 * Format USDC amount for display
 */
export function formatUSDC(amount: number): string {
  return `${amount.toFixed(2)} USDC`;
}

/**
 * Format date for invoice display
 */
export function formatInvoiceDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

/**
 * Calculate invoice totals from line items
 */
export function calculateInvoiceTotals(
  lineItems: InvoiceLineItem[],
  taxRate: number
): {
  subtotal: number;
  taxAmount: number;
  total: number;
} {
  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = (subtotal * taxRate) / 100;
  const total = subtotal + taxAmount;
  
  return { subtotal, taxAmount, total };
}

