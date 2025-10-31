import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/(login)/actions';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user || !user.merchant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';

    // Get payments for this merchant filtered by settlement status
    const payments = await prisma.payment.findMany({
      where: {
        merchantId: user.merchant.id,
        platformWalletReceived: true, // Only payments received by platform
        settlementStatus: status,
      },
      orderBy: {
        completedAt: 'desc',
      },
      select: {
        id: true,
        amountUsdc: true,
        taxAmount: true,
        description: true,
        completedAt: true,
        settlementStatus: true,
        settledAt: true,
        invoiceNumber: true,
      },
    });

    // Calculate totals
    const totalPending = payments
      .filter((p) => p.settlementStatus === 'pending')
      .reduce((sum, p) => sum + Number(p.amountUsdc), 0);

    const totalSettled = await prisma.payment.aggregate({
      where: {
        merchantId: user.merchant.id,
        settlementStatus: 'settled',
      },
      _sum: {
        amountUsdc: true,
      },
    });

    return NextResponse.json({
      settlements: payments.map((payment) => ({
        id: payment.id,
        invoiceNumber: payment.invoiceNumber,
        amount: Number(payment.amountUsdc),
        taxAmount: payment.taxAmount ? Number(payment.taxAmount) : 0,
        description: payment.description,
        completedAt: payment.completedAt,
        settlementStatus: payment.settlementStatus,
        settledAt: payment.settledAt,
      })),
      summary: {
        pendingAmount: totalPending,
        settledAmount: Number(totalSettled._sum.amountUsdc || 0),
        pendingCount: payments.filter((p) => p.settlementStatus === 'pending').length,
        settledCount: payments.filter((p) => p.settlementStatus === 'settled').length,
      },
    });
  } catch (error) {
    console.error('Get settlements error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settlements' },
      { status: 500 }
    );
  }
}

// Mark payments as settled (admin/platform operation)
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user || !user.merchant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { paymentIds } = body;

    if (!Array.isArray(paymentIds) || paymentIds.length === 0) {
      return NextResponse.json(
        { error: 'Payment IDs required' },
        { status: 400 }
      );
    }

    // Update settlement status
    const result = await prisma.payment.updateMany({
      where: {
        id: { in: paymentIds },
        merchantId: user.merchant.id,
        platformWalletReceived: true,
        settlementStatus: 'pending',
      },
      data: {
        settlementStatus: 'settled',
        settledAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      updatedCount: result.count,
    });
  } catch (error) {
    console.error('Update settlement error:', error);
    return NextResponse.json(
      { error: 'Failed to update settlement' },
      { status: 500 }
    );
  }
}

