import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Hash password
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create test users
  const users = [
    {
      email: 'admin@xem.com',
      password: hashedPassword,
      name: '관리자',
      department: '경영지원팀',
      role: UserRole.ADMIN,
      position: '시스템 관리자',
      phoneNumber: '010-1234-5678',
    },
    {
      email: 'cfo@xem.com',
      password: hashedPassword,
      name: '최재무',
      department: '재무팀',
      role: UserRole.CFO,
      position: 'CFO',
      phoneNumber: '010-2345-6789',
    },
    {
      email: 'teamlead@xem.com',
      password: hashedPassword,
      name: '김팀장',
      department: '사업개발팀',
      role: UserRole.TEAM_LEAD,
      position: '팀장',
      phoneNumber: '010-3456-7890',
    },
    {
      email: 'rm@xem.com',
      password: hashedPassword,
      name: '박리스크',
      department: 'RM팀',
      role: UserRole.RM_TEAM,
      position: 'RM 담당자',
      phoneNumber: '010-4567-8901',
    },
    {
      email: 'manager@xem.com',
      password: hashedPassword,
      name: '이매니저',
      department: '사업개발팀',
      role: UserRole.MANAGER,
      position: '매니저',
      phoneNumber: '010-5678-9012',
    },
    {
      email: 'staff@xem.com',
      password: hashedPassword,
      name: '홍사원',
      department: '사업개발팀',
      role: UserRole.STAFF,
      position: '사원',
      phoneNumber: '010-6789-0123',
    },
  ];

  console.log('👤 Creating users...');
  for (const userData of users) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: userData,
    });
    console.log(`✅ Created user: ${user.email} (${user.name}, ${user.role})`);
  }

  console.log('✨ Database seeding completed successfully!');
  console.log('\n📝 Test Account Credentials:');
  console.log('━'.repeat(50));
  console.log('Email: admin@xem.com | Password: password123 | Role: ADMIN');
  console.log('Email: cfo@xem.com | Password: password123 | Role: CFO');
  console.log('Email: teamlead@xem.com | Password: password123 | Role: TEAM_LEAD');
  console.log('Email: rm@xem.com | Password: password123 | Role: RM_TEAM');
  console.log('Email: manager@xem.com | Password: password123 | Role: MANAGER');
  console.log('Email: staff@xem.com | Password: password123 | Role: STAFF');
  console.log('━'.repeat(50));
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
