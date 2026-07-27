import { NextRequest, NextResponse } from 'next/server';
import { getApiSession, apiUnauthorized, apiServerError } from '@/lib/apiHelper';
import { AnalyticsService } from '@/services/AnalyticsService';
import { Role } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const user = await getApiSession();
    if (!user) return apiUnauthorized();

    let data;
    if (user.role === Role.TOWER_HEAD || user.role === Role.TRAINING_DEPT) {
      data = await AnalyticsService.getTowerHeadDashboard(user.id);
    } else if (user.role === Role.REPORTING_MANAGER) {
      data = await AnalyticsService.getManagerDashboard(user.id);
    } else {
      data = await AnalyticsService.getTeamMemberDashboard(user.id);
    }

    const dbUser = await import('@/lib/prisma').then(m => m.default.user.findUnique({ where: { id: user.id }, select: { useLocalLLM: true } }));

    return NextResponse.json({ role: user.role, useLocalLLM: dbUser?.useLocalLLM || false, ...data });
  } catch (error) {
    return apiServerError(error);
  }
}
