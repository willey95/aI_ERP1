import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { formatCurrency } from '../lib/formatters';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface MonthlyData {
  budget: number;
  forecast: number;
  actual: number;
}

interface CFRow {
  type: string;
  category: string;
  mainItem: string;
  monthlyData: Record<string, MonthlyData>;
  total: {
    budget: number;
    forecast: number;
    actual: number;
  };
}

interface MonthlyTotal {
  inflowBudget: number;
  inflowForecast: number;
  inflowActual: number;
  outflowBudget: number;
  outflowForecast: number;
  outflowActual: number;
  netBudget: number;
  netForecast: number;
  netActual: number;
}

export default function CashFlowPage() {
  const { projectId } = useParams();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'budget' | 'forecast' | 'actual'>('forecast');

  // Fetch cash flow pivot data
  const { data: pivotData, isLoading } = useQuery({
    queryKey: ['cashflow-pivot', projectId],
    queryFn: async () => {
      const response = await api.get(`/financial/cashflow/${projectId}/pivot`);
      return response.data as {
        months: string[];
        rows: CFRow[];
        monthlyTotals: Record<string, MonthlyTotal>;
        project: {
          constructionStartDate: string;
          completionDate: string;
        };
      };
    },
  });

  const toggleRow = (key: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedRows(newExpanded);
  };

  const formatMonth = (month: string) => {
    const [year, monthNum] = month.split('-');
    return `${year.slice(2)}.${monthNum}`;
  };

  const getValue = (data: MonthlyData | undefined, mode: 'budget' | 'forecast' | 'actual') => {
    if (!data) return 0;
    return data[mode];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 p-6 flex items-center justify-center">
        <div className="text-stone-600">데이터 로딩 중...</div>
      </div>
    );
  }

  if (!pivotData) {
    return (
      <div className="min-h-screen bg-stone-50 p-6 flex items-center justify-center">
        <div className="text-stone-600">Cash Flow 데이터가 없습니다.</div>
      </div>
    );
  }

  // Group rows by type
  const inflowRows = pivotData.rows.filter((r) => r.type === 'INFLOW');
  const outflowRows = pivotData.rows.filter((r) => r.type === 'OUTFLOW');

  return (
    <div className="min-h-screen bg-stone-50 p-6">
      <div className="max-w-[98%] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-stone-900 tracking-tight">현금 흐름표</h1>
            <p className="text-stone-600 mt-1">
              착공({formatMonth(pivotData.months[0])}) ~ 준공 후 6개월(
              {formatMonth(pivotData.months[pivotData.months.length - 1])})
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('budget')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'budget'
                  ? 'bg-stone-900 text-white'
                  : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
              }`}
            >
              예산액
            </button>
            <button
              onClick={() => setViewMode('forecast')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'forecast'
                  ? 'bg-stone-900 text-white'
                  : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
              }`}
            >
              전망액
            </button>
            <button
              onClick={() => setViewMode('actual')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'actual'
                  ? 'bg-stone-900 text-white'
                  : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
              }`}
            >
              실제액
            </button>
          </div>
        </div>

        {/* Pivot Table */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-stone-900 text-white sticky top-0">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold border-r border-stone-700 min-w-[180px]">
                    구분
                  </th>
                  {pivotData.months.map((month) => (
                    <th
                      key={month}
                      className="text-right py-3 px-3 font-medium border-r border-stone-700 min-w-[100px]"
                    >
                      {formatMonth(month)}
                    </th>
                  ))}
                  <th className="text-right py-3 px-4 font-semibold min-w-[120px]">합계</th>
                </tr>
              </thead>
              <tbody>
                {/* INFLOW Section */}
                <tr
                  className="bg-emerald-50 border-b border-emerald-200 cursor-pointer hover:bg-emerald-100"
                  onClick={() => toggleRow('INFLOW')}
                >
                  <td className="py-3 px-4 font-bold text-emerald-900 border-r border-emerald-200">
                    <div className="flex items-center gap-2">
                      {expandedRows.has('INFLOW') ? (
                        <ChevronDownIcon className="w-4 h-4" />
                      ) : (
                        <ChevronRightIcon className="w-4 h-4" />
                      )}
                      수입 합계
                    </div>
                  </td>
                  {pivotData.months.map((month) => {
                    const total = pivotData.monthlyTotals[month];
                    const value =
                      viewMode === 'budget'
                        ? total.inflowBudget
                        : viewMode === 'forecast'
                        ? total.inflowForecast
                        : total.inflowActual;
                    return (
                      <td
                        key={month}
                        className="text-right py-3 px-3 font-mono text-emerald-700 border-r border-emerald-100"
                      >
                        {formatCurrency(value)}
                      </td>
                    );
                  })}
                  <td className="text-right py-3 px-4 font-mono font-bold text-emerald-900">
                    {formatCurrency(
                      inflowRows.reduce(
                        (sum, row) => sum + (row.total[viewMode] || 0),
                        0,
                      ),
                    )}
                  </td>
                </tr>

                {/* INFLOW Detail Rows */}
                {expandedRows.has('INFLOW') &&
                  inflowRows.map((row) => {
                    const rowKey = `${row.type}-${row.category}-${row.mainItem}`;
                    return (
                      <tr
                        key={rowKey}
                        className="border-b border-stone-100 hover:bg-emerald-50/30"
                      >
                        <td className="py-2 px-4 pl-10 text-stone-700 border-r border-stone-100">
                          {row.category} - {row.mainItem}
                        </td>
                        {pivotData.months.map((month) => {
                          const value = getValue(row.monthlyData[month], viewMode);
                          return (
                            <td
                              key={month}
                              className="text-right py-2 px-3 font-mono text-stone-600 text-xs border-r border-stone-50"
                            >
                              {value > 0 ? formatCurrency(value) : '-'}
                            </td>
                          );
                        })}
                        <td className="text-right py-2 px-4 font-mono text-stone-700">
                          {formatCurrency(row.total[viewMode])}
                        </td>
                      </tr>
                    );
                  })}

                {/* OUTFLOW Section */}
                <tr
                  className="bg-red-50 border-b border-red-200 cursor-pointer hover:bg-red-100"
                  onClick={() => toggleRow('OUTFLOW')}
                >
                  <td className="py-3 px-4 font-bold text-red-900 border-r border-red-200">
                    <div className="flex items-center gap-2">
                      {expandedRows.has('OUTFLOW') ? (
                        <ChevronDownIcon className="w-4 h-4" />
                      ) : (
                        <ChevronRightIcon className="w-4 h-4" />
                      )}
                      지출 합계
                    </div>
                  </td>
                  {pivotData.months.map((month) => {
                    const total = pivotData.monthlyTotals[month];
                    const value =
                      viewMode === 'budget'
                        ? total.outflowBudget
                        : viewMode === 'forecast'
                        ? total.outflowForecast
                        : total.outflowActual;
                    return (
                      <td
                        key={month}
                        className="text-right py-3 px-3 font-mono text-red-700 border-r border-red-100"
                      >
                        {formatCurrency(value)}
                      </td>
                    );
                  })}
                  <td className="text-right py-3 px-4 font-mono font-bold text-red-900">
                    {formatCurrency(
                      outflowRows.reduce(
                        (sum, row) => sum + (row.total[viewMode] || 0),
                        0,
                      ),
                    )}
                  </td>
                </tr>

                {/* OUTFLOW Detail Rows */}
                {expandedRows.has('OUTFLOW') &&
                  outflowRows.map((row) => {
                    const rowKey = `${row.type}-${row.category}-${row.mainItem}`;
                    return (
                      <tr
                        key={rowKey}
                        className="border-b border-stone-100 hover:bg-red-50/30"
                      >
                        <td className="py-2 px-4 pl-10 text-stone-700 border-r border-stone-100">
                          {row.category} - {row.mainItem}
                        </td>
                        {pivotData.months.map((month) => {
                          const value = getValue(row.monthlyData[month], viewMode);
                          return (
                            <td
                              key={month}
                              className="text-right py-2 px-3 font-mono text-stone-600 text-xs border-r border-stone-50"
                            >
                              {value > 0 ? formatCurrency(value) : '-'}
                            </td>
                          );
                        })}
                        <td className="text-right py-2 px-4 font-mono text-stone-700">
                          {formatCurrency(row.total[viewMode])}
                        </td>
                      </tr>
                    );
                  })}

                {/* NET CASH FLOW */}
                <tr className="bg-stone-100 border-t-2 border-stone-300">
                  <td className="py-3 px-4 font-bold text-stone-900 border-r border-stone-300">
                    순현금흐름
                  </td>
                  {pivotData.months.map((month) => {
                    const total = pivotData.monthlyTotals[month];
                    const value =
                      viewMode === 'budget'
                        ? total.netBudget
                        : viewMode === 'forecast'
                        ? total.netForecast
                        : total.netActual;
                    const isNegative = value < 0;
                    return (
                      <td
                        key={month}
                        className={`text-right py-3 px-3 font-mono font-semibold border-r border-stone-200 ${
                          isNegative ? 'text-red-700' : 'text-emerald-700'
                        }`}
                      >
                        {formatCurrency(value)}
                      </td>
                    );
                  })}
                  <td
                    className={`text-right py-3 px-4 font-mono font-bold ${
                      pivotData.months.reduce((sum, month) => {
                        const total = pivotData.monthlyTotals[month];
                        return (
                          sum +
                          (viewMode === 'budget'
                            ? total.netBudget
                            : viewMode === 'forecast'
                            ? total.netForecast
                            : total.netActual)
                        );
                      }, 0) < 0
                        ? 'text-red-900'
                        : 'text-emerald-900'
                    }`}
                  >
                    {formatCurrency(
                      pivotData.months.reduce((sum, month) => {
                        const total = pivotData.monthlyTotals[month];
                        return (
                          sum +
                          (viewMode === 'budget'
                            ? total.netBudget
                            : viewMode === 'forecast'
                            ? total.netForecast
                            : total.netActual)
                        );
                      }, 0),
                    )}
                  </td>
                </tr>

                {/* CUMULATIVE CASH FLOW */}
                <tr className="bg-stone-50 border-b border-stone-200">
                  <td className="py-3 px-4 font-bold text-stone-700 border-r border-stone-200">
                    누적 현금흐름
                  </td>
                  {(() => {
                    let cumulative = 0;
                    return pivotData.months.map((month) => {
                      const total = pivotData.monthlyTotals[month];
                      const value =
                        viewMode === 'budget'
                          ? total.netBudget
                          : viewMode === 'forecast'
                          ? total.netForecast
                          : total.netActual;
                      cumulative += value;
                      const isNegative = cumulative < 0;
                      return (
                        <td
                          key={month}
                          className={`text-right py-3 px-3 font-mono font-semibold border-r border-stone-100 ${
                            isNegative ? 'text-red-700' : 'text-blue-700'
                          }`}
                        >
                          {formatCurrency(cumulative)}
                        </td>
                      );
                    });
                  })()}
                  <td className="text-right py-3 px-4 font-mono font-bold text-stone-900">-</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Info */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4">
            <div className="text-sm text-emerald-700 mb-1">총 수입</div>
            <div className="text-2xl font-bold text-emerald-900 font-mono">
              {formatCurrency(
                inflowRows.reduce((sum, row) => sum + (row.total[viewMode] || 0), 0),
              )}
            </div>
          </div>
          <div className="bg-red-50 rounded-xl border border-red-200 p-4">
            <div className="text-sm text-red-700 mb-1">총 지출</div>
            <div className="text-2xl font-bold text-red-900 font-mono">
              {formatCurrency(
                outflowRows.reduce((sum, row) => sum + (row.total[viewMode] || 0), 0),
              )}
            </div>
          </div>
          <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
            <div className="text-sm text-blue-700 mb-1">순 현금흐름</div>
            <div className="text-2xl font-bold text-blue-900 font-mono">
              {formatCurrency(
                inflowRows.reduce((sum, row) => sum + (row.total[viewMode] || 0), 0) -
                  outflowRows.reduce((sum, row) => sum + (row.total[viewMode] || 0), 0),
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
