'use client';

import { formatTaxAmount } from '@/lib/taxes/rates';

interface PaymentBreakdownProps {
  subtotal: number;
  taxAmount: number;
  taxRate: number;
  taxName: string;
  taxCountry: string;
  total: number;
}

export function PaymentBreakdown({
  subtotal,
  taxAmount,
  taxRate,
  taxName,
  taxCountry,
  total,
}: PaymentBreakdownProps) {
  return (
    <div className="bg-gray-50 rounded-lg p-6 space-y-3">
      <h3 className="font-semibold text-lg mb-4">Payment Summary</h3>
      
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Subtotal</span>
        <span className="font-medium">{formatTaxAmount(subtotal)} USDC</span>
      </div>
      
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">
          {taxName} ({taxRate}%) - {taxCountry}
        </span>
        <span className="font-medium">{formatTaxAmount(taxAmount)} USDC</span>
      </div>
      
      <div className="border-t border-gray-200 pt-3 mt-3">
        <div className="flex justify-between">
          <span className="font-semibold text-lg">Total</span>
          <span className="font-bold text-lg text-orange-600">
            {formatTaxAmount(total)} USDC
          </span>
        </div>
      </div>
      
      {taxRate === 0 && (
        <p className="text-xs text-gray-500 mt-2">
          No tax applied for this country
        </p>
      )}
    </div>
  );
}



