import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { budgetTransferService } from '@/services/budgetTransferService';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Project } from '@/types';

export default function BudgetTransferPage() {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedTransfer, setSelectedTransfer] = useState<any>(null);

  const queryClient = useQueryClient();

  // Fetch projects
  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await api.get('/projects');
      return response.data;
    },
  });

  // Fetch transfers
  const { data: transfers, isLoading } = useQuery({
    queryKey: ['budget-transfers', selectedProjectId, statusFilter],
    queryFn: async () => {
      if (!selectedProjectId) return [];
      return budgetTransferService.getTransferHistory(selectedProjectId, statusFilter);
    },
    enabled: !!selectedProjectId,
  });

  // Approve/Reject mutation
  const approveMutation = useMutation({
    mutationFn: async ({ transferId, approved, reason }: { transferId: string; approved: boolean; reason?: string }) => {
      return budgetTransferService.approveTransfer(transferId, { approved, reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-transfers'] });
      queryClient.invalidateQueries({ queryKey: ['budget'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setSelectedTransfer(null);
    },
  });

  const projects: Project[] = projectsData?.projects || [];

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const getTransferTypeBadge = (type: string) => {
    return type === 'FULL'
      ? 'bg-purple-100 text-purple-800'
      : 'bg-blue-100 text-blue-800';
  };

  const handleApprove = (transferId: string) => {
    if (window.confirm('Are you sure you want to approve this transfer?')) {
      approveMutation.mutate({ transferId, approved: true });
    }
  };

  const handleReject = (transferId: string) => {
    const reason = window.prompt('Please enter rejection reason:');
    if (reason) {
      approveMutation.mutate({ transferId, approved: false, reason });
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Budget Transfer Management</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage budget transfers between items (예산 전용)
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select Project --</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.code} - {project.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transfers List */}
      {!selectedProjectId ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500">Please select a project to view transfers</p>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-lg">Loading transfers...</div>
        </div>
      ) : !transfers || transfers.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500">No transfers found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transfer Details
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transfers.map((transfer: any) => (
                  <tr key={transfer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(transfer.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          From: {transfer.sourceItem.mainItem}
                          {transfer.sourceItem.subItem && ` > ${transfer.sourceItem.subItem}`}
                        </div>
                        <div className="text-gray-500">
                          To: {transfer.targetItem.mainItem}
                          {transfer.targetItem.subItem && ` > ${transfer.targetItem.subItem}`}
                        </div>
                        {transfer.reason && (
                          <div className="text-xs text-gray-400 mt-1">
                            Reason: {transfer.reason}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                      {formatCurrency(transfer.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getTransferTypeBadge(transfer.transferType)}`}>
                        {transfer.transferType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(transfer.status)}`}>
                        {transfer.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {transfer.status === 'PENDING' ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(transfer.id)}
                            disabled={approveMutation.isPending}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(transfer.id)}
                            disabled={approveMutation.isPending}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setSelectedTransfer(transfer)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View Details
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedTransfer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Transfer Details</h2>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Transfer ID</div>
                  <div className="text-sm font-medium text-gray-900">{selectedTransfer.id}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Status</div>
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(selectedTransfer.status)}`}>
                    {selectedTransfer.status}
                  </span>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Transfer Type</div>
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getTransferTypeBadge(selectedTransfer.transferType)}`}>
                    {selectedTransfer.transferType}
                  </span>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Amount</div>
                  <div className="text-lg font-bold text-gray-900">{formatCurrency(selectedTransfer.amount)}</div>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="text-sm text-gray-500 mb-2">Source Item</div>
                <div className="text-sm font-medium text-gray-900">
                  {selectedTransfer.sourceItem.category} &gt; {selectedTransfer.sourceItem.mainItem}
                  {selectedTransfer.sourceItem.subItem && ` > ${selectedTransfer.sourceItem.subItem}`}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="text-sm text-gray-500 mb-2">Target Item</div>
                <div className="text-sm font-medium text-gray-900">
                  {selectedTransfer.targetItem.category} &gt; {selectedTransfer.targetItem.mainItem}
                  {selectedTransfer.targetItem.subItem && ` > ${selectedTransfer.targetItem.subItem}`}
                </div>
              </div>

              {selectedTransfer.reason && (
                <div className="border-t pt-4">
                  <div className="text-sm text-gray-500 mb-2">Reason</div>
                  <div className="text-sm text-gray-900">{selectedTransfer.reason}</div>
                </div>
              )}

              {selectedTransfer.approvedBy && (
                <div className="border-t pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">Approved By</div>
                      <div className="text-sm font-medium text-gray-900">
                        {selectedTransfer.approvedBy.name}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Approved At</div>
                      <div className="text-sm text-gray-900">
                        {formatDate(selectedTransfer.approvedAt)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Created By</div>
                    <div className="text-sm font-medium text-gray-900">
                      {selectedTransfer.createdBy.name}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Created At</div>
                    <div className="text-sm text-gray-900">
                      {formatDate(selectedTransfer.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setSelectedTransfer(null)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
