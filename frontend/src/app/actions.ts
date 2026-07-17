'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { UserService } from '@/services/UserService';
import { LearningService } from '@/services/LearningService';
import { SkillService } from '@/services/SkillService';
import { UdemyService } from '@/services/UdemyService';
import { Role, UserStatus, LearningType, LearningSource, ProficiencyLevel, GoalType } from '@prisma/client';
import { revalidatePath } from 'next/cache';

// Helper to get authenticated user session on the server
async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    throw new Error('Authentication required.');
  }
  return session.user;
}

// --- PROFILE & PASSWORD ACTIONS ---
export async function updateProfileAction(data: { name: string; email: string; designation: string; department: string }) {
  const user = await requireAuth();
  const result = await UserService.updateUserProfile(user.id, data);
  revalidatePath('/dashboard');
  return { success: true, user: result };
}

export async function changePasswordAction(currentPass: string, newPass: string) {
  const user = await requireAuth();
  await UserService.changePassword(user.id, currentPass, newPass);
  return { success: true };
}

// --- USER MANAGEMENT ACTIONS (RBAC RESTRICTED) ---
export async function createReportingManagerAction(data: {
  employeeId: string;
  name: string;
  email: string;
  designation: string;
  department: string;
}) {
  const user = await requireAuth();
  const manager = await UserService.towerHeadCreateManager(user.id, data);
  revalidatePath('/organization');
  return { success: true, user: manager };
}

export async function editReportingManagerAction(managerId: string, data: {
  name: string;
  designation: string;
  department: string;
}) {
  const user = await requireAuth();
  const manager = await UserService.towerHeadEditManager(user.id, managerId, data);
  revalidatePath('/organization');
  return { success: true, user: manager };
}

export async function createTeamMemberAction(data: {
  employeeId: string;
  name: string;
  email: string;
  designation: string;
  department: string;
}) {
  const user = await requireAuth();
  const member = await UserService.managerCreateTeamMember(user.id, data);
  revalidatePath('/organization');
  return { success: true, user: member };
}

export async function editTeamMemberAction(memberId: string, data: {
  name: string;
  designation: string;
  department: string;
}) {
  const user = await requireAuth();
  const member = await UserService.managerEditTeamMember(user.id, memberId, data);
  revalidatePath('/organization');
  return { success: true, user: member };
}

export async function disableUserAction(targetUserId: string) {
  const user = await requireAuth();
  await UserService.disableUser(user.id, targetUserId);
  revalidatePath('/organization');
  return { success: true };
}

// --- LEARNING HOURS LOG ACTIONS ---
export async function submitLearningLogAction(data: {
  skillId: string;
  date: string; // Action boundary uses string dates
  hoursSpent: number;
  learningType: LearningType;
  learningSource: LearningSource;
  description: string;
  attachmentPath?: string;
}) {
  const user = await requireAuth();
  const result = await LearningService.submitLog(user.id, {
    ...data,
    date: new Date(data.date)
  });
  revalidatePath('/learning/history');
  revalidatePath('/dashboard');
  return { success: true, entry: result };
}

export async function editLearningLogAction(logId: string, data: {
  skillId?: string;
  date?: string;
  hoursSpent?: number;
  learningType?: LearningType;
  learningSource?: LearningSource;
  description?: string;
  attachmentPath?: string;
}) {
  const user = await requireAuth();
  const result = await LearningService.editLog(user.id, logId, {
    ...data,
    date: data.date ? new Date(data.date) : undefined
  });
  revalidatePath('/learning/history');
  revalidatePath('/dashboard');
  return { success: true, entry: result };
}

export async function deleteLearningLogAction(logId: string) {
  const user = await requireAuth();
  await LearningService.deleteLog(user.id, logId);
  revalidatePath('/learning/history');
  revalidatePath('/dashboard');
  return { success: true };
}

// --- APPROVAL ACTIONS ---
export async function processApprovalAction(logId: string, status: 'APPROVED' | 'REJECTED', comments?: string) {
  const user = await requireAuth();
  const result = await LearningService.processApproval(user.id, logId, status, comments);
  revalidatePath('/learning/approvals');
  revalidatePath('/dashboard');
  return { success: true, entry: result };
}

export async function processBulkApprovalsAction(logIds: string[], status: 'APPROVED' | 'REJECTED', comments?: string) {
  const user = await requireAuth();
  const result = await LearningService.processBulkApprovals(user.id, logIds, status, comments);
  revalidatePath('/learning/approvals');
  revalidatePath('/dashboard');
  return { success: true, count: result.processedCount };
}

// --- SKILL REQUEST ACTIONS ---
export async function requestCustomSkillAction(data: {
  skillName: string;
  category: string;
  description?: string;
}) {
  const user = await requireAuth();
  const result = await SkillService.requestCustomSkill(user.id, data);
  revalidatePath('/skills/requests');
  return { success: true, request: result };
}

export async function processSkillRequestAction(requestId: string, status: 'APPROVED' | 'REJECTED', comments?: string) {
  const user = await requireAuth();
  const result = await SkillService.handleSkillRequest(user.id, requestId, status, comments);
  revalidatePath('/skills/requests');
  revalidatePath('/skills');
  return { success: true, request: result };
}

// --- GOAL ACTIONS ---
export async function setLearningGoalAction(type: GoalType, targetHours: number) {
  const user = await requireAuth();
  const result = await LearningService.setGoal(user.id, { type, targetHours });
  revalidatePath('/dashboard');
  return { success: true, goal: result };
}

// --- PROFICIENCY ASSESSMENT ACTION ---
export async function assessProficiencyAction(employeeId: string, skillId: string, level: ProficiencyLevel) {
  const user = await requireAuth();
  const result = await LearningService.assessEmployeeProficiency(user.id, employeeId, skillId, level);
  revalidatePath('/skill-matrix');
  return { success: true, proficiency: result };
}

// --- UDEMY BUSINESS ACTIONS ---
export async function updateUdemyConfigAction(data: {
  clientId: string;
  clientSecret: string;
  orgId: string;
  syncFrequency: string;
}) {
  await requireAuth(); // verifies authentication
  const result = await UdemyService.updateConfig(data);
  revalidatePath('/udemy/settings');
  return { success: true, config: result };
}

export async function runUdemySyncAction() {
  const user = await requireAuth();
  const result = await UdemyService.runManualSync(user.id);
  revalidatePath('/udemy/dashboard');
  revalidatePath('/udemy/courses');
  revalidatePath('/udemy/progress');
  revalidatePath('/udemy/certifications');
  revalidatePath('/udemy/sync-logs');
  return result;
}

export async function addAdminSkillAction(data: {
  name: string;
  category: string;
  description?: string;
}) {
  const user = await requireAuth();
  const result = await SkillService.addAdminSkill(user.id, data);
  revalidatePath('/skills');
  return { success: true, skill: result };
}
