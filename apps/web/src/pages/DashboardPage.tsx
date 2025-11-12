import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api';
import { FolderKanban, DollarSign, TrendingUp, FileText } from 'lucide-react';
import { formatCurrency, formatPercentage } from '@/lib/utils';

export default function DashboardPage() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: () => analyticsApi.getDashboard(),
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  const stats = [
    {
      name: '전체 프로젝트',
      value: metrics?.totalProjects || 0,
      icon: FolderKanban,
      color: 'bg-blue-500',
    },
    {
      name: '총 예산',
      value: formatCurrency(metrics?.totalBudget || 0),
      icon: DollarSign,
      color: 'bg-green-500',
    },
    {
      name: '평균 집행률',
      value: formatPercentage(metrics?.averageExecutionRate || 0),
      icon: TrendingUp,
      color: 'bg-orange-500',
    },
    {
      name: '대기 결재',
      value: metrics?.pendingApprovals || 0,
      icon: FileText,
      color: 'bg-red-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">대시보드</h1>
        <p className="text-gray-500 mt-1">XEM 시스템 전체 현황</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white rounded-lg shadow p-6 border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {stat.value}
                </p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Executions */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <h2 className="text-xl font-semibold mb-4">최근 집행 현황</h2>
        <div className="space-y-3">
          {metrics?.recentExecutions?.map((execution) => (
            <div
              key={execution.id}
              className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
            >
              <div>
                <p className="font-medium text-gray-900">
                  {execution.projectName}
                </p>
                <p className="text-sm text-gray-500">
                  {execution.executionNumber}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-primary">
                  {formatCurrency(execution.amount)}
                </p>
                <p className="text-xs text-gray-500">{execution.status}</p>
              </div>
            </div>
          )) || (
            <p className="text-center text-gray-500 py-8">
              최근 집행 내역이 없습니다.
            </p>
          )}
        </div>
      </div>

      {/* Risk Alerts */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <h2 className="text-xl font-semibold mb-4">리스크 알림</h2>
        <div className="space-y-3">
          {metrics?.riskAlerts?.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-lg border-l-4 ${
                alert.type === 'danger'
                  ? 'bg-red-50 border-red-500'
                  : alert.type === 'warning'
                  ? 'bg-yellow-50 border-yellow-500'
                  : 'bg-blue-50 border-blue-500'
              }`}
            >
              <p className="font-medium text-gray-900">{alert.title}</p>
              <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
              {alert.projectName && (
                <p className="text-xs text-gray-500 mt-2">
                  프로젝트: {alert.projectName}
                </p>
              )}
            </div>
          )) || (
            <p className="text-center text-gray-500 py-8">
              알림이 없습니다.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
