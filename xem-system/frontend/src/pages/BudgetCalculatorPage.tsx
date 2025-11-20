import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { formatCurrency } from '../lib/formatters';
import type {
  BudgetFormula,
  ProjectVariable,
  CalculationHistory,
  BudgetTemplate,
  DetailedBudget,
  CalculationResult,
} from '../types';

export default function BudgetCalculatorPage() {
  const { projectId } = useParams();
  const queryClient = useQueryClient();

  const [selectedFormula, setSelectedFormula] = useState<BudgetFormula | null>(null);
  const [variables, setVariables] = useState<Record<string, string | number>>({});
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');

  // Fetch formulas
  const { data: formulas } = useQuery({
    queryKey: ['formulas'],
    queryFn: async () => {
      const response = await api.get('/budget-calculator/formulas');
      return response.data;
    },
  });

  // Fetch project variables
  const { data: projectVariables } = useQuery({
    queryKey: ['project-variables', projectId],
    queryFn: async () => {
      const response = await api.get(`/budget-calculator/variables/${projectId}`);
      return response.data;
    },
  });

  // Fetch detailed budget
  const { data: detailedBudget } = useQuery({
    queryKey: ['detailed-budget', projectId],
    queryFn: async () => {
      const response = await api.get(`/budget-calculator/project/${projectId}/detailed`);
      return response.data;
    },
  });

  // Fetch calculation history
  const { data: history } = useQuery({
    queryKey: ['calculation-history', projectId],
    queryFn: async () => {
      const response = await api.get(`/budget-calculator/history/${projectId}`);
      return response.data;
    },
  });

  // Fetch templates
  const { data: templates } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const response = await api.get('/budget-calculator/templates');
      return response.data;
    },
  });

  // Calculate mutation
  const calculateMutation = useMutation({
    mutationFn: async (data: { formulaId: string; variables: Record<string, string | number> }) => {
      const response = await api.post('/budget-calculator/calculate', data);
      return response.data;
    },
    onSuccess: (data: CalculationResult) => {
      setCalculationResult(data);
    },
  });

  // Update variables mutation
  const updateVariablesMutation = useMutation({
    mutationFn: async (data: { variables: ProjectVariable[] }) => {
      const response = await api.put(`/budget-calculator/variables/${projectId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-variables', projectId] });
    },
  });

  // Recalculate all mutation
  const recalculateMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/budget-calculator/recalculate/${projectId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['detailed-budget', projectId] });
      queryClient.invalidateQueries({ queryKey: ['calculation-history', projectId] });
    },
  });

  // Save template mutation
  const saveTemplateMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; structure: any }) => {
      const response = await api.post('/budget-calculator/templates', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setShowTemplateModal(false);
      setTemplateName('');
    },
  });

  // Apply template mutation
  const applyTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const response = await api.post(
        `/budget-calculator/templates/${templateId}/apply/${projectId}`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['detailed-budget', projectId] });
      queryClient.invalidateQueries({ queryKey: ['calculation-history', projectId] });
    },
  });

  const handleFormulaSelect = (formula: BudgetFormula) => {
    setSelectedFormula(formula);
    setCalculationResult(null);

    // Initialize variables from project variables
    const initialVars: Record<string, string | number> = {};
    formula.variables.forEach((varName: string) => {
      const projectVar = projectVariables?.find((v: ProjectVariable) => v.name === varName);
      initialVars[varName] = projectVar?.value || '';
    });
    setVariables(initialVars);
  };

  const handleCalculate = () => {
    if (!selectedFormula) return;

    calculateMutation.mutate({
      formulaId: selectedFormula.id,
      variables,
    });
  };

  const handleRecalculateAll = () => {
    if (window.confirm('프로젝트의 모든 예산 항목을 재계산하시겠습니까?')) {
      recalculateMutation.mutate();
    }
  };

  const handleSaveTemplate = () => {
    if (!detailedBudget || !templateName) return;

    saveTemplateMutation.mutate({
      name: templateName,
      description: `${projectId}에서 생성된 템플릿`,
      structure: detailedBudget.budgetItems,
    });
  };

  const handleApplyTemplate = (templateId: string) => {
    if (window.confirm('템플릿을 적용하면 기존 예산 항목이 대체됩니다. 계속하시겠습니까?')) {
      applyTemplateMutation.mutate(templateId);
    }
  };

  const handleUpdateVariable = (varName: string, value: string) => {
    const updatedVariables = projectVariables.map((v: ProjectVariable) =>
      v.name === varName ? { ...v, value: parseFloat(value) || 0 } : v
    );

    updateVariablesMutation.mutate({ variables: updatedVariables });
  };

  const filteredFormulas = formulas?.filter((f: BudgetFormula) =>
    filterCategory === 'ALL' ? true : f.category === filterCategory
  );

  const formulaCategories: string[] = formulas
    ? Array.from(new Set(formulas.map((f: any) => f.category as string)))
    : [];

  return (
    <div className="min-h-screen bg-stone-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-stone-900 tracking-tight">예산 계산기</h1>
            <p className="text-stone-600 mt-1">수식 기반 예산 계산 및 관리</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowTemplateModal(true)}
              className="px-4 py-2 bg-white border border-stone-200 rounded-lg text-stone-700 hover:bg-stone-50 transition-colors font-medium"
            >
              템플릿 저장
            </button>
            <button
              onClick={handleRecalculateAll}
              disabled={recalculateMutation.isPending}
              className="px-4 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors disabled:opacity-50 font-medium"
            >
              {recalculateMutation.isPending ? '재계산 중...' : '전체 재계산'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Formulas */}
          <div className="lg:col-span-1 space-y-4">
            {/* Formula Filter */}
            <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm">
              <label className="block text-sm font-medium text-stone-700 mb-2">
                카테고리 필터
              </label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-300"
              >
                <option value="ALL">전체</option>
                {formulaCategories.map((cat: string) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Formula List */}
            <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm">
              <h2 className="text-lg font-semibold text-stone-900 mb-3">수식 목록</h2>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {filteredFormulas?.map((formula: BudgetFormula) => (
                  <div
                    key={formula.id}
                    onClick={() => handleFormulaSelect(formula)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedFormula?.id === formula.id
                        ? 'bg-stone-900 border-stone-900 text-white'
                        : 'bg-stone-50 border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <div className="font-medium mb-1">{formula.name}</div>
                    <div
                      className={`text-xs ${
                        selectedFormula?.id === formula.id ? 'text-stone-300' : 'text-stone-500'
                      }`}
                    >
                      {formula.category}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Middle Column - Calculator */}
          <div className="lg:col-span-1 space-y-4">
            {selectedFormula ? (
              <>
                {/* Formula Details */}
                <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-stone-900 mb-2">
                    {selectedFormula.name}
                  </h2>
                  <div className="text-sm text-stone-600 mb-4">{selectedFormula.description}</div>

                  <div className="bg-stone-50 rounded-lg p-3 mb-4 border border-stone-200">
                    <div className="text-xs text-stone-600 mb-1">수식</div>
                    <code className="text-sm font-mono text-stone-900">
                      {selectedFormula.formula}
                    </code>
                  </div>

                  <div className="text-sm">
                    <div className="text-stone-600 mb-2">변수:</div>
                    <div className="flex flex-wrap gap-2">
                      {selectedFormula.variables.map((varName: string) => (
                        <span
                          key={varName}
                          className="px-2 py-1 bg-stone-100 rounded text-xs font-mono text-stone-700"
                        >
                          {varName}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Variable Input */}
                <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
                  <h3 className="text-base font-semibold text-stone-900 mb-4">변수 입력</h3>
                  <div className="space-y-3">
                    {selectedFormula.variables.map((varName: string) => {
                      const projectVar = projectVariables?.find((v: ProjectVariable) => v.name === varName);
                      return (
                        <div key={varName}>
                          <label className="block text-sm font-medium text-stone-700 mb-1">
                            {varName}
                            {projectVar?.unit && (
                              <span className="text-stone-500 ml-1">({projectVar.unit})</span>
                            )}
                          </label>
                          {projectVar?.description && (
                            <div className="text-xs text-stone-500 mb-1">
                              {projectVar.description}
                            </div>
                          )}
                          <input
                            type="number"
                            value={variables[varName] || ''}
                            onChange={(e) =>
                              setVariables({ ...variables, [varName]: e.target.value })
                            }
                            className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 font-mono focus:outline-none focus:ring-2 focus:ring-stone-300"
                            placeholder="값을 입력하세요"
                          />
                        </div>
                      );
                    })}
                  </div>

                  <button
                    onClick={handleCalculate}
                    disabled={calculateMutation.isPending}
                    className="w-full mt-4 px-4 py-2.5 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {calculateMutation.isPending ? '계산 중...' : '계산 실행'}
                  </button>
                </div>

                {/* Calculation Result */}
                {calculationResult && (
                  <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-6 shadow-sm">
                    <h3 className="text-base font-semibold text-emerald-900 mb-2">계산 결과</h3>
                    <div className="text-4xl font-bold text-emerald-900 font-mono">
                      {formatCurrency(calculationResult.result)}
                    </div>
                    <div className="text-sm text-emerald-700 mt-2">
                      수식: {calculationResult.formula}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-xl border border-stone-200 p-12 shadow-sm text-center">
                <div className="text-stone-400 mb-2">
                  <svg
                    className="w-16 h-16 mx-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div className="text-stone-600">좌측에서 수식을 선택하세요</div>
              </div>
            )}
          </div>

          {/* Right Column - Variables & History */}
          <div className="lg:col-span-1 space-y-4">
            {/* Project Variables */}
            <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-stone-900 mb-4">프로젝트 변수</h2>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {projectVariables?.map((variable: ProjectVariable) => (
                  <div key={variable.id} className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-medium text-stone-900">{variable.name}</div>
                        {variable.description && (
                          <div className="text-xs text-stone-500 mt-1">
                            {variable.description}
                          </div>
                        )}
                      </div>
                      {variable.unit && (
                        <span className="text-xs text-stone-500 ml-2">{variable.unit}</span>
                      )}
                    </div>
                    <div className="font-mono text-lg text-stone-900">
                      {parseFloat(variable.value.toString()).toLocaleString('ko-KR')}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Calculation History */}
            <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-stone-900 mb-4">계산 이력</h2>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {history?.slice(0, 10).map((item: CalculationHistory) => (
                  <div
                    key={item.id}
                    className="p-3 bg-stone-50 rounded-lg border border-stone-200"
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="text-sm font-medium text-stone-900">
                        {item.budgetItem?.name || '삭제된 항목'}
                      </div>
                      <div className="font-mono text-sm text-stone-900">
                        {formatCurrency(item.result)}
                      </div>
                    </div>
                    <div className="text-xs text-stone-500">
                      {new Date(item.calculatedAt).toLocaleString('ko-KR')}
                    </div>
                  </div>
                ))}

                {(!history || history.length === 0) && (
                  <div className="text-center text-stone-500 py-8 text-sm">
                    계산 이력이 없습니다
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Templates Section */}
        {templates && templates.length > 0 && (
          <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-stone-900 mb-4">예산 템플릿</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template: BudgetTemplate) => (
                <div
                  key={template.id}
                  className="p-4 bg-stone-50 rounded-lg border border-stone-200 hover:border-stone-300 transition-colors"
                >
                  <div className="font-semibold text-stone-900 mb-1">{template.name}</div>
                  <div className="text-sm text-stone-600 mb-3">{template.description}</div>
                  <button
                    onClick={() => handleApplyTemplate(template.id)}
                    disabled={applyTemplateMutation.isPending}
                    className="w-full px-3 py-1.5 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors disabled:opacity-50 text-sm font-medium"
                  >
                    템플릿 적용
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detailed Budget Summary */}
        {detailedBudget && (
          <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-stone-900 mb-4">상세 예산 현황</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-stone-50 rounded-lg">
                <div className="text-sm text-stone-600 mb-1">총 예산</div>
                <div className="text-2xl font-bold text-stone-900 font-mono">
                  {formatCurrency(detailedBudget.totalBudget)}
                </div>
              </div>
              <div className="p-4 bg-stone-50 rounded-lg">
                <div className="text-sm text-stone-600 mb-1">집행 금액</div>
                <div className="text-2xl font-bold text-stone-900 font-mono">
                  {formatCurrency(detailedBudget.totalSpent)}
                </div>
              </div>
              <div className="p-4 bg-stone-50 rounded-lg">
                <div className="text-sm text-stone-600 mb-1">잔여 예산</div>
                <div className="text-2xl font-bold text-emerald-700 font-mono">
                  {formatCurrency(detailedBudget.totalRemaining)}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-stone-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-stone-700">
                      항목
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-stone-700">
                      예산
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-stone-700">
                      집행
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-stone-700">
                      잔여
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-stone-700">
                      진행률
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-stone-700">
                      수식
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {detailedBudget.budgetItems?.map((item: any) => {
                    const progress = item.budgetAmount
                      ? (item.spentAmount / item.budgetAmount) * 100
                      : 0;
                    return (
                      <tr key={item.id} className="border-b border-stone-100 hover:bg-stone-50">
                        <td className="py-3 px-4 text-stone-900">{item.name}</td>
                        <td className="py-3 px-4 text-right font-mono text-stone-700">
                          {formatCurrency(item.budgetAmount)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-stone-700">
                          {formatCurrency(item.spentAmount)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-stone-700">
                          {formatCurrency(item.remainingAmount)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-stone-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  progress > 100
                                    ? 'bg-red-600'
                                    : progress > 80
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                                }`}
                                style={{ width: `${Math.min(progress, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs font-mono text-stone-600 w-12 text-right">
                              {progress.toFixed(0)}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {item.formula ? (
                            <span className="text-xs text-emerald-600 font-medium">계산됨</span>
                          ) : (
                            <span className="text-xs text-stone-400">수동</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Template Save Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-2xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-stone-900 mb-4">템플릿 저장</h3>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="템플릿 이름을 입력하세요"
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-300 mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={handleSaveTemplate}
                disabled={!templateName || saveTemplateMutation.isPending}
                className="flex-1 px-4 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors disabled:opacity-50 font-medium"
              >
                {saveTemplateMutation.isPending ? '저장 중...' : '저장'}
              </button>
              <button
                onClick={() => {
                  setShowTemplateModal(false);
                  setTemplateName('');
                }}
                className="flex-1 px-4 py-2 bg-white border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors font-medium"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
