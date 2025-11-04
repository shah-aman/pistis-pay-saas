import { getCurrentUser } from '@/app/(login)/actions';
import { redirect } from 'next/navigation';

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/sign-in');
  }

  // If user has already completed onboarding, redirect to dashboard
  if (user.merchant && !user.merchant.businessName.includes("'s Business")) {
    redirect('/dashboard');
  }

  return <>{children}</>;
}



