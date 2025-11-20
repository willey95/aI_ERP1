import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  /**
   * 프로젝트 전체 사업비 LANDSCAPE
   * 담당자가 품의 작성 시 전체 예산 현황을 파악
   */
  async getProjectLandscape(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        budgetItems: {
          where: { isActive: true },
          orderBy: [
            { category: 'asc' },
            { mainItem: 'asc' },
            { displayOrder: 'asc' },
          ],
        },
      },
    });

    if (!project) {
      throw new NotFoundException(`Project not found: ${projectId}`);
    }

    // 카테고리별 집계
    const categoryMap = new Map<string, any>();

    for (const item of project.budgetItems) {
      if (!categoryMap.has(item.category)) {
        categoryMap.set(item.category, {
          category: item.category,
          initialBudget: new Decimal(0),
          currentBudget: new Decimal(0),
          executedAmount: new Decimal(0),
          remainingBudget: new Decimal(0),
          executionRate: 0,
          items: [],
        });
      }

      const cat = categoryMap.get(item.category);
      cat.initialBudget = cat.initialBudget.plus(item.initialBudget);
      cat.currentBudget = cat.currentBudget.plus(item.currentBudget);
      cat.executedAmount = cat.executedAmount.plus(item.executedAmount);
      cat.remainingBudget = cat.remainingBudget.plus(item.remainingBeforeExec);
      cat.items.push(item);
    }

    // 집행률 계산
    const categories = Array.from(categoryMap.values()).map((cat) => {
      cat.executionRate = cat.currentBudget.equals(0)
        ? 0
        : cat.executedAmount.dividedBy(cat.currentBudget).times(100).toNumber();

      return {
        ...cat,
        initialBudget: cat.initialBudget.toNumber(),
        currentBudget: cat.currentBudget.toNumber(),
        executedAmount: cat.executedAmount.toNumber(),
        remainingBudget: cat.remainingBudget.toNumber(),
      };
    });

    return {
      project: {
        id: project.id,
        code: project.code,
        name: project.name,
        status: project.status,
        initialBudget: project.initialBudget.toNumber(),
        currentBudget: project.currentBudget.toNumber(),
        executedAmount: project.executedAmount.toNumber(),
        remainingBudget: project.remainingBudget.toNumber(),
        executionRate: project.executionRate,
      },
      categories,
      budgetItems: project.budgetItems.map((item) => ({
        id: item.id,
        category: item.category,
        mainItem: item.mainItem,
        subItem: item.subItem,
        initialBudget: item.initialBudget.toNumber(),
        currentBudget: item.currentBudget.toNumber(),
        executedAmount: item.executedAmount.toNumber(),
        remainingBeforeExec: item.remainingBeforeExec.toNumber(),
        remainingAfterExec: item.remainingAfterExec.toNumber(),
        pendingExecutionAmount: item.pendingExecutionAmount.toNumber(),
        executionRate: item.executionRate,
        displayOrder: item.displayOrder,
      })),
    };
  }

  /**
   * 집행 이력 (Timeline)
   * 승인권자가 집행 내역을 시간순으로 파악
   */
  async getExecutionHistory(projectId: string, limit: number = 50) {
    const executions = await this.prisma.executionRequest.findMany({
      where: {
        projectId,
        status: 'APPROVED',
      },
      include: {
        budgetItem: {
          select: {
            category: true,
            mainItem: true,
            subItem: true,
          },
        },
        requestedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        approvals: {
          where: {
            status: 'APPROVED',
          },
          orderBy: {
            decidedAt: 'desc',
          },
          take: 1,
          select: {
            approver: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
            decidedAt: true,
            decision: true,
          },
        },
      },
      orderBy: {
        completedAt: 'desc',
      },
      take: limit,
    });

    return executions.map((exec) => ({
      id: exec.id,
      requestNumber: exec.requestNumber,
      amount: exec.amount.toNumber(),
      executionDate: exec.executionDate,
      purpose: exec.purpose,
      description: exec.description,
      budgetItem: exec.budgetItem,
      requestedBy: exec.requestedBy,
      approvedBy: exec.approvals[0]?.approver,
      approvedAt: exec.approvals[0]?.decidedAt,
      decision: exec.approvals[0]?.decision,
      completedAt: exec.completedAt,
    }));
  }

  /**
   * 예산 전용 이력
   */
  async getBudgetTransferHistory(projectId: string, limit: number = 50) {
    const budgetItems = await this.prisma.budgetItem.findMany({
      where: { projectId },
      select: { id: true },
    });

    const budgetItemIds = budgetItems.map((item) => item.id);

    const transfers = await this.prisma.budgetTransfer.findMany({
      where: {
        OR: [
          { sourceItemId: { in: budgetItemIds } },
          { targetItemId: { in: budgetItemIds } },
        ],
        status: 'APPROVED',
      },
      include: {
        sourceItem: {
          select: {
            category: true,
            mainItem: true,
            subItem: true,
          },
        },
        targetItem: {
          select: {
            category: true,
            mainItem: true,
            subItem: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        approvedAt: 'desc',
      },
      take: limit,
    });

    return transfers.map((transfer) => ({
      id: transfer.id,
      amount: transfer.amount.toNumber(),
      transferType: transfer.transferType,
      reason: transfer.reason,
      description: transfer.description,
      sourceItem: transfer.sourceItem,
      targetItem: transfer.targetItem,
      createdBy: transfer.createdBy,
      approvedBy: transfer.approvedBy,
      createdAt: transfer.createdAt,
      approvedAt: transfer.approvedAt,
    }));
  }

  /**
   * 승인권자용 상세 대시보드
   * - 집행 내역
   * - 예산 전용 내역
   * - 위험 지표
   * - 카테고리별 분석
   */
  async getApproverDashboard(projectId: string, executionRequestId?: string) {
    // 프로젝트 LANDSCAPE
    const landscape = await this.getProjectLandscape(projectId);

    // 집행 이력 (최근 20건)
    const executionHistory = await this.getExecutionHistory(projectId, 20);

    // 예산 전용 이력 (최근 10건)
    const transferHistory = await this.getBudgetTransferHistory(projectId, 10);

    // 위험 지표 계산
    const riskIndicators = await this.calculateRiskIndicators(projectId);

    // 특정 집행 요청이 있는 경우 상세 분석
    let executionAnalysis = null;
    if (executionRequestId) {
      executionAnalysis = await this.analyzeExecutionRequest(executionRequestId);
    }

    return {
      landscape,
      executionHistory,
      transferHistory,
      riskIndicators,
      executionAnalysis,
      generatedAt: new Date(),
    };
  }

  /**
   * 위험 지표 계산
   */
  async calculateRiskIndicators(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        budgetItems: {
          where: { isActive: true },
        },
      },
    });

    if (!project) {
      throw new NotFoundException(`Project not found: ${projectId}`);
    }

    // 1. 공사비 항목 분석 (공사비 훼손 위험)
    const constructionItems = project.budgetItems.filter(
      (item) => item.category === '지출' && item.mainItem.includes('공사비')
    );

    const constructionBudget = constructionItems.reduce(
      (sum, item) => sum.plus(item.currentBudget),
      new Decimal(0)
    );

    const constructionExecuted = constructionItems.reduce(
      (sum, item) => sum.plus(item.executedAmount),
      new Decimal(0)
    );

    const constructionRemaining = constructionItems.reduce(
      (sum, item) => sum.plus(item.remainingBeforeExec),
      new Decimal(0)
    );

    const constructionRate = constructionBudget.equals(0)
      ? 0
      : constructionExecuted.dividedBy(constructionBudget).times(100).toNumber();

    // 2. 예산 초과 위험이 있는 항목
    const overBudgetRisk = project.budgetItems
      .filter((item) => item.executionRate > 90)
      .map((item) => ({
        id: item.id,
        category: item.category,
        mainItem: item.mainItem,
        subItem: item.subItem,
        executionRate: item.executionRate,
        remainingBeforeExec: item.remainingBeforeExec.toNumber(),
        remainingAfterExec: item.remainingAfterExec.toNumber(),
      }));

    // 3. 전체 집행률
    const overallExecutionRate = project.executionRate;

    // 4. 공사비 훼손 가능성
    const constructionDamageRisk = constructionRate > 95 || constructionRemaining.lessThan(project.currentBudget.times(0.05));

    // 5. 위험 점수 (0-100)
    let riskScore = 0;
    if (overallExecutionRate > 90) riskScore += 30;
    if (constructionRate > 95) riskScore += 40;
    if (overBudgetRisk.length > 3) riskScore += 20;
    if (constructionDamageRisk) riskScore += 10;

    return {
      overallExecutionRate,
      constructionBudget: constructionBudget.toNumber(),
      constructionExecuted: constructionExecuted.toNumber(),
      constructionRemaining: constructionRemaining.toNumber(),
      constructionRate,
      constructionDamageRisk,
      overBudgetRisk,
      riskScore: Math.min(riskScore, 100),
      riskLevel: riskScore < 30 ? 'LOW' : riskScore < 60 ? 'MEDIUM' : 'HIGH',
    };
  }

  /**
   * 집행 요청 상세 분석
   * 승인권자가 특정 집행 요청의 정당성을 판단하기 위한 분석
   */
  async analyzeExecutionRequest(executionRequestId: string) {
    const execution = await this.prisma.executionRequest.findUnique({
      where: { id: executionRequestId },
      include: {
        project: true,
        budgetItem: true,
        requestedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            department: true,
          },
        },
        budgetTransfers: {
          include: {
            sourceItem: {
              select: {
                category: true,
                mainItem: true,
                subItem: true,
                remainingBeforeExec: true,
                remainingAfterExec: true,
                pendingExecutionAmount: true,
              },
            },
            targetItem: {
              select: {
                category: true,
                mainItem: true,
                subItem: true,
                remainingBeforeExec: true,
                remainingAfterExec: true,
                pendingExecutionAmount: true,
              },
            },
          },
        },
        approvals: {
          include: {
            approver: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
          orderBy: {
            step: 'asc',
          },
        },
      },
    });

    if (!execution) {
      throw new NotFoundException(`Execution request not found: ${executionRequestId}`);
    }

    // 1. 예산 가용성 체크
    const budgetAvailable = execution.budgetItem.remainingBeforeExec.greaterThanOrEqualTo(execution.amount);

    // 2. 같은 예산 항목에서의 최근 집행 내역
    const recentExecutions = await this.prisma.executionRequest.findMany({
      where: {
        budgetItemId: execution.budgetItemId,
        status: 'APPROVED',
        id: { not: executionRequestId },
      },
      orderBy: {
        completedAt: 'desc',
      },
      take: 5,
      select: {
        id: true,
        requestNumber: true,
        amount: true,
        purpose: true,
        completedAt: true,
      },
    });

    // 3. 집행 후 예상 잔액
    const projectedRemaining = execution.budgetItem.remainingBeforeExec.minus(execution.amount);
    const projectedExecutionRate = execution.budgetItem.currentBudget.equals(0)
      ? 0
      : execution.budgetItem.executedAmount
          .plus(execution.amount)
          .dividedBy(execution.budgetItem.currentBudget)
          .times(100)
          .toNumber();

    // 4. 공사비 영향 분석
    const isConstructionItem = execution.budgetItem.mainItem.includes('공사비');
    let constructionImpact = null;

    if (isConstructionItem) {
      const constructionItems = await this.prisma.budgetItem.findMany({
        where: {
          projectId: execution.projectId,
          isActive: true,
          mainItem: { contains: '공사비' },
        },
      });

      const totalConstructionBudget = constructionItems.reduce(
        (sum, item) => sum.plus(item.currentBudget),
        new Decimal(0)
      );

      const totalConstructionRemaining = constructionItems.reduce(
        (sum, item) => sum.plus(item.remainingBeforeExec),
        new Decimal(0)
      );

      const impactRate = totalConstructionBudget.equals(0)
        ? 0
        : execution.amount.dividedBy(totalConstructionBudget).times(100).toNumber();

      const projectedConstructionRemaining = totalConstructionRemaining.minus(execution.amount);

      constructionImpact = {
        totalConstructionBudget: totalConstructionBudget.toNumber(),
        totalConstructionRemaining: totalConstructionRemaining.toNumber(),
        impactRate,
        projectedConstructionRemaining: projectedConstructionRemaining.toNumber(),
        damageRisk: projectedConstructionRemaining.lessThan(totalConstructionBudget.times(0.05)),
      };
    }

    // 5. 추천 의견 생성
    const recommendations = [];

    if (!budgetAvailable) {
      recommendations.push({
        level: 'CRITICAL',
        message: '예산 부족: 예산 전용이 필요합니다.',
      });
    }

    if (projectedExecutionRate > 90) {
      recommendations.push({
        level: 'WARNING',
        message: `집행 후 예산 소진율이 ${projectedExecutionRate.toFixed(1)}%에 도달합니다.`,
      });
    }

    if (constructionImpact?.damageRisk) {
      recommendations.push({
        level: 'CRITICAL',
        message: '공사비 훼손 위험: 총 공사비 잔액이 5% 미만으로 감소합니다.',
      });
    }

    if (execution.budgetTransfers.length > 0) {
      recommendations.push({
        level: 'INFO',
        message: `예산 전용 ${execution.budgetTransfers.length}건이 포함되어 있습니다.`,
      });
    }

    return {
      execution: {
        id: execution.id,
        requestNumber: execution.requestNumber,
        amount: execution.amount.toNumber(),
        executionDate: execution.executionDate,
        purpose: execution.purpose,
        description: execution.description,
        status: execution.status,
        requestedBy: execution.requestedBy,
      },
      budgetItem: {
        id: execution.budgetItem.id,
        category: execution.budgetItem.category,
        mainItem: execution.budgetItem.mainItem,
        subItem: execution.budgetItem.subItem,
        currentBudget: execution.budgetItem.currentBudget.toNumber(),
        executedAmount: execution.budgetItem.executedAmount.toNumber(),
        remainingBeforeExec: execution.budgetItem.remainingBeforeExec.toNumber(),
        remainingAfterExec: execution.budgetItem.remainingAfterExec.toNumber(),
        pendingExecutionAmount: execution.budgetItem.pendingExecutionAmount.toNumber(),
        executionRate: execution.budgetItem.executionRate,
      },
      budgetAvailable,
      projectedRemaining: projectedRemaining.toNumber(),
      projectedExecutionRate,
      recentExecutions: recentExecutions.map((ex) => ({
        ...ex,
        amount: ex.amount.toNumber(),
      })),
      budgetTransfers: execution.budgetTransfers.map((transfer) => ({
        id: transfer.id,
        amount: transfer.amount.toNumber(),
        transferType: transfer.transferType,
        reason: transfer.reason,
        sourceItem: transfer.sourceItem,
        targetItem: transfer.targetItem,
        status: transfer.status,
      })),
      constructionImpact,
      recommendations,
      approvalHistory: execution.approvals.map((approval) => ({
        step: approval.step,
        approverRole: approval.approverRole,
        approver: approval.approver,
        status: approval.status,
        decision: approval.decision,
        decidedAt: approval.decidedAt,
      })),
    };
  }

  /**
   * 담당자용 품의 작성 지원 데이터
   * - 예산 가용성 체크
   * - 전용 가능한 예산 항목 추천
   */
  async getProposalAssistance(projectId: string, budgetItemId: string, requestAmount: number) {
    const budgetItem = await this.prisma.budgetItem.findUnique({
      where: { id: budgetItemId },
      include: {
        project: {
          include: {
            budgetItems: {
              where: { isActive: true },
            },
          },
        },
      },
    });

    if (!budgetItem) {
      throw new NotFoundException(`Budget item not found: ${budgetItemId}`);
    }

    const amount = new Decimal(requestAmount);

    // 1. 예산 충분 여부
    const isSufficient = budgetItem.remainingBeforeExec.greaterThanOrEqualTo(amount);

    // 2. 부족한 경우 필요한 금액
    const shortage = isSufficient
      ? new Decimal(0)
      : amount.minus(budgetItem.remainingBeforeExec);

    // 3. 전용 가능한 예산 항목 찾기 (같은 프로젝트, 같은 category)
    const transferCandidates = budgetItem.project.budgetItems
      .filter((item) => {
        if (item.id === budgetItemId) return false;
        if (item.category !== budgetItem.category) return false;
        if (item.remainingBeforeExec.lessThanOrEqualTo(0)) return false;
        return true;
      })
      .map((item) => ({
        id: item.id,
        mainItem: item.mainItem,
        subItem: item.subItem,
        remainingBeforeExec: item.remainingBeforeExec.toNumber(),
        executionRate: item.executionRate,
        canCoverShortage: item.remainingBeforeExec.greaterThanOrEqualTo(shortage),
      }))
      .sort((a, b) => {
        // 집행률이 낮은 항목 우선
        return a.executionRate - b.executionRate;
      });

    // 4. 전용 시나리오 생성
    const transferScenarios = [];

    if (!isSufficient && transferCandidates.length > 0) {
      // 시나리오 1: 단일 항목에서 전체 전용
      const fullCoverCandidate = transferCandidates.find((c) => c.canCoverShortage);
      if (fullCoverCandidate) {
        transferScenarios.push({
          type: 'SINGLE_FULL',
          description: '단일 항목에서 부족분 전액 전용',
          transfers: [
            {
              sourceItemId: fullCoverCandidate.id,
              amount: shortage.toNumber(),
              transferType: 'PARTIAL',
            },
          ],
        });
      }

      // 시나리오 2: 복수 항목에서 분할 전용
      let remainingShortage = shortage;
      const multiTransfers = [];

      for (const candidate of transferCandidates.slice(0, 3)) {
        if (remainingShortage.lessThanOrEqualTo(0)) break;

        const transferAmount = Decimal.min(
          new Decimal(candidate.remainingBeforeExec),
          remainingShortage
        );

        multiTransfers.push({
          sourceItemId: candidate.id,
          sourceItem: `${candidate.mainItem}${candidate.subItem ? ' - ' + candidate.subItem : ''}`,
          amount: transferAmount.toNumber(),
          transferType: transferAmount.equals(candidate.remainingBeforeExec) ? 'FULL' : 'PARTIAL',
        });

        remainingShortage = remainingShortage.minus(transferAmount);
      }

      if (remainingShortage.lessThanOrEqualTo(0)) {
        transferScenarios.push({
          type: 'MULTIPLE',
          description: '복수 항목에서 분할 전용',
          transfers: multiTransfers,
        });
      }
    }

    return {
      budgetItem: {
        id: budgetItem.id,
        category: budgetItem.category,
        mainItem: budgetItem.mainItem,
        subItem: budgetItem.subItem,
        currentBudget: budgetItem.currentBudget.toNumber(),
        remainingBeforeExec: budgetItem.remainingBeforeExec.toNumber(),
        remainingAfterExec: budgetItem.remainingAfterExec.toNumber(),
        pendingExecutionAmount: budgetItem.pendingExecutionAmount.toNumber(),
        executionRate: budgetItem.executionRate,
      },
      requestAmount: amount.toNumber(),
      isSufficient,
      shortage: shortage.toNumber(),
      transferRequired: !isSufficient,
      transferCandidates,
      transferScenarios,
    };
  }
}
