import prisma from '@/lib/prisma';
import { ApprovalStatus } from '@prisma/client';

export class SkillRepository {
  // --- Standard Skills ---
  static async listAll() {
    return prisma.skill.findMany({
      orderBy: { name: 'asc' }
    });
  }

  static async listByCategory(category: string) {
    return prisma.skill.findMany({
      where: { category },
      orderBy: { name: 'asc' }
    });
  }

  static async findById(id: string) {
    return prisma.skill.findUnique({
      where: { id }
    });
  }

  static async findByName(name: string) {
    return prisma.skill.findUnique({
      where: { name }
    });
  }

  static async create(data: { name: string; category: string; description?: string; isCustom?: boolean }) {
    return prisma.skill.create({
      data: {
        name: data.name,
        category: data.category,
        description: data.description || '',
        isCustom: data.isCustom ?? false
      }
    });
  }

  // --- Skill Requests ---
  static async createRequest(data: {
    skillName: string;
    category: string;
    description?: string;
    requestedById: string;
  }) {
    return prisma.skillRequest.create({
      data: {
        skillName: data.skillName,
        category: data.category,
        description: data.description || '',
        requestedById: data.requestedById,
        status: ApprovalStatus.PENDING
      },
      include: {
        requestedBy: {
          select: { name: true, email: true }
        }
      }
    });
  }

  static async findRequestById(id: string) {
    return prisma.skillRequest.findUnique({
      where: { id },
      include: {
        requestedBy: true,
        approvedBy: true
      }
    });
  }

  static async listRequests() {
    return prisma.skillRequest.findMany({
      include: {
        requestedBy: { select: { id: true, name: true, email: true, role: true, managerId: true, department: true } },
        approvedBy: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async listRequestsByStatus(status: ApprovalStatus) {
    return prisma.skillRequest.findMany({
      where: { status },
      include: {
        requestedBy: { select: { id: true, name: true, email: true, role: true, managerId: true, department: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async updateRequest(
    id: string,
    status: ApprovalStatus,
    approvedById: string,
    comments?: string,
    skillId?: string
  ) {
    return prisma.skillRequest.update({
      where: { id },
      data: {
        status,
        approvedById,
        comments,
        skillId
      }
    });
  }
}
