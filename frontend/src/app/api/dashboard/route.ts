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

    return NextResponse.json({ role: user.role, ...data });
  } catch (error) {
    return apiServerError(error);
  }
}
