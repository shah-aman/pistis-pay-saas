// Sphere Labs API Types

export interface SpherePaymentLink {
  id: string;
  url: string;
  amount: number;
  currency: string;
  description?: string;
  redirectUrl?: string;
  metadata?: Record<string, any>;
  status: 'pending' | 'completed' | 'failed' | 'expired';
  createdAt: string;
  expiresAt?: string;
}

export interface SpherePayment {
  id: string;
  paymentLinkId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  customerWallet?: string;
  txSignature?: string;
  completedAt?: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

export interface SphereWithdrawal {
  id: string;
  amount: number;
  sourceCurrency: string;
  targetCurrency: string;
  targetAmount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  bankAccountId: string;
  createdAt: string;
  completedAt?: string;
  estimatedArrival?: string;
}

export interface SphereWebhookPayload {
  event: 'payment.created' | 'payment.completed' | 'payment.failed' | 'withdrawal.completed' | 'withdrawal.failed';
  data: {
    id: string;
    paymentLinkId?: string;
    amount: number;
    currency: string;
    status: string;
    customerWallet?: string;
    txSignature?: string;
    completedAt?: string;
    metadata?: Record<string, any>;
  };
  timestamp: string;
  signature: string;
}

export interface CreatePaymentLinkParams {
  amount: number;
  description?: string;
  redirectUrl?: string;
  metadata?: Record<string, any>;
}

export interface CreateWithdrawalParams {
  amount: number;
  bankAccountId: string;
}

export interface ListPaymentsFilters {
  status?: 'pending' | 'completed' | 'failed';
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}


