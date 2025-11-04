'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BankAccountManager } from '@/components/dashboard/bank-account-manager';
import useSWR from 'swr';
import { Loader2 } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Merchant {
  id: string;
  email: string;
  businessName: string;
  country: string;
  businessType: string;
  walletAddress: string | null;
  sphereCustomerId?: string | null;
  sphereBankAccountId?: string | null;
  kycStatus?: string | null;
}

export default function SettingsPage() {
  const { data, error, isLoading, mutate } = useSWR<{ merchant: Merchant }>('/api/merchant', fetcher);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    businessName: '',
    country: '',
    businessType: '',
    walletAddress: '',
  });

  // Update form data when merchant data loads
  useEffect(() => {
    if (data?.merchant) {
      setFormData({
        businessName: data.merchant.businessName || '',
        country: data.merchant.country || '',
        businessType: data.merchant.businessType || '',
        walletAddress: data.merchant.walletAddress || '',
      });
    }
  }, [data?.merchant]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/merchant', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update settings');
      }

      setMessage({ type: 'success', text: 'Settings updated successfully!' });
      mutate(); // Refresh data
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to update settings' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <section className="flex-1">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="flex-1">
        <div className="text-center py-12">
          <p className="text-red-500">Failed to load settings</p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex-1">
      <h1 className="text-lg lg:text-2xl font-medium mb-6">Settings</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={data?.merchant?.email || ''}
                disabled
                className="bg-gray-50"
              />
              <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
            </div>

            <div>
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                required
                placeholder="Your business name"
              />
            </div>

            <div>
              <Label htmlFor="country">Country</Label>
              <select
                id="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500"
              >
                <option value="">Select country</option>
                <option value="US">United States</option>
                <option value="CA">Canada</option>
                <option value="GB">United Kingdom</option>
                <option value="AU">Australia</option>
                {/* Add more countries as needed */}
              </select>
            </div>

            <div>
              <Label htmlFor="businessType">Business Type</Label>
              <select
                id="businessType"
                value={formData.businessType}
                onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500"
              >
                <option value="">Select business type</option>
                <option value="individual">Individual</option>
                <option value="sole_proprietorship">Sole Proprietorship</option>
                <option value="llc">LLC</option>
                <option value="corporation">Corporation</option>
                <option value="partnership">Partnership</option>
              </select>
            </div>

            <div>
              <Label htmlFor="walletAddress">Solana Wallet Address (Optional)</Label>
              <Input
                id="walletAddress"
                value={formData.walletAddress}
                onChange={(e) => setFormData({ ...formData, walletAddress: e.target.value })}
                placeholder="Enter your Solana wallet address"
              />
              <p className="text-xs text-muted-foreground mt-1">Your Solana wallet for receiving payments</p>
            </div>

            {message && (
              <div className={`p-3 rounded-md ${
                message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
                {message.text}
              </div>
            )}

            <Button
              type="submit"
              disabled={isSaving}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Bank Account Management */}
      <BankAccountManager
        sphereCustomerId={data?.merchant?.sphereCustomerId}
        existingBankAccountId={data?.merchant?.sphereBankAccountId}
      />
    </section>
  );
}

