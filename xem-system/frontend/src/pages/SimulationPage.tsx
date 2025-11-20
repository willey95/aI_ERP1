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
  TooltipItem,
} from 'chart.js';
import api from '../lib/api';
import { formatCurrency } from '../lib/formatters';
import type {
  ScenarioInput,
  Simulation,
  SimulationRunResult,
  ScenarioComparisonResult,
  Recommendation,
  MonthlyProjection,
} from '../types';

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

export default function SimulationPage() {
  const { projectId } = useParams();
  const queryClient = useQueryClient();

  const [scenario, setScenario] = useState({
    name: '시나리오 1',
    salesDelay: 0,
    salesRate: 80,
    costChange: 0,
    interestChange: 0,
  });

  const [compareMode, setCompareMode] = useState(false);
  const [scenarios, setScenarios] = useState<ScenarioInput[]>([]);
  const [currentResult, setCurrentResult] = useState<SimulationRunResult | null>(null);

  // Fetch saved simulations
  const { data: savedSimulations } = useQuery<Simulation[]>({
    queryKey: ['simulations', projectId],
    queryFn: async () => {
      const response = await api.get(`/simulation?projectId=${projectId}`);
      return response.data;
    },
  });

  // Run simulation mutation
  const runSimulationMutation = useMutation<SimulationRunResult, Error, typeof scenario>({
    mutationFn: async (data) => {
      const response = await api.post(`/simulation/run/${projectId}`, data);
      return response.data;
    },
    onSuccess: (data) => {
      setCurrentResult(data);
    },
  });

  // Compare scenarios mutation
  const compareScenariosMutation = useMutation<ScenarioComparisonResult, Error, ScenarioInput[]>({
    mutationFn: async (scenarioList) => {
      const response = await api.post(`/simulation/compare/${projectId}`, {
        scenarios: scenarioList,
      });
      return response.data;
    },
  });

  // Save simulation mutation
  const saveSimulationMutation = useMutation<Simulation, Error, any>({
    mutationFn: async (data) => {
      const response = await api.post('/simulation', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulations', projectId] });
    },
  });

  const handleRunSimulation = () => {
    runSimulationMutation.mutate(scenario);
  };

  const handleSaveSimulation = () => {
    if (!currentResult) return;

    saveSimulationMutation.mutate({
      projectId,
      name: scenario.name,
      salesDelay: scenario.salesDelay,
      salesRate: scenario.salesRate,
      costChange: scenario.costChange,
      interestChange: scenario.interestChange,
    });
  };

  const handleAddToCompare = () => {
    setScenarios([...scenarios, { ...scenario, id: Date.now() }]);
  };

  const handleCompareScenarios = () => {
    compareScenariosMutation.mutate(scenarios);
  };

  const getRecommendationType = (type: Recommendation['type']) => {
    switch (type) {
      case 'CRITICAL':
        return 'bg-red-50 border-red-200 text-red-900';
      case 'WARNING':
        return 'bg-amber-50 border-amber-200 text-amber-900';
      case 'SUCCESS':
        return 'bg-emerald-50 border-emerald-200 text-emerald-900';
      default:
        return 'bg-stone-50 border-stone-200 text-stone-900';
    }
  };

  // Chart data
  const chartData = currentResult?.results?.monthlyProjections
    ? {
        labels: currentResult.results.monthlyProjections.map((p: MonthlyProjection) => `${p.month}월`),
        datasets: [
          {
            label: '수익',
            data: currentResult.results.monthlyProjections.map((p: MonthlyProjection) => p.revenue / 100000000),
            borderColor: 'rgb(120, 113, 108)',
            backgroundColor: 'rgba(120, 113, 108, 0.1)',
            fill: true,
            tension: 0.4,
          },
          {
            label: '비용',
            data: currentResult.results.monthlyProjections.map((p: MonthlyProjection) => p.cost / 100000000),
            borderColor: 'rgb(168, 162, 158)',
            backgroundColor: 'rgba(168, 162, 158, 0.1)',
            fill: true,
            tension: 0.4,
          },
          {
            label: '누적현금',
            data: currentResult.results.monthlyProjections.map(
              (p: MonthlyProjection) => p.cumulativeCash / 100000000
            ),
            borderColor: 'rgb(28, 25, 23)',
            backgroundColor: 'rgba(28, 25, 23, 0.1)',
            fill: true,
            tension: 0.4,
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
            <h1 className="text-3xl font-bold text-stone-900 tracking-tight">시나리오 분석</h1>
            <p className="text-stone-600 mt-1">다양한 변수를 조정하여 프로젝트 결과를 예측합니다</p>
          </div>
          <button
            onClick={() => setCompareMode(!compareMode)}
            className="px-4 py-2 bg-white border border-stone-200 rounded-lg text-stone-700 hover:bg-stone-50 transition-colors"
          >
            {compareMode ? '단일 분석 모드' : '비교 분석 모드'}
          </button>
        </div>

        {/* Scenario Input */}
        <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-stone-900 mb-4">시나리오 변수</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                시나리오 이름
              </label>
              <input
                type="text"
                value={scenario.name}
                onChange={(e) => setScenario({ ...scenario, name: e.target.value })}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-300 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                분양시기 지연 (개월)
              </label>
              <input
                type="number"
                value={scenario.salesDelay}
                onChange={(e) =>
                  setScenario({ ...scenario, salesDelay: parseInt(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 font-mono focus:outline-none focus:ring-2 focus:ring-stone-300 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                분양률 (%)
              </label>
              <input
                type="number"
                value={scenario.salesRate}
                onChange={(e) =>
                  setScenario({ ...scenario, salesRate: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 font-mono focus:outline-none focus:ring-2 focus:ring-stone-300 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                공사비 변동 (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={scenario.costChange}
                onChange={(e) =>
                  setScenario({ ...scenario, costChange: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 font-mono focus:outline-none focus:ring-2 focus:ring-stone-300 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                금리 변동 (%p)
              </label>
              <input
                type="number"
                step="0.1"
                value={scenario.interestChange}
                onChange={(e) =>
                  setScenario({
                    ...scenario,
                    interestChange: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 font-mono focus:outline-none focus:ring-2 focus:ring-stone-300 transition-all"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleRunSimulation}
              disabled={runSimulationMutation.isPending}
              className="px-6 py-2.5 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {runSimulationMutation.isPending ? '분석 중...' : '시뮬레이션 실행'}
            </button>

            {compareMode && (
              <button
                onClick={handleAddToCompare}
                className="px-6 py-2.5 bg-white border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors font-medium"
              >
                비교 목록에 추가
              </button>
            )}

            {currentResult && (
              <button
                onClick={handleSaveSimulation}
                disabled={saveSimulationMutation.isPending}
                className="px-6 py-2.5 bg-white border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors disabled:opacity-50 font-medium"
              >
                {saveSimulationMutation.isPending ? '저장 중...' : '시뮬레이션 저장'}
              </button>
            )}
          </div>
        </div>

        {/* Comparison Mode */}
        {compareMode && scenarios.length > 0 && (
          <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-stone-900">비교 시나리오 목록</h2>
              <button
                onClick={handleCompareScenarios}
                disabled={compareScenariosMutation.isPending || scenarios.length < 2}
                className="px-4 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
              >
                {compareScenariosMutation.isPending ? '비교 중...' : '시나리오 비교 실행'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {scenarios.map((s: ScenarioInput, idx: number) => (
                <div
                  key={s.id}
                  className="p-4 bg-stone-50 rounded-lg border border-stone-200 relative"
                >
                  <button
                    onClick={() => setScenarios(scenarios.filter((sc: ScenarioInput) => sc.id !== s.id))}
                    className="absolute top-2 right-2 text-stone-400 hover:text-stone-600"
                  >
                    ✕
                  </button>
                  <h3 className="font-semibold text-stone-900 mb-2">{s.name}</h3>
                  <div className="space-y-1 text-sm text-stone-600 font-mono">
                    <div>분양 지연: {s.salesDelay}개월</div>
                    <div>분양률: {s.salesRate}%</div>
                    <div>공사비: {s.costChange > 0 ? '+' : ''}{s.costChange}%</div>
                    <div>금리: {s.interestChange > 0 ? '+' : ''}{s.interestChange}%p</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {currentResult && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
                <div className="text-xs text-stone-600 mb-1">예상 ROI</div>
                <div className="text-2xl font-bold text-stone-900 font-mono">
                  {currentResult.projectedROI?.toFixed(2)}%
                </div>
                <div className="text-[10px] text-stone-500 mt-1">투자 대비 수익률</div>
              </div>

              <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
                <div className="text-xs text-stone-600 mb-1">예상 수익</div>
                <div className="text-2xl font-bold text-stone-900 font-mono">
                  {formatCurrency(currentResult.projectedProfit)}
                </div>
                <div className="text-[10px] text-stone-500 mt-1">총 프로젝트 수익</div>
              </div>

              <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
                <div className="text-xs text-stone-600 mb-1">최저 현금</div>
                <div className="text-2xl font-bold text-stone-900 font-mono">
                  {formatCurrency(currentResult.lowestCash)}
                </div>
                <div className="text-[10px] text-stone-500 mt-1">
                  {currentResult.lowestCashMonth}개월차
                </div>
              </div>

              <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
                <div className="text-xs text-stone-600 mb-1">시나리오</div>
                <div className="text-xl font-bold text-stone-900">
                  {currentResult.scenario}
                </div>
                <div className="text-[10px] text-stone-500 mt-1">현재 분석 중</div>
              </div>
            </div>

            {/* Chart */}
            <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-stone-900 mb-4">월별 현금 흐름</h2>
              <div className="h-96">
                {chartData && <Line data={chartData} options={chartOptions} />}
              </div>
            </div>

            {/* Recommendations */}
            {currentResult.recommendations && currentResult.recommendations.length > 0 && (
              <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-stone-900 mb-4">AI 분석 및 권고사항</h2>
                <div className="space-y-3">
                  {currentResult.recommendations.map((rec: Recommendation, idx: number) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-lg border ${getRecommendationType(rec.type)}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold uppercase tracking-wider">
                              {rec.category}
                            </span>
                            <span className="text-xs opacity-60">•</span>
                            <span className="text-xs font-semibold uppercase tracking-wider">
                              {rec.type}
                            </span>
                          </div>
                          <h3 className="font-semibold mb-1">{rec.title}</h3>
                          <p className="text-sm mb-2 opacity-90">{rec.description}</p>
                          <p className="text-sm font-medium">→ {rec.action}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Comparison Results */}
        {compareScenariosMutation.data && (
          <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-stone-900 mb-4">시나리오 비교 결과</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <div className="text-sm text-emerald-700 mb-1">최고 ROI</div>
                <div className="text-xl font-bold text-emerald-900">
                  {compareScenariosMutation.data.comparison.bestROI?.name}
                </div>
                <div className="text-lg font-mono text-emerald-800 mt-1">
                  {compareScenariosMutation.data.comparison.bestROI?.roi.toFixed(2)}%
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-sm text-blue-700 mb-1">최고 수익</div>
                <div className="text-xl font-bold text-blue-900">
                  {compareScenariosMutation.data.comparison.highestProfit?.name}
                </div>
                <div className="text-lg font-mono text-blue-800 mt-1">
                  {formatCurrency(compareScenariosMutation.data.comparison.highestProfit?.profit)}
                </div>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="text-sm text-purple-700 mb-1">최상 현금흐름</div>
                <div className="text-xl font-bold text-purple-900">
                  {compareScenariosMutation.data.comparison.bestCashFlow?.name}
                </div>
                <div className="text-lg font-mono text-purple-800 mt-1">
                  {formatCurrency(compareScenariosMutation.data.comparison.bestCashFlow?.cashFlow)}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-stone-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-stone-700">
                      시나리오
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-stone-700">
                      ROI
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-stone-700">
                      예상 수익
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-stone-700">
                      최저 현금
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {compareScenariosMutation.data.scenarios.map((scenario: any, idx: number) => (
                    <tr key={idx} className="border-b border-stone-100 hover:bg-stone-50">
                      <td className="py-3 px-4 font-medium text-stone-900">
                        {scenario.name}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-stone-700">
                        {scenario.results.roi.toFixed(2)}%
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-stone-700">
                        {formatCurrency(scenario.results.totalProfit)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-stone-700">
                        {formatCurrency(scenario.results.lowestCashPoint)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Saved Simulations */}
        {savedSimulations && savedSimulations.length > 0 && (
          <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-stone-900 mb-4">저장된 시뮬레이션</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedSimulations.map((sim: Simulation) => (
                <div
                  key={sim.id}
                  className="p-4 bg-stone-50 rounded-lg border border-stone-200 hover:border-stone-300 transition-colors cursor-pointer"
                  onClick={() => {
                    setScenario({
                      name: sim.name,
                      salesDelay: sim.salesDelay,
                      salesRate: sim.salesRate,
                      costChange: sim.costChange,
                      interestChange: sim.interestChange,
                    });
                  }}
                >
                  <h3 className="font-semibold text-stone-900 mb-2">{sim.name}</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-stone-600">ROI:</span>
                      <span className="font-mono text-stone-900">
                        {sim.projectedROI?.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-600">예상수익:</span>
                      <span className="font-mono text-stone-900">
                        {formatCurrency(sim.projectedProfit)}
                      </span>
                    </div>
                    <div className="text-xs text-stone-500 mt-2">
                      {new Date(sim.createdAt).toLocaleDateString('ko-KR')}
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
