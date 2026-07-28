import { NextRequest, NextResponse } from 'next/server';
import { getApiSession, apiUnauthorized, apiServerError } from '@/lib/apiHelper';
import prisma from '@/lib/prisma';

async function generateTextViaBackend(prompt: string, useLocalLLM: boolean): Promise<string> {
  const res = await fetch('http://localhost:8080/api/v1/ai/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, useLocalLLM })
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Backend AI returned ${res.status}: ${errorText}`);
  }
  const data = await res.json();
  return data.response;
}

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
      console.log('\n[LLM - Talent Profile] ================= LEARNING PROMPT =================\n', learningPrompt, '\n==========================================\n\n');

      const generatedContent = await generateTextViaBackend(learningPrompt, user.useLocalLLM);

      console.log('\n[LLM - Talent Profile] ================= LEARNING OUTPUT =================\n', generatedContent, '\n==========================================\n\n');

      profileReport = await prisma.userProfileReport.update({
        where: { id: profileReport.id },
        data: { learningReport: generatedContent || 'Learning Report generation failed.' }
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
      console.log('\n[LLM - Talent Profile] ================= CODE REVIEW PROMPT =================\n', codeReviewPrompt, '\n==========================================\n\n');

      const generatedContent = await generateTextViaBackend(codeReviewPrompt, user.useLocalLLM);

      console.log('\n[LLM - Talent Profile] ================= CODE REVIEW OUTPUT =================\n', generatedContent, '\n==========================================\n\n');

      profileReport = await prisma.userProfileReport.update({
        where: { id: profileReport.id },
        data: { codeReviewReport: generatedContent || 'Code Review Report generation failed.' }
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

    console.log('\n[LLM - Talent Profile] ================= FINAL PROFILE PROMPT =================\n', prompt, '\n==========================================\n\n');

    const markdownReport = await generateTextViaBackend(prompt, user.useLocalLLM) || '*Report generation failed.*';

    console.log('\n[LLM - Talent Profile] ================= FINAL PROFILE OUTPUT =================\n', markdownReport, '\n==========================================\n\n');

    await prisma.userProfileReport.update({
      where: { id: profileReport.id },
      data: { reportData: markdownReport }
    });

    return NextResponse.json({ profileMarkdown: markdownReport });

  } catch (error: any) {
    console.error('Profile Generation Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error', details: error.message || {} }, { status: 500 });
  }
}
