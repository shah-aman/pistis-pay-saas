import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/app/(login)/actions';
import { prisma } from '@/lib/prisma';
import { generateInvoiceNumber } from '@/lib/billing/invoice';

const createPaymentLinkSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  description: z.string().max(500).optional(),
  redirectUrl: z.string().url().optional().or(z.literal('')),
  metadata: z.record(z.any()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user || !user.merchant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createPaymentLinkSchema.parse(body);

    // Generate invoice number and unique payment ID for Sphere
    const invoiceNumber = generateInvoiceNumber();
    const spherePaymentId = `sp_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Store payment in database with checkout URL (MOR model)
    const payment = await prisma.payment.create({
      data: {
        merchantId: user.merchant.id,
        spherePaymentId: spherePaymentId,
        amountUsdc: validatedData.amount,
        description: validatedData.description,
        redirectUrl: validatedData.redirectUrl,
        metadata: validatedData.metadata,
        status: 'pending',
        invoiceNumber,
        platformWalletReceived: false,
        settlementStatus: 'pending',
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const checkoutUrl = `${baseUrl}/checkout/${payment.id}`;
    const receiptUrl = `${baseUrl}/receipt/${payment.id}`;

    return NextResponse.json({
      payment: {
        id: payment.id,
        checkoutUrl,
        receiptUrl,
        invoiceNumber,
        amount: payment.amountUsdc,
        description: payment.description,
        status: payment.status,
        createdAt: payment.createdAt,
      },
    });
  } catch (error) {
    console.error('Create payment link error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create payment link' },
      { status: 500 }
    );
  }
}


