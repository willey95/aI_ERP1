import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class SimulationService {
  constructor(private prisma: PrismaService) {}

  // ============================================
  // SIMULATION MANAGEMENT
  // ============================================

  async findAll(projectId: string) {
    const simulations = await this.prisma.simulation.findMany({
      where: { projectId },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return simulations;
  }

  async findOne(id: string) {
    return this.prisma.simulation.findUnique({
      where: { id },
    });
  }

  async createSimulation(data: any, userId: string) {
    const result = await this.runSimulation(data.projectId, data, userId);

    return this.prisma.simulation.create({
      data: {
        projectId: data.projectId,
        name: data.name,
        salesDelay: data.salesDelay || 0,
        salesRate: data.salesRate,
        costChange: data.costChange || 0,
        interestChange: data.interestChange || 0,
        projectedProfit: result.projectedProfit,
        projectedROI: result.projectedROI,
        lowestCash: result.lowestCash,
        lowestCashMonth: result.lowestCashMonth,
        recommendations: result.recommendations,
        createdBy: userId,
      },
    });
  }

  async deleteSimulation(id: string) {
    return this.prisma.simulation.delete({
      where: { id },
    });
  }

  // ============================================
  // SCENARIO ANALYSIS
  // ============================================

  async runSimulation(projectId: string, data: any, userId: string) {
    // Get project data
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        budgetItems: { where: { isActive: true } },
        financialModels: {
          where: { isActive: true },
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    const baseModel = project.financialModels[0];

    // Calculate scenario results
    const scenarioResults = this.calculateScenario(project, baseModel, data);

    // Generate AI recommendations
    const recommendations = this.generateRecommendations(project, scenarioResults, data);

    return {
      projectId,
      scenario: data.name || '시나리오',
      parameters: {
        salesDelay: data.salesDelay || 0,
        salesRate: data.salesRate,
        costChange: data.costChange || 0,
        interestChange: data.interestChange || 0,
      },
      results: scenarioResults,
      recommendations,
      projectedProfit: scenarioResults.totalProfit,
      projectedROI: scenarioResults.roi,
      lowestCash: scenarioResults.lowestCashPoint,
      lowestCashMonth: scenarioResults.lowestCashMonth,
    };
  }

  async compareScenarios(projectId: string, scenarios: any[], userId: string) {
    const results = [];

    for (const scenario of scenarios) {
      const result = await this.runSimulation(projectId, scenario, userId);
      results.push({
        name: scenario.name,
        parameters: result.parameters,
        results: result.results,
        recommendations: result.recommendations,
      });
    }

    return {
      projectId,
      scenarios: results,
      comparison: this.compareScenarioResults(results),
    };
  }

  async getRecommendations(simulationId: string) {
    const simulation = await this.prisma.simulation.findUnique({
      where: { id: simulationId },
    });

    if (!simulation) {
      throw new NotFoundException(`Simulation with ID ${simulationId} not found`);
    }

    return {
      simulationId,
      recommendations: simulation.recommendations,
    };
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private calculateScenario(project: any, baseModel: any, scenario: any): any {
    const {
      salesDelay = 0,
      salesRate,
      costChange = 0,
      interestChange = 0,
    } = scenario;

    // Base parameters from financial model or defaults
    const baseSalesRate = baseModel?.salesRate || 80;
    const baseSalesStartMonth = baseModel?.salesStartMonth || 6;
    const baseInterestRate = baseModel?.interestRate || 5.5;
    const baseCostInflation = baseModel?.costInflation || 0;

    // Adjusted parameters
    const adjustedSalesRate = salesRate || baseSalesRate;
    const adjustedSalesStartMonth = baseSalesStartMonth + salesDelay;
    const adjustedInterestRate = baseInterestRate + interestChange;
    const adjustedCostInflation = baseCostInflation + costChange;

    // Calculate monthly projections
    const projectionMonths = 36;
    const projections = [];
    let cumulativeCash = new Decimal(0);
    let totalRevenue = new Decimal(0);
    let totalCost = new Decimal(0);
    let totalInterest = new Decimal(0);

    const initialBudget = project.initialBudget || new Decimal(10000000000); // 100억 기본값

    for (let month = 0; month < projectionMonths; month++) {
      // Revenue calculation
      const isAfterSalesStart = month >= adjustedSalesStartMonth;
      const monthlySalesRate = isAfterSalesStart ? adjustedSalesRate / 12 : 0;
      const monthlyRevenue = initialBudget.mul(monthlySalesRate / 100);

      // Cost calculation with inflation
      const inflationFactor = 1 + (adjustedCostInflation / 100) * (month / 12);
      const baseMonthlyCost = initialBudget.mul(0.08); // 8% monthly spend
      const monthlyCost = baseMonthlyCost.mul(inflationFactor);

      // Interest calculation
      const monthlyInterest = cumulativeCash.lt(0)
        ? cumulativeCash.abs().mul(adjustedInterestRate / 100 / 12)
        : new Decimal(0);

      // Net cash flow
      const netCashFlow = monthlyRevenue.minus(monthlyCost).minus(monthlyInterest);
      cumulativeCash = cumulativeCash.add(netCashFlow);

      totalRevenue = totalRevenue.add(monthlyRevenue);
      totalCost = totalCost.add(monthlyCost);
      totalInterest = totalInterest.add(monthlyInterest);

      projections.push({
        month: month + 1,
        revenue: monthlyRevenue.toNumber(),
        cost: monthlyCost.toNumber(),
        interest: monthlyInterest.toNumber(),
        netCashFlow: netCashFlow.toNumber(),
        cumulativeCash: cumulativeCash.toNumber(),
      });
    }

    // Find lowest cash point
    let lowestCash = new Decimal(0);
    let lowestCashMonth = 0;

    projections.forEach((p) => {
      const cash = new Decimal(p.cumulativeCash);
      if (cash.lt(lowestCash)) {
        lowestCash = cash;
        lowestCashMonth = p.month;
      }
    });

    const totalProfit = totalRevenue.minus(totalCost).minus(totalInterest);
    const totalExpense = totalCost.add(totalInterest);
    const roi = totalExpense.toNumber() > 0
      ? (totalProfit.toNumber() / totalExpense.toNumber()) * 100
      : 0;

    return {
      monthlyProjections: projections,
      totalRevenue: totalRevenue,
      totalCost: totalCost,
      totalInterest: totalInterest,
      totalProfit: totalProfit,
      roi,
      lowestCashPoint: lowestCash,
      lowestCashMonth,
    };
  }

  private generateRecommendations(project: any, results: any, scenario: any): any {
    const recommendations = [];

    // Cash flow recommendations
    if (results.lowestCashPoint.lt(-1000000000)) { // -10억 이하
      recommendations.push({
        type: 'CRITICAL',
        category: '현금흐름',
        title: '심각한 현금부족 위험',
        description: `${results.lowestCashMonth}개월차에 ${Math.abs(results.lowestCashPoint.toNumber() / 100000000).toFixed(1)}억원의 현금부족이 예상됩니다.`,
        action: '추가 자금조달 또는 분양시기 조정이 필요합니다.',
      });
    } else if (results.lowestCashPoint.lt(0)) {
      recommendations.push({
        type: 'WARNING',
        category: '현금흐름',
        title: '현금부족 주의',
        description: `${results.lowestCashMonth}개월차에 ${Math.abs(results.lowestCashPoint.toNumber() / 100000000).toFixed(1)}억원의 현금부족이 예상됩니다.`,
        action: '운전자금 확보를 권장합니다.',
      });
    }

    // ROI recommendations
    if (results.roi < 10) {
      recommendations.push({
        type: 'WARNING',
        category: '수익성',
        title: '낮은 투자수익률',
        description: `예상 ROI가 ${results.roi.toFixed(2)}%로 목표치를 하회합니다.`,
        action: '비용절감 또는 분양가 인상을 검토하세요.',
      });
    } else if (results.roi > 20) {
      recommendations.push({
        type: 'SUCCESS',
        category: '수익성',
        title: '우수한 투자수익률',
        description: `예상 ROI가 ${results.roi.toFixed(2)}%로 우수합니다.`,
        action: '현재 계획을 유지하세요.',
      });
    }

    // Sales rate recommendations
    if (scenario.salesRate < 70) {
      recommendations.push({
        type: 'WARNING',
        category: '분양',
        title: '낮은 분양률',
        description: `목표 분양률 ${scenario.salesRate}%는 시장 평균을 하회합니다.`,
        action: '마케팅 강화 또는 가격 조정이 필요합니다.',
      });
    }

    // Cost change recommendations
    if (scenario.costChange > 5) {
      recommendations.push({
        type: 'WARNING',
        category: '공사비',
        title: '공사비 인상 위험',
        description: `${scenario.costChange}%의 공사비 인상이 수익성에 영향을 줍니다.`,
        action: '장기 자재계약 또는 공사방식 변경을 검토하세요.',
      });
    }

    // Interest rate recommendations
    if (scenario.interestChange > 1) {
      recommendations.push({
        type: 'WARNING',
        category: '금융비용',
        title: '금리 인상 위험',
        description: `${scenario.interestChange}%p의 금리 인상으로 이자비용이 증가합니다.`,
        action: '고정금리 전환 또는 조기 분양을 검토하세요.',
      });
    }

    return recommendations;
  }

  private compareScenarioResults(scenarios: any[]): any {
    if (scenarios.length === 0) return null;

    const comparison = {
      bestROI: null as any,
      worstROI: null as any,
      bestCashFlow: null as any,
      worstCashFlow: null as any,
      highestProfit: null as any,
      lowestProfit: null as any,
    };

    scenarios.forEach((scenario) => {
      const roi = scenario.results.roi;
      const cashFlow = scenario.results.lowestCashPoint.toNumber();
      const profit = scenario.results.totalProfit.toNumber();

      // ROI comparison
      if (!comparison.bestROI || roi > comparison.bestROI.roi) {
        comparison.bestROI = { name: scenario.name, roi };
      }
      if (!comparison.worstROI || roi < comparison.worstROI.roi) {
        comparison.worstROI = { name: scenario.name, roi };
      }

      // Cash flow comparison
      if (!comparison.bestCashFlow || cashFlow > comparison.bestCashFlow.cashFlow) {
        comparison.bestCashFlow = { name: scenario.name, cashFlow };
      }
      if (!comparison.worstCashFlow || cashFlow < comparison.worstCashFlow.cashFlow) {
        comparison.worstCashFlow = { name: scenario.name, cashFlow };
      }

      // Profit comparison
      if (!comparison.highestProfit || profit > comparison.highestProfit.profit) {
        comparison.highestProfit = { name: scenario.name, profit };
      }
      if (!comparison.lowestProfit || profit < comparison.lowestProfit.profit) {
        comparison.lowestProfit = { name: scenario.name, profit };
      }
    });

    return comparison;
  }
}
