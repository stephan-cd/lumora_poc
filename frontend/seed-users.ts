import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Wiping current users...');
  // Use TRUNCATE CASCADE to safely wipe the User table and all its foreign key dependencies
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "User" CASCADE;`);

  console.log('Users wiped.');

  const defaultPassword = await bcrypt.hash('password123', 10);

  console.log('Inserting managers and tower head...');
  
  const peer = await prisma.user.create({
    data: {
      employeeId: 'CD-RMT-00071',
      name: 'Peer Mohamed Sharfaraz',
      email: 'sharfarazb@clouddestinations.com',
      githubUsername: 'sharfaraz-cd',
      designation: 'Technical Architect',
      department: 'Software Engineering',
      role: 'REPORTING_MANAGER',
      passwordHash: defaultPassword,
    }
  });

  const nickson = await prisma.user.create({
    data: {
      employeeId: 'CD-CIB01-00280',
      name: 'Nickson Irudaya',
      email: 'nicksoni@clouddestinations.com',
      githubUsername: 'nickson-cd',
      designation: 'Technical Manager',
      department: 'Software Engineering',
      role: 'REPORTING_MANAGER',
      passwordHash: defaultPassword,
    }
  });

  await prisma.user.create({
    data: {
      employeeId: 'CD-MAA01-00440',
      name: 'Victor Charles Vincent',
      email: 'victorv@clouddestinations.com',
      githubUsername: 'victor-cd',
      designation: 'Tower Head - Product Management',
      department: 'Software Engineering',
      role: 'TOWER_HEAD',
      passwordHash: defaultPassword,
    }
  });

  console.log('Inserting team members...');

  // Under Peer Mohamed
  await prisma.user.createMany({
    data: [
      {
        employeeId: 'CD-CIB01-00089',
        name: 'Santhosh Kumar Mani',
        email: 'santhoshm@clouddestinations.com',
        githubUsername: 'santhosh-cd',
        designation: 'Senior Technical Lead',
        department: 'Software Engineering',
        role: 'TEAM_MEMBER',
        passwordHash: defaultPassword,
        managerId: peer.id,
      },
      {
        employeeId: 'CD-CIB01-00103',
        name: 'Hariharasudhan',
        email: 'harit@clouddestinations.com',
        githubUsername: 'hari-cd',
        designation: 'Senior Engineer',
        department: 'Software Engineering',
        role: 'TEAM_MEMBER',
        passwordHash: defaultPassword,
        managerId: peer.id,
      },
      {
        employeeId: 'CD-CIB01-00264',
        name: 'Stephan JohnKennadi',
        email: 'stephanj@clouddestinations.com',
        githubUsername: 'stephan-cd',
        designation: 'Senior Engineer',
        department: 'Software Engineering',
        role: 'TEAM_MEMBER',
        passwordHash: defaultPassword,
        managerId: peer.id,
      }
    ]
  });

  // Under Nickson
  await prisma.user.createMany({
    data: [
      {
        employeeId: 'CD-CIB01-00252',
        name: 'Selvanayagam Siddeswaran',
        email: 'selvanayagams@clouddestinations.com',
        githubUsername: 'selvanayagam-cd',
        designation: 'Senior Engineer',
        department: 'Software Engineering',
        role: 'TEAM_MEMBER',
        passwordHash: defaultPassword,
        managerId: nickson.id,
      },
      {
        employeeId: 'CD-CIB01-00310',
        name: 'Francis Santhosh Sudhaka',
        email: 'francissanthoshs@clouddestinations.com',
        githubUsername: 'francissanthosh-cd',
        designation: 'Associate Engineer',
        department: 'Software Engineering',
        role: 'TEAM_MEMBER',
        passwordHash: defaultPassword,
        managerId: nickson.id,
      },
      {
        employeeId: 'CD-CIB01-00313',
        name: 'Vishnu Prabu Ramar',
        email: 'vishnuprabur@clouddestinations.com',
        githubUsername: 'vishnuprabu-cd',
        designation: 'Associate Engineer',
        department: 'Software Engineering',
        role: 'TEAM_MEMBER',
        passwordHash: defaultPassword,
        managerId: nickson.id,
      }
    ]
  });

  console.log('Seeding complete!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
