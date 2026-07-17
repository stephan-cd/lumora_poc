import prisma from '@/lib/prisma';
import { LearningProvider, ProviderSyncResult } from './LearningProvider';
import { UdemySyncStatus } from '@prisma/client';
import { AuditLogRepository } from '@/repositories/AuditLogRepository';

export class UdemyProvider implements LearningProvider {
  name = 'Udemy';

  async testConnection(credentials: { clientId: string; clientSecret: string; orgId: string }): Promise<boolean> {
    // If mock credentials, return true instantly
    if (credentials.clientId.startsWith('mock') || credentials.orgId.startsWith('mock')) {
      return true;
    }
    
    try {
      // In a real implementation:
      // const response = await fetch(`https://api.udemy.com/v2.0/organizations/${credentials.orgId}/courses/`, {
      //   headers: {
      //     'Authorization': 'Basic ' + Buffer.from(credentials.clientId + ':' + credentials.clientSecret).toString('base64'),
      //     'Content-Type': 'application/json'
      //   }
      // });
      // return response.status === 200;
      
      return false; // Stub for network access
    } catch {
      return false;
    }
  }

  async syncCourses(credentials: { clientId: string; clientSecret: string; orgId: string }): Promise<ProviderSyncResult> {
    try {
      if (credentials.clientId.startsWith('mock') || credentials.orgId.startsWith('mock')) {
        // Mock courses seeding simulation
        const mockSkills = await prisma.skill.findMany({ take: 5 });
        const categories = ['Development', 'Business', 'Design', 'Marketing'];
        const instructors = ['Angela Yu', 'Jonas Schmedtmann', 'Stephen Grider', 'Colt Steele', 'Academind'];
        
        let createdCount = 0;
        for (let i = 1; i <= 10; i++) {
          const courseId = 2000 + i;
          const skill = mockSkills[i % mockSkills.length];
          
          await prisma.udemyCourse.upsert({
            where: { courseId },
            update: {},
            create: {
              courseId,
              title: `Advanced ${skill?.name || 'Software'} Mastering Course 2026`,
              instructor: instructors[i % instructors.length],
              duration: 10 + i * 2.5,
              category: categories[i % categories.length],
              rating: 4.2 + (i % 8) * 0.1,
              language: 'English',
              url: `https://udemy.com/course-mock-${courseId}`,
              skillId: skill?.id || null
            }
          });
          createdCount++;
        }
        
        return { status: 'SUCCESS', recordsImported: createdCount };
      }
      
      return { status: 'SUCCESS', recordsImported: 0 };
    } catch (err: any) {
      return { status: 'FAILED', recordsImported: 0, errorLogs: err?.message || 'Unknown error during course sync' };
    }
  }

  async syncUserProgress(
    credentials: { clientId: string; clientSecret: string; orgId: string },
    userMapping: { email: string; id: string }[]
  ): Promise<ProviderSyncResult> {
    try {
      if (credentials.clientId.startsWith('mock') || credentials.orgId.startsWith('mock')) {
        const courses = await prisma.udemyCourse.findMany({ take: 5 });
        if (courses.length === 0) {
          return { status: 'SUCCESS', recordsImported: 0 };
        }

        let progressCount = 0;
        for (const user of userMapping) {
          // Skip Tower Head for mock progress
          if (user.email.startsWith('th.')) continue;

          for (const course of courses) {
            // Generate mock progress percent and time spent
            const progressPercent = Math.min(100, Math.floor(Math.random() * 60) + 40); // 40-100%
            const timeSpent = parseFloat(((course.duration * progressPercent) / 100).toFixed(1));

            // Upsert progress
            await prisma.udemyProgress.upsert({
              where: {
                userId_courseId: { userId: user.id, courseId: course.id }
              },
              update: {
                progressPercent,
                timeSpent,
                lastAccessDate: new Date()
              },
              create: {
                userId: user.id,
                courseId: course.id,
                progressPercent,
                timeSpent,
                lastAccessDate: new Date()
              }
            });

            progressCount++;

            // If 100% complete, upsert certification
            if (progressPercent === 100) {
              await prisma.udemyCertification.upsert({
                where: {
                  userId_courseId: { userId: user.id, courseId: course.id }
                },
                update: {
                  completionDate: new Date()
                },
                create: {
                  certificateName: `UC-MOCK-${course.courseId}-${user.id.substring(0, 5).toUpperCase()}`,
                  userId: user.id,
                  courseId: course.id,
                  completionDate: new Date()
                }
              });
            }
          }
        }

        return { status: 'SUCCESS', recordsImported: progressCount };
      }

      return { status: 'SUCCESS', recordsImported: 0 };
    } catch (err: any) {
      return { status: 'FAILED', recordsImported: 0, errorLogs: err?.message || 'Unknown error during progress sync' };
    }
  }
}

export class UdemyService {
  private static provider = new UdemyProvider();

  static async getConfig() {
    let config = await prisma.udemyConfig.findFirst();
    if (!config) {
      // Return a default mock config
      config = await prisma.udemyConfig.create({
        data: {
          clientId: 'mock-client-id',
          clientSecret: 'mock-client-secret',
          orgId: 'mock-org-id',
          syncFrequency: 'daily',
          syncSchedule: '0 0 * * *'
        }
      });
    }
    return config;
  }

  static async updateConfig(data: { clientId: string; clientSecret: string; orgId: string; syncFrequency: string }) {
    const config = await this.getConfig();
    return prisma.udemyConfig.update({
      where: { id: config.id },
      data
    });
  }

  static async testConnection() {
    const config = await this.getConfig();
    return this.provider.testConnection(config);
  }

  static async runManualSync(actorUserId: string) {
    const config = await this.getConfig();
    
    // Log Sync Start
    const syncLog = await prisma.udemySyncLog.create({
      data: {
        status: UdemySyncStatus.RUNNING,
        recordsImported: 0
      }
    });

    try {
      // 1. Sync Courses
      const courseResult = await this.provider.syncCourses(config);
      if (courseResult.status === 'FAILED') {
        throw new Error(courseResult.errorLogs);
      }

      // 2. Fetch Users
      const users = await prisma.user.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true, email: true }
      });

      // 3. Sync User Progress
      const progressResult = await this.provider.syncUserProgress(config, users);
      if (progressResult.status === 'FAILED') {
        throw new Error(progressResult.errorLogs);
      }

      const totalImported = courseResult.recordsImported + progressResult.recordsImported;
      
      // Update Sync Log Success
      await prisma.udemySyncLog.update({
        where: { id: syncLog.id },
        data: {
          status: UdemySyncStatus.SUCCESS,
          recordsImported: totalImported
        }
      });

      await AuditLogRepository.log(actorUserId, 'UDEMY_SYNC_SUCCESS', `Manually triggered Udemy sync. Imported ${totalImported} logs.`);
      return { success: true, recordsImported: totalImported };
    } catch (err: any) {
      // Update Sync Log Failure
      await prisma.udemySyncLog.update({
        where: { id: syncLog.id },
        data: {
          status: UdemySyncStatus.FAILED,
          errorLogs: err?.message || 'Sync failed due to an internal error.'
        }
      });

      await AuditLogRepository.log(actorUserId, 'UDEMY_SYNC_FAILED', `Udemy sync failed: ${err?.message || 'Unknown error'}`);
      return { success: false, error: err?.message || 'Sync failed.' };
    }
  }

  static async listSyncLogs() {
    return prisma.udemySyncLog.findMany({
      orderBy: { syncTime: 'desc' },
      take: 50
    });
  }

  static async listCourses() {
    return prisma.udemyCourse.findMany({
      include: { skill: true }
    });
  }

  static async listProgress() {
    return prisma.udemyProgress.findMany({
      include: {
        user: { select: { name: true, email: true, employeeId: true } },
        course: true
      },
      orderBy: { updatedAt: 'desc' }
    });
  }

  static async listCertifications() {
    return prisma.udemyCertification.findMany({
      include: {
        user: { select: { name: true, employeeId: true } },
        course: true
      },
      orderBy: { completionDate: 'desc' }
    });
  }
}
