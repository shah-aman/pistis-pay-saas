// Stub payment actions file
// TODO: Implement subscription management with Loop Crypto

'use server';

import { redirect } from 'next/navigation';

export async function customerPortalAction() {
  // TODO: Implement Loop Crypto customer portal redirect
  // For now, redirect to settings page
  redirect('/dashboard/settings');
}

