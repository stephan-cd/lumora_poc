import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    include: {
      learningEntries: {
        where: { status: 'APPROVED' },
        include: { skill: true },
        orderBy: { date: 'desc' }
      },
      commits: {
        include: {
          reviews: {
            include: { issues: true },
            where: { status: 'completed' }
          }
        },
        orderBy: { created_at: 'desc' },
        take: 5
      },
      profileReport: true
    }
  });
  console.log(user ? "User fetched successfully" : "User not found");
}
main().catch(console.error).finally(() => prisma.$disconnect());
