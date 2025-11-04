'use client';

import { useState, useActionState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, Plus, Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { addBankAccount } from '@/app/(login)/onboarding/actions';

interface BankAccount {
  id: string;
  status: 'pending' | 'active' | 'rejected';
  bankName: string;
  accountName: string;
  accountHolderName: string;
  currency: string;
  accountDetails: {
    accountNumber: string;
    routingNumber: string;
    accountType: string;
  };
}

interface BankAccountManagerProps {
  sphereCustomerId?: string | null;
  existingBankAccountId?: string | null;
}

export function BankAccountManager({ sphereCustomerId, existingBankAccountId }: BankAccountManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);

  const [formData, setFormData] = useState({
    accountName: '',
    bankName: '',
    accountHolderName: '',
    currency: 'usd',
    accountNumber: '',
    routingNumber: '',
    accountType: 'checking' as 'checking' | 'savings',
    beneficiaryAddressLine1: '',
    beneficiaryAddressLine2: '',
    beneficiaryAddressCity: '',
    beneficiaryAddressPostalCode: '',
    beneficiaryAddressState: '',
    beneficiaryAddressCountry: 'US',
  });

  const [state, action, pending] = useActionState(addBankAccount, { error: '' });

  // Load bank accounts
  const loadBankAccounts = async () => {
    if (!sphereCustomerId) return;
    
    setIsLoadingAccounts(true);
    try {
      const response = await fetch(`/api/bank-accounts?customerId=${sphereCustomerId}`);
      if (response.ok) {
        const data = await response.json();
        setBankAccounts(data.bankAccounts || []);
      }
    } catch (error) {
      console.error('Failed to load bank accounts:', error);
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'pending':
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'rejected':
        return 'Rejected';
      case 'pending':
      default:
        return 'Pending Verification';
    }
  };

  if (!sphereCustomerId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Bank Accounts
          </CardTitle>
          <CardDescription>
            Complete your customer onboarding to add bank accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            You need to complete the SpherePay customer registration before you can add bank accounts.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Bank Accounts
        </CardTitle>
        <CardDescription>
          Manage your bank accounts for receiving payments
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing Bank Accounts */}
        {existingBankAccountId && (
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CreditCard className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="font-medium">Primary Bank Account</p>
                  <p className="text-sm text-muted-foreground">ID: {existingBankAccountId}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon('active')}
                <span className="text-sm font-medium text-green-600">Active</span>
              </div>
            </div>
          </div>
        )}

        {/* Bank Accounts List (if loaded) */}
        {bankAccounts.length > 0 && (
          <div className="space-y-3">
            {bankAccounts.map((account) => (
              <div key={account.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-8 w-8 text-orange-500" />
                    <div>
                      <p className="font-medium">{account.accountName}</p>
                      <p className="text-sm text-muted-foreground">
                        {account.bankName} • {account.accountDetails.accountNumber}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {account.accountHolderName} • {account.currency.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(account.status)}
                    <span className="text-sm font-medium">
                      {getStatusText(account.status)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Bank Account Button */}
        {!showAddForm && (
          <Button
            variant="outline"
            onClick={() => setShowAddForm(true)}
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Bank Account
          </Button>
        )}

        {/* Add Bank Account Form */}
        {showAddForm && (
          <form
            action={async (fd: FormData) => {
              const result = await action(fd);
              if (result?.success) {
                setShowAddForm(false);
                setFormData({
                  accountName: '',
                  bankName: '',
                  accountHolderName: '',
                  currency: 'usd',
                  accountNumber: '',
                  routingNumber: '',
                  accountType: 'checking',
                  beneficiaryAddressLine1: '',
                  beneficiaryAddressLine2: '',
                  beneficiaryAddressCity: '',
                  beneficiaryAddressPostalCode: '',
                  beneficiaryAddressState: '',
                  beneficiaryAddressCountry: 'US',
                });
                // Reload bank accounts
                loadBankAccounts();
              }
            }}
            className="space-y-4 border rounded-lg p-4 bg-gray-50"
          >
            <h3 className="font-medium">Add New Bank Account</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="accountName">Account Name *</Label>
                <Input
                  id="accountName"
                  name="accountName"
                  value={formData.accountName}
                  onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                  placeholder="Business Checking"
                  required
                />
              </div>
              <div>
                <Label htmlFor="bankName">Bank Name *</Label>
                <Input
                  id="bankName"
                  name="bankName"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  placeholder="Chase Bank"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="accountHolderName">Account Holder Name *</Label>
              <Input
                id="accountHolderName"
                name="accountHolderName"
                value={formData.accountHolderName}
                onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })}
                placeholder="John Doe"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="currency">Currency *</Label>
                <select
                  id="currency"
                  name="currency"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                >
                  <option value="usd">USD</option>
                  <option value="eur">EUR</option>
                  <option value="gbp">GBP</option>
                  <option value="cad">CAD</option>
                </select>
              </div>
              <div>
                <Label htmlFor="accountNumber">Account Number *</Label>
                <Input
                  id="accountNumber"
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  placeholder="123456789"
                  required
                />
              </div>
              <div>
                <Label htmlFor="routingNumber">Routing Number *</Label>
                <Input
                  id="routingNumber"
                  name="routingNumber"
                  value={formData.routingNumber}
                  onChange={(e) => setFormData({ ...formData, routingNumber: e.target.value })}
                  placeholder="021000021"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="accountType">Account Type *</Label>
              <select
                id="accountType"
                name="accountType"
                value={formData.accountType}
                onChange={(e) => setFormData({ ...formData, accountType: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              >
                <option value="checking">Checking</option>
                <option value="savings">Savings</option>
              </select>
            </div>

            {/* Beneficiary Address */}
            <div className="pt-2">
              <h4 className="font-medium text-sm mb-3">Beneficiary Address</h4>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="beneficiaryAddressLine1">Address Line 1 *</Label>
                  <Input
                    id="beneficiaryAddressLine1"
                    name="beneficiaryAddressLine1"
                    value={formData.beneficiaryAddressLine1}
                    onChange={(e) => setFormData({ ...formData, beneficiaryAddressLine1: e.target.value })}
                    placeholder="123 Main Street"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="beneficiaryAddressCity">City *</Label>
                    <Input
                      id="beneficiaryAddressCity"
                      name="beneficiaryAddressCity"
                      value={formData.beneficiaryAddressCity}
                      onChange={(e) => setFormData({ ...formData, beneficiaryAddressCity: e.target.value })}
                      placeholder="New York"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="beneficiaryAddressState">State *</Label>
                    <Input
                      id="beneficiaryAddressState"
                      name="beneficiaryAddressState"
                      value={formData.beneficiaryAddressState}
                      onChange={(e) => setFormData({ ...formData, beneficiaryAddressState: e.target.value })}
                      placeholder="NY"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="beneficiaryAddressPostalCode">Postal Code *</Label>
                    <Input
                      id="beneficiaryAddressPostalCode"
                      name="beneficiaryAddressPostalCode"
                      value={formData.beneficiaryAddressPostalCode}
                      onChange={(e) => setFormData({ ...formData, beneficiaryAddressPostalCode: e.target.value })}
                      placeholder="10001"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="beneficiaryAddressCountry">Country *</Label>
                    <select
                      id="beneficiaryAddressCountry"
                      name="beneficiaryAddressCountry"
                      value={formData.beneficiaryAddressCountry}
                      onChange={(e) => setFormData({ ...formData, beneficiaryAddressCountry: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      required
                    >
                      <option value="US">United States</option>
                      <option value="GB">United Kingdom</option>
                      <option value="CA">Canada</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {state?.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                {state.error}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddForm(false)}
                disabled={pending}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={pending}
                className="flex-1 bg-orange-600 hover:bg-orange-700"
              >
                {pending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Bank Account'
                )}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}


