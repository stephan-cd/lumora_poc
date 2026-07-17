import { NextRequest, NextResponse } from 'next/server';
import { getApiSession, apiUnauthorized, apiForbidden, apiServerError } from '@/lib/apiHelper';
import { AnalyticsService } from '@/services/AnalyticsService';
import { Role } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const user = await getApiSession();
    if (!user) return apiUnauthorized();

    if (user.role !== Role.TOWER_HEAD && user.role !== Role.TRAINING_DEPT) {
      return apiForbidden();
    }

    const data = await AnalyticsService.getSkillGapAnalysis(user.id);
    return NextResponse.json(data);
  } catch (error) {
    return apiServerError(error);
  }
}
