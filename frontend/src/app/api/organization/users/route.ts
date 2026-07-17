import { NextRequest, NextResponse } from 'next/server';
import { getApiSession, apiUnauthorized, apiForbidden, apiServerError } from '@/lib/apiHelper';
import { UserService } from '@/services/UserService';
import { UserRepository } from '@/repositories/UserRepository';
import { Role } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const user = await getApiSession();
    if (!user) return apiUnauthorized();

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'managers', 'subordinates', 'all'

    if (type === 'managers') {
      const dept = (user.role === Role.TOWER_HEAD || user.role === Role.REPORTING_MANAGER)
        ? user.department
        : undefined;
      const managers = await UserRepository.listReportingManagers(dept);
      return NextResponse.json(managers);
    }

    if (type === 'subordinates') {
      if (user.role === Role.TEAM_MEMBER || user.role === Role.TRAINING_DEPT) return apiForbidden();
      const subs = await UserService.getManagerSubordinates(user.id);
      return NextResponse.json(subs);
    }

    if (type === 'all') {
      if (user.role !== Role.TOWER_HEAD && user.role !== Role.TRAINING_DEPT) return apiForbidden();
      const allUsers = await UserService.listAllUsers(user.id);
      return NextResponse.json(allUsers);
    }

    // Default to subordinates for manager, all for Tower Head / Training Dept
    if (user.role === Role.TOWER_HEAD || user.role === Role.TRAINING_DEPT) {
      const allUsers = await UserService.listAllUsers(user.id);
      return NextResponse.json(allUsers);
    } else if (user.role === Role.REPORTING_MANAGER) {
      const subs = await UserService.getManagerSubordinates(user.id);
      return NextResponse.json(subs);
    }

    return NextResponse.json([await UserRepository.findById(user.id)]);
  } catch (error) {
    return apiServerError(error);
  }
}
