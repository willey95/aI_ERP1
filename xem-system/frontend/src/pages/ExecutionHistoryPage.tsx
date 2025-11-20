import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { ExecutionRequest, Project, BudgetItem, CashFlowItem } from '@/types';
import { useProjectStore } from '@/stores/projectStore';

interface MonthlyData {
  month: string;
  planned: number;
  approved: number;  // APPROVED 상태 집행금액
  pending: number;   // PENDING 상태 집행금액
  executed: number;  // 전체 집행금액 (호환성 유지)
  forecast: number;
}

export default function ExecutionHistoryPage() {
  const navigate = useNavigate();
  const globalSelectedProjectId = useProjectStore((state) => state.selectedProjectId);
  const setGlobalSelectedProjectId = useProjectStore((state) => state.setSelectedProjectId);

  // Initialize from global store or default to 'ALL'
  const [selectedProjectId, setSelectedProjectId] = useState<string>(globalSelectedProjectId || 'ALL');
  const [selectedBudgetItemId, setSelectedBudgetItemId] = useState<string>('ALL');

  // Sync with global store on mount and when global changes
  useEffect(() => {
    if (globalSelectedProjectId && globalSelectedProjectId !== selectedProjectId) {
      setSelectedProjectId(globalSelectedProjectId);
    }
  }, [globalSelectedProjectId]);

  // Update global store when local selection changes
  const handleProjectChange = (projectId: string) => {
    setSelectedProjectId(projectId);
    setGlobalSelectedProjectId(projectId);
    setSelectedBudgetItemId('ALL');
  };
  const [viewMode, setViewMode] = useState<'history' | 'forecast'>('history');
  const [timeRange, setTimeRange] = useState<'6m' | '12m' | '24m'>('12m');
  const [activeTab, setActiveTab] = useState<'execution' | 'cashflow'>('execution');

  // Fetch projects
  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await api.get('/projects');
      return response.data;
    },
  });

  // Fetch all executions
  const { data: executionsData, isLoading: executionsLoading } = useQuery({
    queryKey: ['executions', selectedProjectId],
    queryFn: async () => {
      const params = selectedProjectId !== 'ALL' ? `?projectId=${selectedProjectId}` : '';
      const response = await api.get(`/execution${params}`);
      return response.data;
    },
  });

  // Fetch budget items for selected project
  const { data: budgetData } = useQuery({
    queryKey: ['budget', selectedProjectId],
    queryFn: async () => {
      if (selectedProjectId === 'ALL') return null;
      const response = await api.get(`/budget/project/${selectedProjectId}`);
      return response.data;
    },
    enabled: selectedProjectId !== 'ALL',
  });

  // Fetch cash flow data for selected project
  const { data: cashFlowData, isLoading: cashFlowLoading } = useQuery({
    queryKey: ['cashflow', selectedProjectId],
    queryFn: async () => {
      if (selectedProjectId === 'ALL') return null;
      const response = await api.get(`/financial/cashflow/${selectedProjectId}`);
      return response.data;
    },
    enabled: selectedProjectId !== 'ALL',
  });

  const projects: Project[] = Array.isArray(projectsData) ? projectsData : (projectsData?.projects || []);
  const executions: ExecutionRequest[] = Array.isArray(executionsData) ? executionsData : (executionsData?.executions || []);
  const cashFlowItems: CashFlowItem[] = Array.isArray(cashFlowData) ? cashFlowData : [];

  // Extract budget items from summary structure
  const budgetItems: BudgetItem[] = useMemo(() => {
    const items: BudgetItem[] = [];
    if (budgetData?.summary && Array.isArray(budgetData.summary)) {
      budgetData.summary.forEach((category: any) => {
        if (category.items && Array.isArray(category.items)) {
          items.push(...category.items);
        }
      });
    }
    return items;
  }, [budgetData]);

  // Filter executions by budget item
  const filteredExecutions = useMemo(() => {
    let filtered = executions;
    if (selectedBudgetItemId !== 'ALL') {
      filtered = filtered.filter(e => e.budgetItemId === selectedBudgetItemId);
    }
    return filtered;
  }, [executions, selectedBudgetItemId]);

  // Group cash flow items by type
  const groupedCashFlow = useMemo(() => {
    const inflows = cashFlowItems.filter(item => item.type === 'INFLOW');
    const outflows = cashFlowItems.filter(item => item.type === 'OUTFLOW');
    return { inflows, outflows };
  }, [cashFlowItems]);

  // Generate monthly pivot data (horizontal layout)
  const monthlyPivotData = useMemo(() => {
    const months = parseInt(timeRange.replace('m', ''));
    const data: MonthlyData[] = [];
    const now = new Date();

    // Generate past months
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      // Calculate executed amount for this month
      const monthExecutions = filteredExecutions.filter(e => {
        if (!e.executionDate) {
          console.warn('Execution missing executionDate:', e.id);
          return false;
        }

        const execDate = new Date(e.executionDate);

        // Check for invalid dates
        if (isNaN(execDate.getTime())) {
          console.warn('Invalid executionDate for execution:', e.id, e.executionDate);
          return false;
        }

        // Match all executions for this month regardless of status
        return (
          execDate.getFullYear() === date.getFullYear() &&
          execDate.getMonth() === date.getMonth()
        );
      });

      // Separate by status
      const approvedExecutions = monthExecutions.filter(e => e.status === 'APPROVED');
      const pendingExecutions = monthExecutions.filter(e => e.status === 'PENDING');

      const approvedAmount = approvedExecutions.reduce((sum, e) => {
        const amount = parseFloat(e.amount?.toString() || '0');
        if (isNaN(amount)) {
          console.warn('Invalid amount for execution:', e.id, e.amount);
          return sum;
        }
        return sum + amount;
      }, 0);

      const pendingAmount = pendingExecutions.reduce((sum, e) => {
        const amount = parseFloat(e.amount?.toString() || '0');
        if (isNaN(amount)) {
          console.warn('Invalid amount for execution:', e.id, e.amount);
          return sum;
        }
        return sum + amount;
      }, 0);

      data.push({
        month: monthKey,
        planned: 0, // Would come from budget planning data
        approved: approvedAmount,
        pending: pendingAmount,
        executed: approvedAmount + pendingAmount, // 전체
        forecast: 0,
      });
    }

    // Add forecast for next 6 months
    if (viewMode === 'forecast') {
      // Calculate average based on approved executions only
      const avgMonthlyApproved = data.reduce((sum, d) => sum + d.approved, 0) / data.length;
      const avgMonthlyPending = data.reduce((sum, d) => sum + d.pending, 0) / data.length;

      for (let i = 1; i <= 6; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        data.push({
          month: monthKey,
          planned: 0,
          approved: 0,
          pending: 0,
          executed: 0,
          forecast: (avgMonthlyApproved + avgMonthlyPending) * 1.05, // Simple forecast with 5% growth
        });
      }
    }

    return data;
  }, [filteredExecutions, timeRange, viewMode]);

  // Calculate summary statistics
  const statistics = useMemo(() => {
    const approved = filteredExecutions.filter(e => e.status === 'APPROVED');
    const totalApproved = approved.reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0);
    const pending = filteredExecutions.filter(e => e.status === 'PENDING');
    const totalPending = pending.reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0);
    const rejected = filteredExecutions.filter(e => e.status === 'REJECTED');
    const totalRejected = rejected.reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0);

    // Total includes all statuses for comprehensive view
    const totalAll = filteredExecutions.reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0);

    return {
      totalExecuted: totalApproved, // Approved only
      totalPending,
      totalAll, // All statuses
      executionCount: approved.length,
      pendingCount: pending.length,
      rejectedCount: rejected.length,
      totalCount: filteredExecutions.length,
      avgExecutionAmount: filteredExecutions.length > 0 ? totalAll / filteredExecutions.length : 0,
    };
  }, [filteredExecutions]);

  // Format month for display
  const formatMonth = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    return `${year.slice(2)}.${month}`;
  };

  if (executionsLoading) {
    return (
      <div className="eink-container flex items-center justify-center h-96">
        <div className="eink-text">집행 데이터 로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="eink-container space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="eink-title eink-title-2xl mb-2">집행 히스토리 &amp; 전망</h1>
          <p className="eink-text-muted">프로젝트별, 예산별 집행 현황 및 현금흐름 전망</p>
        </div>
      </div>

      {/* Filters */}
      <div className="eink-card">
        <div className="eink-card-body">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Project Filter */}
            <div>
              <label className="eink-label">프로젝트</label>
              <select
                value={selectedProjectId}
                onChange={(e) => handleProjectChange(e.target.value)}
                className="eink-input eink-select"
              >
                <option value="ALL">전체 프로젝트</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.code} - {project.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Budget Item Filter */}
            <div>
              <label className="eink-label">예산항목</label>
              <select
                value={selectedBudgetItemId}
                onChange={(e) => setSelectedBudgetItemId(e.target.value)}
                disabled={selectedProjectId === 'ALL'}
                className="eink-input eink-select"
              >
                <option value="ALL">전체 항목</option>
                {budgetItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.mainItem} {item.subItem ? `- ${item.subItem}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* View Mode */}
            <div>
              <label className="eink-label">조회 모드</label>
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as 'history' | 'forecast')}
                className="eink-input eink-select"
              >
                <option value="history">히스토리</option>
                <option value="forecast">히스토리 + 전망</option>
              </select>
            </div>

            {/* Time Range */}
            <div>
              <label className="eink-label">기간</label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as '6m' | '12m' | '24m')}
                className="eink-input eink-select"
              >
                <option value="6m">6개월</option>
                <option value="12m">12개월</option>
                <option value="24m">24개월</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="eink-card">
          <div className="eink-card-body">
            <div className="eink-text-xs mb-1">총 요청금액</div>
            <div className="eink-number eink-number-lg text-eink-text">
              {formatCurrency(statistics.totalAll)}
            </div>
            <div className="eink-text-xs text-eink-text-subtle mt-1">전체 {statistics.totalCount}건</div>
          </div>
        </div>
        <div className="eink-card">
          <div className="eink-card-body">
            <div className="eink-text-xs mb-1">승인완료</div>
            <div className="eink-number eink-number-lg text-eink-success">
              {formatCurrency(statistics.totalExecuted)}
            </div>
            <div className="eink-text-xs text-eink-text-subtle mt-1">{statistics.executionCount}건</div>
          </div>
        </div>
        <div className="eink-card">
          <div className="eink-card-body">
            <div className="eink-text-xs mb-1">승인대기</div>
            <div className="eink-number eink-number-lg text-eink-warning">
              {formatCurrency(statistics.totalPending)}
            </div>
            <div className="eink-text-xs text-eink-text-subtle mt-1">{statistics.pendingCount}건</div>
          </div>
        </div>
        <div className="eink-card">
          <div className="eink-card-body">
            <div className="eink-text-xs mb-1">반려</div>
            <div className="eink-number eink-number-lg text-eink-danger">
              {statistics.rejectedCount}건
            </div>
          </div>
        </div>
        <div className="eink-card">
          <div className="eink-card-body">
            <div className="eink-text-xs mb-1">평균 집행액</div>
            <div className="eink-number eink-number-lg text-eink-text-muted">
              {formatCurrency(statistics.avgExecutionAmount)}
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Pivot Table - Horizontal Layout */}
      <div className="eink-card">
        <div className="eink-card-header">
          <h2 className="eink-title eink-title-md">
            월별 집행 현황 {viewMode === 'forecast' && '및 전망 (CF Forecast)'}
          </h2>
        </div>
        <div className="eink-card-body">
          <div className="overflow-x-auto">
            <table className="eink-table">
              <thead>
                <tr>
                  <th className="sticky left-0 bg-eink-paper-secondary z-10" style={{ minWidth: '120px' }}>구분</th>
                  {monthlyPivotData.map((data) => (
                    <th key={data.month} className="text-center" style={{ minWidth: '100px' }}>
                      {formatMonth(data.month)}
                    </th>
                  ))}
                  <th className="text-right" style={{ minWidth: '120px' }}>합계</th>
                </tr>
              </thead>
              <tbody>
                {/* Approved Row */}
                <tr className="bg-green-50/30">
                  <td className="sticky left-0 bg-green-50/30 z-10 font-semibold text-eink-success">승인완료</td>
                  {monthlyPivotData.map((data) => (
                    <td key={data.month} className="text-right eink-number eink-number-sm text-eink-success">
                      {data.approved > 0 ? formatCurrency(data.approved) : '-'}
                    </td>
                  ))}
                  <td className="text-right font-semibold eink-number text-eink-success">
                    {formatCurrency(monthlyPivotData.reduce((sum, d) => sum + d.approved, 0))}
                  </td>
                </tr>

                {/* Pending Row */}
                <tr className="bg-yellow-50/30">
                  <td className="sticky left-0 bg-yellow-50/30 z-10 font-semibold text-eink-warning">승인대기</td>
                  {monthlyPivotData.map((data) => (
                    <td key={data.month} className="text-right eink-number eink-number-sm text-eink-warning">
                      {data.pending > 0 ? formatCurrency(data.pending) : '-'}
                    </td>
                  ))}
                  <td className="text-right font-semibold eink-number text-eink-warning">
                    {formatCurrency(monthlyPivotData.reduce((sum, d) => sum + d.pending, 0))}
                  </td>
                </tr>

                {/* Total Row */}
                <tr className="border-t-2 border-eink-border">
                  <td className="sticky left-0 bg-white z-10 font-bold">합계</td>
                  {monthlyPivotData.map((data) => (
                    <td key={data.month} className="text-right eink-number eink-number-sm font-semibold">
                      {data.executed > 0 ? formatCurrency(data.executed) : '-'}
                    </td>
                  ))}
                  <td className="text-right font-bold eink-number">
                    {formatCurrency(monthlyPivotData.reduce((sum, d) => sum + d.executed, 0))}
                  </td>
                </tr>

                {/* Forecast Row (only in forecast mode) */}
                {viewMode === 'forecast' && (
                  <tr className="bg-eink-info-bg">
                    <td className="sticky left-0 bg-eink-info-bg z-10 font-semibold text-eink-info">
                      전망 (CF)
                    </td>
                    {monthlyPivotData.map((data) => (
                      <td key={data.month} className="text-right eink-number eink-number-sm text-eink-info">
                        {data.forecast > 0 ? formatCurrency(data.forecast) : '-'}
                      </td>
                    ))}
                    <td className="text-right font-semibold eink-number text-eink-info">
                      {formatCurrency(monthlyPivotData.reduce((sum, d) => sum + d.forecast, 0))}
                    </td>
                  </tr>
                )}

                {/* Cumulative Row */}
                <tr className="bg-eink-paper-secondary font-semibold border-t border-eink-border">
                  <td className="sticky left-0 bg-eink-paper-secondary z-10">누적 합계</td>
                  {monthlyPivotData.map((data, index) => {
                    const cumulative = monthlyPivotData
                      .slice(0, index + 1)
                      .reduce((sum, d) => sum + d.approved + d.pending + d.forecast, 0);
                    return (
                      <td key={data.month} className="text-right eink-number eink-number-sm">
                        {cumulative > 0 ? formatCurrency(cumulative) : '-'}
                      </td>
                    );
                  })}
                  <td className="text-right eink-number">
                    {formatCurrency(
                      monthlyPivotData.reduce((sum, d) => sum + d.approved + d.pending + d.forecast, 0)
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="mt-4 pt-4 border-t border-eink-border flex gap-6 eink-text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-50 border border-green-300"></div>
              <span className="eink-text-muted">승인완료</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-50 border border-yellow-300"></div>
              <span className="eink-text-muted">승인대기</span>
            </div>
            {viewMode === 'forecast' && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-eink-info-bg border border-eink-info-border"></div>
                <span className="eink-text-muted">전망 (평균 기반 5% 증가율 적용)</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="eink-card">
        <div className="eink-card-body p-0">
          <div className="flex border-b border-ink-3">
            <button
              onClick={() => setActiveTab('execution')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'execution'
                  ? 'bg-ink-1 text-ink-9 border-b-2 border-ink-9'
                  : 'bg-ink-0 text-ink-6 hover:bg-ink-1 hover:text-ink-8'
              }`}
            >
              집행 히스토리
            </button>
            <button
              onClick={() => setActiveTab('cashflow')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'cashflow'
                  ? 'bg-ink-1 text-ink-9 border-b-2 border-ink-9'
                  : 'bg-ink-0 text-ink-6 hover:bg-ink-1 hover:text-ink-8'
              }`}
              disabled={selectedProjectId === 'ALL'}
            >
              CF 상세
              {selectedProjectId === 'ALL' && (
                <span className="ml-2 text-xs text-ink-5">(프로젝트 선택 필요)</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Execution History Tab */}
      {activeTab === 'execution' && (
        <div className="eink-card">
          <div className="eink-card-header">
            <h2 className="eink-title eink-title-md">집행 내역 상세</h2>
          </div>
          <div className="eink-card-body">
            {filteredExecutions.length === 0 ? (
              <div className="text-center py-12">
                <p className="eink-text-muted">선택한 조건에 해당하는 집행 내역이 없습니다.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="eink-table">
                  <thead>
                    <tr>
                      <th>요청번호</th>
                      <th>프로젝트</th>
                      <th>예산항목</th>
                      <th className="text-right">금액</th>
                      <th>집행일</th>
                      <th>용도</th>
                      <th>상태</th>
                      <th>진행단계</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExecutions.map((execution: any) => (
                      <tr
                        key={execution.id}
                        onClick={() => navigate(`/executions/${execution.id}`)}
                        className="cursor-pointer hover:bg-eink-hover transition-colors"
                      >
                        <td className="eink-font-mono eink-number-sm text-blue-900 hover:underline">
                          {execution.requestNumber}
                        </td>
                        <td>{execution.project?.name || '-'}</td>
                        <td className="eink-text-sm">
                          {execution.budgetItem?.mainItem}
                          {execution.budgetItem?.subItem && (
                            <span className="eink-text-muted ml-1">- {execution.budgetItem.subItem}</span>
                          )}
                        </td>
                        <td className="text-right eink-number eink-number-sm">
                          {formatCurrency(execution.amount)}
                        </td>
                        <td className="eink-text-sm">{formatDate(execution.executionDate)}</td>
                        <td className="max-w-xs truncate">{execution.purpose}</td>
                        <td>
                          <span
                            className={`eink-badge ${
                              execution.status === 'APPROVED'
                                ? 'eink-badge-success'
                                : execution.status === 'PENDING'
                                ? 'eink-badge-warning'
                                : execution.status === 'REJECTED'
                                ? 'eink-badge-danger'
                                : 'eink-badge-info'
                            }`}
                          >
                            {execution.status}
                          </span>
                        </td>
                        <td className="eink-text-sm eink-text-muted">
                          Step {execution.currentStep}/4
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cash Flow Tab */}
      {activeTab === 'cashflow' && (
        <div className="space-y-6">
          {cashFlowLoading ? (
            <div className="eink-card">
              <div className="eink-card-body text-center py-12">
                <p className="eink-text-muted">CF 데이터 로딩 중...</p>
              </div>
            </div>
          ) : cashFlowItems.length === 0 ? (
            <div className="eink-card">
              <div className="eink-card-body text-center py-12">
                <p className="eink-text-muted">현금흐름 데이터가 없습니다.</p>
              </div>
            </div>
          ) : (
            <>
              {/* INFLOW Section */}
              {groupedCashFlow.inflows.length > 0 && (
                <div className="eink-card">
                  <div className="eink-card-header">
                    <h2 className="eink-title eink-title-md">
                      수입 (INFLOW)
                      <span className="ml-3 text-sm font-normal text-ink-6">
                        {groupedCashFlow.inflows.length}건
                      </span>
                    </h2>
                  </div>
                  <div className="eink-card-body">
                    <div className="overflow-x-auto">
                      <table className="eink-table">
                        <thead>
                          <tr>
                            <th className="text-sm">항목</th>
                            <th className="text-right text-sm">예산금액</th>
                            <th className="text-right text-sm">전망금액</th>
                            <th className="text-right text-sm">실집행금액</th>
                            <th className="text-right text-sm">차이</th>
                            <th className="text-center text-sm">집행구분</th>
                            <th className="text-center text-sm">예정일</th>
                            <th className="text-center text-sm">전망일</th>
                            <th className="text-center text-sm">실행일</th>
                          </tr>
                        </thead>
                        <tbody>
                          {groupedCashFlow.inflows.map((item) => (
                            <tr key={item.id}>
                              <td>
                                <div className="text-sm font-medium text-ink-9">
                                  {item.category}
                                </div>
                                <div className="text-xs text-ink-6">
                                  {item.mainItem}
                                  {item.subItem && ` - ${item.subItem}`}
                                </div>
                              </td>
                              <td className="text-right">
                                <span className="eink-number text-base">
                                  {formatCurrency(item.budgetAmount)}
                                </span>
                              </td>
                              <td className="text-right">
                                <span className="eink-number text-base">
                                  {formatCurrency(item.forecastAmount)}
                                </span>
                              </td>
                              <td className="text-right">
                                <span className="eink-number text-base font-semibold">
                                  {formatCurrency(item.actualAmount)}
                                </span>
                              </td>
                              <td className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <span
                                    className={`eink-number text-base ${
                                      item.isVarianceApproved
                                        ? 'text-green-700'
                                        : 'text-red-700'
                                    }`}
                                  >
                                    {formatCurrency(item.varianceAmount)}
                                  </span>
                                  {item.isVarianceApproved ? (
                                    <span className="text-green-600 text-lg">✓</span>
                                  ) : (
                                    <span className="text-red-600 text-lg">⚠</span>
                                  )}
                                </div>
                              </td>
                              <td className="text-center">
                                <span
                                  className={`inline-block px-3 py-1 text-xs font-medium rounded ${
                                    item.actualExecutionType === 'ACTUAL'
                                      ? 'bg-ink-8 text-ink-0'
                                      : item.actualExecutionType === 'NOMINAL'
                                      ? 'bg-ink-2 text-ink-9'
                                      : 'bg-ink-5 text-ink-0'
                                  }`}
                                >
                                  {item.actualExecutionType}
                                </span>
                              </td>
                              <td className="text-center text-sm text-ink-7">
                                {formatDate(item.plannedDate)}
                              </td>
                              <td className="text-center text-sm text-ink-7">
                                {item.forecastDate ? formatDate(item.forecastDate) : '-'}
                              </td>
                              <td className="text-center text-sm text-ink-7">
                                {item.actualDate ? formatDate(item.actualDate) : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-ink-1 font-semibold border-t-2 border-ink-4">
                            <td>합계</td>
                            <td className="text-right eink-number text-base">
                              {formatCurrency(
                                groupedCashFlow.inflows.reduce(
                                  (sum, item) => sum + parseFloat(item.budgetAmount.toString()),
                                  0
                                )
                              )}
                            </td>
                            <td className="text-right eink-number text-base">
                              {formatCurrency(
                                groupedCashFlow.inflows.reduce(
                                  (sum, item) => sum + parseFloat(item.forecastAmount.toString()),
                                  0
                                )
                              )}
                            </td>
                            <td className="text-right eink-number text-base">
                              {formatCurrency(
                                groupedCashFlow.inflows.reduce(
                                  (sum, item) => sum + parseFloat(item.actualAmount.toString()),
                                  0
                                )
                              )}
                            </td>
                            <td className="text-right eink-number text-base">
                              {formatCurrency(
                                groupedCashFlow.inflows.reduce(
                                  (sum, item) => sum + parseFloat(item.varianceAmount.toString()),
                                  0
                                )
                              )}
                            </td>
                            <td colSpan={4}></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* OUTFLOW Section */}
              {groupedCashFlow.outflows.length > 0 && (
                <div className="eink-card">
                  <div className="eink-card-header">
                    <h2 className="eink-title eink-title-md">
                      지출 (OUTFLOW)
                      <span className="ml-3 text-sm font-normal text-ink-6">
                        {groupedCashFlow.outflows.length}건
                      </span>
                    </h2>
                  </div>
                  <div className="eink-card-body">
                    <div className="overflow-x-auto">
                      <table className="eink-table">
                        <thead>
                          <tr>
                            <th className="text-sm">항목</th>
                            <th className="text-right text-sm">예산금액</th>
                            <th className="text-right text-sm">전망금액</th>
                            <th className="text-right text-sm">실집행금액</th>
                            <th className="text-right text-sm">차이</th>
                            <th className="text-center text-sm">집행구분</th>
                            <th className="text-center text-sm">예정일</th>
                            <th className="text-center text-sm">전망일</th>
                            <th className="text-center text-sm">실행일</th>
                          </tr>
                        </thead>
                        <tbody>
                          {groupedCashFlow.outflows.map((item) => (
                            <tr key={item.id}>
                              <td>
                                <div className="text-sm font-medium text-ink-9">
                                  {item.category}
                                </div>
                                <div className="text-xs text-ink-6">
                                  {item.mainItem}
                                  {item.subItem && ` - ${item.subItem}`}
                                </div>
                              </td>
                              <td className="text-right">
                                <span className="eink-number text-base">
                                  {formatCurrency(item.budgetAmount)}
                                </span>
                              </td>
                              <td className="text-right">
                                <span className="eink-number text-base">
                                  {formatCurrency(item.forecastAmount)}
                                </span>
                              </td>
                              <td className="text-right">
                                <span className="eink-number text-base font-semibold">
                                  {formatCurrency(item.actualAmount)}
                                </span>
                              </td>
                              <td className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <span
                                    className={`eink-number text-base ${
                                      item.isVarianceApproved
                                        ? 'text-green-700'
                                        : 'text-red-700'
                                    }`}
                                  >
                                    {formatCurrency(item.varianceAmount)}
                                  </span>
                                  {item.isVarianceApproved ? (
                                    <span className="text-green-600 text-lg">✓</span>
                                  ) : (
                                    <span className="text-red-600 text-lg">⚠</span>
                                  )}
                                </div>
                              </td>
                              <td className="text-center">
                                <span
                                  className={`inline-block px-3 py-1 text-xs font-medium rounded ${
                                    item.actualExecutionType === 'ACTUAL'
                                      ? 'bg-ink-8 text-ink-0'
                                      : item.actualExecutionType === 'NOMINAL'
                                      ? 'bg-ink-2 text-ink-9'
                                      : 'bg-ink-5 text-ink-0'
                                  }`}
                                >
                                  {item.actualExecutionType}
                                </span>
                              </td>
                              <td className="text-center text-sm text-ink-7">
                                {formatDate(item.plannedDate)}
                              </td>
                              <td className="text-center text-sm text-ink-7">
                                {item.forecastDate ? formatDate(item.forecastDate) : '-'}
                              </td>
                              <td className="text-center text-sm text-ink-7">
                                {item.actualDate ? formatDate(item.actualDate) : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-ink-1 font-semibold border-t-2 border-ink-4">
                            <td>합계</td>
                            <td className="text-right eink-number text-base">
                              {formatCurrency(
                                groupedCashFlow.outflows.reduce(
                                  (sum, item) => sum + parseFloat(item.budgetAmount.toString()),
                                  0
                                )
                              )}
                            </td>
                            <td className="text-right eink-number text-base">
                              {formatCurrency(
                                groupedCashFlow.outflows.reduce(
                                  (sum, item) => sum + parseFloat(item.forecastAmount.toString()),
                                  0
                                )
                              )}
                            </td>
                            <td className="text-right eink-number text-base">
                              {formatCurrency(
                                groupedCashFlow.outflows.reduce(
                                  (sum, item) => sum + parseFloat(item.actualAmount.toString()),
                                  0
                                )
                              )}
                            </td>
                            <td className="text-right eink-number text-base">
                              {formatCurrency(
                                groupedCashFlow.outflows.reduce(
                                  (sum, item) => sum + parseFloat(item.varianceAmount.toString()),
                                  0
                                )
                              )}
                            </td>
                            <td colSpan={4}></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Overall Summary */}
              <div className="eink-card bg-ink-1">
                <div className="eink-card-header">
                  <h2 className="eink-title eink-title-md">현금흐름 요약</h2>
                </div>
                <div className="eink-card-body">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <div className="text-sm text-ink-6">총 수입 (예산)</div>
                      <div className="eink-number text-xl font-semibold text-green-700">
                        {formatCurrency(
                          groupedCashFlow.inflows.reduce(
                            (sum, item) => sum + parseFloat(item.budgetAmount.toString()),
                            0
                          )
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-ink-6">총 지출 (예산)</div>
                      <div className="eink-number text-xl font-semibold text-red-700">
                        {formatCurrency(
                          groupedCashFlow.outflows.reduce(
                            (sum, item) => sum + parseFloat(item.budgetAmount.toString()),
                            0
                          )
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-ink-6">순현금흐름 (예산)</div>
                      <div className="eink-number text-xl font-semibold text-ink-9">
                        {formatCurrency(
                          groupedCashFlow.inflows.reduce(
                            (sum, item) => sum + parseFloat(item.budgetAmount.toString()),
                            0
                          ) -
                            groupedCashFlow.outflows.reduce(
                              (sum, item) => sum + parseFloat(item.budgetAmount.toString()),
                              0
                            )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
