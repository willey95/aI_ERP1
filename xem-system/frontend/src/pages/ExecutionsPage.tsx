import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useProjectStore } from '@/stores/projectStore';
import api from '@/lib/api';
import { formatCurrency, formatDate, formatPercentage } from '@/lib/utils';
import type { ExecutionRequest, Project, BudgetItem } from '@/types';

export default function ExecutionsPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const selectedProjectId = useProjectStore((state) => state.selectedProjectId);
  const setSelectedProjectId = useProjectStore((state) => state.setSelectedProjectId);

  // Fetch all projects for the dropdown
  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await api.get('/projects');
      return response.data;
    },
  });

  // Fetch execution requests
  const { data, isLoading } = useQuery({
    queryKey: ['executions'],
    queryFn: async () => {
      const response = await api.get('/execution');
      return response.data;
    },
  });

  // Fetch budget items for the selected project
  const { data: budgetData, isLoading: isBudgetLoading } = useQuery({
    queryKey: ['budget', selectedProjectId],
    queryFn: async () => {
      if (!selectedProjectId) return null;
      const response = await api.get(`/budget/project/${selectedProjectId}`);
      return response.data;
    },
    enabled: !!selectedProjectId,
  });

  const projects: Project[] = Array.isArray(projectsData) ? projectsData : (projectsData?.projects || []);
  const executions: ExecutionRequest[] = Array.isArray(data) ? data : (data?.executions || []);

  // Extract budget items from summary structure
  const budgetItems: BudgetItem[] = [];
  if (budgetData?.summary && Array.isArray(budgetData.summary)) {
    budgetData.summary.forEach((category: any) => {
      if (category.items && Array.isArray(category.items)) {
        budgetItems.push(...category.items);
      }
    });
  }

  // Filter executions by status
  const filteredExecutions = statusFilter === 'ALL'
    ? executions
    : executions.filter(e => e.status === statusFilter);

  // Get unique statuses for filter buttons
  const statuses = ['ALL', ...Array.from(new Set(executions.map(e => e.status)))];

  // Calculate totals for budget table
  const calculateTotal = (items: BudgetItem[]) => {
    return items.reduce(
      (sum, item) => ({
        current: sum.current + parseFloat(item.currentBudget || '0'),
        executed: sum.executed + parseFloat(item.executedAmount || '0'),
        pending: sum.pending + parseFloat(item.pendingExecutionAmount || '0'),
        remainingAfter: sum.remainingAfter + parseFloat(item.remainingAfterExec || '0'),
      }),
      { current: 0, executed: 0, pending: 0, remainingAfter: 0 }
    );
  };

  // Get execution rate color class
  const getExecutionRateColor = (rate: number): string => {
    return rate >= 100 ? 'text-red-600' : 'text-emerald-600';
  };

  // Separate items into revenue and expense
  const revenueItems = budgetItems.filter(item =>
    item.category.includes('수입') || item.category.includes('분양') || item.category.includes('매출')
  );
  const expenseItems = budgetItems.filter(item =>
    !item.category.includes('수입') && !item.category.includes('분양') && !item.category.includes('매출')
  );

  // Separate construction costs from other essential expenses
  const constructionItems = expenseItems.filter(item => item.mainItem === '공사비');
  const essentialItems = expenseItems.filter(item => item.mainItem !== '공사비');

  // Group essential items by mainItem
  const groupedEssential = essentialItems.reduce((acc, item) => {
    if (!acc[item.mainItem]) {
      acc[item.mainItem] = [];
    }
    acc[item.mainItem].push(item);
    return acc;
  }, {} as Record<string, BudgetItem[]>);

  const revenueTotal = calculateTotal(revenueItems);
  const expenseTotal = calculateTotal(expenseItems);
  const essentialTotal = calculateTotal(essentialItems);
  const constructionTotal = calculateTotal(constructionItems);
  const netTotal = {
    current: revenueTotal.current - expenseTotal.current,
    executed: revenueTotal.executed - expenseTotal.executed,
    pending: revenueTotal.pending - expenseTotal.pending,
    remainingAfter: revenueTotal.remainingAfter - expenseTotal.remainingAfter,
  };

  // Calculate construction cost recovery (Total Revenue - Construction Costs)
  const constructionRecovery = {
    current: revenueTotal.current - constructionTotal.current,
    executed: revenueTotal.executed - constructionTotal.executed,
    pending: revenueTotal.pending - constructionTotal.pending,
    remainingAfter: revenueTotal.remainingAfter - constructionTotal.remainingAfter,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">Loading execution requests...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Project Selector */}
      <div className="mb-6">
        <label htmlFor="project" className="block text-base font-medium text-ink-7 mb-2">
          Select Project
        </label>
        <select
          id="project"
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-ink-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-ink-7"
        >
          <option value="">-- Select a project --</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.code} - {project.name}
            </option>
          ))}
        </select>
      </div>

      {/* Action Bar */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex gap-2">
          {statuses.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                statusFilter === status
                  ? 'bg-ink-9 text-ink-0'
                  : 'bg-ink-0 text-ink-7 border border-ink-4 hover:bg-ink-1'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 text-sm font-medium text-ink-0 bg-ink-9 rounded-lg hover:bg-ink-7 transition-colors"
        >
          + New Request
        </button>
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <CreateExecutionForm
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false);
            queryClient.invalidateQueries({ queryKey: ['executions'] });
          }}
        />
      )}

      {/* Executions List */}
      {filteredExecutions.length === 0 ? (
        <div className="bg-ink-0 rounded-lg border-2 border-ink-3 p-12 text-center">
          <p className="text-ink-6">No execution requests found</p>
        </div>
      ) : (
        <div className="bg-ink-0 rounded-lg border-2 border-ink-3 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-ink-3">
              <thead className="bg-ink-3">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-bold text-ink-7 uppercase tracking-wider">
                    Request #
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-ink-7 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-ink-7 uppercase tracking-wider">
                    Budget Item
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-ink-7 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-ink-7 uppercase tracking-wider">
                    Execution Date
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-ink-7 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-ink-7 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-ink-7 uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="bg-ink-0 divide-y divide-ink-3">
                {filteredExecutions.map((execution: any) => (
                  <tr
                    key={execution.id}
                    onClick={() => navigate(`/executions/${execution.id}`)}
                    className="hover:bg-ink-2 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-base font-medium text-ink-9 hover:underline">
                      {execution.requestNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-base text-ink-9">
                      {execution.project?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-base text-ink-6">
                      {execution.budgetItem?.mainItem}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-base font-semibold text-ink-9">
                      {formatCurrency(execution.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-base text-ink-6">
                      {formatDate(execution.executionDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-sm leading-5 font-semibold rounded-full ${
                        execution.status === 'APPROVED' ? 'bg-ink-3 text-ink-9' :
                        execution.status === 'PENDING' ? 'bg-ink-2 text-ink-7' :
                        execution.status === 'REJECTED' ? 'bg-ink-5 text-ink-0' :
                        'bg-ink-2 text-ink-7'
                      }`}>
                        {execution.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-base text-ink-6">
                      Step {execution.currentStep}/4
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-base text-ink-6">
                      {formatDate(execution.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Budget Detail Table */}
      {selectedProjectId && budgetItems.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-black text-ink-9 uppercase tracking-wider mb-4">
            Budget Details
          </h2>

          <div className="bg-ink-0 rounded-lg border-2 border-ink-3 overflow-hidden">
            {/* Unit label */}
            <div className="px-4 py-2 bg-ink-1 border-b border-ink-3">
              <span className="text-sm text-ink-6 font-medium">단위: 천원</span>
            </div>

            <table className="min-w-full">
              <thead className="bg-ink-3">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-bold text-ink-7 uppercase">
                    항목
                  </th>
                  <th className="px-4 py-2 text-right text-sm font-bold text-ink-7 uppercase">
                    최종예산
                  </th>
                  <th className="px-4 py-2 text-right text-sm font-bold text-ink-7 uppercase">
                    기집행
                  </th>
                  <th className="px-4 py-2 text-right text-sm font-bold text-ink-7 uppercase">
                    금회요청
                  </th>
                  <th className="px-4 py-2 text-right text-sm font-bold text-ink-7 uppercase">
                    집행후잔액
                  </th>
                  <th className="px-4 py-2 text-right text-sm font-bold text-ink-7 uppercase">
                    집행률
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-3">
                {/* REVENUE SECTION */}
                <tr className="bg-ink-2">
                  <td colSpan={6} className="px-4 py-2">
                    <div className="text-base font-black text-ink-9 uppercase tracking-wide">
                      수입
                    </div>
                  </td>
                </tr>
                {revenueItems.map((item) => (
                  <tr key={item.id} className="hover:bg-ink-2">
                    <td className="px-6 py-1.5 text-base font-semibold text-ink-8">
                      {item.mainItem} {item.subItem ? `- ${item.subItem}` : ''}
                    </td>
                    <td className="px-4 py-1.5 text-right text-base font-semibold text-ink-9">
                      {formatCurrency(item.currentBudget)}
                      {item.changedAt && (
                        <div className="text-xs text-ink-5 mt-0.5">
                          {new Date(item.changedAt).toLocaleDateString('ko-KR', {
                            year: '2-digit',
                            month: '2-digit',
                            day: '2-digit'
                          })}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-1.5 text-right text-base font-semibold text-ink-7">
                      {formatCurrency(item.executedAmount)}
                    </td>
                    <td className="px-4 py-1.5 text-right text-base font-semibold text-ink-7">
                      {formatCurrency(item.pendingExecutionAmount)}
                    </td>
                    <td className="px-4 py-1.5 text-right text-base font-semibold text-ink-7">
                      {formatCurrency(item.remainingAfterExec)}
                    </td>
                    <td className={`px-4 py-1.5 text-right text-base font-semibold ${getExecutionRateColor(item.executionRate)}`}>
                      {formatPercentage(item.executionRate)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-ink-2 border-t-2 border-ink-4">
                  <td className="px-6 py-2 text-base font-black text-ink-9">
                    수입 합계
                  </td>
                  <td className="px-4 py-2 text-right text-base font-bold text-ink-9">
                    {formatCurrency(revenueTotal.current)}
                  </td>
                  <td className="px-4 py-2 text-right text-base font-bold text-ink-7">
                    {formatCurrency(revenueTotal.executed)}
                  </td>
                  <td className="px-4 py-2 text-right text-base font-bold text-ink-7">
                    {formatCurrency(revenueTotal.pending)}
                  </td>
                  <td className="px-4 py-2 text-right text-base font-bold text-ink-7">
                    {formatCurrency(revenueTotal.remainingAfter)}
                  </td>
                  <td className={`px-4 py-2 text-right text-base font-bold ${getExecutionRateColor(revenueTotal.current === 0 ? 0 : (revenueTotal.executed / revenueTotal.current) * 100)}`}>
                    {formatPercentage(revenueTotal.current === 0 ? 0 : (revenueTotal.executed / revenueTotal.current) * 100)}
                  </td>
                </tr>

                {/* ESSENTIAL EXPENSES SECTION (Excluding Construction) */}
                <tr className="bg-ink-1">
                  <td colSpan={6} className="px-4 py-2">
                    <div className="text-base font-black text-ink-9 uppercase tracking-wide">
                      필수사업비 (공사비 제외)
                    </div>
                  </td>
                </tr>
                {Object.entries(groupedEssential).map(([mainItem, items]) => {
                  const itemTotal = calculateTotal(items);
                  const itemRate = itemTotal.current === 0 ? 0 : (itemTotal.executed / itemTotal.current) * 100;

                  return (
                    <>
                      <tr key={mainItem} className="bg-ink-1">
                        <td className="px-6 py-1.5 text-base font-bold text-ink-9">
                          {mainItem}
                        </td>
                        <td className="px-4 py-1.5 text-right text-base font-semibold text-ink-9">
                          {formatCurrency(itemTotal.current)}
                        </td>
                        <td className="px-4 py-1.5 text-right text-base font-semibold text-ink-7">
                          {formatCurrency(itemTotal.executed)}
                        </td>
                        <td className="px-4 py-1.5 text-right text-base font-semibold text-ink-7">
                          {formatCurrency(itemTotal.pending)}
                        </td>
                        <td className="px-4 py-1.5 text-right text-base font-semibold text-ink-7">
                          {formatCurrency(itemTotal.remainingAfter)}
                        </td>
                        <td className={`px-4 py-1.5 text-right text-base font-semibold ${getExecutionRateColor(itemRate)}`}>
                          {formatPercentage(itemRate)}
                        </td>
                      </tr>
                      {items.map((item) => (
                        <tr key={item.id} className="hover:bg-ink-2">
                          <td className="px-10 py-1 text-sm text-ink-6">
                            └ {item.subItem || item.mainItem}
                          </td>
                          <td className="px-4 py-1 text-right text-sm text-ink-7">
                            {formatCurrency(item.currentBudget)}
                            {item.changedAt && (
                              <div className="text-xs text-ink-5 mt-0.5">
                                {new Date(item.changedAt).toLocaleDateString('ko-KR', {
                                  year: '2-digit',
                                  month: '2-digit',
                                  day: '2-digit'
                                })}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-1 text-right text-sm text-ink-6">
                            {formatCurrency(item.executedAmount)}
                          </td>
                          <td className="px-4 py-1 text-right text-sm text-ink-6">
                            {formatCurrency(item.pendingExecutionAmount)}
                          </td>
                          <td className="px-4 py-1 text-right text-sm text-ink-6">
                            {formatCurrency(item.remainingAfterExec)}
                          </td>
                          <td className={`px-4 py-1 text-right text-sm ${getExecutionRateColor(item.executionRate)}`}>
                            {formatPercentage(item.executionRate)}
                          </td>
                        </tr>
                      ))}
                    </>
                  );
                })}
                <tr className="bg-ink-2 border-t-2 border-ink-4">
                  <td className="px-6 py-2 text-base font-black text-ink-9">
                    필수사업비 소계
                  </td>
                  <td className="px-4 py-2 text-right text-base font-bold text-ink-9">
                    {formatCurrency(essentialTotal.current)}
                  </td>
                  <td className="px-4 py-2 text-right text-base font-bold text-ink-7">
                    {formatCurrency(essentialTotal.executed)}
                  </td>
                  <td className="px-4 py-2 text-right text-base font-bold text-ink-7">
                    {formatCurrency(essentialTotal.pending)}
                  </td>
                  <td className="px-4 py-2 text-right text-base font-bold text-ink-7">
                    {formatCurrency(essentialTotal.remainingAfter)}
                  </td>
                  <td className={`px-4 py-2 text-right text-base font-bold ${getExecutionRateColor(essentialTotal.current === 0 ? 0 : (essentialTotal.executed / essentialTotal.current) * 100)}`}>
                    {formatPercentage(essentialTotal.current === 0 ? 0 : (essentialTotal.executed / essentialTotal.current) * 100)}
                  </td>
                </tr>

                {/* CONSTRUCTION COSTS SECTION */}
                <tr className="bg-amber-50">
                  <td colSpan={6} className="px-4 py-2">
                    <div className="text-base font-black text-amber-900 uppercase tracking-wide">
                      공사비
                    </div>
                  </td>
                </tr>
                {constructionItems.map((item) => (
                  <tr key={item.id} className="hover:bg-amber-50/50">
                    <td className="px-6 py-1.5 text-base font-semibold text-ink-8">
                      {item.subItem || item.mainItem}
                    </td>
                    <td className="px-4 py-1.5 text-right text-base font-semibold text-ink-9">
                      {formatCurrency(item.currentBudget)}
                      {item.changedAt && (
                        <div className="text-xs text-ink-5 mt-0.5">
                          {new Date(item.changedAt).toLocaleDateString('ko-KR', {
                            year: '2-digit',
                            month: '2-digit',
                            day: '2-digit'
                          })}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-1.5 text-right text-base font-semibold text-ink-7">
                      {formatCurrency(item.executedAmount)}
                    </td>
                    <td className="px-4 py-1.5 text-right text-base font-semibold text-ink-7">
                      {formatCurrency(item.pendingExecutionAmount)}
                    </td>
                    <td className="px-4 py-1.5 text-right text-base font-semibold text-ink-7">
                      {formatCurrency(item.remainingAfterExec)}
                    </td>
                    <td className={`px-4 py-1.5 text-right text-base font-semibold ${getExecutionRateColor(item.executionRate)}`}>
                      {formatPercentage(item.executionRate)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-amber-100 border-t-2 border-amber-400">
                  <td className="px-6 py-2 text-base font-black text-amber-900">
                    공사비 합계
                  </td>
                  <td className="px-4 py-2 text-right text-base font-bold text-amber-900">
                    {formatCurrency(constructionTotal.current)}
                  </td>
                  <td className="px-4 py-2 text-right text-base font-bold text-amber-800">
                    {formatCurrency(constructionTotal.executed)}
                  </td>
                  <td className="px-4 py-2 text-right text-base font-bold text-amber-800">
                    {formatCurrency(constructionTotal.pending)}
                  </td>
                  <td className="px-4 py-2 text-right text-base font-bold text-amber-800">
                    {formatCurrency(constructionTotal.remainingAfter)}
                  </td>
                  <td className={`px-4 py-2 text-right text-base font-bold ${getExecutionRateColor(constructionTotal.current === 0 ? 0 : (constructionTotal.executed / constructionTotal.current) * 100)}`}>
                    {formatPercentage(constructionTotal.current === 0 ? 0 : (constructionTotal.executed / constructionTotal.current) * 100)}
                  </td>
                </tr>

                {/* CONSTRUCTION COST RECOVERY */}
                <tr className="bg-blue-50 border-t-2 border-blue-400">
                  <td className="px-6 py-2 text-base font-black text-blue-900">
                    공사비 회수가능액 (총수입 - 공사비)
                  </td>
                  <td className="px-4 py-2 text-right text-base font-bold text-blue-900">
                    {formatCurrency(constructionRecovery.current)}
                  </td>
                  <td className="px-4 py-2 text-right text-base font-bold text-blue-800">
                    {formatCurrency(constructionRecovery.executed)}
                  </td>
                  <td className="px-4 py-2 text-right text-base font-bold text-blue-800">
                    {formatCurrency(constructionRecovery.pending)}
                  </td>
                  <td className="px-4 py-2 text-right text-base font-bold text-blue-800">
                    {formatCurrency(constructionRecovery.remainingAfter)}
                  </td>
                  <td className="px-4 py-2 text-right text-base font-bold text-blue-900">
                    -
                  </td>
                </tr>

                {/* NET TOTAL */}
                <tr className="bg-ink-9 border-t-4 border-ink-7">
                  <td className="px-6 py-3 text-lg font-black text-ink-0 uppercase tracking-wide">
                    순손익
                  </td>
                  <td className="px-4 py-3 text-right text-lg font-black text-ink-0">
                    {formatCurrency(netTotal.current)}
                  </td>
                  <td className="px-4 py-3 text-right text-lg font-black text-ink-0">
                    {formatCurrency(netTotal.executed)}
                  </td>
                  <td className="px-4 py-3 text-right text-lg font-black text-ink-0">
                    {formatCurrency(netTotal.pending)}
                  </td>
                  <td className="px-4 py-3 text-right text-lg font-black text-ink-0">
                    {formatCurrency(netTotal.remainingAfter)}
                  </td>
                  <td className="px-4 py-3 text-right text-lg font-black text-ink-0">
                    -
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// Create Execution Request Form Component
function CreateExecutionForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedBudgetItemId, setSelectedBudgetItemId] = useState('');
  const [amount, setAmount] = useState('');
  const [executionDate, setExecutionDate] = useState('');
  const [purpose, setPurpose] = useState('');
  const [description, setDescription] = useState('');

  // Fetch projects
  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await api.get('/projects');
      return response.data;
    },
  });

  // Fetch budget items for selected project
  const { data: budgetData } = useQuery({
    queryKey: ['budget', selectedProjectId],
    queryFn: async () => {
      if (!selectedProjectId) return null;
      const response = await api.get(`/budget/project/${selectedProjectId}`);
      return response.data;
    },
    enabled: !!selectedProjectId,
  });

  const projects: Project[] = Array.isArray(projectsData) ? projectsData : (projectsData?.projects || []);

  // Extract budget items from summary structure
  const budgetItems: BudgetItem[] = [];
  if (budgetData?.summary && Array.isArray(budgetData.summary)) {
    budgetData.summary.forEach((category: any) => {
      if (category.items && Array.isArray(category.items)) {
        budgetItems.push(...category.items);
      }
    });
  }

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/execution', data);
      return response.data;
    },
    onSuccess: () => {
      onSuccess();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createMutation.mutateAsync({
        projectId: selectedProjectId,
        budgetItemId: selectedBudgetItemId,
        amount: parseFloat(amount),
        executionDate,
        purpose,
        description,
      });
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create execution request');
    }
  };

  const selectedBudgetItem = budgetItems.find(b => b.id === selectedBudgetItemId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">New Execution Request</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Project Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project *
            </label>
            <select
              required
              value={selectedProjectId}
              onChange={(e) => {
                setSelectedProjectId(e.target.value);
                setSelectedBudgetItemId('');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select Project --</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.code} - {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* Budget Item Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Budget Item *
            </label>
            <select
              required
              value={selectedBudgetItemId}
              onChange={(e) => setSelectedBudgetItemId(e.target.value)}
              disabled={!selectedProjectId}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">-- Select Budget Item --</option>
              {budgetItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.mainItem} {item.subItem ? `- ${item.subItem}` : ''} (Available: {formatCurrency(item.remainingBudget)})
                </option>
              ))}
            </select>
          </div>

          {/* Budget Info */}
          {selectedBudgetItem && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Total Budget:</span>
                  <div className="font-semibold">{formatCurrency(selectedBudgetItem.currentBudget)}</div>
                </div>
                <div>
                  <span className="text-gray-600">Executed:</span>
                  <div className="font-semibold">{formatCurrency(selectedBudgetItem.executedAmount)}</div>
                </div>
                <div>
                  <span className="text-gray-600">Remaining:</span>
                  <div className="font-semibold text-green-600">{formatCurrency(selectedBudgetItem.remainingBudget)}</div>
                </div>
                <div>
                  <span className="text-gray-600">Execution Rate:</span>
                  <div className="font-semibold">{selectedBudgetItem.executionRate.toFixed(1)}%</div>
                </div>
              </div>
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              집행 금액 (₩) *
            </label>
            <input
              type="number"
              required
              min="0"
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="집행 금액 입력"
            />
            {amount && (
              <div className="mt-2 text-sm text-gray-600">
                {formatCurrency(parseFloat(amount))}
              </div>
            )}
            {selectedBudgetItem && amount && parseFloat(amount) > parseFloat(selectedBudgetItem.remainingBudget) && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <div className="flex items-start gap-2">
                  <span className="text-lg">⚠️</span>
                  <div>
                    <div className="font-semibold">집행 금액이 잔액을 초과합니다!</div>
                    <div className="mt-1">사용 가능 잔액: {formatCurrency(selectedBudgetItem.remainingBudget)}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Execution Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Execution Date *
            </label>
            <input
              type="date"
              required
              value={executionDate}
              onChange={(e) => setExecutionDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Purpose */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Purpose *
            </label>
            <input
              type="text"
              required
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Brief purpose of this execution"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Additional details (optional)"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={
                createMutation.isPending ||
                (selectedBudgetItem && amount && parseFloat(amount) > parseFloat(selectedBudgetItem.remainingBudget))
              }
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createMutation.isPending ? '생성 중...' : '집행 요청 생성'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
