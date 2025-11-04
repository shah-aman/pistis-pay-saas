import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSphereClient } from '@/lib/sphere/client';
import { getCurrentUser } from '@/app/(login)/actions';

/**
 * Check customer status from SpherePay
 * Called by the frontend to poll KYC status
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!user.merchant?.sphereCustomerId) {
      return NextResponse.json(
        { error: 'Customer ID not found' },
        { status: 404 }
      );
    }

    const sphereClient = createSphereClient();
    const customerStatus = await sphereClient.getCustomerStatus(
      user.merchant.sphereCustomerId
    );

    // Update local KYC status
    await prisma.merchant.update({
      where: { id: user.merchant.id },
      data: {
        kycStatus: customerStatus.kycStatus || 'pending',
      },
    });

    return NextResponse.json({
      kycStatus: customerStatus.kycStatus,
      tosAccepted: customerStatus.tosAccepted,
      status: customerStatus.status,
    });
  } catch (error: any) {
    console.error('Customer status check error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check customer status' },
      { status: 500 }
    );
  }
}


