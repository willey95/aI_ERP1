# XEM Backend API - Complete Implementation
## All Controllers, Services, and Business Logic

**Version**: 3.0  
**License**: MIT

---

## 📁 Backend Structure

```
backend/
├── src/
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── jwt.strategy.ts
│   │   └── jwt-auth.guard.ts
│   ├── projects/
│   │   ├── projects.module.ts
│   │   ├── projects.controller.ts
│   │   └── projects.service.ts
│   ├── budget/
│   │   ├── budget.module.ts
│   │   ├── budget.controller.ts
│   │   └── budget.service.ts
│   ├── execution/
│   │   ├── execution.module.ts
│   │   ├── execution.controller.ts
│   │   └── execution.service.ts
│   ├── approval/
│   │   ├── approval.module.ts
│   │   ├── approval.controller.ts
│   │   └── approval.service.ts
│   ├── financial/
│   │   ├── financial.module.ts
│   │   ├── financial.controller.ts
│   │   ├── financial.service.ts
│   │   └── financial-recalculation.service.ts
│   ├── simulation/
│   │   ├── simulation.module.ts
│   │   ├── simulation.controller.ts
│   │   └── simulation.service.ts
│   ├── dashboard/
│   │   ├── dashboard.module.ts
│   │   ├── dashboard.controller.ts
│   │   └── dashboard.service.ts
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   └── users.service.ts
│   ├── prisma/
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   ├── app.module.ts
│   └── main.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── .env
└── package.json
```

---

## 🚀 Main Application Setup

### File: `backend/src/main.ts`

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // API prefix
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 XEM Backend running on http://localhost:${port}/api`);
}
bootstrap();
```

### File: `backend/src/app.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProjectsModule } from './projects/projects.module';
import { BudgetModule } from './budget/budget.module';
import { ExecutionModule } from './execution/execution.module';
import { ApprovalModule } from './approval/approval.module';
import { FinancialModule } from './financial/financial.module';
import { SimulationModule } from './simulation/simulation.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    ProjectsModule,
    BudgetModule,
    ExecutionModule,
    ApprovalModule,
    FinancialModule,
    SimulationModule,
    DashboardModule,
    UsersModule,
  ],
})
export class AppModule {}
```

---

## 🗄️ Prisma Service

### File: `backend/src/prisma/prisma.service.ts`

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
    console.log('✅ Database connected');
  }
}
```

### File: `backend/src/prisma/prisma.module.ts`

```typescript
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

---

## 📊 Projects Module

### File: `backend/src/projects/projects.controller.ts`

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
import { ProjectsService } from './projects.service';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Get()
  async findAll(@Query() query: any) {
    return this.projectsService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Post()
  async create(@Body() data: any, @CurrentUser() user: any) {
    return this.projectsService.create(data, user.id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.projectsService.update(id, data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.projectsService.remove(id);
  }

  @Get(':id/summary')
  async getSummary(@Param('id') id: string) {
    return this.projectsService.getSummary(id);
  }
}
```

### File: `backend/src/projects/projects.service.ts`

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: any = {}) {
    const { status, projectType, search, sortBy = 'createdAt', order = 'desc' } = query;

    const where: any = {};

    if (status) where.status = status;
    if (projectType) where.projectType = projectType;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    const projects = await this.prisma.project.findMany({
      where,
      orderBy: { [sortBy]: order },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            budgetItems: true,
            executionRequests: true,
          },
        },
      },
    });

    return projects;
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
        budgetItems: {
          orderBy: {
            displayOrder: 'asc',
          },
        },
        financialModels: {
          where: {
            isActive: true,
          },
          orderBy: {
            version: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async create(data: any, userId: string) {
    const {
      code,
      name,
      location,
      projectType,
      landArea,
      buildingArea,
      totalFloorArea,
      units,
      startDate,
      completionDate,
      salesStartDate,
      initialBudget,
    } = data;

    // Generate unique code if not provided
    const projectCode = code || await this.generateProjectCode();

    const project = await this.prisma.project.create({
      data: {
        code: projectCode,
        name,
        location,
        projectType,
        landArea: parseFloat(landArea),
        buildingArea: parseFloat(buildingArea),
        totalFloorArea: parseFloat(totalFloorArea),
        units: parseInt(units),
        startDate: startDate ? new Date(startDate) : null,
        completionDate: completionDate ? new Date(completionDate) : null,
        salesStartDate: salesStartDate ? new Date(salesStartDate) : null,
        initialBudget: new Decimal(initialBudget),
        currentBudget: new Decimal(initialBudget),
        executedAmount: new Decimal(0),
        remainingBudget: new Decimal(initialBudget),
        executionRate: 0,
        expectedProfit: new Decimal(0),
        roi: 0,
        riskScore: 0,
        createdById: userId,
      },
    });

    // Create default budget structure
    await this.createDefaultBudgetStructure(project.id, initialBudget);

    return project;
  }

  async update(id: string, data: any) {
    const project = await this.prisma.project.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    return project;
  }

  async remove(id: string) {
    await this.prisma.project.delete({
      where: { id },
    });

    return { message: 'Project deleted successfully' };
  }

  async getSummary(id: string) {
    const project = await this.findOne(id);

    // Get budget breakdown by category
    const budgetByCategory = await this.prisma.budgetItem.groupBy({
      by: ['category', 'mainItem'],
      where: { projectId: id },
      _sum: {
        currentBudget: true,
        executedAmount: true,
        remainingBudget: true,
      },
    });

    // Get recent executions
    const recentExecutions = await this.prisma.executionRequest.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        budgetItem: {
          select: {
            mainItem: true,
            subItem: true,
          },
        },
        requestedBy: {
          select: {
            name: true,
          },
        },
      },
    });

    // Get pending approvals
    const pendingApprovals = await this.prisma.executionRequest.count({
      where: {
        projectId: id,
        status: 'PENDING',
      },
    });

    return {
      project,
      budgetByCategory,
      recentExecutions,
      pendingApprovals,
    };
  }

  private async generateProjectCode(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.project.count({
      where: {
        code: {
          startsWith: `PRJ-${year}-`,
        },
      },
    });

    return `PRJ-${year}-${String(count + 1).padStart(3, '0')}`;
  }

  private async createDefaultBudgetStructure(projectId: string, totalBudget: any) {
    const budget = new Decimal(totalBudget);

    // Default budget allocation (percentages)
    const budgetStructure = [
      // 수입
      { category: '수입', mainItem: '분양수입', ratio: 1.0 },

      // 지출
      { category: '지출', mainItem: '토지비', ratio: 0.30 },
      { category: '지출', mainItem: '공사비', ratio: 0.45 },
      { category: '지출', mainItem: '설계비', ratio: 0.03 },
      { category: '지출', mainItem: '부담금', ratio: 0.05 },
      { category: '지출', mainItem: '금융비용', ratio: 0.04 },
      { category: '지출', mainItem: '마케팅비', ratio: 0.03 },
    ];

    let displayOrder = 0;

    for (const item of budgetStructure) {
      const amount = budget.times(item.ratio);

      await this.prisma.budgetItem.create({
        data: {
          projectId,
          category: item.category,
          mainItem: item.mainItem,
          initialBudget: amount,
          currentBudget: amount,
          executedAmount: new Decimal(0),
          remainingBudget: amount,
          executionRate: 0,
          displayOrder: displayOrder++,
        },
      });
    }
  }
}
```

---

## 💰 Budget Module

### File: `backend/src/budget/budget.controller.ts`

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
import { BudgetService } from './budget.service';

@Controller('budget')
@UseGuards(JwtAuthGuard)
export class BudgetController {
  constructor(private budgetService: BudgetService) {}

  @Get('project/:projectId')
  async getProjectBudget(@Param('projectId') projectId: string) {
    return this.budgetService.getProjectBudget(projectId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.budgetService.findOne(id);
  }

  @Post()
  async create(@Body() data: any) {
    return this.budgetService.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.budgetService.update(id, data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.budgetService.remove(id);
  }

  @Post('change')
  async changeBudget(@Body() data: any) {
    return this.budgetService.changeBudget(data);
  }
}
```

### File: `backend/src/budget/budget.service.ts`

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class BudgetService {
  constructor(private prisma: PrismaService) {}

  async getProjectBudget(projectId: string) {
    const budgetItems = await this.prisma.budgetItem.findMany({
      where: { projectId, isActive: true },
      orderBy: {
        displayOrder: 'asc',
      },
    });

    // Group by category
    const grouped = budgetItems.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, any[]>);

    // Calculate totals for each category
    const summary = Object.keys(grouped).map((category) => {
      const items = grouped[category];
      return {
        category,
        items,
        totals: {
          initialBudget: items.reduce(
            (sum, item) => sum.plus(item.initialBudget),
            new Decimal(0)
          ),
          currentBudget: items.reduce(
            (sum, item) => sum.plus(item.currentBudget),
            new Decimal(0)
          ),
          executedAmount: items.reduce(
            (sum, item) => sum.plus(item.executedAmount),
            new Decimal(0)
          ),
          remainingBudget: items.reduce(
            (sum, item) => sum.plus(item.remainingBudget),
            new Decimal(0)
          ),
        },
      };
    });

    // Calculate grand totals
    const grandTotals = {
      initialBudget: budgetItems.reduce(
        (sum, item) => sum.plus(item.initialBudget),
        new Decimal(0)
      ),
      currentBudget: budgetItems.reduce(
        (sum, item) => sum.plus(item.currentBudget),
        new Decimal(0)
      ),
      executedAmount: budgetItems.reduce(
        (sum, item) => sum.plus(item.executedAmount),
        new Decimal(0)
      ),
      remainingBudget: budgetItems.reduce(
        (sum, item) => sum.plus(item.remainingBudget),
        new Decimal(0)
      ),
    };

    return {
      summary,
      grandTotals,
    };
  }

  async findOne(id: string) {
    const budgetItem = await this.prisma.budgetItem.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    if (!budgetItem) {
      throw new NotFoundException('Budget item not found');
    }

    return budgetItem;
  }

  async create(data: any) {
    const {
      projectId,
      category,
      mainItem,
      subItem,
      currentBudget,
      displayOrder,
    } = data;

    const budget = new Decimal(currentBudget);

    const budgetItem = await this.prisma.budgetItem.create({
      data: {
        projectId,
        category,
        mainItem,
        subItem,
        initialBudget: budget,
        currentBudget: budget,
        executedAmount: new Decimal(0),
        remainingBudget: budget,
        executionRate: 0,
        displayOrder: displayOrder || 0,
      },
    });

    // Update project budget
    await this.updateProjectBudget(projectId);

    return budgetItem;
  }

  async update(id: string, data: any) {
    const budgetItem = await this.prisma.budgetItem.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    // Update project budget
    await this.updateProjectBudget(budgetItem.projectId);

    return budgetItem;
  }

  async remove(id: string) {
    const budgetItem = await this.prisma.budgetItem.findUnique({
      where: { id },
    });

    if (!budgetItem) {
      throw new NotFoundException('Budget item not found');
    }

    await this.prisma.budgetItem.update({
      where: { id },
      data: { isActive: false },
    });

    // Update project budget
    await this.updateProjectBudget(budgetItem.projectId);

    return { message: 'Budget item removed successfully' };
  }

  async changeBudget(data: any) {
    const { id, newBudget, changeReason } = data;

    const budgetItem = await this.prisma.budgetItem.findUnique({
      where: { id },
    });

    if (!budgetItem) {
      throw new NotFoundException('Budget item not found');
    }

    const budget = new Decimal(newBudget);
    const remaining = budget.minus(budgetItem.executedAmount);
    const rate = budgetItem.executedAmount.dividedBy(budget).times(100).toNumber();

    const updated = await this.prisma.budgetItem.update({
      where: { id },
      data: {
        currentBudget: budget,
        remainingBudget: remaining,
        executionRate: rate,
        changeReason,
        changedAt: new Date(),
      },
    });

    // Update project budget
    await this.updateProjectBudget(budgetItem.projectId);

    return updated;
  }

  private async updateProjectBudget(projectId: string) {
    const budgetItems = await this.prisma.budgetItem.findMany({
      where: { projectId, isActive: true },
    });

    const totalBudget = budgetItems.reduce(
      (sum, item) => sum.plus(item.currentBudget),
      new Decimal(0)
    );

    const totalExecuted = budgetItems.reduce(
      (sum, item) => sum.plus(item.executedAmount),
      new Decimal(0)
    );

    const remaining = totalBudget.minus(totalExecuted);
    const rate = totalExecuted.dividedBy(totalBudget).times(100).toNumber();

    await this.prisma.project.update({
      where: { id: projectId },
      data: {
        currentBudget: totalBudget,
        executedAmount: totalExecuted,
        remainingBudget: remaining,
        executionRate: rate,
      },
    });
  }
}
```

---

## 📝 Execution & Approval Module

### File: `backend/src/execution/execution.controller.ts`

```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ExecutionService } from './execution.service';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('execution')
@UseGuards(JwtAuthGuard)
export class ExecutionController {
  constructor(private executionService: ExecutionService) {}

  @Get()
  async findAll(@Query() query: any) {
    return this.executionService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.executionService.findOne(id);
  }

  @Post()
  async create(@Body() data: any, @CurrentUser() user: any) {
    return this.executionService.create(data, user.id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.executionService.update(id, data);
  }

  @Post(':id/submit')
  async submit(@Param('id') id: string, @CurrentUser() user: any) {
    return this.executionService.submitForApproval(id, user.id);
  }

  @Post(':id/cancel')
  async cancel(@Param('id') id: string) {
    return this.executionService.cancel(id);
  }
}
```

### File: `backend/src/execution/execution.service.ts`

```typescript
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class ExecutionService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: any = {}) {
    const { status, projectId, budgetItemId, startDate, endDate } = query;

    const where: any = {};

    if (status) where.status = status;
    if (projectId) where.projectId = projectId;
    if (budgetItemId) where.budgetItemId = budgetItemId;
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const executions = await this.prisma.executionRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        budgetItem: {
          select: {
            id: true,
            mainItem: true,
            subItem: true,
          },
        },
        requestedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        approvals: {
          include: {
            approver: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
          orderBy: { step: 'asc' },
        },
      },
    });

    return executions;
  }

  async findOne(id: string) {
    const execution = await this.prisma.executionRequest.findUnique({
      where: { id },
      include: {
        project: true,
        budgetItem: true,
        requestedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        approvals: {
          include: {
            approver: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
          orderBy: { step: 'asc' },
        },
      },
    });

    if (!execution) {
      throw new NotFoundException('Execution request not found');
    }

    return execution;
  }

  async create(data: any, userId: string) {
    const {
      projectId,
      budgetItemId,
      amount,
      executionDate,
      purpose,
      description,
      attachments,
    } = data;

    // Validate budget availability
    const budgetItem = await this.prisma.budgetItem.findUnique({
      where: { id: budgetItemId },
    });

    if (!budgetItem) {
      throw new NotFoundException('Budget item not found');
    }

    const requestAmount = new Decimal(amount);
    if (requestAmount.greaterThan(budgetItem.remainingBudget)) {
      throw new BadRequestException(
        `Requested amount exceeds remaining budget (${budgetItem.remainingBudget})`
      );
    }

    // Generate request number
    const requestNumber = await this.generateRequestNumber();

    // Create execution request
    const execution = await this.prisma.executionRequest.create({
      data: {
        requestNumber,
        projectId,
        budgetItemId,
        requestedById: userId,
        amount: requestAmount,
        executionDate: new Date(executionDate),
        purpose,
        description,
        attachments: attachments || [],
        status: 'DRAFT',
        currentStep: 0,
      },
    });

    return execution;
  }

  async update(id: string, data: any) {
    const execution = await this.prisma.executionRequest.findUnique({
      where: { id },
    });

    if (!execution) {
      throw new NotFoundException('Execution request not found');
    }

    if (execution.status !== 'DRAFT') {
      throw new BadRequestException('Can only update draft requests');
    }

    const updated = await this.prisma.executionRequest.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    return updated;
  }

  async submitForApproval(id: string, userId: string) {
    const execution = await this.prisma.executionRequest.findUnique({
      where: { id },
    });

    if (!execution) {
      throw new NotFoundException('Execution request not found');
    }

    if (execution.status !== 'DRAFT') {
      throw new BadRequestException('Can only submit draft requests');
    }

    // Create approval workflow (4 steps)
    const approvalSteps = [
      { step: 1, role: 'STAFF' },      // 담당자 확인
      { step: 2, role: 'TEAM_LEAD' },  // 팀장
      { step: 3, role: 'RM_TEAM' },    // RM팀
      { step: 4, role: 'CFO' },        // CFO
    ];

    for (const approvalStep of approvalSteps) {
      await this.prisma.approval.create({
        data: {
          executionRequestId: id,
          step: approvalStep.step,
          approverRole: approvalStep.role as any,
          status: approvalStep.step === 1 ? 'APPROVED' : 'PENDING',
          decidedAt: approvalStep.step === 1 ? new Date() : null,
        },
      });
    }

    // Update execution status
    const updated = await this.prisma.executionRequest.update({
      where: { id },
      data: {
        status: 'PENDING',
        currentStep: 2, // Move to team lead approval
      },
    });

    // Create notification for team lead
    await this.createApprovalNotification(id, 'TEAM_LEAD');

    return updated;
  }

  async cancel(id: string) {
    const execution = await this.prisma.executionRequest.findUnique({
      where: { id },
    });

    if (!execution) {
      throw new NotFoundException('Execution request not found');
    }

    if (execution.status === 'APPROVED') {
      throw new BadRequestException('Cannot cancel approved requests');
    }

    await this.prisma.executionRequest.update({
      where: { id },
      data: {
        status: 'CANCELLED',
      },
    });

    return { message: 'Execution request cancelled' };
  }

  private async generateRequestNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.executionRequest.count({
      where: {
        requestNumber: {
          startsWith: `EXE-${year}-`,
        },
      },
    });

    return `EXE-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private async createApprovalNotification(executionId: string, role: string) {
    const execution = await this.prisma.executionRequest.findUnique({
      where: { id: executionId },
      include: {
        project: true,
        budgetItem: true,
        requestedBy: true,
      },
    });

    if (!execution) return;

    // Find users with the specified role
    const approvers = await this.prisma.user.findMany({
      where: { role: role as any, isActive: true },
    });

    // Create notification for each approver
    for (const approver of approvers) {
      await this.prisma.notification.create({
        data: {
          userId: approver.id,
          projectId: execution.projectId,
          type: 'APPROVAL_REQUEST',
          title: '결재 요청',
          message: `${execution.requestedBy.name}님이 ${execution.project.name} 프로젝트의 ${execution.budgetItem.mainItem} 항목에 대해 ${execution.amount}원 집행을 요청했습니다.`,
          severity: 'INFO',
        },
      });
    }
  }
}
```

---

## ✅ Approval Module

### File: `backend/src/approval/approval.controller.ts`

```typescript
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApprovalService } from './approval.service';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('approval')
@UseGuards(JwtAuthGuard)
export class ApprovalController {
  constructor(private approvalService: ApprovalService) {}

  @Get('pending')
  async getPendingApprovals(@CurrentUser() user: any) {
    return this.approvalService.getPendingApprovals(user.id, user.role);
  }

  @Get('stats')
  async getApprovalStats(@CurrentUser() user: any) {
    return this.approvalService.getApprovalStats(user.role);
  }

  @Post(':id/approve')
  async approve(
    @Param('id') id: string,
    @Body() data: { decision?: string },
    @CurrentUser() user: any
  ) {
    return this.approvalService.approve(id, user.id, data.decision);
  }

  @Post(':id/reject')
  async reject(
    @Param('id') id: string,
    @Body() data: { decision: string },
    @CurrentUser() user: any
  ) {
    return this.approvalService.reject(id, user.id, data.decision);
  }
}
```

### File: `backend/src/approval/approval.service.ts`

```typescript
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FinancialRecalculationService } from '../financial/financial-recalculation.service';

@Injectable()
export class ApprovalService {
  constructor(
    private prisma: PrismaService,
    private financialService: FinancialRecalculationService
  ) {}

  async getPendingApprovals(userId: string, userRole: string) {
    const approvals = await this.prisma.approval.findMany({
      where: {
        approverRole: userRole as any,
        status: 'PENDING',
      },
      include: {
        executionRequest: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
            budgetItem: {
              select: {
                mainItem: true,
                subItem: true,
              },
            },
            requestedBy: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return approvals;
  }

  async getApprovalStats(userRole: string) {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const pending = await this.prisma.approval.count({
      where: {
        approverRole: userRole as any,
        status: 'PENDING',
      },
    });

    const approvedThisWeek = await this.prisma.approval.count({
      where: {
        approverRole: userRole as any,
        status: 'APPROVED',
        decidedAt: {
          gte: weekAgo,
        },
      },
    });

    const rejectedThisWeek = await this.prisma.approval.count({
      where: {
        approverRole: userRole as any,
        status: 'REJECTED',
        decidedAt: {
          gte: weekAgo,
        },
      },
    });

    // Calculate average processing time
    const approvedRecently = await this.prisma.approval.findMany({
      where: {
        approverRole: userRole as any,
        status: 'APPROVED',
        decidedAt: {
          gte: weekAgo,
        },
      },
      select: {
        createdAt: true,
        decidedAt: true,
      },
    });

    const avgProcessingTime = approvedRecently.length > 0
      ? approvedRecently.reduce((sum, approval) => {
          const time = approval.decidedAt!.getTime() - approval.createdAt.getTime();
          return sum + time;
        }, 0) / approvedRecently.length / (1000 * 60 * 60) // Convert to hours
      : 0;

    const rejectionRate = (approvedThisWeek + rejectedThisWeek) > 0
      ? (rejectedThisWeek / (approvedThisWeek + rejectedThisWeek)) * 100
      : 0;

    return {
      pending,
      approvedThisWeek,
      avgProcessingTime: avgProcessingTime.toFixed(1),
      rejectionRate: rejectionRate.toFixed(1),
    };
  }

  async approve(approvalId: string, userId: string, decision?: string) {
    const approval = await this.prisma.approval.findUnique({
      where: { id: approvalId },
      include: {
        executionRequest: {
          include: {
            project: true,
            budgetItem: true,
            approvals: {
              orderBy: { step: 'asc' },
            },
          },
        },
      },
    });

    if (!approval) {
      throw new NotFoundException('Approval not found');
    }

    if (approval.status !== 'PENDING') {
      throw new ForbiddenException('This approval has already been processed');
    }

    // Update approval
    await this.prisma.approval.update({
      where: { id: approvalId },
      data: {
        status: 'APPROVED',
        approverId: userId,
        decision,
        decidedAt: new Date(),
      },
    });

    // Check if this was the final approval
    const allApprovals = approval.executionRequest.approvals;
    const nextStep = approval.step + 1;
    const hasNextStep = allApprovals.some((a) => a.step === nextStep);

    if (!hasNextStep) {
      // This was the final approval - mark execution as approved
      await this.prisma.executionRequest.update({
        where: { id: approval.executionRequestId },
        data: {
          status: 'APPROVED',
          completedAt: new Date(),
        },
      });

      // 🔥 CRITICAL: Trigger financial recalculation
      await this.financialService.recalculateOnExecution(approval.executionRequestId);

      // Create completion notification
      await this.createCompletionNotification(approval.executionRequest);
    } else {
      // Move to next approval step
      await this.prisma.executionRequest.update({
        where: { id: approval.executionRequestId },
        data: {
          currentStep: nextStep,
        },
      });

      // Notify next approver
      const nextApproval = allApprovals.find((a) => a.step === nextStep);
      if (nextApproval) {
        await this.createApprovalNotification(
          approval.executionRequest,
          nextApproval.approverRole
        );
      }
    }

    return { message: 'Approval completed successfully' };
  }

  async reject(approvalId: string, userId: string, decision: string) {
    const approval = await this.prisma.approval.findUnique({
      where: { id: approvalId },
      include: {
        executionRequest: {
          include: {
            project: true,
            requestedBy: true,
          },
        },
      },
    });

    if (!approval) {
      throw new NotFoundException('Approval not found');
    }

    if (approval.status !== 'PENDING') {
      throw new ForbiddenException('This approval has already been processed');
    }

    // Update approval
    await this.prisma.approval.update({
      where: { id: approvalId },
      data: {
        status: 'REJECTED',
        approverId: userId,
        decision,
        decidedAt: new Date(),
      },
    });

    // Update execution request
    await this.prisma.executionRequest.update({
      where: { id: approval.executionRequestId },
      data: {
        status: 'REJECTED',
        rejectionReason: decision,
      },
    });

    // Create rejection notification
    await this.prisma.notification.create({
      data: {
        userId: approval.executionRequest.requestedById,
        projectId: approval.executionRequest.projectId,
        type: 'APPROVAL_REJECTED',
        title: '결재 반려',
        message: `품의번호 ${approval.executionRequest.requestNumber}이(가) 반려되었습니다. 사유: ${decision}`,
        severity: 'WARNING',
      },
    });

    return { message: 'Approval rejected' };
  }

  private async createApprovalNotification(execution: any, role: string) {
    const approvers = await this.prisma.user.findMany({
      where: { role: role as any, isActive: true },
    });

    for (const approver of approvers) {
      await this.prisma.notification.create({
        data: {
          userId: approver.id,
          projectId: execution.projectId,
          type: 'APPROVAL_REQUEST',
          title: '결재 요청',
          message: `${execution.requestedBy.name}님의 ${execution.project.name} 프로젝트 집행 요청이 승인 대기중입니다.`,
          severity: 'INFO',
        },
      });
    }
  }

  private async createCompletionNotification(execution: any) {
    await this.prisma.notification.create({
      data: {
        userId: execution.requestedById,
        projectId: execution.projectId,
        type: 'APPROVAL_COMPLETED',
        title: '결재 완료',
        message: `품의번호 ${execution.requestNumber}이(가) 최종 승인되었습니다.`,
        severity: 'INFO',
      },
    });
  }
}
```

---

This is part 1 of the complete backend implementation. Would you like me to continue with:

1. Dashboard Module (with real-time statistics)
2. Simulation Module (scenario analysis)
3. Complete seed data for testing
4. Docker Compose configuration
5. All frontend pages with API integration?

Let me know which part you'd like next!
