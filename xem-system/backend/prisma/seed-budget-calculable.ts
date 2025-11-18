import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedBudgetFormulas() {
  console.log('🌱 Seeding budget formulas...');

  const formulas = [
    // 공사비 관련 공식
    {
      name: '인건비 계산',
      category: '공사비',
      formula: 'hours * hourlyRate * workers',
      description: '작업 시간 × 시급 × 인원수',
      variables: ['hours', 'hourlyRate', 'workers'],
    },
    {
      name: '자재비 계산',
      category: '공사비',
      formula: 'quantity * unitPrice * (1 + wastageRate / 100)',
      description: '수량 × 단가 × (1 + 손실률)',
      variables: ['quantity', 'unitPrice', 'wastageRate'],
    },
    {
      name: '면적당 공사비',
      category: '공사비',
      formula: 'totalArea * costPerSqm',
      description: '총 면적 × 평당 공사비',
      variables: ['totalArea', 'costPerSqm'],
    },
    {
      name: '콘크리트 공사비',
      category: '공사비',
      formula: 'volume * unitPrice + (volume * unitPrice * vat / 100)',
      description: '부피 × 단가 + VAT',
      variables: ['volume', 'unitPrice', 'vat'],
    },

    // 설계비 관련 공식
    {
      name: '설계비 (총 공사비 기준)',
      category: '설계비',
      formula: 'totalConstructionCost * designFeeRate / 100',
      description: '총 공사비 × 설계비율',
      variables: ['totalConstructionCost', 'designFeeRate'],
    },
    {
      name: '감리비 (총 공사비 기준)',
      category: '감리비',
      formula: 'totalConstructionCost * supervisionRate / 100',
      description: '총 공사비 × 감리비율',
      variables: ['totalConstructionCost', 'supervisionRate'],
    },

    // 토지비 관련 공식
    {
      name: '토지 매입비',
      category: '토지비',
      formula: 'landArea * pricePerSqm',
      description: '토지 면적 × 평당 가격',
      variables: ['landArea', 'pricePerSqm'],
    },
    {
      name: '토지 취득세',
      category: '토지비',
      formula: 'landPrice * acquisitionTaxRate / 100',
      description: '토지 가격 × 취득세율',
      variables: ['landPrice', 'acquisitionTaxRate'],
    },

    // 금융비용 관련 공식
    {
      name: '월별 이자',
      category: '금융비용',
      formula: 'loanAmount * (annualRate / 12 / 100)',
      description: '대출액 × (연이율 / 12 / 100)',
      variables: ['loanAmount', 'annualRate'],
    },
    {
      name: '총 이자비용',
      category: '금융비용',
      formula: 'loanAmount * annualRate / 100 * loanMonths / 12',
      description: '대출액 × 연이율 × 기간(월) / 12',
      variables: ['loanAmount', 'annualRate', 'loanMonths'],
    },

    // 분양수입 관련 공식
    {
      name: '총 분양수입',
      category: '분양수입',
      formula: 'totalUnits * avgPricePerUnit',
      description: '총 세대수 × 평균 분양가',
      variables: ['totalUnits', 'avgPricePerUnit'],
    },
    {
      name: '실제 분양수입',
      category: '분양수입',
      formula: 'totalUnits * avgPricePerUnit * salesRate / 100',
      description: '총 분양수입 × 분양률',
      variables: ['totalUnits', 'avgPricePerUnit', 'salesRate'],
    },

    // 기타 비용
    {
      name: '부대비용 (비율 기준)',
      category: '부대비용',
      formula: 'totalCost * additionalCostRate / 100',
      description: '총 비용 × 부대비용 비율',
      variables: ['totalCost', 'additionalCostRate'],
    },
    {
      name: '마케팅비 (분양가 기준)',
      category: '마케팅비',
      formula: 'totalSalesRevenue * marketingRate / 100',
      description: '총 분양수입 × 마케팅비율',
      variables: ['totalSalesRevenue', 'marketingRate'],
    },
  ];

  for (const formula of formulas) {
    await prisma.budgetFormula.upsert({
      where: { id: formula.name }, // Using name as unique identifier for seed
      update: formula,
      create: formula,
    });
  }

  console.log(`✅ Created ${formulas.length} budget formulas`);
}

async function seedCommonVariables() {
  console.log('🌱 Seeding common project variables...');

  // Get first project for demo
  const project = await prisma.project.findFirst();

  if (!project) {
    console.log('⚠️  No project found, skipping variable seeding');
    return;
  }

  const variables = [
    { name: 'hourlyRate', value: 30000, unit: '원/시간', description: '시간당 인건비' },
    { name: 'workers', value: 10, unit: '명', description: '작업 인원수' },
    { name: 'hours', value: 8, unit: '시간', description: '일일 작업 시간' },
    { name: 'wastageRate', value: 5, unit: '%', description: '자재 손실률' },
    { name: 'costPerSqm', value: 2500000, unit: '원/m²', description: '평방미터당 공사비' },
    { name: 'vat', value: 10, unit: '%', description: '부가가치세율' },
    { name: 'designFeeRate', value: 3, unit: '%', description: '설계비율' },
    { name: 'supervisionRate', value: 2.5, unit: '%', description: '감리비율' },
    { name: 'acquisitionTaxRate', value: 4, unit: '%', description: '취득세율' },
    { name: 'annualRate', value: 5.5, unit: '%', description: '연이율' },
    { name: 'salesRate', value: 85, unit: '%', description: '목표 분양률' },
    { name: 'marketingRate', value: 2, unit: '%', description: '마케팅비율' },
    { name: 'additionalCostRate', value: 5, unit: '%', description: '부대비용 비율' },
  ];

  for (const variable of variables) {
    await prisma.projectVariable.upsert({
      where: {
        projectId_name: {
          projectId: project.id,
          name: variable.name,
        },
      },
      update: variable,
      create: {
        projectId: project.id,
        ...variable,
      },
    });
  }

  console.log(`✅ Created ${variables.length} project variables for project: ${project.name}`);
}

async function main() {
  try {
    await seedBudgetFormulas();
    await seedCommonVariables();
    console.log('🎉 Budget calculable seed completed!');
  } catch (error) {
    console.error('❌ Error seeding budget calculable data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
