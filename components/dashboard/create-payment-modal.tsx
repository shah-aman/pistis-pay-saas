'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Copy, Check, Loader2, ExternalLink } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface CreatePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreatePaymentModal({ isOpen, onClose }: CreatePaymentModalProps) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [redirectUrl, setRedirectUrl] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentLink, setPaymentLink] = useState<{
    checkoutUrl: string;
    receiptUrl: string;
    id: string;
    invoiceNumber: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch('/api/payments/create-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include cookies in requests
        body: JSON.stringify({
          amount: parseFloat(amount),
          description: description || undefined,
          redirectUrl: redirectUrl || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment link');
      }

      setPaymentLink({
        checkoutUrl: data.payment.checkoutUrl,
        receiptUrl: data.payment.receiptUrl,
        id: data.payment.id,
        invoiceNumber: data.payment.invoiceNumber,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create payment link');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopy = async () => {
    if (paymentLink) {
      await navigator.clipboard.writeText(paymentLink.checkoutUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReset = () => {
    setAmount('');
    setDescription('');
    setRedirectUrl('');
    setPaymentLink(null);
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <CardTitle>
            {paymentLink ? 'Payment Link Created' : 'Create Payment Link'}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="pt-6">
          {paymentLink ? (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-block p-4 bg-green-50 rounded-full mb-4">
                  <Check className="h-12 w-12 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Payment Link Created!</h3>
                <p className="text-sm text-muted-foreground">
                  Share this link with your customer to collect payment
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Checkout Link</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      value={paymentLink.checkoutUrl}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      onClick={handleCopy}
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex justify-center py-4">
                  <div className="p-4 bg-white rounded-lg border">
                    <QRCodeSVG value={paymentLink.checkoutUrl} size={200} />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Invoice Number:</span>
                    <span className="font-mono font-medium">{paymentLink.invoiceNumber}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => window.open(paymentLink.checkoutUrl, '_blank')}
                    variant="outline"
                    className="flex-1"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Checkout
                  </Button>
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    className="flex-1"
                  >
                    Create Another
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="amount">Amount (USDC)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Minimum: 0.01 USDC
                </p>
              </div>

              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Payment for..."
                  maxLength={500}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="redirectUrl">Redirect URL (Optional)</Label>
                <Input
                  id="redirectUrl"
                  type="url"
                  value={redirectUrl}
                  onChange={(e) => setRedirectUrl(e.target.value)}
                  placeholder="https://yourwebsite.com/success"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Where to redirect after payment completion
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-800 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isCreating || !amount}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Payment Link'
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

