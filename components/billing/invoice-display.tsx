'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { 
  Download, 
  Mail, 
  Printer, 
  ExternalLink, 
  CheckCircle, 
  Clock, 
  XCircle,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface InvoiceData {
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
  tax?: {
    subtotal: number;
    taxAmount: number;
    taxRate: number;
    taxName: string;
    taxCountry: string;
    total: number;
  };
  metadata?: Record<string, any>;
}

interface InvoiceDisplayProps {
  invoice: InvoiceData;
  variant?: 'customer' | 'merchant';
  onDownloadPDF?: () => void;
  onEmailInvoice?: () => void;
  onPrint?: () => void;
  className?: string;
}

function getStatusIcon(status: string) {
  switch (status.toLowerCase()) {
    case 'completed':
    case 'paid':
      return <CheckCircle className="h-5 w-5" />;
    case 'pending':
      return <Clock className="h-5 w-5" />;
    case 'failed':
      return <XCircle className="h-5 w-5" />;
    default:
      return <FileText className="h-5 w-5" />;
  }
}

function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case 'completed':
    case 'paid':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'pending':
      return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    case 'failed':
      return 'bg-red-50 text-red-700 border-red-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
}

export function InvoiceDisplay({
  invoice,
  variant = 'customer',
  onDownloadPDF,
  onEmailInvoice,
  onPrint,
  className,
}: InvoiceDisplayProps) {
  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  return (
    <div className={cn('max-w-5xl mx-auto', className)}>
      {/* Action Buttons - Hidden on print */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoice</h1>
          <p className="text-sm text-gray-600 mt-1">
            View and manage your invoice details
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onEmailInvoice && (
            <Button
              onClick={onEmailInvoice}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Mail className="h-4 w-4" />
              Email
            </Button>
          )}
          <Button
            onClick={handlePrint}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>
          {onDownloadPDF && (
            <Button
              onClick={onDownloadPDF}
              size="sm"
              className="gap-2 bg-orange-600 hover:bg-orange-700"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          )}
        </div>
      </div>

      {/* Invoice Card */}
      <Card className="border-2 print:border-0 print:shadow-none">
        {/* Header */}
        <CardHeader className="border-b bg-gradient-to-r from-orange-50 to-transparent print:bg-white">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-3xl font-bold text-gray-900">INVOICE</h2>
                <Badge 
                  variant="outline" 
                  className={cn(
                    "gap-1.5 font-semibold border",
                    getStatusColor(invoice.status)
                  )}
                >
                  {getStatusIcon(invoice.status)}
                  {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                </Badge>
              </div>
              <p className="text-lg font-mono text-gray-600">
                #{invoice.invoiceNumber}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Issued {format(new Date(invoice.date), 'MMMM dd, yyyy')}
              </p>
            </div>
            
            {/* Platform Branding */}
            <div className="text-right">
              <div className="text-2xl font-bold text-orange-600">SolaPay</div>
              <p className="text-xs text-gray-500 mt-1">Powered by Solana</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-8 space-y-8">
          {/* Party Information */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Merchant Info */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                From (Merchant)
              </h3>
              <div className="space-y-1">
                <p className="font-semibold text-lg text-gray-900">
                  {invoice.merchant.name}
                </p>
                <p className="text-sm text-gray-600">{invoice.merchant.email}</p>
                <p className="text-sm text-gray-600">{invoice.merchant.country}</p>
              </div>
            </div>

            {/* Customer Info */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                To (Customer)
              </h3>
              <div className="space-y-1">
                <p className="font-semibold text-lg text-gray-900">Customer</p>
                <p className="text-sm text-gray-600 font-mono">
                  {invoice.customer.formattedWallet}
                </p>
                {invoice.customer.country && (
                  <p className="text-sm text-gray-600">{invoice.customer.country}</p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Line Items */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Invoice Details
            </h3>
            <div className="rounded-lg border">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Description
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                      Quantity
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                      Unit Price
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {invoice.description || 'Payment'}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 text-right">1</td>
                    <td className="px-4 py-4 text-sm text-gray-600 text-right">
                      {invoice.tax ? `${invoice.tax.subtotal.toFixed(2)} USDC` : invoice.amount.formatted}
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold text-gray-900 text-right">
                      {invoice.tax ? `${invoice.tax.subtotal.toFixed(2)} USDC` : invoice.amount.formatted}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Amount Breakdown */}
          <div className="flex justify-end">
            <div className="w-full md:w-96 space-y-3">
              {invoice.tax ? (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium text-gray-900">
                      {invoice.tax.subtotal.toFixed(2)} USDC
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {invoice.tax.taxName} ({invoice.tax.taxRate}%) - {invoice.tax.taxCountry}:
                    </span>
                    <span className="font-medium text-gray-900">
                      {invoice.tax.taxAmount.toFixed(2)} USDC
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
                    <span className="text-2xl font-bold text-orange-600">
                      {invoice.amount.formatted}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
                  <span className="text-2xl font-bold text-orange-600">
                    {invoice.amount.formatted}
                  </span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Payment Information */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Payment Information
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Payment Method</p>
                <p className="text-sm font-medium text-gray-900">USDC on Solana</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Payment Status</p>
                <p className="text-sm font-medium text-gray-900">
                  {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Invoice Date</p>
                <p className="text-sm font-medium text-gray-900">
                  {format(new Date(invoice.date), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
              {invoice.paidDate && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Payment Date</p>
                  <p className="text-sm font-medium text-gray-900">
                    {format(new Date(invoice.paidDate), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
              )}
              {invoice.transaction.signature && (
                <div className="md:col-span-2">
                  <p className="text-xs text-gray-500 mb-1">Transaction Signature</p>
                  {invoice.transaction.explorerUrl ? (
                    <a
                      href={invoice.transaction.explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-orange-600 hover:text-orange-700 flex items-center gap-1 print:text-gray-900"
                    >
                      <span className="font-mono">
                        {invoice.transaction.signature.slice(0, 16)}...{invoice.transaction.signature.slice(-16)}
                      </span>
                      <ExternalLink className="h-3 w-3 print:hidden" />
                    </a>
                  ) : (
                    <p className="text-sm font-mono text-gray-900">
                      {invoice.transaction.signature.slice(0, 16)}...{invoice.transaction.signature.slice(-16)}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer Note */}
          <div className="pt-4 border-t">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-xs text-gray-600">
                Thank you for your payment! This invoice was generated automatically by SolaPay.
              </p>
              <p className="text-xs text-gray-500 mt-1">
                All transactions are processed on the Solana blockchain and are immutable.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Print-only Footer */}
      <div className="hidden print:block mt-8 text-center text-xs text-gray-500">
        <p>Powered by SolaPay • https://solapay.com</p>
        <p>This is a computer-generated invoice and requires no signature.</p>
      </div>
    </div>
  );
}



