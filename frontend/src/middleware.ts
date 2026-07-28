import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // If not authenticated, the default withAuth behavior will redirect to login page.
    if (!token) {
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }

    const userRole = token.role;

    // RBAC path restrictions:
    // 1. Approvals / Approval Center can only be accessed by managers and tower heads
    if (path.startsWith('/learning/approvals') && (userRole === 'TEAM_MEMBER' || userRole === 'TRAINING_DEPT')) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // 2. Department structure & User management: only managers and tower heads
    if (path.startsWith('/department') && userRole === 'TEAM_MEMBER') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }



    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    }
  }
);

// Protect all application paths except login/forgot password/reset password and public assets
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/skills/:path*',
    '/learning/:path*',
    '/skill-matrix/:path*',
    '/talent-discovery/:path*',
    '/analytics/:path*',
    '/reports/:path*',
    '/department/:path*',
    // Match root dashboard redirect
    '/'
  ]
};
