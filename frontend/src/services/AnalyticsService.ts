import prisma from '@/lib/prisma';
import { ApprovalStatus, Role } from '@prisma/client';
import { UserRepository } from '@/repositories/UserRepository';

export class AnalyticsService {
  // --- TEAM MEMBER DASHBOARD ---
  static async getTeamMemberDashboard(userId: string) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const startOfMonth = new Date(currentYear, currentMonth, 1);

    // 1. Fetch all learning entries
    const entries = await prisma.learningEntry.findMany({
      where: { userId },
      include: { skill: true }
    });

    // 2. Metrics calculation
    const totalHours = entries.reduce((sum, e) => sum + e.hoursSpent, 0);
    const approvedHours = entries.filter(e => e.status === ApprovalStatus.APPROVED).reduce((sum, e) => sum + e.hoursSpent, 0);
    const pendingHours = entries.filter(e => e.status === ApprovalStatus.PENDING).reduce((sum, e) => sum + e.hoursSpent, 0);
    
    // Skills learned (distinct skills in approved entries)
    const skillsLearned = new Set(
      entries.filter(e => e.status === ApprovalStatus.APPROVED).map(e => e.skillId)
    ).size;

    // Monthly learning hours (approved entries this month)
    const monthlyHours = entries
      .filter(e => e.status === ApprovalStatus.APPROVED && e.date >= startOfMonth)
      .reduce((sum, e) => sum + e.hoursSpent, 0);

    // Goal progress (fetching monthly goal)
    const monthlyGoal = await prisma.learningGoal.findFirst({
      where: {
        userId,
        type: 'MONTHLY',
        startDate: { lte: now },
        endDate: { gte: now }
      }
    });

    const goalProgress = {
      targetHours: monthlyGoal?.targetHours || 0,
      achievedHours: monthlyHours,
      percent: monthlyGoal && monthlyGoal.targetHours > 0
        ? Math.min(100, parseFloat(((monthlyHours / monthlyGoal.targetHours) * 100).toFixed(1)))
        : 0
    };

    // 3. Charts: Monthly Learning Trend (approved logs by month for the current year)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyTrend = months.map((month, idx) => {
      const monthHours = entries
        .filter(e => e.status === ApprovalStatus.APPROVED && e.date.getFullYear() === currentYear && e.date.getMonth() === idx)
        .reduce((sum, e) => sum + e.hoursSpent, 0);
      return { month, hours: monthHours };
    });

    // Skill Distribution (approved hours by skill name)
    const skillMap: { [name: string]: number } = {};
    entries
      .filter(e => e.status === ApprovalStatus.APPROVED)
      .forEach(e => {
        skillMap[e.skill.name] = (skillMap[e.skill.name] || 0) + e.hoursSpent;
      });
    const skillDistribution = Object.entries(skillMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // top 5

    // Learning Type Distribution (approved hours by type)
    const typeMap: { [name: string]: number } = {};
    entries
      .filter(e => e.status === ApprovalStatus.APPROVED)
      .forEach(e => {
        typeMap[e.learningType] = (typeMap[e.learningType] || 0) + e.hoursSpent;
      });
    const typeDistribution = Object.entries(typeMap).map(([name, value]) => ({ name, value }));

    return {
      widgets: {
        totalHours,
        approvedHours,
        pendingHours,
        skillsLearned,
        monthlyHours,
        goalProgress
      },
      charts: {
        monthlyTrend,
        skillDistribution,
        typeDistribution
      }
    };
  }

  // --- REPORTING MANAGER DASHBOARD ---
  static async getManagerDashboard(managerId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Fetch team subordinates
    const subordinates = await prisma.user.findMany({
      where: { managerId, status: 'ACTIVE' }
    });
    const subIds = subordinates.map(s => s.id);

    // Fetch all logs of subordinates
    const entries = await prisma.learningEntry.findMany({
      where: { userId: { in: subIds } },
      include: { skill: true, user: { select: { name: true } } }
    });

    // Metrics
    const approvedEntries = entries.filter(e => e.status === ApprovalStatus.APPROVED);
    const teamLearningHours = approvedEntries.reduce((sum, e) => sum + e.hoursSpent, 0);
    const pendingApprovals = entries.filter(e => e.status === ApprovalStatus.PENDING).length;

    // Active Learners (logged hours this month)
    const activeLearnerIds = new Set(
      entries.filter(e => e.date >= startOfMonth).map(e => e.userId)
    );
    const activeLearners = activeLearnerIds.size;

    // Team Skill Coverage (distinct skills with approved hours in team)
    const teamSkillCoverage = new Set(approvedEntries.map(e => e.skillId)).size;

    // Charts: Team Learning Trend (Approved team hours by month for current year)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = now.getFullYear();
    const teamLearningTrend = months.map((month, idx) => {
      const monthHours = approvedEntries
        .filter(e => e.date.getFullYear() === currentYear && e.date.getMonth() === idx)
        .reduce((sum, e) => sum + e.hoursSpent, 0);
      return { month, hours: monthHours };
    });

    // Team Skill Distribution
    const skillMap: { [name: string]: number } = {};
    approvedEntries.forEach(e => {
      skillMap[e.skill.name] = (skillMap[e.skill.name] || 0) + e.hoursSpent;
    });
    const teamSkillDistribution = Object.entries(skillMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    // Top Learners (within team, by approved hours)
    const learnerMap: { [name: string]: number } = {};
    approvedEntries.forEach(e => {
      learnerMap[e.user.name] = (learnerMap[e.user.name] || 0) + e.hoursSpent;
    });
    const topLearners = Object.entries(learnerMap)
      .map(([name, hours]) => ({ name, hours }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 5);

    // Learning Hours by Skill
    const learningHoursBySkill = Object.entries(skillMap)
      .map(([skill, hours]) => ({ skill, hours }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 8);

    return {
      widgets: {
        teamLearningHours,
        pendingApprovals,
        activeLearners,
        teamSkillCoverage
      },
      charts: {
        teamLearningTrend,
        teamSkillDistribution,
        topLearners,
        learningHoursBySkill
      }
    };
  }

  // --- TOWER HEAD / TRAINING DEPT DASHBOARD ---
  static async getTowerHeadDashboard(actorUserId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Verify Tower Head or Training Department
    const actor = await UserRepository.findById(actorUserId);
    if (!actor || (actor.role !== Role.TOWER_HEAD && actor.role !== Role.TRAINING_DEPT)) {
      throw new Error('Unauthorized.');
    }

    const whereClause: any = {};
    if (actor.role === Role.TOWER_HEAD) {
      whereClause.user = { department: actor.department };
    }

    // Fetch scoped logs
    const entries = await prisma.learningEntry.findMany({
      where: whereClause,
      include: { skill: true, user: { include: { manager: true } } }
    });

    const approvedEntries = entries.filter(e => e.status === ApprovalStatus.APPROVED);

    // Metrics
    const orgLearningHours = approvedEntries.reduce((sum, e) => sum + e.hoursSpent, 0);
    
    // Active Learners (logged hours this month in scope)
    const activeLearners = new Set(
      entries.filter(e => e.date >= startOfMonth).map(e => e.userId)
    ).size;

    // Unique skills with approved hours
    const skillCoverage = new Set(approvedEntries.map(e => e.skillId)).size;
    const totalSkills = await prisma.skill.count();

    // Pending Approvals count (both team members and managers)
    const pendingApprovals = entries.filter(e => e.status === ApprovalStatus.PENDING).length;

    // Charts: Learning Trend (Approved hours by month)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = now.getFullYear();
    const learningTrend = months.map((month, idx) => {
      const monthHours = approvedEntries
        .filter(e => e.date.getFullYear() === currentYear && e.date.getMonth() === idx)
        .reduce((sum, e) => sum + e.hoursSpent, 0);
      return { month, hours: monthHours };
    });

    // Team Comparison
    // If Training Department: compare by Department
    // If Tower Head: compare by Reporting Manager (subteams) in their department
    let teamComparison;
    if (actor.role === Role.TRAINING_DEPT) {
      const deptHours: { [dept: string]: number } = {};
      approvedEntries.forEach(e => {
        const dept = e.user.department || 'Other';
        deptHours[dept] = (deptHours[dept] || 0) + e.hoursSpent;
      });
      teamComparison = Object.entries(deptHours).map(([name, hours]) => ({ name, hours }));
    } else {
      const managerHours: { [manager: string]: number } = {};
      approvedEntries.forEach(e => {
        const mName = e.user.manager?.name || 'Direct';
        managerHours[mName] = (managerHours[mName] || 0) + e.hoursSpent;
      });
      teamComparison = Object.entries(managerHours).map(([name, hours]) => ({ name, hours }));
    }

    // Skill Growth Trend (Mock trend representation by categories)
    const skillGrowthTrend = [
      { month: 'Jan', AI: 120, Cloud: 85, Frontend: 140 },
      { month: 'Feb', AI: 140, Cloud: 90, Frontend: 155 },
      { month: 'Mar', AI: 190, Cloud: 110, Frontend: 160 },
      { month: 'Apr', AI: 220, Cloud: 130, Frontend: 175 },
      { month: 'May', AI: 290, Cloud: 150, Frontend: 180 },
      { month: 'Jun', AI: 350, Cloud: 185, Frontend: 210 },
    ];

    // Learning Hours by Department/Team
    const learningHoursByDepartment = teamComparison;

    // Skill Heatmap data format
    // Groups hours by Skill Category + Department/Manager
    const heatmapMap: { [catGroup: string]: number } = {};
    approvedEntries.forEach(e => {
      const groupKey = actor.role === Role.TRAINING_DEPT 
        ? (e.user.department || 'Other')
        : (e.user.manager?.name || 'Direct');
      const key = `${e.skill.category}||${groupKey}`;
      heatmapMap[key] = (heatmapMap[key] || 0) + e.hoursSpent;
    });

    const skillHeatmap = Object.entries(heatmapMap).map(([key, hours]) => {
      const [category, groupVal] = key.split('||');
      return { category, department: groupVal, hours: parseFloat(hours.toFixed(1)) };
    });

    return {
      widgets: {
        orgLearningHours,
        activeLearners,
        skillCoverage,
        totalSkills,
        pendingApprovals
      },
      charts: {
        learningTrend,
        teamComparison,
        skillGrowthTrend,
        learningHoursByDepartment,
        skillHeatmap
      }
    };
  }

  // --- Skill Gap Analysis (Admin/Tower Head/Training Department) ---
  static async getSkillGapAnalysis(actorUserId: string) {
    const actor = await UserRepository.findById(actorUserId);
    if (!actor || (actor.role !== Role.TOWER_HEAD && actor.role !== Role.TRAINING_DEPT)) {
      throw new Error('Unauthorized.');
    }

    const entryWhere: any = { status: ApprovalStatus.APPROVED };
    if (actor.role === Role.TOWER_HEAD) {
      entryWhere.user = { department: actor.department };
    }

    // 1. Missing Skills (Skills that exist globally but have 0 learning hours approved in scope)
    const approvedEntries = await prisma.learningEntry.findMany({
      where: entryWhere,
      select: { skillId: true }
    });
    const learnedSkillIds = new Set(approvedEntries.map(e => e.skillId));
    
    const allSkills = await prisma.skill.findMany();
    const missingSkills = allSkills
      .filter(s => !learnedSkillIds.has(s.id))
      .slice(0, 15) // Limit to top 15
      .map(s => ({ id: s.id, name: s.name, category: s.category }));

    // 2. Low Adoption Skills (Learned for less than 10 total approved hours in scope)
    const lowAdoptionWhere: any = { status: ApprovalStatus.APPROVED };
    if (actor.role === Role.TOWER_HEAD) {
      lowAdoptionWhere.user = { department: actor.department };
    }

    const skillHours = await prisma.learningEntry.groupBy({
      by: ['skillId'],
      where: lowAdoptionWhere,
      _sum: { hoursSpent: true },
      having: {
        hoursSpent: {
          _sum: { lte: 10 }
        }
      }
    });

    const lowAdoptionSkills = await Promise.all(
      skillHours.map(async (sh) => {
        const s = await prisma.skill.findUnique({ where: { id: sh.skillId } });
        return {
          name: s?.name || 'Unknown',
          category: s?.category || 'N/A',
          totalHours: sh._sum.hoursSpent || 0
        };
      })
    );

    // 3. Emerging Skills (Skills logged heavily in the last 30 days in scope)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentWhere: any = {
      status: ApprovalStatus.APPROVED,
      date: { gte: thirtyDaysAgo }
    };
    if (actor.role === Role.TOWER_HEAD) {
      recentWhere.user = { department: actor.department };
    }

    const recentSkillHours = await prisma.learningEntry.groupBy({
      by: ['skillId'],
      where: recentWhere,
      _sum: { hoursSpent: true },
      orderBy: { _sum: { hoursSpent: 'desc' } },
      take: 5
    });

    const emergingSkills = await Promise.all(
      recentSkillHours.map(async (rsh) => {
        const s = await prisma.skill.findUnique({ where: { id: rsh.skillId } });
        return {
          name: s?.name || 'Unknown',
          category: s?.category || 'N/A',
          recentHours: rsh._sum.hoursSpent || 0
        };
      })
    );

    return {
      missingSkills,
      lowAdoptionSkills,
      emergingSkills
    };
  }
}
