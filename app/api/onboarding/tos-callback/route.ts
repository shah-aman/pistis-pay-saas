import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Handle TOS acceptance callback from SpherePay
 * This endpoint is called when a user completes TOS acceptance on SpherePay
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

    // Update TOS acceptance
    if (status === 'accepted') {
      await prisma.merchant.update({
        where: { id: merchant.id },
        data: {
          tosAcceptedAt: new Date(),
        },
      });
    }

    // Redirect back to onboarding page (step 3 - KYC)
    return NextResponse.redirect(
      new URL('/onboarding?step=3', request.url)
    );
  } catch (error) {
    console.error('TOS callback error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}


