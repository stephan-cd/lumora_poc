import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const { employeeId } = await req.json();

    if (!employeeId) {
      return NextResponse.json({ error: 'employeeId is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { employeeId },
      include: {
        learningEntries: {
          where: { status: 'APPROVED' }
        },
        commits: {
          include: {
            reviews: {
              include: {
                issues: true
              }
            }
          }
        },
        profileReport: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prepare data
    const totalLearningHours = user.learningEntries.reduce((sum, entry) => sum + entry.hoursSpent, 0);
    
    let totalScore = 0;
    let reviewCount = 0;
    let issuesSummarized: any[] = [];
    
    user.commits.forEach(commit => {
      commit.reviews.forEach(review => {
        totalScore += review.score;
        reviewCount++;
        review.issues.forEach(issue => {
          issuesSummarized.push({
            severity: issue.severity,
            rule_violated: issue.rule_violated
          });
        });
      });
    });

    const averageCodeQualityScore = reviewCount > 0 ? (totalScore / reviewCount).toFixed(2) : 'N/A';

    const prompt = `
Generate a professional, structured Markdown profile report for the following employee based on their learning and code quality metrics.

Name: ${user.name}
Role: ${user.designation} (${user.role})
Department: ${user.department}
GitHub Username: ${user.githubUsername || 'N/A'}
Total Approved Learning Hours: ${totalLearningHours}

Code Quality Metrics:
- Average Review Score: ${averageCodeQualityScore}
- Total Reviews: ${reviewCount}
- Number of Issues Found: ${issuesSummarized.length}
- Issues Breakdown: ${JSON.stringify(issuesSummarized)}

The report should include:
1. Executive Summary
2. Learning & Development Profile
3. Code Quality & Technical Prowess
4. Areas for Improvement
5. Final Conclusion

Make it encouraging but objective. Use professional tone.
`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama3-70b-8192',
    });

    const reportContent = chatCompletion.choices[0]?.message?.content || 'Failed to generate report.';

    // Save to DB
    const updatedReport = await prisma.userProfileReport.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        reportData: reportContent
      },
      update: {
        reportData: reportContent,
        updatedAt: new Date()
      }
    });

    return NextResponse.json(updatedReport);

  } catch (error: any) {
    console.error('Error generating profile report:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('employeeId');

    if (!employeeId) {
      return NextResponse.json({ error: 'employeeId is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { employeeId },
      include: {
        profileReport: true
      }
    });

    if (!user || !user.profileReport) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    return NextResponse.json(user.profileReport);

  } catch (error: any) {
    console.error('Error fetching profile report:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
