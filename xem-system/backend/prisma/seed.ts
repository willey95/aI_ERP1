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
      // Construction phase dates
      constructionStartDate: new Date('2024-01-01'), // 착공일
      currentPhase: 'CONSTRUCTION',
      initialBudget: new Decimal(155000000000), // 1550억
      currentBudget: new Decimal(155000000000),
      executedAmount: new Decimal(99200000000), // 992억 (64%)
      remainingBudget: new Decimal(55800000000), // 558억
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
      remainingBudget: new Decimal(25000000000), // 250억
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
      remainingBudget: new Decimal(21000000000), // 210억
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
      remainingBudget: new Decimal(126000000000), // 1260억
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
    { category: '수입', mainItem: 'PF대출', subItem: 'PF 총액', ratio: 0.62, hasChange: false, pendingExecution: 0, executionRate: 0 },
    { category: '수입', mainItem: '분양수입', subItem: '아파트 분양', ratio: 0.28, hasChange: false, pendingExecution: 0, executionRate: 0 },
    { category: '수입', mainItem: '분양수입', subItem: '상가 분양', ratio: 0.08, hasChange: false, pendingExecution: 0, executionRate: 0 },
    { category: '수입', mainItem: '보조금', subItem: '정부보조금', ratio: 0.02, hasChange: false, pendingExecution: 0, executionRate: 0 },

    // 필수사업비 - 토지비
    { category: '필수사업비', mainItem: '토지비', subItem: '토지 매입비', ratio: 0.235, hasChange: true, pendingExecution: 0, executionRate: 0.95 },
    { category: '필수사업비', mainItem: '토지비', subItem: '취득세 및 등록세', ratio: 0.038, hasChange: false, pendingExecution: 0, executionRate: 0.92 },
    { category: '필수사업비', mainItem: '토지비', subItem: '법무사 수수료', ratio: 0.007, hasChange: false, pendingExecution: 150000000, executionRate: 0.88 },

    // 필수사업비 - 공사비
    { category: '필수사업비', mainItem: '공사비', subItem: '직접공사비', ratio: 0.32, hasChange: false, pendingExecution: 0, executionRate: 0.58 },
    { category: '필수사업비', mainItem: '공사비', subItem: '간접공사비', ratio: 0.095, hasChange: false, pendingExecution: 0, executionRate: 0.61 },
    { category: '필수사업비', mainItem: '공사비', subItem: '가설공사비', ratio: 0.023, hasChange: false, pendingExecution: 800000000, executionRate: 0.45 },
    { category: '필수사업비', mainItem: '공사비', subItem: '토목공사비', ratio: 0.041, hasChange: false, pendingExecution: 0, executionRate: 0.72 },
    { category: '필수사업비', mainItem: '공사비', subItem: '조경공사비', ratio: 0.018, hasChange: false, pendingExecution: 0, executionRate: 0.33 },

    // 필수사업비 - 설계비
    { category: '필수사업비', mainItem: '설계비', subItem: '건축설계', ratio: 0.0165, hasChange: false, pendingExecution: 500000000, executionRate: 0.78 },
    { category: '필수사업비', mainItem: '설계비', subItem: '구조설계', ratio: 0.0075, hasChange: false, pendingExecution: 0, executionRate: 0.85 },
    { category: '필수사업비', mainItem: '설계비', subItem: '기계/전기설계', ratio: 0.0085, hasChange: false, pendingExecution: 250000000, executionRate: 0.70 },
    { category: '필수사업비', mainItem: '설계비', subItem: '감리비', ratio: 0.0125, hasChange: false, pendingExecution: 0, executionRate: 0.52 },

    // 필수사업비 - 부담금
    { category: '필수사업비', mainItem: '부담금', subItem: '학교용지부담금', ratio: 0.028, hasChange: false, pendingExecution: 0, executionRate: 0.80 },
    { category: '필수사업비', mainItem: '부담금', subItem: '광역교통시설부담금', ratio: 0.022, hasChange: false, pendingExecution: 0, executionRate: 0.75 },
    { category: '필수사업비', mainItem: '부담금', subItem: '상하수도원인자부담금', ratio: 0.015, hasChange: true, pendingExecution: 400000000, executionRate: 0.68 },
    { category: '필수사업비', mainItem: '부담금', subItem: '도시가스공급시설비', ratio: 0.008, hasChange: false, pendingExecution: 0, executionRate: 0.72 },
    { category: '필수사업비', mainItem: '부담금', subItem: '개발부담금', ratio: 0.012, hasChange: false, pendingExecution: 0, executionRate: 0.65 },

    // 필수사업비 - 마케팅비
    { category: '필수사업비', mainItem: '마케팅비', subItem: '분양대행수수료', ratio: 0.0185, hasChange: false, pendingExecution: 0, executionRate: 0.42 },
    { category: '필수사업비', mainItem: '마케팅비', subItem: '광고선전비', ratio: 0.0135, hasChange: false, pendingExecution: 200000000, executionRate: 0.55 },
    { category: '필수사업비', mainItem: '마케팅비', subItem: '홍보물 제작비', ratio: 0.0048, hasChange: false, pendingExecution: 0, executionRate: 0.38 },
    { category: '필수사업비', mainItem: '마케팅비', subItem: '모델하우스 운영비', ratio: 0.0092, hasChange: false, pendingExecution: 350000000, executionRate: 0.48 },

    // 필수사업비 - 금융비용
    { category: '필수사업비', mainItem: '금융비용', subItem: 'PF 이자', ratio: 0.035, hasChange: false, pendingExecution: 0, executionRate: 0.88 },
    { category: '필수사업비', mainItem: '금융비용', subItem: 'PF 수수료', ratio: 0.012, hasChange: false, pendingExecution: 0, executionRate: 0.90 },
    { category: '필수사업비', mainItem: '금융비용', subItem: '보증수수료', ratio: 0.0085, hasChange: false, pendingExecution: 0, executionRate: 0.85 },
    { category: '필수사업비', mainItem: '금융비용', subItem: '신탁수수료', ratio: 0.0065, hasChange: false, pendingExecution: 180000000, executionRate: 0.78 },
  ];

  let order = 0;
  for (const item of budgetItems) {
    const initialAmount = new Decimal(155000000000).times(item.ratio);
    // 변경예산 적용 (5% 증액)
    const currentAmount = item.hasChange ? initialAmount.times(1.05) : initialAmount;
    const executed = item.category === '필수사업비' ? currentAmount.times(item.executionRate) : new Decimal(0);
    const pending = new Decimal(item.pendingExecution);
    const remainingBefore = currentAmount.minus(executed);
    const remainingAfter = remainingBefore.minus(pending);
    const rate = currentAmount.equals(0) ? 0 : executed.dividedBy(currentAmount).times(100).toNumber();

    await prisma.budgetItem.create({
      data: {
        projectId: project1.id,
        category: item.category,
        mainItem: item.mainItem,
        subItem: item.subItem,
        initialBudget: initialAmount,
        currentBudget: currentAmount,
        executedAmount: executed,
        remainingBeforeExec: remainingBefore,
        remainingAfterExec: remainingAfter,
        pendingExecutionAmount: pending,
        executionRate: rate,
        displayOrder: order++,
        isActive: true,
        changeReason: item.hasChange ? `${item.mainItem} ${item.subItem} 가격 조정으로 인한 예산 증액 (5%)` : null,
        changedAt: item.hasChange ? new Date('2024-11-10') : null,
      },
    });
  }

  console.log('✅ Created budget items for Project 1');

  // Create budget items for Project 2
  order = 0;
  for (const item of budgetItems) {
    const initialAmount = new Decimal(100000000000).times(item.ratio);
    const currentAmount = item.hasChange ? initialAmount.times(1.05) : initialAmount;
    // Project 2는 진행률이 좀 더 높음
    const executed = item.category === '필수사업비' ? currentAmount.times(Math.min(item.executionRate + 0.15, 1.0)) : new Decimal(0);
    const pending = new Decimal(item.pendingExecution * 0.5); // 절반만 pending
    const remainingBefore = currentAmount.minus(executed);
    const remainingAfter = remainingBefore.minus(pending);
    const rate = currentAmount.equals(0) ? 0 : executed.dividedBy(currentAmount).times(100).toNumber();

    await prisma.budgetItem.create({
      data: {
        projectId: project2.id,
        category: item.category,
        mainItem: item.mainItem,
        subItem: item.subItem,
        initialBudget: initialAmount,
        currentBudget: currentAmount,
        executedAmount: executed,
        remainingBeforeExec: remainingBefore,
        remainingAfterExec: remainingAfter,
        pendingExecutionAmount: pending,
        executionRate: rate,
        displayOrder: order++,
        isActive: true,
        changeReason: item.hasChange ? `${item.mainItem} ${item.subItem} 가격 조정으로 인한 예산 증액 (5%)` : null,
        changedAt: item.hasChange ? new Date('2024-11-10') : null,
      },
    });
  }

  console.log('✅ Created budget items for Project 2');

  // Create budget items for Project 3
  order = 0;
  for (const item of budgetItems) {
    const initialAmount = new Decimal(210000000000).times(item.ratio);
    const currentAmount = item.hasChange ? initialAmount.times(1.05) : initialAmount;
    // Project 3는 거의 완료 단계
    const executed = item.category === '필수사업비' ? currentAmount.times(Math.min(item.executionRate + 0.08, 1.0)) : new Decimal(0);
    const pending = new Decimal(0); // 거의 완료된 프로젝트, pending 없음
    const remainingBefore = currentAmount.minus(executed);
    const remainingAfter = remainingBefore.minus(pending);
    const rate = currentAmount.equals(0) ? 0 : executed.dividedBy(currentAmount).times(100).toNumber();

    await prisma.budgetItem.create({
      data: {
        projectId: project3.id,
        category: item.category,
        mainItem: item.mainItem,
        subItem: item.subItem,
        initialBudget: initialAmount,
        currentBudget: currentAmount,
        executedAmount: executed,
        remainingBeforeExec: remainingBefore,
        remainingAfterExec: remainingAfter,
        pendingExecutionAmount: pending,
        executionRate: rate,
        displayOrder: order++,
        isActive: true,
        changeReason: item.hasChange ? `${item.mainItem} ${item.subItem} 가격 조정으로 인한 예산 증액 (5%)` : null,
        changedAt: item.hasChange ? new Date('2024-11-10') : null,
      },
    });
  }

  console.log('✅ Created budget items for Project 3');

  // Create budget items for Project 4
  order = 0;
  for (const item of budgetItems) {
    const initialAmount = new Decimal(180000000000).times(item.ratio);
    const currentAmount = item.hasChange ? initialAmount.times(1.05) : initialAmount;
    // Project 4는 초기 단계
    const executed = item.category === '필수사업비' ? currentAmount.times(Math.max(item.executionRate - 0.35, 0)) : new Decimal(0);
    const pending = new Decimal(item.pendingExecution * 1.2); // 초기 단계, pending 많음
    const remainingBefore = currentAmount.minus(executed);
    const remainingAfter = remainingBefore.minus(pending);
    const rate = currentAmount.equals(0) ? 0 : executed.dividedBy(currentAmount).times(100).toNumber();

    await prisma.budgetItem.create({
      data: {
        projectId: project4.id,
        category: item.category,
        mainItem: item.mainItem,
        subItem: item.subItem,
        initialBudget: initialAmount,
        currentBudget: currentAmount,
        executedAmount: executed,
        remainingBeforeExec: remainingBefore,
        remainingAfterExec: remainingAfter,
        pendingExecutionAmount: pending,
        executionRate: rate,
        displayOrder: order++,
        isActive: true,
        changeReason: item.hasChange ? `${item.mainItem} ${item.subItem} 가격 조정으로 인한 예산 증액 (5%)` : null,
        changedAt: item.hasChange ? new Date('2024-11-10') : null,
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
    const newSourceCurrent = sourceBudgetItem.currentBudget.minus(new Decimal(200000000));
    const newSourceRemaining = newSourceCurrent.minus(sourceBudgetItem.executedAmount);
    await prisma.budgetItem.update({
      where: { id: sourceBudgetItem.id },
      data: {
        currentBudget: newSourceCurrent,
        remainingBeforeExec: newSourceRemaining,
        remainingAfterExec: newSourceRemaining.minus(sourceBudgetItem.pendingExecutionAmount),
        executionRate: newSourceCurrent.equals(0)
          ? 0
          : sourceBudgetItem.executedAmount
              .dividedBy(newSourceCurrent)
              .times(100)
              .toNumber(),
        changeReason: `예산 전용: 200,000,000원 전출 (전용 ID: ${transfer1.id})`,
        changedAt: new Date('2024-11-20'),
      },
    });

    const newTargetCurrent = targetBudgetItem.currentBudget.plus(new Decimal(200000000));
    const newTargetRemaining = newTargetCurrent.minus(targetBudgetItem.executedAmount);
    await prisma.budgetItem.update({
      where: { id: targetBudgetItem.id },
      data: {
        currentBudget: newTargetCurrent,
        remainingBeforeExec: newTargetRemaining,
        remainingAfterExec: newTargetRemaining.minus(targetBudgetItem.pendingExecutionAmount),
        executionRate: newTargetCurrent.equals(0)
          ? 0
          : targetBudgetItem.executedAmount
              .dividedBy(newTargetCurrent)
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

  // ============================================
  // CASH FLOW ITEMS (CF Table Data)
  // ============================================

  console.log('Creating cash flow items...');

  // Get a reference date for cashflow planning - Starting from Jan 2025
  const cfStartDate = new Date('2025-01-01');
  const currentMonth = 10; // November is month 10 (0-indexed), which is a forecast month

  // Create monthly cash flow items for Project 1 (12 months - Jan to Dec 2025)
  for (let month = 0; month < 12; month++) {
    const plannedDate = new Date(cfStartDate);
    plannedDate.setMonth(cfStartDate.getMonth() + month);

    // Determine if this month has actual data (months 0-9) or forecast data (months 10-11)
    const hasActual = month < currentMonth;

    // ============================================
    // INFLOW: 수입 합계 (Revenue Total Only)
    // ============================================

    // Total Revenue = PF대출 + 분양수입
    const pfLoanBudget = new Decimal(6500000000); // 65억 (PF loan)
    const salesBudget = new Decimal(3500000000); // 35억 (Sales)
    const totalRevenueBudget = pfLoanBudget.plus(salesBudget); // 100억 total

    // Forecast varies by month
    let totalRevenueForecast = totalRevenueBudget;
    if (month < 3) {
      totalRevenueForecast = totalRevenueBudget.times(0.85); // 15% lower in early months (slow start)
    } else if (month >= 3 && month < 6) {
      totalRevenueForecast = totalRevenueBudget.times(0.95); // 5% lower in mid phase
    } else if (month >= 6 && month < 9) {
      totalRevenueForecast = totalRevenueBudget.times(1.10); // 10% higher in peak sales
    } else {
      totalRevenueForecast = totalRevenueBudget.times(1.05); // 5% higher in final phase
    }

    const revenueActual = hasActual ? totalRevenueForecast.times(0.98) : new Decimal(0); // Actual is 98% of forecast
    const revenueVariance = totalRevenueForecast.minus(totalRevenueBudget);

    await prisma.cashFlowItem.create({
      data: {
        projectId: project1.id,
        type: 'INFLOW',
        category: '수입',
        mainItem: '수입 합계',
        subItem: null,
        description: `${month + 1}월 총 수입 (PF대출 + 분양수입)`,
        budgetAmount: totalRevenueBudget,
        forecastAmount: totalRevenueForecast,
        actualAmount: revenueActual,
        varianceAmount: revenueVariance,
        varianceReason: month < 3 ? '초기 분양 부진' : month >= 6 && month < 9 ? '분양 가속화' : null,
        isVarianceApproved: revenueVariance.abs().lessThan(totalRevenueBudget.times(0.05)), // Approved if variance < 5%
        actualExecutionType: 'ACTUAL',
        actualExecutionAmount: revenueActual,
        nominalExecutionAmount: new Decimal(0),
        plannedDate,
        forecastDate: !hasActual ? plannedDate : null,
        actualDate: hasActual ? plannedDate : null,
      },
    });

    // ============================================
    // OUTFLOW 1: 토지비 (Land Cost) - First Priority
    // ============================================

    if (month < 3) {
      const landBudget = new Decimal(month === 0 ? 30000000000 : month === 1 ? 15000000000 : 5000000000); // 300억, 150억, 50억
      const landForecast = landBudget.times(month === 0 ? 1.02 : 1.0); // 2% higher in first month
      const landActual = hasActual ? landForecast : new Decimal(0);
      const landVariance = landForecast.minus(landBudget);

      await prisma.cashFlowItem.create({
        data: {
          projectId: project1.id,
          type: 'OUTFLOW',
          category: '필수사업비',
          mainItem: '토지비',
          subItem: month === 0 ? '토지 매입비' : month === 1 ? '취등록세' : '중도금',
          description: `토지 ${month === 0 ? '매입비' : month === 1 ? '취등록세' : '중도금'} 지급`,
          budgetAmount: landBudget,
          forecastAmount: landForecast,
          actualAmount: landActual,
          varianceAmount: landVariance,
          varianceReason: month === 0 ? '토지 매입 가격 소폭 상승' : null,
          isVarianceApproved: true,
          actualExecutionType: 'ACTUAL',
          actualExecutionAmount: landActual,
          nominalExecutionAmount: new Decimal(0),
          plannedDate,
          forecastDate: !hasActual ? plannedDate : null,
          actualDate: hasActual ? plannedDate : null,
        },
      });
    }

    // ============================================
    // OUTFLOW 2: 공사비 (Construction Cost) - Second Priority
    // ============================================

    // Construction starts from month 2 and continues throughout
    if (month >= 2) {
      const directConstructionBudget = new Decimal(3500000000); // 35억 (직접공사비)
      const indirectConstructionBudget = new Decimal(1000000000); // 10억 (간접공사비)

      // Direct Construction Cost
      let directForecast = directConstructionBudget;
      if (month >= 2 && month < 5) {
        directForecast = directConstructionBudget.times(1.08); // 8% over in early construction
      } else if (month >= 5 && month < 8) {
        directForecast = directConstructionBudget.times(1.03); // 3% over in mid construction
      } else {
        directForecast = directConstructionBudget.times(0.97); // 3% under in late construction (optimization)
      }

      const directActual = hasActual ? directForecast.times(0.99) : new Decimal(0);
      const directVariance = directForecast.minus(directConstructionBudget);

      await prisma.cashFlowItem.create({
        data: {
          projectId: project1.id,
          type: 'OUTFLOW',
          category: '필수사업비',
          mainItem: '공사비',
          subItem: '직접공사비',
          description: `${month + 1}월 직접공사비 집행`,
          budgetAmount: directConstructionBudget,
          forecastAmount: directForecast,
          actualAmount: directActual,
          varianceAmount: directVariance,
          varianceReason: month >= 2 && month < 5 ? '공사 지연 및 자재비 상승' : null,
          isVarianceApproved: directVariance.lessThan(directConstructionBudget.times(0.05)),
          actualExecutionType: month === 3 ? 'SPLIT' : 'ACTUAL',
          actualExecutionAmount: month === 3 ? directActual.times(0.65) : directActual,
          nominalExecutionAmount: month === 3 ? directActual.times(0.35) : new Decimal(0),
          executionNote: month === 3 ? '실집행 65%, 명목집행 35% (선급금)' : null,
          plannedDate,
          forecastDate: !hasActual ? plannedDate : null,
          actualDate: hasActual ? plannedDate : null,
        },
      });

      // Indirect Construction Cost
      let indirectForecast = indirectConstructionBudget;
      if (month >= 2 && month < 5) {
        indirectForecast = indirectConstructionBudget.times(1.05);
      } else {
        indirectForecast = indirectConstructionBudget.times(0.98);
      }

      const indirectActual = hasActual ? indirectForecast.times(1.01) : new Decimal(0);
      const indirectVariance = indirectForecast.minus(indirectConstructionBudget);

      await prisma.cashFlowItem.create({
        data: {
          projectId: project1.id,
          type: 'OUTFLOW',
          category: '필수사업비',
          mainItem: '공사비',
          subItem: '간접공사비',
          description: `${month + 1}월 간접공사비 집행`,
          budgetAmount: indirectConstructionBudget,
          forecastAmount: indirectForecast,
          actualAmount: indirectActual,
          varianceAmount: indirectVariance,
          varianceReason: null,
          isVarianceApproved: true,
          actualExecutionType: 'ACTUAL',
          actualExecutionAmount: indirectActual,
          nominalExecutionAmount: new Decimal(0),
          plannedDate,
          forecastDate: !hasActual ? plannedDate : null,
          actualDate: hasActual ? plannedDate : null,
        },
      });
    }

    // ============================================
    // OUTFLOW 3: 설계비 (Design Cost)
    // ============================================

    if (month === 0 || month === 6) {
      const designBudget = new Decimal(month === 0 ? 2500000000 : 1000000000); // 25억 (initial), 10억 (mid-term)
      const designForecast = designBudget.times(month === 0 ? 1.0 : 0.95);
      const designActual = hasActual ? designForecast : new Decimal(0);
      const designVariance = designForecast.minus(designBudget);

      await prisma.cashFlowItem.create({
        data: {
          projectId: project1.id,
          type: 'OUTFLOW',
          category: '필수사업비',
          mainItem: '설계비',
          subItem: month === 0 ? '설계 및 감리' : '추가 설계 변경',
          description: `${month === 0 ? '초기 설계 및 감리비' : '설계 변경비'}`,
          budgetAmount: designBudget,
          forecastAmount: designForecast,
          actualAmount: designActual,
          varianceAmount: designVariance,
          varianceReason: month === 6 ? '설계 최적화로 비용 절감' : null,
          isVarianceApproved: true,
          actualExecutionType: 'ACTUAL',
          actualExecutionAmount: designActual,
          nominalExecutionAmount: new Decimal(0),
          plannedDate,
          forecastDate: !hasActual ? plannedDate : null,
          actualDate: hasActual ? plannedDate : null,
        },
      });
    }

    // ============================================
    // OUTFLOW 4: 부담금 (Levies)
    // ============================================

    if (month === 1 || month === 2) {
      const levyType = month === 1 ? '학교용지부담금' : '광역교통시설부담금';
      const levyBudget = new Decimal(month === 1 ? 3000000000 : 2000000000); // 30억, 20억
      const levyForecast = levyBudget;
      const levyActual = hasActual ? levyForecast : new Decimal(0);

      await prisma.cashFlowItem.create({
        data: {
          projectId: project1.id,
          type: 'OUTFLOW',
          category: '필수사업비',
          mainItem: '부담금',
          subItem: levyType,
          description: `${levyType} 납부`,
          budgetAmount: levyBudget,
          forecastAmount: levyForecast,
          actualAmount: levyActual,
          varianceAmount: new Decimal(0),
          varianceReason: null,
          isVarianceApproved: true,
          actualExecutionType: 'ACTUAL',
          actualExecutionAmount: levyActual,
          nominalExecutionAmount: new Decimal(0),
          plannedDate,
          forecastDate: !hasActual ? plannedDate : null,
          actualDate: hasActual ? plannedDate : null,
        },
      });
    }

    // ============================================
    // OUTFLOW 5: 마케팅비 (Marketing Cost)
    // ============================================

    if (month >= 3 && month <= 8) {
      const marketingBudget = new Decimal(month === 3 || month === 7 ? 1500000000 : 500000000); // 15억 (peak), 5억 (regular)
      const marketingForecast = marketingBudget.times(month === 3 || month === 7 ? 1.10 : 1.0); // 10% higher in peak months
      const marketingActual = hasActual ? marketingForecast.times(0.97) : new Decimal(0);
      const marketingVariance = marketingForecast.minus(marketingBudget);

      const subItem = month === 3 || month === 7 ? '광고선전비' : '분양대행수수료';

      await prisma.cashFlowItem.create({
        data: {
          projectId: project1.id,
          type: 'OUTFLOW',
          category: '필수사업비',
          mainItem: '마케팅비',
          subItem: subItem,
          description: `${month + 1}월 ${subItem}`,
          budgetAmount: marketingBudget,
          forecastAmount: marketingForecast,
          actualAmount: marketingActual,
          varianceAmount: marketingVariance,
          varianceReason: month === 3 || month === 7 ? '대규모 마케팅 캠페인' : null,
          isVarianceApproved: marketingVariance.lessThan(marketingBudget.times(0.1)),
          actualExecutionType: 'ACTUAL',
          actualExecutionAmount: marketingActual,
          nominalExecutionAmount: new Decimal(0),
          plannedDate,
          forecastDate: !hasActual ? plannedDate : null,
          actualDate: hasActual ? plannedDate : null,
        },
      });
    }

    // ============================================
    // OUTFLOW 6: 금융비용 (Financial Cost) - LAST Priority
    // ============================================

    // Financial costs occur every month from month 1 onwards
    if (month >= 1) {
      const financeBudget = new Decimal(400000000); // 4억 monthly interest
      let financeForecast = financeBudget;

      // Interest increases as more PF is drawn
      if (month >= 1 && month < 4) {
        financeForecast = financeBudget.times(0.8); // Lower in early months
      } else if (month >= 4 && month < 8) {
        financeForecast = financeBudget.times(1.0);
      } else {
        financeForecast = financeBudget.times(1.15); // Higher in later months
      }

      const financeActual = hasActual ? financeForecast : new Decimal(0);
      const financeVariance = financeForecast.minus(financeBudget);

      await prisma.cashFlowItem.create({
        data: {
          projectId: project1.id,
          type: 'OUTFLOW',
          category: '필수사업비',
          mainItem: '금융비용',
          subItem: 'PF 이자',
          description: `${month + 1}월 PF 이자 지급`,
          budgetAmount: financeBudget,
          forecastAmount: financeForecast,
          actualAmount: financeActual,
          varianceAmount: financeVariance,
          varianceReason: month >= 8 ? '후반기 대출 잔액 증가로 이자 증가' : null,
          isVarianceApproved: financeVariance.abs().lessThan(financeBudget.times(0.1)),
          actualExecutionType: 'ACTUAL',
          actualExecutionAmount: financeActual,
          nominalExecutionAmount: new Decimal(0),
          plannedDate,
          forecastDate: !hasActual ? plannedDate : null,
          actualDate: hasActual ? plannedDate : null,
        },
      });
    }
  }

  console.log('✅ Created cash flow items for Project 1 (12 months with variance scenarios)');

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
