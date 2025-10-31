import {
  CreatePaymentLinkParams,
  CreateWithdrawalParams,
  ListPaymentsFilters,
  SpherePayment,
  SpherePaymentLink,
  SphereWithdrawal,
} from '@/types/sphere';

// Base Sphere API configuration
// SpherePay API endpoints:
// Sandbox: https://api.sandbox.spherepay.co
// Production: https://api.spherepay.co
const SPHERE_API_BASE_URL = process.env.SPHERE_API_BASE_URL || 
  (process.env.NEXT_PUBLIC_SPHERE_ENV === 'production' 
    ? 'https://api.spherepay.co' 
    : 'https://api.sandbox.spherepay.co');

export class SphereClient {
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Sphere API key is required');
    }
    this.apiKey = apiKey;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${SPHERE_API_BASE_URL}${endpoint}`;
    
    console.log(`[Sphere API] ${options.method || 'GET'} ${url}`);
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }
        
        console.error(`[Sphere API] Error ${response.status}:`, errorData);
        throw new Error(
          errorData.message || errorData.error || `Sphere API error: ${response.status} ${response.statusText}`
        );
      }

      return response.json();
    } catch (error) {
      if (error instanceof Error && error.message.includes('fetch failed')) {
        console.error(`[Sphere API] Network error:`, error.message);
        throw new Error(
          `Failed to connect to Sphere API at ${url}. Please check your internet connection and verify the API endpoint is correct.`
        );
      }
      throw error;
    }
  }

  /**
   * Create a product (required before creating payment link)
   * Based on SpherePay docs: Payment Links require Product → Price → PaymentLink workflow
   * Trying both versioned and unversioned endpoints
   */
  async createProduct(params: {
    name: string;
    description?: string;
    metadata?: Record<string, any>;
  }): Promise<any> {
    const endpoints = ['/products', '/v1/products', '/v2/products'];
    
    for (const endpoint of endpoints) {
      try {
        return await this.request<any>(endpoint, {
          method: 'POST',
          body: JSON.stringify({
            name: params.name,
            description: params.description,
            metadata: params.metadata,
          }),
        });
      } catch (error: any) {
        if (endpoint === endpoints[endpoints.length - 1]) {
          throw error;
        }
        continue;
      }
    }
    throw new Error('Failed to create product');
  }

  /**
   * Create a price for a product (required before creating payment link)
   */
  async createPrice(params: {
    productId: string;
    amount: number;
    currency: string;
    metadata?: Record<string, any>;
  }): Promise<any> {
    const endpoints = ['/prices', '/v1/prices', '/v2/prices'];
    
    for (const endpoint of endpoints) {
      try {
        return await this.request<any>(endpoint, {
          method: 'POST',
          body: JSON.stringify({
            product: params.productId,
            amount: params.amount,
            currency: params.currency,
            metadata: params.metadata,
          }),
        });
      } catch (error: any) {
        if (endpoint === endpoints[endpoints.length - 1]) {
          throw error;
        }
        continue;
      }
    }
    throw new Error('Failed to create price');
  }

  /**
   * Create a payment link for USDC payment
   * Based on SpherePay documentation: Product → Price → PaymentLink workflow
   * Reference: https://spherepay.readme.io/reference/introduction
   */
  async createPaymentLink(params: CreatePaymentLinkParams): Promise<SpherePaymentLink> {
    try {
      // Step 1: Create a product
      const product = await this.createProduct({
        name: params.description || `Payment ${params.amount} USDC`,
        description: params.description,
        metadata: params.metadata,
      });

      // Step 2: Create a price for the product
      const price = await this.createPrice({
        productId: product.id,
        amount: params.amount,
        currency: 'usdc',
        metadata: params.metadata,
      });

      // Step 3: Create the payment link
      const paymentLinkEndpoints = ['/paymentLinks', '/v1/paymentLinks', '/v2/paymentLinks'];
      let paymentLink: any;
      
      for (const endpoint of paymentLinkEndpoints) {
        try {
          paymentLink = await this.request<any>(endpoint, {
            method: 'POST',
            body: JSON.stringify({
              product: product.id,
              price: price.id,
              redirectUrl: params.redirectUrl,
              metadata: params.metadata,
            }),
          });
          break;
        } catch (error: any) {
          if (endpoint === paymentLinkEndpoints[paymentLinkEndpoints.length - 1]) {
            throw error;
          }
          continue;
        }
      }

      // Map response to SpherePaymentLink format
      return {
        id: paymentLink.id,
        url: paymentLink.url || paymentLink.checkoutUrl || paymentLink.paymentUrl,
        amount: params.amount,
        currency: 'USDC',
        description: params.description,
        redirectUrl: params.redirectUrl,
        metadata: params.metadata,
        status: paymentLink.status || 'pending',
        createdAt: paymentLink.createdAt || new Date().toISOString(),
        expiresAt: paymentLink.expiresAt,
      };
    } catch (error: any) {
      console.error('[Sphere API] Payment link creation failed:', error);
      throw new Error(
        `Failed to create payment link: ${error.message}\n\n` +
        `Please verify:\n` +
        `1. Your Sphere API key is valid and has permissions\n` +
        `2. The API endpoint URL is correct (currently: ${SPHERE_API_BASE_URL})\n` +
        `3. Refer to SpherePay API docs: https://docs.spherepay.co/api-reference/`
      );
    }
  }

  /**
   * Get payment details by ID
   */
  async getPayment(paymentId: string): Promise<SpherePayment> {
    return this.request<SpherePayment>(`/v1/payments/${paymentId}`);
  }

  /**
   * Get payment link details
   */
  async getPaymentLink(paymentLinkId: string): Promise<SpherePaymentLink> {
    return this.request<SpherePaymentLink>(`/v1/payment-links/${paymentLinkId}`);
  }

  /**
   * List payments for a merchant
   */
  async listPayments(filters?: ListPaymentsFilters): Promise<{ data: SpherePayment[]; total: number }> {
    const params = new URLSearchParams();
    
    if (filters?.status) params.append('status', filters.status);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const queryString = params.toString();
    const endpoint = `/v1/payments${queryString ? `?${queryString}` : ''}`;

    return this.request<{ data: SpherePayment[]; total: number }>(endpoint);
  }

  /**
   * Create a withdrawal to bank account
   */
  async createWithdrawal(params: CreateWithdrawalParams): Promise<SphereWithdrawal> {
    return this.request<SphereWithdrawal>('/v1/withdrawals', {
      method: 'POST',
      body: JSON.stringify({
        amount: params.amount,
        sourceCurrency: 'USDC',
        bankAccountId: params.bankAccountId,
      }),
    });
  }

  /**
   * Get withdrawal details
   */
  async getWithdrawal(withdrawalId: string): Promise<SphereWithdrawal> {
    return this.request<SphereWithdrawal>(`/v1/withdrawals/${withdrawalId}`);
  }

  /**
   * List withdrawals for a merchant
   */
  async listWithdrawals(): Promise<{ data: SphereWithdrawal[]; total: number }> {
    return this.request<{ data: SphereWithdrawal[]; total: number }>('/v1/withdrawals');
  }
}

// Helper to create Sphere client with merchant's API key
export function createSphereClient(apiKey?: string): SphereClient {
  const key = apiKey || process.env.SPHERE_API_KEY;
  if (!key) {
    throw new Error('Sphere API key not provided');
  }
  return new SphereClient(key);
}


