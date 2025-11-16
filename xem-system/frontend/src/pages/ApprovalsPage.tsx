import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

interface ApprovalWithExecution {
  id: string;
  executionRequestId: string;
  step: number;
  approverRole: string;
  approverId?: string;
  status: string;
  decision?: string;
  decidedAt?: string;
  executionRequest: {
    id: string;
    requestNumber: string;
    amount: string;
    executionDate: string;
    purpose: string;
    description?: string;
    status: string;
    currentStep: number;
    project: {
      name: string;
      code: string;
    };
    budgetItem: {
      mainItem: string;
      subItem?: string;
    };
    requestedBy: {
      name: string;
      email: string;
    };
  };
}

export default function ApprovalsPage() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  // Fetch pending approvals for current user
  const { data, isLoading } = useQuery({
    queryKey: ['approvals', 'pending'],
    queryFn: async () => {
      const response = await api.get('/approval/pending');
      return response.data;
    },
  });

  const approvals: ApprovalWithExecution[] = data?.approvals || [];

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async ({ id, decision }: { id: string; decision?: string }) => {
      const response = await api.post(`/approval/${id}/approve`, { decision });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['executions'] });
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ id, decision }: { id: string; decision: string }) => {
      const response = await api.post(`/approval/${id}/reject`, { decision });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['executions'] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">Loading pending approvals...</div>
      </div>
    );
  }

  return (
    <div>
      {/* User Info */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="text-sm text-gray-600">You are logged in as:</div>
        <div className="font-semibold text-gray-900">{user?.name} ({user?.role})</div>
        <div className="text-xs text-gray-500 mt-1">
          You can approve requests that require {user?.role} approval
        </div>
      </div>

      {/* Approvals List */}
      {approvals.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500">No pending approvals</p>
          <p className="text-sm text-gray-400 mt-2">
            All execution requests requiring your approval have been processed
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {approvals.map((approval) => (
            <ApprovalCard
              key={approval.id}
              approval={approval}
              onApprove={approveMutation}
              onReject={rejectMutation}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Approval Card Component
function ApprovalCard({
  approval,
  onApprove,
  onReject,
}: {
  approval: ApprovalWithExecution;
  onApprove: any;
  onReject: any;
}) {
  const [showDecisionForm, setShowDecisionForm] = useState(false);
  const [decision, setDecision] = useState('');
  const [action, setAction] = useState<'approve' | 'reject'>('approve');

  const execution = approval.executionRequest;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (action === 'approve') {
        await onApprove.mutateAsync({ id: approval.id, decision });
      } else {
        await onReject.mutateAsync({ id: approval.id, decision });
      }
      setShowDecisionForm(false);
      setDecision('');
    } catch (error: any) {
      alert(error.response?.data?.message || `Failed to ${action} request`);
    }
  };

  const openDecisionForm = (actionType: 'approve' | 'reject') => {
    setAction(actionType);
    setShowDecisionForm(true);
    setDecision('');
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">{execution.requestNumber}</h3>
            <p className="text-sm text-blue-100 mt-1">
              Approval Step {approval.step} of 4 • {approval.approverRole} Required
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{formatCurrency(execution.amount)}</div>
            <div className="text-sm text-blue-100">Execution Amount</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Project & Budget Info */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <div className="text-sm text-gray-500 mb-1">Project</div>
            <div className="font-semibold text-gray-900">{execution.project.name}</div>
            <div className="text-xs text-gray-500">{execution.project.code}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">Budget Item</div>
            <div className="font-semibold text-gray-900">{execution.budgetItem.mainItem}</div>
            {execution.budgetItem.subItem && (
              <div className="text-xs text-gray-500">{execution.budgetItem.subItem}</div>
            )}
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">Requested By</div>
            <div className="font-semibold text-gray-900">{execution.requestedBy.name}</div>
            <div className="text-xs text-gray-500">{execution.requestedBy.email}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">Execution Date</div>
            <div className="font-semibold text-gray-900">{formatDate(execution.executionDate)}</div>
          </div>
        </div>

        {/* Purpose & Description */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="text-sm font-medium text-gray-700 mb-2">Purpose</div>
          <div className="text-gray-900">{execution.purpose}</div>
          {execution.description && (
            <>
              <div className="text-sm font-medium text-gray-700 mt-3 mb-2">Description</div>
              <div className="text-gray-600 text-sm">{execution.description}</div>
            </>
          )}
        </div>

        {/* Approval Workflow Progress */}
        <div className="mb-6">
          <div className="text-sm font-medium text-gray-700 mb-3">Approval Progress</div>
          <div className="flex items-center gap-2">
            {['STAFF', 'TEAM_LEAD', 'RM_TEAM', 'CFO'].map((role, index) => {
              const stepNumber = index + 1;
              const isCurrent = stepNumber === approval.step;
              const isPast = stepNumber < approval.step;

              return (
                <div key={role} className="flex-1">
                  <div className={`text-center p-3 rounded-lg border-2 ${
                    isCurrent ? 'border-blue-500 bg-blue-50' :
                    isPast ? 'border-green-500 bg-green-50' :
                    'border-gray-200 bg-gray-50'
                  }`}>
                    <div className={`text-xs font-medium ${
                      isCurrent ? 'text-blue-700' :
                      isPast ? 'text-green-700' :
                      'text-gray-500'
                    }`}>
                      Step {stepNumber}
                    </div>
                    <div className={`text-xs mt-1 ${
                      isCurrent ? 'text-blue-600' :
                      isPast ? 'text-green-600' :
                      'text-gray-400'
                    }`}>
                      {role.replace(/_/g, ' ')}
                    </div>
                    {isCurrent && (
                      <div className="mt-1 text-xs font-bold text-blue-700">← You are here</div>
                    )}
                    {isPast && (
                      <div className="mt-1 text-xs text-green-700">✓ Approved</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Decision Form */}
        {showDecisionForm ? (
          <form onSubmit={handleSubmit} className="mt-4 p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {action === 'approve' ? 'Approval' : 'Rejection'} Comment (Optional)
              </label>
              <textarea
                value={decision}
                onChange={(e) => setDecision(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={`Add a comment for your ${action}...`}
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDecisionForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={onApprove.isPending || onReject.isPending}
                className={`flex-1 px-4 py-2 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                  action === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {onApprove.isPending || onReject.isPending
                  ? 'Processing...'
                  : action === 'approve'
                  ? 'Confirm Approval'
                  : 'Confirm Rejection'}
              </button>
            </div>
          </form>
        ) : (
          <div className="flex gap-4">
            <button
              onClick={() => openDecisionForm('approve')}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
            >
              ✓ Approve
            </button>
            <button
              onClick={() => openDecisionForm('reject')}
              className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
            >
              ✗ Reject
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
