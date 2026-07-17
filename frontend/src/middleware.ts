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

    // 2. Organization structure & User management: only managers and tower heads
    if (path.startsWith('/organization') && userRole === 'TEAM_MEMBER') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // 3. Udemy Settings sync configuration can only be managed by Tower Heads
    if (path.startsWith('/udemy/settings') && userRole !== 'TOWER_HEAD') {
      return NextResponse.redirect(new URL('/udemy/dashboard', req.url));
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
    '/udemy/:path*',
    '/organization/:path*',
    // Match root dashboard redirect
    '/'
  ]
};
