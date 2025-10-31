// Stub queries file for backward compatibility
// These functions are not used with Supabase auth, but kept for type compatibility

import { getCurrentUser } from '@/app/(login)/actions';
import { ActivityType } from './schema';

export async function getUser() {
  const user = await getCurrentUser();
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.merchant?.businessName || null,
    role: 'owner', // Legacy field, not used with merchant model
  };
}

export async function getTeamForUser() {
  // Team functionality not implemented in merchant model
  // Return null for now
  return null;
}

export async function getActivityLogs() {
  // Activity logs not implemented yet
  // Return empty array for now
  return [];
}
