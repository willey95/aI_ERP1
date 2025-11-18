import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class FinancialService {
  constructor(private prisma: PrismaService) {}

  // ============================================
  // FINANCIAL MODEL MANAGEMENT
  // ============================================

  async getFinancialModel(projectId: string) {
    const model = await this.prisma.financialModel.findFirst({
      where: {
        projectId,
        isActive: true,
      },
      orderBy: {
        version: 'desc',
      },
    });

    return model || { message: 'No financial model found' };
  }

  async getAllFinancialModels(projectId: string) {
    return this.prisma.financialModel.findMany({
      where: { projectId },
      orderBy: { version: 'desc' },
    });
  }

  async createFinancialModel(projectId: string, data: any, userId: string) {
    // Get the latest version number
    const latestModel = await this.prisma.financialModel.findFirst({
      where: { projectId },
      orderBy: { version: 'desc' },
    });

    const newVersion = latestModel ? latestModel.version + 1 : 1;

    // Deactivate previous model
    if (latestModel) {
      await this.prisma.financialModel.update({
        where: { id: latestModel.id },
        data: { isActive: false },
      });
    }

    // Calculate projections
    const monthlyProjections = this.calculateMonthlyProjections(data);
    const { totalRevenue, totalCost, expectedProfit, roi, lowestCashPoint, lowestCashMonth } =
      this.calculateFinancialMetrics(monthlyProjections);

    // Create new model
    return this.prisma.financialModel.create({
      data: {
        projectId,
        version: newVersion,
        isActive: true,
        salesRate: data.salesRate,
        salesStartMonth: data.salesStartMonth,
        constructionDelay: data.constructionDelay || 0,
        costInflation: data.costInflation || 0,
        interestRate: data.interestRate,
        monthlyProjections,
        totalRevenue,
        totalCost,
        expectedProfit,
        roi,
        lowestCashPoint,
        lowestCashMonth,
        calculatedBy: userId,
      },
    });
  }

  async updateFinancialModel(projectId: string, data: any, userId: string) {
    // Create a new version instead of updating
    return this.createFinancialModel(projectId, data, userId);
  }

  async calculateFinancialModel(projectId: string, data: any, userId: string) {
    // Get project data
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        budgetItems: { where: { isActive: true } },
      },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    // Calculate monthly projections based on budget and parameters
    const monthlyProjections = this.calculateMonthlyProjections({
      ...data,
      project,
    });

    const { totalRevenue, totalCost, expectedProfit, roi, lowestCashPoint, lowestCashMonth } =
      this.calculateFinancialMetrics(monthlyProjections);

    return {
      projectId,
      monthlyProjections,
      summary: {
        totalRevenue,
        totalCost,
        expectedProfit,
        roi,
        lowestCashPoint,
        lowestCashMonth,
      },
    };
  }

  // ============================================
  // CASH FLOW MANAGEMENT
  // ============================================

  async getCashFlow(projectId: string) {
    const cashFlowItems = await this.prisma.cashFlowItem.findMany({
      where: { projectId },
      orderBy: {
        plannedDate: 'asc',
      },
    });

    return cashFlowItems;
  }

  async createCashFlowItem(projectId: string, data: any) {
    return this.prisma.cashFlowItem.create({
      data: {
        projectId,
        type: data.type,
        category: data.category,
        description: data.description,
        plannedAmount: new Decimal(data.plannedAmount),
        actualAmount: data.actualAmount ? new Decimal(data.actualAmount) : new Decimal(0),
        plannedDate: new Date(data.plannedDate),
        actualDate: data.actualDate ? new Date(data.actualDate) : null,
        isRecurring: data.isRecurring || false,
        recurringMonths: data.recurringMonths,
      },
    });
  }

  async updateCashFlowItem(id: string, data: any) {
    return this.prisma.cashFlowItem.update({
      where: { id },
      data: {
        ...(data.type && { type: data.type }),
        ...(data.category && { category: data.category }),
        ...(data.description && { description: data.description }),
        ...(data.plannedAmount && { plannedAmount: new Decimal(data.plannedAmount) }),
        ...(data.actualAmount !== undefined && { actualAmount: new Decimal(data.actualAmount) }),
        ...(data.plannedDate && { plannedDate: new Date(data.plannedDate) }),
        ...(data.actualDate && { actualDate: new Date(data.actualDate) }),
        ...(data.isRecurring !== undefined && { isRecurring: data.isRecurring }),
        ...(data.recurringMonths && { recurringMonths: data.recurringMonths }),
      },
    });
  }

  async createBulkCashFlowItems(projectId: string, items: any[]) {
    const created = [];

    for (const item of items) {
      const created_item = await this.createCashFlowItem(projectId, item);
      created.push(created_item);
    }

    return created;
  }

  async getCashFlowSummary(projectId: string) {
    const items = await this.prisma.cashFlowItem.findMany({
      where: { projectId },
    });

    const inflows = items.filter((item) => item.type === 'INFLOW');
    const outflows = items.filter((item) => item.type === 'OUTFLOW');

    const totalPlannedInflow = inflows.reduce(
      (sum, item) => sum.add(item.plannedAmount),
      new Decimal(0),
    );
    const totalPlannedOutflow = outflows.reduce(
      (sum, item) => sum.add(item.plannedAmount),
      new Decimal(0),
    );
    const totalActualInflow = inflows.reduce(
      (sum, item) => sum.add(item.actualAmount),
      new Decimal(0),
    );
    const totalActualOutflow = outflows.reduce(
      (sum, item) => sum.add(item.actualAmount),
      new Decimal(0),
    );

    return {
      projectId,
      summary: {
        planned: {
          inflow: totalPlannedInflow,
          outflow: totalPlannedOutflow,
          net: totalPlannedInflow.minus(totalPlannedOutflow),
        },
        actual: {
          inflow: totalActualInflow,
          outflow: totalActualOutflow,
          net: totalActualInflow.minus(totalActualOutflow),
        },
      },
      items,
    };
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private calculateMonthlyProjections(data: any): any[] {
    const { salesRate, salesStartMonth, constructionDelay, costInflation, interestRate, project } =
      data;

    const projectionMonths = 36; // 3 years
    const projections = [];

    let cumulativeCash = new Decimal(0);

    for (let month = 0; month < projectionMonths; month++) {
      // Calculate monthly revenue (simplified)
      const isAfterSalesStart = month >= salesStartMonth;
      const monthlySalesRate = isAfterSalesStart ? salesRate / 12 : 0;
      const monthlyRevenue = project
        ? new Decimal(project.initialBudget).mul(monthlySalesRate / 100)
        : new Decimal(0);

      // Calculate monthly costs (simplified with inflation)
      const inflationFactor = 1 + (costInflation / 100) * (month / 12);
      const baseMonthlyCost = project
        ? new Decimal(project.initialBudget).mul(0.08) // Assume 8% monthly spend
        : new Decimal(0);
      const monthlyCost = baseMonthlyCost.mul(inflationFactor);

      // Calculate interest expense
      const monthlyInterest = cumulativeCash.lt(0)
        ? cumulativeCash.abs().mul(interestRate / 100 / 12)
        : new Decimal(0);

      // Net cash flow
      const netCashFlow = monthlyRevenue.minus(monthlyCost).minus(monthlyInterest);
      cumulativeCash = cumulativeCash.add(netCashFlow);

      projections.push({
        month: month + 1,
        revenue: monthlyRevenue.toNumber(),
        cost: monthlyCost.toNumber(),
        interest: monthlyInterest.toNumber(),
        netCashFlow: netCashFlow.toNumber(),
        cumulativeCash: cumulativeCash.toNumber(),
      });
    }

    return projections;
  }

  private calculateFinancialMetrics(projections: any[]): {
    totalRevenue: Decimal;
    totalCost: Decimal;
    expectedProfit: Decimal;
    roi: number;
    lowestCashPoint: Decimal;
    lowestCashMonth: number;
  } {
    const totalRevenue = projections.reduce(
      (sum, p) => sum.add(p.revenue),
      new Decimal(0),
    );
    const totalCost = projections.reduce(
      (sum, p) => sum.add(p.cost).add(p.interest),
      new Decimal(0),
    );
    const expectedProfit = totalRevenue.minus(totalCost);
    const roi = totalCost.toNumber() > 0
      ? (expectedProfit.toNumber() / totalCost.toNumber()) * 100
      : 0;

    // Find lowest cash point
    let lowestCash = new Decimal(0);
    let lowestMonth = 0;

    projections.forEach((p) => {
      const cash = new Decimal(p.cumulativeCash);
      if (cash.lt(lowestCash)) {
        lowestCash = cash;
        lowestMonth = p.month;
      }
    });

    return {
      totalRevenue,
      totalCost,
      expectedProfit,
      roi,
      lowestCashPoint: lowestCash,
      lowestCashMonth: lowestMonth,
    };
  }
}
