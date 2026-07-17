import { NextRequest, NextResponse } from 'next/server';
import { getApiSession, apiUnauthorized, apiForbidden, apiServerError } from '@/lib/apiHelper';
import { LearningService } from '@/services/LearningService';
import { Role } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const user = await getApiSession();
    if (!user) return apiUnauthorized();
    if (user.role === Role.TEAM_MEMBER) return apiForbidden();

    const { searchParams } = new URL(req.url);
    const pending = searchParams.get('pending') !== 'false'; // defaults to true
    
    // Filters
    const employeeId = searchParams.get('employeeId');
    const skillId = searchParams.get('skillId');
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');
    const filterStatus = searchParams.get('status');

    let records;
    if (pending) {
      records = await LearningService.listPendingApprovals(user.id);
    } else {
      records = await LearningService.listApprovalsHistory(user.id);
    }

    // Apply local filters in memory to avoid overly complex SQL queries
    if (employeeId) {
      records = records.filter(r => r.user.id === employeeId);
    }
    if (skillId) {
      records = records.filter(r => r.skillId === skillId);
    }
    if (startDateStr) {
      const sDate = new Date(startDateStr);
      records = records.filter(r => new Date(r.date) >= sDate);
    }
    if (endDateStr) {
      const eDate = new Date(endDateStr);
      records = records.filter(r => new Date(r.date) <= eDate);
    }
    if (filterStatus) {
      records = records.filter(r => r.status.toLowerCase() === filterStatus.toLowerCase());
    }

    return NextResponse.json(records);
  } catch (error) {
    return apiServerError(error);
  }
}
