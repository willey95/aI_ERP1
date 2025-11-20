import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import * as ExcelJS from 'exceljs';

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
    const budgetAmount = new Decimal(data.budgetAmount || data.plannedAmount || 0);
    const forecastAmount = new Decimal(data.forecastAmount || data.budgetAmount || data.plannedAmount || 0);
    const varianceAmount = forecastAmount.minus(budgetAmount);

    return this.prisma.cashFlowItem.create({
      data: {
        projectId,
        budgetItemId: data.budgetItemId || null,
        type: data.type,
        category: data.category,
        mainItem: data.mainItem || data.category,
        subItem: data.subItem || null,
        description: data.description,
        budgetAmount,
        forecastAmount,
        actualAmount: data.actualAmount ? new Decimal(data.actualAmount) : new Decimal(0),
        // NEW: Budget vs Forecast variance
        varianceAmount,
        varianceReason: data.varianceReason || null,
        isVarianceApproved: data.isVarianceApproved || false,
        // NEW: Actual vs Nominal execution
        actualExecutionType: data.actualExecutionType || 'ACTUAL',
        actualExecutionAmount: data.actualExecutionAmount ? new Decimal(data.actualExecutionAmount) : new Decimal(0),
        nominalExecutionAmount: data.nominalExecutionAmount ? new Decimal(data.nominalExecutionAmount) : new Decimal(0),
        executionNote: data.executionNote || null,
        // Dates
        plannedDate: new Date(data.plannedDate),
        forecastDate: data.forecastDate ? new Date(data.forecastDate) : null,
        actualDate: data.actualDate ? new Date(data.actualDate) : null,
        isRecurring: data.isRecurring || false,
        recurringMonths: data.recurringMonths,
      },
    });
  }

  async updateCashFlowItem(id: string, data: any) {
    // Fetch current item to calculate variance if needed
    const currentItem = await this.prisma.cashFlowItem.findUnique({
      where: { id },
    });

    const budgetAmount = data.budgetAmount || data.plannedAmount
      ? new Decimal(data.budgetAmount || data.plannedAmount)
      : currentItem.budgetAmount;
    const forecastAmount = data.forecastAmount || data.plannedAmount
      ? new Decimal(data.forecastAmount || data.plannedAmount)
      : currentItem.forecastAmount;
    const varianceAmount = forecastAmount.minus(budgetAmount);

    return this.prisma.cashFlowItem.update({
      where: { id },
      data: {
        ...(data.budgetItemId !== undefined && { budgetItemId: data.budgetItemId }),
        ...(data.type && { type: data.type }),
        ...(data.category && { category: data.category }),
        ...(data.mainItem && { mainItem: data.mainItem }),
        ...(data.subItem !== undefined && { subItem: data.subItem }),
        ...(data.description && { description: data.description }),
        ...((data.budgetAmount || data.plannedAmount) && { budgetAmount }),
        ...((data.forecastAmount || data.plannedAmount) && { forecastAmount }),
        ...(data.actualAmount !== undefined && { actualAmount: new Decimal(data.actualAmount) }),
        // NEW: Budget vs Forecast variance
        ...((data.budgetAmount || data.forecastAmount || data.plannedAmount) && { varianceAmount }),
        ...(data.varianceReason !== undefined && { varianceReason: data.varianceReason }),
        ...(data.isVarianceApproved !== undefined && { isVarianceApproved: data.isVarianceApproved }),
        // NEW: Actual vs Nominal execution
        ...(data.actualExecutionType && { actualExecutionType: data.actualExecutionType }),
        ...(data.actualExecutionAmount !== undefined && { actualExecutionAmount: new Decimal(data.actualExecutionAmount) }),
        ...(data.nominalExecutionAmount !== undefined && { nominalExecutionAmount: new Decimal(data.nominalExecutionAmount) }),
        ...(data.executionNote !== undefined && { executionNote: data.executionNote }),
        // Dates
        ...(data.plannedDate && { plannedDate: new Date(data.plannedDate) }),
        ...(data.forecastDate !== undefined && { forecastDate: data.forecastDate ? new Date(data.forecastDate) : null }),
        ...(data.actualDate !== undefined && { actualDate: data.actualDate ? new Date(data.actualDate) : null }),
        ...(data.isRecurring !== undefined && { isRecurring: data.isRecurring }),
        ...(data.recurringMonths !== undefined && { recurringMonths: data.recurringMonths }),
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

    const totalBudgetInflow = inflows.reduce(
      (sum, item) => sum.add(item.budgetAmount),
      new Decimal(0),
    );
    const totalBudgetOutflow = outflows.reduce(
      (sum, item) => sum.add(item.budgetAmount),
      new Decimal(0),
    );
    const totalForecastInflow = inflows.reduce(
      (sum, item) => sum.add(item.forecastAmount),
      new Decimal(0),
    );
    const totalForecastOutflow = outflows.reduce(
      (sum, item) => sum.add(item.forecastAmount),
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
        budget: {
          inflow: totalBudgetInflow,
          outflow: totalBudgetOutflow,
          net: totalBudgetInflow.minus(totalBudgetOutflow),
        },
        forecast: {
          inflow: totalForecastInflow,
          outflow: totalForecastOutflow,
          net: totalForecastInflow.minus(totalForecastOutflow),
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

  // ============================================
  // NEW CF TABLE METHODS
  // ============================================

  async deleteCashFlowItem(id: string) {
    await this.prisma.cashFlowItem.delete({
      where: { id },
    });
    return { message: 'Cash flow item deleted successfully' };
  }

  async approveVariance(id: string, userId: string) {
    const item = await this.prisma.cashFlowItem.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException('Cash flow item not found');
    }

    return this.prisma.cashFlowItem.update({
      where: { id },
      data: {
        isVarianceApproved: true,
        updatedAt: new Date(),
      },
    });
  }

  async exportCashFlowToExcel(projectId: string): Promise<Buffer> {
    const items = await this.prisma.cashFlowItem.findMany({
      where: { projectId },
      orderBy: { plannedDate: 'asc' },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Cash Flow');

    // Header
    worksheet.columns = [
      { header: '유형', key: 'type', width: 10 },
      { header: '카테고리', key: 'category', width: 15 },
      { header: '항목', key: 'mainItem', width: 20 },
      { header: '소항목', key: 'subItem', width: 20 },
      { header: '설명', key: 'description', width: 30 },
      { header: '예산액', key: 'budgetAmount', width: 15 },
      { header: '전망액', key: 'forecastAmount', width: 15 },
      { header: '실제액', key: 'actualAmount', width: 15 },
      { header: '차이액', key: 'varianceAmount', width: 15 },
      { header: '차이사유', key: 'varianceReason', width: 30 },
      { header: '차이승인', key: 'isVarianceApproved', width: 10 },
      { header: '계획일', key: 'plannedDate', width: 12 },
      { header: '전망일', key: 'forecastDate', width: 12 },
      { header: '실제일', key: 'actualDate', width: 12 },
    ];

    // Style header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Data
    items.forEach((item) => {
      worksheet.addRow({
        type: item.type === 'INFLOW' ? '유입' : '유출',
        category: item.category,
        mainItem: item.mainItem,
        subItem: item.subItem || '',
        description: item.description || '',
        budgetAmount: Number(item.budgetAmount),
        forecastAmount: Number(item.forecastAmount),
        actualAmount: Number(item.actualAmount),
        varianceAmount: Number(item.varianceAmount),
        varianceReason: item.varianceReason || '',
        isVarianceApproved: item.isVarianceApproved ? '승인' : '미승인',
        plannedDate: item.plannedDate.toISOString().split('T')[0],
        forecastDate: item.forecastDate
          ? item.forecastDate.toISOString().split('T')[0]
          : '',
        actualDate: item.actualDate
          ? item.actualDate.toISOString().split('T')[0]
          : '',
      });
    });

    // Number formatting
    worksheet.getColumn('budgetAmount').numFmt = '#,##0';
    worksheet.getColumn('forecastAmount').numFmt = '#,##0';
    worksheet.getColumn('actualAmount').numFmt = '#,##0';
    worksheet.getColumn('varianceAmount').numFmt = '#,##0';

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async getCashFlowAnalytics(projectId: string) {
    const items = await this.prisma.cashFlowItem.findMany({
      where: { projectId },
      orderBy: { plannedDate: 'asc' },
    });

    // Calculate monthly aggregates
    const monthlyData = new Map();

    items.forEach((item) => {
      const month = item.plannedDate.toISOString().slice(0, 7); // YYYY-MM
      if (!monthlyData.has(month)) {
        monthlyData.set(month, {
          month,
          budgetInflow: new Decimal(0),
          budgetOutflow: new Decimal(0),
          forecastInflow: new Decimal(0),
          forecastOutflow: new Decimal(0),
          actualInflow: new Decimal(0),
          actualOutflow: new Decimal(0),
        });
      }

      const data = monthlyData.get(month);
      if (item.type === 'INFLOW') {
        data.budgetInflow = data.budgetInflow.add(item.budgetAmount);
        data.forecastInflow = data.forecastInflow.add(item.forecastAmount);
        data.actualInflow = data.actualInflow.add(item.actualAmount);
      } else {
        data.budgetOutflow = data.budgetOutflow.add(item.budgetAmount);
        data.forecastOutflow = data.forecastOutflow.add(item.forecastAmount);
        data.actualOutflow = data.actualOutflow.add(item.actualAmount);
      }
    });

    // Calculate cumulative cash flow
    const monthlyArray = Array.from(monthlyData.values()).sort((a, b) =>
      a.month.localeCompare(b.month),
    );

    let cumulativeCash = new Decimal(0);
    const cumulativeData = monthlyArray.map((month) => {
      const netForecast = month.forecastInflow.minus(month.forecastOutflow);
      cumulativeCash = cumulativeCash.add(netForecast);

      return {
        month: month.month,
        budgetNet: month.budgetInflow.minus(month.budgetOutflow).toNumber(),
        forecastNet: netForecast.toNumber(),
        actualNet: month.actualInflow.minus(month.actualOutflow).toNumber(),
        cumulativeCash: cumulativeCash.toNumber(),
      };
    });

    // Variance statistics
    const unapprovedVariances = items.filter(
      (item) =>
        !item.isVarianceApproved && Math.abs(Number(item.varianceAmount)) > 0,
    );

    return {
      monthlyData: cumulativeData,
      statistics: {
        totalItems: items.length,
        unapprovedVariances: unapprovedVariances.length,
        lowestCash: Math.min(...cumulativeData.map((d) => d.cumulativeCash)),
        highestCash: Math.max(...cumulativeData.map((d) => d.cumulativeCash)),
      },
    };
  }

  async getCashFlowPivot(projectId: string) {
    // Get project to determine date range (from construction start to 6 months after completion)
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        constructionStartDate: true,
        completionDate: true,
      },
    });

    if (!project?.constructionStartDate || !project?.completionDate) {
      throw new Error('Project must have construction start and completion dates');
    }

    // Generate month range: from construction start to 6 months after completion
    const startDate = new Date(project.constructionStartDate);
    const endDate = new Date(project.completionDate);
    endDate.setMonth(endDate.getMonth() + 6); // Add 6 months after completion

    const months: string[] = [];
    const currentDate = new Date(startDate);
    currentDate.setDate(1); // Set to first day of month

    while (currentDate <= endDate) {
      months.push(currentDate.toISOString().slice(0, 7)); // YYYY-MM format
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    // Get all cash flow items
    const items = await this.prisma.cashFlowItem.findMany({
      where: { projectId },
      orderBy: [
        { type: 'asc' }, // INFLOW first, then OUTFLOW
        { category: 'asc' },
        { mainItem: 'asc' },
      ],
    });

    // Group items by category and mainItem
    const rows: any[] = [];
    const categoriesMap = new Map<string, any[]>();

    items.forEach((item) => {
      const key = `${item.type}|${item.category}|${item.mainItem}`;
      if (!categoriesMap.has(key)) {
        categoriesMap.set(key, []);
      }
      categoriesMap.get(key)!.push(item);
    });

    // Build pivot table rows
    categoriesMap.forEach((itemsInCategory, key) => {
      const [type, category, mainItem] = key.split('|');

      // Initialize monthly data
      const monthlyData: any = {};
      months.forEach((month) => {
        monthlyData[month] = {
          budget: new Decimal(0),
          forecast: new Decimal(0),
          actual: new Decimal(0),
        };
      });

      // Aggregate data by month
      itemsInCategory.forEach((item) => {
        const month = item.plannedDate.toISOString().slice(0, 7);
        if (monthlyData[month]) {
          monthlyData[month].budget = monthlyData[month].budget.add(
            item.budgetAmount,
          );
          monthlyData[month].forecast = monthlyData[month].forecast.add(
            item.forecastAmount,
          );
          monthlyData[month].actual = monthlyData[month].actual.add(
            item.actualAmount,
          );
        }
      });

      // Convert to numbers for JSON
      const monthlyDataConverted: any = {};
      Object.keys(monthlyData).forEach((month) => {
        monthlyDataConverted[month] = {
          budget: monthlyData[month].budget.toNumber(),
          forecast: monthlyData[month].forecast.toNumber(),
          actual: monthlyData[month].actual.toNumber(),
        };
      });

      rows.push({
        type,
        category,
        mainItem,
        monthlyData: monthlyDataConverted,
        total: {
          budget: (Object.values(monthlyData).reduce(
            (sum: Decimal, m: any) => sum.add(m.budget),
            new Decimal(0),
          ) as Decimal).toNumber(),
          forecast: (Object.values(monthlyData).reduce(
            (sum: Decimal, m: any) => sum.add(m.forecast),
            new Decimal(0),
          ) as Decimal).toNumber(),
          actual: (Object.values(monthlyData).reduce(
            (sum: Decimal, m: any) => sum.add(m.actual),
            new Decimal(0),
          ) as Decimal).toNumber(),
        },
      });
    });

    // Calculate monthly totals
    const monthlyTotals: any = {};
    months.forEach((month) => {
      monthlyTotals[month] = {
        inflowBudget: new Decimal(0),
        inflowForecast: new Decimal(0),
        inflowActual: new Decimal(0),
        outflowBudget: new Decimal(0),
        outflowForecast: new Decimal(0),
        outflowActual: new Decimal(0),
      };
    });

    rows.forEach((row) => {
      Object.keys(row.monthlyData).forEach((month) => {
        const data = row.monthlyData[month];
        if (row.type === 'INFLOW') {
          monthlyTotals[month].inflowBudget = monthlyTotals[month].inflowBudget.add(data.budget);
          monthlyTotals[month].inflowForecast = monthlyTotals[month].inflowForecast.add(data.forecast);
          monthlyTotals[month].inflowActual = monthlyTotals[month].inflowActual.add(data.actual);
        } else {
          monthlyTotals[month].outflowBudget = monthlyTotals[month].outflowBudget.add(data.budget);
          monthlyTotals[month].outflowForecast = monthlyTotals[month].outflowForecast.add(data.forecast);
          monthlyTotals[month].outflowActual = monthlyTotals[month].outflowActual.add(data.actual);
        }
      });
    });

    // Convert totals to numbers
    const monthlyTotalsConverted: any = {};
    Object.keys(monthlyTotals).forEach((month) => {
      const t = monthlyTotals[month];
      monthlyTotalsConverted[month] = {
        inflowBudget: t.inflowBudget.toNumber(),
        inflowForecast: t.inflowForecast.toNumber(),
        inflowActual: t.inflowActual.toNumber(),
        outflowBudget: t.outflowBudget.toNumber(),
        outflowForecast: t.outflowForecast.toNumber(),
        outflowActual: t.outflowActual.toNumber(),
        netBudget: t.inflowBudget.minus(t.outflowBudget).toNumber(),
        netForecast: t.inflowForecast.minus(t.outflowForecast).toNumber(),
        netActual: t.inflowActual.minus(t.outflowActual).toNumber(),
      };
    });

    return {
      months,
      rows,
      monthlyTotals: monthlyTotalsConverted,
      project: {
        constructionStartDate: project.constructionStartDate,
        completionDate: project.completionDate,
      },
    };
  }
}
