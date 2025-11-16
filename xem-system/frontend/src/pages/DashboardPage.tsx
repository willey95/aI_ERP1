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
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const charts = data?.charts || {};

  const getHeatmapColor = (rate: number) => {
    if (rate >= 90) return 'bg-red-600';
    if (rate >= 75) return 'bg-orange-500';
    if (rate >= 50) return 'bg-yellow-400';
    if (rate >= 25) return 'bg-blue-400';
    return 'bg-green-400';
  };

  const getRiskBadge = (level: string) => {
    const styles = {
      CRITICAL: 'bg-red-100 text-red-800',
      WARNING: 'bg-yellow-100 text-yellow-800',
      NORMAL: 'bg-green-100 text-green-800',
    };
    return styles[level as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">Welcome back, {user?.name}!</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-lg shadow-lg text-white">
          <div className="text-sm font-medium opacity-90">Total Projects</div>
          <div className="mt-2 text-3xl font-bold">
            {stats.totalProjects || 0}
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-lg shadow-lg text-white">
          <div className="text-sm font-medium opacity-90">Total Budget</div>
          <div className="mt-2 text-2xl font-bold">
            {stats.totalBudget ? formatCurrency(stats.totalBudget) : '₩0'}
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-lg shadow-lg text-white">
          <div className="text-sm font-medium opacity-90">Avg Execution Rate</div>
          <div className="mt-2 text-3xl font-bold">
            {stats.avgExecutionRate ? formatPercentage(stats.avgExecutionRate) : '0%'}
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-lg shadow-lg text-white">
          <div className="text-sm font-medium opacity-90">Pending Approvals</div>
          <div className="mt-2 text-3xl font-bold">
            {stats.pendingApprovals || 0}
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Execution Rate Heatmap */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Execution Rate Heatmap</h2>
          {charts.executionHeatmap && charts.executionHeatmap.length > 0 ? (
            <div className="space-y-3">
              {charts.executionHeatmap.map((project: any) => (
                <div key={project.projectId} className="flex items-center space-x-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {project.projectCode}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {project.projectName}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="relative pt-1">
                      <div className="overflow-hidden h-4 text-xs flex rounded bg-gray-200">
                        <div
                          style={{ width: `${Math.min(project.executionRate, 100)}%` }}
                          className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all ${getHeatmapColor(project.executionRate)}`}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold text-gray-900 w-12 text-right">
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
            <p className="text-gray-500 text-center py-8">No project data available</p>
          )}
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Budget by Category</h2>
          {charts.categoryBreakdown && charts.categoryBreakdown.length > 0 ? (
            <div className="space-y-4">
              {charts.categoryBreakdown.map((category: any, index: number) => {
                const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-indigo-500'];
                const color = colors[index % colors.length];
                return (
                  <div key={category.category}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700">{category.category}</span>
                      <span className="text-sm text-gray-600">{category.executionRate.toFixed(1)}%</span>
                    </div>
                    <div className="relative pt-1">
                      <div className="overflow-hidden h-3 text-xs flex rounded bg-gray-200">
                        <div
                          style={{ width: `${Math.min(category.executionRate, 100)}%` }}
                          className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${color}`}
                        ></div>
                      </div>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-gray-500">
                        Budget: {formatCurrency(category.budget)}
                      </span>
                      <span className="text-xs text-gray-500">
                        Executed: {formatCurrency(category.executed)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No category data available</p>
          )}
        </div>
      </div>

      {/* Monthly Trend Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Monthly Execution Trend (Last 6 Months)</h2>
        {charts.monthlyTrends && charts.monthlyTrends.length > 0 ? (
          <div className="relative">
            <div className="flex items-end justify-between space-x-2 h-64">
              {charts.monthlyTrends.map((month: any) => {
                const maxAmount = Math.max(...charts.monthlyTrends.map((m: any) => m.totalAmount), 1);
                const heightPercent = (month.totalAmount / maxAmount) * 100;
                return (
                  <div key={month.month} className="flex-1 flex flex-col items-center">
                    <div className="w-full flex flex-col items-center justify-end h-full pb-2">
                      <div className="text-xs text-gray-600 mb-1 font-semibold">
                        {formatCurrency(month.totalAmount)}
                      </div>
                      <div
                        className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t transition-all hover:from-blue-700 hover:to-blue-500"
                        style={{ height: `${heightPercent}%`, minHeight: month.totalAmount > 0 ? '20px' : '0' }}
                        title={`${month.month}: ${formatCurrency(month.totalAmount)} (${month.count} executions)`}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-2 font-medium">
                      {month.month.substring(5)}월
                    </div>
                    <div className="text-xs text-gray-400">
                      ({month.count})
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No trend data available</p>
        )}
      </div>

      {/* Budget Transfer Statistics */}
      {charts.transferStats && charts.transferStats.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Budget Transfer Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {charts.transferStats.map((stat: any) => (
              <div key={stat.status} className="border border-gray-200 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-600">{stat.status}</div>
                <div className="mt-2 text-2xl font-bold text-gray-900">
                  {stat.count}
                </div>
                <div className="mt-1 text-sm text-gray-500">
                  {formatCurrency(stat.totalAmount)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Executions */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Recent Executions</h2>
        </div>
        <div className="p-6">
          {data?.recentExecutions && data.recentExecutions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Request #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Project
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Budget Item
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.recentExecutions.map((execution: any) => (
                    <tr key={execution.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {execution.requestNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {execution.project?.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {execution.budgetItem?.mainItem}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(execution.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          execution.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                          execution.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
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
            <p className="text-gray-500 text-center py-8">No recent executions</p>
          )}
        </div>
      </div>
    </div>
  );
}
