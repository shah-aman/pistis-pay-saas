'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { SolanaPayCheckout } from '@/components/checkout/solana-pay-checkout';
import { CountrySelector } from '@/components/checkout/country-selector';
import { PaymentBreakdown } from '@/components/checkout/payment-breakdown';
import type { SolanaPaymentResult } from '@/types/checkout';

const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then((res) => res.json());

interface CheckoutData {
  payment: {
    id: string;
    amount: number;
    description: string;
    merchantName: string;
    merchantCountry: string;
    status: string;
    createdAt: string;
  };
  tax: {
    subtotal: number;
    taxAmount: number;
    taxRate: number;
    taxName: string;
    taxCountry: string;
    total: number;
  };
}

export default function CheckoutPage({ params }: { params: { paymentId: string } }) {
  const router = useRouter();
  const { paymentId } = params;
  
  const { data, error, isLoading, mutate } = useSWR<CheckoutData>(
    `/api/checkout/${paymentId}`,
    fetcher
  );

  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [isUpdatingCountry, setIsUpdatingCountry] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);

  // Set initial country when data loads
  useEffect(() => {
    if (data?.tax.taxCountry && !selectedCountry) {
      setSelectedCountry(data.tax.taxCountry);
    }
  }, [data, selectedCountry]);

  const handleCountryChange = async (countryCode: string) => {
    setSelectedCountry(countryCode);
    setIsUpdatingCountry(true);

    try {
      const response = await fetch(`/api/checkout/${paymentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ country: countryCode }),
      });

      if (response.ok) {
        // Refresh checkout data with new tax calculation
        await mutate();
      }
    } catch (err) {
      console.error('Failed to update country:', err);
    } finally {
      setIsUpdatingCountry(false);
    }
  };

  const handlePaymentSuccess = async (result: SolanaPaymentResult) => {
    console.log('Payment successful:', result);
    setPaymentCompleted(true);
    
    // Redirect to receipt page after a short delay
    setTimeout(() => {
      router.push(`/receipt/${paymentId}`);
    }, 2000);
  };

  const handlePaymentError = (error: Error) => {
    console.error('Payment error:', error);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    const errorMessage = error 
      ? (typeof error === 'object' && 'error' in error ? (error as any).error : String(error))
      : 'The payment link you're looking for doesn't exist or has expired.';
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <svg
            className="mx-auto h-12 w-12 text-red-400 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Not Found</h1>
          <p className="text-gray-600 mb-6">
            {errorMessage}
          </p>
        </div>
      </div>
    );
  }

  if (data.payment.status !== 'pending') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <svg
            className="mx-auto h-12 w-12 text-yellow-400 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Already Processed</h1>
          <p className="text-gray-600 mb-6">
            This payment has already been {data.payment.status}.
          </p>
          <button
            onClick={() => router.push(`/receipt/${paymentId}`)}
            className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
          >
            View Receipt
          </button>
        </div>
      </div>
    );
  }

  if (paymentCompleted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg
              className="h-6 w-6 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-gray-600 mb-6">
            Your payment has been processed. Redirecting to receipt...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Secure Checkout</h1>
          <p className="text-gray-600">
            Powered by SolaPay • Pay with USDC on Solana
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Column - Payment Details */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Payment Details</h2>
              
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-600">Merchant</span>
                  <p className="font-medium">{data.payment.merchantName}</p>
                </div>
                
                <div>
                  <span className="text-sm text-gray-600">Description</span>
                  <p className="font-medium">{data.payment.description}</p>
                </div>
                
                <div>
                  <span className="text-sm text-gray-600">Payment ID</span>
                  <p className="font-mono text-xs text-gray-500">
                    {data.payment.id.slice(0, 8)}...{data.payment.id.slice(-8)}
                  </p>
                </div>
              </div>
            </div>

            {/* Country Selector */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <CountrySelector
                selectedCountry={selectedCountry}
                onCountryChange={handleCountryChange}
                disabled={isUpdatingCountry}
              />
            </div>

            {/* Payment Breakdown */}
            <PaymentBreakdown
              subtotal={data.tax.subtotal}
              taxAmount={data.tax.taxAmount}
              taxRate={data.tax.taxRate}
              taxName={data.tax.taxName}
              taxCountry={data.tax.taxCountry}
              total={data.tax.total}
            />
          </div>

          {/* Right Column - Payment Widget */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-6">Complete Payment</h2>
            
            <SolanaPayCheckout
              paymentId={paymentId}
              amount={data.tax.total}
              merchantName={data.payment.merchantName}
              description={data.payment.description}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>🔒 Secure payment powered by Sphere Labs on Solana</p>
          <p className="mt-1">Transactions are processed on-chain and cannot be reversed</p>
        </div>
      </div>
    </div>
  );
}

