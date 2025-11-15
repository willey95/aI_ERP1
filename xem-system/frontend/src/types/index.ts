export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  department?: string;
  position?: string;
}

export interface Project {
  id: string;
  code: string;
  name: string;
  location: string;
  projectType: string;
  status: string;
  landArea: number;
  buildingArea: number;
  totalFloorArea: number;
  units: number;
  initialBudget: string;
  currentBudget: string;
  executedAmount: string;
  remainingBudget: string;
  executionRate: number;
  expectedProfit: string;
  roi: number;
  riskScore: number;
  createdAt: string;
}

export interface BudgetItem {
  id: string;
  projectId: string;
  category: string;
  mainItem: string;
  subItem?: string;
  initialBudget: string;
  currentBudget: string;
  executedAmount: string;
  remainingBudget: string;
  executionRate: number;
  displayOrder: number;
}

export interface ExecutionRequest {
  id: string;
  requestNumber: string;
  projectId: string;
  budgetItemId: string;
  requestedById: string;
  amount: string;
  executionDate: string;
  purpose: string;
  description?: string;
  status: string;
  currentStep: number;
  createdAt: string;
}

export interface Approval {
  id: string;
  executionRequestId: string;
  step: number;
  approverRole: string;
  approverId?: string;
  status: string;
  decision?: string;
  decidedAt?: string;
}
