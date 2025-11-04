import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateInvoicePDF, generateInvoiceFilename } from '@/lib/billing/pdf-generator';
import { getTaxInfo } from '@/lib/taxes/rates';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const paymentId = params.id;

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
            email: true,
            country: true,
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

    // Prepare invoice data
    const merchant = payment.merchant;
    
    let taxInfo = null;
    if (payment.taxAmount && payment.taxRate && payment.taxCountry) {
      const taxData = getTaxInfo(payment.taxCountry);
      const subtotal = Number(payment.amountUsdc);
      const taxAmount = Number(payment.taxAmount);
      const total = subtotal + taxAmount;
      
      taxInfo = {
        subtotal,
        taxAmount,
        taxRate: Number(payment.taxRate),
        taxName: taxData?.name || 'Tax',
        taxCountry: payment.taxCountry,
        total,
      };
    }

    const invoiceData = {
      invoiceNumber: payment.invoiceNumber || `INV-${payment.id.slice(0, 8).toUpperCase()}`,
      date: payment.createdAt.toISOString(),
      paidDate: payment.completedAt?.toISOString() || null,
      status: payment.status,
      amount: {
        usdc: taxInfo ? taxInfo.total : Number(payment.amountUsdc),
        formatted: new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(taxInfo ? taxInfo.total : Number(payment.amountUsdc)),
      },
      description: payment.description || 'Payment',
      customer: {
        wallet: payment.customerWallet || 'N/A',
        formattedWallet: payment.customerWallet
          ? `${payment.customerWallet.slice(0, 4)}...${payment.customerWallet.slice(-4)}`
          : 'N/A',
        country: payment.taxCountry || '',
      },
      merchant: {
        name: merchant?.businessName || 'Merchant',
        email: merchant?.email || '',
        country: merchant?.country || '',
      },
      transaction: {
        signature: payment.txSignature,
        explorerUrl: payment.txSignature
          ? `https://solscan.io/tx/${payment.txSignature}`
          : null,
      },
      tax: taxInfo,
    };

    // Generate PDF
    const pdfBlob = await generateInvoicePDF(invoiceData);
    
    // Convert blob to buffer
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Return PDF as download
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${generateInvoiceFilename(invoiceData.invoiceNumber)}"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('[API] PDF generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate PDF',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}



