import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';
import { formatCurrency, formatPercentage } from '@/lib/utils';

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await api.get('/dashboard/stats');
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">로딩 중...</div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const charts = data?.charts || {};

  const getHeatmapColor = (rate: number) => {
    if (rate >= 90) return 'bg-ink-9';
    if (rate >= 75) return 'bg-ink-7';
    if (rate >= 50) return 'bg-ink-5';
    if (rate >= 25) return 'bg-ink-3';
    return 'bg-ink-1';
  };

  const getRiskBadge = (level: string) => {
    const styles = {
      CRITICAL: 'bg-ink-8 text-ink-0',
      WARNING: 'bg-ink-4 text-ink-9',
      NORMAL: 'bg-ink-1 text-ink-9',
    };
    return styles[level as keyof typeof styles] || 'bg-ink-3 text-ink-9';
  };

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <div>
        <h1 className="text-2xl font-bold text-ink-9">대시보드</h1>
        <p className="mt-1 text-sm text-ink-6">환영합니다, {user?.name}님!</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-ink-0 border-2 border-ink-3 p-6 rounded-lg">
          <div className="text-sm font-medium text-ink-9">총 프로젝트</div>
          <div className="mt-2 text-3xl font-bold text-ink-9">
            {stats.totalProjects || 0}
          </div>
        </div>

        <div className="bg-ink-0 border-2 border-ink-3 p-6 rounded-lg">
          <div className="text-sm font-medium text-ink-9">총 예산</div>
          <div className="mt-2 text-2xl font-bold text-ink-9">
            {stats.totalBudget ? formatCurrency(stats.totalBudget) : '₩0'}
          </div>
        </div>

        <div className="bg-ink-0 border-2 border-ink-3 p-6 rounded-lg">
          <div className="text-sm font-medium text-ink-9">평균 집행률</div>
          <div className="mt-2 text-3xl font-bold text-ink-9">
            {stats.avgExecutionRate ? formatPercentage(stats.avgExecutionRate) : '0%'}
          </div>
        </div>

        <div className="bg-ink-0 border-2 border-ink-3 p-6 rounded-lg">
          <div className="text-sm font-medium text-ink-9">대기중 승인</div>
          <div className="mt-2 text-3xl font-bold text-ink-9">
            {stats.pendingApprovals || 0}
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Execution Rate Heatmap */}
        <div className="bg-ink-0 rounded-lg border-2 border-ink-3 p-6">
          <h2 className="text-lg font-bold text-ink-9 mb-4">집행률 히트맵</h2>
          {charts.executionHeatmap && charts.executionHeatmap.length > 0 ? (
            <div className="space-y-3">
              {charts.executionHeatmap.map((project: any) => (
                <div key={project.projectId} className="flex items-center space-x-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-ink-9 truncate">
                      {project.projectCode}
                    </div>
                    <div className="text-xs text-ink-5 truncate">
                      {project.projectName}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="relative pt-1">
                      <div className="overflow-hidden h-4 text-xs flex rounded bg-ink-2">
                        <div
                          style={{ width: `${Math.min(project.executionRate, 100)}%` }}
                          className={`flex flex-col text-center whitespace-nowrap justify-center transition-all ${getHeatmapColor(project.executionRate)}`}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold text-ink-9 w-12 text-right">
                      {project.executionRate.toFixed(1)}%
                    </span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRiskBadge(project.riskLevel)}`}>
                      {project.riskLevel}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-ink-5 text-center py-8">프로젝트 데이터가 없습니다</p>
          )}
        </div>

        {/* Category Breakdown */}
        <div className="bg-ink-0 rounded-lg border-2 border-ink-3 p-6">
          <h2 className="text-lg font-bold text-ink-9 mb-4">카테고리별 예산</h2>
          {charts.categoryBreakdown && charts.categoryBreakdown.length > 0 ? (
            <div className="space-y-4">
              {charts.categoryBreakdown.map((category: any, index: number) => {
                const colors = ['bg-ink-9', 'bg-ink-7', 'bg-ink-5', 'bg-ink-6', 'bg-ink-8', 'bg-ink-4'];
                const color = colors[index % colors.length];
                return (
                  <div key={category.category}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-ink-9">{category.category}</span>
                      <span className="text-sm text-ink-6">{category.executionRate.toFixed(1)}%</span>
                    </div>
                    <div className="relative pt-1">
                      <div className="overflow-hidden h-3 text-xs flex rounded bg-ink-2">
                        <div
                          style={{ width: `${Math.min(category.executionRate, 100)}%` }}
                          className={`flex flex-col text-center whitespace-nowrap justify-center ${color}`}
                        ></div>
                      </div>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-ink-5">
                        예산: {formatCurrency(category.budget)}
                      </span>
                      <span className="text-xs text-ink-5">
                        집행: {formatCurrency(category.executed)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-ink-5 text-center py-8">카테고리 데이터가 없습니다</p>
          )}
        </div>
      </div>

      {/* Monthly Trend Chart */}
      <div className="bg-ink-0 rounded-lg border-2 border-ink-3 p-6">
        <h2 className="text-lg font-bold text-ink-9 mb-4">월별 집행 추이 (최근 6개월)</h2>
        {charts.monthlyTrends && charts.monthlyTrends.length > 0 ? (
          <div className="relative">
            <div className="flex items-end justify-between space-x-2 h-64">
              {charts.monthlyTrends.map((month: any) => {
                const maxAmount = Math.max(...charts.monthlyTrends.map((m: any) => m.totalAmount), 1);
                const heightPercent = (month.totalAmount / maxAmount) * 100;
                return (
                  <div key={month.month} className="flex-1 flex flex-col items-center">
                    <div className="w-full flex flex-col items-center justify-end h-full pb-2">
                      <div className="text-xs text-ink-6 mb-1 font-semibold">
                        {formatCurrency(month.totalAmount)}
                      </div>
                      <div
                        className="w-full bg-ink-9 rounded-t transition-all"
                        style={{ height: `${heightPercent}%`, minHeight: month.totalAmount > 0 ? '20px' : '0' }}
                        title={`${month.month}: ${formatCurrency(month.totalAmount)} (${month.count} executions)`}
                      ></div>
                    </div>
                    <div className="text-xs text-ink-5 mt-2 font-medium">
                      {month.month.substring(5)}월
                    </div>
                    <div className="text-xs text-ink-4">
                      ({month.count})
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="text-ink-5 text-center py-8">추이 데이터가 없습니다</p>
        )}
      </div>

      {/* Budget Transfer Statistics */}
      {charts.transferStats && charts.transferStats.length > 0 && (
        <div className="bg-ink-0 rounded-lg border-2 border-ink-3 p-6">
          <h2 className="text-lg font-bold text-ink-9 mb-4">예산 이체 통계</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {charts.transferStats.map((stat: any) => (
              <div key={stat.status} className="border-2 border-ink-3 rounded-lg p-4">
                <div className="text-sm font-medium text-ink-6">{stat.status}</div>
                <div className="mt-2 text-2xl font-bold text-ink-9">
                  {stat.count}
                </div>
                <div className="mt-1 text-sm text-ink-5">
                  {formatCurrency(stat.totalAmount)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Executions */}
      <div className="bg-ink-0 rounded-lg border-2 border-ink-3">
        <div className="p-6 border-b-2 border-ink-3">
          <h2 className="text-xl font-bold text-ink-9">최근 집행</h2>
        </div>
        <div className="p-6">
          {data?.recentExecutions && data.recentExecutions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y-2 divide-ink-3">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ink-5 uppercase tracking-wider">
                      요청번호
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ink-5 uppercase tracking-wider">
                      프로젝트
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ink-5 uppercase tracking-wider">
                      예산항목
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ink-5 uppercase tracking-wider">
                      금액
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ink-5 uppercase tracking-wider">
                      상태
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-ink-0 divide-y-2 divide-ink-3">
                  {data.recentExecutions.map((execution: any) => (
                    <tr key={execution.id} className="hover:bg-ink-1">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-ink-9">
                        {execution.requestNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-5">
                        {execution.project?.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-5">
                        {execution.budgetItem?.mainItem}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-5">
                        {formatCurrency(execution.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          execution.status === 'APPROVED' ? 'bg-ink-1 text-ink-9' :
                          execution.status === 'PENDING' ? 'bg-ink-4 text-ink-9' :
                          'bg-ink-8 text-ink-0'
                        }`}>
                          {execution.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-ink-5 text-center py-8">최근 집행 내역이 없습니다</p>
          )}
        </div>
      </div>
    </div>
  );
}
