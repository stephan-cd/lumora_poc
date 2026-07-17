import { NextRequest, NextResponse } from 'next/server';
import { getApiSession, apiUnauthorized, apiServerError } from '@/lib/apiHelper';
import { SkillService } from '@/services/SkillService';

export async function GET(req: NextRequest) {
  try {
    const user = await getApiSession();
    if (!user) return apiUnauthorized();

    const { searchParams } = new URL(req.url);
    const historyOnly = searchParams.get('history') === 'true';

    let requests;
    if (historyOnly) {
      requests = await SkillService.listAllRequestsHistory(user.id);
    } else {
      requests = await SkillService.listPendingRequests(user.id);
    }

    return NextResponse.json(requests);
  } catch (error) {
    return apiServerError(error);
  }
}
