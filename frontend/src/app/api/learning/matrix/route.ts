import { NextRequest, NextResponse } from 'next/server';
import { getApiSession, apiUnauthorized, apiServerError } from '@/lib/apiHelper';
import { LearningService } from '@/services/LearningService';

export async function GET(req: NextRequest) {
  try {
    const user = await getApiSession();
    if (!user) return apiUnauthorized();

    const { searchParams } = new URL(req.url);
    const managerId = searchParams.get('managerId') || undefined;
    const skillId = searchParams.get('skillId') || undefined;
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');

    const startDate = startDateStr ? new Date(startDateStr) : undefined;
    const endDate = endDateStr ? new Date(endDateStr) : undefined;

    let finalManagerId = managerId;
    let finalDepartment = undefined;

    if (user.role === 'REPORTING_MANAGER') {
      finalManagerId = user.id;
    } else if (user.role === 'TOWER_HEAD') {
      finalDepartment = user.department;
    } else if (user.role === 'TRAINING_DEPT') {
      finalDepartment = searchParams.get('department') || undefined;
    } else {
      // TEAM_MEMBER or others - return empty results or unauthorized
      return NextResponse.json({ employees: [], skills: [] });
    }

    const matrix = await LearningService.computeSkillMatrix({
      managerId: finalManagerId,
      skillId,
      startDate,
      endDate,
      department: finalDepartment
    });

    return NextResponse.json(matrix);
  } catch (error) {
    return apiServerError(error);
  }
}
