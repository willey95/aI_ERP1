import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import type { Project, BudgetItem } from '@/types';

export default function BudgetManagementPage() {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);
  const [formData, setFormData] = useState({
    category: '',
    mainItem: '',
    subItem: '',
    currentBudget: '',
  });

  const queryClient = useQueryClient();

  // Fetch projects
  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await api.get('/projects');
      return response.data;
    },
  });

  // Fetch budget items
  const { data: budgetData, isLoading } = useQuery({
    queryKey: ['budget', selectedProjectId],
    queryFn: async () => {
      if (!selectedProjectId) return null;
      const response = await api.get(`/budget/project/${selectedProjectId}`);
      return response.data;
    },
    enabled: !!selectedProjectId,
  });

  // Create budget item
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/budget', {
        ...data,
        projectId: selectedProjectId,
        currentBudget: parseFloat(data.currentBudget),
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget', selectedProjectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      closeModal();
    },
  });

  // Update budget item
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await api.put(`/budget/${id}`, {
        ...data,
        currentBudget: parseFloat(data.currentBudget),
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget', selectedProjectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      closeModal();
    },
  });

  // Delete budget item
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/budget/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget', selectedProjectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
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
  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      category: '',
      mainItem: '',
      subItem: '',
      currentBudget: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: BudgetItem) => {
    setEditingItem(item);
    setFormData({
      category: item.category,
      mainItem: item.mainItem,
      subItem: item.subItem || '',
      currentBudget: item.currentBudget.toString(),
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData({
      category: '',
      mainItem: '',
      subItem: '',
      currentBudget: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this budget item?')) {
      deleteMutation.mutate(id);
    }
  };

  // Group by category
  const groupedItems = budgetItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, BudgetItem[]>);

  // Excel export handler
  const handleExport = async () => {
    if (!selectedProjectId) return;

    try {
      const response = await api.get(`/budget/excel/export/${selectedProjectId}`, {
        responseType: 'blob',
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `budget_${selectedProject?.code || selectedProjectId}_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Excel 익스포트에 실패했습니다');
    }
  };

  // Excel import handler
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedProjectId) return;

    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post(`/budget/excel/import/${selectedProjectId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        alert(`${response.data.created}개의 예산 항목이 임포트되었습니다`);
        queryClient.invalidateQueries({ queryKey: ['budget', selectedProjectId] });
        queryClient.invalidateQueries({ queryKey: ['projects'] });
      } else if (response.data.errors && response.data.errors.length > 0) {
        alert(`임포트 완료: ${response.data.created}개 생성\n\n오류:\n${response.data.errors.slice(0, 5).join('\n')}`);
        queryClient.invalidateQueries({ queryKey: ['budget', selectedProjectId] });
        queryClient.invalidateQueries({ queryKey: ['projects'] });
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Excel 임포트에 실패했습니다');
    }

    // Reset input
    event.target.value = '';
  };

  // Download template handler
  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get('/budget/excel/template', {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `budget_template_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      alert(error.response?.data?.message || '템플릿 다운로드에 실패했습니다');
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Budget Item Management</h1>
        {selectedProjectId && (
          <div className="flex gap-2">
            <button
              onClick={handleDownloadTemplate}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              📥 템플릿 다운로드
            </button>
            <label className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer">
              📂 Excel 임포트
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImport}
                className="hidden"
              />
            </label>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              📤 Excel 익스포트
            </button>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              + Add Budget Item
            </button>
          </div>
        )}
      </div>

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
          <p className="text-gray-500">Please select a project to manage budget items</p>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-lg">Loading...</div>
        </div>
      ) : (
        <>
          {/* Project Summary */}
          {selectedProject && (
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-6 mb-6 text-white">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <div className="text-sm text-blue-100">Total Budget</div>
                  <div className="text-2xl font-bold">{formatCurrency(selectedProject.currentBudget)}</div>
                </div>
                <div>
                  <div className="text-sm text-blue-100">Executed</div>
                  <div className="text-2xl font-bold">{formatCurrency(selectedProject.executedAmount)}</div>
                </div>
                <div>
                  <div className="text-sm text-blue-100">Remaining</div>
                  <div className="text-2xl font-bold">{formatCurrency(selectedProject.remainingBudget)}</div>
                </div>
                <div>
                  <div className="text-sm text-blue-100">Execution Rate</div>
                  <div className="text-2xl font-bold">{formatPercentage(selectedProject.executionRate)}</div>
                  <div className="mt-2 w-full bg-blue-500 rounded-full h-2">
                    <div
                      className="bg-white h-2 rounded-full"
                      style={{ width: `${Math.min(selectedProject.executionRate, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Budget Items Table */}
          {Object.keys(groupedItems).length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-500 mb-4">No budget items yet</p>
              <button
                onClick={openCreateModal}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create First Budget Item
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedItems).map(([category, items]) => {
                const categoryTotal = items.reduce(
                  (sum, item) => ({
                    budget: sum.budget + parseFloat(item.currentBudget),
                    executed: sum.executed + parseFloat(item.executedAmount),
                  }),
                  { budget: 0, executed: 0 }
                );
                const categoryRate = categoryTotal.budget === 0 ? 0 : (categoryTotal.executed / categoryTotal.budget) * 100;

                return (
                  <div key={category} className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-gray-900">{category}</h3>
                        <div className="flex items-center gap-6 text-sm">
                          <div>
                            <span className="text-gray-500">Budget: </span>
                            <span className="font-semibold">{formatCurrency(categoryTotal.budget)}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Executed: </span>
                            <span className="font-semibold text-blue-600">{formatCurrency(categoryTotal.executed)}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Rate: </span>
                            <span className="font-semibold">{formatPercentage(categoryRate)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Item Details
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Budget
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Executed
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Remaining
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Rate
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {items.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4">
                                <div className="text-sm font-medium text-gray-900">{item.mainItem}</div>
                                {item.subItem && <div className="text-xs text-gray-500">{item.subItem}</div>}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                                {formatCurrency(item.currentBudget)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-blue-600 font-medium">
                                {formatCurrency(item.executedAmount)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-green-600 font-medium">
                                {formatCurrency(item.remainingBudget)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    item.executionRate >= 90
                                      ? 'bg-red-100 text-red-800'
                                      : item.executionRate >= 70
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-green-100 text-green-800'
                                  }`}
                                >
                                  {formatPercentage(item.executionRate)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                  onClick={() => openEditModal(item)}
                                  className="text-blue-600 hover:text-blue-900 mr-4"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDelete(item.id)}
                                  className="text-red-600 hover:text-red-900"
                                  disabled={parseFloat(item.executedAmount) > 0}
                                  title={parseFloat(item.executedAmount) > 0 ? 'Cannot delete item with executions' : ''}
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingItem ? 'Edit Budget Item' : 'Create New Budget Item'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 건축공사"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Main Item <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.mainItem}
                    onChange={(e) => setFormData({ ...formData, mainItem: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 가설공사"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sub Item</label>
                  <input
                    type="text"
                    value={formData.subItem}
                    onChange={(e) => setFormData({ ...formData, subItem: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 가설건물"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    예산 금액 (₩) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="1000000000000"
                    step="1"
                    value={formData.currentBudget}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value && parseFloat(value) > 1000000000000) {
                        alert('예산은 1조원을 초과할 수 없습니다');
                        return;
                      }
                      setFormData({ ...formData, currentBudget: value });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예: 50000000"
                  />
                  {formData.currentBudget && (
                    <div className="mt-2 text-sm text-gray-600">
                      {formatCurrency(parseFloat(formData.currentBudget))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-4 mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? '저장 중...'
                    : editingItem
                    ? '수정'
                    : '생성'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
