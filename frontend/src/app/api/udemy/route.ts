import { NextRequest, NextResponse } from 'next/server';
import { getApiSession, apiUnauthorized, apiForbidden, apiServerError } from '@/lib/apiHelper';
import { UdemyService } from '@/services/UdemyService';
import { Role } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const user = await getApiSession();
    if (!user) return apiUnauthorized();

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // dashboard, courses, progress, certifications, logs, config

    if (type === 'config') {
      const config = await UdemyService.getConfig();
      return NextResponse.json(config);
    }

    if (type === 'courses') {
      const courses = await UdemyService.listCourses();
      return NextResponse.json(courses);
    }

    if (type === 'progress') {
      const progress = await UdemyService.listProgress();
      return NextResponse.json(progress);
    }

    if (type === 'certifications') {
      const certs = await UdemyService.listCertifications();
      return NextResponse.json(certs);
    }

    if (type === 'logs') {
      const logs = await UdemyService.listSyncLogs();
      return NextResponse.json(logs);
    }

    // Default: Dashboard stats
    const courses = await UdemyService.listCourses();
    const progress = await UdemyService.listProgress();
    const certs = await UdemyService.listCertifications();

    const totalCourses = courses.length;
    const totalLearningHours = progress.reduce((sum, p) => sum + p.timeSpent, 0);
    const activeLearners = new Set(progress.map(p => p.userId)).size;
    const completedCourses = progress.filter(p => p.progressPercent === 100).length;
    const certificationsEarned = certs.length;

    // Charts: Course Adoption (Group count by category)
    const adoptionMap: { [cat: string]: number } = {};
    courses.forEach(c => {
      adoptionMap[c.category] = (adoptionMap[c.category] || 0) + 1;
    });
    const courseAdoption = Object.entries(adoptionMap).map(([name, value]) => ({ name, value }));

    // Charts: Top Learners in Udemy (by timeSpent)
    const userHours: { [name: string]: number } = {};
    progress.forEach(p => {
      userHours[p.user.name] = (userHours[p.user.name] || 0) + p.timeSpent;
    });
    const topLearners = Object.entries(userHours)
      .map(([name, hours]) => ({ name, hours }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 5);

    // Learning Trend
    const learningTrend = [
      { month: 'Jan', hours: 45 },
      { month: 'Feb', hours: 68 },
      { month: 'Mar', hours: 110 },
      { month: 'Apr', hours: 145 },
      { month: 'May', hours: 190 },
      { month: 'Jun', hours: 235 },
    ];

    return NextResponse.json({
      widgets: {
        totalCourses,
        totalLearningHours: parseFloat(totalLearningHours.toFixed(1)),
        activeLearners,
        completedCourses,
        certificationsEarned
      },
      charts: {
        learningTrend,
        courseAdoption,
        topLearners
      }
    });
  } catch (error) {
    return apiServerError(error);
  }
}
