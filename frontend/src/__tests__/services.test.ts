import { UserService } from '../services/UserService';
import { LearningService } from '../services/LearningService';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';

// Mock Prisma Client singleton
jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    learningEntry: {
      create: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  },
}));

describe('UserService Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw an error if the user to update password does not exist', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(
      UserService.changePassword('invalid-id', 'currentPass', 'newPass')
    ).rejects.toThrow('User not found.');
  });

  it('should throw an error if the current password is incorrect during change password', async () => {
    const mockUser = {
      id: 'user-id',
      email: 'dev@skilltrack.com',
      passwordHash: 'hashed-old-password',
    };
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    
    // Stub bcrypt compare to return false
    jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));

    await expect(
      UserService.changePassword('user-id', 'wrongCurrentPass', 'newPass123')
    ).rejects.toThrow('Invalid current password.');
  });
});

describe('LearningService Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully submit a learning log in pending status and trigger a notification', async () => {
    const mockUser = {
      id: 'dev-user-id',
      name: 'Developer Test',
      email: 'dev.test@skilltrack.com',
      role: 'TEAM_MEMBER',
      managerId: 'manager-id',
    };
    
    const mockSkill = {
      id: 'skill-id',
      name: 'TypeScript',
    };

    const mockCreatedLog = {
      id: 'log-id',
      userId: 'dev-user-id',
      skillId: 'skill-id',
      hoursSpent: 5,
      skill: mockSkill,
    };

    // Mocks
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (prisma.learningEntry.create as jest.Mock).mockResolvedValue(mockCreatedLog);

    const logData = {
      skillId: 'skill-id',
      date: new Date(),
      hoursSpent: 5,
      learningType: 'COURSE' as any,
      learningSource: 'UDEMY' as any,
      description: 'Completed TypeScript course modules 1-3',
    };

    const result = await LearningService.submitLog('dev-user-id', logData);

    expect(prisma.learningEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'dev-user-id',
          skillId: 'skill-id',
          hoursSpent: 5,
          status: 'PENDING',
        }),
      })
    );

    // Verify manager notification was fired
    expect(prisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'manager-id',
        }),
      })
    );

    expect(result.id).toBe('log-id');
  });
});
