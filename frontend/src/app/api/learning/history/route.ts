import { NextRequest, NextResponse } from 'next/server';
import { getApiSession, apiUnauthorized, apiServerError } from '@/lib/apiHelper';
import { LearningService } from '@/services/LearningService';

export async function GET(req: NextRequest) {
  try {
    const user = await getApiSession();
    if (!user) return apiUnauthorized();

    const history = await LearningService.getHistory(user.id);
    const goals = await LearningService.getGoalSummary(user.id);
    const proficiencies = await LearningService.getEmployeeProficiencies(user.id);

    return NextResponse.json({ history, goals, proficiencies });
  } catch (error) {
    return apiServerError(error);
  }
}
