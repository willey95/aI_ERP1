import api from '../lib/api';

export interface BudgetTransfer {
  id: string;
  sourceItemId: string;
  targetItemId: string;
  amount: number;
  transferType: 'PARTIAL' | 'FULL';
  reason: string;
  description?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  executionRequestId?: string;
  approvedById?: string;
  approvedAt?: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  sourceItem?: {
    id: string;
    category: string;
    mainItem: string;
    subItem?: string;
    remainingBudget: number;
  };
  targetItem?: {
    id: string;
    category: string;
    mainItem: string;
    subItem?: string;
    remainingBudget: number;
  };
  createdBy?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  approvedBy?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface CreateBudgetTransferDto {
  sourceItemId: string;
  targetItemId: string;
  amount: number;
  transferType: 'PARTIAL' | 'FULL';
  reason: string;
  description?: string;
  executionRequestId?: string;
}

export interface ApproveBudgetTransferDto {
  approved: boolean;
  decision?: string;
  rejectionReason?: string;
}

export const budgetTransferService = {
  /**
   * 예산 전용 요청 생성
   */
  async createTransfer(data: CreateBudgetTransferDto): Promise<BudgetTransfer> {
    const response = await api.post('/budget/transfers', data);
    return response.data;
  },

  /**
   * 예산 전용 승인/반려
   */
  async approveTransfer(
    transferId: string,
    data: ApproveBudgetTransferDto
  ): Promise<{ success: boolean; message: string; transfer: BudgetTransfer }> {
    const response = await api.patch(`/budget/transfers/${transferId}/approve`, data);
    return response.data;
  },

  /**
   * 프로젝트별 전용 이력 조회
   */
  async getTransferHistory(projectId: string, status?: string): Promise<BudgetTransfer[]> {
    const response = await api.get(`/budget/transfers/project/${projectId}`, {
      params: { status },
    });
    return response.data;
  },

  /**
   * 대기 중인 전용 조회
   */
  async getPendingTransfers(projectId?: string): Promise<BudgetTransfer[]> {
    const response = await api.get('/budget/transfers/pending', {
      params: { projectId },
    });
    return response.data;
  },

  /**
   * 전용 상세 조회
   */
  async getTransferById(transferId: string): Promise<BudgetTransfer> {
    const response = await api.get(`/budget/transfers/${transferId}`);
    return response.data;
  },

  /**
   * 예산 항목의 전용 가능 금액 조회
   */
  async getAvailableForTransfer(budgetItemId: string): Promise<{
    budgetItemId: string;
    currentBudget: number;
    executedAmount: number;
    remainingBudget: number;
    pendingTransferOut: number;
    availableForTransfer: number;
  }> {
    const response = await api.get(`/budget/transfers/available/${budgetItemId}`);
    return response.data;
  },
};
