import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import type { Project, BudgetItem } from '@/types';
import { useProjectStore } from '@/stores/projectStore';

export default function BudgetPage() {
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

  // Fetch budget items for the selected project
  const { data: budgetData, isLoading } = useQuery({
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
  const selectedProject = projects.find(p => p.id === selectedProjectId);

  // Separate items into revenue (수입) and expense (지출)
  const revenueItems = budgetItems.filter(item =>
    item.category.includes('수입') || item.category.includes('분양') || item.category.includes('매출')
  );
  const expenseItems = budgetItems.filter(item =>
    !item.category.includes('수입') && !item.category.includes('분양') && !item.category.includes('매출')
  );

  // Group revenue items by mainItem
  const groupedRevenue = revenueItems.reduce((acc, item) => {
    if (!acc[item.mainItem]) {
      acc[item.mainItem] = [];
    }
    acc[item.mainItem].push(item);
    return acc;
  }, {} as Record<string, BudgetItem[]>);

  // Group expense items by category
  const groupedExpense = expenseItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, BudgetItem[]>);

  // Calculate totals
  const calculateTotal = (items: BudgetItem[]) => {
    return items.reduce(
      (sum, item) => ({
        budget: sum.budget + parseFloat(item.currentBudget),
        executed: sum.executed + parseFloat(item.executedAmount),
        remaining: sum.remaining + parseFloat(item.remainingBudget),
      }),
      { budget: 0, executed: 0, remaining: 0 }
    );
  };

  const revenueTotal = calculateTotal(revenueItems);
  const expenseTotal = calculateTotal(expenseItems);
  const netTotal = {
    budget: revenueTotal.budget - expenseTotal.budget,
    executed: revenueTotal.executed - expenseTotal.executed,
    remaining: revenueTotal.remaining - expenseTotal.remaining,
  };

  return (
    <div>
      {/* Project Selector */}
      <div className="mb-6">
        <label htmlFor="project" className="block text-sm font-medium text-gray-700 mb-2">
          Select Project
        </label>
        <select
          id="project"
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- Select a project --</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.code} - {project.name}
            </option>
          ))}
        </select>
      </div>

      {!selectedProjectId ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500">Please select a project to view budget details</p>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-lg">Loading budget data...</div>
        </div>
      ) : (
        <>
          {/* Project Header */}
          {selectedProject && (
            <div className="bg-white rounded-lg shadow p-4 mb-4">
              <div className="flex items-center justify-between">
                <Link
                  to={`/projects/${selectedProject.id}`}
                  className="text-lg font-bold text-slate-900 hover:underline"
                >
                  {selectedProject.code} - {selectedProject.name} →
                </Link>
                <div className="flex gap-2 text-sm">
                  <Link to="/budget/spreadsheet" className="font-semibold text-emerald-700 hover:underline">
                    📊 스프레드시트
                  </Link>
                  <span className="text-slate-300">|</span>
                  <Link to="/budget/manage" className="text-slate-700 hover:underline">
                    항목 관리
                  </Link>
                  <span className="text-slate-300">|</span>
                  <Link to="/executions/history" className="text-slate-700 hover:underline">
                    집행 히스토리
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Financial Model View */}
          {budgetItems.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-500">No budget items found for this project</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-bold text-slate-700 uppercase w-1/3">
                      항목
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-bold text-slate-700 uppercase w-1/6">
                      예산 (천원)
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-bold text-slate-700 uppercase w-1/6">
                      집행 (천원)
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-bold text-slate-700 uppercase w-1/6">
                      잔액 (천원)
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-bold text-slate-700 uppercase w-1/6">
                      집행률
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {/* REVENUE SECTION */}
                  <tr className="bg-blue-50">
                    <td colSpan={5} className="px-4 py-2">
                      <div className="text-sm font-black text-blue-900 uppercase tracking-wide">
                        수입
                      </div>
                    </td>
                  </tr>
                  {Object.entries(groupedRevenue).map(([mainItem, items]) => {
                    const subtotal = calculateTotal(items);
                    const rate = subtotal.budget === 0 ? 0 : (subtotal.executed / subtotal.budget) * 100;

                    return (
                      <>
                        <tr key={mainItem} className="bg-blue-50/50">
                          <td className="px-6 py-1.5 text-sm font-bold text-slate-800">
                            {mainItem}
                          </td>
                          <td className="px-4 py-1.5 text-right text-sm font-semibold text-slate-900">
                            {formatCurrency(subtotal.budget)}
                          </td>
                          <td className="px-4 py-1.5 text-right text-sm font-semibold text-blue-700">
                            {formatCurrency(subtotal.executed)}
                          </td>
                          <td className="px-4 py-1.5 text-right text-sm font-semibold text-slate-700">
                            {formatCurrency(subtotal.remaining)}
                          </td>
                          <td className="px-4 py-1.5 text-right text-sm font-semibold text-slate-900">
                            {formatPercentage(rate)}
                          </td>
                        </tr>
                        {items.map(item => item.subItem && (
                          <tr key={item.id} className="hover:bg-blue-50/30">
                            <td className="px-10 py-1 text-xs text-slate-600">
                              └ {item.subItem}
                            </td>
                            <td className="px-4 py-1 text-right text-xs text-slate-700">
                              {formatCurrency(item.currentBudget)}
                            </td>
                            <td className="px-4 py-1 text-right text-xs text-blue-600">
                              {formatCurrency(item.executedAmount)}
                            </td>
                            <td className="px-4 py-1 text-right text-xs text-slate-600">
                              {formatCurrency(item.remainingBudget)}
                            </td>
                            <td className="px-4 py-1 text-right text-xs text-slate-700">
                              {formatPercentage(item.executionRate)}
                            </td>
                          </tr>
                        ))}
                      </>
                    );
                  })}
                  <tr className="bg-blue-100 border-t-2 border-blue-300">
                    <td className="px-6 py-2 text-sm font-black text-blue-900">
                      수입 합계
                    </td>
                    <td className="px-4 py-2 text-right text-sm font-bold text-slate-900">
                      {formatCurrency(revenueTotal.budget)}
                    </td>
                    <td className="px-4 py-2 text-right text-sm font-bold text-blue-700">
                      {formatCurrency(revenueTotal.executed)}
                    </td>
                    <td className="px-4 py-2 text-right text-sm font-bold text-slate-700">
                      {formatCurrency(revenueTotal.remaining)}
                    </td>
                    <td className="px-4 py-2 text-right text-sm font-bold text-slate-900">
                      {formatPercentage(revenueTotal.budget === 0 ? 0 : (revenueTotal.executed / revenueTotal.budget) * 100)}
                    </td>
                  </tr>

                  {/* EXPENSE SECTION */}
                  <tr className="bg-red-50">
                    <td colSpan={5} className="px-4 py-2">
                      <div className="text-sm font-black text-red-900 uppercase tracking-wide">
                        필수사업비
                      </div>
                    </td>
                  </tr>
                  {Object.entries(groupedExpense).map(([category, items]) => {
                    const categoryTotal = calculateTotal(items);
                    const categoryRate = categoryTotal.budget === 0 ? 0 : (categoryTotal.executed / categoryTotal.budget) * 100;

                    // Group items by mainItem
                    const itemsByMain = items.reduce((acc, item) => {
                      if (!acc[item.mainItem]) acc[item.mainItem] = [];
                      acc[item.mainItem].push(item);
                      return acc;
                    }, {} as Record<string, BudgetItem[]>);

                    return (
                      <>
                        <tr key={category} className="bg-red-50/70">
                          <td className="px-6 py-1.5 text-sm font-bold text-slate-900">
                            {category}
                          </td>
                          <td className="px-4 py-1.5 text-right text-sm font-semibold text-slate-900">
                            {formatCurrency(categoryTotal.budget)}
                          </td>
                          <td className="px-4 py-1.5 text-right text-sm font-semibold text-red-700">
                            {formatCurrency(categoryTotal.executed)}
                          </td>
                          <td className="px-4 py-1.5 text-right text-sm font-semibold text-slate-700">
                            {formatCurrency(categoryTotal.remaining)}
                          </td>
                          <td className="px-4 py-1.5 text-right text-sm font-semibold text-slate-900">
                            {formatPercentage(categoryRate)}
                          </td>
                        </tr>
                        {Object.entries(itemsByMain).map(([mainItem, mainItems]) => {
                          const mainTotal = calculateTotal(mainItems);
                          const mainRate = mainTotal.budget === 0 ? 0 : (mainTotal.executed / mainTotal.budget) * 100;

                          return (
                            <>
                              <tr key={mainItem} className="hover:bg-red-50/30">
                                <td className="px-8 py-1 text-xs font-semibold text-slate-700">
                                  • {mainItem}
                                </td>
                                <td className="px-4 py-1 text-right text-xs font-medium text-slate-700">
                                  {formatCurrency(mainTotal.budget)}
                                </td>
                                <td className="px-4 py-1 text-right text-xs font-medium text-red-600">
                                  {formatCurrency(mainTotal.executed)}
                                </td>
                                <td className="px-4 py-1 text-right text-xs font-medium text-slate-600">
                                  {formatCurrency(mainTotal.remaining)}
                                </td>
                                <td className="px-4 py-1 text-right text-xs font-medium text-slate-700">
                                  {formatPercentage(mainRate)}
                                </td>
                              </tr>
                              {mainItems.map(item => item.subItem && (
                                <tr key={item.id} className="hover:bg-red-50/20">
                                  <td className="px-12 py-0.5 text-xs text-slate-500">
                                    └ {item.subItem}
                                  </td>
                                  <td className="px-4 py-0.5 text-right text-xs text-slate-600">
                                    {formatCurrency(item.currentBudget)}
                                  </td>
                                  <td className="px-4 py-0.5 text-right text-xs text-red-500">
                                    {formatCurrency(item.executedAmount)}
                                  </td>
                                  <td className="px-4 py-0.5 text-right text-xs text-slate-500">
                                    {formatCurrency(item.remainingBudget)}
                                  </td>
                                  <td className="px-4 py-0.5 text-right text-xs text-slate-600">
                                    {formatPercentage(item.executionRate)}
                                  </td>
                                </tr>
                              ))}
                            </>
                          );
                        })}
                      </>
                    );
                  })}
                  <tr className="bg-red-100 border-t-2 border-red-300">
                    <td className="px-6 py-2 text-sm font-black text-red-900">
                      필수사업비 합계
                    </td>
                    <td className="px-4 py-2 text-right text-sm font-bold text-slate-900">
                      {formatCurrency(expenseTotal.budget)}
                    </td>
                    <td className="px-4 py-2 text-right text-sm font-bold text-red-700">
                      {formatCurrency(expenseTotal.executed)}
                    </td>
                    <td className="px-4 py-2 text-right text-sm font-bold text-slate-700">
                      {formatCurrency(expenseTotal.remaining)}
                    </td>
                    <td className="px-4 py-2 text-right text-sm font-bold text-slate-900">
                      {formatPercentage(expenseTotal.budget === 0 ? 0 : (expenseTotal.executed / expenseTotal.budget) * 100)}
                    </td>
                  </tr>

                  {/* NET TOTAL */}
                  <tr className="bg-slate-900 border-t-4 border-slate-700">
                    <td className="px-6 py-3 text-base font-black text-white uppercase tracking-wide">
                      순손익
                    </td>
                    <td className="px-4 py-3 text-right text-base font-black text-white">
                      {formatCurrency(netTotal.budget)}
                    </td>
                    <td className={`px-4 py-3 text-right text-base font-black ${netTotal.executed >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatCurrency(netTotal.executed)}
                    </td>
                    <td className="px-4 py-3 text-right text-base font-black text-white">
                      {formatCurrency(netTotal.remaining)}
                    </td>
                    <td className="px-4 py-3 text-right text-base font-black text-white">
                      -
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
