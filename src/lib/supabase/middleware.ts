import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase is not configured or we're in dev, skip auth checks
  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Try to get the user, but don't block on failure
  try {
    const { data: { user } } = await supabase.auth.getUser();

    // Only enforce auth in production with real users
    if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
      // Check if there's a demo cookie or if we should allow demo access
      const demoMode = request.cookies.get('vidyut_demo_mode');
      if (!demoMode) {
        // In development, allow access without login
        if (process.env.NODE_ENV === 'development') {
          return supabaseResponse;
        }
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
      }
    }

    // Redirect authenticated users away from auth pages
    if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup')) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
  } catch {
    // Auth check failed — allow through in development
    if (process.env.NODE_ENV === 'development') {
      return supabaseResponse;
    }
  }

  return supabaseResponse;
}
