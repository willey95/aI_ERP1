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
  // Phase tracking
  preContractDate?: string;
  internalApprovalDate?: string;
  constructionStartDate?: string;
  currentPhase?: 'PRE_CONTRACT' | 'INTERNAL_APPROVAL' | 'CONSTRUCTION';
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
  remainingBeforeExec: string;
  remainingAfterExec: string;
  pendingExecutionAmount: string;
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

// Financial & Simulation Types

export interface BudgetFormula {
  id: string;
  name: string;
  category: string;
  formula: string;
  description?: string;
  variables: string[];
  isActive: boolean;
  createdAt: string;
}

export interface ProjectVariable {
  id: string;
  projectId: string;
  name: string;
  value: number;
  unit?: string;
  description?: string;
}

export interface CalculationHistory {
  id: string;
  budgetItemId: string;
  formulaUsed: string;
  variables: Record<string, number>;
  result: number;
  calculatedAt: string;
  calculatedBy?: string;
  budgetItem?: {
    name: string;
  };
}

export interface BudgetTemplate {
  id: string;
  name: string;
  description?: string;
  structure: any;
  createdBy: string;
  createdAt: string;
}

export interface MonthlyProjection {
  month: number;
  revenue: number;
  cost: number;
  interest: number;
  netCashFlow: number;
  cumulativeCash: number;
}

export interface FinancialModel {
  id: string;
  projectId: string;
  version: number;
  isActive: boolean;
  salesRate: number;
  salesStartMonth: number;
  constructionDelay?: number;
  costInflation?: number;
  interestRate: number;
  monthlyProjections: MonthlyProjection[];
  totalRevenue: number;
  totalCost: number;
  expectedProfit: number;
  roi: number;
  lowestCashPoint: number;
  lowestCashMonth: number;
  createdAt: string;
  calculatedBy: string;
}

export interface FinancialModelSummary {
  totalRevenue: number;
  totalCost: number;
  expectedProfit: number;
  roi: number;
  lowestCashPoint: number;
  lowestCashMonth: number;
  monthlyProjections?: MonthlyProjection[];
}

export interface CashFlowItem {
  id: string;
  projectId: string;
  budgetItemId?: string;
  type: 'INFLOW' | 'OUTFLOW';
  category: string;
  mainItem: string;
  subItem?: string;
  description?: string;

  // Amounts
  budgetAmount: string | number;
  forecastAmount: string | number;
  actualAmount: string | number;

  // Budget vs Forecast Variance
  varianceAmount: string | number;
  varianceReason?: string;
  isVarianceApproved: boolean;

  // Actual vs Nominal Execution
  actualExecutionType: 'ACTUAL' | 'NOMINAL' | 'SPLIT';
  actualExecutionAmount: string | number;
  nominalExecutionAmount: string | number;
  executionNote?: string;

  // Dates
  plannedDate: string;
  forecastDate?: string;
  actualDate?: string;
  isRecurring: boolean;
  recurringMonths?: number;
  createdAt: string;
}

export interface CashFlowSummary {
  projectId: string;
  summary: {
    planned: {
      inflow: number;
      outflow: number;
      net: number;
    };
    actual: {
      inflow: number;
      outflow: number;
      net: number;
    };
  };
  items: CashFlowItem[];
}

export interface Recommendation {
  type: 'CRITICAL' | 'WARNING' | 'SUCCESS' | 'INFO';
  category: string;
  title: string;
  description: string;
  action: string;
}

export interface SimulationParameters {
  salesDelay: number;
  salesRate: number;
  costChange: number;
  interestChange: number;
}

export interface SimulationResults {
  monthlyProjections: MonthlyProjection[];
  totalRevenue: number;
  totalCost: number;
  totalInterest: number;
  totalProfit: number;
  roi: number;
  lowestCashPoint: number;
  lowestCashMonth: number;
}

export interface Simulation {
  id: string;
  projectId: string;
  name: string;
  salesDelay: number;
  salesRate: number;
  costChange: number;
  interestChange: number;
  projectedProfit: number;
  projectedROI: number;
  lowestCash: number;
  lowestCashMonth: number;
  recommendations: Recommendation[];
  createdAt: string;
  createdBy: string;
}

export interface SimulationRunResult {
  projectId: string;
  scenario: string;
  parameters: SimulationParameters;
  results: SimulationResults;
  recommendations: Recommendation[];
  projectedProfit: number;
  projectedROI: number;
  lowestCash: number;
  lowestCashMonth: number;
}

export interface ScenarioComparison {
  bestROI: { name: string; roi: number };
  worstROI: { name: string; roi: number };
  bestCashFlow: { name: string; cashFlow: number };
  worstCashFlow: { name: string; cashFlow: number };
  highestProfit: { name: string; profit: number };
  lowestProfit: { name: string; profit: number };
}

export interface ScenarioComparisonResult {
  projectId: string;
  scenarios: Array<{
    name: string;
    parameters: SimulationParameters;
    results: SimulationResults;
    recommendations: Recommendation[];
  }>;
  comparison: ScenarioComparison;
}

export interface DetailedBudgetItem extends BudgetItem {
  budgetAmount: number;
  spentAmount: number;
  remainingAmount: number;
  formula?: {
    id: string;
    name: string;
  };
}

export interface DetailedBudget {
  projectId: string;
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  budgetItems: DetailedBudgetItem[];
}

export interface CalculationRequest {
  formulaId: string;
  variables: Record<string, number | string>;
}

export interface CalculationResult {
  result: number;
  formula: string;
  variables: Record<string, number>;
  formulaUsed: string;
}

export interface ScenarioInput {
  name: string;
  salesDelay: number;
  salesRate: number;
  costChange: number;
  interestChange: number;
  id?: number;
}
