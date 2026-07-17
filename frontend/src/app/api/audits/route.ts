import { NextRequest, NextResponse } from 'next/server';
import { getApiSession, apiUnauthorized, apiForbidden, apiServerError } from '@/lib/apiHelper';
import { AuditLogRepository } from '@/repositories/AuditLogRepository';
import { Role } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const user = await getApiSession();
    if (!user) return apiUnauthorized();
    if (user.role !== Role.TOWER_HEAD) return apiForbidden();

    const logs = await AuditLogRepository.listAll(100);
    return NextResponse.json(logs);
  } catch (error) {
    return apiServerError(error);
  }
}
