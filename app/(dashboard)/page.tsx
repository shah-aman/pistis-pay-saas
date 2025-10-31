import { redirect } from 'next/navigation';

// Dashboard redirects to the actual dashboard page
export default function DashboardPage() {
  redirect('/dashboard/dashboard');
}
