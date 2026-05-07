import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // In all environments, check for auth
  const { updateSession } = await import('@/lib/supabase/middleware');
  return await updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
