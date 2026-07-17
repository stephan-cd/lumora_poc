import { SkillRepository } from '@/repositories/SkillRepository';
import { UserRepository } from '@/repositories/UserRepository';
import { AuditLogRepository } from '@/repositories/AuditLogRepository';
import { ApprovalStatus, Role } from '@prisma/client';
import prisma from '@/lib/prisma';

export class SkillService {
  static async listSkills() {
    return SkillRepository.listAll();
  }

  static async addAdminSkill(actorUserId: string, data: { name: string; category: string; description?: string }) {
    const actor = await UserRepository.findById(actorUserId);
    if (!actor || actor.role !== Role.TOWER_HEAD) {
      throw new Error('Unauthorized. Only Tower Heads can add skills directly.');
    }

    const existing = await SkillRepository.findByName(data.name);
    if (existing) {
      throw new Error('A skill with this name already exists.');
    }

    const newSkill = await SkillRepository.create({
      ...data,
      isCustom: false
    });

    await AuditLogRepository.log(actorUserId, 'SKILL_CREATE', `Created global skill: ${newSkill.name} in category ${newSkill.category}`);
    return newSkill;
  }

  // --- Skill Request Workflow ---
  static async requestCustomSkill(actorUserId: string, data: { skillName: string; category: string; description?: string }) {
    const user = await UserRepository.findById(actorUserId);
    if (!user) throw new Error('User not found.');

    // Check if skill already exists globally
    const existing = await SkillRepository.findByName(data.skillName);
    if (existing) {
      throw new Error('A skill with this name already exists in the repository.');
    }

    // Check if a pending request with the same name exists
    const requests = await SkillRepository.listRequestsByStatus(ApprovalStatus.PENDING);
    const duplicateRequest = requests.find(r => r.skillName.toLowerCase() === data.skillName.toLowerCase());
    if (duplicateRequest) {
      throw new Error('A request for this skill is already pending approval.');
    }

    const request = await SkillRepository.createRequest({
      skillName: data.skillName,
      category: data.category,
      description: data.description,
      requestedById: actorUserId
    });

    await AuditLogRepository.log(actorUserId, 'SKILL_REQUEST', `Submitted skill request: "${request.skillName}" in category ${request.category}`);

    // Create notification for the manager
    if (user.role === Role.TEAM_MEMBER && user.managerId) {
      await prisma.notification.create({
        data: {
          userId: user.managerId,
          message: `Team Member ${user.name} has requested a new skill: "${request.skillName}".`
        }
      });
    } else if (user.role === Role.REPORTING_MANAGER) {
      // Find a Tower Head of the same department to notify
      const towerHeads = await prisma.user.findMany({
        where: {
          role: Role.TOWER_HEAD,
          department: user.department
        }
      });
      for (const th of towerHeads) {
        await prisma.notification.create({
          data: {
            userId: th.id,
            message: `Reporting Manager ${user.name} has requested a new skill: "${request.skillName}".`
          }
        });
      }
    }

    return request;
  }

  static async listPendingRequests(actorUserId: string) {
    const actor = await UserRepository.findById(actorUserId);
    if (!actor) throw new Error('User not found.');

    const rawRequests = await SkillRepository.listRequestsByStatus(ApprovalStatus.PENDING);

    // Tower head sees requests from Reporting Managers within their department
    // Reporting Manager sees requests from their Team Members
    if (actor.role === Role.TOWER_HEAD) {
      return rawRequests.filter(r => r.requestedBy.role === Role.REPORTING_MANAGER && r.requestedBy.department === actor.department);
    } else if (actor.role === Role.TRAINING_DEPT) {
      return rawRequests; // training department can see all pending requests
    } else if (actor.role === Role.REPORTING_MANAGER) {
      return rawRequests.filter(r => r.requestedBy.managerId === actorUserId);
    }

    return [];
  }

  static async listAllRequestsHistory(actorUserId: string) {
    const actor = await UserRepository.findById(actorUserId);
    if (!actor) throw new Error('User not found.');

    const allRequests = await SkillRepository.listRequests();

    if (actor.role === Role.TRAINING_DEPT) {
      return allRequests;
    } else if (actor.role === Role.TOWER_HEAD) {
      return allRequests.filter(r => 
        (r.requestedBy.role === Role.REPORTING_MANAGER && r.requestedBy.department === actor.department) || 
        (r.status !== ApprovalStatus.PENDING && r.requestedBy.department === actor.department)
      );
    } else if (actor.role === Role.REPORTING_MANAGER) {
      return allRequests.filter(r => r.requestedBy.managerId === actorUserId || r.requestedById === actorUserId);
    }
    
    return allRequests.filter(r => r.requestedById === actorUserId);
  }

  static async handleSkillRequest(actorUserId: string, requestId: string, status: 'APPROVED' | 'REJECTED', comments?: string) {
    const actor = await UserRepository.findById(actorUserId);
    if (!actor) throw new Error('User not found.');

    const request = await SkillRepository.findRequestById(requestId);
    if (!request) throw new Error('Skill request not found.');
    if (request.status !== ApprovalStatus.PENDING) {
      throw new Error('This request has already been processed.');
    }

    // Verify Hierarchy approval authorization
    if (request.requestedBy.role === Role.TEAM_MEMBER) {
      if (actor.role !== Role.REPORTING_MANAGER || request.requestedBy.managerId !== actorUserId) {
        throw new Error('Unauthorized. Only the direct reporting manager can approve this request.');
      }
    } else if (request.requestedBy.role === Role.REPORTING_MANAGER) {
      if (actor.role !== Role.TOWER_HEAD) {
        throw new Error('Unauthorized. Only Tower Heads can approve Reporting Manager requests.');
      }
    } else {
      throw new Error('Invalid request source.');
    }

    let skillId: string | undefined = undefined;

    if (status === 'APPROVED') {
      // Create new global skill in standard table
      const newSkill = await SkillRepository.create({
        name: request.skillName,
        category: request.category,
        description: request.description || `Approved custom skill request for ${request.skillName}`,
        isCustom: true
      });
      skillId = newSkill.id;

      await AuditLogRepository.log(
        actorUserId,
        'SKILL_REQUEST_APPROVE',
        `Approved skill request: "${request.skillName}". Added to global skills.`
      );

      // Notify the requester
      await prisma.notification.create({
        data: {
          userId: request.requestedById,
          message: `Your skill request for "${request.skillName}" has been APPROVED.`
        }
      });
    } else {
      await AuditLogRepository.log(actorUserId, 'SKILL_REQUEST_REJECT', `Rejected skill request: "${request.skillName}"`);

      // Notify the requester
      await prisma.notification.create({
        data: {
          userId: request.requestedById,
          message: `Your skill request for "${request.skillName}" has been REJECTED. Comments: ${comments || 'None'}`
        }
      });
    }

    // Save final status in requests logs table
    return SkillRepository.updateRequest(
      requestId,
      status === 'APPROVED' ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED,
      actorUserId,
      comments,
      skillId
    );
  }
}
