import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { analyticsService } from '@/services/analyticsService';
import type { ExecutionAnalysis, RiskIndicators } from '@/services/analyticsService';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function ApproverDashboardPage() {
  const { executionRequestId } = useParams<{ executionRequestId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [decision, setDecision] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  // 집행 요청 상세 분석 조회
  const { data: analysis, isLoading } = useQuery({
    queryKey: ['execution-analysis', executionRequestId],
    queryFn: () => analyticsService.analyzeExecutionRequest(executionRequestId!),
    enabled: !!executionRequestId,
  });

  // 승인 처리
  const approveMutation = useMutation({
    mutationFn: async () => {
      const approval = analysis?.approvalHistory?.find((a) => a.status === 'PENDING');
      if (!approval) throw new Error('승인 가능한 단계가 없습니다');

      const response = await api.post(`/approval/${approval.id}/approve`, {
        decision,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['execution-analysis'] });
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      alert('승인이 완료되었습니다.');
      navigate('/approvals');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || '승인에 실패했습니다.');
    },
  });

  // 반려 처리
  const rejectMutation = useMutation({
    mutationFn: async () => {
      const approval = analysis?.approvalHistory?.find((a) => a.status === 'PENDING');
      if (!approval) throw new Error('반려 가능한 단계가 없습니다');

      const response = await api.post(`/approval/${approval.id}/reject`, {
        reason: rejectReason,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['execution-analysis'] });
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      alert('반려가 완료되었습니다.');
      navigate('/approvals');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || '반려에 실패했습니다.');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">Loading analysis...</div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-red-600">분석 데이터를 불러올 수 없습니다</div>
      </div>
    );
  }

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'INFO':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'WARNING':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'CRITICAL':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">집행 요청 상세 분석</h1>
            <p className="mt-1 text-sm text-gray-600">{analysis.execution.requestNumber}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              뒤로
            </button>
          </div>
        </div>
      </div>

      {/* 집행 요청 기본 정보 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">집행 요청 정보</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-600">요청자</div>
            <div className="font-medium">{analysis.execution.requestedBy.name}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">요청 금액</div>
            <div className="font-medium text-lg text-blue-600">
              {formatCurrency(analysis.execution.amount)}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">집행 예정일</div>
            <div className="font-medium">{formatDate(analysis.execution.executionDate)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">상태</div>
            <div>
              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                {analysis.execution.status}
              </span>
            </div>
          </div>
          <div className="col-span-2">
            <div className="text-sm text-gray-600">집행 사유</div>
            <div className="font-medium">{analysis.execution.purpose}</div>
          </div>
          {analysis.execution.description && (
            <div className="col-span-2">
              <div className="text-sm text-gray-600">상세 설명</div>
              <div className="text-sm">{analysis.execution.description}</div>
            </div>
          )}
        </div>
      </div>

      {/* 예산 항목 정보 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">예산 항목 분석</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-gray-600">항목</div>
            <div className="font-medium">
              {analysis.budgetItem.mainItem} {analysis.budgetItem.subItem && `- ${analysis.budgetItem.subItem}`}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">현재 잔액</div>
            <div className="font-medium">{formatCurrency(analysis.budgetItem.remainingBudget)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">집행률</div>
            <div className="font-medium">{analysis.budgetItem.executionRate.toFixed(1)}%</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">집행 후 잔액</div>
            <div className={`font-medium ${analysis.projectedRemaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(analysis.projectedRemaining)}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">집행 후 소진율</div>
            <div className={`font-medium ${analysis.projectedExecutionRate > 90 ? 'text-red-600' : 'text-gray-900'}`}>
              {analysis.projectedExecutionRate.toFixed(1)}%
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">예산 가용성</div>
            <div>
              {analysis.budgetAvailable ? (
                <span className="text-green-600 font-semibold">✅ 충분</span>
              ) : (
                <span className="text-red-600 font-semibold">❌ 부족</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 공사비 영향 분석 */}
      {analysis.constructionImpact && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">공사비 영향 분석</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-600">총 공사비 예산</div>
              <div className="font-medium">{formatCurrency(analysis.constructionImpact.totalConstructionBudget)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">현재 잔액</div>
              <div className="font-medium">{formatCurrency(analysis.constructionImpact.totalConstructionRemaining)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">집행 후 잔액</div>
              <div className={`font-medium ${analysis.constructionImpact.damageRisk ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(analysis.constructionImpact.projectedConstructionRemaining)}
              </div>
            </div>
            <div className="col-span-3">
              <div className="text-sm text-gray-600">공사비 대비 영향률</div>
              <div className="font-medium">{analysis.constructionImpact.impactRate.toFixed(2)}%</div>
            </div>
            {analysis.constructionImpact.damageRisk && (
              <div className="col-span-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-sm font-semibold text-red-800">
                  ⚠️ 공사비 훼손 위험: 총 공사비 잔액이 5% 미만으로 감소합니다
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 예산 전용 내역 */}
      {analysis.budgetTransfers && analysis.budgetTransfers.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">예산 전용 내역</h2>
          <div className="space-y-3">
            {analysis.budgetTransfers.map((transfer: any, index: number) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">{formatCurrency(transfer.amount)}</div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    transfer.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {transfer.status}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  {transfer.sourceItem.mainItem} → {transfer.targetItem.mainItem}
                </div>
                <div className="text-sm text-gray-700 mt-1">{transfer.reason}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 시스템 추천 의견 */}
      {analysis.recommendations && analysis.recommendations.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">시스템 추천 의견</h2>
          <div className="space-y-2">
            {analysis.recommendations.map((rec, index) => (
              <div key={index} className={`p-3 border rounded-lg ${getRiskLevelColor(rec.level)}`}>
                <div className="text-sm font-medium">{rec.message}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 최근 집행 이력 */}
      {analysis.recentExecutions && analysis.recentExecutions.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">같은 항목 최근 집행 이력</h2>
          <div className="space-y-2">
            {analysis.recentExecutions.map((exec: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div>
                  <div className="font-medium">{exec.requestNumber}</div>
                  <div className="text-sm text-gray-600">{exec.purpose}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{formatCurrency(exec.amount)}</div>
                  <div className="text-sm text-gray-600">{formatDate(exec.completedAt)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 승인/반려 버튼 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">승인 처리</h2>

        {!showRejectForm ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                승인 의견 (선택)
              </label>
              <textarea
                value={decision}
                onChange={(e) => setDecision(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="승인 의견을 입력하세요"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => approveMutation.mutate()}
                disabled={approveMutation.isPending}
                className="flex-1 px-6 py-3 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {approveMutation.isPending ? '승인 처리 중...' : '✅ 승인'}
              </button>
              <button
                onClick={() => setShowRejectForm(true)}
                className="flex-1 px-6 py-3 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                ❌ 반려
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                반려 사유 *
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                rows={4}
                placeholder="반려 사유를 상세히 입력하세요"
                required
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowRejectForm(false)}
                className="flex-1 px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => {
                  if (!rejectReason.trim()) {
                    alert('반려 사유를 입력해주세요.');
                    return;
                  }
                  rejectMutation.mutate();
                }}
                disabled={rejectMutation.isPending}
                className="flex-1 px-6 py-3 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {rejectMutation.isPending ? '반려 처리 중...' : '반려 확정'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
