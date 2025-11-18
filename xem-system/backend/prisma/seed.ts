import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data
  await prisma.budgetTransfer.deleteMany();
  await prisma.approval.deleteMany();
  await prisma.executionRequest.deleteMany();
  await prisma.budgetItem.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.cashFlowItem.deleteMany();
  await prisma.simulation.deleteMany();
  await prisma.financialModel.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Cleared existing data');

  // Create users
  const password = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@xem.com',
      password,
      name: '시스템 관리자',
      role: 'ADMIN',
      department: 'IT',
      position: 'Administrator',
      isActive: true,
    },
  });

  const cfo = await prisma.user.create({
    data: {
      email: 'cfo@xem.com',
      password,
      name: '김재무',
      role: 'CFO',
      department: '재무본부',
      position: 'CFO',
      isActive: true,
    },
  });

  const rmTeam = await prisma.user.create({
    data: {
      email: 'rm@xem.com',
      password,
      name: '박리스크',
      role: 'RM_TEAM',
      department: 'RM팀',
      position: 'RM Team Leader',
      isActive: true,
    },
  });

  const teamLead = await prisma.user.create({
    data: {
      email: 'teamlead@xem.com',
      password,
      name: '이팀장',
      role: 'TEAM_LEAD',
      department: '개발사업팀',
      position: 'Team Leader',
      isActive: true,
    },
  });

  const staff1 = await prisma.user.create({
    data: {
      email: 'staff1@xem.com',
      password,
      name: '최담당',
      role: 'STAFF',
      department: '개발사업팀',
      position: 'Staff',
      isActive: true,
    },
  });

  const staff2 = await prisma.user.create({
    data: {
      email: 'staff2@xem.com',
      password,
      name: '정사원',
      role: 'STAFF',
      department: '개발사업팀',
      position: 'Staff',
      isActive: true,
    },
  });

  const approver1 = await prisma.user.create({
    data: {
      email: 'approver1@xem.com',
      password,
      name: '한승인',
      role: 'APPROVER',
      department: '재무본부',
      position: 'Approver',
      isActive: true,
    },
  });

  const approver2 = await prisma.user.create({
    data: {
      email: 'approver2@xem.com',
      password,
      name: '오권한',
      role: 'APPROVER',
      department: '관리본부',
      position: 'Senior Approver',
      isActive: true,
    },
  });

  console.log('✅ Created 8 users (including 2 APPROVER roles)');

  // Create projects
  const project1 = await prisma.project.create({
    data: {
      code: 'PRJ-2024-001',
      name: '강남 아파트 개발',
      location: '서울시 강남구',
      projectType: 'SELF',
      status: 'ACTIVE',
      landArea: 5000,
      buildingArea: 3000,
      totalFloorArea: 30000,
      units: 300,
      startDate: new Date('2024-01-01'),
      completionDate: new Date('2026-12-31'),
      salesStartDate: new Date('2024-06-01'),
      initialBudget: new Decimal(155000000000), // 1550억
      currentBudget: new Decimal(155000000000),
      executedAmount: new Decimal(99200000000), // 992억 (64%)
      remainingBudget: new Decimal(55800000000),
      executionRate: 64.0,
      expectedProfit: new Decimal(31000000000),
      roi: 20.0,
      riskScore: 45,
      createdById: admin.id,
    },
  });

  const project2 = await prisma.project.create({
    data: {
      code: 'PRJ-2024-002',
      name: '판교 오피스텔',
      location: '경기도 성남시 판교',
      projectType: 'JOINT',
      status: 'ACTIVE',
      landArea: 3000,
      buildingArea: 2000,
      totalFloorArea: 20000,
      units: 200,
      startDate: new Date('2024-03-01'),
      completionDate: new Date('2026-06-30'),
      salesStartDate: new Date('2024-09-01'),
      initialBudget: new Decimal(100000000000), // 1000억
      currentBudget: new Decimal(100000000000),
      executedAmount: new Decimal(75000000000), // 750억 (75%)
      remainingBudget: new Decimal(25000000000),
      executionRate: 75.0,
      expectedProfit: new Decimal(15000000000),
      roi: 15.0,
      riskScore: 65,
      createdById: admin.id,
    },
  });

  const project3 = await prisma.project.create({
    data: {
      code: 'PRJ-2024-003',
      name: '송도 주상복합',
      location: '인천시 송도',
      projectType: 'SPC',
      status: 'ACTIVE',
      landArea: 8000,
      buildingArea: 5000,
      totalFloorArea: 50000,
      units: 500,
      startDate: new Date('2023-06-01'),
      completionDate: new Date('2026-12-31'),
      salesStartDate: new Date('2024-01-01'),
      initialBudget: new Decimal(210000000000), // 2100억
      currentBudget: new Decimal(210000000000),
      executedAmount: new Decimal(189000000000), // 1890억 (90%)
      remainingBudget: new Decimal(21000000000),
      executionRate: 90.0,
      expectedProfit: new Decimal(25000000000),
      roi: 11.9,
      riskScore: 85,
      createdById: admin.id,
    },
  });

  const project4 = await prisma.project.create({
    data: {
      code: 'PRJ-2024-004',
      name: '부산 재개발',
      location: '부산시 해운대구',
      projectType: 'COOPERATIVE',
      status: 'PLANNING',
      landArea: 6000,
      buildingArea: 4000,
      totalFloorArea: 40000,
      units: 400,
      startDate: new Date('2024-09-01'),
      completionDate: new Date('2027-12-31'),
      salesStartDate: new Date('2025-03-01'),
      initialBudget: new Decimal(180000000000), // 1800억
      currentBudget: new Decimal(180000000000),
      executedAmount: new Decimal(54000000000), // 540억 (30%)
      remainingBudget: new Decimal(126000000000),
      executionRate: 30.0,
      expectedProfit: new Decimal(27000000000),
      roi: 15.0,
      riskScore: 35,
      createdById: admin.id,
    },
  });

  console.log('✅ Created 4 projects');

  // Create budget items for Project 1
  const budgetItems = [
    // 수입
    { category: '수입', mainItem: '분양수입', subItem: '아파트 분양', ratio: 1.0 },

    // 지출
    { category: '지출', mainItem: '토지비', subItem: '토지 매입비', ratio: 0.30 },
    { category: '지출', mainItem: '공사비', subItem: '직접공사비', ratio: 0.35 },
    { category: '지출', mainItem: '공사비', subItem: '간접공사비', ratio: 0.10 },
    { category: '지출', mainItem: '설계비', subItem: '설계 및 감리', ratio: 0.03 },
    { category: '지출', mainItem: '부담금', subItem: '학교용지부담금', ratio: 0.03 },
    { category: '지출', mainItem: '부담금', subItem: '광역교통시설부담금', ratio: 0.02 },
    { category: '지출', mainItem: '금융비용', subItem: 'PF 이자', ratio: 0.04 },
    { category: '지출', mainItem: '마케팅비', subItem: '분양대행수수료', ratio: 0.02 },
    { category: '지출', mainItem: '마케팅비', subItem: '광고선전비', ratio: 0.01 },
  ];

  let order = 0;
  for (const item of budgetItems) {
    const amount = new Decimal(155000000000).times(item.ratio);
    const executed = item.category === '지출' ? amount.times(0.64) : new Decimal(0);
    const remaining = amount.minus(executed);
    const rate = executed.dividedBy(amount).times(100).toNumber();

    await prisma.budgetItem.create({
      data: {
        projectId: project1.id,
        category: item.category,
        mainItem: item.mainItem,
        subItem: item.subItem,
        initialBudget: amount,
        currentBudget: amount,
        executedAmount: executed,
        remainingBudget: remaining,
        executionRate: rate,
        displayOrder: order++,
        isActive: true,
      },
    });
  }

  console.log('✅ Created budget items for Project 1');

  // Create budget items for Project 2
  order = 0;
  for (const item of budgetItems) {
    const amount = new Decimal(100000000000).times(item.ratio);
    const executed = item.category === '지출' ? amount.times(0.75) : new Decimal(0);
    const remaining = amount.minus(executed);
    const rate = amount.equals(0) ? 0 : executed.dividedBy(amount).times(100).toNumber();

    await prisma.budgetItem.create({
      data: {
        projectId: project2.id,
        category: item.category,
        mainItem: item.mainItem,
        subItem: item.subItem,
        initialBudget: amount,
        currentBudget: amount,
        executedAmount: executed,
        remainingBudget: remaining,
        executionRate: rate,
        displayOrder: order++,
        isActive: true,
      },
    });
  }

  console.log('✅ Created budget items for Project 2');

  // Create budget items for Project 3
  order = 0;
  for (const item of budgetItems) {
    const amount = new Decimal(210000000000).times(item.ratio);
    const executed = item.category === '지출' ? amount.times(0.90) : new Decimal(0);
    const remaining = amount.minus(executed);
    const rate = amount.equals(0) ? 0 : executed.dividedBy(amount).times(100).toNumber();

    await prisma.budgetItem.create({
      data: {
        projectId: project3.id,
        category: item.category,
        mainItem: item.mainItem,
        subItem: item.subItem,
        initialBudget: amount,
        currentBudget: amount,
        executedAmount: executed,
        remainingBudget: remaining,
        executionRate: rate,
        displayOrder: order++,
        isActive: true,
      },
    });
  }

  console.log('✅ Created budget items for Project 3');

  // Create budget items for Project 4
  order = 0;
  for (const item of budgetItems) {
    const amount = new Decimal(180000000000).times(item.ratio);
    const executed = item.category === '지출' ? amount.times(0.30) : new Decimal(0);
    const remaining = amount.minus(executed);
    const rate = amount.equals(0) ? 0 : executed.dividedBy(amount).times(100).toNumber();

    await prisma.budgetItem.create({
      data: {
        projectId: project4.id,
        category: item.category,
        mainItem: item.mainItem,
        subItem: item.subItem,
        initialBudget: amount,
        currentBudget: amount,
        executedAmount: executed,
        remainingBudget: remaining,
        executionRate: rate,
        displayOrder: order++,
        isActive: true,
      },
    });
  }

  console.log('✅ Created budget items for Project 4');

  // Create a sample execution request
  const budgetItem = await prisma.budgetItem.findFirst({
    where: {
      projectId: project1.id,
      mainItem: '공사비',
    },
  });

  if (budgetItem) {
    const executionRequest = await prisma.executionRequest.create({
      data: {
        requestNumber: 'EXE-2024-0001',
        projectId: project1.id,
        budgetItemId: budgetItem.id,
        requestedById: staff1.id,
        amount: new Decimal(50000000), // 5천만원
        executionDate: new Date(),
        purpose: '지하 주차장 공사 중간 대금',
        description: '1차 진행분에 대한 기성 대금 지급',
        status: 'PENDING',
        currentStep: 2, // 2단계 워크플로우: STAFF 자동 승인 후 APPROVER 대기
        attachments: [],
      },
    });

    // Create approval steps (2-step workflow: STAFF → APPROVER)
    await prisma.approval.createMany({
      data: [
        {
          executionRequestId: executionRequest.id,
          step: 1,
          approverRole: 'STAFF',
          status: 'APPROVED',
          approverId: staff1.id,
          decision: '확인 완료',
          decidedAt: new Date(),
        },
        {
          executionRequestId: executionRequest.id,
          step: 2,
          approverRole: 'APPROVER',
          status: 'PENDING',
        },
      ],
    });

    console.log('✅ Created sample execution request with 2-step approval workflow');
  }

  // Create budget transfer sample data
  const sourceBudgetItem = await prisma.budgetItem.findFirst({
    where: {
      projectId: project1.id,
      mainItem: '공사비',
      subItem: '건축공사',
    },
  });

  const targetBudgetItem = await prisma.budgetItem.findFirst({
    where: {
      projectId: project1.id,
      mainItem: '공사비',
      subItem: '토목공사',
    },
  });

  if (sourceBudgetItem && targetBudgetItem) {
    // 승인된 예산 전용
    const transfer1 = await prisma.budgetTransfer.create({
      data: {
        sourceItemId: sourceBudgetItem.id,
        targetItemId: targetBudgetItem.id,
        amount: new Decimal(200000000), // 2억원
        transferType: 'PARTIAL',
        reason: '토목공사 예산 부족으로 인한 건축공사 예산 전용',
        description: '지하 주차장 추가 공사로 인한 예산 부족 발생',
        status: 'APPROVED',
        createdById: staff1.id,
        approvedById: approver1.id,
        approvedAt: new Date('2024-11-20'),
      },
    });

    // Update budget items to reflect the approved transfer
    await prisma.budgetItem.update({
      where: { id: sourceBudgetItem.id },
      data: {
        currentBudget: sourceBudgetItem.currentBudget.minus(new Decimal(200000000)),
        remainingBudget: sourceBudgetItem.remainingBudget.minus(new Decimal(200000000)),
        executionRate: sourceBudgetItem.currentBudget.minus(new Decimal(200000000)).equals(0)
          ? 0
          : sourceBudgetItem.executedAmount
              .dividedBy(sourceBudgetItem.currentBudget.minus(new Decimal(200000000)))
              .times(100)
              .toNumber(),
        changeReason: `예산 전용: 200,000,000원 전출 (전용 ID: ${transfer1.id})`,
        changedAt: new Date('2024-11-20'),
      },
    });

    await prisma.budgetItem.update({
      where: { id: targetBudgetItem.id },
      data: {
        currentBudget: targetBudgetItem.currentBudget.plus(new Decimal(200000000)),
        remainingBudget: targetBudgetItem.remainingBudget.plus(new Decimal(200000000)),
        executionRate: targetBudgetItem.currentBudget.plus(new Decimal(200000000)).equals(0)
          ? 0
          : targetBudgetItem.executedAmount
              .dividedBy(targetBudgetItem.currentBudget.plus(new Decimal(200000000)))
              .times(100)
              .toNumber(),
        changeReason: `예산 전용: 200,000,000원 전입 (전용 ID: ${transfer1.id})`,
        changedAt: new Date('2024-11-20'),
      },
    });

    // 대기 중인 예산 전용
    await prisma.budgetTransfer.create({
      data: {
        sourceItemId: sourceBudgetItem.id,
        targetItemId: targetBudgetItem.id,
        amount: new Decimal(100000000), // 1억원
        transferType: 'PARTIAL',
        reason: '추가 토목공사 예산 확보',
        description: '우기 대비 배수 시설 추가 공사',
        status: 'PENDING',
        createdById: staff2.id,
      },
    });

    console.log('✅ Created sample budget transfers (1 approved, 1 pending)');
  }

  console.log('\n✅ Seed completed successfully!\n');
  console.log('📧 Test accounts:');
  console.log('   admin@xem.com / password123 (ADMIN)');
  console.log('   cfo@xem.com / password123 (CFO)');
  console.log('   rm@xem.com / password123 (RM_TEAM)');
  console.log('   teamlead@xem.com / password123 (TEAM_LEAD)');
  console.log('   approver1@xem.com / password123 (APPROVER) 👈 NEW');
  console.log('   approver2@xem.com / password123 (APPROVER) 👈 NEW');
  console.log('   staff1@xem.com / password123 (STAFF)');
  console.log('   staff2@xem.com / password123 (STAFF)');
  console.log('\n📊 Sample data:');
  console.log('   - 2 Projects');
  console.log('   - Budget items with execution history');
  console.log('   - 1 Pending execution request (EXE-2024-0001)');
  console.log('   - 1 Approved budget transfer + 1 Pending transfer');
  console.log('   - 2-step approval workflow: STAFF → APPROVER');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
