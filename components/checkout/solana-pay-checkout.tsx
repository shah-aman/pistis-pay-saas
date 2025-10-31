'use client';

import { useEffect, useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Transaction } from '@solana/web3.js';
import { QRCodeSVG } from 'qrcode.react';
import { createPaymentUrl } from '@/lib/solana/payment';
import type { SolanaPaymentResult } from '@/types/checkout';

interface SolanaPayCheckoutProps {
  paymentId: string;
  amount: number;
  merchantName: string;
  description?: string;
  onSuccess: (result: SolanaPaymentResult) => void;
  onError?: (error: Error) => void;
}

type PaymentStatus = 'idle' | 'pending' | 'confirming' | 'confirmed' | 'error';

export function SolanaPayCheckout({
  paymentId,
  amount,
  merchantName,
  description,
  onSuccess,
  onError,
}: SolanaPayCheckoutProps) {
  const { publicKey, sendTransaction, connected } = useWallet();
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string>('');
  const [signature, setSignature] = useState<string | null>(null);

  // Generate payment URL and QR code
  useEffect(() => {
    try {
      const url = createPaymentUrl(
        amount,
        paymentId,
        merchantName,
        description || `Payment to ${merchantName}`
      );
      setPaymentUrl(url.toString());
    } catch (err) {
      console.error('[SolanaPay] Failed to generate payment URL:', err);
      setError('Failed to generate payment URL');
      onError?.(err instanceof Error ? err : new Error('Failed to generate payment URL'));
    }
  }, [amount, paymentId, merchantName, description, onError]);

  // Handle wallet payment
  const handleWalletPay = useCallback(async () => {
    if (!publicKey || !connected) {
      setError('Please connect your wallet first');
      return;
    }

    setStatus('pending');
    setError(null);

    try {
      // Request transaction from server
      const txResponse = await fetch('/api/payments/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId,
          account: publicKey.toBase58(),
        }),
      });

      if (!txResponse.ok) {
        const errorData = await txResponse.json();
        throw new Error(errorData.error || 'Failed to create transaction');
      }

      const { transaction: base64Transaction } = await txResponse.json();

      // Deserialize transaction
      const transactionBuffer = Buffer.from(base64Transaction, 'base64');
      const transaction = Transaction.from(transactionBuffer);

      // Send transaction via wallet
      const sig = await sendTransaction(transaction, {
        skipPreflight: false,
        maxRetries: 3,
      });

      setSignature(sig);
      setStatus('confirming');

      // Confirm payment with server
      const confirmResponse = await fetch('/api/payments/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId,
          signature: sig,
        }),
      });

      if (!confirmResponse.ok) {
        const errorData = await confirmResponse.json();
        throw new Error(errorData.error || 'Payment confirmation failed');
      }

      const confirmData = await confirmResponse.json();

      if (confirmData.success) {
        setStatus('confirmed');
        onSuccess({
          signature: sig,
          customerWallet: publicKey.toBase58(),
          amount: confirmData.payment.amount,
          verified: true,
          timestamp: new Date().toISOString(),
        });
      } else {
        throw new Error('Payment verification failed');
      }
    } catch (err) {
      console.error('[SolanaPay] Payment error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Payment failed';
      setError(errorMessage);
      setStatus('error');
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    }
  }, [publicKey, connected, paymentId, sendTransaction, onSuccess, onError]);

  // Loading state
  if (!paymentUrl) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mb-4"></div>
        <p className="text-sm text-gray-600">Initializing payment...</p>
      </div>
    );
  }

  // Error state
  if (error && status === 'error') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
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
        <h3 className="text-lg font-semibold text-red-900 mb-2">Payment Error</h3>
        <p className="text-sm text-red-700 mb-4">{error}</p>
        <button
          onClick={() => {
            setStatus('idle');
            setError(null);
          }}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Confirming state
  if (status === 'confirming') {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mb-4"></div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirming Payment</h3>
        <p className="text-sm text-gray-600 mb-4">
          Please wait while we confirm your transaction on-chain...
        </p>
        {signature && (
          <p className="text-xs text-gray-500 font-mono">
            Signature: {signature.slice(0, 8)}...{signature.slice(-8)}
          </p>
        )}
      </div>
    );
  }

  // Confirmed state
  if (status === 'confirmed') {
    return (
      <div className="flex flex-col items-center justify-center py-12">
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
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Confirmed!</h3>
        <p className="text-sm text-gray-600">Your payment has been successfully processed.</p>
      </div>
    );
  }

  // Main payment UI
  return (
    <div className="space-y-6">
      {/* Payment Amount */}
      <div className="text-center pb-6 border-b">
        <p className="text-sm text-gray-600 mb-1">Amount to Pay</p>
        <p className="text-3xl font-bold text-orange-600">{amount.toFixed(2)} USDC</p>
      </div>

      {/* QR Code Section */}
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Scan with Mobile Wallet</h3>
          <div className="inline-block p-4 bg-white rounded-lg border-2 border-gray-200">
            <QRCodeSVG value={paymentUrl} size={256} level="H" includeMargin={true} />
          </div>
          <p className="text-sm text-gray-600 mt-4">
            Scan this QR code with any Solana wallet app to pay
          </p>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or pay with browser wallet</span>
          </div>
        </div>

        {/* Wallet Connect Section */}
        <div className="space-y-4">
          <div className="flex justify-center">
            <WalletMultiButton className="!bg-orange-600 hover:!bg-orange-700" />
          </div>

          {connected && publicKey && (
            <button
              onClick={handleWalletPay}
              disabled={status === 'pending'}
              className="w-full py-3 px-4 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === 'pending' ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                `Pay ${amount.toFixed(2)} USDC`
              )}
            </button>
          )}

          {!connected && (
            <p className="text-sm text-center text-gray-600">
              Connect your wallet above to pay with browser extension
            </p>
          )}
        </div>
      </div>

      {/* Payment Info */}
      <div className="bg-gray-50 rounded-lg p-4 text-xs text-gray-600 space-y-2">
        <p className="flex items-start">
          <svg
            className="h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>
            Payment is processed on Solana blockchain. Transaction fees apply and are paid separately.
          </span>
        </p>
        <p className="flex items-start">
          <svg
            className="h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <span>All transactions are secure and cannot be reversed once confirmed.</span>
        </p>
      </div>
    </div>
  );
}

