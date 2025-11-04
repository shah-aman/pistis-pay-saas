import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Handle KYC/KYB completion callback from SpherePay
 * This endpoint is called when a user completes KYC verification on SpherePay
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get('customerId');
    const status = searchParams.get('status');

    if (!customerId) {
      return NextResponse.json(
        { error: 'Missing customerId parameter' },
        { status: 400 }
      );
    }

    // Find merchant by sphereCustomerId
    const merchant = await prisma.merchant.findFirst({
      where: { sphereCustomerId: customerId },
    });

    if (!merchant) {
      return NextResponse.json(
        { error: 'Merchant not found' },
        { status: 404 }
      );
    }

    // Update KYC status based on callback
    let kycStatus = 'pending';
    if (status === 'verified' || status === 'approved') {
      kycStatus = 'verified';
    } else if (status === 'rejected' || status === 'failed') {
      kycStatus = 'rejected';
    } else if (status === 'in_progress' || status === 'pending') {
      kycStatus = 'in_progress';
    }

    await prisma.merchant.update({
      where: { id: merchant.id },
      data: {
        kycStatus,
      },
    });

    // Redirect back to onboarding page (step 4 - Bank Account)
    const redirectStep = kycStatus === 'verified' ? '4' : '3';
    return NextResponse.redirect(
      new URL(`/onboarding?step=${redirectStep}&kycStatus=${kycStatus}`, request.url)
    );
  } catch (error) {
    console.error('KYC callback error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}


