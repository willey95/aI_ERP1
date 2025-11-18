import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import type { Project, BudgetItem } from '@/types';
import {
  EXPENSE_BUDGET_STRUCTURE,
  getMainItems,
  getSubItems,
} from '@/constants/budgetStructure';
import ExcelImportDialog from '@/components/ExcelImportDialog';
import { useProjectStore } from '@/stores/projectStore';

export default function BudgetManagementPage() {
  const selectedProjectId = useProjectStore((state) => state.selectedProjectId);
  const setSelectedProjectId = useProjectStore((state) => state.setSelectedProjectId);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);
  const [formData, setFormData] = useState({
    category: '',
    mainItem: '',
    subItem: '',
    currentBudget: '',
  });
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isBulkEditMode, setIsBulkEditMode] = useState(false);

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
      alert('예산 항목이 추가되었습니다');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || '예산 항목 추가에 실패했습니다');
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
      alert('예산 항목이 수정되었습니다');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || '예산 항목 수정에 실패했습니다');
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
      alert('예산 항목이 삭제되었습니다');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || '예산 항목 삭제에 실패했습니다');
    },
  });

  // Bulk import mutation
  const bulkImportMutation = useMutation({
    mutationFn: async (items: any[]) => {
      const response = await api.post('/budget/bulk-import', {
        items: items.map(item => ({
          ...item,
          projectId: selectedProjectId,
        })),
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['budget', selectedProjectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsImportDialogOpen(false);
      alert(`${data.created || '여러'} 개 항목이 성공적으로 가져와졌습니다`);
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || '엑셀 가져오기에 실패했습니다');
    },
  });

  // Bulk update mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: async (updates: { id: string; data: any }[]) => {
      // Process sequentially to avoid race conditions
      const results = [];
      for (const update of updates) {
        const response = await api.put(`/budget/${update.id}`, update.data);
        results.push(response.data);
      }
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget', selectedProjectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setSelectedItems(new Set());
      setIsBulkEditMode(false);
      alert('선택한 항목이 수정되었습니다');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || '일괄 수정에 실패했습니다');
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const results = [];
      for (const id of ids) {
        await api.delete(`/budget/${id}`);
        results.push(id);
      }
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget', selectedProjectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setSelectedItems(new Set());
      setIsBulkEditMode(false);
      alert('선택한 항목이 삭제되었습니다');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || '일괄 삭제에 실패했습니다');
    },
  });

  const projects: Project[] = Array.isArray(projectsData)
    ? projectsData
    : projectsData?.projects || [];

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

  // Group budget items by structure
  const groupedByStructure = EXPENSE_BUDGET_STRUCTURE.map((category) => {
    const categoryItems = budgetItems.filter((item) => item.category === category.name);
    const total = categoryItems.reduce(
      (sum, item) => sum + parseFloat(item.currentBudget),
      0
    );
    const executed = categoryItems.reduce(
      (sum, item) => sum + parseFloat(item.executedAmount),
      0
    );

    return {
      category: category.name,
      structure: category,
      items: categoryItems,
      total,
      executed,
      remaining: total - executed,
      rate: total > 0 ? (executed / total) * 100 : 0,
    };
  }).filter((group) => group.items.length > 0 || selectedProjectId); // Show all categories when project selected

  const openCreateModal = (categoryName?: string) => {
    setEditingItem(null);
    setFormData({
      category: categoryName || '',
      mainItem: '',
      subItem: '',
      currentBudget: '',
    });
    setSelectedCategory(categoryName || '');
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
    setSelectedCategory(item.category);
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
    setSelectedCategory('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string, itemName: string) => {
    if (window.confirm(`"${itemName}" 항목을 삭제하시겠습니까?`)) {
      deleteMutation.mutate(id);
    }
  };

  // Get available main items based on selected category
  const availableMainItems = selectedCategory ? getMainItems(selectedCategory) : [];

  // Get available sub items based on selected category and main item
  const availableSubItems =
    selectedCategory && formData.mainItem
      ? getSubItems(selectedCategory, formData.mainItem)
      : [];

  // Handler for Excel import
  const handleExcelImport = async (items: any[]) => {
    await bulkImportMutation.mutateAsync(items);
  };

  // Handler for toggling item selection
  const toggleItemSelection = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  // Handler for select all
  const handleSelectAll = () => {
    if (selectedItems.size === budgetItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(budgetItems.map(item => item.id)));
    }
  };

  // Handler for bulk delete
  const handleBulkDelete = () => {
    const itemsToDelete = budgetItems.filter(item => selectedItems.has(item.id));
    const hasExecuted = itemsToDelete.some(item => parseFloat(item.executedAmount) > 0);

    if (hasExecuted) {
      alert('선택한 항목 중 집행 내역이 있어 삭제할 수 없는 항목이 있습니다');
      return;
    }

    if (window.confirm(`선택한 ${selectedItems.size}개 항목을 삭제하시겠습니까?`)) {
      bulkDeleteMutation.mutate(Array.from(selectedItems));
    }
  };

  // Handler for bulk budget increase
  const handleBulkBudgetChange = () => {
    const percentage = prompt('예산을 몇 % 변경하시겠습니까? (예: 10 입력 시 10% 증가, -10 입력 시 10% 감소)');
    if (!percentage) return;

    const percent = parseFloat(percentage);
    if (isNaN(percent)) {
      alert('올바른 숫자를 입력하세요');
      return;
    }

    const updates = Array.from(selectedItems).map(id => {
      const item = budgetItems.find(i => i.id === id);
      if (!item) return null;

      const currentBudget = parseFloat(item.currentBudget);
      const newBudget = currentBudget * (1 + percent / 100);

      return {
        id,
        data: { currentBudget: newBudget }
      };
    }).filter(Boolean) as { id: string; data: any }[];

    if (window.confirm(`선택한 ${selectedItems.size}개 항목의 예산을 ${percent}% 변경하시겠습니까?`)) {
      bulkUpdateMutation.mutate(updates);
    }
  };

  return (
    <div className="eink-container min-h-screen p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="eink-title eink-title-lg mb-2">예산 관리</h1>
        <p className="eink-text-muted">프로젝트별 예산 항목을 관리합니다</p>
      </div>

      {/* Project Selector */}
      <div className="eink-card mb-6">
        <div className="eink-card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
              <label className="eink-label">프로젝트 선택</label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="eink-input eink-select"
              >
                <option value="">프로젝트를 선택하세요</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.code} - {project.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedProjectId && (
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setIsImportDialogOpen(true)}
                  className="eink-btn"
                >
                  📥 엑셀 가져오기
                </button>
                <button onClick={() => openCreateModal()} className="eink-btn eink-btn-primary">
                  + 예산 항목 추가
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {!selectedProjectId ? (
        <div className="eink-card">
          <div className="eink-card-body text-center py-12">
            <p className="eink-text-muted">프로젝트를 선택하여 예산 항목을 확인하세요</p>
          </div>
        </div>
      ) : isLoading ? (
        <div className="eink-card">
          <div className="eink-card-body text-center py-12">
            <p className="eink-text">로딩 중...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Project Summary */}
          {selectedProject && (
            <div className="eink-card mb-6">
              <div className="eink-card-header">
                <h2 className="eink-title eink-title-sm">프로젝트 요약</h2>
              </div>
              <div className="eink-card-body">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <div className="eink-text-xs mb-1">총 예산</div>
                    <div className="eink-number eink-number-lg">
                      {formatCurrency(selectedProject.currentBudget)}
                    </div>
                  </div>
                  <div>
                    <div className="eink-text-xs mb-1">집행액</div>
                    <div className="eink-number eink-number-lg text-blue-900">
                      {formatCurrency(selectedProject.executedAmount)}
                    </div>
                  </div>
                  <div>
                    <div className="eink-text-xs mb-1">잔액</div>
                    <div className="eink-number eink-number-lg text-green-900">
                      {formatCurrency(selectedProject.remainingBudget)}
                    </div>
                  </div>
                  <div>
                    <div className="eink-text-xs mb-1">집행률</div>
                    <div className="eink-number eink-number-lg">
                      {selectedProject.executionRate.toFixed(1)}%
                    </div>
                    <div className="eink-progress mt-2">
                      <div
                        className="eink-progress-bar"
                        style={{
                          width: `${Math.min(selectedProject.executionRate, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bulk Actions Toolbar */}
          {selectedItems.size > 0 && (
            <div className="eink-card mb-4 bg-blue-50 border-blue-300">
              <div className="eink-card-body py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="eink-text font-medium text-blue-900">
                      {selectedItems.size}개 항목 선택됨
                    </span>
                    <button
                      onClick={() => setSelectedItems(new Set())}
                      className="eink-text-xs text-blue-700 hover:underline"
                    >
                      선택 해제
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleBulkBudgetChange}
                      className="eink-btn eink-btn-sm"
                      disabled={bulkUpdateMutation.isPending}
                    >
                      📊 예산 일괄 변경
                    </button>
                    <button
                      onClick={handleBulkDelete}
                      className="eink-btn eink-btn-sm text-red-700 border-red-300 hover:bg-red-50"
                      disabled={bulkDeleteMutation.isPending}
                    >
                      🗑️ 일괄 삭제
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Budget Categories */}
          {groupedByStructure.length === 0 ? (
            <div className="eink-card">
              <div className="eink-card-body text-center py-12">
                <p className="eink-text-muted mb-4">아직 예산 항목이 없습니다</p>
                <button
                  onClick={() => openCreateModal()}
                  className="eink-btn eink-btn-primary eink-btn-lg"
                >
                  첫 예산 항목 추가하기
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {groupedByStructure.map((group) => (
                <div key={group.category} className="eink-card">
                  {/* Category Header */}
                  <div className="eink-card-header">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="eink-title eink-title-sm">{group.category}</h3>
                        <p className="eink-text-xs mt-1">
                          {group.items.length}개 항목 ·{' '}
                          {group.items.reduce(
                            (sum, item) =>
                              sum +
                              (item.subItem ? 1 : 0) +
                              group.structure.items.find((si) => si.name === item.mainItem)
                                ?.subItems.length || 0,
                            0
                          )}{' '}
                          세부항목
                        </p>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="eink-text-xs">예산</div>
                          <div className="eink-number eink-number-md">
                            {formatCurrency(group.total)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="eink-text-xs">집행</div>
                          <div className="eink-number eink-number-md text-blue-900">
                            {formatCurrency(group.executed)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="eink-text-xs">집행률</div>
                          <div className="eink-number eink-number-md">
                            {group.rate.toFixed(1)}%
                          </div>
                        </div>
                        <button
                          onClick={() => openCreateModal(group.category)}
                          className="eink-btn eink-btn-sm"
                        >
                          + 추가
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Category Items */}
                  <div className="eink-card-body p-0">
                    <table className="eink-table">
                      <thead>
                        <tr>
                          <th className="w-12 eink-text-center">
                            <input
                              type="checkbox"
                              checked={group.items.length > 0 && group.items.every(item => selectedItems.has(item.id))}
                              onChange={() => {
                                const allSelected = group.items.every(item => selectedItems.has(item.id));
                                const newSelected = new Set(selectedItems);
                                group.items.forEach(item => {
                                  if (allSelected) {
                                    newSelected.delete(item.id);
                                  } else {
                                    newSelected.add(item.id);
                                  }
                                });
                                setSelectedItems(newSelected);
                              }}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                          </th>
                          <th className="w-1/3">항목</th>
                          <th className="w-1/6 eink-text-right">예산</th>
                          <th className="w-1/6 eink-text-right">집행</th>
                          <th className="w-1/6 eink-text-right">잔액</th>
                          <th className="w-1/12 eink-text-center">집행률</th>
                          <th className="w-1/12 eink-text-center">관리</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.items.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="text-center py-8">
                              <span className="eink-text-muted">항목이 없습니다</span>
                            </td>
                          </tr>
                        ) : (
                          group.items.map((item) => (
                            <tr
                              key={item.id}
                              className={selectedItems.has(item.id) ? 'bg-blue-50' : ''}
                            >
                              <td className="eink-text-center">
                                <input
                                  type="checkbox"
                                  checked={selectedItems.has(item.id)}
                                  onChange={() => toggleItemSelection(item.id)}
                                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                              </td>
                              <td>
                                <div className="flex flex-col">
                                  <span className="eink-text font-medium">{item.mainItem}</span>
                                  {item.subItem && (
                                    <span className="eink-text-xs text-gray-600">
                                      └ {item.subItem}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="eink-text-right">
                                <span className="eink-number eink-number-sm">
                                  {formatCurrency(item.currentBudget)}
                                </span>
                              </td>
                              <td className="eink-text-right">
                                <span className="eink-number eink-number-sm text-blue-900">
                                  {formatCurrency(item.executedAmount)}
                                </span>
                              </td>
                              <td className="eink-text-right">
                                <span className="eink-number eink-number-sm text-green-900">
                                  {formatCurrency(item.remainingBudget)}
                                </span>
                              </td>
                              <td className="eink-text-center">
                                <span
                                  className={`eink-badge ${
                                    item.executionRate >= 90
                                      ? 'eink-badge-danger'
                                      : item.executionRate >= 70
                                      ? 'eink-badge-warning'
                                      : 'eink-badge-success'
                                  }`}
                                >
                                  {item.executionRate.toFixed(0)}%
                                </span>
                              </td>
                              <td className="eink-text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => openEditModal(item)}
                                    className="eink-text-xs text-blue-900 hover:underline"
                                  >
                                    수정
                                  </button>
                                  <button
                                    onClick={() => handleDelete(item.id, item.mainItem)}
                                    className="eink-text-xs text-red-900 hover:underline"
                                    disabled={parseFloat(item.executedAmount) > 0}
                                    title={
                                      parseFloat(item.executedAmount) > 0
                                        ? '집행 내역이 있어 삭제할 수 없습니다'
                                        : ''
                                    }
                                  >
                                    삭제
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
          <div className="eink-card w-full max-w-2xl eink-shadow-lg">
            <div className="eink-card-header">
              <h2 className="eink-title eink-title-md">
                {editingItem ? '예산 항목 수정' : '예산 항목 추가'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="eink-card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Category */}
                <div>
                  <label className="eink-label">
                    분류 <span className="text-red-600">*</span>
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => {
                      setFormData({ ...formData, category: e.target.value, mainItem: '', subItem: '' });
                      setSelectedCategory(e.target.value);
                    }}
                    className="eink-input eink-select"
                    disabled={!!editingItem}
                  >
                    <option value="">선택하세요</option>
                    {EXPENSE_BUDGET_STRUCTURE.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Main Item */}
                <div>
                  <label className="eink-label">
                    항목 <span className="text-red-600">*</span>
                  </label>
                  <select
                    required
                    value={formData.mainItem}
                    onChange={(e) =>
                      setFormData({ ...formData, mainItem: e.target.value, subItem: '' })
                    }
                    className="eink-input eink-select"
                    disabled={!selectedCategory || !!editingItem}
                  >
                    <option value="">선택하세요</option>
                    {availableMainItems.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sub Item */}
                {availableSubItems.length > 0 && (
                  <div className="md:col-span-2">
                    <label className="eink-label">세부 항목</label>
                    <select
                      value={formData.subItem}
                      onChange={(e) => setFormData({ ...formData, subItem: e.target.value })}
                      className="eink-input eink-select"
                      disabled={!!editingItem}
                    >
                      <option value="">선택 안함</option>
                      {availableSubItems.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Budget Amount */}
                <div className="md:col-span-2">
                  <label className="eink-label">
                    예산 금액 (₩) <span className="text-red-600">*</span>
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
                    className="eink-input eink-font-mono"
                    placeholder="예: 50000000"
                  />
                  {formData.currentBudget && (
                    <div className="mt-2 eink-text-muted">
                      {formatCurrency(parseFloat(formData.currentBudget))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                <button type="button" onClick={closeModal} className="eink-btn">
                  취소
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="eink-btn eink-btn-primary"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? '저장 중...'
                    : editingItem
                    ? '수정'
                    : '추가'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Excel Import Dialog */}
      {selectedProjectId && (
        <ExcelImportDialog
          isOpen={isImportDialogOpen}
          onClose={() => setIsImportDialogOpen(false)}
          onImport={handleExcelImport}
          projectId={selectedProjectId}
        />
      )}
    </div>
  );
}
