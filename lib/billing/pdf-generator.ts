import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

interface InvoicePDFData {
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
}

export async function generateInvoicePDF(invoiceData: InvoicePDFData): Promise<Blob> {
  // Create new PDF document
  const doc = new jsPDF();
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPos = 20;

  // Colors
  const primaryColor: [number, number, number] = [249, 115, 22]; // Orange-600
  const textColor: [number, number, number] = [31, 41, 55]; // Gray-800
  const lightGray: [number, number, number] = [156, 163, 175]; // Gray-400

  // Header - Company Name
  doc.setFontSize(24);
  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.text('SolaPay', pageWidth - margin, yPos, { align: 'right' });
  
  doc.setFontSize(9);
  doc.setTextColor(...lightGray);
  doc.text('Powered by Solana', pageWidth - margin, yPos + 6, { align: 'right' });

  // Invoice Title and Number
  doc.setFontSize(28);
  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', margin, yPos);
  
  yPos += 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...lightGray);
  doc.text(`#${invoiceData.invoiceNumber}`, margin, yPos);
  
  yPos += 6;
  doc.setFontSize(10);
  doc.text(`Issued ${format(new Date(invoiceData.date), 'MMMM dd, yyyy')}`, margin, yPos);

  // Status Badge
  yPos += 10;
  const statusText = invoiceData.status.charAt(0).toUpperCase() + invoiceData.status.slice(1);
  const statusColors = {
    completed: [16, 185, 129], // Green
    pending: [245, 158, 11], // Yellow
    failed: [239, 68, 68], // Red
  };
  const statusColor = statusColors[invoiceData.status.toLowerCase() as keyof typeof statusColors] || [107, 114, 128];
  
  doc.setFillColor(...statusColor);
  doc.roundedRect(margin, yPos, 30, 8, 2, 2, 'F');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(statusText, margin + 15, yPos + 5.5, { align: 'center' });

  // Separator Line
  yPos += 15;
  doc.setDrawColor(...lightGray);
  doc.line(margin, yPos, pageWidth - margin, yPos);

  // Party Information
  yPos += 12;
  doc.setFontSize(9);
  doc.setTextColor(...lightGray);
  doc.setFont('helvetica', 'bold');
  doc.text('FROM (MERCHANT)', margin, yPos);
  doc.text('TO (CUSTOMER)', pageWidth / 2 + 10, yPos);

  yPos += 6;
  doc.setFontSize(11);
  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'bold');
  doc.text(invoiceData.merchant.name, margin, yPos);
  doc.text('Customer', pageWidth / 2 + 10, yPos);

  yPos += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(invoiceData.merchant.email, margin, yPos);
  doc.setFont('courier', 'normal');
  doc.text(invoiceData.customer.formattedWallet, pageWidth / 2 + 10, yPos);

  yPos += 5;
  doc.setFont('helvetica', 'normal');
  doc.text(invoiceData.merchant.country, margin, yPos);
  if (invoiceData.customer.country) {
    doc.text(invoiceData.customer.country, pageWidth / 2 + 10, yPos);
  }

  // Invoice Details Table
  yPos += 12;
  doc.setFontSize(9);
  doc.setTextColor(...lightGray);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE DETAILS', margin, yPos);

  yPos += 5;
  const subtotal = invoiceData.tax ? invoiceData.tax.subtotal : invoiceData.amount.usdc;
  
  autoTable(doc, {
    startY: yPos,
    head: [['Description', 'Quantity', 'Unit Price', 'Amount']],
    body: [
      [
        invoiceData.description || 'Payment',
        '1',
        `${subtotal.toFixed(2)} USDC`,
        `${subtotal.toFixed(2)} USDC`,
      ],
    ],
    theme: 'plain',
    headStyles: {
      fillColor: [249, 250, 251], // Gray-50
      textColor: textColor,
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      textColor: textColor,
      fontSize: 9,
    },
    margin: { left: margin, right: margin },
    tableLineColor: lightGray,
    tableLineWidth: 0.1,
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Amount Breakdown
  const breakdownX = pageWidth - margin - 60;
  doc.setFontSize(9);
  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'normal');

  if (invoiceData.tax) {
    doc.text('Subtotal:', breakdownX, yPos, { align: 'right' });
    doc.text(`${invoiceData.tax.subtotal.toFixed(2)} USDC`, pageWidth - margin, yPos, { align: 'right' });
    
    yPos += 6;
    doc.text(`${invoiceData.tax.taxName} (${invoiceData.tax.taxRate}%):`, breakdownX, yPos, { align: 'right' });
    doc.text(`${invoiceData.tax.taxAmount.toFixed(2)} USDC`, pageWidth - margin, yPos, { align: 'right' });
    
    yPos += 2;
    doc.setDrawColor(...lightGray);
    doc.line(breakdownX, yPos, pageWidth - margin, yPos);
    yPos += 6;
  }

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Total Amount:', breakdownX, yPos, { align: 'right' });
  doc.setFontSize(14);
  doc.setTextColor(...primaryColor);
  doc.text(invoiceData.amount.formatted, pageWidth - margin, yPos, { align: 'right' });

  // Payment Information
  yPos += 15;
  doc.setFontSize(9);
  doc.setTextColor(...lightGray);
  doc.setFont('helvetica', 'bold');
  doc.text('PAYMENT INFORMATION', margin, yPos);

  yPos += 6;
  doc.setFontSize(9);
  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'normal');

  const paymentInfo = [
    ['Payment Method:', 'USDC on Solana'],
    ['Payment Status:', invoiceData.status.charAt(0).toUpperCase() + invoiceData.status.slice(1)],
    ['Invoice Date:', format(new Date(invoiceData.date), 'MMM dd, yyyy HH:mm')],
  ];

  if (invoiceData.paidDate) {
    paymentInfo.push(['Payment Date:', format(new Date(invoiceData.paidDate), 'MMM dd, yyyy HH:mm')]);
  }

  paymentInfo.forEach(([label, value]) => {
    doc.text(label, margin, yPos);
    doc.text(value, margin + 50, yPos);
    yPos += 5;
  });

  // Transaction Signature
  if (invoiceData.transaction.signature) {
    yPos += 2;
    doc.text('Transaction Signature:', margin, yPos);
    yPos += 5;
    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    const sig = invoiceData.transaction.signature;
    doc.text(`${sig.slice(0, 32)}`, margin, yPos);
    yPos += 4;
    doc.text(`${sig.slice(32)}`, margin, yPos);
  }

  // Footer
  yPos = doc.internal.pageSize.getHeight() - 30;
  doc.setDrawColor(...lightGray);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  
  yPos += 8;
  doc.setFontSize(8);
  doc.setTextColor(...lightGray);
  doc.setFont('helvetica', 'normal');
  doc.text('Thank you for your payment! This invoice was generated automatically by SolaPay.', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 5;
  doc.text('All transactions are processed on the Solana blockchain and are immutable.', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 8;
  doc.setFontSize(7);
  doc.text('Powered by SolaPay • https://solapay.com', pageWidth / 2, yPos, { align: 'center' });
  doc.text('This is a computer-generated invoice and requires no signature.', pageWidth / 2, yPos + 4, { align: 'center' });

  // Return PDF as blob
  return doc.output('blob');
}

/**
 * Generate invoice PDF filename
 */
export function generateInvoiceFilename(invoiceNumber: string): string {
  return `invoice-${invoiceNumber}.pdf`;
}



