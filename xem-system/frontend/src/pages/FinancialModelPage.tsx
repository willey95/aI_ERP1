import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import api from '../lib/api';
import { formatCurrency } from '../lib/formatters';
import type { FinancialModel, MonthlyProjection } from '../types';
import type { TooltipItem } from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function FinancialModelPage() {
  const { projectId } = useParams();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    salesRate: 80,
    salesStartMonth: 6,
    constructionDelay: 0,
    costInflation: 0,
    interestRate: 5.5,
  });

  const [previewMode, setPreviewMode] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  // Fetch active financial model
  const { data: activeModel } = useQuery({
    queryKey: ['financial-model', projectId],
    queryFn: async () => {
      const response = await api.get(`/financial/model/${projectId}`);
      return response.data;
    },
  });

  // Fetch all versions
  const { data: allModels } = useQuery({
    queryKey: ['financial-models', projectId],
    queryFn: async () => {
      const response = await api.get(`/financial/models/${projectId}`);
      return response.data;
    },
  });

  // Calculate mutation (preview)
  const calculateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await api.post(`/financial/model/${projectId}/calculate`, data);
      return response.data;
    },
    onSuccess: (data: any) => {
      setPreviewData(data);
      setPreviewMode(true);
    },
  });

  // Create mutation (save)
  const createModelMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await api.post(`/financial/model/${projectId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-model', projectId] });
      queryClient.invalidateQueries({ queryKey: ['financial-models', projectId] });
      setPreviewMode(false);
      setPreviewData(null);
    },
  });

  const handleCalculate = () => {
    calculateMutation.mutate(formData);
  };

  const handleSave = () => {
    createModelMutation.mutate(formData);
  };

  const handleLoadVersion = (model: FinancialModel) => {
    setFormData({
      salesRate: model.salesRate,
      salesStartMonth: model.salesStartMonth,
      constructionDelay: model.constructionDelay || 0,
      costInflation: model.costInflation || 0,
      interestRate: model.interestRate,
    });
    setPreviewMode(false);
    setPreviewData(null);
  };

  const displayData = previewData || activeModel;

  // Chart data
  const chartData = displayData?.monthlyProjections
    ? {
        labels: displayData.monthlyProjections.map((p: MonthlyProjection) => `${p.month}월`),
        datasets: [
          {
            label: '월 수익',
            data: displayData.monthlyProjections.map((p: MonthlyProjection) => p.revenue / 100000000),
            borderColor: 'rgb(120, 113, 108)',
            backgroundColor: 'rgba(120, 113, 108, 0.1)',
            fill: true,
            tension: 0.4,
          },
          {
            label: '월 비용',
            data: displayData.monthlyProjections.map((p: MonthlyProjection) => p.cost / 100000000),
            borderColor: 'rgb(168, 162, 158)',
            backgroundColor: 'rgba(168, 162, 158, 0.1)',
            fill: true,
            tension: 0.4,
          },
          {
            label: '누적 현금',
            data: displayData.monthlyProjections.map((p: MonthlyProjection) => p.cumulativeCash / 100000000),
            borderColor: 'rgb(28, 25, 23)',
            backgroundColor: 'rgba(28, 25, 23, 0.1)',
            fill: true,
            tension: 0.4,
          },
          {
            label: '순 현금흐름',
            data: displayData.monthlyProjections.map((p: MonthlyProjection) => p.netCashFlow / 100000000),
            borderColor: 'rgb(214, 211, 209)',
            backgroundColor: 'rgba(214, 211, 209, 0.1)',
            fill: false,
            tension: 0.4,
            borderDash: [5, 5],
          },
        ],
      }
    : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: {
            family: 'Pretendard Variable',
            size: 12,
          },
          color: '#1C1917',
          usePointStyle: true,
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1C1917',
        bodyColor: '#44403C',
        borderColor: '#E7E5E4',
        borderWidth: 1,
        padding: 12,
        titleFont: {
          family: 'Pretendard Variable',
          size: 13,
          weight: 600,
        },
        bodyFont: {
          family: 'JetBrains Mono',
          size: 12,
        },
        callbacks: {
          label: (context: TooltipItem<'line'>) => {
            const value = context.parsed.y ?? 0;
            return `${context.dataset.label}: ${value.toFixed(1)}억원`;
          },
        },
      },
    },
    scales: {
      y: {
        grid: {
          color: '#F5F5F4',
          drawBorder: false,
        },
        ticks: {
          font: {
            family: 'JetBrains Mono',
            size: 11,
          },
          color: '#78716C',
          callback: (value: number | string) => `${value}억`,
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            family: 'Pretendard Variable',
            size: 11,
          },
          color: '#78716C',
        },
      },
    },
  };

  return (
    <div className="min-h-screen bg-stone-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-stone-900 tracking-tight">재무 모델</h1>
            <p className="text-stone-600 mt-1">프로젝트의 재무 예측 모델을 관리합니다</p>
          </div>
          {activeModel && (
            <div className="text-right">
              <div className="text-sm text-stone-600">현재 버전</div>
              <div className="text-2xl font-bold text-stone-900">v{activeModel.version}</div>
            </div>
          )}
        </div>

        {/* Preview Mode Banner */}
        {previewMode && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              <div>
                <div className="font-semibold text-amber-900">미리보기 모드</div>
                <div className="text-sm text-amber-700">
                  계산 결과를 확인 후 저장하세요. 저장하지 않으면 변경사항이 유지되지 않습니다.
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setPreviewMode(false);
                setPreviewData(null);
              }}
              className="text-amber-700 hover:text-amber-900 font-medium"
            >
              취소
            </button>
          </div>
        )}

        {/* Input Form */}
        <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-stone-900 mb-4">모델 파라미터</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                분양률 (%)
              </label>
              <input
                type="number"
                value={formData.salesRate}
                onChange={(e) =>
                  setFormData({ ...formData, salesRate: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 font-mono focus:outline-none focus:ring-2 focus:ring-stone-300 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                분양 시작 (개월)
              </label>
              <input
                type="number"
                value={formData.salesStartMonth}
                onChange={(e) =>
                  setFormData({ ...formData, salesStartMonth: parseInt(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 font-mono focus:outline-none focus:ring-2 focus:ring-stone-300 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                공사 지연 (개월)
              </label>
              <input
                type="number"
                value={formData.constructionDelay}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    constructionDelay: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 font-mono focus:outline-none focus:ring-2 focus:ring-stone-300 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                비용 인플레 (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.costInflation}
                onChange={(e) =>
                  setFormData({ ...formData, costInflation: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 font-mono focus:outline-none focus:ring-2 focus:ring-stone-300 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                금리 (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.interestRate}
                onChange={(e) =>
                  setFormData({ ...formData, interestRate: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 font-mono focus:outline-none focus:ring-2 focus:ring-stone-300 transition-all"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleCalculate}
              disabled={calculateMutation.isPending}
              className="px-6 py-2.5 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {calculateMutation.isPending ? '계산 중...' : '계산'}
            </button>

            {previewMode && (
              <button
                onClick={handleSave}
                disabled={createModelMutation.isPending}
                className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {createModelMutation.isPending ? '저장 중...' : '새 버전으로 저장'}
              </button>
            )}
          </div>
        </div>

        {/* Key Metrics */}
        {displayData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
              <div className="text-xs text-stone-600 mb-1">총 수익</div>
              <div className="text-xl font-bold text-stone-900 font-mono">
                {formatCurrency(displayData.totalRevenue || displayData.summary?.totalRevenue)}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
              <div className="text-xs text-stone-600 mb-1">총 비용</div>
              <div className="text-xl font-bold text-stone-900 font-mono">
                {formatCurrency(displayData.totalCost || displayData.summary?.totalCost)}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
              <div className="text-xs text-stone-600 mb-1">예상 이익</div>
              <div className="text-xl font-bold text-stone-900 font-mono">
                {formatCurrency(displayData.expectedProfit || displayData.summary?.expectedProfit)}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
              <div className="text-xs text-stone-600 mb-1">ROI</div>
              <div className="text-xl font-bold text-stone-900 font-mono">
                {((displayData.roi || displayData.summary?.roi) ?? 0).toFixed(2)}%
              </div>
            </div>

            <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
              <div className="text-xs text-stone-600 mb-1">최저 현금</div>
              <div className="text-xl font-bold text-stone-900 font-mono">
                {formatCurrency(displayData.lowestCashPoint || displayData.summary?.lowestCashPoint)}
              </div>
              <div className="text-[10px] text-stone-500 mt-1">
                {displayData.lowestCashMonth || displayData.summary?.lowestCashMonth}개월차
              </div>
            </div>
          </div>
        )}

        {/* Chart */}
        {displayData && chartData && (
          <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-stone-900 mb-4">36개월 재무 전망</h2>
            <div className="h-96">
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>
        )}

        {/* Monthly Projections Table */}
        {displayData?.monthlyProjections && (
          <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-stone-900 mb-4">월별 상세 내역</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-stone-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-stone-700">
                      월
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-stone-700">
                      수익
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-stone-700">
                      비용
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-stone-700">
                      이자
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-stone-700">
                      순현금흐름
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-stone-700">
                      누적현금
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {displayData.monthlyProjections.map((projection: MonthlyProjection, idx: number) => (
                    <tr
                      key={idx}
                      className={`border-b border-stone-100 hover:bg-stone-50 ${
                        projection.cumulativeCash < 0 ? 'bg-red-50' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-medium text-stone-900">{projection.month}월</td>
                      <td className="py-3 px-4 text-right font-mono text-stone-700">
                        {formatCurrency(projection.revenue)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-stone-700">
                        {formatCurrency(projection.cost)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-stone-700">
                        {formatCurrency(projection.interest)}
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-mono font-medium ${
                          projection.netCashFlow >= 0 ? 'text-emerald-700' : 'text-red-700'
                        }`}
                      >
                        {formatCurrency(projection.netCashFlow)}
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-mono font-medium ${
                          projection.cumulativeCash >= 0 ? 'text-emerald-700' : 'text-red-700'
                        }`}
                      >
                        {formatCurrency(projection.cumulativeCash)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Version History */}
        {allModels && allModels.length > 0 && (
          <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-stone-900 mb-4">버전 히스토리</h2>
            <div className="space-y-3">
              {allModels.map((model: FinancialModel) => (
                <div
                  key={model.id}
                  className={`p-4 rounded-lg border ${
                    model.isActive
                      ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-stone-50 border-stone-200'
                  } hover:border-stone-300 transition-colors cursor-pointer`}
                  onClick={() => handleLoadVersion(model)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold text-stone-900">
                          버전 {model.version}
                        </span>
                        {model.isActive && (
                          <span className="px-2 py-0.5 bg-emerald-600 text-white text-xs rounded-full font-medium">
                            활성
                          </span>
                        )}
                        <span className="text-sm text-stone-500">
                          {new Date(model.createdAt).toLocaleString('ko-KR')}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <div className="text-stone-600">분양률</div>
                          <div className="font-mono text-stone-900">{model.salesRate}%</div>
                        </div>
                        <div>
                          <div className="text-stone-600">분양시작</div>
                          <div className="font-mono text-stone-900">{model.salesStartMonth}개월</div>
                        </div>
                        <div>
                          <div className="text-stone-600">금리</div>
                          <div className="font-mono text-stone-900">{model.interestRate}%</div>
                        </div>
                        <div>
                          <div className="text-stone-600">ROI</div>
                          <div className="font-mono text-stone-900">{model.roi?.toFixed(2)}%</div>
                        </div>
                        <div>
                          <div className="text-stone-600">예상이익</div>
                          <div className="font-mono text-stone-900">
                            {formatCurrency(model.expectedProfit)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
