'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OnboardingBannerProps {
  onboardingCompleted: boolean;
  sphereCustomerId?: string | null;
  tosAcceptedAt?: Date | null;
  kycStatus?: string | null;
  sphereBankAccountId?: string | null;
}

export function OnboardingBanner({
  onboardingCompleted,
  sphereCustomerId,
  tosAcceptedAt,
  kycStatus,
  sphereBankAccountId,
}: OnboardingBannerProps) {
  const router = useRouter();
  const [isDismissed, setIsDismissed] = useState(false);

  // Check localStorage for dismissal on mount
  useEffect(() => {
    const dismissed = localStorage.getItem('onboarding-banner-dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);

  // Don't show if onboarding is completed
  if (onboardingCompleted) {
    return null;
  }

  // Don't show if dismissed in current session
  if (isDismissed) {
    return null;
  }

  // Determine current onboarding progress
  const getCurrentStep = () => {
    if (!sphereCustomerId) {
      return { step: 1, message: 'Start by providing your business information' };
    }
    if (!tosAcceptedAt) {
      return { step: 2, message: 'Accept the Terms of Service to continue' };
    }
    if (kycStatus !== 'verified') {
      return { step: 3, message: 'Complete KYC/KYB verification' };
    }
    if (!sphereBankAccountId) {
      return { step: 4, message: 'Add a bank account to receive payments' };
    }
    return { step: 4, message: 'Complete your onboarding' };
  };

  const { step, message } = getCurrentStep();

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('onboarding-banner-dismissed', 'true');
  };

  const handleCompleteNow = () => {
    router.push('/onboarding');
  };

  return (
    <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <AlertCircle className="h-6 w-6 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg mb-1">
                Complete SpherePay Onboarding
              </h3>
              <p className="text-sm text-white/90 mb-2">
                Finish setting up your account to start accepting payments.
              </p>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">Current: Step {step}/4</span>
                <span className="text-white/80">•</span>
                <span className="text-white/90">{message}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleCompleteNow}
              variant="secondary"
              className="bg-white text-orange-600 hover:bg-gray-100 font-medium"
            >
              Complete Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <button
              onClick={handleDismiss}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
              aria-label="Dismiss banner"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


