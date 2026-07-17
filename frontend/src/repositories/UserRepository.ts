import prisma from '@/lib/prisma';
import { Role, UserStatus } from '@prisma/client';

export class UserRepository {
  static async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        manager: {
          select: { id: true, name: true, email: true, employeeId: true, role: true }
        }
      }
    });
  }

  static async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: {
        manager: true
      }
    });
  }

  static async findByEmployeeId(employeeId: string) {
    return prisma.user.findUnique({
      where: { employeeId }
    });
  }

  static async create(data: {
    employeeId: string;
    name: string;
    email: string;
    passwordHash: string;
    designation: string;
    department: string;
    role: Role;
    managerId?: string;
  }) {
    return prisma.user.create({
      data: {
        ...data,
        status: UserStatus.ACTIVE
      }
    });
  }

  static async update(id: string, data: {
    name?: string;
    email?: string;
    designation?: string;
    department?: string;
    role?: Role;
    managerId?: string;
    status?: UserStatus;
  }) {
    return prisma.user.update({
      where: { id },
      data
    });
  }

  static async listReportingManagers(department?: string) {
    const whereClause: any = {
      role: Role.REPORTING_MANAGER,
      status: UserStatus.ACTIVE
    };
    if (department) {
      whereClause.department = department;
    }
    return prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        employeeId: true,
        designation: true,
        department: true
      }
    });
  }

  static async listByManager(managerId: string) {
    return prisma.user.findMany({
      where: {
        managerId,
        status: UserStatus.ACTIVE
      },
      select: {
        id: true,
        name: true,
        email: true,
        employeeId: true,
        designation: true,
        department: true,
        role: true,
        createdAt: true
      }
    });
  }

  static async listAll() {
    return prisma.user.findMany({
      include: {
        manager: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async getOrganizationHierarchy() {
    // Fetch all active users with their managers to construct a tree on the server/client
    return prisma.user.findMany({
      where: { status: UserStatus.ACTIVE },
      select: {
        id: true,
        name: true,
        email: true,
        employeeId: true,
        designation: true,
        department: true,
        role: true,
        managerId: true
      }
    });
  }

  static async disableUser(id: string) {
    return prisma.user.update({
      where: { id },
      data: { status: UserStatus.INACTIVE }
    });
  }
}
