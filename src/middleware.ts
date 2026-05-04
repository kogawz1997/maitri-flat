import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

type CookieToSet = {
  name: string;
  value: string;
  options?: CookieOptions;
};

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          // set request cookies
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          // recreate response
          response = NextResponse.next({
            request,
          });

          // set response cookies
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // IMPORTANT: ต้องเรียกเพื่อ refresh session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // protect dashboard route
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/((?!auth|webhooks|public).*)',
  ],
};