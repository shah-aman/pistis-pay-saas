'use server';

import { z } from 'zod';
import { createSupabaseAdmin } from '@/lib/supabase/client';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

const signInSchema = z.object({
  email: z.string().email().min(3).max(255),
  password: z.string().min(8).max(100)
});

export async function signIn(prevState: any, formData: FormData) {
  try {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const parsed = signInSchema.safeParse({ email, password });
    if (!parsed.success) {
      return {
        error: 'Invalid email or password format.',
        email,
        password
      };
    }

    // Use regular Supabase client for sign-in (creates proper session)
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return {
        error: 'Supabase configuration error. Please contact support.',
        email,
        password
      };
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error || !data.user || !data.session) {
      return {
        error: 'Invalid email or password. Please try again.',
        email,
        password
      };
    }

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set('supabase-auth-token', data.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/', // Ensure cookie is available for all routes
    });

    redirect('/dashboard');
  } catch (error) {
    // Re-throw redirect errors (Next.js uses these for navigation)
    if (error && typeof error === 'object' && 'digest' in error && typeof error.digest === 'string' && error.digest.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    console.error('Sign in error:', error);
    return {
      error: 'An error occurred. Please try again.',
      email: '',
      password: ''
    };
  }
}

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function signUp(prevState: any, formData: FormData) {
  try {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const parsed = signUpSchema.safeParse({ email, password });
    if (!parsed.success) {
      return {
        error: 'Invalid email or password format.',
        email,
        password
      };
    }

    const supabaseAdmin = createSupabaseAdmin();
    
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      email_confirm: true, // Auto-confirm for MVP, enable email verification later
    });

    if (authError || !authData.user) {
      return {
        error: authError?.message || 'Failed to create account. Please try again.',
        email,
        password
      };
    }

    // Create merchant record in database
    await prisma.merchant.create({
      data: {
        id: authData.user.id,
        email: parsed.data.email,
        businessName: `${parsed.data.email}'s Business`,
        country: 'US',
        businessType: 'individual',
      },
    });

    // Sign in the user using regular client for proper session
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return {
        error: 'Supabase configuration error. Please contact support.',
        email,
        password
      };
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (signInError || !signInData.session) {
      // User created but sign in failed, ask them to sign in manually
      redirect('/sign-in');
    }

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set('supabase-auth-token', signInData.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/', // Ensure cookie is available for all routes
    });

    // Check if merchant needs onboarding (has default business name)
    const merchant = await prisma.merchant.findUnique({
      where: { id: authData.user.id },
    });

    // Redirect to onboarding if merchant has default business name (not yet onboarded)
    if (merchant && merchant.businessName.includes("'s Business")) {
      redirect('/onboarding');
    }

    redirect('/dashboard');
  } catch (error) {
    // Re-throw redirect errors (Next.js uses these for navigation)
    if (error && typeof error === 'object' && 'digest' in error && typeof error.digest === 'string' && error.digest.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    console.error('Sign up error:', error);
    return {
      error: 'An error occurred during sign up. Please try again.',
      email: '',
      password: ''
    };
  }
}

export async function signOut() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('supabase-auth-token');
    redirect('/sign-in');
  } catch (error) {
    // Re-throw redirect errors (Next.js uses these for navigation)
    if (error && typeof error === 'object' && 'digest' in error && typeof error.digest === 'string' && error.digest.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    throw error;
  }
}

// Helper to get current user from Supabase
export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('supabase-auth-token')?.value;
    
    if (!token) {
      console.log('No auth token found in cookies');
      return null;
    }

    const supabaseAdmin = createSupabaseAdmin();
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error) {
      console.error('Supabase getUser error:', error.message);
      return null;
    }

    if (!user) {
      console.log('No user found from token');
      return null;
    }

    // Get merchant data
    let merchant = await prisma.merchant.findUnique({
      where: { id: user.id }
    });

    // If merchant doesn't exist, create one (for users created before merchant creation was implemented)
    if (!merchant) {
      console.log('Creating merchant record for existing user:', user.id);
      merchant = await prisma.merchant.create({
        data: {
          id: user.id,
          email: user.email || '',
          businessName: `${user.email?.split('@')[0] || 'User'}'s Business`,
          country: 'US',
          businessType: 'individual',
        },
      });
    }

    return {
      id: user.id,
      email: user.email!,
      merchant
    };
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}

// Stub functions for legacy dashboard pages
export async function updateAccount(prevState: any, formData: FormData) {
  // TODO: Implement account update
  return {
    error: 'Account update not yet implemented',
    success: undefined
  };
}

export async function removeTeamMember(prevState: any, formData: FormData) {
  // TODO: Team functionality not implemented in merchant model
  return {
    error: 'Team management not yet implemented',
    success: undefined
  };
}

export async function inviteTeamMember(prevState: any, formData: FormData) {
  // TODO: Team functionality not implemented in merchant model
  return {
    error: 'Team management not yet implemented',
    success: undefined
  };
}
