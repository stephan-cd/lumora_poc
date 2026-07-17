import { UserRepository } from '@/repositories/UserRepository';
import { AuditLogRepository } from '@/repositories/AuditLogRepository';
import { Role, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

export class UserService {
  static async getUserProfile(id: string) {
    return UserRepository.findById(id);
  }

  static async updateUserProfile(id: string, data: { name?: string; email?: string; designation?: string; department?: string }) {
    const updated = await UserRepository.update(id, data);
    await AuditLogRepository.log(id, 'PROFILE_UPDATE', `Updated user profile details for ${updated.email}`);
    return updated;
  }

  static async changePassword(id: string, currentTextPassword: string, newTextPassword: string) {
    const user = await UserRepository.findById(id);
    if (!user) throw new Error('User not found.');

    const isValid = await bcrypt.compare(currentTextPassword, user.passwordHash);
    if (!isValid) throw new Error('Invalid current password.');

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newTextPassword, salt);

    await UserRepository.update(id, { status: user.status }); // Trigger dummy update with hashed password field directly in DB
    await prisma?.user.update({
      where: { id },
      data: { passwordHash }
    });

    await AuditLogRepository.log(id, 'PASSWORD_CHANGE', `Password changed successfully for ${user.email}`);
    return true;
  }

  // --- Tower Head RBAC User Operations ---
  static async towerHeadCreateManager(actorUserId: string, managerData: {
    employeeId: string;
    name: string;
    email: string;
    designation: string;
    department: string;
  }) {
    // Verify actor is Tower Head
    const actor = await UserRepository.findById(actorUserId);
    if (!actor || actor.role !== Role.TOWER_HEAD) {
      throw new Error('Unauthorized. Only Tower Heads can create Reporting Managers.');
    }

    // Enforce department matching
    if (managerData.department !== actor.department) {
      throw new Error('Unauthorized. Department must match the Tower Head department.');
    }

    // Check email uniqueness
    const existingEmail = await UserRepository.findByEmail(managerData.email);
    if (existingEmail) throw new Error('Email is already registered.');

    // Check Employee ID uniqueness
    const existingEmpId = await UserRepository.findByEmployeeId(managerData.employeeId);
    if (existingEmpId) throw new Error('Employee ID is already registered.');

    // Hash default password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    const newManager = await UserRepository.create({
      ...managerData,
      passwordHash,
      role: Role.REPORTING_MANAGER,
      managerId: actorUserId
    });

    await AuditLogRepository.log(actorUserId, 'USER_CREATE', `Created Reporting Manager: ${newManager.email} (ID: ${newManager.employeeId})`);
    return newManager;
  }

  static async towerHeadEditManager(actorUserId: string, managerId: string, updateData: {
    name?: string;
    designation?: string;
    department?: string;
  }) {
    const actor = await UserRepository.findById(actorUserId);
    if (!actor || actor.role !== Role.TOWER_HEAD) {
      throw new Error('Unauthorized. Only Tower Heads can edit Reporting Managers.');
    }

    const target = await UserRepository.findById(managerId);
    if (!target || target.department !== actor.department || target.managerId !== actorUserId) {
      throw new Error('Unauthorized. Target manager is not in your department or reporting structure.');
    }

    if (updateData.department && updateData.department !== actor.department) {
      throw new Error('Unauthorized. Cannot change manager department to a different department.');
    }

    const updated = await UserRepository.update(managerId, updateData);
    await AuditLogRepository.log(actorUserId, 'USER_UPDATE', `Edited Reporting Manager: ${updated.email}`);
    return updated;
  }

  // --- Reporting Manager RBAC Operations ---
  static async managerCreateTeamMember(actorUserId: string, memberData: {
    employeeId: string;
    name: string;
    email: string;
    designation: string;
    department: string;
  }) {
    const actor = await UserRepository.findById(actorUserId);
    if (!actor || actor.role !== Role.REPORTING_MANAGER) {
      throw new Error('Unauthorized. Only Reporting Managers can create Team Members.');
    }

    // Enforce department matching
    if (memberData.department !== actor.department) {
      throw new Error('Unauthorized. Department must match the Manager department.');
    }

    const existingEmail = await UserRepository.findByEmail(memberData.email);
    if (existingEmail) throw new Error('Email is already registered.');

    const existingEmpId = await UserRepository.findByEmployeeId(memberData.employeeId);
    if (existingEmpId) throw new Error('Employee ID is already registered.');

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    const newMember = await UserRepository.create({
      ...memberData,
      passwordHash,
      role: Role.TEAM_MEMBER,
      managerId: actorUserId
    });

    await AuditLogRepository.log(actorUserId, 'USER_CREATE', `Created Team Member: ${newMember.email} (ID: ${newMember.employeeId})`);
    return newMember;
  }

  static async managerEditTeamMember(actorUserId: string, memberId: string, updateData: {
    name?: string;
    designation?: string;
    department?: string;
  }) {
    const actor = await UserRepository.findById(actorUserId);
    if (!actor || (actor.role !== Role.REPORTING_MANAGER && actor.role !== Role.TOWER_HEAD)) {
      throw new Error('Unauthorized. Only Managers or Tower Heads can edit Team Members.');
    }

    const target = await UserRepository.findById(memberId);
    if (!target || target.department !== actor.department) {
      throw new Error('Unauthorized. Target member is not in your department.');
    }

    if (actor.role === Role.REPORTING_MANAGER && target.managerId !== actorUserId) {
      throw new Error('Unauthorized. You can only edit members in your reporting chain.');
    }

    if (updateData.department && updateData.department !== actor.department) {
      throw new Error('Unauthorized. Cannot change member department to a different department.');
    }

    const updated = await UserRepository.update(memberId, updateData);
    await AuditLogRepository.log(actorUserId, 'USER_UPDATE', `Edited Team Member: ${updated.email}`);
    return updated;
  }

  // --- Common RBAC User Operations ---
  static async disableUser(actorUserId: string, targetUserId: string) {
    const actor = await UserRepository.findById(actorUserId);
    if (!actor || (actor.role !== Role.REPORTING_MANAGER && actor.role !== Role.TOWER_HEAD)) {
      throw new Error('Unauthorized. Only Managers or Tower Heads can disable users.');
    }

    const targetUser = await UserRepository.findById(targetUserId);
    if (!targetUser) throw new Error('Target user not found.');

    // Enforce department boundary
    if (targetUser.department !== actor.department) {
      throw new Error('Unauthorized. Target user is not in your department.');
    }

    // Manager can only disable their own subordinates
    if (actor.role === Role.REPORTING_MANAGER && targetUser.managerId !== actorUserId) {
      throw new Error('Unauthorized. You can only disable members in your reporting chain.');
    }

    const disabled = await UserRepository.disableUser(targetUserId);
    await AuditLogRepository.log(actorUserId, 'USER_DISABLE', `Disabled user: ${disabled.email}`);
    return disabled;
  }

  static async getManagerSubordinates(managerId: string) {
    return UserRepository.listByManager(managerId);
  }

  static async listAllUsers(actorUserId: string) {
    const actor = await UserRepository.findById(actorUserId);
    if (!actor || (actor.role !== Role.TOWER_HEAD && actor.role !== Role.TRAINING_DEPT)) {
      throw new Error('Unauthorized.');
    }
    if (actor.role === Role.TOWER_HEAD) {
      return prisma.user.findMany({
        where: { department: actor.department },
        include: {
          manager: {
            select: { id: true, name: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    }
    return UserRepository.listAll();
  }

  static async getOrganizationHierarchy(actorUserId: string) {
    const actor = await UserRepository.findById(actorUserId);
    if (!actor) throw new Error('User not found.');

    const rawUsers = await UserRepository.getOrganizationHierarchy();

    if (actor.role === Role.TRAINING_DEPT) {
      return this.buildHierarchyTree(rawUsers, null);
    } else if (actor.role === Role.TOWER_HEAD) {
      const rootNode = rawUsers.find(u => u.id === actorUserId);
      if (!rootNode) return [];
      const subtree = this.buildHierarchyTree(rawUsers, actorUserId);
      return [{
        ...rootNode,
        children: subtree
      }];
    } else if (actor.role === Role.REPORTING_MANAGER) {
      // Find the manager user record in hierarchy
      const managerNode = rawUsers.find(u => u.id === actorUserId);
      if (!managerNode) return [];
      const subtree = this.buildHierarchyTree(rawUsers, actorUserId);
      return [{
        ...managerNode,
        children: subtree
      }];
    }
    
    return [rawUsers.find(u => u.id === actorUserId)];
  }

  private static buildHierarchyTree(users: any[], parentId: string | null): any[] {
    return users
      .filter(u => u.managerId === parentId)
      .map(u => ({
        ...u,
        children: this.buildHierarchyTree(users, u.id)
      }));
  }
}
