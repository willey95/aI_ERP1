import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { analyticsService } from '@/services/analyticsService';
import { budgetTransferService } from '@/services/budgetTransferService';
import type { ProposalAssistance } from '@/services/analyticsService';
import { formatCurrency } from '@/lib/utils';

export default function ExecutionRequestCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const [selectedProject, setSelectedProject] = useState('');
  const [selectedBudgetItem, setSelectedBudgetItem] = useState('');
  const [amount, setAmount] = useState('');
  const [executionDate, setExecutionDate] = useState('');
  const [purpose, setPurpose] = useState('');
  const [description, setDescription] = useState('');

  const [showAssistance, setShowAssistance] = useState(false);
  const [assistance, setAssistance] = useState<ProposalAssistance | null>(null);
  const [selectedTransferScenario, setSelectedTransferScenario] = useState<number | null>(null);

  // Fetch projects
  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await api.get('/projects');
      return response.data;
    },
  });

  const projects = projectsData || [];

  // Fetch budget items for selected project
  const { data: budgetItemsData } = useQuery({
    queryKey: ['budget-items', selectedProject],
    queryFn: async () => {
      if (!selectedProject) return [];
      const response = await api.get(`/budget/project/${selectedProject}`);
      return response.data;
    },
    enabled: !!selectedProject,
  });

  const budgetItems = budgetItemsData?.budgetItems || [];

  // 품의 작성 지원 조회
  const checkAssistance = async () => {
    if (!selectedProject || !selectedBudgetItem || !amount) {
      alert('프로젝트, 예산 항목, 금액을 입력해주세요.');
      return;
    }

    try {
      const result = await analyticsService.getProposalAssistance(
        selectedProject,
        selectedBudgetItem,
        parseFloat(amount)
      );
      setAssistance(result);
      setShowAssistance(true);
    } catch (error) {
      console.error('Failed to get assistance:', error);
      alert('품의 작성 지원을 불러오는데 실패했습니다.');
    }
  };

  // 집행 요청 생성
  const createExecutionMutation = useMutation({
    mutationFn: async (withTransfers: boolean) => {
      // 1. 예산 전용이 필요한 경우 먼저 생성
      if (withTransfers && selectedTransferScenario !== null && assistance) {
        const scenario = assistance.transferScenarios[selectedTransferScenario];
        for (const transfer of scenario.transfers) {
          await budgetTransferService.createTransfer({
            sourceItemId: transfer.sourceItemId,
            targetItemId: selectedBudgetItem,
            amount: transfer.amount,
            transferType: transfer.transferType as 'PARTIAL' | 'FULL',
            reason: `${assistance.budgetItem.mainItem} 예산 부족으로 인한 전용`,
            description: `집행 요청 금액: ${formatCurrency(parseFloat(amount))}`,
          });
        }
      }

      // 2. 집행 요청 생성
      const response = await api.post('/execution', {
        projectId: selectedProject,
        budgetItemId: selectedBudgetItem,
        amount: parseFloat(amount),
        executionDate,
        purpose,
        description,
        attachments: [],
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['executions'] });
      alert('집행 요청이 생성되었습니다.');
      navigate('/executions');
    },
    onError: (error: any) => {
      console.error('Failed to create execution request:', error);
      alert(error.response?.data?.message || '집행 요청 생성에 실패했습니다.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProject || !selectedBudgetItem || !amount || !executionDate || !purpose) {
      alert('필수 항목을 모두 입력해주세요.');
      return;
    }

    // 예산 부족 시 전용 시나리오 선택 확인
    if (assistance && !assistance.isSufficient) {
      if (selectedTransferScenario === null) {
        alert('예산이 부족합니다. 전용 시나리오를 선택해주세요.');
        return;
      }
      createExecutionMutation.mutate(true);
    } else {
      createExecutionMutation.mutate(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">집행 요청 작성</h1>
        <p className="mt-2 text-sm text-gray-600">
          예산 전용이 필요한 경우 시스템이 자동으로 추천합니다
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 프로젝트 선택 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">기본 정보</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                프로젝트 *
              </label>
              <select
                value={selectedProject}
                onChange={(e) => {
                  setSelectedProject(e.target.value);
                  setSelectedBudgetItem('');
                  setAssistance(null);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">프로젝트 선택</option>
                {projects.map((project: any) => (
                  <option key={project.id} value={project.id}>
                    {project.code} - {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                예산 항목 *
              </label>
              <select
                value={selectedBudgetItem}
                onChange={(e) => {
                  setSelectedBudgetItem(e.target.value);
                  setAssistance(null);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={!selectedProject}
              >
                <option value="">예산 항목 선택</option>
                {budgetItems.map((item: any) => (
                  <option key={item.id} value={item.id}>
                    {item.mainItem} {item.subItem ? `- ${item.subItem}` : ''}
                    (잔액: {formatCurrency(item.remainingBudget)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                집행 금액 *
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setAssistance(null);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                집행 예정일 *
              </label>
              <input
                type="date"
                value={executionDate}
                onChange={(e) => setExecutionDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                집행 사유 *
              </label>
              <textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="집행 사유를 입력하세요"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                상세 설명
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="추가 설명 (선택)"
              />
            </div>
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={checkAssistance}
              className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
              disabled={!selectedProject || !selectedBudgetItem || !amount}
            >
              💡 예산 가용성 확인
            </button>
          </div>
        </div>

        {/* 품의 작성 지원 결과 */}
        {showAssistance && assistance && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">예산 분석</h2>

            <div className="space-y-4">
              {/* 예산 가용성 */}
              <div className={`p-4 rounded-lg ${assistance.isSufficient ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{assistance.isSufficient ? '✅' : '⚠️'}</span>
                  <h3 className="font-semibold text-gray-900">
                    {assistance.isSufficient ? '예산 충분' : '예산 부족'}
                  </h3>
                </div>
                <div className="text-sm text-gray-700 space-y-1">
                  <div>현재 잔액: {formatCurrency(assistance.budgetItem.remainingBudget)}</div>
                  <div>요청 금액: {formatCurrency(assistance.requestAmount)}</div>
                  {!assistance.isSufficient && (
                    <div className="font-semibold text-red-700">
                      부족 금액: {formatCurrency(assistance.shortage)}
                    </div>
                  )}
                </div>
              </div>

              {/* 전용 시나리오 */}
              {!assistance.isSufficient && assistance.transferScenarios.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">예산 전용 시나리오</h3>
                  <div className="space-y-3">
                    {assistance.transferScenarios.map((scenario, index) => (
                      <div
                        key={index}
                        onClick={() => setSelectedTransferScenario(index)}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedTransferScenario === index
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <input
                            type="radio"
                            checked={selectedTransferScenario === index}
                            onChange={() => setSelectedTransferScenario(index)}
                            className="w-4 h-4"
                          />
                          <span className="font-medium text-gray-900">{scenario.description}</span>
                        </div>
                        <div className="ml-6 text-sm text-gray-600 space-y-1">
                          {scenario.transfers.map((transfer, tIndex) => (
                            <div key={tIndex}>
                              • {transfer.sourceItem || '항목'}: {formatCurrency(transfer.amount)}
                              ({transfer.transferType === 'FULL' ? '전체 전용' : '일부 전용'})
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!assistance.isSufficient && assistance.transferScenarios.length === 0 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    ⚠️ 전용 가능한 예산이 부족합니다. 예산 조정이 필요합니다.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 제출 버튼 */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={createExecutionMutation.isPending}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createExecutionMutation.isPending ? '제출 중...' : '집행 요청 제출'}
          </button>
        </div>
      </form>
    </div>
  );
}
