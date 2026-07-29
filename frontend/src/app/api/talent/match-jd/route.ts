import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Utility to clean LLM JSON output
function cleanLLMJson(text: string) {
  let clean = text.trim();
  if (clean.startsWith('```json')) {
    clean = clean.substring(7);
  } else if (clean.startsWith('```')) {
    clean = clean.substring(3);
  }
  if (clean.endsWith('```')) {
    clean = clean.substring(0, clean.length - 3);
  }
  return clean.trim();
}

async function runLLM(prompt: string, useLocalLLM: boolean, modelType: 'extraction' | 'scoring' = 'scoring') {
  if (useLocalLLM) {
    console.log(`[JD Match] Using Local LLM for ${modelType}...`);
    const response = await fetch('http://localhost:11434/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen2:0.5b',
        messages: [{ role: 'user', content: prompt }],
        temperature: modelType === 'extraction' ? 0.1 : 0.4
      })
    });

    if (!response.ok) {
      throw new Error(`Local LLM API failed with status ${response.status}`);
    }
    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  } else {
    console.log(`[JD Match] Using Groq LLM for ${modelType}...`);
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: modelType === 'extraction' ? 0.1 : 0.4
    });
    return chatCompletion.choices[0]?.message?.content || '';
  }
}

export async function POST(req: Request) {
  try {
    const { jdText, teamId, useLocalLLM = false } = await req.json();

    if (!jdText) {
      return NextResponse.json({ error: 'Job description text is required' }, { status: 400 });
    }

    // Step 1: Extract requirements using LLM
    const extractPrompt = `
You are an expert technical recruiter. Extract the key required technical skills from the following Job Description.
Return ONLY a raw JSON object (no markdown, no backticks) with the following structure:
{
  "skills": ["skill1", "skill2"]
}

Job Description:
${jdText}
`;

    const extractedRaw = await runLLM(extractPrompt, useLocalLLM, 'extraction');
    let extractedSkills: string[] = [];
    try {
      const parsed = JSON.parse(cleanLLMJson(extractedRaw));
      extractedSkills = parsed.skills || [];
    } catch (e) {
      console.error('Failed to parse extracted skills, fallback to empty array', e);
      // Fallback: simple regex word extraction if LLM fails
      extractedSkills = jdText.match(/\b(react|node|typescript|javascript|python|java|go|aws|docker|kubernetes)\b/gi) || [];
    }

    console.log('[JD Match] Extracted Skills:', extractedSkills);

    // Step 2: Database Query to filter top candidates
    let users: any[] = [];
    
    let whereClause: any = { status: 'ACTIVE' };
    if (teamId) {
      whereClause.managerId = teamId;
    }

    if (extractedSkills.length > 0) {
      users = await prisma.user.findMany({
        where: {
          ...whereClause,
          proficiencies: {
            some: {
              skill: {
                name: {
                  in: extractedSkills,
                  mode: 'insensitive'
                }
              }
            }
          }
        },
        take: 50,
        include: {
          proficiencies: { include: { skill: true } },
          learningEntries: { where: { status: 'APPROVED' } },
          commits: { include: { reviews: { include: { issues: true } } } }
        }
      });
    }

    // If no users matched specific skills or no skills extracted, fallback to recent active users
    if (users.length === 0) {
      users = await prisma.user.findMany({
        where: whereClause,
        take: 20,
        include: {
          proficiencies: { include: { skill: true } },
          learningEntries: { where: { status: 'APPROVED' } },
          commits: { include: { reviews: { include: { issues: true } } } }
        }
      });
    }

    if (users.length === 0) {
      return NextResponse.json({ matches: [] });
    }

    // Prepare candidate profiles
    const candidateProfiles = users.map(user => {
      const totalLearningHours = user.learningEntries.reduce((sum, entry) => sum + entry.hoursSpent, 0);
      let totalScore = 0;
      let reviewCount = 0;
      const committedTechnologies = new Set<string>();
      
      user.commits.forEach(commit => {
        if (commit.technology) {
          committedTechnologies.add(commit.technology);
        }
        commit.reviews.forEach(review => {
          totalScore += review.score;
          reviewCount++;
        });
      });
      const avgCodeQuality = reviewCount > 0 ? Math.round(totalScore / reviewCount) : null;
      
      return {
        id: user.id,
        name: user.name,
        role: user.designation,
        department: user.department,
        skills: user.proficiencies.map(p => ({ name: p.skill.name, level: p.level })),
        learningHours: totalLearningHours,
        avgCodeQualityScore: avgCodeQuality || 0,
        committedTechnologies: Array.from(committedTechnologies)
      };
    });

    // Step 3: Deep AI Evaluation
    const scoringPrompt = `
You are an expert AI Talent Matcher. Evaluate the following list of candidates against the provided Job Description.
Calculate a suitability score (0-100) for each candidate.
Base your evaluation on: Learning hours, Practical experience (skills), committed technologies in recent code, AI Code Quality score, Technology expertise, and Skill maturity.

Job Description:
${jdText}

Candidates (JSON):
${JSON.stringify(candidateProfiles, null, 2)}

Return ONLY a raw JSON array (no markdown, no backticks) of the top candidates, sorted by score in descending order.
Format:
[
  {
    "userId": "id",
    "score": 95,
    "explanation": "Brief 2-sentence explanation of why they are a good match based on their skills, learning hours, committed technologies, and code quality."
  }
]
`;

    const scoringRaw = await runLLM(scoringPrompt, useLocalLLM, 'scoring');
    let matches = [];
    try {
      matches = JSON.parse(cleanLLMJson(scoringRaw));
    } catch (e) {
      console.error('Failed to parse scoring response', e);
      return NextResponse.json({ error: 'Failed to evaluate candidates using AI.' }, { status: 500 });
    }

    // Attach full user details to the matches
    const enrichedMatches = matches.map((match: any) => {
      const u = candidateProfiles.find(c => c.id === match.userId);
      return {
        ...match,
        user: u
      };
    }).filter((m: any) => m.user != null); // Ensure user exists

    return NextResponse.json({ matches: enrichedMatches });

  } catch (error: any) {
    console.error('Error in JD Matching:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
