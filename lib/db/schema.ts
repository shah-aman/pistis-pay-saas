// Type definitions for backward compatibility
// These types are used by legacy components that haven't been migrated yet

export type User = {
  id: string;
  email: string;
  name?: string | null;
  role?: string;
};

export type TeamDataWithMembers = {
  id: string;
  planName?: string;
  subscriptionStatus?: string;
  teamMembers?: Array<{
    id: string;
    role: string;
    user: User;
  }>;
};

export enum ActivityType {
  SIGN_UP = 'SIGN_UP',
  SIGN_IN = 'SIGN_IN',
  SIGN_OUT = 'SIGN_OUT',
  UPDATE_PASSWORD = 'UPDATE_PASSWORD',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT',
  UPDATE_ACCOUNT = 'UPDATE_ACCOUNT',
  CREATE_TEAM = 'CREATE_TEAM',
  REMOVE_TEAM_MEMBER = 'REMOVE_TEAM_MEMBER',
  INVITE_TEAM_MEMBER = 'INVITE_TEAM_MEMBER',
  ACCEPT_INVITATION = 'ACCEPT_INVITATION',
}

// Legacy type for session.ts (not used with Supabase auth)
export type NewUser = {
  id?: number;
  email: string;
  name?: string;
};
