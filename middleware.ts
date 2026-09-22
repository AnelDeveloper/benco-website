import createIntlMiddleware from 'next-intl/middleware';
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

/**
 * Refreshes the Supabase auth cookie and bounces logged-out visitors to the
 * login page. Runs only for /admin — the public site has no sessions.
 */
async function handleAdmin(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const { data } = await supabase.auth.getUser();
  const isLoginPage = request.nextUrl.pathname === '/admin/login';

  if (!data.user && !isLoginPage) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }
  if (data.user && isLoginPage) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return response;
}

export default function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/admin')) {
    return handleAdmin(request);
  }
  return intlMiddleware(request);
}

export const config = {
  // `api` must be excluded: without it the next-intl middleware rewrites API
  // routes into the locale tree and every request to them returns 404. This
  // exclusion was missing from the original matcher, which is why
  // POST /api/contact never reached its handler.
  matcher: ['/', '/(bs|en)/:path*', '/admin/:path*', '/((?!api|_next|_vercel|.*\\..*).*)']
};
