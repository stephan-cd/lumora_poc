import { NextRequest, NextResponse } from 'next/server';
import { getApiSession, apiUnauthorized, apiServerError } from '@/lib/apiHelper';
import { SkillService } from '@/services/SkillService';

export async function GET(req: NextRequest) {
  try {
    const user = await getApiSession();
    if (!user) return apiUnauthorized();

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    let skills = await SkillService.listSkills();

    if (category) {
      skills = skills.filter(s => s.category.toLowerCase() === category.toLowerCase());
    }

    if (search) {
      const q = search.toLowerCase();
      skills = skills.filter(s => s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q));
    }

    return NextResponse.json(skills);
  } catch (error) {
    return apiServerError(error);
  }
}
