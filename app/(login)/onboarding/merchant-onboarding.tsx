'use client';

import { useState, useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle2, Circle, ArrowLeft, Building2, FileCheck, UserCheck, CreditCard, Loader2, ExternalLink } from 'lucide-react';
import {
  createSphereCustomer,
  handleTosReturn,
  checkCustomerStatus,
  addBankAccount,
  skipBankAccount,
  completeOnboarding,
  skipOnboarding,
} from './actions';

const STEPS = [
  { id: 1, name: 'Business Information', icon: Building2 },
  { id: 2, name: 'Terms of Service', icon: FileCheck },
  { id: 3, name: 'KYC Verification', icon: UserCheck },
  { id: 4, name: 'Bank Account', icon: CreditCard },
];

type StepStatus = {
  completed: boolean;
  current: boolean;
};

export function MerchantOnboarding() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [sphereCustomerId, setSphereCustomerId] = useState<string | null>(null);
  
  // Form states
  const [businessFormData, setBusinessFormData] = useState({
    businessName: '',
    email: '',
    phoneNumber: '',
    addressLine1: '',
    addressLine2: '',
    addressCity: '',
    addressPostalCode: '',
    addressState: '',
    addressCountry: 'US',
  });

  const [bankFormData, setBankFormData] = useState({
    accountName: '',
    bankName: '',
    accountHolderName: '',
    currency: 'usd' as const,
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

  // Action states
  const [customerState, customerAction, customerPending] = useActionState(createSphereCustomer, { error: '' });
  const [bankState, bankAction, bankPending] = useActionState(addBankAccount, { error: '' });
  
  const [kycStatus, setKycStatus] = useState<string>('pending');
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [showSkipDialog, setShowSkipDialog] = useState(false);

  // Fetch user data to prefill email and resume onboarding
  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch('/api/user');
        if (response.ok) {
          const user = await response.json();
          if (user.email) {
            setEmail(user.email);
            setBusinessFormData(prev => ({ ...prev, email: user.email }));
            
            // Resume onboarding from last checkpoint
            if (user.merchant?.sphereCustomerId) {
              setSphereCustomerId(user.merchant.sphereCustomerId);
              
              // Determine which step to resume from
              if (!user.merchant.tosAcceptedAt) {
                // Customer created but TOS not accepted yet
                setCurrentStep(2);
              } else if (user.merchant.kycStatus !== 'verified') {
                // TOS accepted but KYC not verified
                setCurrentStep(3);
                setKycStatus(user.merchant.kycStatus || 'pending');
              } else if (!user.merchant.sphereBankAccountId) {
                // KYC verified but no bank account
                setCurrentStep(4);
              } else if (user.merchant.onboardingCompleted) {
                // Everything complete, redirect to dashboard
                router.push('/dashboard');
              } else {
                // Has bank account but onboarding not marked complete
                setCurrentStep(4);
              }
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchUser();
  }, [router]);

  // Handle customer creation success
  useEffect(() => {
    if (customerState?.tosUrl && customerState?.customerId) {
      setSphereCustomerId(customerState.customerId);
      
      // In mock mode, skip external redirect and go to step 2
      if (customerState.tosUrl.includes('mock-sphere.com')) {
        setCurrentStep(2);
      } else {
        // Redirect to SpherePay TOS page
        window.location.href = customerState.tosUrl;
      }
    }
  }, [customerState]);

  // Handle bank account success
  useEffect(() => {
    if (bankState?.success) {
      completeOnboarding();
    }
  }, [bankState]);

  const getStepStatus = (stepId: number): StepStatus => {
    return {
      completed: stepId < currentStep,
      current: stepId === currentStep,
    };
  };

  const handleTosComplete = async () => {
    setIsLoading(true);
    try {
      const result = await handleTosReturn();
      if (result.error) {
        alert(result.error);
      } else if (result.kycUrl) {
        // In mock mode, skip external redirect and go to step 3
        if (result.kycUrl.includes('mock-sphere.com')) {
          setCurrentStep(3);
        } else {
          // Redirect to SpherePay KYC page
          window.location.href = result.kycUrl;
        }
      }
    } catch (error) {
      console.error('TOS handling error:', error);
      alert('Failed to proceed to KYC. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckKycStatus = async () => {
    setCheckingStatus(true);
    try {
      const result = await checkCustomerStatus();
      if (result.error) {
        alert(result.error);
      } else if (result.kycStatus) {
        setKycStatus(result.kycStatus);
        if (result.kycStatus === 'verified') {
          setCurrentStep(4);
        }
      }
    } catch (error) {
      console.error('Status check error:', error);
      alert('Failed to check KYC status. Please try again.');
    } finally {
      setCheckingStatus(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <form
            action={async (fd: FormData) => {
              await customerAction(fd);
            }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>Business Details</CardTitle>
                <CardDescription>Tell us about your business</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="businessName">Business Name *</Label>
                  <Input
                    id="businessName"
                    name="businessName"
                    value={businessFormData.businessName}
                    onChange={(e) => setBusinessFormData({ ...businessFormData, businessName: e.target.value })}
                    placeholder="Acme Inc."
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={businessFormData.email}
                      onChange={(e) => setBusinessFormData({ ...businessFormData, email: e.target.value })}
                      placeholder="business@example.com"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phoneNumber">Phone Number *</Label>
                    <Input
                      id="phoneNumber"
                      name="phoneNumber"
                      type="tel"
                      value={businessFormData.phoneNumber}
                      onChange={(e) => setBusinessFormData({ ...businessFormData, phoneNumber: e.target.value })}
                      placeholder="+1 234 567 8900"
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Business Address</CardTitle>
                <CardDescription>Where is your business located?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="addressLine1">Address Line 1 *</Label>
                  <Input
                    id="addressLine1"
                    name="addressLine1"
                    value={businessFormData.addressLine1}
                    onChange={(e) => setBusinessFormData({ ...businessFormData, addressLine1: e.target.value })}
                    placeholder="123 Main Street"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="addressLine2">Address Line 2</Label>
                  <Input
                    id="addressLine2"
                    name="addressLine2"
                    value={businessFormData.addressLine2}
                    onChange={(e) => setBusinessFormData({ ...businessFormData, addressLine2: e.target.value })}
                    placeholder="Suite 100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="addressCity">City *</Label>
                    <Input
                      id="addressCity"
                      name="addressCity"
                      value={businessFormData.addressCity}
                      onChange={(e) => setBusinessFormData({ ...businessFormData, addressCity: e.target.value })}
                      placeholder="New York"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="addressState">State *</Label>
                    <Input
                      id="addressState"
                      name="addressState"
                      value={businessFormData.addressState}
                      onChange={(e) => setBusinessFormData({ ...businessFormData, addressState: e.target.value })}
                      placeholder="NY"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="addressPostalCode">Postal Code *</Label>
                    <Input
                      id="addressPostalCode"
                      name="addressPostalCode"
                      value={businessFormData.addressPostalCode}
                      onChange={(e) => setBusinessFormData({ ...businessFormData, addressPostalCode: e.target.value })}
                      placeholder="10001"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="addressCountry">Country *</Label>
                    <select
                      id="addressCountry"
                      name="addressCountry"
                      value={businessFormData.addressCountry}
                      onChange={(e) => setBusinessFormData({ ...businessFormData, addressCountry: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      required
                    >
                      <option value="US">United States</option>
                      <option value="GB">United Kingdom</option>
                      <option value="CA">Canada</option>
                      <option value="AU">Australia</option>
                      <option value="DE">Germany</option>
                      <option value="FR">France</option>
                      <option value="ES">Spain</option>
                      <option value="IT">Italy</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {customerState?.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                {customerState.error}
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowSkipDialog(true)}
                disabled={customerPending}
              >
                Skip for Now
              </Button>
              <Button
                type="submit"
                disabled={customerPending}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {customerPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Customer...
                  </>
                ) : (
                  <>
                    Continue to Terms of Service
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        );

      case 2:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Accept Terms of Service</CardTitle>
                <CardDescription>
                  You'll be redirected to SpherePay to review and accept the Terms of Service
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-center py-8">
                  {isLoading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                  ) : (
                    <FileCheck className="h-16 w-16 text-orange-500" />
                  )}
                </div>
                <p className="text-center text-gray-600">
                  After accepting the Terms of Service on SpherePay, you'll be redirected back to continue the onboarding process.
                </p>
              </CardContent>
            </Card>

            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowSkipDialog(true)}
                disabled={isLoading}
              >
                Skip for Now
              </Button>
              <Button
                type="button"
                onClick={handleTosComplete}
                disabled={isLoading}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    I've Accepted TOS - Continue
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>KYC/KYB Verification</CardTitle>
                <CardDescription>
                  Complete your identity verification with SpherePay
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-center py-8">
                  {checkingStatus ? (
                    <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                  ) : (
                    <UserCheck className="h-16 w-16 text-orange-500" />
                  )}
                </div>
                <p className="text-center text-gray-600">
                  You'll be redirected to SpherePay to complete the KYC/KYB verification process. 
                  This helps us verify your identity and comply with regulations.
                </p>
                {kycStatus && (
                  <div className="text-center">
                    <p className="text-sm font-medium">
                      Current Status: <span className="text-orange-600">{kycStatus}</span>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-between pt-4">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCheckKycStatus}
                  disabled={checkingStatus}
                >
                  {checkingStatus ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    'Check KYC Status'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowSkipDialog(true)}
                >
                  Skip for Now
                </Button>
              </div>
              <Button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="bg-orange-600 hover:bg-orange-700"
              >
                Continue to Bank Account
              </Button>
            </div>
          </div>
        );

      case 4:
        return (
          <form
            action={async (fd: FormData) => {
              await bankAction(fd);
            }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>Bank Account Details</CardTitle>
                <CardDescription>
                  Add a bank account to receive payments (optional - you can add this later)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="accountName">Account Name *</Label>
                    <Input
                      id="accountName"
                      name="accountName"
                      value={bankFormData.accountName}
                      onChange={(e) => setBankFormData({ ...bankFormData, accountName: e.target.value })}
                      placeholder="Business Checking"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bankName">Bank Name *</Label>
                    <Input
                      id="bankName"
                      name="bankName"
                      value={bankFormData.bankName}
                      onChange={(e) => setBankFormData({ ...bankFormData, bankName: e.target.value })}
                      placeholder="Chase Bank"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="accountHolderName">Account Holder Name *</Label>
                  <Input
                    id="accountHolderName"
                    name="accountHolderName"
                    value={bankFormData.accountHolderName}
                    onChange={(e) => setBankFormData({ ...bankFormData, accountHolderName: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="currency">Currency *</Label>
                    <select
                      id="currency"
                      name="currency"
                      value={bankFormData.currency}
                      onChange={(e) => setBankFormData({ ...bankFormData, currency: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                      value={bankFormData.accountNumber}
                      onChange={(e) => setBankFormData({ ...bankFormData, accountNumber: e.target.value })}
                      placeholder="123456789"
                    />
                  </div>
                  <div>
                    <Label htmlFor="routingNumber">Routing Number *</Label>
                    <Input
                      id="routingNumber"
                      name="routingNumber"
                      value={bankFormData.routingNumber}
                      onChange={(e) => setBankFormData({ ...bankFormData, routingNumber: e.target.value })}
                      placeholder="021000021"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="accountType">Account Type *</Label>
                  <select
                    id="accountType"
                    name="accountType"
                    value={bankFormData.accountType}
                    onChange={(e) => setBankFormData({ ...bankFormData, accountType: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="checking">Checking</option>
                    <option value="savings">Savings</option>
                  </select>
                </div>

                <div className="pt-4">
                  <h4 className="font-medium mb-3">Beneficiary Address</h4>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="beneficiaryAddressLine1">Address Line 1 *</Label>
                      <Input
                        id="beneficiaryAddressLine1"
                        name="beneficiaryAddressLine1"
                        value={bankFormData.beneficiaryAddressLine1}
                        onChange={(e) => setBankFormData({ ...bankFormData, beneficiaryAddressLine1: e.target.value })}
                        placeholder="123 Main Street"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="beneficiaryAddressCity">City *</Label>
                        <Input
                          id="beneficiaryAddressCity"
                          name="beneficiaryAddressCity"
                          value={bankFormData.beneficiaryAddressCity}
                          onChange={(e) => setBankFormData({ ...bankFormData, beneficiaryAddressCity: e.target.value })}
                          placeholder="New York"
                        />
                      </div>
                      <div>
                        <Label htmlFor="beneficiaryAddressState">State *</Label>
                        <Input
                          id="beneficiaryAddressState"
                          name="beneficiaryAddressState"
                          value={bankFormData.beneficiaryAddressState}
                          onChange={(e) => setBankFormData({ ...bankFormData, beneficiaryAddressState: e.target.value })}
                          placeholder="NY"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="beneficiaryAddressPostalCode">Postal Code *</Label>
                        <Input
                          id="beneficiaryAddressPostalCode"
                          name="beneficiaryAddressPostalCode"
                          value={bankFormData.beneficiaryAddressPostalCode}
                          onChange={(e) => setBankFormData({ ...bankFormData, beneficiaryAddressPostalCode: e.target.value })}
                          placeholder="10001"
                        />
                      </div>
                      <div>
                        <Label htmlFor="beneficiaryAddressCountry">Country *</Label>
                        <select
                          id="beneficiaryAddressCountry"
                          name="beneficiaryAddressCountry"
                          value={bankFormData.beneficiaryAddressCountry}
                          onChange={(e) => setBankFormData({ ...bankFormData, beneficiaryAddressCountry: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          <option value="US">United States</option>
                          <option value="GB">United Kingdom</option>
                          <option value="CA">Canada</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {bankState?.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                {bankState.error}
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={skipBankAccount}
                disabled={bankPending}
              >
                Skip for Now
              </Button>
              <Button
                type="submit"
                disabled={bankPending}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {bankPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding Bank Account...
                  </>
                ) : (
                  'Add Bank Account & Complete'
                )}
              </Button>
            </div>
          </form>
        );

      default:
        return null;
    }
  };

  if (isLoading && currentStep === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Panel - Progress Tracker */}
            <div className="lg:col-span-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome to Pistis Pay
              </h1>
              <p className="text-gray-600 mb-8">
                Complete your business onboarding
              </p>
              <div className="space-y-4">
                {STEPS.map((step) => {
                  const status = getStepStatus(step.id);
                  const Icon = step.icon;
                  return (
                    <div
                      key={step.id}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                        status.current ? 'bg-orange-50 border-2 border-orange-500' : ''
                      }`}
                    >
                      {status.completed ? (
                        <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0" />
                      ) : status.current ? (
                        <div className="h-6 w-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                          {step.id}
                        </div>
                      ) : (
                        <Circle className="h-6 w-6 text-gray-400 flex-shrink-0" />
                      )}
                      <Icon
                        className={`h-5 w-5 flex-shrink-0 ${
                          status.current
                            ? 'text-orange-600'
                            : status.completed
                            ? 'text-green-600'
                            : 'text-gray-400'
                        }`}
                      />
                      <span
                        className={`font-medium text-sm ${
                          status.current
                            ? 'text-orange-600'
                            : status.completed
                            ? 'text-green-600'
                            : 'text-gray-500'
                        }`}
                      >
                        {step.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Panel - Form Content */}
            <div className="lg:col-span-2">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {STEPS[currentStep - 1].name}
                </h2>
              </div>

              {renderStepContent()}
            </div>
          </div>
        </div>

        {/* Skip Onboarding Confirmation Dialog */}
        {showSkipDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-md w-full">
              <CardHeader>
                <CardTitle>Skip Onboarding?</CardTitle>
                <CardDescription>
                  You can complete the SpherePay onboarding process later from your dashboard.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  To start accepting payments, you'll need to complete:
                </p>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  <li>Business information</li>
                  <li>Terms of Service acceptance</li>
                  <li>KYC/KYB verification</li>
                  <li>Bank account (optional)</li>
                </ul>
                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowSkipDialog(false)}
                    className="flex-1"
                  >
                    Continue Onboarding
                  </Button>
                  <Button
                    onClick={skipOnboarding}
                    className="flex-1 bg-gray-600 hover:bg-gray-700"
                  >
                    Skip for Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
