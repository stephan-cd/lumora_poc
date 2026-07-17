import { NextRequest, NextResponse } from 'next/server';
import { getApiSession, apiUnauthorized, apiServerError } from '@/lib/apiHelper';
import { UserService } from '@/services/UserService';

export async function GET(req: NextRequest) {
  try {
    const user = await getApiSession();
    if (!user) return apiUnauthorized();

    const hierarchy = await UserService.getOrganizationHierarchy(user.id);
    return NextResponse.json(hierarchy);
  } catch (error) {
    return apiServerError(error);
  }
}
