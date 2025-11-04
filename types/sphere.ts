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

// Customer Onboarding Types (SpherePay v2)
export interface SphereCustomerAddress {
  line1: string;
  line2?: string;
  city: string;
  postalCode: string;
  state: string;
  country: string;
}

export interface CreateSphereCustomerParams {
  type: 'individual' | 'business';
  address: SphereCustomerAddress;
  email?: string;
  phoneNumber?: string;
}

export interface SphereCustomer {
  id: string;
  type: 'individual' | 'business';
  email?: string;
  phoneNumber?: string;
  address: SphereCustomerAddress;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SphereTosLink {
  url: string;
  expiresAt?: string;
}

export interface SphereKycLink {
  url: string;
  expiresAt?: string;
}

export interface SphereCustomerStatus {
  id: string;
  status: string;
  kycStatus?: 'pending' | 'in_progress' | 'verified' | 'rejected';
  tosAccepted?: boolean;
  tosAcceptedAt?: string;
  bankAccounts?: SphereBankAccount[];
}

export interface SphereBankAccountDetails {
  accountNumber: string;
  routingNumber: string;
  accountType: 'checking' | 'savings';
}

export interface CreateSphereBankAccountParams {
  accountName: string;
  bankName: string;
  accountHolderName: string;
  currency: 'usd' | 'eur' | 'brl' | 'cad' | 'cop' | 'idr' | 'inr' | 'mxn' | 'php' | 'sgd' | 'thb' | 'vnd' | 'gbp';
  accountDetails: SphereBankAccountDetails;
  beneficiaryAddress: SphereCustomerAddress;
}

export interface SphereBankAccount {
  id: string;
  status: 'pending' | 'active' | 'rejected';
  bankName: string;
  accountHolderName: string;
  accountName: string;
  customer: string;
  currency: string;
  accountDetails: {
    accountNumber: string; // masked
    routingNumber: string; // masked
    accountType: 'checking' | 'savings';
  };
  createdAt?: string;
}


