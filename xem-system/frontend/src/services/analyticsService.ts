import api from '../lib/api';

export interface ProjectLandscape {
  project: {
    id: string;
    code: string;
    name: string;
    status: string;
    initialBudget: number;
    currentBudget: number;
    executedAmount: number;
    remainingBudget: number;
    executionRate: number;
  };
  categories: Array<{
    category: string;
    initialBudget: number;
    currentBudget: number;
    executedAmount: number;
    remainingBudget: number;
    executionRate: number;
    items: Array<any>;
  }>;
  budgetItems: Array<{
    id: string;
    category: string;
    mainItem: string;
    subItem?: string;
    initialBudget: number;
    currentBudget: number;
    executedAmount: number;
    remainingBudget: number;
    executionRate: number;
    displayOrder: number;
  }>;
}

export interface ProposalAssistance {
  budgetItem: {
    id: string;
    category: string;
    mainItem: string;
    subItem?: string;
    currentBudget: number;
    remainingBudget: number;
    executionRate: number;
  };
  requestAmount: number;
  isSufficient: boolean;
  shortage: number;
  transferRequired: boolean;
  transferCandidates: Array<{
    id: string;
    mainItem: string;
    subItem?: string;
    remainingBudget: number;
    executionRate: number;
    canCoverShortage: boolean;
  }>;
  transferScenarios: Array<{
    type: string;
    description: string;
    transfers: Array<{
      sourceItemId: string;
      sourceItem?: string;
      amount: number;
      transferType: string;
    }>;
  }>;
}

export interface RiskIndicators {
  overallExecutionRate: number;
  constructionBudget: number;
  constructionExecuted: number;
  constructionRemaining: number;
  constructionRate: number;
  constructionDamageRisk: boolean;
  overBudgetRisk: Array<{
    id: string;
    category: string;
    mainItem: string;
    subItem?: string;
    executionRate: number;
    remainingBudget: number;
  }>;
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface ExecutionAnalysis {
  execution: {
    id: string;
    requestNumber: string;
    amount: number;
    executionDate: string;
    purpose: string;
    description?: string;
    status: string;
    requestedBy: any;
  };
  budgetItem: {
    id: string;
    category: string;
    mainItem: string;
    subItem?: string;
    currentBudget: number;
    executedAmount: number;
    remainingBudget: number;
    executionRate: number;
  };
  budgetAvailable: boolean;
  projectedRemaining: number;
  projectedExecutionRate: number;
  recentExecutions: Array<any>;
  budgetTransfers: Array<any>;
  constructionImpact?: {
    totalConstructionBudget: number;
    totalConstructionRemaining: number;
    impactRate: number;
    projectedConstructionRemaining: number;
    damageRisk: boolean;
  };
  recommendations: Array<{
    level: 'INFO' | 'WARNING' | 'CRITICAL';
    message: string;
  }>;
  approvalHistory: Array<any>;
}

export interface ApproverDashboard {
  landscape: ProjectLandscape;
  executionHistory: Array<any>;
  transferHistory: Array<any>;
  riskIndicators: RiskIndicators;
  executionAnalysis?: ExecutionAnalysis;
  generatedAt: string;
}

export const analyticsService = {
  /**
   * 프로젝트 전체 사업비 LANDSCAPE
   */
  async getProjectLandscape(projectId: string): Promise<ProjectLandscape> {
    const response = await api.get(`/analytics/landscape/${projectId}`);
    return response.data;
  },

  /**
   * 집행 이력 조회
   */
  async getExecutionHistory(projectId: string, limit: number = 50): Promise<any[]> {
    const response = await api.get(`/analytics/execution-history/${projectId}`, {
      params: { limit },
    });
    return response.data;
  },

  /**
   * 예산 전용 이력 조회
   */
  async getBudgetTransferHistory(projectId: string, limit: number = 50): Promise<any[]> {
    const response = await api.get(`/analytics/transfer-history/${projectId}`, {
      params: { limit },
    });
    return response.data;
  },

  /**
   * 승인권자용 통합 대시보드
   */
  async getApproverDashboard(
    projectId: string,
    executionRequestId?: string
  ): Promise<ApproverDashboard> {
    const response = await api.get(`/analytics/approver-dashboard/${projectId}`, {
      params: { executionRequestId },
    });
    return response.data;
  },

  /**
   * 위험 지표 계산
   */
  async calculateRiskIndicators(projectId: string): Promise<RiskIndicators> {
    const response = await api.get(`/analytics/risk-indicators/${projectId}`);
    return response.data;
  },

  /**
   * 집행 요청 상세 분석
   */
  async analyzeExecutionRequest(executionRequestId: string): Promise<ExecutionAnalysis> {
    const response = await api.get(`/analytics/execution-analysis/${executionRequestId}`);
    return response.data;
  },

  /**
   * 담당자용 품의 작성 지원
   */
  async getProposalAssistance(
    projectId: string,
    budgetItemId: string,
    requestAmount: number
  ): Promise<ProposalAssistance> {
    const response = await api.get('/analytics/proposal-assistance', {
      params: { projectId, budgetItemId, requestAmount },
    });
    return response.data;
  },
};
