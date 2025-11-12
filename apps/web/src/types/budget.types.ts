export type BudgetCategory = 'revenue' | 'expense';
export type BudgetItemType =
  | 'presale' // 분양수입
  | 'rental' // 임대수입
  | 'land' // 토지비
  | 'construction' // 공사비
  | 'design' // 설계/감리
  | 'contributions' // 부담금
  | 'finance' // 금융비용
  | 'marketing' // 마케팅
  | 'other'; // 기타

export interface BudgetItem {
  id: string;
  projectId: string;
  category: BudgetCategory;
  type: BudgetItemType;
  name: string;
  code: string; // Budget item code (e.g., "R-001", "E-001")
  parentId?: string; // For hierarchical budget structure
  initialAmount: number; // 최초 예산
  currentAmount: number; // 변경 예산
  executedAmount: number; // 집행액
  remainingAmount: number; // 잔액
  executionRate: number; // 집행률 (%)
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetOverview {
  projectId: string;
  revenue: {
    presale: number;
    rental: number;
    other: number;
    total: number;
  };
  expense: {
    land: number;
    construction: number;
    design: number;
    contributions: number;
    finance: number;
    marketing: number;
    other: number;
    total: number;
  };
  profit: number;
  profitMargin: number; // %
  executionRate: number; // %
  items: BudgetItem[];
}

export interface CreateBudgetItemDto {
  projectId: string;
  category: BudgetCategory;
  type: BudgetItemType;
  name: string;
  code: string;
  parentId?: string;
  initialAmount: number;
  description?: string;
}

export interface UpdateBudgetItemDto extends Partial<CreateBudgetItemDto> {
  currentAmount?: number;
}

export interface BudgetChange {
  id: string;
  budgetItemId: string;
  previousAmount: number;
  newAmount: number;
  changeAmount: number;
  reason: string;
  approvedBy: string;
  approvedAt: string;
  createdAt: string;
}
