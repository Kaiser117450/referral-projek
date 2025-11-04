import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default withAuth(
  function middleware(request) {
    const token = request.nextauth.token;
    const { pathname } = request.nextUrl;

    // Allow access to auth pages without authentication
    if (pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/auth/')) {
      return NextResponse.next();
    }

    // Protect admin routes
    if (pathname.startsWith('/admin')) {
      if (token?.role !== 'admin') {
        return NextResponse.redirect(new URL('/login?error=insufficient_permissions', request.url));
      }
    }

    // Protect cashier routes
    if (pathname.startsWith('/cashier')) {
      if (token?.role !== 'cashier' && token?.role !== 'admin') {
        return NextResponse.redirect(new URL('/login?error=insufficient_permissions', request.url));
      }
    }

    // Protect dashboard routes (require any authenticated user)
    if (pathname.startsWith('/dashboard')) {
      if (!token) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }

    // Add user info to headers for server components
    const response = NextResponse.next();
    if (token) {
      response.headers.set('x-user-id', token.sub || '');
      response.headers.set('x-user-email', token.email || '');
      response.headers.set('x-user-role', token.role || 'user');
    }

    return response;
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // Allow public routes
        if (
          pathname === '/' ||
          pathname.startsWith('/login') ||
          pathname.startsWith('/register') ||
          pathname.startsWith('/auth/') ||
          pathname.startsWith('/api/auth/') ||
          pathname.startsWith('/_next/') ||
          pathname.startsWith('/favicon.ico') ||
          pathname.startsWith('/public/')
        ) {
          return true;
        }

        // Require authentication for all other routes
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth.js routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
