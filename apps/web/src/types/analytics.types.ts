export interface DashboardMetrics {
  totalProjects: number;
  activeProjects: number;
  totalBudget: number;
  totalExecuted: number;
  averageExecutionRate: number;
  pendingApprovals: number;
  recentExecutions: RecentExecution[];
  riskAlerts: RiskAlert[];
}

export interface RecentExecution {
  id: string;
  executionNumber: string;
  projectName: string;
  amount: number;
  status: string;
  createdAt: string;
}

export interface RiskAlert {
  id: string;
  type: 'danger' | 'warning' | 'info';
  title: string;
  message: string;
  projectId?: string;
  projectName?: string;
  createdAt: string;
}

export interface CashFlowData {
  projectId: string;
  months: string[]; // Array of month labels
  revenue: number[]; // Monthly revenue
  expense: number[]; // Monthly expense
  netCashFlow: number[]; // Net cash flow
  cumulativeCashFlow: number[]; // Cumulative cash flow
  minCashPoint: {
    month: string;
    amount: number;
  };
}

export interface ExecutionTrend {
  period: string; // "2024-01" or "2024-Q1"
  planned: number;
  actual: number;
  variance: number;
  variancePercentage: number;
}

export interface ProjectComparison {
  projectId: string;
  projectName: string;
  totalBudget: number;
  executed: number;
  executionRate: number;
  riskScore: number;
}

export interface BudgetWaterfall {
  category: string;
  value: number;
  fill: string;
  isTotal?: boolean;
}

export interface SimulationScenario {
  name: string;
  presaleDelay?: number; // months
  presaleRate?: number; // percentage (0-100)
  constructionCostChange?: number; // percentage (-100 to 100)
  interestRateChange?: number; // percentage points
}

export interface SimulationResult {
  scenarioName: string;
  expectedProfit: number;
  minCashPoint: {
    month: string;
    amount: number;
  };
  roi: number;
  cashFlowData: CashFlowData;
  recommendations: string[];
}
