import { LearningRepository } from '@/repositories/LearningRepository';
import { UserRepository } from '@/repositories/UserRepository';
import { AuditLogRepository } from '@/repositories/AuditLogRepository';
import { ApprovalStatus, LearningType, LearningSource, ProficiencyLevel, GoalType } from '@prisma/client';
import prisma from '@/lib/prisma';

export class LearningService {
  // --- Log Learning Activities ---
  static async submitLog(actorUserId: string, logData: {
    skillId: string;
    date: Date;
    hoursSpent: number;
    learningType: LearningType;
    learningSource: LearningSource;
    description: string;
    attachmentPath?: string;
  }) {
    const user = await UserRepository.findById(actorUserId);
    if (!user) throw new Error('User not found.');

    const newLog = await LearningRepository.createEntry({
      userId: actorUserId,
      ...logData,
      status: ApprovalStatus.PENDING
    });

    await AuditLogRepository.log(
      actorUserId,
      'LEARNING_ENTRY_SUBMIT',
      `Logged ${newLog.hoursSpent} hours for skill ID ${newLog.skillId}`
    );

    // Notify appropriate approver
    if (user.role === 'TEAM_MEMBER' && user.managerId) {
      await prisma.notification.create({
        data: {
          userId: user.managerId,
          message: `${user.name} logged ${logData.hoursSpent} hours for "${newLog.skill.name}". Action Required: Approval.`
        }
      });
    } else if (user.role === 'REPORTING_MANAGER') {
      // Notify Tower Head of the same department
      const towerHeads = await prisma.user.findMany({
        where: {
          role: 'TOWER_HEAD',
          department: user.department
        }
      });
      for (const th of towerHeads) {
        await prisma.notification.create({
          data: {
            userId: th.id,
            message: `Manager ${user.name} logged ${logData.hoursSpent} hours for "${newLog.skill.name}". Action Required: Approval.`
          }
        });
      }
    }

    return newLog;
  }

  static async editLog(actorUserId: string, logId: string, updateData: {
    skillId?: string;
    date?: Date;
    hoursSpent?: number;
    learningType?: LearningType;
    learningSource?: LearningSource;
    description?: string;
    attachmentPath?: string;
  }) {
    const log = await LearningRepository.findEntryById(logId);
    if (!log) throw new Error('Learning entry not found.');
    if (log.userId !== actorUserId) throw new Error('Unauthorized. You can only edit your own entries.');
    if (log.status !== ApprovalStatus.PENDING) {
      throw new Error('Unauthorized. Only pending entries can be edited.');
    }

    const updated = await LearningRepository.updateEntry(logId, updateData);
    await AuditLogRepository.log(actorUserId, 'LEARNING_ENTRY_UPDATE', `Edited learning log for ${updated.skill.name}`);
    return updated;
  }

  static async deleteLog(actorUserId: string, logId: string) {
    const log = await LearningRepository.findEntryById(logId);
    if (!log) throw new Error('Learning entry not found.');
    if (log.userId !== actorUserId) throw new Error('Unauthorized. You can only delete your own entries.');
    if (log.status !== ApprovalStatus.PENDING) {
      throw new Error('Unauthorized. Only pending entries can be deleted.');
    }

    await LearningRepository.deleteEntry(logId);
    await AuditLogRepository.log(actorUserId, 'LEARNING_ENTRY_DELETE', `Deleted learning log ID ${logId}`);
    return true;
  }

  static async getHistory(userId: string) {
    return LearningRepository.listUserHistory(userId);
  }

  // --- Approvals ---
  static async listPendingApprovals(actorUserId: string) {
    const actor = await UserRepository.findById(actorUserId);
    if (!actor) throw new Error('User not found.');

    if (actor.role === 'TOWER_HEAD') {
      return LearningRepository.listTowerHeadPending(actor.department);
    } else if (actor.role === 'REPORTING_MANAGER') {
      return LearningRepository.listPendingApprovals(actorUserId);
    }
    return [];
  }

  static async listApprovalsHistory(actorUserId: string) {
    const actor = await UserRepository.findById(actorUserId);
    if (!actor) throw new Error('User not found.');

    if (actor.role === 'TOWER_HEAD') {
      return LearningRepository.listTowerHeadApprovalsHistory(actor.department);
    } else if (actor.role === 'REPORTING_MANAGER') {
      return LearningRepository.listApprovalsHistory(actorUserId);
    }
    return [];
  }

  static async processApproval(actorUserId: string, logId: string, status: 'APPROVED' | 'REJECTED', comments?: string) {
    const actor = await UserRepository.findById(actorUserId);
    if (!actor) throw new Error('User not found.');

    const log = await LearningRepository.findEntryById(logId);
    if (!log) throw new Error('Learning log entry not found.');
    if (log.status !== ApprovalStatus.PENDING) {
      throw new Error('This entry has already been processed.');
    }

    // Verify permission to approve
    if (log.user.role === 'TEAM_MEMBER') {
      if (actor.role !== 'REPORTING_MANAGER' || log.user.managerId !== actorUserId) {
        throw new Error('Unauthorized. Only the direct reporting manager can approve this entry.');
      }
    } else if (log.user.role === 'REPORTING_MANAGER') {
      if (actor.role !== 'TOWER_HEAD') {
        throw new Error('Unauthorized. Only Tower Heads can approve Reporting Manager entries.');
      }
    } else {
      throw new Error('Invalid user role.');
    }

    const updated = await LearningRepository.updateEntry(logId, {
      status: status === 'APPROVED' ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED,
      approverId: actorUserId,
      approvalDate: status === 'APPROVED' ? new Date() : undefined,
      comments: comments || ''
    });

    await AuditLogRepository.log(
      actorUserId,
      `LEARNING_ENTRY_${status}`,
      `Processed learning log ID ${logId} (Hours: ${log.hoursSpent}, Skill: ${log.skill.name})`
    );

    // Notify requester
    await prisma.notification.create({
      data: {
        userId: log.userId,
        message: `Your learning entry for "${log.skill.name}" (${log.hoursSpent} hrs) has been ${status}. Comments: ${comments || 'None'}`
      }
    });

    return updated;
  }

  static async processBulkApprovals(actorUserId: string, logIds: string[], status: 'APPROVED' | 'REJECTED', comments?: string) {
    const actor = await UserRepository.findById(actorUserId);
    if (!actor) throw new Error('User not found.');

    const targetStatus = status === 'APPROVED' ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED;

    // Filter out only logs that actor is authorized to approve
    const validLogs = [];
    for (const logId of logIds) {
      const log = await LearningRepository.findEntryById(logId);
      if (log && log.status === ApprovalStatus.PENDING) {
        if (log.user.role === 'TEAM_MEMBER' && actor.role === 'REPORTING_MANAGER' && log.user.managerId === actorUserId) {
          validLogs.push(log);
        } else if (log.user.role === 'REPORTING_MANAGER' && actor.role === 'TOWER_HEAD') {
          validLogs.push(log);
        }
      }
    }

    if (validLogs.length === 0) {
      throw new Error('No valid pending entries found that you are authorized to process.');
    }

    const validIds = validLogs.map(l => l.id);
    await LearningRepository.bulkUpdateStatus(validIds, targetStatus, actorUserId, comments);

    await AuditLogRepository.log(
      actorUserId,
      `LEARNING_BULK_${status}`,
      `Processed ${validLogs.length} entries in bulk.`
    );

    // Send notifications
    for (const log of validLogs) {
      await prisma.notification.create({
        data: {
          userId: log.userId,
          message: `Your learning entry for "${log.skill.name}" (${log.hoursSpent} hrs) has been ${status} in bulk.`
        }
      });
    }

    return { processedCount: validLogs.length };
  }

  // --- Skill Matrix Pivot Core ---
  static async computeSkillMatrix(filters: {
    teamId?: string;
    managerId?: string;
    skillId?: string;
    startDate?: Date;
    endDate?: Date;
    department?: string;
  }) {
    const { entries, proficiencies } = await LearningRepository.getRawMatrixData(filters);

    // Build the grid
    // Rows: Employees
    // Columns: Skills
    // Cells: { hoursSpent: number, proficiencyLevel: string, lastLearningDate: Date }
    const employeesMap: { [userId: string]: {
      id: string;
      name: string;
      employeeId: string;
      department: string;
      skills: { [skillId: string]: {
        hoursSpent: number;
        proficiencyLevel: string;
        lastLearningDate: Date;
      }}
    }} = {};

    const skillsMap: { [skillId: string]: { id: string; name: string; category: string } } = {};

    // Process learning entries
    for (const entry of entries) {
      const u = entry.user;
      const s = entry.skill;

      if (!employeesMap[entry.userId]) {
        employeesMap[entry.userId] = {
          id: u.id,
          name: u.name,
          employeeId: u.employeeId,
          department: u.department,
          skills: {}
        };
      }

      if (!skillsMap[entry.skillId]) {
        skillsMap[entry.skillId] = {
          id: s.id,
          name: s.name,
          category: s.category
        };
      }

      if (!employeesMap[entry.userId].skills[entry.skillId]) {
        employeesMap[entry.userId].skills[entry.skillId] = {
          hoursSpent: 0,
          proficiencyLevel: 'BEGINNER', // default
          lastLearningDate: entry.date
        };
      }

      employeesMap[entry.userId].skills[entry.skillId].hoursSpent += entry.hoursSpent;
      if (entry.date > employeesMap[entry.userId].skills[entry.skillId].lastLearningDate) {
        employeesMap[entry.userId].skills[entry.skillId].lastLearningDate = entry.date;
      }
    }

    // Overlay assessed proficiencies
    for (const prof of proficiencies) {
      if (employeesMap[prof.userId]) {
        if (!employeesMap[prof.userId].skills[prof.skillId]) {
          employeesMap[prof.userId].skills[prof.skillId] = {
            hoursSpent: 0,
            proficiencyLevel: prof.level,
            lastLearningDate: prof.updatedAt
          };
        } else {
          employeesMap[prof.userId].skills[prof.skillId].proficiencyLevel = prof.level;
        }
      }
    }

    return {
      employees: Object.values(employeesMap),
      skills: Object.values(skillsMap)
    };
  }

  // --- Talent Discovery ---
  static async discoverTalent(filters: {
    skillId?: string;
    skillNameQuery?: string;
    minHours?: number;
    proficiencyLevel?: ProficiencyLevel;
  }) {
    return LearningRepository.discoverTalent(filters);
  }

  // --- Learning Goals ---
  static async getGoalSummary(userId: string) {
    const goals = await LearningRepository.getUserGoals(userId);
    const history = await LearningRepository.listUserHistory(userId);

    // Compute progress for each goal
    const goalsWithProgress = goals.map(goal => {
      // Find approved logs within goal time range
      const matchingHours = history
        .filter(entry => 
          entry.status === ApprovalStatus.APPROVED &&
          entry.date >= goal.startDate &&
          entry.date <= goal.endDate
        )
        .reduce((sum, entry) => sum + entry.hoursSpent, 0);

      const percent = goal.targetHours > 0 ? Math.min(100, parseFloat(((matchingHours / goal.targetHours) * 100).toFixed(1))) : 0;

      return {
        ...goal,
        achievedHours: matchingHours,
        progressPercent: percent
      };
    });

    return goalsWithProgress;
  }

  static async setGoal(userId: string, data: { type: GoalType; targetHours: number }) {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    if (data.type === GoalType.MONTHLY) {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    } else if (data.type === GoalType.QUARTERLY) {
      const currentQuarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), currentQuarter * 3, 1);
      endDate = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 0, 23, 59, 59);
    } else { // YEARLY
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
    }

    return LearningRepository.upsertGoal(userId, {
      type: data.type,
      targetHours: data.targetHours,
      startDate,
      endDate
    });
  }

  // --- Proficiency Assessment ---
  static async assessEmployeeProficiency(
    actorUserId: string,
    targetEmployeeId: string,
    skillId: string,
    level: ProficiencyLevel
  ) {
    const actor = await UserRepository.findById(actorUserId);
    if (!actor || (actor.role !== 'REPORTING_MANAGER' && actor.role !== 'TOWER_HEAD')) {
      throw new Error('Unauthorized. Only managers or Tower Heads can assess skill proficiency levels.');
    }

    const employee = await UserRepository.findById(targetEmployeeId);
    if (!employee) throw new Error('Employee not found.');

    // Manager can only assess their own subordinates
    if (actor.role === 'REPORTING_MANAGER' && employee.managerId !== actorUserId) {
      throw new Error('Unauthorized. You can only assess members in your reporting chain.');
    }

    const result = await LearningRepository.updateProficiency(targetEmployeeId, skillId, level, actorUserId);
    await AuditLogRepository.log(
      actorUserId,
      'PROFICIENCY_ASSESS',
      `Assessed skill proficiency for ${employee.name}: Skill ID ${skillId} set to ${level}`
    );

    // Notify employee
    await prisma.notification.create({
      data: {
        userId: targetEmployeeId,
        message: `Your manager ${actor.name} has assessed your proficiency level for skill ID ${skillId} as "${level}".`
      }
    });

    return result;
  }

  static async getEmployeeProficiencies(userId: string) {
    return LearningRepository.listUserProficiencies(userId);
  }

  static async getLeaderboard(monthDate = new Date(), actor?: { role: string; department: string; id: string }) {
    return LearningRepository.getLeaderboard(monthDate, actor);
  }
}
