import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import { createTransferTransaction } from '@/lib/solana/payment';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/payments/transaction
 * 
 * Generates an unsigned Solana transaction for a payment
 * Used by wallets to sign and submit the payment transaction
 * 
 * Body: { paymentId: string, account: string }
 * Returns: { transaction: string (base64), message: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentId, account } = body;

    if (!paymentId || !account) {
      return NextResponse.json(
        { error: 'Missing paymentId or account' },
        { status: 400 }
      );
    }

    // Validate account is a valid Solana public key
    let payerPublicKey: PublicKey;
    try {
      payerPublicKey = new PublicKey(account);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid account public key' },
        { status: 400 }
      );
    }

    // Fetch payment from database
    const payment = await prisma.payment.findUnique({
      where: { spherePaymentId: paymentId },
      include: {
        merchant: true,
      },
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Check payment status
    if (payment.status !== 'pending') {
      return NextResponse.json(
        { error: `Payment already ${payment.status}` },
        { status: 400 }
      );
    }

    // Calculate total amount including tax
    const subtotal = parseFloat(payment.amountUsdc.toString());
    const taxAmount = payment.taxAmount ? parseFloat(payment.taxAmount.toString()) : 0;
    const totalAmount = subtotal + taxAmount;

    // Create transaction
    const transaction = await createTransferTransaction(
      payerPublicKey,
      totalAmount,
      paymentId
    );

    // Serialize transaction to base64
    const serializedTransaction = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });

    const base64Transaction = serializedTransaction.toString('base64');

    return NextResponse.json({
      transaction: base64Transaction,
      message: `Pay ${totalAmount} USDC to ${payment.merchant.businessName}`,
    });
  } catch (error) {
    console.error('[API] Transaction generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate transaction',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/payments/transaction?paymentId=xxx&account=xxx
 * 
 * Alternative endpoint for transaction generation (GET method)
 * Some wallets prefer GET requests for transaction requests
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const paymentId = searchParams.get('paymentId');
    const account = searchParams.get('account');

    if (!paymentId || !account) {
      return NextResponse.json(
        { error: 'Missing paymentId or account' },
        { status: 400 }
      );
    }

    // Use the same logic as POST
    const postRequest = new Request(request.url, {
      method: 'POST',
      headers: request.headers,
      body: JSON.stringify({ paymentId, account }),
    });

    return POST(postRequest as NextRequest);
  } catch (error) {
    console.error('[API] Transaction generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate transaction',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

