import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { projectsApi, budgetApi } from '@/lib/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  formatCurrency,
  formatPercentage,
  getExecutionRateBadgeClass,
} from '@/lib/utils';
import { Plus, Edit, Trash2 } from 'lucide-react';

export default function BudgetPage() {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  // Fetch projects list
  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getAll(),
  });

  // Fetch budget data for selected project
  const { data: budgetData, isLoading: budgetLoading } = useQuery({
    queryKey: ['budget', selectedProjectId],
    queryFn: () => budgetApi.getByProject(selectedProjectId),
    enabled: !!selectedProjectId,
  });

  // Prepare waterfall chart data
  const waterfallData = budgetData
    ? [
        {
          name: '분양수입',
          value: budgetData.revenue.presale,
          fill: '#10B981',
        },
        {
          name: '임대수입',
          value: budgetData.revenue.rental,
          fill: '#10B981',
        },
        {
          name: '총수입',
          value: budgetData.revenue.total,
          fill: '#2563EB',
        },
        {
          name: '토지비',
          value: -budgetData.expense.land,
          fill: '#EF4444',
        },
        {
          name: '공사비',
          value: -budgetData.expense.construction,
          fill: '#EF4444',
        },
        {
          name: '설계/감리',
          value: -budgetData.expense.design,
          fill: '#F59E0B',
        },
        {
          name: '부담금',
          value: -budgetData.expense.contributions,
          fill: '#F59E0B',
        },
        {
          name: '금융비용',
          value: -budgetData.expense.finance,
          fill: '#F59E0B',
        },
        {
          name: '마케팅',
          value: -budgetData.expense.marketing,
          fill: '#F59E0B',
        },
        {
          name: '사업이익',
          value: budgetData.profit,
          fill: '#8B5CF6',
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">예산 관리</h1>
          <p className="text-gray-500 mt-1">프로젝트별 예산 현황 및 관리</p>
        </div>
        <button
          className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
          disabled={!selectedProjectId}
        >
          <Plus className="w-4 h-4 mr-2" />
          예산 항목 추가
        </button>
      </div>

      {/* Project Selector */}
      <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          프로젝트 선택
        </label>
        <select
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="">프로젝트를 선택하세요</option>
          {projectsData?.projects?.map((project: any) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>

      {selectedProjectId && !budgetLoading && budgetData && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
              <p className="text-sm text-gray-600">최초 예산</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {formatCurrency(budgetData.revenue.total)}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
              <p className="text-sm text-gray-600">변경 예산</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {formatCurrency(budgetData.revenue.total)}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
              <p className="text-sm text-gray-600">집행액</p>
              <p className="text-2xl font-bold text-primary mt-2">
                {formatCurrency(
                  budgetData.items.reduce((sum, item) => sum + item.executedAmount, 0)
                )}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
              <p className="text-sm text-gray-600">잔액</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {formatCurrency(
                  budgetData.items.reduce((sum, item) => sum + item.remainingAmount, 0)
                )}
              </p>
            </div>
          </div>

          {/* Waterfall Chart */}
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <h2 className="text-xl font-semibold mb-4">
              사업수지 구성 (Waterfall Chart)
            </h2>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={waterfallData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis
                  tickFormatter={(value) =>
                    `${value >= 0 ? '' : '-'}${formatCurrency(Math.abs(value))}`
                  }
                />
                <Tooltip
                  formatter={(value: number) =>
                    `${value >= 0 ? '' : '-'}${formatCurrency(Math.abs(value))}`
                  }
                />
                <Bar dataKey="value">
                  {waterfallData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Budget Items Table */}
          <div className="bg-white rounded-lg shadow border border-gray-200">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">항목별 상세 내역</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-y border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      구분
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      항목
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      최초 예산
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      변경 예산
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      집행액
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      잔액
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      집행률
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      액션
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {budgetData.items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.category === 'REVENUE' ? '수입' : '지출'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {item.name}
                        </div>
                        <div className="text-xs text-gray-500">{item.code}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {formatCurrency(item.initialAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {formatCurrency(item.currentAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-primary">
                        {formatCurrency(item.executedAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {formatCurrency(item.remainingAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        <span
                          className={`font-semibold ${getExecutionRateBadgeClass(
                            item.executionRate
                          )}`}
                        >
                          {formatPercentage(item.executionRate)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                        <div className="flex items-center justify-center space-x-2">
                          <button className="text-blue-600 hover:text-blue-900">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-900">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {selectedProjectId && budgetLoading && (
        <div className="bg-white rounded-lg shadow p-12 border border-gray-200 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-gray-500 mt-4">예산 데이터를 불러오는 중...</p>
        </div>
      )}

      {!selectedProjectId && (
        <div className="bg-white rounded-lg shadow p-12 border border-gray-200 text-center">
          <p className="text-gray-500">
            프로젝트를 선택하여 예산 현황을 확인하세요
          </p>
        </div>
      )}
    </div>
  );
}
