'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import useSWR from 'swr';
import { format } from 'date-fns';
import { Download, ExternalLink, CheckCircle, Clock, XCircle, Loader2 } from 'lucide-react';
import { useParams } from 'next/navigation';

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
    metadata: Record<string, any>;
  };
}

function getStatusIcon(status: string) {
  switch (status.toLowerCase()) {
    case 'completed':
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    case 'pending':
      return <Clock className="h-5 w-5 text-yellow-600" />;
    case 'failed':
      return <XCircle className="h-5 w-5 text-red-600" />;
    default:
      return <Clock className="h-5 w-5 text-gray-600" />;
  }
}

function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case 'completed':
      return 'text-green-600 bg-green-50';
    case 'pending':
      return 'text-yellow-600 bg-yellow-50';
    case 'failed':
      return 'text-red-600 bg-red-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
}

function PaymentReceipt({ receipt }: { receipt: ReceiptData['receipt'] }) {
  const handleDownload = () => {
    // Create a printable receipt HTML
    const receiptHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${receipt.invoiceNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
            .header { border-bottom: 2px solid #f97316; padding-bottom: 20px; margin-bottom: 30px; }
            .merchant-info { margin-bottom: 30px; }
            .amount { font-size: 32px; font-weight: bold; color: #f97316; margin: 20px 0; }
            .details { margin: 30px 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Payment Receipt</h1>
            <p>Invoice #${receipt.invoiceNumber}</p>
          </div>
          <div class="merchant-info">
            <h2>${receipt.merchant.name}</h2>
            <p>${receipt.merchant.email}</p>
          </div>
          <div class="amount">${receipt.amount.formatted}</div>
          <div class="details">
            <div class="detail-row">
              <span>Description:</span>
              <span>${receipt.description}</span>
            </div>
            <div class="detail-row">
              <span>Date:</span>
              <span>${format(new Date(receipt.date), 'MMM dd, yyyy HH:mm')}</span>
            </div>
            ${receipt.paidDate ? `
            <div class="detail-row">
              <span>Paid Date:</span>
              <span>${format(new Date(receipt.paidDate), 'MMM dd, yyyy HH:mm')}</span>
            </div>
            ` : ''}
            <div class="detail-row">
              <span>Status:</span>
              <span>${receipt.status}</span>
            </div>
            <div class="detail-row">
              <span>Customer Wallet:</span>
              <span>${receipt.customer.formattedWallet}</span>
            </div>
            ${receipt.transaction.signature ? `
            <div class="detail-row">
              <span>Transaction:</span>
              <span>${receipt.transaction.signature.slice(0, 8)}...${receipt.transaction.signature.slice(-8)}</span>
            </div>
            ` : ''}
          </div>
          <div class="footer">
            <p>Thank you for your payment!</p>
            <p>Powered by SolaPay</p>
          </div>
        </body>
      </html>
    `;

    const blob = new Blob([receiptHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `receipt-${receipt.invoiceNumber}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Payment Receipt</h1>
        <Button onClick={handleDownload} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Download Receipt
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Invoice #{receipt.invoiceNumber}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {format(new Date(receipt.date), 'MMMM dd, yyyy')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(receipt.status)}
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(receipt.status)}`}>
                {receipt.status.charAt(0).toUpperCase() + receipt.status.slice(1)}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Merchant Info */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">From</h3>
              <p className="font-medium text-lg">{receipt.merchant.name}</p>
              <p className="text-sm text-muted-foreground">{receipt.merchant.email}</p>
              <p className="text-sm text-muted-foreground">{receipt.merchant.country}</p>
            </div>

            {/* Customer Info */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">To</h3>
              <p className="font-medium text-lg">Customer</p>
              <p className="text-sm text-muted-foreground font-mono">
                {receipt.customer.formattedWallet}
              </p>
            </div>
          </div>

          {/* Amount */}
          <div className="mt-8 pt-8 border-t">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-4xl font-bold text-orange-600 mt-2">
                  {receipt.amount.formatted}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {receipt.amount.usdc} USDC
                </p>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="mt-8 pt-8 border-t">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Payment Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Description:</span>
                <span className="text-sm font-medium">{receipt.description}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Date:</span>
                <span className="text-sm font-medium">
                  {format(new Date(receipt.date), 'MMM dd, yyyy HH:mm')}
                </span>
              </div>
              {receipt.paidDate && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Paid Date:</span>
                  <span className="text-sm font-medium">
                    {format(new Date(receipt.paidDate), 'MMM dd, yyyy HH:mm')}
                  </span>
                </div>
              )}
              {receipt.transaction.signature && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Transaction:</span>
                  {receipt.transaction.explorerUrl ? (
                    <a
                      href={receipt.transaction.explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-orange-600 hover:text-orange-700 flex items-center gap-1"
                    >
                      View on Solscan
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="text-sm font-mono">
                      {receipt.transaction.signature.slice(0, 8)}...{receipt.transaction.signature.slice(-8)}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ReceiptPage() {
  const params = useParams();
  const paymentId = params?.id as string;

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
          <p className="text-red-500 mb-4">Failed to load receipt</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return <PaymentReceipt receipt={data.receipt} />;
}

