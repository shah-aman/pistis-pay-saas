import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/(login)/actions';
import { prisma } from '@/lib/prisma';
import { getTaxInfo } from '@/lib/taxes/rates';
import { createSphereClient } from '@/lib/sphere/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('id');

    if (!paymentId) {
      return NextResponse.json({ error: 'Payment ID required' }, { status: 400 });
    }

    // Try to get current user (optional for public receipts)
    const user = await getCurrentUser();
    
    // Fetch payment from database
    const payment = await prisma.payment.findUnique({
      where: {
        id: paymentId,
      },
      include: {
        merchant: {
          select: {
            businessName: true,
            email: true,
            country: true,
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

        // Merchant info is already included in payment query
        const merchant = payment.merchant;

        // Calculate tax information if available
        let taxInfo = null;
        if (payment.taxAmount && payment.taxRate && payment.taxCountry) {
          const taxData = getTaxInfo(payment.taxCountry);
          const subtotal = Number(payment.amountUsdc);
          const taxAmount = Number(payment.taxAmount);
          const total = subtotal + taxAmount;
          
          taxInfo = {
            subtotal,
            taxAmount,
            taxRate: Number(payment.taxRate),
            taxName: taxData?.name || 'Tax',
            taxCountry: payment.taxCountry,
            total,
          };
        }

        // Format receipt data
        const receipt = {
          id: payment.id,
          invoiceNumber: payment.invoiceNumber || `INV-${payment.id.slice(0, 8).toUpperCase()}`,
          date: payment.createdAt,
          paidDate: payment.completedAt,
          status: payment.status,
          amount: {
            usdc: taxInfo ? taxInfo.total : Number(payment.amountUsdc),
            formatted: new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(taxInfo ? taxInfo.total : Number(payment.amountUsdc)),
          },
          description: payment.description || 'Payment',
          customer: {
            wallet: payment.customerWallet || 'N/A',
            formattedWallet: payment.customerWallet
              ? `${payment.customerWallet.slice(0, 4)}...${payment.customerWallet.slice(-4)}`
              : 'N/A',
            country: payment.taxCountry || '',
          },
          merchant: {
            name: merchant?.businessName || 'Merchant',
            email: merchant?.email || '',
            country: merchant?.country || '',
          },
          transaction: {
            signature: payment.txSignature,
            explorerUrl: payment.txSignature
              ? `https://solscan.io/tx/${payment.txSignature}`
              : null,
          },
          tax: taxInfo,
          metadata: payment.metadata || {},
        };

    return NextResponse.json({ receipt });
  } catch (error) {
    console.error('Get payment receipt error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment receipt' },
      { status: 500 }
    );
  }
}

