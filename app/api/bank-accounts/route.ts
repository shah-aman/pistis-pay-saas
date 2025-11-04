import { NextRequest, NextResponse } from 'next/server';
import { createSphereClient } from '@/lib/sphere/client';
import { getCurrentUser } from '@/app/(login)/actions';

/**
 * Get bank accounts for the current merchant
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

    const sphereCustomerId = user.merchant?.sphereCustomerId;
    
    if (!sphereCustomerId) {
      return NextResponse.json(
        { bankAccounts: [] },
        { status: 200 }
      );
    }

    try {
      const sphereClient = createSphereClient();
      const bankAccounts = await sphereClient.getBankAccounts(sphereCustomerId);

      return NextResponse.json({
        bankAccounts,
      });
    } catch (sphereError: any) {
      console.error('Failed to fetch bank accounts from SpherePay:', sphereError);
      // Return empty array if SpherePay call fails
      return NextResponse.json({
        bankAccounts: [],
        error: sphereError.message,
      });
    }
  } catch (error: any) {
    console.error('Bank accounts fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch bank accounts' },
      { status: 500 }
    );
  }
}


