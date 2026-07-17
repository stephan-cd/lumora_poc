import { Role } from '@prisma/client';
import NextAuth, { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      employeeId: string;
      designation: string;
      department: string;
      role: Role;
      managerId: string | null;
    } & DefaultSession['user']
  }

  interface User {
    id: string;
    employeeId: string;
    designation: string;
    department: string;
    role: Role;
    managerId: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    employeeId: string;
    designation: string;
    department: string;
    role: Role;
    managerId: string | null;
  }
}
