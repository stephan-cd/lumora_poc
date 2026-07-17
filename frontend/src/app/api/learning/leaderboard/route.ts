import { NextRequest, NextResponse } from 'next/server';
import { getApiSession, apiUnauthorized, apiServerError } from '@/lib/apiHelper';
import { LearningService } from '@/services/LearningService';

export async function GET(req: NextRequest) {
  try {
    const user = await getApiSession();
    if (!user) return apiUnauthorized();

    const leaderboard = await LearningService.getLeaderboard(new Date(), user);
    return NextResponse.json(leaderboard);
  } catch (error) {
    return apiServerError(error);
  }
}
