import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { NextResponse } from 'next/server';
import { Role } from '@prisma/client';

export async function getApiSession() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return null;
  }
  return session.user;
}

export function apiUnauthorized() {
  return NextResponse.json({ error: 'Unauthorized. Authentication required.' }, { status: 401 });
}

export function apiForbidden() {
  return NextResponse.json({ error: 'Forbidden. Insufficient permissions.' }, { status: 403 });
}

export function apiBadRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function apiServerError(error: any) {
  console.error('API Server Error:', error);
  return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
}

export function hasRole(user: { role: Role }, allowedRoles: Role[]) {
  return allowedRoles.includes(user.role);
}
