import { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { Role, UserStatus } from '@prisma/client';

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter an email and password.');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user) {
          throw new Error('No user found with this email.');
        }

        if (user.status === UserStatus.INACTIVE) {
          throw new Error('This account has been disabled. Please contact your administrator.');
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isPasswordValid) {
          throw new Error('Incorrect password.');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          employeeId: user.employeeId,
          designation: user.designation,
          department: user.department,
          role: user.role,
          managerId: user.managerId
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.employeeId = user.employeeId;
        token.designation = user.designation;
        token.department = user.department;
        token.role = user.role;
        token.managerId = user.managerId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.employeeId = token.employeeId as string;
        session.user.designation = token.designation as string;
        session.user.department = token.department as string;
        session.user.role = token.role as Role;
        session.user.managerId = token.managerId as string | null;
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/login'
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60 // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET
};
export default authOptions;
