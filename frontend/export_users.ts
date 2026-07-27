import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  
  if (users.length === 0) {
    console.log("No users found.");
    return;
  }

  const headers = Object.keys(users[0]).join(',');
  const rows = users.map(user => {
    return Object.values(user).map(val => {
      if (val === null) return '';
      if (typeof val === 'string') return `"${val.replace(/"/g, '""')}"`;
      if (val instanceof Date) return `"${val.toISOString()}"`;
      return `"${val}"`;
    }).join(',');
  });

  const csv = [headers, ...rows].join('\n');
  fs.writeFileSync('../current_users.csv', csv);
  console.log("Exported users to ../current_users.csv");
}

main().catch(console.error).finally(() => prisma.$disconnect());
