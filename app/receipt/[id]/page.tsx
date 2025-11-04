'use client';

import { InvoiceDisplay } from '@/components/billing/invoice-display';
import useSWR from 'swr';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import * as React from 'react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface ReceiptData {
  receipt: {
    id: string;
    invoiceNumber: string;
    date: string;
    paidDate: string | null;
    status: string;
    amount: {
      usdc: number;
      formatted: string;
    };
    description: string;
    customer: {
      wallet: string;
      formattedWallet: string;
      country: string;
    };
    merchant: {
      name: string;
      email: string;
      country: string;
    };
    transaction: {
      signature: string | null;
      explorerUrl: string | null;
    };
    // Tax information
    tax?: {
      subtotal: number;
      taxAmount: number;
      taxRate: number;
      taxName: string;
      taxCountry: string;
      total: number;
    };
    metadata: Record<string, any>;
  };
}

function CustomerReceipt({ receipt }: { receipt: ReceiptData['receipt'] }) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(`/api/billing/download-pdf/${receipt.id}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `invoice-${receipt.invoiceNumber}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        console.error('Failed to download PDF');
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleEmailInvoice = () => {
    // TODO: Implement email modal
    console.log('Email invoice functionality coming soon');
  };

  return (
    <InvoiceDisplay
      invoice={receipt}
      variant="customer"
      onDownloadPDF={isDownloading ? undefined : handleDownloadPDF}
      onEmailInvoice={handleEmailInvoice}
      className="p-4 lg:p-8"
    />
  );
}

export default function PublicReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const paymentId = typeof resolvedParams.id === 'string' ? resolvedParams.id : resolvedParams.id[0];
  const { data, error, isLoading } = useSWR<ReceiptData>(
    paymentId ? `/api/payments/receipt?id=${paymentId}` : null,
    fetcher
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (error || !data?.receipt) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-4">Receipt not found</p>
          <p className="text-sm text-muted-foreground">The receipt you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return <CustomerReceipt receipt={data.receipt} />;
}

