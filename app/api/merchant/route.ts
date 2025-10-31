import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/(login)/actions';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateMerchantSchema = z.object({
  businessName: z.string().min(1).max(255),
  country: z.string().length(2),
  businessType: z.string().min(1).max(50),
  walletAddress: z.string().optional(),
});

export async function GET() {
  try {
    const user = await getCurrentUser();
    
    if (!user || !user.merchant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const merchant = await prisma.merchant.findUnique({
      where: { id: user.merchant.id },
      select: {
        id: true,
        email: true,
        businessName: true,
        country: true,
        businessType: true,
        walletAddress: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ merchant });
  } catch (error) {
    console.error('Get merchant error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch merchant data' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user || !user.merchant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = updateMerchantSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const merchant = await prisma.merchant.update({
      where: { id: user.merchant.id },
      data: {
        businessName: parsed.data.businessName,
        country: parsed.data.country,
        businessType: parsed.data.businessType,
        walletAddress: parsed.data.walletAddress || null,
      },
    });

    return NextResponse.json({ merchant });
  } catch (error) {
    console.error('Update merchant error:', error);
    return NextResponse.json(
      { error: 'Failed to update merchant' },
      { status: 500 }
    );
  }
}

