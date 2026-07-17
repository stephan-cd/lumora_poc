import prisma from '@/lib/prisma';
import { ApprovalStatus, LearningType, LearningSource, ProficiencyLevel, GoalType } from '@prisma/client';

export class LearningRepository {
  // --- Learning Entries CRUD ---
  static async createEntry(data: {
    userId: string;
    skillId: string;
    date: Date;
    hoursSpent: number;
    learningType: LearningType;
    learningSource: LearningSource;
    description: string;
    attachmentPath?: string;
    status: ApprovalStatus;
  }) {
    return prisma.learningEntry.create({
      data,
      include: {
        skill: true,
        user: { select: { name: true, email: true } }
      }
    });
  }

  static async findEntryById(id: string) {
    return prisma.learningEntry.findUnique({
      where: { id },
      include: {
        skill: true,
        user: { select: { id: true, name: true, email: true, role: true, managerId: true } }
      }
    });
  }

  static async updateEntry(id: string, data: {
    skillId?: string;
    date?: Date;
    hoursSpent?: number;
    learningType?: LearningType;
    learningSource?: LearningSource;
    description?: string;
    attachmentPath?: string;
    status?: ApprovalStatus;
    approverId?: string;
    approvalDate?: Date;
    comments?: string;
  }) {
    return prisma.learningEntry.update({
      where: { id },
      data,
      include: {
        skill: true
      }
    });
  }

  static async deleteEntry(id: string) {
    return prisma.learningEntry.delete({
      where: { id }
    });
  }

  static async listUserHistory(userId: string) {
    return prisma.learningEntry.findMany({
      where: { userId },
      include: {
        skill: true,
        approver: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // --- Approvals ---
  static async listPendingApprovals(managerId: string) {
    return prisma.learningEntry.findMany({
      where: {
        status: ApprovalStatus.PENDING,
        user: {
          managerId: managerId
        }
      },
      include: {
        user: { select: { id: true, name: true, email: true, employeeId: true, role: true } },
        skill: true
      },
      orderBy: { date: 'desc' }
    });
  }

  static async listTowerHeadPending(department?: string) {
    const userFilter: any = { role: 'REPORTING_MANAGER' };
    if (department) {
      userFilter.department = department;
    }
    // Tower Head approves Reporting Managers
    return prisma.learningEntry.findMany({
      where: {
        status: ApprovalStatus.PENDING,
        user: userFilter
      },
      include: {
        user: { select: { id: true, name: true, email: true, employeeId: true, role: true } },
        skill: true
      },
      orderBy: { date: 'desc' }
    });
  }

  static async listApprovalsHistory(managerId: string) {
    return prisma.learningEntry.findMany({
      where: {
        status: { in: [ApprovalStatus.APPROVED, ApprovalStatus.REJECTED] },
        user: {
          managerId: managerId
        }
      },
      include: {
        user: { select: { id: true, name: true, email: true, employeeId: true, role: true } },
        skill: true,
        approver: { select: { name: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });
  }

  static async listTowerHeadApprovalsHistory(department?: string) {
    const userFilter: any = { role: 'REPORTING_MANAGER' };
    if (department) {
      userFilter.department = department;
    }
    return prisma.learningEntry.findMany({
      where: {
        status: { in: [ApprovalStatus.APPROVED, ApprovalStatus.REJECTED] },
        user: userFilter
      },
      include: {
        user: { select: { id: true, name: true, email: true, employeeId: true, role: true } },
        skill: true,
        approver: { select: { name: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });
  }

  static async bulkUpdateStatus(ids: string[], status: ApprovalStatus, approverId: string, comments?: string) {
    return prisma.learningEntry.updateMany({
      where: {
        id: { in: ids },
        status: ApprovalStatus.PENDING
      },
      data: {
        status,
        approverId,
        approvalDate: status === ApprovalStatus.APPROVED ? new Date() : null,
        comments
      }
    });
  }

  // --- Skill Matrix Pivot Core ---
  static async getRawMatrixData(filters: {
    teamId?: string;
    managerId?: string;
    skillId?: string;
    startDate?: Date;
    endDate?: Date;
    department?: string;
  }) {
    const whereClause: any = {};
    const userWhereClause: any = { status: 'ACTIVE' };

    if (filters.managerId) {
      userWhereClause.managerId = filters.managerId;
    }

    if (filters.department) {
      userWhereClause.department = filters.department;
    }

    if (Object.keys(userWhereClause).length > 0) {
      whereClause.user = userWhereClause;
    }

    if (filters.skillId) {
      whereClause.skillId = filters.skillId;
    }

    if (filters.startDate || filters.endDate) {
      whereClause.date = {};
      if (filters.startDate) whereClause.date.gte = filters.startDate;
      if (filters.endDate) whereClause.date.lte = filters.endDate;
    }

    // Only include APPROVED entries for matrix computations
    whereClause.status = ApprovalStatus.APPROVED;

    // Fetch approved learning entries matching criteria
    const entries = await prisma.learningEntry.findMany({
      where: whereClause,
      include: {
        user: { select: { id: true, name: true, employeeId: true, department: true } },
        skill: { select: { id: true, name: true, category: true } }
      }
    });

    // Also fetch skill proficiencies for the corresponding users
    const userIds = Array.from(new Set(entries.map(e => e.userId)));
    const proficiencies = await prisma.skillProficiency.findMany({
      where: { userId: { in: userIds } },
      include: { skill: { select: { name: true } } }
    });

    return { entries, proficiencies };
  }

  // --- Talent Discovery ---
  static async discoverTalent(filters: {
    skillId?: string;
    skillNameQuery?: string;
    minHours?: number;
    proficiencyLevel?: ProficiencyLevel;
  }) {
    const where: any = {
      status: ApprovalStatus.APPROVED
    };

    if (filters.skillId) {
      where.skillId = filters.skillId;
    } else if (filters.skillNameQuery) {
      where.skill = {
        name: {
          contains: filters.skillNameQuery,
          mode: 'insensitive'
        }
      };
    }

    // Fetch aggregate hours by user for the skill
    const logs = await prisma.learningEntry.findMany({
      where,
      include: {
        user: {
          include: {
            manager: { select: { name: true } },
            proficiencies: {
              include: { skill: true }
            },
            commits: {
              include: { reviews: true }
            }
          }
        },
        skill: true
      }
    });

    // Group logs by User + Skill
    const grouped: { [key: string]: {
      userId: string;
      employeeId: string;
      name: string;
      email: string;
      designation: string;
      department: string;
      managerName: string;
      skillName: string;
      hours: number;
      proficiency: string;
      lastLearningDate: Date;
      avgCodeQuality?: number | null;
    }} = {};

    for (const log of logs) {
      const key = `${log.userId}_${log.skillId}`;
      if (!grouped[key]) {
        // Find proficiency for this skill
        const userProf = log.user.proficiencies.find(p => p.skillId === log.skillId);

        // Calculate Code Quality Score
        let totalScore = 0;
        let reviewCount = 0;
        if (log.user.commits) {
          for (const commit of log.user.commits) {
            for (const review of commit.reviews) {
              if (review.status === 'completed') {
                totalScore += review.score;
                reviewCount++;
              }
            }
          }
        }
        const avgCodeQuality = reviewCount > 0 ? Math.round(totalScore / reviewCount) : null;

        grouped[key] = {
          userId: log.user.id,
          employeeId: log.user.employeeId,
          name: log.user.name,
          email: log.user.email,
          designation: log.user.designation,
          department: log.user.department,
          managerName: log.user.manager?.name || 'N/A',
          skillName: log.skill.name,
          hours: 0,
          proficiency: userProf?.level || 'BEGINNER',
          lastLearningDate: log.date,
          avgCodeQuality: avgCodeQuality
        };
      }
      grouped[key].hours += log.hoursSpent;
      if (log.date > grouped[key].lastLearningDate) {
        grouped[key].lastLearningDate = log.date;
      }
    }

    let results = Object.values(grouped);

    // Apply minimum hours filter
    if (filters.minHours !== undefined) {
      results = results.filter(r => r.hours >= filters.minHours!);
    }

    // Apply proficiency level filter
    if (filters.proficiencyLevel) {
      results = results.filter(r => r.proficiency === filters.proficiencyLevel);
    }

    return results;
  }

  // --- Learning Goals ---
  static async getUserGoals(userId: string) {
    return prisma.learningGoal.findMany({
      where: { userId },
      orderBy: { endDate: 'desc' }
    });
  }

  static async upsertGoal(userId: string, data: { type: GoalType; targetHours: number; startDate: Date; endDate: Date }) {
    // Find if a goal for this period already exists
    const existing = await prisma.learningGoal.findFirst({
      where: {
        userId,
        type: data.type,
        startDate: data.startDate,
        endDate: data.endDate
      }
    });

    if (existing) {
      return prisma.learningGoal.update({
        where: { id: existing.id },
        data: { targetHours: data.targetHours }
      });
    }

    return prisma.learningGoal.create({
      data: {
        userId,
        ...data
      }
    });
  }

  // --- Skill Proficiency Management ---
  static async updateProficiency(userId: string, skillId: string, level: ProficiencyLevel, assessedById: string) {
    return prisma.skillProficiency.upsert({
      where: {
        userId_skillId: { userId, skillId }
      },
      update: {
        level,
        assessedById,
        assessedAt: new Date()
      },
      create: {
        userId,
        skillId,
        level,
        assessedById,
        assessedAt: new Date()
      }
    });
  }

  static async listUserProficiencies(userId: string) {
    return prisma.skillProficiency.findMany({
      where: { userId },
      include: {
        skill: true,
        user: { select: { name: true } }
      }
    });
  }

  // --- Leaderboards ---
  static async getLeaderboard(monthDate: Date, actor?: { role: string; department: string; id: string }) {
    const startOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const endOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59);

    const whereClause: any = {
      status: ApprovalStatus.APPROVED,
      date: { gte: startOfMonth, lte: endOfMonth }
    };

    if (actor && actor.role !== 'TRAINING_DEPT') {
      whereClause.user = { department: actor.department };
    }

    // Top Learners: Users by learning hours approved this month
    const userHours = await prisma.learningEntry.groupBy({
      by: ['userId'],
      where: whereClause,
      _sum: { hoursSpent: true },
      orderBy: { _sum: { hoursSpent: 'desc' } },
      take: 10
    });

    // Populate user names
    const topLearners = await Promise.all(
      userHours.map(async (uh) => {
        const u = await prisma.user.findUnique({
          where: { id: uh.userId },
          select: { name: true, employeeId: true, department: true }
        });
        return {
          name: u?.name || 'Unknown',
          employeeId: u?.employeeId || 'N/A',
          department: u?.department || 'N/A',
          hours: uh._sum.hoursSpent || 0
        };
      })
    );

    // Top Skills: Skills by learning hours approved this month
    const skillHours = await prisma.learningEntry.groupBy({
      by: ['skillId'],
      where: whereClause,
      _sum: { hoursSpent: true },
      orderBy: { _sum: { hoursSpent: 'desc' } },
      take: 10
    });

    const topSkills = await Promise.all(
      skillHours.map(async (sh) => {
        const s = await prisma.skill.findUnique({
          where: { id: sh.skillId },
          select: { name: true, category: true }
        });
        return {
          name: s?.name || 'Unknown',
          category: s?.category || 'N/A',
          hours: sh._sum.hoursSpent || 0
        };
      })
    );

    // Top Teams: Departments or sub-teams depending on actor role
    const entries = await prisma.learningEntry.findMany({
      where: whereClause,
      include: {
        user: { 
          select: { 
            department: true,
            manager: { select: { name: true } }
          } 
        }
      }
    });

    const teamHours: { [teamName: string]: number } = {};
    for (const entry of entries) {
      if (actor && actor.role !== 'TRAINING_DEPT') {
        // Group by Reporting Manager
        const managerName = entry.user.manager?.name || 'Direct';
        teamHours[managerName] = (teamHours[managerName] || 0) + entry.hoursSpent;
      } else {
        // Group by Department
        const dept = entry.user.department || 'Other';
        teamHours[dept] = (teamHours[dept] || 0) + entry.hoursSpent;
      }
    }

    const topTeams = Object.entries(teamHours)
      .map(([name, hours]) => ({ name, hours }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 10);

    return { topLearners, topSkills, topTeams };
  }
}
