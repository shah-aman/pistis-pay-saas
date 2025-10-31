import { NextRequest, NextResponse } from 'next/server';
import { verifyTransaction, waitForTransactionConfirmation } from '@/lib/solana/payment';
import { prisma } from '@/lib/prisma';
import { generateInvoiceNumber } from '@/lib/billing/invoice';

/**
 * POST /api/payments/confirm
 * 
 * Confirms a payment transaction on-chain and updates payment status
 * 
 * Body: { paymentId: string, signature: string }
 * Returns: { success: boolean, payment: object }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentId, signature } = body;

    if (!paymentId || !signature) {
      return NextResponse.json(
        { error: 'Missing paymentId or signature' },
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

    // Check if payment is already completed
    if (payment.status === 'completed') {
      return NextResponse.json(
        {
          success: true,
          payment: {
            id: payment.spherePaymentId,
            status: payment.status,
            txSignature: payment.txSignature,
          },
          message: 'Payment already completed',
        },
        { status: 200 }
      );
    }

    // Check payment status
    if (payment.status !== 'pending') {
      return NextResponse.json(
        { error: `Payment is ${payment.status}` },
        { status: 400 }
      );
    }

    // Wait for transaction confirmation (with timeout)
    const confirmed = await waitForTransactionConfirmation(signature, 30);

    if (!confirmed) {
      return NextResponse.json(
        { error: 'Transaction confirmation timeout' },
        { status: 408 }
      );
    }

    // Calculate expected amount
    const subtotal = parseFloat(payment.amountUsdc.toString());
    const taxAmount = payment.taxAmount ? parseFloat(payment.taxAmount.toString()) : 0;
    const expectedAmount = subtotal + taxAmount;

    // Verify transaction on-chain
    const verification = await verifyTransaction(signature, expectedAmount);

    if (!verification.verified) {
      console.error('[Payment Confirmation] Verification failed:', verification.error);
      
      // Update payment status to failed
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'failed',
          txSignature: signature,
        },
      });

      return NextResponse.json(
        {
          error: 'Transaction verification failed',
          details: verification.error,
        },
        { status: 400 }
      );
    }

    // Generate invoice number if not exists
    const invoiceNumber = payment.invoiceNumber || generateInvoiceNumber();

    // Update payment status to completed
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'completed',
        txSignature: signature,
        customerWallet: verification.sender,
        completedAt: new Date(),
        platformWalletReceived: true,
        invoiceNumber,
      },
    });

    console.log('[Payment Confirmation] Payment completed:', {
      paymentId,
      signature,
      amount: verification.amount,
      sender: verification.sender,
    });

    return NextResponse.json({
      success: true,
      payment: {
        id: updatedPayment.spherePaymentId,
        status: updatedPayment.status,
        txSignature: updatedPayment.txSignature,
        amount: verification.amount,
        customerWallet: verification.sender,
        completedAt: updatedPayment.completedAt,
        invoiceNumber: updatedPayment.invoiceNumber,
      },
    });
  } catch (error) {
    console.error('[API] Payment confirmation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to confirm payment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

