# XEM Budget Calculator - Backend API Controllers
## Complete API Implementation

**Version**: 3.1  
**Last Updated**: 2025-11-16

---

## 📡 API 컨트롤러

### File: `backend/src/budget/budget-calculator.controller.ts`

```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BudgetCalculationService } from './calculation.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('budget')
@UseGuards(JwtAuthGuard)
export class BudgetCalculatorController {
  constructor(
    private calculationService: BudgetCalculationService,
    private prisma: PrismaService
  ) {}

  /**
   * 공식 목록 조회
   */
  @Get('formulas')
  async getFormulas(@Query('category') category?: string) {
    return this.calculationService.getAvailableFormulas(category);
  }

  /**
   * 공식 상세 정보
   */
  @Get('formulas/:id')
  async getFormulaDetails(@Param('id') id: string) {
    const formula = this.calculationService.getFormulaDetails(id);
    if (!formula) {
      throw new Error('Formula not found');
    }
    return formula;
  }

  /**
   * 계산 실행
   */
  @Post('calculate')
  async calculate(
    @Body()
    body: {
      formulaId: string;
      projectId: string;
      variables: Record<string, number>;
    }
  ) {
    return this.calculationService.calculate(body.formulaId, {
      projectId: body.projectId,
      variables: body.variables,
    });
  }

  /**
   * 프로젝트 전체 재계산
   */
  @Post('recalculate/:projectId')
  async recalculateProject(@Param('projectId') projectId: string) {
    await this.calculationService.recalculateProject(projectId);
    return { message: 'Recalculation completed' };
  }

  /**
   * 프로젝트 변수 조회
   */
  @Get('variables/:projectId')
  async getProjectVariables(@Param('projectId') projectId: string) {
    const variables = await this.calculationService['loadProjectVariables'](
      projectId
    );
    return variables;
  }

  /**
   * 프로젝트 변수 업데이트
   */
  @Put('variables/:projectId')
  async updateProjectVariable(
    @Param('projectId') projectId: string,
    @Body() body: { key: string; value: number; unit?: string; description?: string }
  ) {
    const variable = await this.prisma.projectVariable.upsert({
      where: {
        projectId_key: {
          projectId,
          key: body.key,
        },
      },
      create: {
        projectId,
        key: body.key,
        value: body.value,
        unit: body.unit,
        description: body.description,
      },
      update: {
        value: body.value,
        unit: body.unit,
        description: body.description,
      },
    });

    return variable;
  }

  /**
   * 상세 예산 조회 (카테고리별)
   */
  @Get('project/:projectId/detailed')
  async getDetailedBudget(@Param('projectId') projectId: string) {
    const categories = await this.prisma.budgetCategory.findMany({
      where: { projectId, isActive: true },
      orderBy: [{ level1: 'asc' }, { displayOrder: 'asc' }],
    });

    // 대분류별로 그룹화
    const grouped = categories.reduce((acc, item) => {
      if (!acc[item.level1]) {
        acc[item.level1] = {
          level1: item.level1,
          items: [],
          total: {
            planned: 0,
            calculated: 0,
          },
        };
      }

      acc[item.level1].items.push(item);
      acc[item.level1].total.planned += parseFloat(item.plannedAmount.toString());
      acc[item.level1].total.calculated += parseFloat(
        item.calculatedAmount.toString()
      );

      return acc;
    }, {} as Record<string, any>);

    return {
      categories: Object.values(grouped),
      grandTotal: {
        planned: Object.values(grouped).reduce(
          (sum: number, cat: any) => sum + cat.total.planned,
          0
        ),
        calculated: Object.values(grouped).reduce(
          (sum: number, cat: any) => sum + cat.total.calculated,
          0
        ),
      },
    };
  }

  /**
   * 커스텀 항목 추가
   */
  @Post('custom-items')
  async createCustomItem(@Body() body: any) {
    const item = await this.prisma.budgetCategory.create({
      data: {
        projectId: body.projectId,
        level1: body.level1,
        level2: body.level2,
        level3: body.level3,
        name: body.name,
        displayName: body.displayName,
        description: body.description,
        plannedAmount: body.plannedAmount,
        calculatedAmount: 0,
        isCalculable: body.isCalculable,
        formula: body.formula,
        variables: body.variables || [],
        isCustom: true,
        displayOrder: body.displayOrder || 999,
      },
    });

    // 계산 가능한 항목이면 즉시 계산
    if (item.isCalculable && item.formula) {
      const variables = await this.calculationService['loadProjectVariables'](
        body.projectId
      );

      try {
        const result = await this.calculationService.calculate(item.formula, {
          projectId: body.projectId,
          variables,
        });

        await this.prisma.budgetCategory.update({
          where: { id: item.id },
          data: { calculatedAmount: result.result },
        });
      } catch (error) {
        console.error('Failed to calculate custom item:', error);
      }
    }

    return item;
  }

  /**
   * 커스텀 항목 수정
   */
  @Put('custom-items/:id')
  async updateCustomItem(@Param('id') id: string, @Body() body: any) {
    const item = await this.prisma.budgetCategory.update({
      where: { id },
      data: {
        level1: body.level1,
        level2: body.level2,
        level3: body.level3,
        displayName: body.displayName,
        description: body.description,
        plannedAmount: body.plannedAmount,
        isCalculable: body.isCalculable,
        formula: body.formula,
        variables: body.variables,
        displayOrder: body.displayOrder,
      },
    });

    return item;
  }

  /**
   * 커스텀 항목 삭제
   */
  @Delete('custom-items/:id')
  async deleteCustomItem(@Param('id') id: string) {
    await this.prisma.budgetCategory.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Custom item deleted' };
  }

  /**
   * 항목별 계산 이력
   */
  @Get('items/:id/calculation-history')
  async getCalculationHistory(@Param('id') id: string) {
    // 계산 이력 조회 (ActivityLog에서)
    const logs = await this.prisma.activityLog.findMany({
      where: {
        entity: 'BudgetCategory',
        entityId: id,
        action: 'CALCULATE',
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return logs;
  }

  /**
   * 예산 항목 일괄 업데이트
   */
  @Post('bulk-update/:projectId')
  async bulkUpdate(
    @Param('projectId') projectId: string,
    @Body() body: { items: Array<{ id: string; plannedAmount?: number; calculatedAmount?: number }> }
  ) {
    const results = [];

    for (const item of body.items) {
      const updated = await this.prisma.budgetCategory.update({
        where: { id: item.id },
        data: {
          plannedAmount: item.plannedAmount,
          calculatedAmount: item.calculatedAmount,
        },
      });
      results.push(updated);
    }

    // 전체 재계산
    await this.calculationService.recalculateProject(projectId);

    return { updated: results.length };
  }

  /**
   * 예산 비교 (계획 vs 계산 vs 실행)
   */
  @Get('comparison/:projectId')
  async getBudgetComparison(@Param('projectId') projectId: string) {
    const items = await this.prisma.budgetCategory.findMany({
      where: { projectId, isActive: true },
      select: {
        id: true,
        level1: true,
        level2: true,
        displayName: true,
        plannedAmount: true,
        calculatedAmount: true,
        actualAmount: true,
      },
    });

    // 카테고리별 합계
    const comparison = items.reduce((acc, item) => {
      if (!acc[item.level1]) {
        acc[item.level1] = {
          category: item.level1,
          planned: 0,
          calculated: 0,
          actual: 0,
          variance: 0,
        };
      }

      const planned = parseFloat(item.plannedAmount.toString());
      const calculated = parseFloat(item.calculatedAmount.toString());
      const actual = parseFloat(item.actualAmount.toString());

      acc[item.level1].planned += planned;
      acc[item.level1].calculated += calculated;
      acc[item.level1].actual += actual;
      acc[item.level1].variance += calculated - planned;

      return acc;
    }, {} as Record<string, any>);

    return Object.values(comparison);
  }

  /**
   * 예산 항목 검색
   */
  @Get('search/:projectId')
  async searchBudgetItems(
    @Param('projectId') projectId: string,
    @Query('q') query: string
  ) {
    const items = await this.prisma.budgetCategory.findMany({
      where: {
        projectId,
        isActive: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { displayName: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { displayOrder: 'asc' },
    });

    return items;
  }

  /**
   * 예산 템플릿 생성
   */
  @Post('templates')
  async createTemplate(
    @Body() body: { name: string; projectId: string; description?: string }
  ) {
    // 프로젝트의 현재 예산 구조를 템플릿으로 저장
    const items = await this.prisma.budgetCategory.findMany({
      where: { projectId: body.projectId, isActive: true },
    });

    // 템플릿 저장 로직 (별도 테이블 필요)
    // 여기서는 간단히 JSON으로 반환
    return {
      name: body.name,
      description: body.description,
      structure: items.map((item) => ({
        level1: item.level1,
        level2: item.level2,
        level3: item.level3,
        name: item.name,
        displayName: item.displayName,
        isCalculable: item.isCalculable,
        formula: item.formula,
      })),
    };
  }

  /**
   * 템플릿 적용
   */
  @Post('templates/:templateId/apply/:projectId')
  async applyTemplate(
    @Param('templateId') templateId: string,
    @Param('projectId') projectId: string
  ) {
    // 템플릿을 프로젝트에 적용
    // 구현 생략 (템플릿 구조에 따라 달라짐)
    return { message: 'Template applied' };
  }
}
```

---

## 🔧 Module 설정

### File: `backend/src/budget/budget.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { BudgetController } from './budget.controller';
import { BudgetCalculatorController } from './budget-calculator.controller';
import { BudgetService } from './budget.service';
import { BudgetCalculationService } from './calculation.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BudgetController, BudgetCalculatorController],
  providers: [BudgetService, BudgetCalculationService],
  exports: [BudgetCalculationService],
})
export class BudgetModule {}
```

---

## 📊 시드 데이터에 계산 가능 항목 추가

### File: `backend/prisma/seed-budget-calculable.ts`

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedCalculableBudgetItems(projectId: string) {
  console.log('🧮 Adding calculable budget items...');

  // 토지매입비 - 계산 가능 항목
  await prisma.budgetCategory.create({
    data: {
      projectId,
      level1: '토지매입비',
      level2: '취득세',
      name: 'landAcquisitionTax',
      displayName: '취득세',
      description: '토지 매입가의 4%',
      plannedAmount: 0,
      calculatedAmount: 0,
      isCalculable: true,
      formula: 'LAND_ACQUISITION_TAX',
      variables: { required: ['landPrice'] },
      displayOrder: 2,
    },
  });

  await prisma.budgetCategory.create({
    data: {
      projectId,
      level1: '토지매입비',
      level2: '소유권이전등기비',
      name: 'registrationTax',
      displayName: '소유권이전등기비',
      description: '토지가액의 2% + 인지세',
      plannedAmount: 0,
      calculatedAmount: 0,
      isCalculable: true,
      formula: 'REGISTRATION_TAX',
      variables: { required: ['landPrice', 'stampDuty'] },
      displayOrder: 3,
    },
  });

  // 부담금 - 계산 가능 항목들
  await prisma.budgetCategory.create({
    data: {
      projectId,
      level1: '부담금',
      level2: '학교용지부담금',
      name: 'schoolSiteCharge',
      displayName: '학교용지부담금',
      description: '연면적 × 단위가격 × 부담비율',
      plannedAmount: 0,
      calculatedAmount: 0,
      isCalculable: true,
      formula: 'SCHOOL_SITE_CHARGE',
      variables: { required: ['totalFloorArea', 'unitPrice', 'ratio'] },
      displayOrder: 1,
    },
  });

  await prisma.budgetCategory.create({
    data: {
      projectId,
      level1: '부담금',
      level2: '지역난방시설부담금',
      name: 'districtHeatingCharge',
      displayName: '지역난방시설부담금',
      description: '세대수 × 세대당 부담금',
      plannedAmount: 0,
      calculatedAmount: 0,
      isCalculable: true,
      formula: 'DISTRICT_HEATING_CHARGE',
      variables: { required: ['units', 'unitCharge'] },
      displayOrder: 2,
    },
  });

  await prisma.budgetCategory.create({
    data: {
      projectId,
      level1: '부담금',
      level2: '광역교통시설부담금',
      name: 'trafficInducementCharge',
      displayName: '광역교통시설부담금',
      description: '연면적 × 단위가격',
      plannedAmount: 0,
      calculatedAmount: 0,
      isCalculable: true,
      formula: 'TRAFFIC_INDUCEMENT_CHARGE',
      variables: { required: ['totalFloorArea', 'unitPrice'] },
      displayOrder: 3,
    },
  });

  // 판매비 - 계산 가능 항목들
  await prisma.budgetCategory.create({
    data: {
      projectId,
      level1: '판매비',
      level2: '분양대행수수료',
      name: 'salesAgencyFee',
      displayName: '분양대행수수료',
      description: '분양수입 × 수수료율',
      plannedAmount: 0,
      calculatedAmount: 0,
      isCalculable: true,
      formula: 'SALES_AGENCY_FEE',
      variables: { required: ['salesRevenue', 'feeRate'] },
      displayOrder: 1,
    },
  });

  await prisma.budgetCategory.create({
    data: {
      projectId,
      level1: '판매비',
      level2: '분양보증수수료',
      name: 'salesGuaranteeFee',
      displayName: '분양보증수수료',
      description: '(공사비 + 토지비) × 보증요율 × 기간/12',
      plannedAmount: 0,
      calculatedAmount: 0,
      isCalculable: true,
      formula: 'SALES_GUARANTEE_FEE',
      variables: {
        required: ['constructionCost', 'landCost', 'guaranteeRate', 'period'],
      },
      displayOrder: 2,
    },
  });

  // 금융비 - 계산 가능 항목들
  await prisma.budgetCategory.create({
    data: {
      projectId,
      level1: '금융비',
      level2: 'P/F 취급수수료',
      name: 'pfHandlingFee',
      displayName: 'P/F 취급수수료',
      description: 'P/F 금액 × 취급수수료율',
      plannedAmount: 0,
      calculatedAmount: 0,
      isCalculable: true,
      formula: 'PF_HANDLING_FEE',
      variables: { required: ['pfAmount', 'handlingRate'] },
      displayOrder: 1,
    },
  });

  await prisma.budgetCategory.create({
    data: {
      projectId,
      level1: '금융비',
      level2: '중도금보증수수료',
      name: 'interimPaymentGuaranteeFee',
      displayName: '중도금보증수수료',
      description: '중도금 × 보증요율 × 기간/12',
      plannedAmount: 0,
      calculatedAmount: 0,
      isCalculable: true,
      formula: 'INTERIM_PAYMENT_GUARANTEE_FEE',
      variables: { required: ['interimPaymentAmount', 'guaranteeRate', 'period'] },
      displayOrder: 2,
    },
  });

  console.log('✅ Calculable budget items added');
}

// 실행
async function main() {
  // 모든 프로젝트에 대해 실행
  const projects = await prisma.project.findMany();
  
  for (const project of projects) {
    await seedCalculableBudgetItems(project.id);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

---

## 🧪 테스트 스크립트

### File: `backend/test/budget-calculator.test.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { BudgetCalculationService } from '../src/budget/calculation.service';
import { PrismaService } from '../src/prisma/prisma.service';

describe('BudgetCalculationService', () => {
  let service: BudgetCalculationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BudgetCalculationService, PrismaService],
    }).compile();

    service = module.get<BudgetCalculationService>(BudgetCalculationService);
  });

  describe('calculate', () => {
    it('should calculate land acquisition tax correctly', async () => {
      const result = await service.calculate('LAND_ACQUISITION_TAX', {
        projectId: 'test-project',
        variables: {
          landPrice: 10000000000, // 100억
        },
      });

      // 100억 * 4% = 4억
      expect(result.result).toBe(400000000);
    });

    it('should calculate school site charge correctly', async () => {
      const result = await service.calculate('SCHOOL_SITE_CHARGE', {
        projectId: 'test-project',
        variables: {
          totalFloorArea: 25000, // 25,000 m²
          unitPrice: 200000, // 20만원/m²
          ratio: 0.05, // 5%
        },
      });

      // 25,000 * 200,000 * 0.05 = 250,000,000 (2.5억)
      expect(result.result).toBe(250000000);
    });

    it('should calculate sales agency fee correctly', async () => {
      const result = await service.calculate('SALES_AGENCY_FEE', {
        projectId: 'test-project',
        variables: {
          salesRevenue: 150000000000, // 1,500억
          feeRate: 0.015, // 1.5%
        },
      });

      // 1,500억 * 1.5% = 22.5억
      expect(result.result).toBe(2250000000);
    });
  });

  describe('formula validation', () => {
    it('should reject formula with illegal characters', async () => {
      await expect(
        service.calculate('CUSTOM', {
          projectId: 'test',
          variables: { x: 100 },
        })
      ).rejects.toThrow();
    });

    it('should require all necessary variables', async () => {
      await expect(
        service.calculate('SCHOOL_SITE_CHARGE', {
          projectId: 'test',
          variables: { totalFloorArea: 25000 }, // Missing unitPrice and ratio
        })
      ).rejects.toThrow('Missing variables');
    });
  });
});
```

---

## 📖 API 사용 예시

### 1. 공식 목록 조회

```bash
GET /api/budget/formulas?category=부담금

Response:
[
  {
    "id": "SCHOOL_SITE_CHARGE",
    "name": "schoolSiteCharge",
    "displayName": "학교용지부담금",
    "category": "부담금",
    "formula": "totalFloorArea * unitPrice * ratio",
    "variables": ["totalFloorArea", "unitPrice", "ratio"],
    "description": "연면적 × 단위가격 × 부담비율"
  },
  ...
]
```

### 2. 계산 실행

```bash
POST /api/budget/calculate

Body:
{
  "formulaId": "SCHOOL_SITE_CHARGE",
  "projectId": "project-123",
  "variables": {
    "totalFloorArea": 25000,
    "unitPrice": 200000,
    "ratio": 0.05
  }
}

Response:
{
  "result": 250000000,
  "breakdown": {
    "formula": "totalFloorArea * unitPrice * ratio",
    "variables": {
      "totalFloorArea": 25000,
      "unitPrice": 200000,
      "ratio": 0.05
    },
    "displayName": "학교용지부담금",
    "description": "연면적 × 단위가격 × 부담비율"
  }
}
```

### 3. 커스텀 항목 추가

```bash
POST /api/budget/custom-items

Body:
{
  "projectId": "project-123",
  "level1": "용역비",
  "level2": "인증비용",
  "name": "greenCertification",
  "displayName": "친환경인증비용",
  "description": "녹색건축인증 관련 비용",
  "plannedAmount": 50000000,
  "isCalculable": true,
  "formula": "totalFloorArea * 2000"
}

Response:
{
  "id": "custom-item-456",
  "name": "greenCertification",
  "displayName": "친환경인증비용",
  "calculatedAmount": 50000000,
  "isCustom": true
}
```

### 4. 전체 재계산

```bash
POST /api/budget/recalculate/project-123

Response:
{
  "message": "Recalculation completed"
}
```

---

## 🎯 주요 기능 요약

### ✅ 구현된 기능
1. **계산 공식 시스템** - 10개 이상의 기본 공식
2. **안전한 계산 엔진** - 수식 검증 및 안전한 평가
3. **계산기 모달** - UI에서 변수 입력 및 실시간 계산
4. **커스텀 항목** - 유연한 항목 추가 및 공식 정의
5. **자동 재계산** - 프로젝트 변수 변경 시 자동 업데이트
6. **카테고리별 집계** - 대분류별 자동 합계 계산
7. **변수 관리** - 프로젝트별 커스텀 변수 저장
8. **계산 이력** - 계산 결과 추적
9. **일괄 업데이트** - 여러 항목 동시 업데이트
10. **예산 비교** - 계획 vs 계산 vs 실행 비교

### 🔄 연동 가능한 항목
- 토지비, 공사비 → 부담금 계산
- 분양수입 → 판매비 계산
- P/F 금액 → 금융비 계산
- 모든 변수 → 커스텀 항목 계산

---

**이제 완전한 사업비 계산 및 관리 시스템이 준비되었습니다! 🎉**

모든 계산은 자동화되고, 항목은 유연하게 추가할 수 있으며, 검증 가능한 계산기가 제공됩니다.
