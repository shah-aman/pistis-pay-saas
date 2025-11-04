import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateTax } from '@/lib/taxes/rates';
import { detectCountryFromHeaders } from '@/lib/geo/detect-country';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const { paymentId } = await params;

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID required' },
        { status: 400 }
      );
    }

    // Fetch payment from database
    const payment = await prisma.payment.findUnique({
      where: {
        id: paymentId,
      },
      include: {
        merchant: {
          select: {
            businessName: true,
            country: true,
            email: true,
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Only allow pending payments to be accessed via checkout
    if (payment.status !== 'pending') {
      return NextResponse.json(
        { 
          error: 'Payment already processed',
          status: payment.status 
        },
        { status: 400 }
      );
    }

    // Detect country from headers or use stored taxCountry
    let customerCountry = payment.taxCountry;
    if (!customerCountry) {
      customerCountry = detectCountryFromHeaders(request.headers) || 'US';
    }

    // Calculate tax
    const amount = Number(payment.amountUsdc);
    const taxCalculation = calculateTax(amount, customerCountry);

    // Return checkout details (without sensitive merchant data)
    return NextResponse.json({
      payment: {
        id: payment.id,
        amount: amount,
        description: payment.description || 'Payment',
        merchantName: payment.merchant?.businessName || 'Merchant',
        merchantCountry: payment.merchant?.country || '',
        status: payment.status,
        createdAt: payment.createdAt.toISOString(),
      },
      tax: {
        subtotal: taxCalculation.subtotal,
        taxAmount: taxCalculation.taxAmount,
        taxRate: taxCalculation.taxRate,
        taxName: taxCalculation.taxName,
        taxCountry: customerCountry,
        total: taxCalculation.total,
      },
    });
  } catch (error) {
    console.error('Get checkout details error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch checkout details' },
      { status: 500 }
    );
  }
}

// Update payment with customer's selected country for tax calculation
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const { paymentId } = await params;
    const body = await request.json();
    const { country } = body;

    if (!country || typeof country !== 'string' || country.length !== 2) {
      return NextResponse.json(
        { error: 'Valid country code required' },
        { status: 400 }
      );
    }

    // Calculate tax for the selected country
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      select: { amountUsdc: true, status: true },
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    if (payment.status !== 'pending') {
      return NextResponse.json(
        { error: 'Cannot update completed payment' },
        { status: 400 }
      );
    }

    const taxCalculation = calculateTax(Number(payment.amountUsdc), country);

    // Update payment with tax information
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        taxCountry: country.toUpperCase(),
        taxRate: taxCalculation.taxRate,
        taxAmount: taxCalculation.taxAmount,
      },
    });

    return NextResponse.json({
      tax: {
        subtotal: taxCalculation.subtotal,
        taxAmount: taxCalculation.taxAmount,
        taxRate: taxCalculation.taxRate,
        taxName: taxCalculation.taxName,
        taxCountry: country.toUpperCase(),
        total: taxCalculation.total,
      },
    });
  } catch (error) {
    console.error('Update checkout country error:', error);
    return NextResponse.json(
      { error: 'Failed to update country' },
      { status: 500 }
    );
  }
}


