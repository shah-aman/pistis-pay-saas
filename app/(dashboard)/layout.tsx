import { getCurrentUser } from '@/app/(login)/actions';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/dashboard/sidebar';
import { MobileNav } from '@/components/dashboard/mobile-nav';
import { TopNav } from '@/components/dashboard/top-nav';
import { OnboardingBanner } from '@/components/dashboard/onboarding-banner';
import { prisma } from '@/lib/prisma';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/sign-in');
  }

  // Fetch full merchant data including onboarding status
  const merchant = await prisma.merchant.findUnique({
    where: { id: user.merchant.id },
    select: {
      onboardingCompleted: true,
      onboardingSkippedAt: true,
      sphereCustomerId: true,
      tosAcceptedAt: true,
      kycStatus: true,
      sphereBankAccountId: true,
    },
  });

  // Don't force redirect for onboarding - let them access dashboard with banner
  // Only redirect if they have the default business name AND haven't started/skipped onboarding
  if (user.merchant && 
      user.merchant.businessName.includes("'s Business") && 
      !merchant?.sphereCustomerId && 
      !merchant?.onboardingSkippedAt) {
    redirect('/onboarding');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <TopNav user={user} />
        
        {/* Show onboarding banner if not completed */}
        {merchant && !merchant.onboardingCompleted && (
          <OnboardingBanner
            onboardingCompleted={merchant.onboardingCompleted}
            sphereCustomerId={merchant.sphereCustomerId}
            tosAcceptedAt={merchant.tosAcceptedAt}
            kycStatus={merchant.kycStatus}
            sphereBankAccountId={merchant.sphereBankAccountId}
          />
        )}
        
        <main className="flex-1 pb-20 lg:pb-0">
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
