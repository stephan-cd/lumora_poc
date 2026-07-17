import { NextRequest, NextResponse } from 'next/server';
import { getApiSession, apiUnauthorized, apiServerError } from '@/lib/apiHelper';
import { LearningService } from '@/services/LearningService';
import { ProficiencyLevel } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const user = await getApiSession();
    if (!user) return apiUnauthorized();

    const { searchParams } = new URL(req.url);
    const skillId = searchParams.get('skillId') || undefined;
    const skillQuery = searchParams.get('skillQuery') || undefined;
    const minHoursStr = searchParams.get('minHours');
    const levelStr = searchParams.get('level');

    const minHours = minHoursStr ? parseFloat(minHoursStr) : undefined;
    const level = levelStr ? levelStr as ProficiencyLevel : undefined;

    const talent = await LearningService.discoverTalent({
      skillId,
      skillNameQuery: skillQuery,
      minHours,
      proficiencyLevel: level
    });

    return NextResponse.json(talent);
  } catch (error) {
    return apiServerError(error);
  }
}
