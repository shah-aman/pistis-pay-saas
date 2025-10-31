// Checkout and billing types

export interface CheckoutPaymentDetails {
  id: string;
  amount: number;
  description: string;
  merchantName: string;
  merchantCountry: string;
  status: string;
  createdAt: string;
}

export interface CheckoutTaxCalculation {
  subtotal: number;
  taxAmount: number;
  taxRate: number;
  taxName: string;
  taxCountry: string;
  total: number;
}

export interface CheckoutSession {
  paymentId: string;
  payment: CheckoutPaymentDetails;
  tax: CheckoutTaxCalculation;
  checkoutUrl: string;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface InvoiceDetails {
  invoiceNumber: string;
  date: string;
  paidDate: string | null;
  status: string;
  
  // Merchant info
  merchant: {
    name: string;
    country: string;
    email: string;
  };
  
  // Customer info
  customer: {
    wallet: string;
    country: string;
  };
  
  // Line items
  lineItems: InvoiceLineItem[];
  
  // Tax breakdown
  subtotal: number;
  taxAmount: number;
  taxRate: number;
  taxName: string;
  taxCountry: string;
  total: number;
  
  // Payment info
  paymentMethod: string;
  transactionSignature: string | null;
  
  // Platform info
  platformName: string;
  platformWallet: string;
}

// Solana Pay types
export interface SolanaPaymentRequest {
  paymentUrl: string;
  qrCodeDataUrl?: string;
  recipient: string;
  amount: number;
  reference: string;
  label?: string;
  message?: string;
}

export interface SolanaPaymentResult {
  signature: string;
  customerWallet: string;
  amount: number;
  verified: boolean;
  timestamp: string;
}

export interface SolanaPayCheckoutProps {
  paymentId: string;
  amount: number;
  merchantName: string;
  description?: string;
  onSuccess: (result: SolanaPaymentResult) => void;
  onError?: (error: Error) => void;
}

// @deprecated - SphereRamp widget is no longer used for checkout
// Use Solana Pay for direct wallet-to-wallet payments instead
export interface SphereRampConfig {
  containerId: string;
  applicationId: string;
  amount: number;
  currency: string;
  metadata?: Record<string, any>;
  onComplete?: (result: SphereRampResult) => void;
  onError?: (error: Error) => void;
}

// @deprecated - SphereRamp widget is no longer used for checkout
export interface SphereRampResult {
  transactionSignature: string;
  customerWallet: string;
  amount: number;
  timestamp: string;
}

