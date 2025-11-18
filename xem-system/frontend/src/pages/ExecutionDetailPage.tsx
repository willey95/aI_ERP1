import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function ExecutionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: execution, isLoading } = useQuery({
    queryKey: ['execution', id],
    queryFn: async () => {
      const response = await api.get(`/execution/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="eink-container flex items-center justify-center h-96">
        <div className="eink-text">로딩 중...</div>
      </div>
    );
  }

  if (!execution) {
    return (
      <div className="eink-container">
        <div className="eink-card">
          <div className="eink-card-body text-center py-12">
            <p className="eink-text-muted">집행 요청을 찾을 수 없습니다.</p>
            <button onClick={() => navigate('/executions')} className="eink-btn mt-4">
              목록으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="eink-container space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="eink-title eink-title-2xl">집행 요청 상세</h1>
            <span
              className={`eink-badge ${
                execution.status === 'APPROVED'
                  ? 'eink-badge-success'
                  : execution.status === 'PENDING'
                  ? 'eink-badge-warning'
                  : execution.status === 'REJECTED'
                  ? 'eink-badge-danger'
                  : 'eink-badge-info'
              }`}
            >
              {execution.status}
            </span>
          </div>
          <p className="eink-text-muted">요청번호: {execution.requestNumber}</p>
        </div>
        <button onClick={() => navigate('/executions')} className="eink-btn">
          ← 목록으로
        </button>
      </div>

      {/* Basic Information */}
      <div className="eink-card">
        <div className="eink-card-header">
          <h2 className="eink-title eink-title-md">기본 정보</h2>
        </div>
        <div className="eink-card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="eink-label">프로젝트</label>
              {execution.project ? (
                <Link
                  to={`/projects/${execution.project.id}`}
                  className="eink-text font-medium hover:text-blue-900 hover:underline"
                >
                  {execution.project.code} - {execution.project.name}
                </Link>
              ) : (
                <div className="eink-text">-</div>
              )}
            </div>

            <div>
              <label className="eink-label">예산 항목</label>
              <div className="eink-text font-medium">
                {execution.budgetItem?.mainItem}
                {execution.budgetItem?.subItem && (
                  <span className="eink-text-muted ml-1">- {execution.budgetItem.subItem}</span>
                )}
              </div>
            </div>

            <div>
              <label className="eink-label">집행 금액</label>
              <div className="eink-number eink-number-lg">{formatCurrency(execution.amount)}</div>
            </div>

            <div>
              <label className="eink-label">집행 예정일</label>
              <div className="eink-text">{formatDate(execution.executionDate)}</div>
            </div>

            <div>
              <label className="eink-label">요청자</label>
              <div className="eink-text">
                {execution.requestedBy?.name} ({execution.requestedBy?.email})
              </div>
            </div>

            <div>
              <label className="eink-label">요청일시</label>
              <div className="eink-text">{formatDate(execution.createdAt)}</div>
            </div>

            <div className="md:col-span-2">
              <label className="eink-label">용도</label>
              <div className="eink-text">{execution.purpose}</div>
            </div>

            {execution.description && (
              <div className="md:col-span-2">
                <label className="eink-label">상세 설명</label>
                <div className="eink-text whitespace-pre-wrap">{execution.description}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Approval Progress */}
      <div className="eink-card">
        <div className="eink-card-header">
          <h2 className="eink-title eink-title-md">승인 진행 상태</h2>
        </div>
        <div className="eink-card-body">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="eink-text-sm">
                진행 단계: {execution.currentStep} / 4
              </span>
              <span className="eink-text-sm">
                {execution.currentStep === 4 ? '100%' : `${(execution.currentStep / 4) * 100}%`}
              </span>
            </div>
            <div className="eink-progress">
              <div
                className="eink-progress-bar"
                style={{ width: `${(execution.currentStep / 4) * 100}%` }}
              />
            </div>
          </div>

          {execution.approvals && execution.approvals.length > 0 ? (
            <div className="space-y-3">
              {execution.approvals.map((approval: any) => (
                <div
                  key={approval.id}
                  className="flex items-start gap-4 p-4 border border-eink-border rounded-lg"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-eink-paper-secondary flex items-center justify-center eink-text-sm font-semibold">
                    {approval.step}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="eink-text font-medium">
                        {approval.approver?.name || '대기중'}
                      </span>
                      {approval.status && (
                        <span
                          className={`eink-badge ${
                            approval.status === 'APPROVED'
                              ? 'eink-badge-success'
                              : approval.status === 'REJECTED'
                              ? 'eink-badge-danger'
                              : 'eink-badge-warning'
                          }`}
                        >
                          {approval.status}
                        </span>
                      )}
                    </div>
                    {approval.approver && (
                      <div className="eink-text-xs text-eink-text-muted">
                        {approval.approver.email} · {approval.approver.role}
                      </div>
                    )}
                    {approval.comment && (
                      <div className="mt-2 eink-text-sm p-3 bg-eink-paper-secondary rounded">
                        {approval.comment}
                      </div>
                    )}
                    {approval.approvedAt && (
                      <div className="mt-1 eink-text-xs text-eink-text-subtle">
                        {formatDate(approval.approvedAt)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="eink-text-muted">승인 정보가 없습니다.</p>
            </div>
          )}
        </div>
      </div>

      {/* Attachments */}
      {execution.attachments && execution.attachments.length > 0 && (
        <div className="eink-card">
          <div className="eink-card-header">
            <h2 className="eink-title eink-title-md">첨부 파일</h2>
          </div>
          <div className="eink-card-body">
            <div className="space-y-2">
              {execution.attachments.map((file: string, index: number) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 border border-eink-border rounded hover:bg-eink-hover"
                >
                  <span className="eink-text">📎</span>
                  <span className="eink-text-sm">{file}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Related Links */}
      <div className="eink-card">
        <div className="eink-card-header">
          <h2 className="eink-title eink-title-md">관련 링크</h2>
        </div>
        <div className="eink-card-body">
          <div className="flex flex-wrap gap-3">
            {execution.project && (
              <Link
                to={`/projects/${execution.project.id}`}
                className="eink-btn eink-btn-sm"
              >
                프로젝트 상세 →
              </Link>
            )}
            {execution.projectId && (
              <Link
                to={`/budget?project=${execution.projectId}`}
                className="eink-btn eink-btn-sm"
              >
                예산 개요 →
              </Link>
            )}
            <Link to="/executions/history" className="eink-btn eink-btn-sm">
              집행 히스토리 →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
