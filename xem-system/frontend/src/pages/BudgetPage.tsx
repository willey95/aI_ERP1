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
        initial: sum.initial + parseFloat(item.initialBudget || '0'),
        current: sum.current + parseFloat(item.currentBudget || '0'),
        executed: sum.executed + parseFloat(item.executedAmount || '0'),
        remainingBefore: sum.remainingBefore + parseFloat(item.remainingBeforeExec || '0'),
        remainingAfter: sum.remainingAfter + parseFloat(item.remainingAfterExec || '0'),
        pending: sum.pending + parseFloat(item.pendingExecutionAmount || '0'),
      }),
      { initial: 0, current: 0, executed: 0, remainingBefore: 0, remainingAfter: 0, pending: 0 }
    );
  };

  const revenueTotal = calculateTotal(revenueItems);
  const expenseTotal = calculateTotal(expenseItems);
  const netTotal = {
    initial: revenueTotal.initial - expenseTotal.initial,
    current: revenueTotal.current - expenseTotal.current,
    executed: revenueTotal.executed - expenseTotal.executed,
    remainingBefore: revenueTotal.remainingBefore - expenseTotal.remainingBefore,
    remainingAfter: revenueTotal.remainingAfter - expenseTotal.remainingAfter,
  };

  // Financial structure calculations
  // 1. 총수입 = PF대출 + 분양수입
  const totalRevenue = revenueTotal.current;

  // 2. 필수사업비 (excluding 공사비)
  const essentialCosts = expenseItems
    .filter(item => !item.mainItem.includes('공사비'))
    .reduce((sum, item) => sum + parseFloat(item.currentBudget || '0'), 0);

  // 3. 공사비 합계 (actual from budget)
  const constructionCosts = expenseItems
    .filter(item => item.mainItem.includes('공사비'))
    .reduce((sum, item) => sum + parseFloat(item.currentBudget || '0'), 0);

  // 3-1. 기집행 공사비 (executed construction cost)
  const executedConstructionCosts = expenseItems
    .filter(item => item.mainItem.includes('공사비'))
    .reduce((sum, item) => sum + parseFloat(item.executedAmount || '0'), 0);

  // 3-2. 잔여 공사비 = 공사비 예산 - 기집행 공사비
  const remainingConstructionCosts = constructionCosts - executedConstructionCosts;

  // 4. 할인버퍼 (시행이익: 3%, 에쿼티: 2% of total revenue)
  const discountBufferProfit = totalRevenue * 0.03; // 시행이익
  const discountBufferEquity = totalRevenue * 0.02; // 에쿼티
  const totalDiscountBuffer = discountBufferProfit + discountBufferEquity;

  // 5. 공사비 가용예산 = 총수입 - 필수사업비(excluding 공사비)
  const constructionBudgetLimit = totalRevenue - essentialCosts;

  // 6. 공사비 회수가능성 = 총수입 - 필수사업비(excluding 공사비) + 할인버퍼(시행이익) + 할인버퍼(에쿼티)
  const constructionRecoveryPotential = totalRevenue - essentialCosts + discountBufferProfit + discountBufferEquity;

  // 7. 공사비 여유/초과 (based on 가용예산)
  const constructionMargin = constructionBudgetLimit - constructionCosts;

  // 8. 회수가능 여유/초과
  const recoveryMargin = constructionRecoveryPotential - constructionCosts;

  return (
    <div>
      {/* Project Selector */}
      <div className="mb-6">
        <label htmlFor="project" className="block text-sm font-semibold text-ink-7 mb-2">
          프로젝트 선택
        </label>
        <select
          id="project"
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className="w-96 px-4 py-2.5 text-sm border-2 border-ink-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-ink-7 bg-ink-0"
          style={{ minHeight: '42px' }}
        >
          <option value="">-- 프로젝트를 선택하세요 --</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.code} - {project.name}
            </option>
          ))}
        </select>
      </div>

      {!selectedProjectId ? (
        <div className="bg-ink-0 rounded-lg border-2 border-ink-3 p-12 text-center">
          <p className="text-ink-6">Please select a project to view budget details</p>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-xl">Loading budget data...</div>
        </div>
      ) : (
        <>
          {/* Project Header */}
          {selectedProject && (
            <div className="bg-ink-0 rounded-lg border-2 border-ink-3 p-4 mb-4">
              <div className="flex items-center justify-between">
                <Link
                  to={`/projects/${selectedProject.id}`}
                  className="text-xl font-bold text-ink-9 hover:underline"
                >
                  {selectedProject.code} - {selectedProject.name} →
                </Link>
                <div className="flex gap-2 text-base">
                  <Link to="/budget/manage" className="text-ink-7 hover:underline">
                    항목 관리
                  </Link>
                  <span className="text-ink-4">|</span>
                  <Link to="/executions/history" className="text-ink-7 hover:underline">
                    집행 히스토리 & CF
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Financial Structure Analysis */}
          {budgetItems.length > 0 && (
            <div className="bg-ink-0 rounded-lg border-2 border-ink-3 p-8 mb-4">
              <h3 className="text-base font-black text-ink-9 uppercase tracking-wider mb-5 border-b-2 border-ink-3 pb-2">
                재무 구조 분석
              </h3>
              <div className="grid grid-cols-4 gap-10">
                {/* Column 1: Revenue Structure */}
                <div className="space-y-3">
                  <div className="text-sm font-bold text-ink-7 uppercase tracking-wide mb-4">수입 구조</div>
                  <div className="flex justify-between items-center py-2 border-b border-ink-2">
                    <span className="text-sm text-ink-6">총 수입</span>
                    <span className="text-base font-bold text-ink-9">{formatCurrency(totalRevenue)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 pl-4">
                    <span className="text-sm text-ink-5">→ PF대출</span>
                    <span className="text-sm text-ink-7">{formatCurrency(revenueItems.filter(i => i.mainItem.includes('PF')).reduce((s, i) => s + parseFloat(i.currentBudget || '0'), 0))}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 pl-4">
                    <span className="text-sm text-ink-5">→ 분양수입</span>
                    <span className="text-sm text-ink-7">{formatCurrency(revenueItems.filter(i => i.mainItem.includes('분양')).reduce((s, i) => s + parseFloat(i.currentBudget || '0'), 0))}</span>
                  </div>
                </div>

                {/* Column 2: Cost Structure */}
                <div className="space-y-3">
                  <div className="text-sm font-bold text-ink-7 uppercase tracking-wide mb-4">비용 구조</div>
                  <div className="flex justify-between items-center py-2 border-b border-ink-2">
                    <span className="text-sm text-ink-6">필수사업비</span>
                    <span className="text-base font-bold text-ink-9">{formatCurrency(essentialCosts)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-ink-2">
                    <span className="text-sm text-ink-6">잔여 공사비</span>
                    <span className="text-base font-bold text-ink-9">{formatCurrency(remainingConstructionCosts)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 pl-4">
                    <span className="text-sm text-ink-5">할인버퍼(시행이익)</span>
                    <span className="text-sm text-ink-7">{formatCurrency(discountBufferProfit)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 pl-4">
                    <span className="text-sm text-ink-5">할인버퍼(에쿼티)</span>
                    <span className="text-sm text-ink-7">{formatCurrency(discountBufferEquity)}</span>
                  </div>
                </div>

                {/* Column 3: Construction Budget Analysis */}
                <div className="space-y-3">
                  <div className="text-sm font-bold text-ink-7 uppercase tracking-wide mb-4">공사비 가용예산</div>
                  <div className="flex justify-between items-center py-2 border-b border-ink-2">
                    <span className="text-sm text-ink-6">가용예산</span>
                    <span className="text-base font-bold text-ink-9">{formatCurrency(constructionBudgetLimit)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-ink-2">
                    <span className="text-sm text-ink-6">공사비 실제</span>
                    <span className="text-base font-bold text-ink-9">{formatCurrency(constructionCosts)}</span>
                  </div>
                  <div className={`flex justify-between items-center py-2 border-b-2 ${constructionMargin >= 0 ? 'border-ink-5' : 'border-ink-7'}`}>
                    <span className="text-sm font-bold text-ink-7">{constructionMargin >= 0 ? '여유' : '초과'}</span>
                    <span className={`text-base font-black ${constructionMargin >= 0 ? 'text-ink-7' : 'text-ink-9'}`}>
                      {formatCurrency(Math.abs(constructionMargin))}
                    </span>
                  </div>
                  <div className="text-xs text-ink-5 mt-3 italic">
                    = 총수입 - 필수사업비
                  </div>
                </div>

                {/* Column 4: Construction Recovery Potential */}
                <div className="space-y-3">
                  <div className="text-sm font-bold text-ink-7 uppercase tracking-wide mb-4">공사비 회수가능성</div>
                  <div className="flex justify-between items-center py-2 border-b border-ink-2">
                    <span className="text-sm text-ink-6">회수가능액</span>
                    <span className="text-base font-bold text-ink-9">{formatCurrency(constructionRecoveryPotential)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-ink-2">
                    <span className="text-sm text-ink-6">공사비 실제</span>
                    <span className="text-base font-bold text-ink-9">{formatCurrency(constructionCosts)}</span>
                  </div>
                  <div className={`flex justify-between items-center py-2 border-b-2 ${recoveryMargin >= 0 ? 'border-ink-5' : 'border-ink-7'}`}>
                    <span className="text-sm font-bold text-ink-7">{recoveryMargin >= 0 ? '회수가능' : '회수불가'}</span>
                    <span className={`text-base font-black ${recoveryMargin >= 0 ? 'text-ink-7' : 'text-ink-9'}`}>
                      {formatCurrency(Math.abs(recoveryMargin))}
                    </span>
                  </div>
                  <div className="text-xs text-ink-5 mt-3 italic">
                    = 가용예산 + 할인버퍼
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Simplified Budget Table */}
          {budgetItems.length === 0 ? (
            <div className="bg-ink-0 rounded-lg border-2 border-ink-3 p-12 text-center">
              <p className="text-ink-6">No budget items found for this project</p>
            </div>
          ) : (
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
                      최초예산
                    </th>
                    <th className="px-4 py-2 text-right text-sm font-bold text-ink-7 uppercase">
                      변경예산
                    </th>
                    <th className="px-4 py-2 text-right text-sm font-bold text-ink-7 uppercase">
                      기집행
                    </th>
                    <th className="px-4 py-2 text-right text-sm font-bold text-ink-7 uppercase">
                      잔여예산
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
                  {Object.entries(groupedRevenue).map(([mainItem, items]) => {
                    const subtotal = calculateTotal(items);
                    const rate = subtotal.current === 0 ? 0 : (subtotal.executed / subtotal.current) * 100;

                    return (
                      <>
                        <tr key={mainItem} className="bg-ink-1">
                          <td className="px-6 py-1.5 text-base font-bold text-ink-8">
                            {mainItem}
                          </td>
                          <td className="px-4 py-1.5 text-right text-base font-semibold text-ink-9">
                            {formatCurrency(subtotal.initial)}
                          </td>
                          <td className="px-4 py-1.5 text-right text-base font-semibold text-ink-9">
                            {formatCurrency(subtotal.current)}
                          </td>
                          <td className="px-4 py-1.5 text-right text-base font-semibold text-ink-7">
                            {formatCurrency(subtotal.executed)}
                          </td>
                          <td className="px-4 py-1.5 text-right text-base font-semibold text-ink-7">
                            {formatCurrency(subtotal.remainingBefore)}
                          </td>
                          <td className="px-4 py-1.5 text-right text-base font-semibold text-ink-9">
                            {formatPercentage(rate)}
                          </td>
                        </tr>
                        {items.map(item => item.subItem && (
                          <tr key={item.id} className="hover:bg-ink-2">
                            <td className="px-10 py-1 text-sm text-ink-6">
                              <Link
                                to={`/executions/history?projectId=${selectedProjectId}&budgetItemId=${item.id}`}
                                className="hover:underline hover:text-ink-7"
                              >
                                └ {item.subItem}
                              </Link>
                            </td>
                            <td className="px-4 py-1 text-right text-sm text-ink-7">
                              {formatCurrency(item.initialBudget)}
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
                            <td className={`px-4 py-1 text-right text-sm ${parseFloat(item.pendingExecutionAmount || '0') > 0 ? 'text-ink-5 font-bold' : 'text-ink-6'}`}>
                              {formatCurrency(item.executedAmount)}
                            </td>
                            <td className="px-4 py-1 text-right text-sm text-ink-6">
                              {formatCurrency(item.remainingBeforeExec)}
                            </td>
                            <td className="px-4 py-1 text-right text-sm text-ink-7">
                              {formatPercentage(item.executionRate)}
                            </td>
                          </tr>
                        ))}
                      </>
                    );
                  })}
                  <tr className="bg-ink-2 border-t-2 border-ink-4">
                    <td className="px-6 py-2 text-base font-black text-ink-9">
                      수입 합계
                    </td>
                    <td className="px-4 py-2 text-right text-base font-bold text-ink-9">
                      {formatCurrency(revenueTotal.initial)}
                    </td>
                    <td className="px-4 py-2 text-right text-base font-bold text-ink-9">
                      {formatCurrency(revenueTotal.current)}
                    </td>
                    <td className="px-4 py-2 text-right text-base font-bold text-ink-7">
                      {formatCurrency(revenueTotal.executed)}
                    </td>
                    <td className="px-4 py-2 text-right text-base font-bold text-ink-7">
                      {formatCurrency(revenueTotal.remainingBefore)}
                    </td>
                    <td className="px-4 py-2 text-right text-base font-bold text-ink-9">
                      {formatPercentage(revenueTotal.current === 0 ? 0 : (revenueTotal.executed / revenueTotal.current) * 100)}
                    </td>
                  </tr>

                  {/* EXPENSE SECTION */}
                  <tr className="bg-ink-1">
                    <td colSpan={6} className="px-4 py-2">
                      <div className="text-base font-black text-ink-9 uppercase tracking-wide">
                        필수사업비
                      </div>
                    </td>
                  </tr>
                  {Object.entries(groupedExpense).map(([category, items]) => {
                    const categoryTotal = calculateTotal(items);
                    const categoryRate = categoryTotal.current === 0 ? 0 : (categoryTotal.executed / categoryTotal.current) * 100;

                    // Group items by mainItem
                    const itemsByMain = items.reduce((acc, item) => {
                      if (!acc[item.mainItem]) acc[item.mainItem] = [];
                      acc[item.mainItem].push(item);
                      return acc;
                    }, {} as Record<string, BudgetItem[]>);

                    return (
                      <>
                        <tr key={category} className="bg-ink-1">
                          <td className="px-6 py-1.5 text-base font-bold text-ink-9">
                            {category}
                          </td>
                          <td className="px-4 py-1.5 text-right text-base font-semibold text-ink-9">
                            {formatCurrency(categoryTotal.initial)}
                          </td>
                          <td className="px-4 py-1.5 text-right text-base font-semibold text-ink-9">
                            {formatCurrency(categoryTotal.current)}
                          </td>
                          <td className="px-4 py-1.5 text-right text-base font-semibold text-ink-7">
                            {formatCurrency(categoryTotal.executed)}
                          </td>
                          <td className="px-4 py-1.5 text-right text-base font-semibold text-ink-7">
                            {formatCurrency(categoryTotal.remainingBefore)}
                          </td>
                          <td className="px-4 py-1.5 text-right text-base font-semibold text-ink-9">
                            {formatPercentage(categoryRate)}
                          </td>
                        </tr>
                        {Object.entries(itemsByMain).map(([mainItem, mainItems]) => {
                          const mainTotal = calculateTotal(mainItems);
                          const mainRate = mainTotal.current === 0 ? 0 : (mainTotal.executed / mainTotal.current) * 100;

                          return (
                            <>
                              <tr key={mainItem} className="hover:bg-ink-2">
                                <td className="px-8 py-1 text-sm font-semibold text-ink-7">
                                  • {mainItem}
                                </td>
                                <td className="px-4 py-1 text-right text-sm font-medium text-ink-7">
                                  {formatCurrency(mainTotal.initial)}
                                </td>
                                <td className="px-4 py-1 text-right text-sm font-medium text-ink-7">
                                  {formatCurrency(mainTotal.current)}
                                </td>
                                <td className="px-4 py-1 text-right text-sm font-medium text-ink-6">
                                  {formatCurrency(mainTotal.executed)}
                                </td>
                                <td className="px-4 py-1 text-right text-sm font-medium text-ink-6">
                                  {formatCurrency(mainTotal.remainingBefore)}
                                </td>
                                <td className="px-4 py-1 text-right text-sm font-medium text-ink-7">
                                  {formatPercentage(mainRate)}
                                </td>
                              </tr>
                              {mainItems.map(item => item.subItem && (
                                <tr key={item.id} className="hover:bg-ink-2">
                                  <td className="px-12 py-0.5 text-sm text-ink-5">
                                    <Link
                                      to={`/executions/history?projectId=${selectedProjectId}&budgetItemId=${item.id}`}
                                      className="hover:underline hover:text-ink-7"
                                    >
                                      └ {item.subItem}
                                    </Link>
                                  </td>
                                  <td className="px-4 py-0.5 text-right text-sm text-ink-6">
                                    {formatCurrency(item.initialBudget)}
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
                                  <td className="px-4 py-0.5 text-right text-sm text-ink-6">
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
                                  <td className={`px-4 py-0.5 text-right text-sm ${parseFloat(item.pendingExecutionAmount || '0') > 0 ? 'text-ink-5 font-bold' : 'text-ink-7'}`}>
                                    {formatCurrency(item.executedAmount)}
                                  </td>
                                  <td className="px-4 py-0.5 text-right text-sm text-ink-5">
                                    {formatCurrency(item.remainingBeforeExec)}
                                  </td>
                                  <td className="px-4 py-0.5 text-right text-sm text-ink-6">
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
                  <tr className="bg-ink-1 border-t-2 border-ink-4">
                    <td className="px-6 py-2 text-base font-black text-ink-9">
                      필수사업비 합계
                    </td>
                    <td className="px-4 py-2 text-right text-base font-bold text-ink-9">
                      {formatCurrency(expenseTotal.initial)}
                    </td>
                    <td className="px-4 py-2 text-right text-base font-bold text-ink-9">
                      {formatCurrency(expenseTotal.current)}
                    </td>
                    <td className="px-4 py-2 text-right text-base font-bold text-ink-7">
                      {formatCurrency(expenseTotal.executed)}
                    </td>
                    <td className="px-4 py-2 text-right text-base font-bold text-ink-7">
                      {formatCurrency(expenseTotal.remainingBefore)}
                    </td>
                    <td className="px-4 py-2 text-right text-base font-bold text-ink-9">
                      {formatPercentage(expenseTotal.current === 0 ? 0 : (expenseTotal.executed / expenseTotal.current) * 100)}
                    </td>
                  </tr>

                  {/* NET TOTAL */}
                  <tr className="bg-ink-9 border-t-4 border-ink-7">
                    <td className="px-6 py-3 text-lg font-black text-ink-0 uppercase tracking-wide">
                      순손익
                    </td>
                    <td className="px-4 py-3 text-right text-lg font-black text-ink-0">
                      {formatCurrency(netTotal.initial)}
                    </td>
                    <td className="px-4 py-3 text-right text-lg font-black text-ink-0">
                      {formatCurrency(netTotal.current)}
                    </td>
                    <td className={`px-4 py-3 text-right text-lg font-black ${netTotal.executed >= 0 ? 'text-ink-0' : 'text-ink-0'}`}>
                      {formatCurrency(netTotal.executed)}
                    </td>
                    <td className="px-4 py-3 text-right text-lg font-black text-ink-0">
                      {formatCurrency(netTotal.remainingBefore)}
                    </td>
                    <td className="px-4 py-3 text-right text-lg font-black text-ink-0">
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
