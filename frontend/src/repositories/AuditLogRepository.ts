import prisma from '@/lib/prisma';

export class AuditLogRepository {
  static async log(userId: string | null, action: string, details: string, ipAddress?: string) {
    return prisma.auditLog.create({
      data: {
        userId,
        action,
        details,
        ipAddress: ipAddress || '127.0.0.1'
      }
    });
  }

  static async listAll(limit = 100) {
    return prisma.auditLog.findMany({
      include: {
        user: { select: { name: true, email: true, employeeId: true, role: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }

  static async listByUser(userId: string, limit = 100) {
    return prisma.auditLog.findMany({
      where: { userId },
      include: {
        user: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }
}
