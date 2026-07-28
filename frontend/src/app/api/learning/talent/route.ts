import { NextRequest, NextResponse } from 'next/server';
import { getApiSession, apiUnauthorized, apiServerError } from '@/lib/apiHelper';
import { LearningService } from '@/services/LearningService';
import { ProficiencyLevel } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const user = await getApiSession();
    if (!user) return apiUnauthorized();

    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get('teamId') || undefined;

    const talent = await LearningService.discoverTalent({
      teamId
    });

    return NextResponse.json(talent);
  } catch (error) {
    return apiServerError(error);
  }
}
