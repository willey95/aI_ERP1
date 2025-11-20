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
        remainingBeforeExec: true,
        remainingAfterExec: true,
        pendingExecutionAmount: true,
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
          remainingBeforeExec: amount,
          remainingAfterExec: amount,
          pendingExecutionAmount: new Decimal(0),
          executionRate: 0,
          displayOrder: displayOrder++,
        },
      });
    }
  }
}
