import { NextRequest, NextResponse } from 'next/server';
import { getApiSession, apiUnauthorized, apiServerError } from '@/lib/apiHelper';
import prisma from '@/lib/prisma';
import Groq from 'groq-sdk';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const session = await getApiSession();
    if (!session) return apiUnauthorized();

    const resolvedParams = await params;
    const userId = resolvedParams.id;

    // Fetch User with Learning and Code Review Data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        learningEntries: {
          where: { status: 'APPROVED' },
          include: { skill: true },
          orderBy: { date: 'desc' }
        },
        commits: {
          include: {
            reviews: {
              include: { issues: true },
              where: { status: 'completed' }
            }
          },
          orderBy: { created_at: 'desc' },
          take: 5 // limit to recent 5 for context window
        },
        profileReport: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      throw new Error('GROQ_API_KEY is not configured');
    }
    const groq = new Groq({ apiKey: groqApiKey });

    // Initialize or fetch the existing profile report record
    let profileReport = user.profileReport;
    if (!profileReport) {
      profileReport = await prisma.userProfileReport.create({
        data: { userId: user.id }
      });
    }

    // 1. Generate Learning Report if it doesn't exist
    if (!profileReport.learningReport) {
      const skillHours: Record<string, number> = {};
      user.learningEntries.forEach(entry => {
        skillHours[entry.skill.name] = (skillHours[entry.skill.name] || 0) + entry.hoursSpent;
      });
      const learningSummary = Object.entries(skillHours)
        .map(([skill, hours]) => `- ${skill}: ${hours} hours`)
        .join('\n');

      const learningPrompt = `
You are an expert Engineering Manager evaluating an employee's learning and development progress.
Analyze the following learning summary for the employee ${user.name} who holds the designation of '${user.designation}'. Generate a concise Learning Report, evaluating how well their acquired skills align with the expectations of their specific designation at the company. Focus on the breadth and depth of skills acquired in relation to their role.

Learning Data:
${learningSummary || "No learning hours logged yet."}
`;
      const response = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: learningPrompt }],
        temperature: 0.7,
        max_tokens: 800
      });

      profileReport = await prisma.userProfileReport.update({
        where: { id: profileReport.id },
        data: { learningReport: response.choices[0]?.message?.content || 'Learning Report generation failed.' }
      });
    }

    // 2. Generate Code Review Report if it doesn't exist
    if (!profileReport.codeReviewReport) {
      let totalScore = 0;
      let reviewCount = 0;
      const issueSummaries: string[] = [];

      user.commits.forEach(commit => {
        commit.reviews.forEach(review => {
          totalScore += review.score;
          reviewCount++;
          review.issues.forEach(issue => {
            issueSummaries.push(`- Severity [${issue.severity}]: ${issue.rule_violated} (Fix: ${issue.recommendation})`);
          });
        });
      });

      const avgScore = reviewCount > 0 ? Math.round(totalScore / reviewCount) : 'N/A';
      const recentIssues = issueSummaries.slice(0, 15).join('\n'); // Limit to 15 issues

      const codeReviewPrompt = `
You are a Staff Engineer evaluating an employee's code quality and technical output.
Analyze the following code review metrics for the employee ${user.name} who holds the designation of '${user.designation}'. Generate a concise Code Review Report. Evaluate their performance, strengths, quality score, and areas for improvement specifically in the context of the expectations for their designation at the company.

Code Review Data:
Average Score: ${avgScore}/100
Recent Issues:
${recentIssues || "No code issues reported."}
`;
      const response = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: codeReviewPrompt }],
        temperature: 0.7,
        max_tokens: 800
      });

      profileReport = await prisma.userProfileReport.update({
        where: { id: profileReport.id },
        data: { codeReviewReport: response.choices[0]?.message?.content || 'Code Review Report generation failed.' }
      });
    }

    // 3. Generate the Final Profile Report
    const prompt = `
You are an expert Engineering Manager conducting a holistic performance review for an employee. 
Write a professional, encouraging, and constructive "Talent Profile Report" in Markdown format.
Please ensure that your profiling and recommendations are highly tailored to the employee's specific designation (${user.designation}) within the company.

Employee Context:
- Name: ${user.name}
- Designation: ${user.designation}
- Department: ${user.department}

---
LEARNING REPORT:
${profileReport.learningReport}
---
CODE REVIEW REPORT:
${profileReport.codeReviewReport}
---

Please structure the final report with the following Markdown headers:
# Talent Profile: ${user.name}
## Executive Summary
## Core Strengths
## Areas for Growth
## Recommended Learning Path
`;

    const response = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1500
    });

    const markdownReport = response.choices[0]?.message?.content || '*Report generation failed.*';

    await prisma.userProfileReport.update({
      where: { id: profileReport.id },
      data: { reportData: markdownReport }
    });

    return NextResponse.json({ profileMarkdown: markdownReport });

  } catch (error: any) {
    console.error('Profile Generation Error:', error);
    if (error.error && error.error.error) {
      console.error("Groq Details:", error.error.error);
    }
    return NextResponse.json({ error: error.message || 'Internal Server Error', details: error.error || {} }, { status: 500 });
  }
}
