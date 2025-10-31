import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase/client';

const protectedRoutes = ['/dashboard'];
const authRoutes = ['/sign-in', '/sign-up'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('supabase-auth-token')?.value;
  
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

  // Check if user is authenticated
  let isAuthenticated = false;
  if (token) {
    try {
      const supabase = createSupabaseAdmin();
      const { data, error } = await supabase.auth.getUser(token);
      isAuthenticated = !error && !!data.user;
    } catch (error) {
      console.error('Auth middleware error:', error);
      isAuthenticated = false;
    }
  }

  // Redirect to sign-in if trying to access protected route without auth
  if (isProtectedRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  // Redirect to dashboard if trying to access auth routes while authenticated
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
  runtime: 'nodejs'
};
