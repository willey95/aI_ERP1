import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { formatCurrency, formatDate } from '../lib/formatters';
import { exportToExcel } from '../lib/exportUtils';
import type { CashFlowItem } from '../types';

export default function CashFlowPage() {
  const { projectId } = useParams();
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<CashFlowItem | null>(null);
  const [filterType, setFilterType] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');

  const [formData, setFormData] = useState({
    type: 'INFLOW',
    category: '',
    description: '',
    plannedAmount: '',
    actualAmount: '',
    plannedDate: '',
    actualDate: '',
    isRecurring: false,
    recurringMonths: '',
  });

  // Fetch cash flow items
  const { data: cashFlowItems } = useQuery({
    queryKey: ['cashflow', projectId],
    queryFn: async () => {
      const response = await api.get(`/financial/cashflow/${projectId}`);
      return response.data;
    },
  });

  // Fetch cash flow summary
  const { data: summary } = useQuery({
    queryKey: ['cashflow-summary', projectId],
    queryFn: async () => {
      const response = await api.get(`/financial/cashflow/${projectId}/summary`);
      return response.data;
    },
  });

  // Create cash flow item mutation
  const createItemMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post(`/financial/cashflow/${projectId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashflow', projectId] });
      queryClient.invalidateQueries({ queryKey: ['cashflow-summary', projectId] });
      resetForm();
    },
  });

  // Update cash flow item mutation
  const updateItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await api.put(`/financial/cashflow/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashflow', projectId] });
      queryClient.invalidateQueries({ queryKey: ['cashflow-summary', projectId] });
      resetForm();
    },
  });

  const resetForm = () => {
    setFormData({
      type: 'INFLOW',
      category: '',
      description: '',
      plannedAmount: '',
      actualAmount: '',
      plannedDate: '',
      actualDate: '',
      isRecurring: false,
      recurringMonths: '',
    });
    setEditingItem(null);
    setShowForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...formData,
      plannedAmount: parseFloat(formData.plannedAmount),
      actualAmount: formData.actualAmount ? parseFloat(formData.actualAmount) : 0,
      recurringMonths: formData.recurringMonths ? parseInt(formData.recurringMonths) : null,
    };

    if (editingItem) {
      updateItemMutation.mutate({ id: editingItem.id, data: payload });
    } else {
      createItemMutation.mutate(payload);
    }
  };

  const handleEdit = (item: CashFlowItem) => {
    setEditingItem(item);
    setFormData({
      type: item.type,
      category: item.category,
      description: item.description,
      plannedAmount: item.plannedAmount.toString(),
      actualAmount: item.actualAmount?.toString() || '',
      plannedDate: new Date(item.plannedDate).toISOString().split('T')[0],
      actualDate: item.actualDate ? new Date(item.actualDate).toISOString().split('T')[0] : '',
      isRecurring: item.isRecurring,
      recurringMonths: item.recurringMonths?.toString() || '',
    });
    setShowForm(true);
  };

  const handleExport = async () => {
    if (!cashFlowItems) return;

    const exportData = cashFlowItems.map((item: CashFlowItem) => ({
      유형: item.type === 'INFLOW' ? '유입' : '유출',
      카테고리: item.category,
      설명: item.description,
      계획금액: item.plannedAmount,
      실제금액: item.actualAmount || 0,
      계획일자: formatDate(item.plannedDate),
      실제일자: item.actualDate ? formatDate(item.actualDate) : '-',
      반복: item.isRecurring ? '예' : '아니오',
      반복개월: item.recurringMonths || '-',
    }));

    await exportToExcel(exportData, `현금흐름_${projectId}.xlsx`, '현금흐름');
  };

  const filteredItems = cashFlowItems?.filter((item: CashFlowItem) => {
    if (filterType !== 'ALL' && item.type !== filterType) return false;
    if (filterCategory !== 'ALL' && item.category !== filterCategory) return false;
    return true;
  });

  const categories: Record<string, string[]> = {
    INFLOW: ['분양수입', '대출', '기타수입'],
    OUTFLOW: ['토지비', '공사비', '설계비', '인건비', '이자', '기타비용'],
  };

  const uniqueCategories: string[] = cashFlowItems
    ? Array.from(new Set(cashFlowItems.map((item: any) => item.category as string)))
    : [];

  return (
    <div className="min-h-screen bg-stone-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-stone-900 tracking-tight">현금 흐름 관리</h1>
            <p className="text-stone-600 mt-1">프로젝트의 현금 유입/유출을 관리합니다</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-white border border-stone-200 rounded-lg text-stone-700 hover:bg-stone-50 transition-colors font-medium"
            >
              Excel 내보내기
            </button>
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors font-medium"
            >
              {showForm ? '취소' : '+ 항목 추가'}
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
              <div className="text-sm text-stone-600 mb-1">계획 순현금</div>
              <div className="text-3xl font-bold text-stone-900 font-mono">
                {formatCurrency(summary.summary.planned.net)}
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                <div>
                  <div className="text-stone-500">유입</div>
                  <div className="font-mono text-emerald-700">
                    {formatCurrency(summary.summary.planned.inflow)}
                  </div>
                </div>
                <div>
                  <div className="text-stone-500">유출</div>
                  <div className="font-mono text-red-700">
                    {formatCurrency(summary.summary.planned.outflow)}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
              <div className="text-sm text-stone-600 mb-1">실제 순현금</div>
              <div className="text-3xl font-bold text-stone-900 font-mono">
                {formatCurrency(summary.summary.actual.net)}
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                <div>
                  <div className="text-stone-500">유입</div>
                  <div className="font-mono text-emerald-700">
                    {formatCurrency(summary.summary.actual.inflow)}
                  </div>
                </div>
                <div>
                  <div className="text-stone-500">유출</div>
                  <div className="font-mono text-red-700">
                    {formatCurrency(summary.summary.actual.outflow)}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
              <div className="text-sm text-stone-600 mb-1">차이 (실제 - 계획)</div>
              <div
                className={`text-3xl font-bold font-mono ${
                  summary.summary.actual.net - summary.summary.planned.net >= 0
                    ? 'text-emerald-700'
                    : 'text-red-700'
                }`}
              >
                {formatCurrency(summary.summary.actual.net - summary.summary.planned.net)}
              </div>
              <div className="text-sm text-stone-500 mt-3">
                {summary.summary.actual.net - summary.summary.planned.net >= 0
                  ? '계획보다 양호'
                  : '계획보다 부족'}
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-stone-900 mb-4">
              {editingItem ? '항목 수정' : '새 항목 추가'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    유형 *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-300"
                    required
                  >
                    <option value="INFLOW">유입</option>
                    <option value="OUTFLOW">유출</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    카테고리 *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-300"
                    required
                  >
                    <option value="">선택하세요</option>
                    {categories[formData.type].map((cat: string) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    설명 *
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-300"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    계획 금액 *
                  </label>
                  <input
                    type="number"
                    value={formData.plannedAmount}
                    onChange={(e) => setFormData({ ...formData, plannedAmount: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 font-mono focus:outline-none focus:ring-2 focus:ring-stone-300"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    실제 금액
                  </label>
                  <input
                    type="number"
                    value={formData.actualAmount}
                    onChange={(e) => setFormData({ ...formData, actualAmount: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 font-mono focus:outline-none focus:ring-2 focus:ring-stone-300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    계획 일자 *
                  </label>
                  <input
                    type="date"
                    value={formData.plannedDate}
                    onChange={(e) => setFormData({ ...formData, plannedDate: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-300"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    실제 일자
                  </label>
                  <input
                    type="date"
                    value={formData.actualDate}
                    onChange={(e) => setFormData({ ...formData, actualDate: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-300"
                  />
                </div>

                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isRecurring}
                      onChange={(e) =>
                        setFormData({ ...formData, isRecurring: e.target.checked })
                      }
                      className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-300"
                    />
                    <span className="text-sm font-medium text-stone-700">반복 항목</span>
                  </label>

                  {formData.isRecurring && (
                    <div className="flex-1">
                      <input
                        type="number"
                        value={formData.recurringMonths}
                        onChange={(e) =>
                          setFormData({ ...formData, recurringMonths: e.target.value })
                        }
                        placeholder="반복 개월수"
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 font-mono focus:outline-none focus:ring-2 focus:ring-stone-300"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={createItemMutation.isPending || updateItemMutation.isPending}
                  className="px-6 py-2.5 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {createItemMutation.isPending || updateItemMutation.isPending
                    ? '저장 중...'
                    : editingItem
                    ? '수정'
                    : '추가'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2.5 bg-white border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors font-medium"
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-stone-700">유형:</span>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-300"
              >
                <option value="ALL">전체</option>
                <option value="INFLOW">유입</option>
                <option value="OUTFLOW">유출</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-stone-700">카테고리:</span>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-300"
              >
                <option value="ALL">전체</option>
                {uniqueCategories.map((cat: string) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="ml-auto text-sm text-stone-600">
              총 {filteredItems?.length || 0}개 항목
            </div>
          </div>
        </div>

        {/* Cash Flow Items Table */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-stone-50">
                <tr className="border-b border-stone-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-stone-700">
                    유형
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-stone-700">
                    카테고리
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-stone-700">
                    설명
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-stone-700">
                    계획금액
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-stone-700">
                    실제금액
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-stone-700">
                    계획일자
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-stone-700">
                    실제일자
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-stone-700">
                    반복
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-stone-700">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredItems?.map((item: CashFlowItem) => (
                  <tr
                    key={item.id}
                    className="border-b border-stone-100 hover:bg-stone-50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.type === 'INFLOW'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {item.type === 'INFLOW' ? '유입' : '유출'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-stone-700">{item.category}</td>
                    <td className="py-3 px-4 text-stone-900">{item.description}</td>
                    <td className="py-3 px-4 text-right font-mono text-stone-700">
                      {formatCurrency(item.plannedAmount)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-stone-700">
                      {item.actualAmount ? formatCurrency(item.actualAmount) : '-'}
                    </td>
                    <td className="py-3 px-4 text-center text-sm text-stone-600">
                      {formatDate(item.plannedDate)}
                    </td>
                    <td className="py-3 px-4 text-center text-sm text-stone-600">
                      {item.actualDate ? formatDate(item.actualDate) : '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {item.isRecurring ? (
                        <span className="text-xs text-stone-600">
                          {item.recurringMonths}개월
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-stone-600 hover:text-stone-900 text-sm font-medium"
                      >
                        수정
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {(!filteredItems || filteredItems.length === 0) && (
              <div className="py-12 text-center text-stone-500">
                현금흐름 항목이 없습니다. 새 항목을 추가해보세요.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
