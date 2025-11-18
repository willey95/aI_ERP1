import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { HotTable } from '@handsontable/react';
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';
import { registerCellType, NumericCellType, TextCellType } from 'handsontable/cellTypes';
import { registerLanguageDictionary, koKR } from 'handsontable/i18n';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import type { Project, BudgetItem } from '@/types';
import { useProjectStore } from '@/stores/projectStore';

// Register cell types
registerCellType(NumericCellType);
registerCellType(TextCellType);

// Handsontable 한국어 설정
registerLanguageDictionary(koKR);

// Debounce utility
function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
}

export default function BudgetSpreadsheetPage() {
  const selectedProjectId = useProjectStore((state) => state.selectedProjectId);
  const setSelectedProjectId = useProjectStore((state) => state.setSelectedProjectId);
  const [savingCells, setSavingCells] = useState<Set<string>>(new Set());
  const [errorCells, setErrorCells] = useState<Set<string>>(new Set());
  const hotTableRef = useRef<HotTable>(null);
  const queryClient = useQueryClient();

  // Fetch all projects for the dropdown
  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await api.get('/projects');
      return response.data;
    },
  });

  // Fetch budget items for the selected project
  const { data: budgetData, isLoading } = useQuery({
    queryKey: ['budget', selectedProjectId],
    queryFn: async () => {
      if (!selectedProjectId) return null;
      const response = await api.get(`/budget/project/${selectedProjectId}`);
      return response.data;
    },
    enabled: !!selectedProjectId,
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

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  // Mutation for updating budget items
  const updateBudgetMutation = useMutation({
    mutationFn: async ({ id, currentBudget }: { id: string; currentBudget: number }) => {
      const response = await api.put(`/budget/${id}`, { currentBudget });
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch project budget data
      queryClient.invalidateQueries({ queryKey: ['budget', selectedProjectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  // Handle cell changes with debounce
  const handleCellChange = useCallback((changes: any, source: string) => {
    if (source === 'loadData' || !changes) return;

    changes.forEach(([row, prop, oldValue, newValue]: [number, string, any, any]) => {
      if (oldValue === newValue) return;
      if (prop !== 'currentBudget') return;

      const item = tableData[row];
      if (!item) return;

      const cellKey = `${item.id}-${prop}`;

      // Validate: must be a positive number
      const numValue = parseFloat(newValue);
      if (isNaN(numValue) || numValue < 0) {
        setErrorCells(prev => new Set(prev).add(cellKey));
        return;
      }

      // Clear error state
      setErrorCells(prev => {
        const next = new Set(prev);
        next.delete(cellKey);
        return next;
      });

      // Set saving state
      setSavingCells(prev => new Set(prev).add(cellKey));

      // Save to backend
      updateBudgetMutation.mutate(
        { id: item.id, currentBudget: numValue },
        {
          onSuccess: () => {
            setSavingCells(prev => {
              const next = new Set(prev);
              next.delete(cellKey);
              return next;
            });
          },
          onError: () => {
            setSavingCells(prev => {
              const next = new Set(prev);
              next.delete(cellKey);
              return next;
            });
            setErrorCells(prev => new Set(prev).add(cellKey));
          },
        }
      );
    });
  }, [updateBudgetMutation, queryClient, selectedProjectId]);

  const debouncedHandleCellChange = useDebounce(handleCellChange, 500);

  // Transform budget items to table data
  const tableData = budgetItems.map(item => ({
    id: item.id,
    category: item.category,
    mainItem: item.mainItem,
    subItem: item.subItem || '',
    initialBudget: parseFloat(item.initialBudget),
    currentBudget: parseFloat(item.currentBudget),
    executedAmount: parseFloat(item.executedAmount),
    remainingBudget: parseFloat(item.remainingBudget),
    executionRate: item.executionRate,
  }));

  // Handsontable settings
  const hotSettings: Handsontable.GridSettings = {
    data: tableData,
    colHeaders: ['카테고리', '대항목', '소항목', '초기예산', '변경예산', '집행액', '잔액', '집행률'],
    columns: [
      { data: 'category', type: 'text', readOnly: true },
      { data: 'mainItem', type: 'text', readOnly: true },
      { data: 'subItem', type: 'text', readOnly: true },
      {
        data: 'initialBudget',
        type: 'numeric',
        numericFormat: {
          pattern: '0,0',
        },
        readOnly: true
      },
      {
        data: 'currentBudget',
        type: 'numeric',
        numericFormat: {
          pattern: '0,0',
        },
        readOnly: false,  // Editable!
        className: 'htCenter htMiddle editable-cell',
        validator: function(value: any, callback: (valid: boolean) => void) {
          const numValue = parseFloat(value);
          callback(!isNaN(numValue) && numValue >= 0);
        }
      },
      {
        data: 'executedAmount',
        type: 'numeric',
        numericFormat: {
          pattern: '0,0',
        },
        readOnly: true
      },
      {
        data: 'remainingBudget',
        type: 'numeric',
        numericFormat: {
          pattern: '0,0',
        },
        readOnly: true,
        className: 'htDimmed'
      },
      {
        data: 'executionRate',
        type: 'numeric',
        numericFormat: {
          pattern: '0.00',
          culture: 'ko-KR'
        },
        readOnly: true,
        className: 'htDimmed'
      },
    ],
    rowHeaders: true,
    width: '100%',
    height: 600,
    licenseKey: 'non-commercial-and-evaluation',
    language: 'ko-KR',
    stretchH: 'all',
    autoWrapRow: true,
    autoWrapCol: true,
    manualRowResize: true,
    manualColumnResize: true,
    contextMenu: true,
    dropdownMenu: true,
    filters: true,
    columnSorting: true,
    copyPaste: true,
    undo: true,
    className: 'htCenter htMiddle',
    afterChange: debouncedHandleCellChange,
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">예산 스프레드시트</h1>
          <p className="text-sm text-slate-500 mt-1">Excel처럼 편집하세요</p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/budget"
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            ← 클래식 보기
          </Link>
          <Link
            to="/budget/manage"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            항목 관리
          </Link>
        </div>
      </div>

      {/* Project Selector */}
      <div className="mb-6 bg-white rounded-lg shadow p-6">
        <label htmlFor="project" className="block text-sm font-medium text-gray-700 mb-2">
          프로젝트 선택
        </label>
        <select
          id="project"
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- 프로젝트를 선택하세요 --</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.code} - {project.name}
            </option>
          ))}
        </select>
      </div>

      {!selectedProjectId ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">📊</div>
          <p className="text-gray-500 text-lg mb-2">프로젝트를 선택하면 스프레드시트가 표시됩니다</p>
          <p className="text-gray-400 text-sm">Excel처럼 직접 편집할 수 있습니다</p>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-lg">예산 데이터를 불러오는 중...</div>
        </div>
      ) : (
        <>
          {/* Project Summary Card */}
          {selectedProject && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="mb-4 flex items-center justify-between">
                <Link
                  to={`/projects/${selectedProject.id}`}
                  className="text-lg font-bold text-blue-900 hover:underline"
                >
                  {selectedProject.code} - {selectedProject.name} →
                </Link>
                <div className="flex gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">총 예산: </span>
                    <span className="font-semibold">{formatCurrency(selectedProject.currentBudget)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">집행액: </span>
                    <span className="font-semibold text-blue-600">{formatCurrency(selectedProject.executedAmount)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">집행률: </span>
                    <span className="font-semibold">{selectedProject.executionRate.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Spreadsheet Container */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">예산 항목 스프레드시트</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    💡 Tip: "변경예산" 열을 클릭하여 직접 편집할 수 있습니다. 변경사항은 자동 저장됩니다.
                  </p>
                  {savingCells.size > 0 && (
                    <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                      <span className="inline-block w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
                      저장 중... ({savingCells.size}개 셀)
                    </p>
                  )}
                  {errorCells.size > 0 && (
                    <p className="text-xs text-red-600 mt-1">
                      ⚠️ 오류: {errorCells.size}개 셀에 유효하지 않은 값이 있습니다.
                    </p>
                  )}
                </div>
                <div className="flex gap-2 text-xs text-slate-600">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-50 border border-green-400 rounded"></div>
                    <span>편집 가능</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded"></div>
                    <span>읽기 전용</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6">
              {budgetItems.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  이 프로젝트에 예산 항목이 없습니다
                </div>
              ) : (
                <HotTable
                  ref={hotTableRef}
                  settings={hotSettings}
                />
              )}
            </div>
          </div>

          {/* Keyboard Shortcuts Help */}
          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-green-900 mb-2">⌨️ 키보드 단축키</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-green-800">
              <div><kbd className="px-2 py-1 bg-white rounded border border-green-300">Tab</kbd> 다음 셀</div>
              <div><kbd className="px-2 py-1 bg-white rounded border border-green-300">Enter</kbd> 아래 셀</div>
              <div><kbd className="px-2 py-1 bg-white rounded border border-green-300">Ctrl+C</kbd> 복사</div>
              <div><kbd className="px-2 py-1 bg-white rounded border border-green-300">Ctrl+V</kbd> 붙여넣기</div>
              <div><kbd className="px-2 py-1 bg-white rounded border border-green-300">Ctrl+Z</kbd> 실행 취소</div>
              <div><kbd className="px-2 py-1 bg-white rounded border border-green-300">Ctrl+Y</kbd> 다시 실행</div>
              <div><kbd className="px-2 py-1 bg-white rounded border border-green-300">F2</kbd> 편집 모드</div>
              <div><kbd className="px-2 py-1 bg-white rounded border border-green-300">Esc</kbd> 취소</div>
            </div>
            <p className="mt-3 text-xs text-green-700">
              💡 변경예산 열을 더블클릭하거나 F2를 눌러 편집을 시작하세요. 변경사항은 입력 후 500ms 뒤 자동으로 저장됩니다.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
