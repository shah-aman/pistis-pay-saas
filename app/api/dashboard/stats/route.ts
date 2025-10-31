import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/(login)/actions';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const user = await getCurrentUser();
    
    if (!user || !user.merchant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const merchantId = user.merchant.id;

    // Get date ranges
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Today's revenue
    const todayRevenue = await prisma.payment.aggregate({
      where: {
        merchantId,
        status: 'completed',
        completedAt: {
          gte: todayStart,
        },
      },
      _sum: {
        amountUsdc: true,
      },
    });

    // This month's revenue
    const monthRevenue = await prisma.payment.aggregate({
      where: {
        merchantId,
        status: 'completed',
        completedAt: {
          gte: monthStart,
        },
      },
      _sum: {
        amountUsdc: true,
      },
    });

    // All-time revenue
    const allTimeRevenue = await prisma.payment.aggregate({
      where: {
        merchantId,
        status: 'completed',
      },
      _sum: {
        amountUsdc: true,
      },
    });

    // Transaction count
    const transactionCount = await prisma.payment.count({
      where: {
        merchantId,
        status: 'completed',
      },
    });

    // Last 30 days revenue by day
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyRevenue = await prisma.$queryRaw`
      SELECT 
        DATE(completed_at) as date,
        SUM(amount_usdc) as revenue
      FROM payments
      WHERE merchant_id = ${merchantId}
        AND status = 'completed'
        AND completed_at >= ${thirtyDaysAgo}
      GROUP BY DATE(completed_at)
      ORDER BY date ASC
    `;

    // Recent transactions
    const recentTransactions = await prisma.payment.findMany({
      where: {
        merchantId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    return NextResponse.json({
      stats: {
        todayRevenue: todayRevenue._sum.amountUsdc || 0,
        monthRevenue: monthRevenue._sum.amountUsdc || 0,
        allTimeRevenue: allTimeRevenue._sum.amountUsdc || 0,
        transactionCount,
      },
      dailyRevenue,
      recentTransactions,
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}


